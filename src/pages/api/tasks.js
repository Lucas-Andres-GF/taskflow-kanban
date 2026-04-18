// API Endpoint: POST /api/tasks
// Crear una nueva tarea

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    // Validar título
    if (!body.titulo && !body.title) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'El título es requerido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}