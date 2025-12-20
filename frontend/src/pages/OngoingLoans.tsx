import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { mockOngoingLoans } from '@/lib/mockData';
import type { OngoingLoan } from '@/types';

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

export default function OngoingLoans() {
  const navigate = useNavigate();
  const [loans] = useState<OngoingLoan[]>(mockOngoingLoans);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLoans = loans.filter((loan) => {
    const matchesSearch = 
      loan.loanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.applicant.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalDisbursed = loans.reduce((sum, l) => sum + l.disbursedAmount, 0);
  const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingAmount, 0);
  const overdueCount = loans.filter(l => l.status === 'overdue').length;

  const columns: Column<OngoingLoan>[] = [
    {
      key: 'loanNumber',
      header: 'Loan ID',
      render: (item) => (
        <span className="font-mono text-sm font-medium text-accent">
          {item.loanNumber}
        </span>
      ),
    },
    {
      key: 'applicant',
      header: 'Borrower',
      render: (item) => (
        <div>
          <p className="font-medium">{item.applicant.name}</p>
          <p className="text-xs text-muted-foreground">{item.applicant.phone}</p>
        </div>
      ),
    },
    {
      key: 'amounts',
      header: 'Disbursed / Outstanding',
      render: (item) => {
        const repaidPercent = ((item.disbursedAmount - item.outstandingAmount) / item.disbursedAmount) * 100;
        return (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{formatCurrency(item.outstandingAmount)}</span>
              <span className="text-muted-foreground">of {formatCurrency(item.disbursedAmount)}</span>
            </div>
            <Progress value={repaidPercent} className="h-1.5" />
          </div>
        );
      },
    },
    {
      key: 'emi',
      header: 'EMI',
      render: (item) => (
        <div>
          <p className="font-medium">{formatCurrency(item.emiAmount)}</p>
          <p className="text-xs text-muted-foreground">{item.tenure} months</p>
        </div>
      ),
    },
    {
      key: 'nextEmiDate',
      header: 'Next EMI Date',
      render: (item) => {
        const isOverdue = new Date(item.nextEmiDate) < new Date() && item.status === 'overdue';
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {formatDate(item.nextEmiDate)}
          </span>
        );
      },
    },
    {
      key: 'currentLTV',
      header: 'Current LTV',
      render: (item) => (
        <span className={item.currentLTV > 60 ? 'text-warning font-medium' : ''}>
          {item.currentLTV.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/loans/${item._id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: 'w-12',
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'closed', label: 'Closed' },
    { value: 'defaulted', label: 'Defaulted' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ongoing Loans"
        subtitle="Monitor active loans and EMI schedules"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Loans</p>
          <p className="text-2xl font-bold mt-1">{loans.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Disbursed</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalDisbursed)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${
          overdueCount > 0 
            ? 'bg-destructive/5 border-destructive/20' 
            : 'bg-card border-border'
        }`}>
          <p className="text-sm text-muted-foreground">Overdue Loans</p>
          <div className="flex items-center gap-2 mt-1">
            {overdueCount > 0 && <AlertTriangle className="h-5 w-5 text-destructive" />}
            <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-destructive' : ''}`}>
              {overdueCount}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by loan ID or borrower name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredLoans.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No loans found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No ongoing loans at the moment.'
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredLoans}
          keyExtractor={(item) => item._id}
          onRowClick={(item) => navigate(`/loans/${item._id}`)}
        />
      )}
    </div>
  );
}
