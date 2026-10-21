import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccessService, Actor } from '../auth/access.service';
@Injectable()
export class RecommendationService {
  constructor(
    private readonly db: DataSource,
    private readonly access: AccessService,
  ) {}
  private async worker(path: string, body?: unknown) {
    let response: Response;
    try {
      response = await fetch(
        `${process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001'}${path}`,
        {
          method: body ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-ML-Token':
              process.env.ML_INTERNAL_TOKEN || 'local-vedu-ml-change-me',
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
          signal: AbortSignal.timeout(60000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'ML worker chưa chạy. Khởi động dịch vụ ml hoặc python ml-core/server.py.',
      );
    }
    const result = (await response.json()) as any;
    if (!response.ok)
      throw new BadRequestException(result.message || 'ML worker lỗi');
    return result;
  }
  async train(actor: Actor, data: any) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    if (
      !['kaggle_logs', 'kaggle_recommender', 'vedu_real'].includes(data.dataset)
    )
      throw new BadRequestException('Dataset không hợp lệ');
    const cfg = data.config ?? {};
    if (
      (cfg.min_support !== undefined &&
        (Number(cfg.min_support) <= 0 || Number(cfg.min_support) > 1)) ||
      (cfg.utility_ratio !== undefined &&
        (Number(cfg.utility_ratio) <= 0 || Number(cfg.utility_ratio) > 1)) ||
      (cfg.max_length !== undefined &&
        (!Number.isInteger(Number(cfg.max_length)) ||
          Number(cfg.max_length) < 2 ||
          Number(cfg.max_length) > 4))
    )
      throw new BadRequestException(
        'min_support/utility_ratio (0,1], max_length 2-4',
      );
    let rows: unknown;
    if (data.dataset === 'vedu_real')
      rows = await this.db
        .query(`SELECT student_id::text AS "user",lesson_id::text AS item,occurred_at AS time,
       1+LEAST(COALESCE((metadata->>'verifiedActualSeconds')::numeric,0),3600)/600 AS utility
       FROM learning.learning_sequence_logs l JOIN auth.users u ON u.user_id=l.student_id WHERE data_source='REAL' AND NOT u.is_test_account AND u.username NOT LIKE 'guest_%' AND lesson_id IS NOT NULL AND (metadata->>'serverClock'='true' OR metadata->>'manualDocumentComplete'='true') AND action IN ('VIEW_LESSON','COMPLETE_LESSON','REVIEW_LESSON') ORDER BY occurred_at,log_id LIMIT 100000`);
    const job = await this.worker('/train', {
      dataset: data.dataset,
      config: cfg,
      rows,
    });
    await this.db.query(
      "INSERT INTO learning.experiments(experiment_id,dataset,status,created_by) VALUES($1,$2,'RUNNING',$3)",
      [job.jobId, data.dataset, actor.userId],
    );
    return job;
  }
  async experiments(actor: Actor) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    return this.db.query(
      'SELECT * FROM learning.experiments ORDER BY created_at DESC LIMIT 30',
    );
  }
  async replay(actor: Actor,id:string) {
    if(actor.role!=='ADMIN' || !/^[a-f0-9-]{36}$/i.test(id)) throw new ForbiddenException();
    const [job]=await this.db.query("SELECT dataset FROM learning.experiments WHERE experiment_id=$1 AND status='SUCCEEDED'",[id]);
    if(!job || !['kaggle_logs','kaggle_recommender'].includes(job.dataset)) throw new BadRequestException('Chọn experiment Kaggle đã huấn luyện thành công.');
    return this.worker('/replay',{jobId:id});
  }
  async job(actor: Actor, id: string) {
    if (actor.role !== 'ADMIN' || !/^[a-f0-9-]{36}$/i.test(id))
      throw new ForbiddenException();
    const [experiment] = await this.db.query(
      'SELECT * FROM learning.experiments WHERE experiment_id=$1',
      [id],
    );
    if (!experiment) throw new BadRequestException('Experiment không tồn tại');
    const result = await this.worker(`/jobs/${id}`);
    if (result.status === 'SUCCEEDED' && experiment.status !== 'SUCCEEDED')
      await this.persist(id, result.report);
    if (result.status === 'FAILED')
      await this.db.query(
        "UPDATE learning.experiments SET status='FAILED',manifest=$2 WHERE experiment_id=$1",
        [id, JSON.stringify({ error: result.error })],
      );
    return result.status === 'SUCCEEDED'
      ? {
          jobId: id,
          status: result.status,
          report: {
            ...result.report,
            patterns: result.report.patterns.slice(0, 100),
          },
        }
      : result;
  }
  private async persist(id: string, r: any) {
    await this.db.transaction(async (m) => {
      const [e] = await m.query(
        'SELECT * FROM learning.experiments WHERE experiment_id=$1 FOR UPDATE',
        [id],
      );
      if (e.status === 'SUCCEEDED') return;
      await m.query(
        "UPDATE learning.experiments SET status='SUCCEEDED',manifest=$2,metrics=$3 WHERE experiment_id=$1",
        [
          id,
          JSON.stringify({
            ...r.manifest,
            artifactSha256: r.artifact_sha256,
            mining: r.mining,
          }),
          JSON.stringify(r.metrics),
        ],
      );
      // Research models are never activated on unrelated local lesson IDs.
      for (const [name, type, key] of [
        ['BPR-MF', 'COLLABORATIVE_FILTERING', 'BPR-MF'],
        ['GRU-next-item', 'OTHER', 'GRU-next-item'],
      ]) {
        const active = e.dataset === 'vedu_real';
        if (active)
          await m.query(
            'UPDATE learning.model_registry SET is_active=false WHERE model_type=$1',
            [type],
          );
        await m.query(
          `INSERT INTO learning.model_registry(model_name,model_type,model_version,dataset_version,artifact_uri,parameters,metrics,trained_at,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,now(),$8)`,
          [
            name,
            type,
            id,
            e.dataset,
            `ml://${id}/models.pt`,
            JSON.stringify({
              manifest: r.manifest,
              modelSha256: r.artifact_sha256,
            }),
            JSON.stringify(r.metrics[key]),
            active,
          ],
        );
      }
      const [run] = await m.query(
        `INSERT INTO learning.mining_runs(algorithm_name,algorithm_version,dataset_version,code_version,min_support,min_utility,utility_definition,parameters,metrics,sequence_count,event_count,pattern_count,runtime_ms,status,started_at,finished_at)
       VALUES('VEDU-PrefixProjection-HUSPM','1.0',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SUCCEEDED',now(),now()) RETURNING mining_run_id`,
        [
          e.dataset,
          r.manifest.version,
          r.manifest.config.min_support ?? 0.02,
          r.mining.min_utility,
          JSON.stringify({
            formula: r.manifest.utility_formula,
            embedding: 'maximum per sequence',
          }),
          JSON.stringify({
            experimentId: id,
            maxLength: r.mining.exact_within_max_length,
          }),
          JSON.stringify(r.metrics['HUSPM-only']),
          r.mining.sequence_count,
          r.manifest.train_rows,
          r.patterns.length,
          Math.round(
            (r.mining.runtime_seconds ?? r.manifest.runtime_seconds) * 1000,
          ),
        ],
      );
      if (e.dataset === 'vedu_real')
        for (const pattern of r.patterns) {
          const ids = pattern.items.map((index: number) =>
            Number(r.items[index]),
          );
          const lessons: any[] = await m.query(
            'SELECT lesson_id,course_id FROM lms.lessons WHERE lesson_id=ANY($1::bigint[])',
            [ids],
          );
          if (
            !lessons.length ||
            new Set(lessons.map((l) => l.course_id)).size !== 1
          )
            continue;
          const courseId = lessons[0].course_id;
          const [p] = await m.query(
            `INSERT INTO learning.high_utility_patterns(mining_run_id,course_id,pattern_signature,support_count,support,pattern_utility,utility_ratio,pattern_length,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING pattern_id`,
            [
              run.mining_run_id,
              courseId,
              ids.join('>'),
              pattern.support_count,
              pattern.support,
              pattern.utility,
              pattern.utility_ratio,
              ids.length,
            ],
          );
          for (const [i, lessonId] of ids.entries())
            await m.query(
              "INSERT INTO learning.pattern_steps(pattern_id,course_id,step_order,lesson_id,action,utility_contribution) VALUES($1,$2,$3,$4,'VIEW_LESSON',NULL)",
              [p.pattern_id, courseId, i + 1, lessonId],
            );
        }
    });
  }
  async mapping(actor: Actor, data: any) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    if (
      !['kaggle_logs', 'kaggle_recommender'].includes(data.dataset) ||
      !data.externalItemId?.trim() ||
      data.externalItemId.length > 200
    )
      throw new BadRequestException('Mapping không hợp lệ');
    const [l] = await this.db.query(
      'SELECT 1 FROM lms.lessons WHERE lesson_id=$1 AND NOT is_deleted',
      [data.lessonId],
    );
    if (!l) throw new BadRequestException('Bài học không tồn tại');
    await this.db.query(
      `INSERT INTO learning.dataset_mappings(dataset,external_item_id,lesson_id,approved_by) VALUES($1,$2,$3,$4) ON CONFLICT(dataset,lesson_id) DO UPDATE SET external_item_id=EXCLUDED.external_item_id,approved_by=EXCLUDED.approved_by,approved_at=now()`,
      [data.dataset, data.externalItemId, data.lessonId, actor.userId],
    );
    return { message: 'Đã lưu mapping nội dung do admin xác nhận' };
  }
  async recommend(actor: Actor, courseId: number) {
    if (actor.role !== 'STUDENT') throw new ForbiddenException();
    await this.access.study(actor, courseId);
    const lessons: any[] = await this.db.query(
      `SELECT l.lesson_id,l.title,l.lesson_order FROM lms.lessons l WHERE l.course_id=$1 AND l.is_published AND NOT l.is_deleted AND NOT EXISTS(SELECT 1 FROM learning.lesson_progress p WHERE p.lesson_id=l.lesson_id AND p.student_id=$2 AND p.status='COMPLETED') ORDER BY lesson_order`,
      [courseId, actor.userId],
    );
    const history: any[] = await this.db.query(
      `SELECT lesson_id::text item FROM learning.learning_sequence_logs WHERE student_id=$1 AND course_id=$2 AND data_source='REAL' AND lesson_id IS NOT NULL ORDER BY occurred_at,log_id`,
      [actor.userId, courseId],
    );
    const [experiment] = await this.db.query(
      `SELECT e.* FROM learning.experiments e WHERE status='SUCCEEDED' AND (dataset='vedu_real' OR EXISTS(SELECT 1 FROM learning.dataset_mappings d JOIN lms.lessons l USING(lesson_id) WHERE d.dataset=e.dataset AND l.course_id=$1)) ORDER BY (dataset='vedu_real') DESC,created_at DESC LIMIT 1`,
      [courseId],
    );
    let scores: any[] = [],
      modelId: any = null,
      reason =
        'Chưa có mô hình hoặc lịch sử phù hợp: gợi ý theo thứ tự chương trình học.',
      source = 'FALLBACK';
    if (experiment && history.length) {
      const maps: any[] =
        experiment.dataset === 'vedu_real'
          ? lessons.map((l) => ({
              lesson_id: l.lesson_id,
              external_item_id: String(l.lesson_id),
            }))
          : await this.db.query(
              'SELECT * FROM learning.dataset_mappings WHERE dataset=$1',
              [experiment.dataset],
            );
      const h =
        experiment.dataset === 'vedu_real'
          ? history.map((x) => x.item)
          : history
              .map(
                (x) =>
                  maps.find((m) => String(m.lesson_id) === x.item)
                    ?.external_item_id,
              )
              .filter(Boolean);
      const result = await this.worker('/predict', {
        jobId: experiment.experiment_id,
        history: h,
        user:
          experiment.dataset === 'vedu_real' ? String(actor.userId) : undefined,
      });
      if (result.scores.length) {
        scores = lessons
          .map((l) => {
            const external = maps.find(
              (m) => String(m.lesson_id) === String(l.lesson_id),
            )?.external_item_id;
            const score = result.scores.find((s: any) => s.item === external);
            return { ...l, ...score };
          })
          .filter((s) => s.score !== undefined)
          .sort((a, b) => b.score - a.score);
        const [model] = await this.db.query(
          "SELECT model_id FROM learning.model_registry WHERE model_version=$1 AND model_name='GRU-next-item'",
          [experiment.experiment_id],
        );
        modelId = model?.model_id;
        if (modelId && scores.length) {
          source = 'MODEL';
          reason = `BPR + GRU + HUSPM (${experiment.dataset}); ${experiment.dataset === 'vedu_real' ? 'log VEDU thật' : 'chuyển miền qua mapping đã duyệt; cần đánh giá lại trên VEDU'}. Mô hình không đảm bảo cải thiện kết quả học tập.`;
        }
      }
    }
    if (!modelId || !scores.length)
      scores = lessons.map((l, i) => ({ ...l, score: 1 / (i + 1) }));
    const selected = scores.slice(0, 5);
    return this.db.transaction(async (m) => {
      await m.query(
        "UPDATE learning.learning_path_recommendations SET status='REPLACED' WHERE student_id=$1 AND course_id=$2 AND status IN ('ACTIVE','SHOWN')",
        [actor.userId, courseId],
      );
      const recommendations = [];
      for (const [i, s] of selected.entries()) {
        const [r] = await m.query(
          `INSERT INTO learning.learning_path_recommendations(student_id,course_id,recommended_lesson_id,source_type,model_id,recommendation_score,reason,recommendation_order,status,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',now()+interval '86400 seconds') RETURNING *`,
          [
            actor.userId,
            courseId,
            s.lesson_id,
            source,
            source === 'MODEL' ? modelId : null,
            Math.min(1, Math.max(0, s.score)),
            reason,
            i + 1,
          ],
        );
        recommendations.push({
          ...r,
          title: s.title,
          components: { bpr: s.bpr, gru: s.gru, huspm: s.huspm },
        });
      }
      return {
        recommendations,
        source,
        experimentId: experiment?.experiment_id ?? null,
        reason,
        ranking: scores.map((s) => ({
          lessonId: Number(s.lesson_id), score: Number(s.score),
          components: { bpr: s.bpr, gru: s.gru, huspm: s.huspm },
        })),
      };
    });
  }
}
