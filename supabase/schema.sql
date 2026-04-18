-- Kanban Tasks Table Schema
-- Run this SQL in your Supabase SQL Editor

-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW RLS;

-- Create policy for authenticated users to read all tasks
CREATE POLICY "Enable read access for authenticated users" ON tasks
    FOR SELECT TO authenticated
    USING (true);

-- Create policy for authenticated users to insert tasks
CREATE POLICY "Enable insert for authenticated users" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Create policy for authenticated users to update tasks
CREATE POLICY "Enable update for authenticated users" ON tasks
    FOR UPDATE TO authenticated
    USING (true);

-- Create policy for authenticated users to delete tasks
CREATE POLICY "Enable delete for authenticated users" ON tasks
    FOR DELETE TO authenticated
    USING (true);

-- Optional: Allow anonymous read access (remove if you want to require auth)
CREATE POLICY "Enable read access for anonymous users" ON tasks
    FOR SELECT TO anon
    USING (true);

-- Optional: Allow anonymous insert (be careful with this in production!)
CREATE POLICY "Enable insert for anonymous users" ON tasks
    FOR INSERT TO anon
    WITH CHECK (true);

-- Optional: Allow anonymous update
CREATE POLICY "Enable update for anonymous users" ON tasks
    FOR UPDATE TO anon
    USING (true);

-- Add some sample data for testing
INSERT INTO tasks (title, description, status, priority, due_date) VALUES
    ('Diseño de UI', 'Crear mockups para la nueva feature', 'todo', 'high', CURRENT_DATE + INTERVAL '3 days'),
    ('Implementar API', 'Desarrollar endpoints de autenticación', 'in_progress', 'high', CURRENT_DATE + INTERVAL '1 day'),
    ('Revisión de código', 'Code review del PR #42', 'todo', 'medium', CURRENT_DATE + INTERVAL '5 days'),
    ('Tests unitarios', 'Escribir tests para el módulo de usuarios', 'done', 'low', CURRENT_DATE - INTERVAL '2 days'),
    ('Documentación', 'Actualizar README con nuevas instrucciones', 'todo', 'low', CURRENT_DATE + INTERVAL '7 days');