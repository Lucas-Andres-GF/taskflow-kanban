// API Endpoint: GET /api/daily-tasks
// Returns tasks due today OR with high priority
// Used by external agents/automation

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (server-side)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Query tasks: due_date = today OR priority = high
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        created_at
      `)
      .or(`due_date.eq.${today},priority.eq.high`)
      .order('priority', { ascending: false })  // High priority first
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database query failed',
          details: error.message
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform tasks to clean response format
    const cleanTasks = (tasks || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      created_at: task.created_at,
      // Add computed fields for the API consumer
      is_due_today: task.due_date === today,
      is_high_priority: task.priority === 'high',
    }));

    // Group by status for easier consumption
    const grouped = {
      todo: cleanTasks.filter(t => t.status === 'todo'),
      in_progress: cleanTasks.filter(t => t.status === 'in_progress'),
      done: cleanTasks.filter(t => t.status === 'done'),
    };

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        total: cleanTasks.length,
        tasks: cleanTasks,
        grouped: grouped,
        summary: {
          pending: grouped.todo.length,
          in_progress: grouped.in_progress.length,
          completed: grouped.done.length,
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );

  } catch (err) {
    console.error('API Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: err.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Optional: POST endpoint to create a task from external source
/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Title is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create the task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{
        title: body.title,
        description: body.description || '',
        status: body.status || 'todo',
        priority: body.priority || 'medium',
        due_date: body.due_date || null,
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        task: task
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('POST Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create task',
        details: err.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}