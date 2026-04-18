# TaskFlow - Kanban Board

A Kanban task management application built with **Astro**, **React**, **Tailwind CSS**, and **Supabase**.

## Features

- 📋 Three-column Kanban board (Pendiente, En Progreso, Terminado)
- 🎨 Dark mode UI with mint green accents (#10B981)
- 🔄 Drag and drop task movement
- ⚡ Real-time status updates via Supabase
- 📱 Responsive design
- 🌐 API endpoint for external agents (`/api/daily-tasks`)

## Project Structure

```
├── src/
│   ├── components/
│   │   └── KanbanBoard.jsx      # React component (interactive)
│   ├── layouts/
│   │   └── Layout.astro         # Base layout with dark theme
│   ├── pages/
│   │   ├── index.astro          # Main Kanban page
│   │   └── api/
│   │       └── daily-tasks.js  # API endpoint for agents
│   └── styles/
│       └── global.css           # Tailwind + custom styles
├── lib/
│   └── supabase.js              # Supabase client & helpers
├── supabase/
│   └── schema.sql               # Database schema
├── .env                         # Environment variables
├── astro.config.mjs             # Astro configuration
├── tailwind.config.mjs          # Tailwind configuration
└── package.json                 # Dependencies
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** in the Supabase dashboard
3. Copy and run the contents of `supabase/schema.sql`
4. Go to **Settings > API** to get your:
   - Project URL
   - `anon` key (public)
   - `service_role` key (keep secret!)

### 3. Environment Variables

Create a `.env` file in the project root:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
# Optional (for server-side admin operations):
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 4. Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:4321 to see the app.

## API Endpoint

### GET `/api/daily-tasks`

Returns tasks that are:
- Due today, OR
- Have high priority

**Response:**

```json
{
  "success": true,
  "date": "2026-04-17",
  "total": 3,
  "tasks": [...],
  "grouped": {
    "todo": [...],
    "in_progress": [...],
    "done": [...]
  },
  "summary": {
    "pending": 2,
    "in_progress": 1,
    "completed": 0
  }
}
```

### POST `/api/daily-tasks`

Create a new task from an external source.

**Request Body:**

```json
{
  "title": "Task title",
  "description": "Optional description",
  "priority": "high",
  "due_date": "2026-04-20",
  "status": "todo"
}
```

## Tech Stack

- **Astro** - Static site generator + SSR
- **React** - Interactive components (Islands architecture)
- **Tailwind CSS** - Utility-first CSS
- **Supabase** - Backend-as-a-Service (PostgreSQL + REST API)

## Color Palette

| Element | Color |
|---------|-------|
| Background | `#111827` |
| Card | `#1F2937` |
| Accent (Mint) | `#10B981` |

## License

MIT