'use client';

import { useTasks } from '@/context/TaskContext';
import TaskItem from './TaskItem';
import { sortTasks } from '@/lib/utils';
import { Task } from '@/types/todo';

export default function TaskList() {
  const { tasks, filters } = useTasks();

  // Apply filters
  const filteredTasks = tasks.filter((task) => {
    // Filter by status
    if (filters.status === 'active' && task.completed) return false;
    if (filters.status === 'completed' && !task.completed) return false;

    // Filter by priority
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;

    // Filter by tag
    if (filters.tag && filters.tag !== 'all' && !task.tags.includes(filters.tag)) return false;

    // Filter by search text
    if (filters.search) {
      const searchText = filters.search.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchText);
      const descMatch = task.description?.toLowerCase().includes(searchText) || false;
      if (!titleMatch && !descMatch) return false;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = sortTasks(filteredTasks, filters.sortBy);

  if (sortedTasks.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No tasks found. Add a new task to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
} 