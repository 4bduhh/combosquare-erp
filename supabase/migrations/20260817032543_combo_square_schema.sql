/*
# Combo Square — Company Management Schema

1. Overview
This migration creates the complete backend schema for the Combo Square internal
management web app. The app requires admin sign-in, so all tables are owner-scoped
to the authenticated admin via a `user_id` column defaulting to `auth.uid()`.

2. New Tables
- `employees` — staff records with role, salary, commission, and monthly target.
  Columns: id, user_id, name, role, email, phone, photo_url, joining_date, salary,
  commission_type ('percentage'|'fixed'), commission_value, monthly_target, created_at.
- `revenue` — income entries per client/project with service type and payment status.
  Columns: id, user_id, client_name, project_name, service_type, amount, date,
  payment_status ('paid'|'pending'), created_at.
- `expenses` — company expense entries by category.
  Columns: id, user_id, category, description, amount, date, created_at.
- `projects` — project tracking with assignment, status, and value.
  Columns: id, user_id, client_name, project_name, service_type, assigned_employee_ids
  (uuid[]), start_date, deadline, status ('todo'|'in_progress'|'completed'),
  amount, created_at.
- `targets` — monthly company-wide targets.
  Columns: id, user_id, month (1-12), year, revenue_target, projects_target,
  clients_target, created_at.
- `company_settings` — single-row-per-admin company profile info.
  Columns: id, user_id, company_name, tagline, email, phone, address, logo_url,
  updated_at.

3. Security
- RLS enabled on every table.
- Each table has 4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE) scoped
  TO authenticated using auth.uid() = user_id.
- Owner columns default to auth.uid() so inserts omitting user_id succeed.

4. Notes
- No default/dummy/sample data is inserted. All tables start empty.
- service_type values: 'branding', 'graphics', 'web_static', 'web_dynamic',
  'web_ecommerce', 'app_ios', 'app_android', 'video_editing'.
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  photo_url text,
  joining_date date,
  salary numeric(12,2) NOT NULL DEFAULT 0,
  commission_type text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage','fixed')),
  commission_value numeric(12,2) NOT NULL DEFAULT 0,
  monthly_target integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS employees_user_id_idx ON employees(user_id);

CREATE TABLE IF NOT EXISTS revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  project_name text NOT NULL,
  service_type text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid','pending')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS revenue_user_id_idx ON revenue(user_id);
CREATE INDEX IF NOT EXISTS revenue_date_idx ON revenue(date);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS expenses_user_id_idx ON expenses(user_id);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  project_name text NOT NULL,
  service_type text NOT NULL,
  assigned_employee_ids uuid[] NOT NULL DEFAULT '{}',
  start_date date,
  deadline date,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','completed')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

CREATE TABLE IF NOT EXISTS targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  revenue_target numeric(12,2) NOT NULL DEFAULT 0,
  projects_target integer NOT NULL DEFAULT 0,
  clients_target integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, month, year)
);
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS targets_user_id_idx ON targets(user_id);

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT 'Combo Square',
  tagline text,
  email text,
  phone text,
  address text,
  logo_url text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS company_settings_user_id_idx ON company_settings(user_id);

-- Policies for employees
DROP POLICY IF EXISTS "select_own_employees" ON employees;
CREATE POLICY "select_own_employees" ON employees FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_employees" ON employees;
CREATE POLICY "insert_own_employees" ON employees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_employees" ON employees;
CREATE POLICY "update_own_employees" ON employees FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_employees" ON employees;
CREATE POLICY "delete_own_employees" ON employees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for revenue
DROP POLICY IF EXISTS "select_own_revenue" ON revenue;
CREATE POLICY "select_own_revenue" ON revenue FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_revenue" ON revenue;
CREATE POLICY "insert_own_revenue" ON revenue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_revenue" ON revenue;
CREATE POLICY "update_own_revenue" ON revenue FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_revenue" ON revenue;
CREATE POLICY "delete_own_revenue" ON revenue FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for expenses
DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for projects
DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for targets
DROP POLICY IF EXISTS "select_own_targets" ON targets;
CREATE POLICY "select_own_targets" ON targets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_targets" ON targets;
CREATE POLICY "insert_own_targets" ON targets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_targets" ON targets;
CREATE POLICY "update_own_targets" ON targets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_targets" ON targets;
CREATE POLICY "delete_own_targets" ON targets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Policies for company_settings
DROP POLICY IF EXISTS "select_own_company_settings" ON company_settings;
CREATE POLICY "select_own_company_settings" ON company_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_company_settings" ON company_settings;
CREATE POLICY "insert_own_company_settings" ON company_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_company_settings" ON company_settings;
CREATE POLICY "update_own_company_settings" ON company_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_company_settings" ON company_settings;
CREATE POLICY "delete_own_company_settings" ON company_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);