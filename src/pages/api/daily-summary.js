// API Endpoint: GET /api/daily-summary
// Resumen diario para el bot de WhatsApp
// Devuelve: tareas pendientes, urgentes, y recomendaciones

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

/** @type {import('./$types').RequestHandler} */
export async function GET() {
  try {
    // Force fresh data
    const nocache = Date.now();
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Obtener todas las tareas no terminadas
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'done')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) throw error;

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

    // Formateo para WhatsApp
    const response = {
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
      // Recomendacion: la mas importante
      recomendada: urgentes.length > 0 ? {
        titulo: urgentes[0].title,
        razon: urgentes[0].priority === 'high' ? 'alta prioridad' : 'vence pronto'
      } : pendientes.length > 0 ? {
        titulo: pendientes[0].title,
        razon: 'primera tarea pendiente'
      } : null
    };

    return new Response(JSON.stringify(response), {
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