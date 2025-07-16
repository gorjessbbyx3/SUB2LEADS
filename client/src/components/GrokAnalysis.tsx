
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Users, BarChart3, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface GrokAnalysisProps {
  propertyId?: number;
  showAllAnalytics?: boolean;
}

export function GrokAnalysis({ propertyId, showAllAnalytics = true }: GrokAnalysisProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<string>('');

  // Property-specific analysis
  const propertyAnalysisMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/grok/analyze-property/${id}`);
      return response.json();
    },
    onSuccess: (data) => {
      setActiveAnalysis(data.analysis);
    }
  });

  // Market trends analysis
  const marketTrendsQuery = useQuery({
    queryKey: ['grok-market-trends'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/grok/market-trends');
      return response.json();
    },
    enabled: false
  });

  // Investor matching analysis
  const investorMatchMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/grok/investor-match/${id}`);
      return response.json();
    },
    onSuccess: (data) => {
      setActiveAnalysis(data.analysis);
    }
  });

  // Deal flow analysis
  const dealFlowQuery = useQuery({
    queryKey: ['grok-deal-flow'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/grok/deal-flow');
      return response.json();
    },
    enabled: false
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Grok AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showAllAnalytics ? (
          <Tabs defaultValue="property" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="property">Property</TabsTrigger>
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="investors">Investors</TabsTrigger>
              <TabsTrigger value="dealflow">Deal Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="property" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Property Market Analysis</h3>
                <p className="text-sm text-gray-600">
                  Get comprehensive market analysis for specific properties using current data.
                </p>
                {propertyId && (
                  <Button
                    onClick={() => propertyAnalysisMutation.mutate(propertyId)}
                    disabled={propertyAnalysisMutation.isPending}
                    className="w-full"
                  >
                    {propertyAnalysisMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze This Property'
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="market" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Market Trends Prediction
                </h3>
                <p className="text-sm text-gray-600">
                  Get real-time market predictions and trends for Hawaii real estate.
                </p>
                <Button
                  onClick={() => marketTrendsQuery.refetch()}
                  disabled={marketTrendsQuery.isFetching}
                  className="w-full"
                  variant="outline"
                >
                  {marketTrendsQuery.isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Market...
                    </>
                  ) : (
                    'Get Market Predictions'
                  )}
                </Button>
                {marketTrendsQuery.data && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {marketTrendsQuery.data.trends}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="investors" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Investor Matching
                </h3>
                <p className="text-sm text-gray-600">
                  Find the best investor matches for properties based on criteria and preferences.
                </p>
                {propertyId && (
                  <Button
                    onClick={() => investorMatchMutation.mutate(propertyId)}
                    disabled={investorMatchMutation.isPending}
                    className="w-full"
                    variant="outline"
                  >
                    {investorMatchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Matching...
                      </>
                    ) : (
                      'Find Best Investor Matches'
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="dealflow" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Deal Flow Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Analyze your entire pipeline for optimization opportunities and bottlenecks.
                </p>
                <Button
                  onClick={() => dealFlowQuery.refetch()}
                  disabled={dealFlowQuery.isFetching}
                  className="w-full"
                  variant="outline"
                >
                  {dealFlowQuery.isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Pipeline...
                    </>
                  ) : (
                    'Analyze Deal Flow'
                  )}
                </Button>
                {dealFlowQuery.data && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {dealFlowQuery.data.analysis}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Simple property analysis only
          <div className="space-y-4">
            {propertyId && (
              <Button
                onClick={() => propertyAnalysisMutation.mutate(propertyId)}
                disabled={propertyAnalysisMutation.isPending}
                className="w-full"
              >
                {propertyAnalysisMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Get Grok Analysis'
                )}
              </Button>
            )}
          </div>
        )}

        {/* Display active analysis */}
        {activeAnalysis && (
          <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Grok AI Analysis</h4>
            <p className="text-sm text-purple-700 leading-relaxed whitespace-pre-wrap">
              {activeAnalysis}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
