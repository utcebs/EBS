-- ============================================================
-- EBS Unified Platform — Complete Database Setup
-- Merges: EBS Tracker + EBS Project Tracker
-- Single file, fresh install. Run once in Supabase SQL Editor.
--
-- After running:
--   Default Admin Login → username: admin / password: Admin@123
--   ⚠️  Change the admin password immediately after first login!
-- ============================================================


-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── Helper: auto-update updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ═════════════════════════════════════════════════════════════
-- SECTION A: EBS TRACKER TABLES
-- ═════════════════════════════════════════════════════════════

-- ── TABLE: users ──────────────────────────────────────────────
-- Custom auth (SHA-256). NOT Supabase Auth.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  username      TEXT          UNIQUE NOT NULL,
  password_hash TEXT          NOT NULL,
  full_name     TEXT          NOT NULL,
  role          TEXT          DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  email         TEXT          DEFAULT '',
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Default admin: username=admin password=Admin@123
INSERT INTO users (username, password_hash, full_name, role) VALUES (
  'admin',
  'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd4',
  'Administrator',
  'admin'
) ON CONFLICT (username) DO NOTHING;


-- ═════════════════════════════════════════════════════════════
-- SECTION B: PROJECT TRACKER TABLES
-- ═════════════════════════════════════════════════════════════

-- ── TABLE: projects ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id               BIGSERIAL     PRIMARY KEY,
  project_number   INTEGER       UNIQUE,
  project_name     TEXT          NOT NULL,
  objective        TEXT,
  dept_module      TEXT,
  business_owner   TEXT,
  priority         TEXT          CHECK (priority IN ('Critical','High','Medium','Low')),
  status           TEXT          CHECK (status IN ('On Track','At Risk','Delayed','Completed','On Hold')),
  phase            TEXT          CHECK (phase IN ('Initiation','Planning','Execution','UAT','Go-Live','Closed')),
  est_start        TEXT,
  start_date       TEXT,
  end_date         TEXT,
  percent_complete TEXT,
  total_cost_kwd   NUMERIC       DEFAULT 0,
  business_impact  TEXT          CHECK (business_impact IN ('High','Medium','Low')),
  cost_remarks     TEXT,
  dependencies     TEXT,
  key_risks        TEXT,
  mitigation       TEXT,
  notes_updates    TEXT,
  actions_needed   TEXT,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_projects_status   ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── TABLE: milestones ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id                   BIGSERIAL     PRIMARY KEY,
  project_id           BIGINT        REFERENCES projects(id) ON DELETE CASCADE,
  milestone_number     INTEGER,
  deliverable          TEXT          NOT NULL,
  target_date          TEXT,
  actual_date          TEXT,
  development_status   TEXT          CHECK (development_status IN ('Not Started','In Progress','Completed','Blocked')),
  uat_status           TEXT          CHECK (uat_status IN ('Not Started','Pending','In Progress','Passed','Failed')),
  dependencies         TEXT,
  owner                TEXT,
  remarks              TEXT,
  created_at           TIMESTAMPTZ   DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);

