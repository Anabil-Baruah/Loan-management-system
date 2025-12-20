import { cn } from '@/lib/utils';
import type { ApplicationStatus, LoanStatus } from '@/types';

type Status = ApplicationStatus | LoanStatus | string;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Application statuses
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Submitted', className: 'bg-accent/10 text-accent' },
  under_review: { label: 'Under Review', className: 'bg-warning/10 text-warning' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
  disbursed: { label: 'Disbursed', className: 'bg-primary/10 text-primary' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground' },
  
  // Loan statuses
  active: { label: 'Active', className: 'bg-success/10 text-success' },
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive' },
  defaulted: { label: 'Defaulted', className: 'bg-destructive/20 text-destructive' },
  
  // Lien statuses
  none: { label: 'No Lien', className: 'bg-muted text-muted-foreground' },
  marked: { label: 'Lien Marked', className: 'bg-warning/10 text-warning' },
  released: { label: 'Released', className: 'bg-success/10 text-success' },
  
  // EMI statuses
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning' },
  paid: { label: 'Paid', className: 'bg-success/10 text-success' },
  
  // Product statuses
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '), 
    className: 'bg-muted text-muted-foreground' 
  };

  return (
    <span className={cn(
      'status-badge',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
