import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Wallet, 
  TrendingUp, 
  Shield,
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { mockDashboardStats, mockApplications, mockOngoingLoans } from '@/lib/mockData';
import type { LoanApplication, OngoingLoan } from '@/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const recentApplicationColumns: Column<LoanApplication>[] = [
  {
    key: 'applicationNumber',
    header: 'Application ID',
    render: (item) => (
      <span className="font-mono text-sm font-medium">{item.applicationNumber}</span>
    ),
  },
  {
    key: 'applicant',
    header: 'Applicant',
    render: (item) => (
      <div>
        <p className="font-medium">{item.applicant.name}</p>
        <p className="text-xs text-muted-foreground">{item.applicant.email}</p>
      </div>
    ),
  },
  {
    key: 'requestedAmount',
    header: 'Amount',
    render: (item) => formatCurrency(item.requestedAmount),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => <StatusBadge status={item.status} />,
  },
  {
    key: 'createdAt',
    header: 'Date',
    render: (item) => formatDate(item.createdAt),
  },
];

const activeLoansColumns: Column<OngoingLoan>[] = [
  {
    key: 'loanNumber',
    header: 'Loan ID',
    render: (item) => (
      <span className="font-mono text-sm font-medium">{item.loanNumber}</span>
    ),
  },
  {
    key: 'applicant',
    header: 'Borrower',
    render: (item) => item.applicant.name,
  },
  {
    key: 'outstandingAmount',
    header: 'Outstanding',
    render: (item) => formatCurrency(item.outstandingAmount),
  },
  {
    key: 'nextEmiDate',
    header: 'Next EMI',
    render: (item) => formatDate(item.nextEmiDate),
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => <StatusBadge status={item.status} />,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const stats = mockDashboardStats;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of your loan management system"
        actions={
          <Button onClick={() => navigate('/applications/new')}>
            <FileText className="mr-2 h-4 w-4" />
            New Application
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Applications"
          value={stats.totalApplications}
          subtitle={`${stats.pendingApplications} pending review`}
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Loans"
          value={stats.activeLoans}
          subtitle={`${stats.overdueLoans} overdue`}
          icon={Wallet}
          variant="accent"
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats.totalDisbursed)}
          subtitle="This financial year"
          icon={IndianRupee}
          variant="success"
        />
        <StatCard
          title="Collateral Value"
          value={formatCurrency(stats.totalCollateralValue)}
          subtitle={`Avg LTV: ${stats.averageLTV}%`}
          icon={Shield}
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.approvedApplications}</p>
            <p className="text-sm text-muted-foreground">Approved Applications</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.pendingApplications}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <TrendingUp className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalOutstanding)}</p>
            <p className="text-sm text-muted-foreground">Outstanding Amount</p>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Applications</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/applications')}
              className="text-accent hover:text-accent"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <DataTable
            columns={recentApplicationColumns}
            data={mockApplications.slice(0, 5)}
            keyExtractor={(item) => item._id}
            onRowClick={(item) => navigate(`/applications/${item._id}`)}
          />
        </div>

        {/* Active Loans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Loans</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/loans')}
              className="text-accent hover:text-accent"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <DataTable
            columns={activeLoansColumns}
            data={mockOngoingLoans}
            keyExtractor={(item) => item._id}
            onRowClick={(item) => navigate(`/loans/${item._id}`)}
          />
        </div>
      </div>

      {/* Alerts Section */}
      {stats.overdueLoans > 0 && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div className="flex-1">
            <p className="font-medium text-destructive">Attention Required</p>
            <p className="text-sm text-muted-foreground">
              {stats.overdueLoans} loan(s) have overdue EMI payments. Immediate action recommended.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/loans?status=overdue')}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            View Overdue Loans
          </Button>
        </div>
      )}
    </div>
  );
}
