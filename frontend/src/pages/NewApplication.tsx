import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { mockLoanProducts, mockCollaterals } from '@/lib/mockData';
import type { MutualFundUnit } from '@/types';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function NewApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [applicant, setApplicant] = useState({
    name: '',
    email: '',
    phone: '',
    pan: '',
    address: '',
    dateOfBirth: '',
  });

  const [loanDetails, setLoanDetails] = useState({
    loanProductId: '',
    requestedAmount: '',
    tenure: '',
  });

  const [selectedCollaterals, setSelectedCollaterals] = useState<MutualFundUnit[]>([]);
  const availableCollaterals = mockCollaterals.filter(c => c.lienStatus === 'none');

  const selectedProduct = mockLoanProducts.find(p => p._id === loanDetails.loanProductId);

  const totalCollateralValue = selectedCollaterals.reduce((sum, c) => sum + c.currentValue, 0);
  const requestedAmount = parseFloat(loanDetails.requestedAmount) || 0;
  const calculatedLTV = totalCollateralValue > 0 ? (requestedAmount / totalCollateralValue) * 100 : 0;
  const isLtvExceeded = calculatedLTV > (selectedProduct?.maxLTV ?? 100);

  const handleAddCollateral = (collateralId: string) => {
    const collateral = availableCollaterals.find(c => c._id === collateralId);
    if (collateral && !selectedCollaterals.find(c => c._id === collateralId)) {
      setSelectedCollaterals([...selectedCollaterals, collateral]);
    }
  };

  const handleRemoveCollateral = (collateralId: string) => {
    setSelectedCollaterals(selectedCollaterals.filter(c => c._id !== collateralId));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      return applicant.name && applicant.email && applicant.phone && applicant.pan;
    }
    if (currentStep === 2) {
      return loanDetails.loanProductId && loanDetails.requestedAmount && loanDetails.tenure;
    }
    if (currentStep === 3) {
      return selectedCollaterals.length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Application submitted successfully!', {
      description: 'Application ID: LAMF2024006',
    });
    
    navigate('/applications');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Loan Application"
        subtitle="Create a new loan application for LAMF"
        actions={
          <Button variant="outline" onClick={() => navigate('/applications')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
        }
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => s < step && setStep(s)}
              disabled={s > step}
              className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-all ${
                s === step
                  ? 'bg-accent text-accent-foreground'
                  : s < step
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <CheckCircle className="h-5 w-5" /> : s}
            </button>
            {s < 4 && (
              <div className={`h-1 w-16 mx-2 rounded ${
                s < step ? 'bg-success' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center text-sm text-muted-foreground mb-8">
        <span className={step === 1 ? 'text-accent font-medium' : ''}>Applicant</span>
        <span className="mx-8">→</span>
        <span className={step === 2 ? 'text-accent font-medium' : ''}>Loan Details</span>
        <span className="mx-8">→</span>
        <span className={step === 3 ? 'text-accent font-medium' : ''}>Collateral</span>
        <span className="mx-8">→</span>
        <span className={step === 4 ? 'text-accent font-medium' : ''}>Review</span>
      </div>

      {/* Step 1: Applicant Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Applicant Information</CardTitle>
            <CardDescription>Enter the borrower's personal details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={applicant.name}
                onChange={(e) => setApplicant({ ...applicant, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={applicant.email}
                onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={applicant.phone}
                onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pan">PAN Number *</Label>
              <Input
                id="pan"
                value={applicant.pan}
                onChange={(e) => setApplicant({ ...applicant, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={applicant.dateOfBirth}
                onChange={(e) => setApplicant({ ...applicant, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={applicant.address}
                onChange={(e) => setApplicant({ ...applicant, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Loan Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Select loan product and specify the amount</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Loan Product *</Label>
              <Select 
                value={loanDetails.loanProductId} 
                onValueChange={(v) => setLoanDetails({ ...loanDetails, loanProductId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a loan product" />
                </SelectTrigger>
                <SelectContent>
                  {mockLoanProducts.filter(p => p.status === 'active').map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground ml-4">{product.interestRate}% p.a.</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="col-span-2 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Product Details</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{selectedProduct.interestRate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Loan Range</p>
                    <p className="font-medium">
                      {formatCurrency(selectedProduct.minAmount)} - {formatCurrency(selectedProduct.maxAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tenure</p>
                    <p className="font-medium">{selectedProduct.minTenure} - {selectedProduct.maxTenure} months</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max LTV</p>
                    <p className="font-medium">{selectedProduct.maxLTV}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Requested Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={loanDetails.requestedAmount}
                onChange={(e) => setLoanDetails({ ...loanDetails, requestedAmount: e.target.value })}
                placeholder="500000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenure">Tenure (months) *</Label>
              <Input
                id="tenure"
                type="number"
                value={loanDetails.tenure}
                onChange={(e) => setLoanDetails({ ...loanDetails, tenure: e.target.value })}
                placeholder="24"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Collateral Selection */}
      {step === 3 && (
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Collaterals</CardTitle>
              <CardDescription>Select mutual fund units to pledge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {availableCollaterals.filter(c => !selectedCollaterals.find(s => s._id === c._id)).map((collateral) => (
                <div 
                  key={collateral._id} 
                  className="p-4 border border-border rounded-lg hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{collateral.fundName}</p>
                      <p className="text-sm text-muted-foreground">{collateral.amcName}</p>
                      <p className="text-sm mt-1">
                        Folio: <span className="font-mono">{collateral.folioNumber}</span>
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddCollateral(collateral._id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{collateral.units.toFixed(3)} units</span>
                    <span className="font-medium">{formatCurrency(collateral.currentValue)}</span>
                  </div>
                </div>
              ))}
              {availableCollaterals.filter(c => !selectedCollaterals.find(s => s._id === c._id)).length === 0 && (
                <p className="text-center text-muted-foreground py-8">No available collaterals</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Collaterals</CardTitle>
              <CardDescription>Mutual funds to be pledged for this loan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedCollaterals.map((collateral) => (
                <div 
                  key={collateral._id} 
                  className="p-4 border border-accent/30 bg-accent/5 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{collateral.fundName}</p>
                      <p className="text-sm text-muted-foreground">{collateral.folioNumber}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveCollateral(collateral._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 font-medium">{formatCurrency(collateral.currentValue)}</p>
                </div>
              ))}
              {selectedCollaterals.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No collaterals selected</p>
              )}

              {selectedCollaterals.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total Collateral Value</span>
                    <span className="font-medium">{formatCurrency(totalCollateralValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Requested Amount</span>
                    <span className="font-medium">{formatCurrency(requestedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Calculated LTV</span>
                    <span className={`font-medium ${isLtvExceeded ? 'text-destructive' : 'text-success'}`}>
                      {calculatedLTV.toFixed(1)}%
                      {selectedProduct && ` (Max: ${selectedProduct.maxLTV}%)`}
                    </span>
                  </div>
                  {isLtvExceeded && (
                    <p className="mt-2 text-xs text-destructive">
                      LTV exceeds the selected product's maximum. Adjust amount or collateral.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Application</CardTitle>
            <CardDescription>Please review all details before submitting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Applicant Information</h4>
              <div className="grid grid-cols-3 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{applicant.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{applicant.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{applicant.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">PAN</p>
                  <p className="font-medium font-mono">{applicant.pan}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Loan Details</h4>
              <div className="grid grid-cols-4 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium">{selectedProduct?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(requestedAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tenure</p>
                  <p className="font-medium">{loanDetails.tenure} months</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Interest Rate</p>
                  <p className="font-medium">{selectedProduct?.interestRate}% p.a.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Collateral Summary</h4>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2 mb-4">
                  {selectedCollaterals.map((c) => (
                    <div key={c._id} className="flex justify-between text-sm">
                      <span>{c.fundName}</span>
                      <span className="font-medium">{formatCurrency(c.currentValue)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Collateral Value</span>
                    <span>{formatCurrency(totalCollateralValue)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Loan to Value (LTV)</span>
                    <span className="text-success">{calculatedLTV.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
        >
          Previous
        </Button>
        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!validateStep(step)}
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  );
}
