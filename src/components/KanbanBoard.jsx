import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = typeof window !== 'undefined'
  ? (import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co')
  : 'https://your-project.supabase.co';
const supabaseAnonKey = typeof window !== 'undefined'
  ? (import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key')
  : 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const COLUMNS = [
  { id: 'todo', title: 'Pendiente', note: 'Entrada y decision' },
  { id: 'in_progress', title: 'En curso', note: 'Trabajo activo' },
  { id: 'done', title: 'Cerrado', note: 'Resuelto o archivado' },
];

const PRIORITIES = {
  low: { label: 'Baja', className: 'priority-low' },
  medium: { label: 'Media', className: 'priority-medium' },
  high: { label: 'Alta', className: 'priority-high' },
};

const STATUS_LABELS = {
  todo: 'Pendiente',
  in_progress: 'En curso',
  done: 'Cerrado',
};

function parseLocalDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getDaysUntil(dateString) {
  const date = parseLocalDate(dateString);
  if (!date) return null;
  return Math.round((date - startOfToday()) / 86400000);
}

function getDueState(task) {
  const days = getDaysUntil(task.due_date);
  if (days === null) return 'none';
  if (days < 0 && task.status !== 'done') return 'overdue';
  if (days === 0) return 'today';
  if (days <= 3) return 'soon';
  return 'later';
}

function formatDueDate(dateString) {
  const days = getDaysUntil(dateString);
  if (days === null) return 'Sin fecha';
  if (days < 0) return `Vencida hace ${Math.abs(days)} d`;
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Manana';
  if (days <= 7) return `En ${days} dias`;

  return parseLocalDate(dateString).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
  });
}

function priorityRank(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 3;
}

function compareTasks(a, b) {
  const aDue = getDaysUntil(a.due_date);
  const bDue = getDaysUntil(b.due_date);
  const safeADue = aDue === null ? 9999 : aDue;
  const safeBDue = bDue === null ? 9999 : bDue;

  if (a.status !== 'done' && b.status === 'done') return -1;
  if (a.status === 'done' && b.status !== 'done') return 1;
  if (safeADue !== safeBDue) return safeADue - safeBDue;
  if (priorityRank(a.priority) !== priorityRank(b.priority)) {
    return priorityRank(a.priority) - priorityRank(b.priority);
  }
  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
}

function getTaskPosition(task) {
  return Number.isFinite(task.position) ? task.position : 9999;
}

function compareTasksByPosition(a, b) {
  const positionDiff = getTaskPosition(a) - getTaskPosition(b);
  if (positionDiff !== 0) return positionDiff;
  return compareTasks(a, b);
}

function getColumnTasks(tasks, status) {
  return tasks
    .filter((task) => task.status === status)
    .sort(compareTasksByPosition);
}

function withColumnPositions(tasks, status, orderedColumnTasks) {
  const byId = new Map(orderedColumnTasks.map((task, index) => [task.id, { ...task, position: index }]));
  return tasks.map((task) => byId.get(task.id) || task);
}

function getNextPosition(tasks, status) {
  return getColumnTasks(tasks, status).length;
}

function getFocusTask(tasks) {
  return tasks
    .filter((task) => task.status !== 'done')
    .sort(compareTasks)[0] || null;
}

function matchesDueFilter(task, dueFilter) {
  const state = getDueState(task);
  if (dueFilter === 'all') return true;
  if (dueFilter === 'scheduled') return task.due_date;
  return state === dueFilter;
}

function HeaderMetric({ label, value, tone = 'neutral', active = false, onClick }) {
  const toneClass = {
    neutral: 'bg-paper-card text-ink',
    red: 'bg-pastel-red text-pastel-redText',
    blue: 'bg-pastel-blue text-pastel-blueText',
    green: 'bg-pastel-green text-pastel-greenText',
    yellow: 'bg-pastel-yellow text-pastel-yellowText',
  }[tone];
  const activeClass = active ? 'ring-1 ring-ink ring-offset-2 ring-offset-paper' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-baseline justify-between gap-4 border border-line px-3 py-2 text-left transition-transform hover:scale-[0.99] ${toneClass} ${activeClass}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</span>
      <span className="font-serif text-2xl leading-none tracking-tight">{value}</span>
    </button>
  );
}

function PriorityBadge({ priority }) {
  const priorityConfig = PRIORITIES[priority] || PRIORITIES.medium;

  return (
    <span className={`badge ${priorityConfig.className}`}>
      {priorityConfig.label}
    </span>
  );
}

