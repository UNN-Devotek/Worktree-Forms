export const generateMockRows = (count: number) => {
  const statuses = ['In Progress', 'Done', 'Review', 'Blocked', 'Planned'];
  const assignees = ['Amelia', 'Mike', 'Sarah', 'James', 'Murat', 'White'];
  const priorities = ['High', 'Medium', 'Low'];

  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i + 1}`,
    title: `Task ${i + 1}: Implement high-performance grid rendering for Worktree`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignee: assignees[Math.floor(Math.random() * assignees.length)],
    dueDate: '2026-01-22',
    priority: priorities[Math.floor(Math.random() * priorities.length)],
  }));
};
