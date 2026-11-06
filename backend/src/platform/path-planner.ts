// Curriculum constraints are authoritative. Model scores only rank eligible frontier nodes.
import { weeklySchedule } from './path-schedule';
export type Preferences = {
  goal: 'FOUNDATION' | 'PRACTICAL' | 'CAREER' | 'CERTIFICATION';
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  occupation: 'STUDENT' | 'OFFICE' | 'SALES' | 'TEACHER';
  weeklySeconds: number;
  horizonWeeks: number;
  count: number;
  format: 'MIXED' | 'READING' | 'VIDEO';
};
export type PathLesson = {
  id: number;
  title: string;
  order: number;
  seconds: number;
  measuredVideo: boolean;
  difficulty: number;
  kind: string;
  core: boolean;
  prerequisites: number[];
  outcomes: string[];
  skills: string[];
  goals: string[];
  sources: unknown[];
  completed: boolean;
  gaps?: { skill: string; score: number; evidenceCount: number }[];
  modelScore?: number;
  components?: { bpr?: number; gru?: number; huspm?: number };
};
export const GOALS = {
  FOUNDATION: 'Nắm nền tảng',
  PRACTICAL: 'Ứng dụng ngay',
  CAREER: 'Phục vụ công việc',
  CERTIFICATION: 'Hoàn thành khóa và chứng nhận',
};
export const OCCUPATIONS = {
  STUDENT: 'Học tập/báo cáo',
  OFFICE: 'Hành chính văn phòng',
  SALES: 'Bán hàng/vận hành',
  TEACHER: 'Giảng dạy/thuyết trình',
};
export function planOptions(
  lessons: PathLesson[],
  p: Preferences,
  modelAvailable: boolean,
) {
  const completed = new Set(
    lessons.filter((l) => l.completed && !l.gaps?.length).map((l) => l.id),
  );
  const remaining = lessons.filter((l) => !completed.has(l.id));
  const byId = new Map(lessons.map((l) => [l.id, l]));
  // Reject cycles and missing prerequisites instead of silently producing invalid curricula.
  const visiting = new Set<number>(),
    visited = new Set<number>();
  const check = (id: number) => {
    if (visiting.has(id))
      throw new Error(
        'Đồ thị tiên quyết có vòng lặp; cần giảng viên sửa học liệu.',
      );
    if (visited.has(id)) return;
    const l = byId.get(id);
    if (!l)
      throw new Error(
        'Một bài tiên quyết chưa công bố hoặc đã bị xóa; cần giảng viên sửa học liệu.',
      );
    visiting.add(id);
    l.prerequisites.forEach(check);
    visiting.delete(id);
    visited.add(id);
  };
  lessons.forEach((l) => check(l.id));
  const level = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 }[p.level];
  const variants = [
    {
      id: 'foundation',
      title: 'Nền tảng vững',
      focus: 'Củng cố khái niệm và tự kiểm tra trước khi tăng độ khó.',
      kinds: ['CONCEPT', 'REVIEW'],
      weight: 0.15,
      review: 0.25,
      practice: 0.1,
    },
    {
      id: 'balanced',
      title: 'Học cân bằng',
      focus: 'Kết hợp kiến thức, thực hành và sản phẩm đầu ra.',
      kinds: ['CONCEPT', 'PRACTICE', 'PROJECT'],
      weight: 0.35,
      review: 0.1,
      practice: 0.2,
    },
    {
      id: 'fast',
      title: 'Ứng dụng nhanh',
      focus:
        'Tập trung các bước thiết yếu để ứng dụng; không thay thế học đủ khóa.',
      kinds: ['PROJECT'],
      weight: 0.25,
      review: 0,
      practice: 0.05,
    },
    {
      id: 'deep',
      title: 'Mở rộng chuyên sâu',
      focus: 'Thêm video, ôn tập và bài nâng cao; cần quỹ thời gian lớn hơn.',
      kinds: ['CONCEPT', 'PRACTICE', 'PROJECT', 'REVIEW', 'VIDEO'],
      weight: 0.5,
      review: 0.3,
      practice: 0.3,
    },
  ];
  // Goal changes presentation priority; it never changes the assessment/completion requirements.
  const preferred = {
    FOUNDATION: 'foundation',
    PRACTICAL: 'fast',
    CAREER: 'balanced',
    CERTIFICATION: 'deep',
  }[p.goal];
  variants.sort(
    (a, b) => Number(b.id === preferred) - Number(a.id === preferred),
  );
  const seen = new Set<string>();
  const plans = variants
    .flatMap((v) => {
      const selected = new Set<number>();
      const add = (id: number) => {
        if (completed.has(id) || selected.has(id)) return;
        const l = byId.get(id)!;
        l.prerequisites.forEach(add);
        selected.add(id);
      };
      for (const l of remaining) {
        const kindMatch = v.kinds.includes(l.kind);
        if (
          l.core || l.gaps?.length ||
          (kindMatch &&
            (v.id === 'deep' ||
              l.difficulty <=
                Math.min(3, level + (v.id === 'balanced' ? 1 : 0))))
        )
          add(l.id);
        if (
          v.id === 'balanced' &&
          l.goals.includes(p.occupation) &&
          l.difficulty <= level + 1
        )
          add(l.id);
        if (p.format === 'VIDEO' && v.id !== 'fast' && l.kind === 'VIDEO')
          add(l.id);
      }
      if (!selected.size) return [];
      const ordered: PathLesson[] = [],
        satisfied = new Set(completed);
      while (selected.size) {
        const frontier = remaining.filter(
          (l) =>
            selected.has(l.id) &&
            l.prerequisites.every((id) => satisfied.has(id)),
        );
        const priority = (l: PathLesson) =>
          2 * Math.max(0, ...(l.gaps ?? []).map((gap) => 0.7 - gap.score)) +
          (modelAvailable ? v.weight * (l.modelScore ?? 0) : 0) +
          (l.goals.includes(p.occupation) ? 0.3 : 0) +
          (l.difficulty === level ? 0.15 : 0) +
          (p.format === 'READING' && l.kind !== 'VIDEO' ? 0.1 : 0) +
          (p.format === 'VIDEO' && l.kind === 'VIDEO' ? 0.1 : 0);
        frontier.sort(
          (a, b) =>
            priority(b) - priority(a) || a.order - b.order || a.id - b.id,
        );
        const next = frontier[0];
        if (!next) throw new Error('Không thể sắp xếp bài theo tiên quyết.');
        ordered.push(next);
        selected.delete(next.id);
        satisfied.add(next.id);
      }
      const activities = ordered.flatMap((l) => [
        {
          lessonId: l.id,
          title: l.title,
          activity: l.gaps?.length ? 'REVIEW' : 'LEARN',
          estimatedSeconds: Math.max(1, l.seconds),
        },
        ...(ordered.length >= 3 && v.review > 0
          ? [
              {
                lessonId: l.id,
                title: l.title,
                activity: 'REVIEW',
                estimatedSeconds: Math.ceil(l.seconds * v.review),
              },
            ]
          : []),
        ...(ordered.length >= 3 &&
        v.practice > 0 &&
        !['PRACTICE', 'PROJECT'].includes(l.kind)
          ? [
              {
                lessonId: l.id,
                title: l.title,
                activity: 'PRACTICE',
                estimatedSeconds: Math.ceil(l.seconds * v.practice),
              },
            ]
          : []),
      ]);
      const contentSignature = ordered.map((l) => l.id).join(',');
      const signature =
        contentSignature +
        '|' +
        activities.map((a) => `${a.activity}:${a.estimatedSeconds}`).join(',');
      if (seen.has(signature)) return [];
      seen.add(signature);
      const seconds = activities.reduce((s, a) => s + a.estimatedSeconds, 0);
      const minutes = (value: number) =>
        `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 60)} phút`;
      const budget = p.weeklySeconds * p.horizonWeeks;
      return [
        {
          id: v.id,
          title: v.title,
          focus: v.focus,
          contentSignature,
          activities,
          schedule: weeklySchedule(activities, p.weeklySeconds, p.horizonWeeks),
          contentSeconds: ordered.reduce((s, l) => s + l.seconds, 0),
          reviewSeconds: activities
            .filter((a) => a.activity === 'REVIEW')
            .reduce((s, a) => s + a.estimatedSeconds, 0),
          practiceSeconds: activities
            .filter((a) => a.activity === 'PRACTICE')
            .reduce((s, a) => s + a.estimatedSeconds, 0),
          estimatedSeconds: seconds,
          estimatedWeeks: Math.ceil(seconds / p.weeklySeconds),
          fitsBudget: seconds <= budget,
          coversWholeCourse: ordered.length === remaining.length,
          omittedLessonCount: remaining.length - ordered.length,
          explanation: [
            `Mục tiêu: ${GOALS[p.goal]}; ngữ cảnh: ${OCCUPATIONS[p.occupation]}. Trình độ là tự khai, chưa phải kết quả kiểm tra đầu vào.`,
            `${ordered.length} bài còn lại, khoảng ${minutes(seconds)} gồm học, ôn và luyện tập. ${seconds <= budget ? 'Nằm trong' : 'Vượt'} quỹ ${minutes(budget)}; không cắt bỏ bài tiên quyết để ép vừa thời gian.`,
            'Phần ôn và luyện tập là thời gian tự học dự kiến, không phải thời lượng video hay thời gian đã học được ghi nhận.',
            ...(ordered.some((l) => l.difficulty > level)
              ? [
                  'Có bài vượt trình độ tự khai. Cân nhắc học nền tảng/nhờ giảng viên hỗ trợ trước khi chọn phương án này.',
                ]
              : []),
            modelAvailable
              ? 'Có điểm BPR/GRU/HUSPM cho các bài đã mapping; dùng để xếp bài đủ điều kiện, không ghi đè quan hệ tiên quyết. Bài không có điểm dùng tiêu chí học thuật.'
              : 'Chưa có điểm mô hình phù hợp; phương án dựa trên chương trình, mục tiêu và tiên quyết (CURRICULUM), không giả nhận kết quả AI.',
            'Lộ trình dự kiến giúp củng cố các kỹ năng còn yếu. Chứng nhận yêu cầu đạt mô-đun bắt buộc và đánh giá cuối khóa.',
          ],
          steps: ordered.map((l, i) => ({
            lessonId: l.id,
            title: l.title,
            order: i + 1,
            estimatedSeconds: l.seconds,
            durationBasis: l.measuredVideo
              ? 'VIDEO_MEASURED'
              : 'STUDY_ESTIMATE',
            kind: l.kind,
            difficulty: l.difficulty,
            prerequisites: l.prerequisites,
            outcomes: l.outcomes,
            sources: l.sources,
            score: l.modelScore ?? null,
            components: l.components ?? null,
            reasons: [
              ...(l.gaps ?? []).map((gap) => `Cần ôn ${gap.skill}: ${Math.round(gap.score * 100)}% từ ${gap.evidenceCount} minh chứng, dưới mục tiêu gợi ý 70%.`),
              l.core
                ? 'Nội dung nền bắt buộc của chương trình.'
                : `Bổ sung cho hướng ${v.title.toLowerCase()}.`,
              l.prerequisites.length
                ? `Đặt sau bài tiên quyết ${l.prerequisites.join(', ')}.`
                : 'Không yêu cầu bài tiên quyết trong khóa.',
              ...(l.goals.includes(p.occupation)
                ? [`Phù hợp ngữ cảnh ${OCCUPATIONS[p.occupation]}.`]
                : []),
              ...(modelAvailable && l.modelScore !== undefined
                ? [
                    `Điểm xếp hạng mô hình ${l.modelScore.toFixed(3)} (không phải xác suất thành công).`,
                  ]
                : []),
            ],
          })),
        },
      ];
    })
    .slice(0, p.count);
  const recommended = plans.find((plan) => plan.fitsBudget) ?? plans[0];
  return plans.map((plan) => ({
    ...plan,
    recommended: plan.id === recommended?.id,
    differenceBasis: plans.some(
      (other) =>
        other.id !== plan.id &&
        other.contentSignature === plan.contentSignature,
    )
      ? 'STUDY_PACE'
      : 'CONTENT_AND_ORDER',
  }));
}