function DueBadge({ task }) {
  const state = getDueState(task);
  const className = {
    overdue: 'bg-pastel-red text-pastel-redText',
    today: 'bg-pastel-yellow text-pastel-yellowText',
    soon: 'bg-pastel-blue text-pastel-blueText',
    later: 'bg-paper-muted text-ink-muted',
    none: 'bg-paper-card text-ink-faint',
  }[state];

  return (
    <span className={`badge ${className}`}>
      {formatDueDate(task.due_date)}
    </span>
  );
}

function TaskCard({ task, onStatusChange, onDelete, onUpdate, onMove, canMoveUp, canMoveDown }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdate(task.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      due_date: editDueDate || null,
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <article className="kanban-card space-y-3">
        <input
          type="text"
          value={editTitle}
          onChange={(event) => setEditTitle(event.target.value)}
          className="field"
          placeholder="Titulo"
          autoFocus
        />
        <textarea
          value={editDescription}
          onChange={(event) => setEditDescription(event.target.value)}
          className="field resize-none"
          placeholder="Descripcion"
          rows={3}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={editPriority} onChange={(event) => setEditPriority(event.target.value)} className="field">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
          <input type="date" value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} className="field" />
        </div>
        <div className="flex gap-2 border-t border-line pt-3">
          <button type="button" onClick={saveEdit} className="btn-primary flex-1">Guardar</button>
          <button type="button" onClick={cancelEdit} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </article>
    );
  }

  return (
    <article
      draggable
      onDragStart={(event) => {
        setIsDragging(true);
        event.dataTransfer.setData('taskId', task.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`kanban-card group cursor-move ${isDragging ? 'scale-[0.99] opacity-50' : ''} ${task.status === 'done' ? 'opacity-60' : ''}`}
    >
      <div className="items-start gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">{STATUS_LABELS[task.status]}</p>
          <h3 className="break-words text-base font-semibold leading-snug text-ink">{task.title}</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex sm:shrink-0 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button type="button" onClick={() => onMove(task.id, -1)} disabled={!canMoveUp} className="border border-line px-2 py-1 text-xs text-ink-muted hover:bg-paper-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-35">
            Arriba
          </button>
          <button type="button" onClick={() => onMove(task.id, 1)} disabled={!canMoveDown} className="border border-line px-2 py-1 text-xs text-ink-muted hover:bg-paper-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-35">
            Abajo
          </button>
          <button type="button" onClick={() => setIsEditing(true)} className="border border-line px-2 py-1 text-xs text-ink-muted hover:bg-paper-muted hover:text-ink">
            Editar
          </button>
          <button type="button" onClick={() => onDelete(task.id)} className="border border-line px-2 py-1 text-xs text-pastel-redText hover:bg-pastel-red">
            Borrar
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-3 min-w-0 overflow-hidden break-words text-sm leading-6 text-ink-muted [overflow-wrap:anywhere]">{task.description}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <PriorityBadge priority={task.priority} />
        <DueBadge task={task} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-2">
        {COLUMNS.filter((column) => column.id !== task.status).map((column) => (
          <button
            key={column.id}
            type="button"
            onClick={() => onStatusChange(task.id, column.id)}
            className="border border-line bg-paper-card px-2 py-2 text-xs font-medium text-ink-muted transition-colors hover:bg-paper-muted hover:text-ink"
          >
            Mover a {column.title}
          </button>
        ))}
      </div>
    </article>
  );
}

function Column({ column, tasks, onStatusChange, onDelete, onUpdate, onMoveTask, onDragOver, onDrop }) {
  return (
    <section className="min-w-0 border border-line bg-paper-card p-3 sm:p-4 lg:p-5" onDragOver={onDragOver} onDrop={(event) => onDrop(event, column.id)}>
      <div className="column-header flex items-start justify-between gap-4">
        <div>
          <h2>{column.title}</h2>
          <p className="mt-2 normal-case tracking-normal text-ink-faint">{column.note}</p>
        </div>
        <span className="shrink-0 border border-line bg-paper-muted px-2 py-1 font-mono text-xs text-ink-muted">{tasks.length}</span>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onUpdate={onUpdate}
            onMove={onMoveTask}
            canMoveUp={index > 0}
            canMoveDown={index < tasks.length - 1}
          />
        ))}

        {tasks.length === 0 && (
          <div className="border border-dashed border-line bg-paper-muted p-8 text-center text-sm text-ink-faint">
            Sin tareas en esta columna.
          </div>
        )}
      </div>
    </section>
  );
}

