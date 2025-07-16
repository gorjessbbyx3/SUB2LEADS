import { inngest } from '../inngest';
import { motivationPredictor } from '../services/motivationPredictor';
import { strAnalyzer } from '../services/strAnalyzer';
import { neighborhoodScorer } from '../services/neighborhoodScorer';
import { resendService } from '../services/resendService';
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

// NEW: Comprehensive Lead Scoring with XAI Grok
export const analyzeSellerMotivation = inngest.createFunction(
  { id: "analyze-seller-motivation" },
  { event: "lead/analyze.motivation" },
  async ({ event, step }) => {
    const { leadId } = event.data;

    const analysis = await step.run("grok-motivation-analysis", async () => {
      const lead = await storage.getLead(leadId);
      const { grokService } = await import('../services/grokService');

      const grokAnalysis = await grokService.getLeadMotivationScore(lead);

      // Update lead with Grok analysis
      await storage.updateLead(leadId, {
        motivation_score: grokAnalysis.score,
        motivation_reason: grokAnalysis.reason,
        last_xai_updated: new Date().toISOString()
      });

      return grokAnalysis;
    });

    // If high motivation, trigger alerts
    if (analysis.score >= 70) {
      await step.run("send-motivation-alerts", async () => {
        const { resendService } = await import('../services/resendService');
        const lead = await storage.getLead(leadId);

        // Send alert to yourself
        await resendService.sendMotivationAlert(lead);

        // Get interested buyers and send hot lead alerts
        const buyers = await storage.getInvestors({ limit: 10 });
        if (buyers.length > 0) {
          await resendService.sendHotLeadAlert(lead, buyers);
        }
      });
    }

    return { leadId, score: analysis.score, reason: analysis.reason };
  }
);

// NEW: Comprehensive Lead Creation Workflow
export const processNewLead = inngest.createFunction(
  { id: "process-new-lead" },
  { event: "lead/created" },
  async ({ event, step }) => {
    const { leadId } = event.data;

    // Step 1: AI Motivation Analysis
    const motivationAnalysis = await step.run("analyze-motivation", async () => {
      await inngest.send({
        name: "lead/analyze.motivation",
        data: { leadId }
      });
      return { triggered: true };
    });

    // Step 2: STR Potential Analysis
    const strAnalysis = await step.run("analyze-str-potential", async () => {
      const lead = await storage.getLead(leadId);
      if (lead.propertyId) {
        await inngest.send({
          name: "property/analyze.str",
          data: { propertyId: lead.propertyId }
        });
      }
      return { triggered: true };
    });

    // Step 3: Advanced Lead Scoring
    await step.run("calculate-lead-score", async () => {
      await inngest.send({
        name: "lead/score.advanced",
        data: { leadId }
      });
    });

    return { leadId, processed: true };
  }
);

