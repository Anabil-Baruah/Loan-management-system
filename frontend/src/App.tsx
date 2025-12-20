import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LoanProducts from "@/pages/LoanProducts";
import LoanApplications from "@/pages/LoanApplications";
import NewApplication from "@/pages/NewApplication";
import OngoingLoans from "@/pages/OngoingLoans";
import CollateralManagement from "@/pages/CollateralManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/loan-products" element={<LoanProducts />} />
            <Route path="/applications" element={<LoanApplications />} />
            <Route path="/applications/new" element={<NewApplication />} />
            <Route path="/loans" element={<OngoingLoans />} />
            <Route path="/collaterals" element={<CollateralManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
