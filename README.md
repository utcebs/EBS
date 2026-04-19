# EBS Unified Platform — Setup Guide

A unified project portfolio & work tracking platform. Built with **React + Vite + Tailwind** (frontend) and **Supabase** (backend). Designed for GitHub Pages hosting.

---

## What You Get

### Project Tracker (Public — no login needed)
- **Portfolio Dashboard** — Auto-generated summary with charts (status, priority, department, phase breakdowns)
- **Project Tracker** — Full CRUD table with search, filter, sort
- **Project Drill-down** — Click any project to see milestones, risks, and **time invested by team members**
- **Gantt Chart** — Dynamic timeline auto-generated from project dates

### Work Tracker (Login required)
- **Work Log Dashboard** — Team-wide task log with filters by person, category, month
- **Log Task** — Task logging form with subcategory cards + **project linking dropdown**
- **My Performance** — RPG level system, XP bar, streaks, badges, weekly charts
- **My Tasks** — Personal priority board (Urgent / Important / Medium / Low)

### Admin Panel (Admin login required)
- **User Management** — Create users, reset passwords
- **Project Analytics** — Hours per project, employees per project, who worked on what
- **Records & Export** — View all logs, export CSV
- **Settings** — Tracker configuration

---

## Prerequisites

- A **GitHub account** (free) to host the app
- A **Supabase account** (free) for the database
- **Node.js 18+** installed locally (for building)

---

## Step 1 — Set Up Supabase

### 1.1 Create a project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**, give it a name (e.g. `ebs-platform`), set a database password, pick the region closest to your team
3. Wait ~2 minutes for provisioning

### 1.2 Run the database setup

1. In Supabase, click **SQL Editor** → **New query**
2. Open `UNIFIED_DATABASE_SETUP.sql`, copy all contents
3. Paste into the SQL editor and click **Run**
4. You should see `Success. No rows returned`

### 1.3 Load seed data (optional — if you have existing projects)

If you have the `seed_data.sql` file from your previous Project Tracker, run it after the schema setup. This loads your 30 projects + milestones.

### 1.4 Get your API credentials

1. Go to **Project Settings** (gear icon) → **API**
2. Copy:
   - **Project URL** — e.g. `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — long string starting with `eyJ...`

---

## Step 2 — Configure & Build

### 2.1 Install dependencies

```bash
cd ebs-unified-platform
npm install
```

### 2.2 Set Supabase credentials

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and paste your credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2.3 Run locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 2.4 Build for production

```bash
npm run build
```

Output goes to `dist/` folder.

---

## Step 3 — Deploy to GitHub Pages

### Option A: Using gh-pages package

```bash
npm run deploy
```

### Option B: Manual

1. Create a GitHub repository
2. Push the project
3. Go to repo **Settings → Pages** → Deploy from `gh-pages` branch
4. If your repo name isn't the root, update `base` in `vite.config.js`:
   ```js
   base: '/your-repo-name/',
   ```

---

## Step 4 — First Login

1. Open your deployed URL
2. The **Portfolio Dashboard** loads immediately (no login needed)
3. Click **Sign In** in the sidebar
4. Login: **username:** `admin` / **password:** `Admin@123`
5. **Immediately change the password** via Admin Panel → Users → 🔑

---

## Step 5 — Initial Configuration

### Add Team Members
Admin Panel → 👥 Users → Create User

### Load Existing Projects
If you ran `seed_data.sql`, your projects are already loaded. Otherwise, go to Projects → New Project.

### Configure Subcategories
These are pre-loaded from the database setup:
- **Support:** User Support, D365 User Support, Report Support
- **Testing:** Hardware Testing, Software Testing
- **Project:** Development, Implementation, Planning, Documentation

To modify, use the Supabase table editor directly on `support_subcategories`, `testing_subcategories`, `project_subcategories`.

---

## Access Control

| Area | Admin | Logged-in User | Guest |
|------|-------|----------------|-------|
| Portfolio Dashboard | ✅ View | ✅ View | ✅ View |
| Projects / Gantt | ✅ Full CRUD | ✅ View only | ✅ View only |
| Work Log Dashboard | ✅ All users' logs | ✅ All users' logs | ❌ Login required |
| Log Task | ✅ | ✅ Own tasks | ❌ Login required |
| My Performance | ✅ | ✅ Own stats | ❌ Login required |
| My Tasks | ✅ | ✅ Own tasks | ❌ Login required |
| Admin Panel | ✅ | ❌ | ❌ |

---

## Project ↔ Task Linking

When logging a task, users can optionally select a project from the dropdown. This creates a link between the task log and the project via `task_logs.project_id`.

### Admin Analytics
Admin Panel → 📊 Project Analytics shows:
- **Hours invested per project** (bar chart + table)
- **Number of team members per project**
- **Employee breakdown** — total hours and which projects each person contributed to

### Project Detail View
Click any project → scroll to **Time Invested** section to see:
- Total hours logged against this project
- Number of team members involved
- Hours breakdown by team member (bar chart)

---

## Database Tables

| Table | Purpose |
|---|---|
| `users` | Team members, SHA-256 credentials, roles |
| `projects` | Project portfolio (30 fields) |
| `milestones` | Key milestones per project |
| `risks` | Risks & issues per project |
| `task_logs` | Work log entries (with `project_id` FK) |
| `priority_tasks` | Personal task board items |
| `app_settings` | Admin-configurable settings |
| `support_subcategories` | Subcategories for Support |
| `testing_subcategories` | Subcategories for Testing |
| `project_subcategories` | Subcategories for Project |
| `employee_leaves` | Per-employee leave date ranges |
| `war_day_ranges` | Team-wide closure date ranges |

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Hosting | GitHub Pages |
| Charts | Recharts |
| Auth | Custom SHA-256 (via `users` table) |
| Excel | SheetJS (xlsx) |
| Icons | Lucide React |
| PWA | Web App Manifest + Service Worker |
| Fonts | Playfair Display + DM Sans |

---

## Customization

### Theme
Default is **dark mode** (EBS RPG theme). Users can toggle to light mode using the ☀️/🌙 button in the sidebar.

### Working Hours
Edit `src/config.js`:
```js
export const RAMADAN_DAILY_HOURS = 6;
export const NORMAL_DAILY_HOURS  = 8;
```

### RPG Levels & Badges
Edit the `LEVELS` and `BADGES` arrays in `src/config.js`.

### Project Dropdowns
Edit the constants at the top of `src/App.jsx`:
```js
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low']
const STATUSES = ['On Track', 'At Risk', 'Delayed', 'Completed', 'On Hold']
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Connection error" on login | Check `.env` Supabase URL and key |
| Blank page on GitHub Pages | Verify `base` in `vite.config.js` matches your repo name |
| Subcategories not showing | Check subcategory tables in Supabase |
| Project dropdown empty | Run `seed_data.sql` or add projects manually |
| Old version cached | Hard refresh: `Ctrl+Shift+R` |

---

## Install as Mobile App

**iPhone:** Safari → Share → Add to Home Screen

**Android:** Chrome → ⋮ → Add to Home screen

---

*EBS Unified Platform — Projects & Work Tracking for the EBS Team*
