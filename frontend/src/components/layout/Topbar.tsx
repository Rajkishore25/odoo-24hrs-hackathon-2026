import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Bell, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface TopbarProps {
  title?: string;
}

const PAYROLL_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'];

export function Topbar({ title }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { notifications, criticalTotal, warningTotal, hasUnread } = useNotifications();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isPayrollRole = user && PAYROLL_ROLES.includes(user.role);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {title ? (
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        {/* Notification bell — only for payroll roles */}
        {isPayrollRole && (
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() => setOpen((o) => !o)}
              className="relative"
            >
              <Bell className="h-4 w-4" />
              {/* Red dot — only when there are critical issues */}
              {criticalTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-critical opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-critical" />
                </span>
              )}
              {/* Orange dot for warnings only */}
              {criticalTotal === 0 && warningTotal > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warning" />
              )}
            </Button>

            {/* Dropdown */}
            {open && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border bg-card shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">Payroll Notifications</p>
                  {(criticalTotal > 0 || warningTotal > 0) && (
                    <div className="flex gap-2 text-xs">
                      {criticalTotal > 0 && (
                        <span className="flex items-center gap-1 font-semibold text-critical">
                          <XCircle className="h-3 w-3" />
                          {criticalTotal} critical
                        </span>
                      )}
                      {warningTotal > 0 && (
                        <span className="flex items-center gap-1 text-warning">
                          <AlertTriangle className="h-3 w-3" />
                          {warningTotal} warnings
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <Bell className="h-8 w-8 text-muted-foreground opacity-30" />
                      <p className="text-sm text-muted-foreground">No payroll issues</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.payrunId}
                        className="w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent transition-colors"
                        onClick={() => {
                          navigate(`/payruns/${notif.payrunId}/validation`);
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notif.payrunName}
                            </p>
                            <div className="flex gap-3 text-xs">
                              {notif.criticalCount > 0 && (
                                <span className="flex items-center gap-1 font-semibold text-critical">
                                  <XCircle className="h-3 w-3 shrink-0" />
                                  {notif.criticalCount} critical
                                </span>
                              )}
                              {notif.warningCount > 0 && (
                                <span className="flex items-center gap-1 text-warning">
                                  <AlertTriangle className="h-3 w-3 shrink-0" />
                                  {notif.warningCount} warnings
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {notif.criticalCount > 0
                                ? 'Payrun is blocked — resolve critical issues'
                                : 'Review warnings before finalizing'}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <>
                    <Separator />
                    <button
                      className="w-full px-4 py-2.5 text-xs text-primary font-medium hover:bg-accent transition-colors rounded-b-lg text-center"
                      onClick={() => { navigate('/payruns'); setOpen(false); }}
                    >
                      View all payruns
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Non-payroll roles get a plain bell (no notifications) */}
        {!isPayrollRole && (
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
