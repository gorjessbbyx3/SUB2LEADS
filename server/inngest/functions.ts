import { inngest } from '../inngest';
import { motivationPredictor } from '../services/motivationPredictor';
import { strAnalyzer } from '../services/strAnalyzer';
import { storage } from '../storage';
import { emailService } from '../services/emailService';

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

// NEW: Seller Motivation Predictor
export const analyzeSellerMotivation = inngest.createFunction(
  { id: "analyze-seller-motivation" },
  { event: "lead/analyze.motivation" },
  async ({ event, step }) => {
    const { leadId } = event.data;

    const motivation = await step.run("predict-motivation", async () => {
      return await motivationPredictor.predictSellerMotivation(leadId);
    });

    // If high urgency, trigger immediate follow-up
    if (motivation.urgencyLevel === 'critical' || motivation.urgencyLevel === 'high') {
      await step.run("trigger-urgent-followup", async () => {
        await inngest.send({
          name: "lead/urgent.followup",
          data: { leadId, motivationScore: motivation.score }
        });
      });
    }

    return { leadId, motivationScore: motivation.score, urgency: motivation.urgencyLevel };
  }
);

// NEW: STR Analysis on Property Entry
export const analyzePropertySTR = inngest.createFunction(
  { id: "analyze-property-str" },
  { event: "property/analyze.str" },
  async ({ event, step }) => {
    const { propertyId } = event.data;

    const analysis = await step.run("perform-str-analysis", async () => {
      return await strAnalyzer.analyzeProperty(propertyId);
    });

    return { propertyId, strScore: analysis.score, projectedIncome: analysis.projectedAnnualIncome };
  }
);

// NEW: Leasehold Alert System
export const checkLeaseholdStatus = inngest.createFunction(
  { id: "check-leasehold-status" },
  { cron: "0 10 * * *" }, // Daily at 10 AM
  async ({ step }) => {
    const properties = await step.run("get-properties-to-check", async () => {
      return await storage.getProperties({ limit: 1000 });
    });

    let alertCount = 0;

    for (const property of properties) {
      await step.run(`check-property-${property.id}`, async () => {
        // Check if leasehold and lease expiring soon
        const isLeasehold = property.notes?.toLowerCase().includes('leasehold') || 
                           property.address.toLowerCase().includes('leasehold');

        if (isLeasehold) {
          // In real implementation, you'd parse actual lease expiration data
          // For now, alert on leasehold properties for manual review
          await storage.createActivity({
            propertyId: property.id,
            userId: 'system',
            type: 'leasehold_alert',
            title: 'Leasehold Property Alert',
            description: 'Manual review required for leasehold status and lease expiration'
          });

          alertCount++;
        }
      });
    }

    return { checked: properties.length, alerts: alertCount };
  }
);

// NEW: Smart Follow-Up System
export const smartFollowUp = inngest.createFunction(
  { id: "smart-followup" },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ step }) => {
    const leads = await step.run("get-leads-for-followup", async () => {
      const allLeads = await storage.getLeads({ limit: 1000 });
      return allLeads.filter(lead => lead.status !== 'closed');
    });

    for (const lead of leads) {
      await step.run(`followup-lead-${lead.id}`, async () => {
        // Get last interaction
        const activities = await storage.getActivities({ leadId: lead.id, limit: 1 });
        const lastActivity = activities[0];

        if (lastActivity) {
          const daysSinceContact = Math.floor(
            (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Trigger follow-up based on days since contact
          if (daysSinceContact >= 3 && daysSinceContact <= 5) {
            await inngest.send({
              name: "lead/send.followup",
              data: { leadId: lead.id, sequence: 'day3' }
            });
          } else if (daysSinceContact >= 7 && daysSinceContact <= 9) {
            await inngest.send({
              name: "lead/send.followup",
              data: { leadId: lead.id, sequence: 'week1' }
            });
          }
        }
      });
    }

    return { processed: leads.length };
  }
);

// NEW: Weekly Motivation Re-evaluation
export const weeklyMotivationUpdate = inngest.createFunction(
  { id: "weekly-motivation-update" },
  { cron: "0 9 * * MON" }, // Every Monday at 9 AM
  async ({ step }) => {
    const leads = await step.run("get-active-leads", async () => {
      const allLeads = await storage.getLeads({ limit: 1000 });
      return allLeads.filter(lead => lead.status !== 'closed');
    });

    for (const lead of leads) {
      await step.run(`update-motivation-${lead.id}`, async () => {
        try {
          await motivationPredictor.predictSellerMotivation(lead.id);
          await step.sleep("rate-limit", "1s");
        } catch (error) {
          console.error(`Failed to update motivation for lead ${lead.id}:`, error);
        }
      });
    }

    return { processed: leads.length };
  }
);

// NEW: Predictive Lead Scoring 2.0
export const advancedLeadScoring = inngest.createFunction(
  { id: "advanced-lead-scoring" },
  { event: "lead/score.advanced" },
  async ({ event, step }) => {
    const { leadId } = event.data;

    const scoreData = await step.run("calculate-advanced-score", async () => {
      const lead = await storage.getLead(leadId);
      const property = await storage.getProperty(lead.propertyId);

      // Advanced scoring with Hawaii-specific factors
      let score = 50;

      // Island-specific seasonality
      const island = property.address.includes('Honolulu') ? 'Oahu' : 
                    property.address.includes('Maui') ? 'Maui' : 'Big Island';

      const currentMonth = new Date().getMonth();
      const isHighSeason = [11, 0, 1, 6, 7].includes(currentMonth); // Dec, Jan, Feb, Jul, Aug

      if (isHighSeason) score += 10;

      // Weather/disaster factors (simplified)
      score += 5; // Base for no current weather alerts

      // Lead interaction history
      const activities = await storage.getActivities({ leadId, limit: 10 });
      if (activities.length > 0) score += Math.min(activities.length * 2, 20);

      return { score: Math.min(score, 100), factors: [`${island} island`, isHighSeason ? 'Peak season' : 'Regular season'] };
    });

    // If hot lead, trigger alerts
    if (scoreData.score >= 80) {
      await step.run("alert-hot-lead", async () => {
        await inngest.send({
          name: "lead/hot.alert",
          data: { leadId, score: scoreData.score }
        });
      });
    }

    return scoreData;
  }
);