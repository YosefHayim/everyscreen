const queuedTasks = new Map<string, Promise<unknown>>();

const runAfter = async <TaskReturn>(
  previousTask: Promise<unknown> | null,
  task: () => Promise<TaskReturn>,
): Promise<TaskReturn> => {
  await Promise.allSettled([previousTask]);
  return task();
};

export const runOneAtATime = async <TaskReturn>(
  queueKey: string,
  task: () => Promise<TaskReturn>,
): Promise<TaskReturn> => {
  const previousTask = queuedTasks.get(queueKey) ?? null;
  const currentTask = runAfter(previousTask, task);
  queuedTasks.set(queueKey, currentTask);
  try {
    return await currentTask;
  } finally {
    const isLastTask = queuedTasks.get(queueKey) === currentTask;
    if (isLastTask) queuedTasks.delete(queueKey);
  }
};
