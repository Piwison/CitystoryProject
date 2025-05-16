export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority: Priority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type TaskFilter = {
  status?: 'all' | 'active' | 'completed';
  priority?: Priority | 'all';
  tag?: string | 'all';
  sortBy?: 'date' | 'priority';
  search?: string;
};

export type TaskContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  filters: TaskFilter;
  setFilters: (filters: TaskFilter) => void;
}; 