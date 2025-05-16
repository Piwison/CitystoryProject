'use client';

import { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Task } from '@/types/todo';
import { formatDate, cn } from '@/lib/utils';
import { Trash2, Edit, Calendar, Tag } from 'lucide-react';

type TaskItemProps = {
  task: Task;
};

export default function TaskItem({ task }: TaskItemProps) {
  const { toggleTaskStatus, deleteTask, updateTask } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const handleToggle = () => {
    toggleTaskStatus(task.id);
  };

  const handleDelete = () => {
    deleteTask(task.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedTitle.trim()) {
      updateTask(task.id, { title: editedTitle });
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-4 border rounded-lg shadow-sm transition-all hover:shadow-md',
        task.completed && 'bg-gray-50'
      )}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggle}
        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <h3
            className={cn(
              'text-lg font-medium truncate',
              task.completed && 'line-through text-gray-500'
            )}
          >
            {task.title}
          </h3>
        )}

        {task.description && (
          <p
            className={cn(
              'mt-1 text-sm text-gray-700 line-clamp-2',
              task.completed && 'text-gray-400'
            )}
          >
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar size={14} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          <span
            className={cn(
              'px-2 py-1 rounded-full font-medium',
              priorityColors[task.priority]
            )}
          >
            {task.priority}
          </span>

          {task.tags.length > 0 && (
            <div className="flex items-center gap-1 text-gray-500">
              <Tag size={14} />
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleEdit}
          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
          aria-label="Edit task"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
          aria-label="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
} 