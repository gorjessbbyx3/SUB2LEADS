import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, TrendingUp, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Hawaii Real Estate
            <span className="text-blue-600"> Lead Generation CRM</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Identify distressed properties, enrich contact data with AI, and convert leads into deals. 
            Streamline your Hawaii real estate investment workflow.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Auto Scraping</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically scrape StarAdvertiser legal notices and Hawaii tax delinquent lists daily
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">AI Contact Enrichment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically find phone numbers, emails, and social profiles for property owners
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Lead Prioritization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart prioritization based on auction dates, property values, and contact completeness
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">CRM Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Kanban-style lead management with automated outreach and PDF binder generation
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-lg p-12 mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Turn Distressed Properties Into Opportunities
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 mr-4"></div>
                  <p className="text-gray-600">
                    <strong>Daily Property Discovery:</strong> Automated scraping finds new foreclosure and tax delinquent properties every day
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 mr-4"></div>
                  <p className="text-gray-600">
                    <strong>AI-Powered Outreach:</strong> Generate personalized emails and SMS messages for each property owner
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 mr-4"></div>
                  <p className="text-gray-600">
                    <strong>Professional Binders:</strong> Auto-generate PDF presentations with property photos, maps, and investment analysis
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 mr-4"></div>
                  <p className="text-gray-600">
                    <strong>Complete Workflow:</strong> From lead discovery to deal closing, manage everything in one platform
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-100 rounded-xl p-8 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">247</div>
              <div className="text-gray-600 mb-4">Active Properties Tracked</div>
              <div className="text-2xl font-bold text-red-600 mb-2">18</div>
              <div className="text-gray-600 mb-4">High Priority Auctions</div>
              <div className="text-2xl font-bold text-green-600 mb-2">$2.4M</div>
              <div className="text-gray-600">Deals Closed This Month</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join successful Hawaii investors using AI to find and convert distressed property leads
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Start Free Trial
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Setup in under 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
