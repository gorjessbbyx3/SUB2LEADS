import { Switch, Route } from "wouter";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Properties from '@/pages/Properties';
import LeadManagement from '@/pages/LeadManagement';
import NotFound from '@/pages/not-found';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/properties" component={Properties} />
            <Route path="/leads" component={LeadManagement} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;