'use client';

import { useEffect, useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { TaskFilter } from '@/types/todo';
import { Search, Filter } from 'lucide-react';

export default function TaskFilters() {
  const { tasks, filters, setFilters } = useTasks();
  const [searchText, setSearchText] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Extract all unique tags from tasks
  useEffect(() => {
    const uniqueTags = Array.from(
      new Set(tasks.flatMap((task) => task.tags))
    ).sort();
    setAvailableTags(uniqueTags);
  }, [tasks]);

  // Update search filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ ...filters, search: searchText });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, setFilters, filters]);

  const handleStatusChange = (status: TaskFilter['status']) => {
    setFilters({ ...filters, status });
  };

  const handlePriorityChange = (priority: TaskFilter['priority']) => {
    setFilters({ ...filters, priority });
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, tag: e.target.value });
  };

  const handleSortChange = (sortBy: TaskFilter['sortBy']) => {
    setFilters({ ...filters, sortBy });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.status === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusChange('active')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.status === 'active'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePriorityChange('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.priority === 'all'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handlePriorityChange('high')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.priority === 'high'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              High
            </button>
            <button
              onClick={() => handlePriorityChange('medium')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => handlePriorityChange('low')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.priority === 'low'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Low
            </button>
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="tagFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Tag
            </label>
            <select
              id="tagFilter"
              value={filters.tag || 'all'}
              onChange={handleTagChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Tags</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleSortChange('date')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.sortBy === 'date'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Due Date
            </button>
            <button
              onClick={() => handleSortChange('priority')}
              className={`px-3 py-1 text-sm rounded-full ${
                filters.sortBy === 'priority'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Priority
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 