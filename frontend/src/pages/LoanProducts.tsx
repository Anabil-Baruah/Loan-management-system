import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Edit, Trash2, MoreVertical } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockLoanProducts } from '@/lib/mockData';
import type { LoanProduct } from '@/types';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function LoanProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<LoanProduct[]>(mockLoanProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    interestRate: '',
    minAmount: '',
    maxAmount: '',
    minTenure: '',
    maxTenure: '',
    maxLTV: '',
    processingFee: '',
    status: 'active' as 'active' | 'inactive',
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      interestRate: '',
      minAmount: '',
      maxAmount: '',
      minTenure: '',
      maxTenure: '',
      maxLTV: '',
      processingFee: '',
      status: 'active',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: LoanProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      interestRate: product.interestRate.toString(),
      minAmount: product.minAmount.toString(),
      maxAmount: product.maxAmount.toString(),
      minTenure: product.minTenure.toString(),
      maxTenure: product.maxTenure.toString(),
      maxLTV: product.maxLTV.toString(),
      processingFee: product.processingFee.toString(),
      status: product.status,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p._id === editingProduct._id 
          ? { 
              ...p, 
              ...formData, 
              interestRate: parseFloat(formData.interestRate),
              minAmount: parseFloat(formData.minAmount),
              maxAmount: parseFloat(formData.maxAmount),
              minTenure: parseInt(formData.minTenure),
              maxTenure: parseInt(formData.maxTenure),
              maxLTV: parseFloat(formData.maxLTV),
              processingFee: parseFloat(formData.processingFee),
              updatedAt: new Date().toISOString(),
            } 
          : p
      ));
      toast.success('Loan product updated successfully');
    } else {
      const newProduct: LoanProduct = {
        _id: `prod_${Date.now()}`,
        ...formData,
        interestRate: parseFloat(formData.interestRate),
        minAmount: parseFloat(formData.minAmount),
        maxAmount: parseFloat(formData.maxAmount),
        minTenure: parseInt(formData.minTenure),
        maxTenure: parseInt(formData.maxTenure),
        maxLTV: parseFloat(formData.maxLTV),
        processingFee: parseFloat(formData.processingFee),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);
      toast.success('Loan product created successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p._id !== id));
    toast.success('Loan product deleted');
  };

  const columns: Column<LoanProduct>[] = [
    {
      key: 'name',
      header: 'Product Name',
      render: (item) => (
        <div>
          <p className="font-medium">{item.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'interestRate',
      header: 'Interest Rate',
      render: (item) => <span className="font-medium">{item.interestRate}% p.a.</span>,
    },
    {
      key: 'loanRange',
      header: 'Loan Range',
      render: (item) => (
        <span className="text-sm">
          {formatCurrency(item.minAmount)} - {formatCurrency(item.maxAmount)}
        </span>
      ),
    },
    {
      key: 'tenure',
      header: 'Tenure',
      render: (item) => `${item.minTenure} - ${item.maxTenure} months`,
    },
    {
      key: 'maxLTV',
      header: 'Max LTV',
      render: (item) => `${item.maxLTV}%`,
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleDelete(item._id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Loan Products"
        subtitle="Manage your LAMF loan products and configurations"
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No loan products"
          description="Get started by creating your first loan product. Define interest rates, loan limits, and other parameters."
          actionLabel="Create Product"
          onAction={handleOpenCreate}
        />
      ) : (
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(item) => item._id}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the loan product details below.' 
                : 'Fill in the details to create a new loan product.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard LAMF"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the loan product"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Interest Rate (% p.a.)</Label>
              <Input
                id="interestRate"
                type="number"
                step="0.1"
                value={formData.interestRate}
                onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                placeholder="10.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processingFee">Processing Fee (%)</Label>
              <Input
                id="processingFee"
                type="number"
                step="0.1"
                value={formData.processingFee}
                onChange={(e) => setFormData({ ...formData, processingFee: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Loan Amount (₹)</Label>
              <Input
                id="minAmount"
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Loan Amount (₹)</Label>
              <Input
                id="maxAmount"
                type="number"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                placeholder="5000000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minTenure">Min Tenure (months)</Label>
              <Input
                id="minTenure"
                type="number"
                value={formData.minTenure}
                onChange={(e) => setFormData({ ...formData, minTenure: e.target.value })}
                placeholder="6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTenure">Max Tenure (months)</Label>
              <Input
                id="maxTenure"
                type="number"
                value={formData.maxTenure}
                onChange={(e) => setFormData({ ...formData, maxTenure: e.target.value })}
                placeholder="36"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLTV">Max LTV (%)</Label>
              <Input
                id="maxLTV"
                type="number"
                value={formData.maxLTV}
                onChange={(e) => setFormData({ ...formData, maxLTV: e.target.value })}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
