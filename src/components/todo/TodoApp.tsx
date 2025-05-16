'use client';

import React from 'react';
import { useState } from 'react';
import { TaskProvider } from '@/context/TaskContext';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import TaskFilters from './TaskFilters';
import { PlusCircle, XCircle } from 'lucide-react';

export default function TodoApp() {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <TaskProvider>
      <div className="max-w-4xl mx-auto p-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Todo App</h1>
          <p className="mt-2 text-gray-600">Organize your tasks effectively</p>
        </header>

        <div className="mb-6">
          {showForm ? (
            <div className="mb-6 relative">
              <button
                onClick={() => setShowForm(false)}
                className="absolute -top-3 -right-3 text-gray-500 hover:text-red-600 z-10"
                aria-label="Close form"
              >
                <XCircle size={24} />
              </button>
              <TaskForm />
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full p-4 flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              <PlusCircle size={20} />
              <span>Add New Task</span>
            </button>
          )}
        </div>

        <div className="mb-6">
          <TaskFilters />
        </div>

        <div>
          <TaskList />
        </div>
      </div>
    </TaskProvider>
  );
} 