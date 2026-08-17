export type ServiceType =
  | 'branding'
  | 'graphics'
  | 'web_static'
  | 'web_dynamic'
  | 'web_ecommerce'
  | 'app_ios'
  | 'app_android'
  | 'video_editing';

export type PaymentStatus = 'paid' | 'pending';
export type ProjectStatus = 'todo' | 'in_progress' | 'completed';
export type CommissionType = 'percentage' | 'fixed';

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  joining_date: string | null;
  salary: number;
  commission_type: CommissionType;
  commission_value: number;
  monthly_target: number;
  created_at: string;
}

export interface RevenueEntry {
  id: string;
  user_id: string;
  client_name: string;
  project_name: string;
  service_type: ServiceType;
  amount: number;
  date: string;
  payment_status: PaymentStatus;
  created_at: string;
}

export interface ExpenseEntry {
  id: string;
  user_id: string;
  category: string;
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
}

export interface ProjectEntry {
  id: string;
  user_id: string;
  client_name: string;
  project_name: string;
  service_type: ServiceType;
  assigned_employee_ids: string[];
  start_date: string | null;
  deadline: string | null;
  status: ProjectStatus;
  amount: number;
  created_at: string;
}

export interface TargetEntry {
  id: string;
  user_id: string;
  month: number;
  year: number;
  revenue_target: number;
  projects_target: number;
  clients_target: number;
  created_at: string;
}

export interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  tagline: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  updated_at: string;
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  branding: 'Branding',
  graphics: 'Graphics Design',
  web_static: 'Web (Static)',
  web_dynamic: 'Web (Dynamic)',
  web_ecommerce: 'E-Commerce',
  app_ios: 'App (iOS)',
  app_android: 'App (Android)',
  video_editing: 'Video Editing',
};

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Salaries',
  'Utilities',
  'Software Subscriptions',
  'Marketing',
  'Miscellaneous',
] as const;
