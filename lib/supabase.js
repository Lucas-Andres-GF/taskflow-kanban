import { createClient } from '@supabase/supabase-js';

// Environment variables should be set in your .env file:
// PUBLIC_SUPABASE_URL=your_supabase_url
// PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get all tasks
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Helper function to update task status
export async function updateTaskStatus(taskId, newStatus) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Helper function to create a new task
export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Helper function to delete a task
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
  return true;
}

// Helper function to get tasks due today or high priority (for API endpoint)
export async function getDailyTasks() {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .or(`due_date.eq.${today},priority.eq.high`)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}