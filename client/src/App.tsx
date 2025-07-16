import { QueryClientProvider } from '@tanstack/react-query';
import { Switch, Route } from "wouter";
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/queryClient';
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import LeadManagement from "@/pages/LeadManagement";
import DataScraper from "@/pages/DataScraper";
import Outreach from "@/pages/Outreach";
import Reports from "@/pages/Reports";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";

function AppRoutes() {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Hawaii Real Estate CRM</h1>
          <p className="text-gray-600 mb-6">Please login to access your CRM dashboard</p>
          <button
            onClick={login}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            Login with Replit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/properties" component={Properties} />
        <Route path="/properties/:id" component={PropertyDetail} />
        <Route path="/leads" component={LeadManagement} />
        <Route path="/scraper" component={DataScraper} />
        <Route path="/outreach" component={Outreach} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;