DROP TRIGGER IF EXISTS milestones_updated_at ON milestones;
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── TABLE: risks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS risks (
  id                BIGSERIAL     PRIMARY KEY,
  project_id        BIGINT        REFERENCES projects(id) ON DELETE CASCADE,
  risk_number       INTEGER,
  description       TEXT          NOT NULL,
  impact            TEXT          CHECK (impact IN ('High','Medium','Low')),
  likelihood        TEXT          CHECK (likelihood IN ('High','Medium','Low')),
  mitigation_action TEXT,
  owner             TEXT,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE risks DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_risks_project_id ON risks(project_id);

DROP TRIGGER IF EXISTS risks_updated_at ON risks;
CREATE TRIGGER risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═════════════════════════════════════════════════════════════
-- SECTION C: WORK TRACKING TABLES (with project linking)
-- ═════════════════════════════════════════════════════════════

-- ── TABLE: task_logs ──────────────────────────────────────────
-- Core work logging table. NOW includes optional project_id link.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_logs (
  id               UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_member      TEXT          NOT NULL,
  log_date         DATE          NOT NULL DEFAULT CURRENT_DATE,
  month            TEXT          NOT NULL,
  week_number      INTEGER       NOT NULL,
  task_project     TEXT          NOT NULL,
  task_description TEXT          DEFAULT '',
  category         TEXT          NOT NULL CHECK (category IN ('Support', 'Testing', 'Project')),
  sub_category     TEXT          DEFAULT '',
  hours_spent      NUMERIC(5,2)  NOT NULL CHECK (hours_spent > 0 AND hours_spent <= 24),
  accomplishment   TEXT          DEFAULT '',
  comments_notes   TEXT          DEFAULT '',
  is_completed     BOOLEAN       DEFAULT FALSE,
  project_id       BIGINT        REFERENCES projects(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_logs_user_id    ON task_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_log_date   ON task_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_task_logs_category   ON task_logs(category);
CREATE INDEX IF NOT EXISTS idx_task_logs_month      ON task_logs(month);
CREATE INDEX IF NOT EXISTS idx_task_logs_project_id ON task_logs(project_id);
ALTER TABLE task_logs DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_task_logs_updated_at ON task_logs;
CREATE TRIGGER update_task_logs_updated_at
  BEFORE UPDATE ON task_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── TABLE: priority_tasks ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS priority_tasks (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID        REFERENCES users(id),
  title       TEXT        NOT NULL,
  priority    TEXT        NOT NULL CHECK (priority IN ('Urgent', 'Important', 'Medium', 'Low')),
  due_date    DATE,
  status      TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'logged')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_priority_tasks_user_id ON priority_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_priority_tasks_status  ON priority_tasks(status);
ALTER TABLE priority_tasks DISABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_priority_tasks_updated_at ON priority_tasks;
CREATE TRIGGER update_priority_tasks_updated_at
  BEFORE UPDATE ON priority_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═════════════════════════════════════════════════════════════
-- SECTION D: CONFIGURATION TABLES
-- ═════════════════════════════════════════════════════════════

-- ── TABLE: app_settings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL DEFAULT '',
  label      TEXT,
  updated_by UUID        REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO app_settings (key, value, label) VALUES
  ('war_days_off',          '0',          'War Days Off (legacy)'),
  ('tracker_start_date',    '2026-03-03', 'Tracker Start Date'),
  ('category_name_support', 'Support',    'Support Category Label'),
  ('category_name_testing', 'Testing',    'Testing Category Label'),
  ('category_name_project', 'Project',    'Project Category Label'),
  ('emailjs_service_id',    '',           'EmailJS Service ID'),
  ('emailjs_template_id',   '',           'EmailJS Template ID'),
  ('emailjs_public_key',    '',           'EmailJS Public Key')
ON CONFLICT (key) DO NOTHING;


-- ── TABLE: support_subcategories ──────────────────────────────
CREATE TABLE IF NOT EXISTS support_subcategories (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE support_subcategories DISABLE ROW LEVEL SECURITY;

INSERT INTO support_subcategories (name, sort_order) VALUES
  ('User Support',      1),
  ('D365 User Support', 2),
  ('Report Support',    3)
ON CONFLICT (name) DO NOTHING;


-- ── TABLE: testing_subcategories ──────────────────────────────
CREATE TABLE IF NOT EXISTS testing_subcategories (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE testing_subcategories DISABLE ROW LEVEL SECURITY;

INSERT INTO testing_subcategories (name, sort_order) VALUES
  ('Hardware Testing', 1),
  ('Software Testing', 2)
ON CONFLICT (name) DO NOTHING;


-- ── TABLE: project_subcategories ──────────────────────────────
CREATE TABLE IF NOT EXISTS project_subcategories (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT        NOT NULL UNIQUE,
  sort_order INTEGER     DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE project_subcategories DISABLE ROW LEVEL SECURITY;

INSERT INTO project_subcategories (name, sort_order) VALUES
  ('Development',    1),
  ('Implementation', 2),
  ('Planning',       3),
  ('Documentation',  4)
ON CONFLICT (name) DO NOTHING;


-- ── TABLE: employee_leaves ────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_leaves (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  reason     TEXT        DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employee_leaves_user_id ON employee_leaves(user_id);
ALTER TABLE employee_leaves DISABLE ROW LEVEL SECURITY;


-- ── TABLE: war_day_ranges ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS war_day_ranges (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  label      TEXT        DEFAULT 'War / Conflict',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE war_day_ranges DISABLE ROW LEVEL SECURITY;


-- ═════════════════════════════════════════════════════════════
-- DONE ✅
-- ═════════════════════════════════════════════════════════════
-- Tables created:
--   users, projects, milestones, risks,
--   task_logs (with project_id FK), priority_tasks,
--   app_settings, support_subcategories,
--   testing_subcategories, project_subcategories,
--   employee_leaves, war_day_ranges
--
-- Default login:
--   Username : admin
--   Password : Admin@123
--
-- NEW: task_logs.project_id links work logs to projects
-- ═════════════════════════════════════════════════════════════