function TodaySummary({ tasks, focusTask }) {
  const todayTasks = tasks
    .filter((task) => task.status !== 'done' && ['overdue', 'today'].includes(getDueState(task)))
    .sort(compareTasks);

  return (
    <div className="grid gap-3 border border-line bg-paper-card p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,420px)]">
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">Foco recomendado</p>
        {focusTask ? (
          <div className="mt-2 min-w-0">
            <p className="truncate text-sm font-semibold text-ink sm:text-base">{focusTask.title}</p>
            <p className="mt-1 text-xs text-ink-muted">{formatDueDate(focusTask.due_date)} · {PRIORITIES[focusTask.priority]?.label || 'Media'}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-faint">No hay una tarea activa para recomendar.</p>
        )}
      </div>

      <div className="min-w-0 border-t border-line pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">Hoy o vencidas</p>
        <p className="mt-2 truncate text-sm text-ink-muted">
          {todayTasks.length > 0
            ? todayTasks.slice(0, 3).map((task) => task.title).join(' / ')
            : 'No hay vencimientos inmediatos.'}
        </p>
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTasks(data || []);
      window.dispatchEvent(new CustomEvent('taskCountUpdate', { detail: data?.length || 0 }));
    } catch (fetchError) {
      console.error('Error fetching tasks:', fetchError);
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const handleCreateError = (event) => setError(event.detail || 'No se pudo crear la tarea');
    const handleTaskCreated = (event) => {
      if (!event.detail) return;

      setError(null);
      setTasks((currentTasks) => {
        const position = getNextPosition(currentTasks, event.detail.status || 'todo');
        const taskWithPosition = {
          ...event.detail,
          position,
        };
        const nextTasks = [taskWithPosition, ...currentTasks.filter((task) => task.id !== taskWithPosition.id)];
        window.dispatchEvent(new CustomEvent('taskCountUpdate', { detail: nextTasks.length }));

        supabase
          .from('tasks')
          .update({ position })
          .eq('id', taskWithPosition.id)
          .then(({ error: positionError }) => {
            if (positionError) setError(positionError.message);
          });

        return nextTasks;
      });
    };

    window.addEventListener('taskCreateError', handleCreateError);
    window.addEventListener('taskCreated', handleTaskCreated);

    return () => {
      window.removeEventListener('taskCreateError', handleCreateError);
      window.removeEventListener('taskCreated', handleTaskCreated);
    };
  }, []);

  const updateTaskStatus = async (taskId, newStatus) => {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    const nextPosition = getNextPosition(tasks.filter((currentTask) => currentTask.id !== taskId), newStatus);

    setTasks((currentTasks) => currentTasks.map((currentTask) => (
      currentTask.id === taskId ? { ...currentTask, status: newStatus, position: nextPosition } : currentTask
    )));

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus, position: nextPosition })
        .eq('id', taskId);

      if (updateError) throw updateError;
    } catch (updateError) {
      console.error('Error updating task:', updateError);
      setError(updateError.message);
      if (task) {
        setTasks((currentTasks) => currentTasks.map((currentTask) => (
          currentTask.id === taskId ? task : currentTask
        )));
      } else {
        fetchTasks();
      }
    }
  };

  const moveTask = async (taskId, direction) => {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task) return;

    const columnTasks = getColumnTasks(tasks, task.status);
    const currentIndex = columnTasks.findIndex((currentTask) => currentTask.id === taskId);
    const targetIndex = currentIndex + direction;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= columnTasks.length) return;

    const reorderedColumnTasks = [...columnTasks];
    [reorderedColumnTasks[currentIndex], reorderedColumnTasks[targetIndex]] = [
      reorderedColumnTasks[targetIndex],
      reorderedColumnTasks[currentIndex],
    ];

    const nextTasks = withColumnPositions(tasks, task.status, reorderedColumnTasks);
    const previousTasks = tasks;
    setTasks(nextTasks);

    try {
      const changedTasks = reorderedColumnTasks.map((columnTask, index) => ({ ...columnTask, position: index }));
      const updates = changedTasks.map((columnTask) => supabase
        .from('tasks')
        .update({ position: columnTask.position })
        .eq('id', columnTask.id));

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
    } catch (moveError) {
      console.error('Error moving task:', moveError);
      setError(moveError.message);
      setTasks(previousTasks);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('Eliminar esta tarea?')) return;

    const previousTasks = tasks;
    const nextTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(nextTasks);
    window.dispatchEvent(new CustomEvent('taskCountUpdate', { detail: nextTasks.length }));

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) throw deleteError;
    } catch (deleteError) {
      console.error('Error deleting task:', deleteError);
      setError(deleteError.message);
      setTasks(previousTasks);
      window.dispatchEvent(new CustomEvent('taskCountUpdate', { detail: previousTasks.length }));
    }
  };

  const updateTask = async (taskId, updates) => {
    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId ? { ...task, ...updates } : task
    )));

    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (updateError) throw updateError;
    } catch (updateError) {
      console.error('Error updating task:', updateError);
      setError(updateError.message);
      fetchTasks();
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event, newStatus) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('taskId');
    if (taskId) updateTaskStatus(taskId, newStatus);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTasks = tasks
    .filter((task) => {
      const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'open' && task.status !== 'done')
        || task.status === statusFilter;
      return matchesQuery && matchesPriority && matchesStatus && matchesDueFilter(task, dueFilter);
    })
    .sort(compareTasksByPosition);

  const tasksByStatus = {
    todo: getColumnTasks(filteredTasks, 'todo'),
    in_progress: getColumnTasks(filteredTasks, 'in_progress'),
    done: getColumnTasks(filteredTasks, 'done'),
  };

  const activeTasks = tasks.filter((task) => task.status !== 'done');
  const overdueCount = activeTasks.filter((task) => getDueState(task) === 'overdue').length;
  const todayCount = activeTasks.filter((task) => getDueState(task) === 'today').length;
  const focusTask = getFocusTask(tasks);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-40 animate-pulse border border-line bg-paper-card" />
        <div className="h-40 animate-pulse border border-line bg-paper-card" />
        <div className="h-40 animate-pulse border border-line bg-paper-card" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-8">
      {error && (
        <div className="border border-pastel-redText bg-pastel-red p-4 text-sm text-pastel-redText">
          {error}
        </div>
      )}

      <section className="mx-auto max-w-[1320px] space-y-4 sm:space-y-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <TodaySummary tasks={tasks} focusTask={focusTask} />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[520px]">
            <HeaderMetric
              label="Abiertas"
              value={activeTasks.length}
              active={statusFilter === 'open' && dueFilter === 'all'}
              onClick={() => {
                setStatusFilter('open');
                setDueFilter('all');
              }}
            />
            <HeaderMetric
              label="Hoy"
              value={todayCount}
              tone="yellow"
              active={dueFilter === 'today'}
              onClick={() => {
                setStatusFilter('all');
                setDueFilter('today');
              }}
            />
            <HeaderMetric
              label="Vencidas"
              value={overdueCount}
              tone={overdueCount > 0 ? 'red' : 'green'}
              active={dueFilter === 'overdue'}
              onClick={() => {
                setStatusFilter('all');
                setDueFilter('overdue');
              }}
            />
            <HeaderMetric
              label="Cerradas"
              value={tasks.filter((task) => task.status === 'done').length}
              tone="green"
              active={statusFilter === 'done' && dueFilter === 'all'}
              onClick={() => {
                setStatusFilter('done');
                setDueFilter('all');
              }}
            />
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="border border-line bg-paper-card p-3 sm:p-4 lg:p-5">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_170px]">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="field sm:col-span-3 lg:col-span-1"
                placeholder="Buscar por titulo o descripcion"
              />
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="field">
                <option value="all">Toda prioridad</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="field">
                <option value="all">Todo estado</option>
                <option value="open">Abiertas</option>
                <option value="todo">Pendiente</option>
                <option value="in_progress">En curso</option>
                <option value="done">Cerrado</option>
              </select>
              <select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)} className="field">
                <option value="all">Todo vencimiento</option>
                <option value="overdue">Vencidas</option>
                <option value="today">Hoy</option>
                <option value="soon">Proximas</option>
                <option value="scheduled">Con fecha</option>
                <option value="none">Sin fecha</option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm text-ink-muted">
              <span>{filteredTasks.length} tareas visibles de {tasks.length}</span>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setPriorityFilter('all');
                  setStatusFilter('all');
                  setDueFilter('all');
                }}
                className="text-ink underline underline-offset-4"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id]}
                onStatusChange={updateTaskStatus}
                onDelete={deleteTask}
                onUpdate={updateTask}
                onMoveTask={moveTask}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
