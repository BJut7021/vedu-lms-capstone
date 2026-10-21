// Curriculum constraints are authoritative. Model scores only rank eligible frontier nodes.
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
    lessons.filter((l) => l.completed).map((l) => l.id),
  );
  const remaining = lessons.filter((l) => !l.completed);
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
    },
    {
      id: 'balanced',
      title: 'Học cân bằng',
      focus: 'Kết hợp kiến thức, thực hành và sản phẩm đầu ra.',
      kinds: ['CONCEPT', 'PRACTICE', 'PROJECT'],
      weight: 0.35,
    },
    {
      id: 'fast',
      title: 'Ứng dụng nhanh',
      focus:
        'Tập trung các bước thiết yếu để ứng dụng; không thay thế học đủ khóa.',
      kinds: ['PROJECT'],
      weight: 0.25,
    },
    {
      id: 'deep',
      title: 'Mở rộng chuyên sâu',
      focus: 'Thêm video, ôn tập và bài nâng cao; cần quỹ thời gian lớn hơn.',
      kinds: ['CONCEPT', 'PRACTICE', 'PROJECT', 'REVIEW', 'VIDEO'],
      weight: 0.5,
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
  return variants
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
          l.core ||
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
      const signature = ordered.map((l) => l.id).join(',');
      if (seen.has(signature)) return [];
      seen.add(signature);
      const seconds = ordered.reduce((s, l) => s + l.seconds, 0);
      const budget = p.weeklySeconds * p.horizonWeeks;
      return [
        {
          id: v.id,
          title: v.title,
          focus: v.focus,
          estimatedSeconds: seconds,
          estimatedWeeks: Math.ceil(seconds / p.weeklySeconds),
          fitsBudget: seconds <= budget,
          coversWholeCourse: ordered.length === remaining.length,
          omittedLessonCount: remaining.length - ordered.length,
          explanation: [
            `Mục tiêu: ${GOALS[p.goal]}; ngữ cảnh: ${OCCUPATIONS[p.occupation]}. Trình độ là tự khai, chưa phải kết quả kiểm tra đầu vào.`,
            `${ordered.length} bài còn lại, khoảng ${seconds} giây. ${seconds <= budget ? 'Nằm trong' : 'Vượt'} ngân sách ${budget} giây; không cắt bỏ bài tiên quyết để ép vừa thời gian.`,
            ...(ordered.some((l) => l.difficulty > level)
              ? [
                  'Có bài vượt trình độ tự khai. Cân nhắc học nền tảng/nhờ giảng viên hỗ trợ trước khi chọn phương án này.',
                ]
              : []),
            modelAvailable
              ? 'Có điểm BPR/GRU/HUSPM cho các bài đã mapping; dùng để xếp bài đủ điều kiện, không ghi đè quan hệ tiên quyết. Bài không có điểm dùng tiêu chí học thuật.'
              : 'Chưa có điểm mô hình phù hợp; phương án dựa trên chương trình, mục tiêu và tiên quyết (CURRICULUM), không giả nhận kết quả AI.',
            'Lộ trình là kế hoạch học, không phải cam kết tăng điểm. Muốn cấp chứng nhận vẫn phải học đủ bài và đạt mọi quiz của khóa.',
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
}
