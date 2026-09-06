/**
 * NotificationContext
 * Fetches payroll validation issues for PAYROLL_OFFICER / HR_MANAGER roles.
 * Provides a red-dot count and a list of critical notifications to the Topbar.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { payrollApi } from '@/api/payroll';
import { useAuth } from '@/context/AuthContext';

export interface PayrollNotification {
  payrunId: string;
  payrunName: string;
  criticalCount: number;
  warningCount: number;
  canFinalize: boolean;
}

interface NotificationContextValue {
  notifications: PayrollNotification[];
  criticalTotal: number;
  warningTotal: number;
  hasUnread: boolean;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  criticalTotal: 0,
  warningTotal: 0,
  hasUnread: false,
  refresh: () => {},
});

const PAYROLL_ROLES = ['SUPER_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<PayrollNotification[]>([]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user || !PAYROLL_ROLES.includes(user.role)) return;

    try {
      const res = await payrollApi.listPayruns({ limit: '10' });
      const payruns = res.data.data.items ?? [];

      // Only check active (non-finalized) payruns
      const activePayruns = payruns.filter((pr: any) =>
        ['DRAFT', 'IN_PROGRESS', 'VALIDATED'].includes(pr.status)
      );

      const notifs: PayrollNotification[] = [];

      for (const pr of activePayruns) {
        try {
          const valRes = await payrollApi.validatePayrun(pr.id);
          const val = valRes.data.data;
          if (val.criticalCount > 0 || val.warningCount > 0) {
            notifs.push({
              payrunId: pr.id,
              payrunName: pr.name,
              criticalCount: val.criticalCount,
              warningCount: val.warningCount,
              canFinalize: val.canFinalize,
            });
          }
        } catch {
          // Skip if validation fails for a specific payrun
        }
      }

      setNotifications(notifs);
    } catch {
      // Silent fail — notifications are non-critical
    }
  }, [isAuthenticated, user]);

  // Load on mount and when user changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  const criticalTotal = notifications.reduce((s, n) => s + n.criticalCount, 0);
  const warningTotal = notifications.reduce((s, n) => s + n.warningCount, 0);
  const hasUnread = criticalTotal > 0 || warningTotal > 0;

  return (
    <NotificationContext.Provider value={{ notifications, criticalTotal, warningTotal, hasUnread, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