// NEW: STR Analysis on Property Entry
export const analyzePropertySTR = inngest.createFunction(
  { id: "analyze-property-str" },
  { event: "property/analyze.str" },
  async ({ event, step }) => {
    const { propertyId } = event.data;

    const analysis = await step.run("perform-str-analysis", async () => {
      const { strAnalyzer } = await import('../services/strAnalyzer');
      const strAnalysis = await strAnalyzer.analyzeProperty(propertyId);

      // Update property with STR data
      await storage.updateProperty(propertyId, {
        str_score: strAnalysis.score,
        str_income_estimate: strAnalysis.projectedAnnualIncome,
        roi_estimate: strAnalysis.projectedAnnualIncome * 0.1 // Simplified ROI
      });

      return strAnalysis;
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

// NEW: Neighborhood Investment Scorer
export const analyzeNeighborhood = inngest.createFunction(
  { id: "analyze-neighborhood" },
  { event: "neighborhood/analyze" },
  async ({ event, step }) => {
    const { zipCode, address } = event.data;

    const analysis = await step.run("score-neighborhood", async () => {
      return await neighborhoodScorer.scoreNeighborhood(zipCode, address);
    });

    // Store/update neighborhood score in database
    await step.run("store-neighborhood-score", async () => {
      // In a real implementation, you'd upsert to neighborhoods table
      console.log('Neighborhood analysis completed:', analysis);
    });

    return analysis;
  }
);

// NEW: Urgent Lead Follow-up
export const urgentLeadFollowup = inngest.createFunction(
  { id: "urgent-lead-followup" },
  { event: "lead/urgent.followup" },
  async ({ event, step }) => {
    const { leadId, motivationScore } = event.data;

    // Send immediate alert to team
    await step.run("send-team-alert", async () => {
      await resendService.sendMotivationAlert(leadId, motivationScore, 'Urgent follow-up required');
    });

    // Create high-priority task
    await step.run("create-urgent-task", async () => {
      await storage.createActivity({
        leadId,
        userId: 'system',
        type: 'urgent_followup',
        title: 'URGENT: High Motivation Lead',
        description: `Lead scored ${motivationScore}/100 - Contact immediately`
      });
    });

    return { leadId, alertSent: true };
  }
);

// NEW: Hot Lead Alert System
export const hotLeadAlert = inngest.createFunction(
  { id: "hot-lead-alert" },
  { event: "lead/hot.alert" },
  async ({ event, step }) => {
    const { leadId, score } = event.data;

    const lead = await step.run("get-lead-details", async () => {
      return await storage.getLead(leadId);
    });

    // Send email alert to team
    await step.run("send-hot-lead-alert", async () => {
      const property = await storage.getProperty(lead.propertyId);
      await resendService.sendMotivationAlert(leadId, score, `Hot lead with ${score}/100 score`);
    });

    // Update lead priority
    await step.run("update-lead-priority", async () => {
      await storage.updateLead(leadId, {
        priority: 'high',
        urgencyLevel: score >= 90 ? 'critical' : 'high'
      } as any);
    });

    return { leadId, score, alertSent: true };
  }
);

// NEW: Send Follow-up Email
export const sendFollowupEmail = inngest.createFunction(
  { id: "send-followup-email" },
  { event: "lead/send.followup" },
  async ({ event, step }) => {
    const { leadId, sequence } = event.data;

    await step.run("send-email", async () => {
      await resendService.sendFollowUpEmail(leadId, sequence);
    });

    // Update lead interaction count
    await step.run("update-interaction-count", async () => {
      const lead = await storage.getLead(leadId);
      await storage.updateLead(leadId, {
        interactionCount: (lead as any).interactionCount ? (lead as any).interactionCount + 1 : 1,
        lastInteractionDate: new Date().toISOString()
      } as any);
    });

    return { leadId, sequence, sent: true };
  }
);

// NEW: STR High Score Alert
export const strHighScoreAlert = inngest.createFunction(
  { id: "str-high-score-alert" },
  { event: "property/str.high-score" },
  async ({ event, step }) => {
    const { propertyId, strScore, projectedIncome } = event.data;

    await step.run("send-str-alert", async () => {
      await resendService.sendSTRAlert(propertyId, strScore, projectedIncome);
    });

    // Find and notify interested investors
    await step.run("notify-str-investors", async () => {
      const property = await storage.getProperty(propertyId);
      const strInvestors = await storage.getInvestors('system', { 
        strategy: 'Buy & Hold',
        limit: 50 
      });

      for (const investor of strInvestors) {
        if (investor.strategies?.includes('Buy & Hold') || investor.strategies?.includes('BRRRR')) {
          await resendService.sendBuyerNotification(
            investor.id, 
            propertyId, 
            85, 
            ['High STR potential', 'Strong rental income projection']
          );
        }
      }
    });

    return { propertyId, strScore, alertsSent: true };
  }
);

// NEW: Daily Market Analysis
export const dailyMarketAnalysis = inngest.createFunction(
  { id: "daily-market-analysis" },
  { cron: "0 8 * * *" }, // Daily at 8 AM
  async ({ step }) => {
    // Analyze top properties for STR potential
    const properties = await step.run("get-active-properties", async () => {
      return await storage.getProperties({ status: 'active', limit: 20 });
    });

    for (const property of properties) {
      await step.run(`analyze-str-${property.id}`, async () => {
        try {
          const analysis = await strAnalyzer.analyzeProperty(property.id);

          if (analysis.score >= 85) {
            await inngest.send({
              name: "property/str.high-score",
              data: { 
                propertyId: property.id, 
                strScore: analysis.score, 
                projectedIncome: analysis.projectedAnnualIncome 
              }
            });
          }
        } catch (error) {
          console.error(`STR analysis failed for property ${property.id}:`, error);
        }
      });
    }

    return { analyzed: properties.length };
  }
);

// Import risk scoring functions
export { scoreLeadRisk, batchRiskAssessment } from './riskScoringFunction';