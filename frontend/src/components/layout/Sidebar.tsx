import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Calendar, Clock, Umbrella,
  DollarSign, PlayCircle, Receipt, ScrollText, LogOut,
  User, UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },

  // HR workspace — no Payruns, Payslips, or Audit Logs for HR_MANAGER
  { label: 'Employees',    href: '/employees',    icon: Users,       roles: ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'] },
  { label: 'Contracts',    href: '/contracts',    icon: FileText,    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'] },
  { label: 'Schedules',    href: '/schedules',    icon: Calendar,    roles: ['SUPER_ADMIN', 'HR_MANAGER'] },
  { label: 'Attendance',   href: '/attendance',   icon: Clock,       roles: ['SUPER_ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'PAYROLL_OFFICER'] },
  { label: 'Time Off',     href: '/time-off',     icon: Umbrella,    roles: ['SUPER_ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'PAYROLL_OFFICER'] },

  // HR profile — leave balance & request leave (HR only)
  { label: 'My Profile',   href: '/hr-profile',   icon: UserCircle,  roles: ['HR_MANAGER'] },

  // Payroll workspace — not for HR_MANAGER
  { label: 'Salary',       href: '/salary',       icon: DollarSign,  roles: ['SUPER_ADMIN', 'PAYROLL_OFFICER'] },
  { label: 'Payruns',      href: '/payruns',      icon: PlayCircle,  roles: ['SUPER_ADMIN', 'PAYROLL_OFFICER'] },
  { label: 'Payslips',     href: '/payslips',     icon: Receipt,     roles: ['SUPER_ADMIN', 'PAYROLL_OFFICER'] },
  { label: 'Audit Logs',   href: '/audit-logs',   icon: ScrollText,  roles: ['SUPER_ADMIN', 'PAYROLL_OFFICER'] },

  // Employee self-service
  { label: 'My Portal',    href: '/portal',       icon: User,        roles: ['EMPLOYEE'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    HR_MANAGER: 'HR Manager',
    PAYROLL_OFFICER: 'Payroll Officer',
    LINE_MANAGER: 'Line Manager',
    EMPLOYEE: 'Employee',
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-lg font-bold text-foreground tracking-tight">
          People<span className="text-primary">Pay</span>360
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      {/* User info + logout */}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
            {user?.email?.[0].toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
            <p className="text-xs text-muted-foreground">{roleLabel[user?.role ?? ''] ?? user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
