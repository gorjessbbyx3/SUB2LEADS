import { Inngest } from "inngest";
import { serve } from "inngest/express";

export const inngest = new Inngest({ id: "hawaii-crm" });

export const inngestHandler = serve({
  client: inngest,
  functions: [
    // Your functions will go here
  ],
});