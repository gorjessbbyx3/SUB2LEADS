import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Users, 
  Home, 
  Search, 
  Mail, 
  FileText, 
  Settings,
  LogOut,
  DollarSign,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Lead Management", href: "/leads", icon: Users },
  { name: "Properties", href: "/properties", icon: Home },
  { name: "Investors", href: "/investors", icon: DollarSign },
  { name: "Matching", href: "/matching", icon: Target },
  { name: "Data Scraper", href: "/scraper", icon: Search },
  { name: "Outreach", href: "/outreach", icon: Mail },
  { name: "Reports & Binders", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 font-heading">Hawaii CRM</h1>
        <p className="text-sm text-gray-500 mt-1">Lead Generation Platform</p>
      </div>

      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link href={item.href} className={cn(
                  "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}>
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-6 left-4 right-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'
              }
            </p>
            <p className="text-xs text-gray-500">Real Estate Agent</p>
          </div>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-gray-500 hover:text-gray-900"
          onClick={() => window.location.href = '/api/logout'}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}