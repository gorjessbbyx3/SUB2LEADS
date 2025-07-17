import { 
  Building2, 
  Users, 
  Target, 
  BarChart3, 
  Globe, 
  Gavel, 
  Mail, 
  Database, 
  FileText, 
  StickyNote, 
  Truck, 
  Menu,
  Building,
  Home, 
  AlertTriangle,
  Settings,
  LogOut,
  DollarSign,
  Search
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigationSections = [
  {
    title: "Deal Pipeline",
    items: [
      { name: "Overview", href: "/", icon: BarChart3 },
      { name: "Lead Management", href: "/leads", icon: Users },
      { name: "Deal Matching", href: "/matching", icon: Target },
      { name: "Outreach Center", href: "/outreach", icon: Mail },
    ]
  },
  {
    title: "Data Sources",
    items: [
      { name: "Properties", href: "/properties", icon: Home },
      { name: "MLS Integration", href: "/mls", icon: Building },
      { name: "Legal Notices", href: "/evictions", icon: AlertTriangle },
      { name: "Data Scraper", href: "/data-scraper", icon: Search },
    ]
  },
  {
    title: "Network",
    items: [
      { name: "Investor Network", href: "/investors", icon: DollarSign },
      { name: "Wholesale Deals", href: "/wholesaler", icon: Building },
    ]
  },
  {
    title: "Analytics",
    items: [
      { name: "Reports & Binders", href: "/reports", icon: FileText },
      { name: "Notes & Research", href: "/notes", icon: FileText },
    ]
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="h-6 w-6" />
      </button>

      <aside className={`w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-10 transform ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 font-heading">BIRD.DOG</h1>
          <p className="text-xs text-gray-400 mt-1">by GorJess & co.</p>
          <p className="text-sm text-gray-500 mt-1">Lead Generation Platform</p>
        </div>

        <nav className="mt-6 px-4">
          {navigationSections.map((section, sectionIndex) => (
            <div key={section.title} className={sectionIndex > 0 ? "mt-8" : ""}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location === item.href;
                  const Icon = item.icon;

                  return (
                    <li key={item.name}>
                      <Link href={item.href} className={cn(
                        "flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group",
                        isActive 
                          ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25" 
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      )}>
                        <Icon className={cn(
                          "mr-3 h-5 w-5 transition-colors",
                          isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                        )} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
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
    </>
  );
}