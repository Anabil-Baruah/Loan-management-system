import { useState } from 'react';
import { Shield, Search, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
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
import { mockCollaterals } from '@/lib/mockData';
import type { MutualFundUnit } from '@/types';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function CollateralManagement() {
  const [collaterals, setCollaterals] = useState<MutualFundUnit[]>(mockCollaterals);
  const [searchQuery, setSearchQuery] = useState('');
  const [lienFilter, setLienFilter] = useState<string>('all');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredCollaterals = collaterals.filter((c) => {
    const matchesSearch = 
      c.fundName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.folioNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.amcName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLien = lienFilter === 'all' || c.lienStatus === lienFilter;
    const matchesScheme = schemeFilter === 'all' || c.schemeType === schemeFilter;
    
    return matchesSearch && matchesLien && matchesScheme;
  });

  const totalValue = collaterals.reduce((sum, c) => sum + c.currentValue, 0);
  const markedValue = collaterals
    .filter(c => c.lienStatus === 'marked')
    .reduce((sum, c) => sum + c.currentValue, 0);

  const handleUpdateNAV = async () => {
    setIsUpdating(true);
    
    // Simulate NAV update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random NAV changes
    setCollaterals(collaterals.map(c => ({
      ...c,
      navPerUnit: c.navPerUnit * (1 + (Math.random() - 0.5) * 0.02),
      currentValue: c.units * c.navPerUnit * (1 + (Math.random() - 0.5) * 0.02),
    })));
    
    setIsUpdating(false);
    toast.success('NAV updated successfully', {
      description: 'All mutual fund NAVs have been refreshed.',
    });
  };

  const columns: Column<MutualFundUnit>[] = [
    {
      key: 'fundName',
      header: 'Fund Name',
      render: (item) => (
        <div>
          <p className="font-medium">{item.fundName}</p>
          <p className="text-xs text-muted-foreground">{item.amcName}</p>
        </div>
      ),
    },
    {
      key: 'folioNumber',
      header: 'Folio Number',
      render: (item) => (
        <span className="font-mono text-sm">{item.folioNumber}</span>
      ),
    },
    {
      key: 'schemeType',
      header: 'Scheme Type',
      render: (item) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.schemeType === 'equity' ? 'bg-accent/10 text-accent' :
          item.schemeType === 'debt' ? 'bg-primary/10 text-primary' :
          item.schemeType === 'liquid' ? 'bg-success/10 text-success' :
          'bg-warning/10 text-warning'
        }`}>
          {item.schemeType.charAt(0).toUpperCase() + item.schemeType.slice(1)}
        </span>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      render: (item) => item.units.toFixed(3),
    },
    {
      key: 'navPerUnit',
      header: 'NAV',
      render: (item) => `₹${item.navPerUnit.toFixed(2)}`,
    },
    {
      key: 'currentValue',
      header: 'Current Value',
      render: (item) => (
        <span className="font-medium">{formatCurrency(item.currentValue)}</span>
      ),
    },
    {
      key: 'lienStatus',
      header: 'Lien Status',
      render: (item) => <StatusBadge status={item.lienStatus} />,
    },
    {
      key: 'isin',
      header: 'ISIN',
      render: (item) => (
        <span className="font-mono text-xs text-muted-foreground">{item.isin}</span>
      ),
    },
  ];

  const lienOptions = [
    { value: 'all', label: 'All Lien Status' },
    { value: 'none', label: 'No Lien' },
    { value: 'marked', label: 'Lien Marked' },
    { value: 'released', label: 'Released' },
  ];

  const schemeOptions = [
    { value: 'all', label: 'All Schemes' },
    { value: 'equity', label: 'Equity' },
    { value: 'debt', label: 'Debt' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'liquid', label: 'Liquid' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Collateral Management"
        subtitle="Track and manage mutual fund collaterals"
        actions={
          <Button onClick={handleUpdateNAV} disabled={isUpdating}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {isUpdating ? 'Updating...' : 'Update NAV'}
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Shield className="h-4 w-4" />
            Total Collaterals
          </div>
          <p className="text-2xl font-bold">{collaterals.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            Total Value
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />
            Lien Marked Value
          </div>
          <p className="text-2xl font-bold">{formatCurrency(markedValue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            Available
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalValue - markedValue)}</p>
        </div>
      </div>

      {/* Scheme Distribution */}
      <div className="grid grid-cols-4 gap-4">
        {['equity', 'debt', 'hybrid', 'liquid'].map((scheme) => {
          const schemeCollaterals = collaterals.filter(c => c.schemeType === scheme);
          const schemeValue = schemeCollaterals.reduce((sum, c) => sum + c.currentValue, 0);
          const percentage = totalValue > 0 ? (schemeValue / totalValue) * 100 : 0;
          
          return (
            <div 
              key={scheme}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                schemeFilter === scheme 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border bg-card hover:border-accent/50'
              }`}
              onClick={() => setSchemeFilter(schemeFilter === scheme ? 'all' : scheme)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium capitalize">{scheme}</span>
                <span className="text-xs text-muted-foreground">{schemeCollaterals.length} funds</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(schemeValue)}</p>
              <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by fund name, folio, or AMC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={lienFilter} onValueChange={setLienFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lienOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={schemeFilter} onValueChange={setSchemeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schemeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredCollaterals.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No collaterals found"
          description="Try adjusting your search or filter criteria."
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredCollaterals}
          keyExtractor={(item) => item._id}
        />
      )}
    </div>
  );
}
