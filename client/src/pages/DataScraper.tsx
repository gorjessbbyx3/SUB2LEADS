import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Database,
  FileText,
  Calendar
} from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import {Sidebar} from '@/components/Sidebar';
import {Header} from '@/components/Header';
import { useToast } from '@/hooks/use-toast';

interface ScrapingJob {
  id: number;
  source: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  propertiesFound: number;
  propertiesProcessed: number;
  errorMessage?: string;
}

export default function DataScraper() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSource, setActiveSource] = useState<string>('');

  const { data: scrapingHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['scraping-history'],
    queryFn: () => apiRequest('/api/scraper/history'),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: scrapingStats } = useQuery({
    queryKey: ["/api/scraper/stats"],
    queryFn: () => fetch("/api/scraper/stats").then(res => res.json()),
  });

  const runScraperMutation = useMutation({
    mutationFn: (source: string) => apiRequest('/api/scraper/run', {
      method: 'POST',
      body: { source },
    }),
    onMutate: (source) => {
      setActiveSource(source);
    },
    onSuccess: (data, source) => {
      toast({
        title: 'Scraping completed!',
        description: `Found ${data.propertiesFound} properties from ${source}`,
      });
      queryClient.invalidateQueries({ queryKey: ['scraping-history'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setActiveSource('');
    },
    onError: (error: any, source) => {
      toast({
        title: 'Scraping failed',
        description: error.message || `Failed to scrape ${source}`,
        variant: 'destructive',
      });
      setActiveSource('');
    },
  });

  const runAllScrapersMutation = useMutation({
    mutationFn: () => apiRequest('/api/scraper/run-all', {
      method: 'POST',
    }),
    onMutate: () => {
      setActiveSource('all');
    },
    onSuccess: (data) => {
      toast({
        title: 'All scrapers completed!',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['scraping-history'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setActiveSource('');
    },
    onError: (error: any) => {
      toast({
        title: 'Scraping failed',
        description: error.message || 'Failed to run scrapers',
        variant: 'destructive',
      });
      setActiveSource('');
    },
  });

  const sources = [
    {
      id: 'star_advertiser',
      name: 'Star Advertiser',
      description: 'Foreclosure and auction notices from legal section',
      icon: FileText,
      url: 'https://www.staradvertiser.com/legal-notices/',
      expectedResults: '5-15 properties',
    },
    {
      id: 'honolulu_tax',
      name: 'Honolulu Property Tax',
      description: 'Delinquent property tax records',
      icon: Database,
      url: 'https://www.honolulupropertytax.com/',
      expectedResults: '10-30 properties',
    },
    {
      id: 'hawaii_judiciary',
      name: 'Hawaii Judiciary',
      description: 'Foreclosure cases from court records',
      icon: Search,
      url: 'https://www.courts.state.hi.us/',
      expectedResults: '5-20 properties',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto">
        <Header 
          title="Data Scraper" 
          subtitle="Automated property data collection from public sources"
        />

        <div className="p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Scraped</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scrapingStats?.totalProperties || 0}
                    </p>
                  </div>
                  <Database className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">This Week</p>
                    <p className="text-2xl font-bold text-green-600">
                      {scrapingStats?.thisWeek || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {scrapingStats?.successRate || 0}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Jobs</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {scrapingHistory.filter((job: ScrapingJob) => job.status === 'running').length}
                    </p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="sources" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="history">Scraping History</TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-4">
              {/* Run All Button */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Bulk Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => runAllScrapersMutation.mutate()}
                      disabled={runAllScrapersMutation.isPending || activeSource !== ''}
                      size="lg"
                    >
                      {runAllScrapersMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {runAllScrapersMutation.isPending ? 'Running All...' : 'Run All Scrapers'}
                    </Button>

                    <Button variant="outline" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Sources */}
              <div className="grid gap-4">
                {sources.map((source) => {
                  const isRunning = activeSource === source.id || runAllScrapersMutation.isPending;
                  const IconComponent = source.icon;

                  return (
                    <Card key={source.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <IconComponent className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-semibold text-lg">{source.name}</h3>
                              <p className="text-gray-600">{source.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Expected: {source.expectedResults}</span>
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View Source
                                </a>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => runScraperMutation.mutate(source.id)}
                              disabled={isRunning || runScraperMutation.isPending}
                              variant={isRunning ? "secondary" : "default"}
                            >
                              {isRunning ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Running...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Run Scraper
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Scraping Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : scrapingHistory.length > 0 ? (
                    <div className="space-y-4">
                      {scrapingHistory.map((job: ScrapingJob) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(job.status)}
                            <div>
                              <p className="font-medium capitalize">{job.source.replace('_', ' ')}</p>
                              <p className="text-sm text-gray-500">
                                Started {new Date(job.startedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {job.propertiesFound} properties found
                              </p>
                              {job.status === 'completed' && job.completedAt && (
                                <p className="text-xs text-gray-500">
                                  Completed {new Date(job.completedAt).toLocaleString()}
                                </p>
                              )}
                              {job.status === 'failed' && job.errorMessage && (
                                <p className="text-xs text-red-500 max-w-xs truncate">
                                  {job.errorMessage}
                                </p>
                              )}
                            </div>

                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(job.status)} text-white border-none`}
                            >
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No scraping jobs yet</p>
                      <p className="text-sm text-gray-400">Run your first scraper to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}