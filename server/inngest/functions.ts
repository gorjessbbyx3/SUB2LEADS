
import { inngest } from '../inngest';

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const processLeadMatch = inngest.createFunction(
  { id: "process-lead-match" },
  { event: "lead/match.investors" },
  async ({ event, step }) => {
    const { leadId, userId } = event.data;
    
    // This would contain your matching logic
    console.log(`Processing lead match for lead ${leadId} by user ${userId}`);
    
    return { processed: true, leadId };
  }
);

export const processWholesaleDeal = inngest.createFunction(
  { id: "process-wholesale-deal" },
  { event: "wholesale/deal.imported" },
  async ({ event, step }) => {
    const { propertyId, leadId, matches } = event.data;
    
    console.log(`Processing wholesale deal for property ${propertyId}`);
    
    return { processed: true, propertyId, matchCount: matches.length };
  }
);

export const schedulePropertyScraping = inngest.createFunction(
  { id: "schedule-property-scraping" },
  { event: "property/scrape.scheduled" },
  async ({ event, step }) => {
    const { source } = event.data;
    
    console.log(`Scheduling property scraping for source: ${source}`);
    
    return { scheduled: true, source };
  }
);
