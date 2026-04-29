-- Add persistent manual ordering to existing TaskFlow databases.
-- Run this once in the Supabase SQL Editor for the project used by this app.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at ASC) - 1 AS new_position
  FROM tasks
)
UPDATE tasks
SET position = ranked.new_position
FROM ranked
WHERE tasks.id = ranked.id;

CREATE INDEX IF NOT EXISTS tasks_status_position_idx ON tasks (status, position);
