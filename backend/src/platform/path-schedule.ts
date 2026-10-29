export type StudyTask = {
  lessonId: number;
  title: string;
  activity: string;
  estimatedSeconds: number;
};
export function weeklySchedule(
  tasks: StudyTask[],
  weeklySeconds: number,
  horizonWeeks: number,
) {
  const weeks: {
    week: number;
    estimatedSeconds: number;
    withinTarget: boolean;
    tasks: StudyTask[];
  }[] = [];
  let unscheduledSeconds = 0;
  for (const task of tasks) {
    let left = Math.max(0, Math.ceil(task.estimatedSeconds));
    while (left > 0) {
      let week = weeks.at(-1);
      if (!week || week.estimatedSeconds === weeklySeconds) {
        if (weeks.length >= 104) {
          unscheduledSeconds += left;
          break;
        }
        week = {
          week: weeks.length + 1,
          estimatedSeconds: 0,
          withinTarget: weeks.length < horizonWeeks,
          tasks: [],
        };
        weeks.push(week);
      }
      const seconds = Math.min(left, weeklySeconds - week.estimatedSeconds);
      week.tasks.push({ ...task, estimatedSeconds: seconds });
      week.estimatedSeconds += seconds;
      left -= seconds;
    }
  }
  return { weeks, unscheduledSeconds };
}
