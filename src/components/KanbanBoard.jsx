import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for client-side
const supabaseUrl = typeof window !== 'undefined' 
  ? (import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co')
  : 'https://your-project.supabase.co';
const supabaseAnonKey = typeof window !== 'undefined'
  ? (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key')
  : 'your-anon-key';

// Create client (module level for reuse)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Status columns configuration
const COLUMNS = [
  { id: 'todo', title: 'Pendiente', color: 'text-gray-400' },
  { id: 'in_progress', title: 'En Progreso', color: 'text-blue-400' },
  { id: 'done', title: 'Terminado', color: 'text-mint' },
];

// Priority badge component
function PriorityBadge({ priority }) {
  const styles = {
    low: 'priority-low',
    medium: 'priority-medium',
    high: 'priority-high',
  };

  const labels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Mañana';
  }

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}

// Check if date is overdue
function isOverdue(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

// Task Card component
function TaskCard({ task, onStatusChange, onDelete }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`kanban-card cursor-move ${isDragging ? 'opacity-50 scale-95' : ''} group`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-white text-sm leading-tight">{task.title}</h3>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
          title="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {task.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />

        {task.due_date && (
          <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-400' : 'text-gray-500'}`}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>

      {/* Quick status change buttons */}
      <div className="flex gap-1 mt-3 pt-3 border-t border-dark-border">
        {COLUMNS.map((col) => (
          task.status !== col.id && (
            <button
              key={col.id}
              onClick={() => onStatusChange(task.id, col.id)}
              className="flex-1 text-xs py-1 px-2 rounded bg-dark-bg hover:bg-mint/20 text-gray-400 hover:text-mint transition-colors"
            >
              {col.id === 'todo' && '↩ Pendiente'}
              {col.id === 'in_progress' && '→ En Progreso'}
              {col.id === 'done' && '✓ Hecho'}
            </button>
          )
        ))}
      </div>
    </div>
  );
}

// Column component
function Column({ column, tasks, onStatusChange, onDelete, onDragOver, onDrop }) {
  return (
    <div
      className="flex-1 min-w-[280px] max-w-[400px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className={`column-header flex items-center justify-between ${column.color}`}>
        <span>{column.title}</span>
        <span className="text-sm font-normal text-gray-500 bg-dark-card px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3 min-h-[200px] p-2 -m-2 rounded-lg">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay tareas
          </div>
        )}
      </div>
    </div>
  );
}

// Main Kanban Board component
export default function KanbanBoard({ initialTasks = [] }) {
  // Start with empty and fetch from client
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tasks on mount (once)
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
      window.dispatchEvent(new CustomEvent('taskCountUpdate', { detail: data?.length || 0 }));
      
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update task status
  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating task:', err);
      // Revert on error
      fetchTasks();
    }
  }, []);

  // Delete task
  const handleDelete = useCallback(async (taskId) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    // Optimistic update
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting task:', err);
      fetchTasks();
    }
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleStatusChange(taskId, newStatus);
    }
  };

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mint"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
        Error al cargar tareas: {error}
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {COLUMNS.map((column) => (
        <Column
          key={column.id}
          column={column}
          tasks={tasksByStatus[column.id]}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}