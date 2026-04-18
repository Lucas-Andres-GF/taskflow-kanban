// API Endpoint: /api/tasks
// GET - Obtener tareas (con filtros)
// POST - Crear tarea

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit') || '50';

    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Only filter if status is specifically 'todo' or 'in_progress'
    if (status === 'todo' || status === 'in_progress') {
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query;

    if (error) throw error;

    const formatted = {
      total: tasks?.length || 0,
      tareas: tasks?.map(t => ({
        id: t.id,
        titulo: t.title,
        descripcion: t.description || '',
        estado: t.status === 'todo' ? 'pendiente' : t.status === 'in_progress' ? 'en_progreso' : 'terminado',
        prioridad: t.priority,
        vence: t.due_date || null
      })) || []
    };

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    if (!body.titulo && !body.title) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'El título es requerido' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Content-Disposition': 'inline'
        }
      });
    }

    const task = {
      title: body.titulo || body.title,
      description: body.descripcion || body.description || '',
      priority: body.prioridad || body.priority || 'medium',
      status: body.estado || body.status || 'todo',
      due_date: body.vence || body.due_date || null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      message: 'Tarea creada',
      tarea: {
        id: data.id,
        titulo: data.title,
        prioridad: data.priority,
        estado: data.status
      }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': 'inline'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': 'inline'
      }
    });
  }
}