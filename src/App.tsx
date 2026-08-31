import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { Sidebar, type PageKey } from '@/components/Sidebar';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { RevenuePage } from '@/pages/RevenuePage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TargetsPage } from '@/pages/TargetsPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E8E5F0] border-t-[#7653B8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'employees': return <EmployeesPage />;
      case 'revenue': return <RevenuePage />;
      case 'expenses': return <ExpensesPage />;
      case 'projects': return <ProjectsPage />;
      case 'targets': return <TargetsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div key={page} className="animate-fade-in min-h-screen bg-[#F8F7FC]">
      <Sidebar current={page} onNavigate={setPage} />
      {renderPage()}
    </div>
  );
}

export default App;
