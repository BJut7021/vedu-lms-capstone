import { planOptions, type PathLesson, type Preferences } from './path-planner';

const preferences: Preferences = {
  goal: 'FOUNDATION',
  level: 'BEGINNER',
  occupation: 'STUDENT',
  weeklySeconds: 3600,
  horizonWeeks: 2,
  count: 4,
  format: 'MIXED',
};

function lesson(id: number, changes: Partial<PathLesson> = {}): PathLesson {
  return {
    id, order: id, title: `Bài ${id}`, seconds: 600, measuredVideo: false,
    kind: 'CONCEPT', difficulty: 1, core: true, prerequisites: [],
    outcomes: [], skills: [], goals: [], sources: [], completed: false,
    ...changes,
  };
}

describe('Learning path skill evidence', () => {
  it('adds review after a weak result even when the lesson was previously completed', () => {
    const plans = planOptions([
      lesson(1, { completed: true }),
      lesson(2, { completed: true, prerequisites: [1], gaps: [{ skill: 'inheritance', score: 0.4, evidenceCount: 3 }] }),
      lesson(3, { prerequisites: [2], modelScore: 1 }),
    ], preferences, true);
    expect(plans[0].steps.map((step) => step.lessonId)).toEqual([2, 3]);
    expect(plans[0].steps[0].reasons.join(' ')).toContain('40% từ 3 minh chứng');
  });

  it('preserves the order of required prerequisites when model scores favor a later lesson', () => {
    const plans = planOptions([
      lesson(1),
      lesson(2, { prerequisites: [1], modelScore: 1 }),
    ], preferences, true);
    expect(plans.every((plan) => plan.steps.map((step) => step.lessonId).join() === '1,2')).toBe(true);
  });
});
