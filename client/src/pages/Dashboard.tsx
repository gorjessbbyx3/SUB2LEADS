
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatsCard } from "@/components/StatsCard";
import PropertyCard from "@/components/PropertyCard";
import { AIchatbot } from '@/components/AIchatbot';
import { GrokAnalysis } from '@/components/GrokAnalysis';
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
  CheckCircle,
  DollarSign,
  Building,
  Target,
  Zap,
  ArrowUpRight,
  PlayCircle,
  Clock,
  Star,
  MapPin
} from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => fetch("/api/dashboard/stats").then(res => res.json()),
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="relative">
          {/* Hero Header with Gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
            <div className="px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Good morning, ADMIN</h1>
                  <p className="text-blue-100 text-lg">Here's what's happening with your deals today</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Quick Actions
                  </Button>
                  <Button className="bg-white text-blue-600 hover:bg-gray-50">
                    <Zap className="w-4 h-4 mr-2" />
                    Run Scraper
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 -mt-6 relative z-10">
            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium">Active Deals</p>
                        <p className="text-3xl font-bold">{stats?.total || 0}</p>
                        <p className="text-emerald-100 text-xs mt-1">+12% this month</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-sm font-medium">Hot Leads</p>
                        <p className="text-3xl font-bold">{stats?.highPriority || 0}</p>
                        <p className="text-amber-100 text-xs mt-1">Urgent attention</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">In Conversation</p>
                        <p className="text-3xl font-bold">{pipeline?.inConversation || 0}</p>
                        <p className="text-purple-100 text-xs mt-1">Active outreach</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Send className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Revenue Pipeline</p>
                        <p className="text-3xl font-bold">$124K</p>
                        <p className="text-blue-100 text-xs mt-1">Est. commission</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Deal Pipeline Visualization */}
              <div className="lg:col-span-2">
                <Card className="shadow-xl border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold flex items-center">
                        <Target className="w-5 h-5 mr-2 text-blue-600" />
                        Deal Pipeline
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        View All <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        { stage: "New Leads", count: pipeline?.toContact || 0, color: "bg-gray-400", progress: 45 },
                        { stage: "Contacted", count: pipeline?.inConversation || 0, color: "bg-yellow-400", progress: 35 },
                        { stage: "Qualified", count: pipeline?.appointmentSet || 0, color: "bg-purple-400", progress: 25 },
                        { stage: "Under Contract", count: pipeline?.followUp || 0, color: "bg-green-400", progress: 15 }
                      ].map((item, index) => (
                        <div key={item.stage} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                              <span className="font-medium text-gray-700">{item.stage}</span>
                            </div>
                            <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                              {item.count} deals
                            </Badge>
                          </div>
                          <div className="ml-6">
                            <Progress value={item.progress} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Assistant & Quick Actions */}
              <div className="space-y-6">
                {/* AI Assistant */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Star className="w-5 h-5 mr-2 text-purple-600" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white rounded-lg p-4 mb-4 border border-purple-100">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            I found <strong>{stats?.highPriority || 0} high-priority properties</strong> that need immediate attention. 
                            Ready to generate personalized outreach?
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Outreach
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        Create Property Binders
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="shadow-xl border-0">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Activity className="w-5 h-5 mr-2 text-green-600" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "StarAdvertiser Scraper", status: "active", lastRun: scrapingStatus?.star_advertiser?.lastRunAt },
                      { name: "Tax Delinquent List", status: "active", lastRun: scrapingStatus?.tax_delinquent?.lastRunAt },
                      { name: "Contact Enrichment", status: "processing", lastRun: null }
                    ].map((scraper) => (
                      <div key={scraper.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            scraper.status === 'active' ? 'bg-green-400' : 
                            scraper.status === 'processing' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm font-medium text-gray-700">{scraper.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {scraper.lastRun ? `${new Date(scraper.lastRun).toLocaleDateString()}` : 'Running...'}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Properties with Map Preview */}
            <Card className="shadow-xl border-0 mb-8">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Properties
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    View Map <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {Array.isArray(recentProperties) && recentProperties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentProperties.map((property: any) => (
                      <div key={property.id} className="group">
                        <PropertyCard property={property} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No properties found yet</p>
                    <p className="text-gray-400 mb-6">Start scraping to discover new opportunities</p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Zap className="w-4 h-4 mr-2" />
                      Start Scraping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <GrokAnalysis />
          </div>
        </div>
      </main>

      <AIchatbot />
    </div>
  );
}
