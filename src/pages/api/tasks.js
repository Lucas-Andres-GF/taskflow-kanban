// API Endpoint: /api/tasks
// GET - Obtener tareas (con filtros)
// POST - Crear tarea

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
  try {
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit') || '100';

    // Direct fetch to Supabase REST API - bypasses JS client cache
    let fetchUrl = `${supabaseUrl}/rest/v1/tasks?select=*&order=created_at.desc&limit=${limit}`;
    
    if (status === 'todo' || status === 'in_progress') {
      fetchUrl += `&status=eq.${status}`;
    }

    console.log('[API /api/tasks] fetchUrl:', fetchUrl);

    const response = await fetch(fetchUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Supabase fetch failed');
    }

    const tasks = await response.json();

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
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
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

    // Direct fetch POST to Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([task])
    });

    if (!response.ok) {
      throw new Error('Supabase insert failed');
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Tarea creada',
      tarea: {
        id: data[0]?.id,
        titulo: data[0]?.title,
        prioridad: data[0]?.priority,
        estado: data[0]?.status
      }
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
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
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  }
}