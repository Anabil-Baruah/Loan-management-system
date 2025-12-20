import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Search, Filter, Eye } from 'lucide-react';
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
import { mockApplications } from '@/lib/mockData';
import type { LoanApplication, ApplicationStatus } from '@/types';

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

export default function LoanApplications() {
  const navigate = useNavigate();
  const [applications] = useState<LoanApplication[]>(mockApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns: Column<LoanApplication>[] = [
    {
      key: 'applicationNumber',
      header: 'Application ID',
      render: (item) => (
        <span className="font-mono text-sm font-medium text-accent">
          {item.applicationNumber}
        </span>
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
      key: 'product',
      header: 'Product',
      render: (item) => (
        <span className="text-sm">
          {typeof item.loanProduct === 'object' ? item.loanProduct.name : 'N/A'}
        </span>
      ),
    },
    {
      key: 'requestedAmount',
      header: 'Requested Amount',
      render: (item) => (
        <span className="font-medium">{formatCurrency(item.requestedAmount)}</span>
      ),
    },
    {
      key: 'tenure',
      header: 'Tenure',
      render: (item) => `${item.tenure} months`,
    },
    {
      key: 'ltv',
      header: 'LTV',
      render: (item) => (
        <span className={item.ltv > 50 ? 'text-warning font-medium' : ''}>
          {item.ltv.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (item) => formatDate(item.createdAt),
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
            navigate(`/applications/${item._id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      className: 'w-12',
    },
  ];

  const statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'disbursed', label: 'Disbursed' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Loan Applications"
        subtitle="View and manage all loan applications"
        actions={
          <Button onClick={() => navigate('/applications/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, name, or email..."
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {statusOptions.slice(1).map((status) => {
          const count = applications.filter(a => a.status === status.value).length;
          return (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`p-4 rounded-lg border transition-all ${
                statusFilter === status.value 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border bg-card hover:border-accent/50'
              }`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{status.label}</p>
            </button>
          );
        })}
      </div>

      {filteredApplications.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No applications found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first loan application.'
          }
          actionLabel={!searchQuery && statusFilter === 'all' ? 'Create Application' : undefined}
          onAction={!searchQuery && statusFilter === 'all' ? () => navigate('/applications/new') : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredApplications}
          keyExtractor={(item) => item._id}
          onRowClick={(item) => navigate(`/applications/${item._id}`)}
        />
      )}
    </div>
  );
}
