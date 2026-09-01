/*
# Combo Square — Attendance Schema

1. Overview
This migration adds daily employee attendance tracking to the Combo Square
management app. Like all other tables, it is owner-scoped to the authenticated
admin via a `user_id` column defaulting to `auth.uid()`.

2. New Tables
- `attendance` — one row per employee per day marking their status.
  Columns: id, user_id, employee_id (references employees), date,
  status ('present'|'absent'|'half_day'|'leave'), notes, created_at.
  A unique constraint on (employee_id, date) ensures only one status per
  employee per day — marking a new status for the same day updates the
  existing row instead of creating a duplicate.

3. Security
- RLS enabled on the table.
- 4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE) scoped
  TO authenticated using auth.uid() = user_id.
- Owner column defaults to auth.uid() so inserts omitting user_id succeed.

4. Notes
- No default/dummy/sample data is inserted. Table starts empty.
- If an employee is deleted, their attendance history is deleted too
  (ON DELETE CASCADE via employee_id).
*/

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','half_day','leave')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (employee_id, date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS attendance_user_id_idx ON attendance(user_id);
CREATE INDEX IF NOT EXISTS attendance_employee_id_idx ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance(date);

-- Policies for attendance
DROP POLICY IF EXISTS "select_own_attendance" ON attendance;
CREATE POLICY "select_own_attendance" ON attendance FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_attendance" ON attendance;
CREATE POLICY "insert_own_attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_attendance" ON attendance;
CREATE POLICY "update_own_attendance" ON attendance FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_attendance" ON attendance;
CREATE POLICY "delete_own_attendance" ON attendance FOR DELETE TO authenticated USING (auth.uid() = user_id);