// API Endpoint: GET /api/daily-summary
// Resumen diario para el bot de WhatsApp

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Direct fetch to Supabase - bypasses any caching
    const fetchUrl = `${supabaseUrl}/rest/v1/tasks?status=neq.done&select=*&order=priority.desc,due_date.asc`;
    
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

    // Clasificar tareas
    const pendientes = tasks?.filter(t => t.status === 'todo') || [];
    const enProgreso = tasks?.filter(t => t.status === 'in_progress') || [];

    // Urgentes: alta prioridad O vencen hoy/manana
    const urgentes = tasks?.filter(t => 
      t.priority === 'high' || 
      t.due_date === today || 
      t.due_date === tomorrow
    ) || [];

    // Proxima a vencer (en los proximos 3 dias)
    const proximasAVencer = tasks?.filter(t => {
      if (!t.due_date || t.due_date < today) return false;
      const daysUntil = Math.ceil((new Date(t.due_date) - new Date(today)) / 86400000);
      return daysUntil <= 3;
    }) || [];

    const responseFormatted = {
      fecha: today,
      resumen: {
        pendientes: pendientes.length,
        en_progreso: enProgreso.length,
        total_pendiente: pendientes.length + enProgreso.length
      },
      urgentes: urgentes.map(t => ({
        titulo: t.title,
        prioridad: t.priority,
        vence: t.due_date ? formatDate(t.due_date, today) : 'sin fecha'
      })),
      proximas_a_vencer: proximasAVencer.map(t => ({
        titulo: t.title,
        prioridad: t.priority,
        vence_en: formatVence(t.due_date, today)
      })),
      recomendada: urgentes.length > 0 ? {
        titulo: urgentes[0].title,
        razon: urgentes[0].priority === 'high' ? 'alta prioridad' : 'vence pronto'
      } : pendientes.length > 0 ? {
        titulo: pendientes[0].title,
        razon: 'primera tarea pendiente'
      } : null
    };

    return new Response(JSON.stringify(responseFormatted), {
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

function formatDate(dateStr, today) {
  if (dateStr === today) return 'HOY';
  return new Date(dateStr).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
}

function formatVence(dateStr, today) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date(today)) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'mañana';
  return `en ${diff} días`;
}