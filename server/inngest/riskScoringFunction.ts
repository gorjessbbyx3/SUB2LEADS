
import { inngest } from '../inngest';
import { storage } from '../storage';
import { riskAssessmentService } from '../services/riskAssessmentService';

// Risk scoring function that runs when a lead is created
export const scoreLeadRisk = inngest.createFunction(
  { id: "score-lead-risk" },
  { event: "lead/created" },
  async ({ event, step }) => {
    const { leadId } = event.data;

    const riskAssessment = await step.run("assess-property-risk", async () => {
      const lead = await storage.getLead(leadId);
      if (!lead) throw new Error('Lead not found');
      
      const property = await storage.getProperty(lead.propertyId);
      if (!property) throw new Error('Property not found');
      
      return await riskAssessmentService.assessPropertyRisk(
        property.address,
        parseFloat(property.latitude || '0'),
        parseFloat(property.longitude || '0')
      );
    });

    await step.run("update-lead-risk-data", async () => {
      await storage.updateLead(leadId, {
        naturalDisasterRisk: riskAssessment.naturalDisasterRisk,
        wildfireRiskZone: riskAssessment.wildfireRiskZone,
        floodZone: riskAssessment.floodZone,
        lavaZone: riskAssessment.lavaZone,
        tsunamiEvacuationZone: riskAssessment.tsunamiEvacuationZone,
        zoningChangePotential: riskAssessment.zoningChangePotential,
        developmentZoneRisk: riskAssessment.developmentZoneRisk
      } as any);
    });

    // Trigger motivation re-analysis with new risk data
    await step.run("trigger-motivation-analysis", async () => {
      await inngest.send({
        name: "lead/analyze.motivation",
        data: { leadId }
      });
    });

    return { leadId, riskAssessment };
  }
);

// Batch risk assessment for existing leads
export const batchRiskAssessment = inngest.createFunction(
  { id: "batch-risk-assessment" },
  { cron: "0 2 * * 0" }, // Every Sunday at 2 AM
  async ({ step }) => {
    const leadsToAssess = await step.run("get-leads-without-risk-data", async () => {
      const leads = await storage.getLeads({
        where: {
          naturalDisasterRisk: null
        },
        limit: 50
      });
      return leads;
    });

    for (const lead of leadsToAssess) {
      await step.run(`assess-lead-${lead.id}`, async () => {
        await inngest.send({
          name: "lead/created",
          data: { leadId: lead.id }
        });
      });
    }

    return { processedLeads: leadsToAssess.length };
  }
);
