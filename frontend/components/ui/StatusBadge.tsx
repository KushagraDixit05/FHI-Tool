import { cn } from '@/lib/utils';
import { STATUS_LABELS, STATUS_COLORS } from '@/constants';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  const colorClass = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}

interface RoleBadgeProps {
  role: string;
  className?: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  TRADE_MANAGER: 'bg-blue-100 text-blue-800',
  SALES: 'bg-green-100 text-green-800',
  FINANCE: 'bg-purple-100 text-purple-800',
  OPERATIONS: 'bg-orange-100 text-orange-800',
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const label = role.replace(/_/g, ' ');
  const colorClass = ROLE_COLORS[role] ?? 'bg-slate-100 text-slate-700';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
