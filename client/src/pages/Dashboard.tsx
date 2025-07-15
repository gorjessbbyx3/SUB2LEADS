import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import PropertyCard from "@/components/PropertyCard";
import { AIchatbot } from "@/components/AIchatbot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  AlertTriangle, 
  Send, 
  Handshake, 
  TrendingUp,
  Activity,
  CheckCircle
} from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/properties/stats"],
  });

  const { data: recentProperties } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: () => fetch("/api/properties?limit=5").then(res => res.json()),
  });

  const { data: pipeline } = useQuery({
    queryKey: ["/api/leads/pipeline"],
  });

  const { data: scrapingStatus } = useQuery({
    queryKey: ["/api/scraping/status"],
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <Header title="Dashboard" subtitle="Overview of your lead generation activities" />
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Leads"
              value={stats?.total || 0}
              change="+12% from last month"
              icon={Users}
              trend="up"
            />
            <StatsCard
              title="High Priority"
              value={stats?.highPriority || 0}
              change="Urgent action needed"
              icon={AlertTriangle}
              trend="urgent"
            />
            <StatsCard
              title="Active Outreach"
              value={64}
              change="+8 this week"
              icon={Send}
              trend="up"
            />
            <StatsCard
              title="Closed Deals"
              value={12}
              change="$2.4M this month"
              icon={Handshake}
              trend="up"
            />
          </div>

          {/* Recent Activity & Lead Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Properties */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Properties</CardTitle>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentProperties?.map((property: any) => (
                      <PropertyCard key={property.id} property={property} />
                    )) || (
                      <div className="text-center py-8 text-gray-500">
                        No properties found. Start scraping to find leads.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Pipeline */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Lead Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">To Contact</span>
                    <Badge variant="secondary">{pipeline?.toContact || 0}</Badge>
                  </div>
                  <Progress value={45} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">In Conversation</span>
                    <Badge className="bg-yellow-500">{pipeline?.inConversation || 0}</Badge>
                  </div>
                  <Progress value={35} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Appointment Set</span>
                    <Badge className="bg-purple-500">{pipeline?.appointmentSet || 0}</Badge>
                  </div>
                  <Progress value={25} className="h-2" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Follow-up</span>
                    <Badge className="bg-green-500">{pipeline?.followUp || 0}</Badge>
                  </div>
                  <Progress value={15} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Status & AI Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scraper Status */}
            <Card>
              <CardHeader>
                <CardTitle>Scraper Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">StarAdvertiser Legal Notices</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {scrapingStatus?.star_advertiser?.lastRunAt 
                      ? `Last run: ${new Date(scrapingStatus.star_advertiser.lastRunAt).toLocaleDateString()}`
                      : 'Never run'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Hawaii Tax Delinquent List</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {scrapingStatus?.tax_delinquent?.lastRunAt 
                      ? `Last run: ${new Date(scrapingStatus.tax_delinquent.lastRunAt).toLocaleDateString()}`
                      : 'Never run'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Contact Enrichment</span>
                  </div>
                  <span className="text-xs text-gray-500">Processing leads</span>
                </div>
                
                <Button className="w-full">Run Manual Scrape</Button>
              </CardContent>
            </Card>

            {/* AI Assistant */}
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        I've identified {stats?.highPriority || 0} high-priority properties that need immediate attention. 
                        Would you like me to generate personalized outreach templates for these leads?
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button className="w-full" size="sm">
                    Generate Outreach Templates
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Create Property Binders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AIchatbot />
    </div>
  );
}
