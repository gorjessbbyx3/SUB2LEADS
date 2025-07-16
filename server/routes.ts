import { insertPropertySchema, insertContactSchema, insertLeadSchema, insertAIInteractionSchema, insertInvestorSchema } from "@shared/schema";
import { matchingService } from './services/matchingService.js';
import path from 'path';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve static PDF files
  app.use('/pdfs', (req, res, next) => {
    const filePath = path.join(process.cwd(), 'pdfs', req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ error: 'PDF not found' });
      }
    });
  });

  // Start scheduler
  schedulerService.start();
}