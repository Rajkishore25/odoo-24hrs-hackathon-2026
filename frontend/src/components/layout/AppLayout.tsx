import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/contracts': 'Contracts',
  '/schedules': 'Working Schedules',
  '/attendance': 'Attendance',
  '/time-off': 'Time Off',
  '/hr-profile': 'My Profile',
  '/salary': 'Salary Structures',
  '/payruns': 'Payruns',
  '/payslips': 'Payslips',
  '/audit-logs': 'Audit Logs',
  '/portal': 'My Portal',
};

function getTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Prefix match
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return title;
  }
  return 'PeoplePay360';
}

export function AppLayout() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
