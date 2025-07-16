
import { serve } from "inngest/express";
import { inngest } from "./services/inngestService";
import {
  schedulePropertyScraping,
  leadFollowUpWorkflow,
  propertyAnalysisWorkflow,
  investorMatchingWorkflow,
  wholesaleDealNotification,
  dailyMarketAnalysis,
  weeklyLeadCleanup
} from "./services/inngestService";

// Create the Inngest serve handler
export const inngestHandler = serve({
  client: inngest,
  functions: [
    schedulePropertyScraping,
    leadFollowUpWorkflow,
    propertyAnalysisWorkflow,
    investorMatchingWorkflow,
    wholesaleDealNotification,
    dailyMarketAnalysis,
    weeklyLeadCleanup
  ],
});
