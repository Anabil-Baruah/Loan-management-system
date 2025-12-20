import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FileText,
  FilePlus,
  Wallet,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Loan Products', href: '/loan-products', icon: Package },
  { name: 'Applications', href: '/applications', icon: FileText },
  { name: 'New Application', href: '/applications/new', icon: FilePlus },
  { name: 'Ongoing Loans', href: '/loans', icon: Wallet },
  { name: 'Collaterals', href: '/collaterals', icon: Shield },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
          LM
        </div>
        <div>
          <h1 className="font-semibold text-sidebar-foreground">LoanManager</h1>
          <p className="text-xs text-sidebar-foreground/60">LAMF Platform</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          Main Menu
        </div>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-sidebar-primary')} />
              {item.name}
            </NavLink>
          );
        })}

        <div className="mt-8 mb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          Support
        </div>
        {secondaryNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary font-semibold">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">admin@loanmanager.com</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
