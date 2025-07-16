
import { inngest } from "../inngest";

export class InngestService {
  // Trigger property analysis
  static async analyzeProperty(propertyId: string, address: string) {
    return await inngest.send({
      name: "property/analyze",
      data: { propertyId, address }
    });
  }

  // Trigger outreach email
  static async sendOutreachEmail(leadId: string, email: string, template: string) {
    return await inngest.send({
      name: "outreach/send",
      data: { leadId, email, template }
    });
  }

  // Trigger lead scoring
  static async scoreLeads(leadIds: string[]) {
    return await inngest.send({
      name: "leads/score",
      data: { leadIds }
    });
  }

  // Test function
  static async sayHello(email: string) {
    return await inngest.send({
      name: "test/hello.world",
      data: { email }
    });
  }
}
