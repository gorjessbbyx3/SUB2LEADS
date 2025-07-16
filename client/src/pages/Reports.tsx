
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users
} from "lucide-react";

export default function Reports() {
  const { data: properties } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => fetch("/api/properties").then(res => res.json()),
  });

  const { data: leads } = useQuery({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads").then(res => res.json()),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/properties/stats"],
    queryFn: () => fetch("/api/properties/stats").then(res => res.json()),
  });

  const generateReport = async (type: string) => {
    try {
      const response = await fetch(`/api/reports/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Reports & Analytics" 
          subtitle="Generate comprehensive reports and analyze your lead generation performance"
        />

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Properties</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">High Priority</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats?.highPriority || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Leads</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Array.isArray(leads) ? leads.length : 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Potential Value</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${properties ? properties.reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0).toLocaleString() : '0'}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Generation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Property Summary Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive overview of all properties, their status, and key metrics.
                </p>
                <Button 
                  onClick={() => generateReport('properties')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lead Pipeline Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Detailed breakdown of leads by status, conversion rates, and activity.
                </p>
                <Button 
                  onClick={() => generateReport('leads')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Monthly performance metrics, trends, and ROI analysis.
                </p>
                <Button 
                  onClick={() => generateReport('analytics')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Activity Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Summary of weekly activities, new properties, and outreach results.
                </p>
                <Button 
                  onClick={() => generateReport('weekly')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Investment Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  High-priority investment opportunities with detailed financial analysis.
                </p>
                <Button 
                  onClick={() => generateReport('investments')}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Custom Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create a custom report with specific criteria and date ranges.
                </p>
                <Button 
                  onClick={() => generateReport('custom')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Configure & Generate
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Property Summary Report</p>
                      <p className="text-sm text-gray-500">Generated today at 2:30 PM</p>
                    </div>
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Lead Pipeline Report</p>
                      <p className="text-sm text-gray-500">Generated yesterday at 4:15 PM</p>
                    </div>
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Performance Analytics</p>
                      <p className="text-sm text-gray-500">Generated 2 days ago</p>
                    </div>
                  </div>
                  <Badge variant="outline">PDF</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
