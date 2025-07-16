import {
  users,
  properties,
  contacts,
  leads,
  outreachCampaigns,
  outreachHistory,
  scrapingJobs,
  aiInteractions,
  activities,
  pdfBinders,
  investors,
  type User,
  type UpsertUser,
  type Property,
  type InsertProperty,
  type Contact,
  type InsertContact,
  type Lead,
  type InsertLead,
  type OutreachCampaign,
  type InsertOutreachCampaign,
  type OutreachHistory,
  type InsertOutreachHistory,
  type ScrapingJob,
  type InsertScrapingJob,
  type AIInteraction,
  type InsertAIInteraction,
  type PDFBinder,
  type InsertPDFBinder,
  type Activity,
  type InsertActivity,
  type Investor,
  type InsertInvestor,
  notes,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count, sql } from "drizzle-orm";
import { arrayContains } from './utils';

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Property operations
  getProperties(filters?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  getPropertiesStats(): Promise<{
    total: number;
    highPriority: number;
    auctionsSoon: number;
    newToday: number;
  }>;

  // Contact operations
  getContactsByProperty(propertyId: number): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;

  // Lead operations
  getLeads(filters?: {
    status?: string;
    priority?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  getLeadsPipeline(userId: string): Promise<{
    toContact: number;
    inConversation: number;
    appointmentSet: number;
    followUp: number;
  }>;

  // Outreach operations
  getOutreachCampaigns(): Promise<OutreachCampaign[]>;
  createOutreachCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign>;
  getOutreachHistory(leadId: number): Promise<OutreachHistory[]>;
  createOutreachHistory(history: InsertOutreachHistory): Promise<OutreachHistory>;

  // Scraping operations
  getScrapingJobs(limit?: number): Promise<ScrapingJob[]>;
  createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob>;
  updateScrapingJob(id: number, job: Partial<InsertScrapingJob>): Promise<ScrapingJob | undefined>;
  getLatestScrapingJob(source: string): Promise<ScrapingJob | undefined>;

  // AI operations
  createAIInteraction(interaction: InsertAIInteraction): Promise<AIInteraction>;
  getAIInteractions(userId: string, limit?: number): Promise<AIInteraction[]>;

  // PDF operations
  createPDFBinder(binder: InsertPDFBinder): Promise<PDFBinder>;
  getPDFBinders(propertyId: number): Promise<PDFBinder[]>;

  // Activity operations
  createActivity(data: InsertActivity): Promise<Activity>;
  getActivitiesByLead(leadId: number, limit?: number): Promise<Activity[]>;
  getActivitiesByProperty(propertyId: number, limit?: number): Promise<Activity[]>;
  getRecentActivities(userId: string, limit?: number): Promise<Activity[]>;

  // Investor operations
  getInvestors(userId: string, filters?: {
    island?: string;
    strategy?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Investor[]>;
  getInvestor(id: number): Promise<Investor | undefined>;
  createInvestor(investor: InsertInvestor): Promise<Investor>;
  updateInvestor(id: number, investor: Partial<InsertInvestor>): Promise<Investor | undefined>;
  deleteInvestor(id: number): Promise<boolean>;
  getInvestorStats(userId: string): Promise<{
    totalInvestors: number;
    vipInvestors: number;
    activeDeals: number;
    avgBudget: number;
  }>;

  getMatchedBuyers(propertyId: number): Promise<any[]>;

  // Notes
  getNotes(userId: string): Promise<any>;
  createNote(noteData: { userId: string; note: string; title?: string; content?: string; is_public?: boolean }): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Property operations
  async getProperties(filters: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = db.select().from(properties);

      if (filters.status) {
        query = query.where(eq(properties.status, filters.status));
      }

      if (filters.priority) {
        query = query.where(eq(properties.priority, filters.priority));
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      const result = await query;
      return result;
    } catch (error) {
      console.error("Error in getProperties:", error);
      return [];
    }
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updatedProperty] = await db
      .update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  async getPropertiesStats(): Promise<{
    total: number;
    highPriority: number;
    auctionsSoon: number;
    newToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [totalResult] = await db.select({ count: count() }).from(properties);
    const [highPriorityResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.priority, 'high'));
    const [auctionsSoonResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(
        and(
          eq(properties.status, 'foreclosure'),
          gte(properties.auctionDate, today.toISOString().split('T')[0]),
          lte(properties.auctionDate, sevenDaysFromNow.toISOString().split('T')[0])
        )
      );
    const [newTodayResult] = await db
      .select({ count: count() })
      .from(properties)
      .where(gte(properties.createdAt, today));

    return {
      total: totalResult.count,
      highPriority: highPriorityResult.count,
      auctionsSoon: auctionsSoonResult.count,
      newToday: newTodayResult.count,
    };
  }

  // Contact operations
  async getContactsByProperty(propertyId: number): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.propertyId, propertyId));
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set({ ...contact, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }

  // Lead operations
  async getLead(id: number): Promise<Lead | null> {
    const result = await db
      .select()
      .from(leads)
      .leftJoin(properties, eq(leads.propertyId, properties.id))
      .leftJoin(contacts, eq(leads.contactId, contacts.id))
      .where(eq(leads.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const lead = result[0];
    return {
      id: lead.leads.id,
      propertyId: lead.leads.propertyId,
      contactId: lead.leads.contactId,
      userId: lead.leads.userId,
      status: lead.leads.status,
      priority: lead.leads.priority,
      notes: lead.leads.notes,
      createdAt: lead.leads.createdAt,
      updatedAt: lead.leads.updatedAt,
      property: lead.properties,
      contact: lead.contacts
    };
  }

  async getLeads(filters?: {
    status?: string;
    priority?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Lead[]> {
    try {
      let query = db.select({
        id: leads.id,
        propertyId: leads.propertyId,
        contactId: leads.contactId,
        userId: leads.userId,
        status: leads.status,
        priority: leads.priority,
        notes: leads.notes,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt
      }).from(leads);

      const conditions = [];
      if (filters?.status) conditions.push(eq(leads.status, filters.status));
      if (filters?.priority) conditions.push(eq(leads.priority, filters.priority));
      if (filters?.userId) conditions.push(eq(leads.userId, filters.userId));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      query = query.orderBy(desc(leads.createdAt)) as any;

      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }
      if (filters?.offset) {
        query = query.offset(filters.offset) as any;
      }

      const result = await query;
      return result || [];
    } catch (error) {
      console.error('Error in getLeads:', error);
      return [];
    }
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values(lead).returning();
    return newLead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();

    // Log status changes
    if (lead.status) {
      await this.createActivity({
        leadId: id,
        userId: 'system',
        type: 'status_changed',
        title: `Status changed to ${lead.status}`,
        description: `Lead status updated from previous status to ${lead.status}`,
      });
    }

    return updatedLead;
  }

  async getLeadsPipeline(userId: string): Promise<{
    toContact: number;
    inConversation: number;
    appointmentSet: number;
    followUp: number;
  }> {
    const [toContactResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), eq(leads.status, 'to_contact')));

    const [inConversationResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), eq(leads.status, 'in_conversation')));

    const [appointmentSetResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), eq(leads.status, 'appointment_set')));

    const [followUpResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(and(eq(leads.userId, userId), eq(leads.status, 'follow_up')));

    return {
      toContact: toContactResult.count,
      inConversation: inConversationResult.count,
      appointmentSet: appointmentSetResult.count,
      followUp: followUpResult.count,
    };
  }

  // Outreach operations
  async getOutreachCampaigns(): Promise<OutreachCampaign[]> {
    return await db.select().from(outreachCampaigns).where(eq(outreachCampaigns.isActive, true));
  }

  async createOutreachCampaign(campaign: InsertOutreachCampaign): Promise<OutreachCampaign> {
    const [newCampaign] = await db.insert(outreachCampaigns).values(campaign).returning();
    return newCampaign;
  }

  async getOutreachHistory(leadId: number): Promise<OutreachHistory[]> {
    return await db
      .select()
      .from(outreachHistory)
      .where(eq(outreachHistory.leadId, leadId))
      .orderBy(desc(outreachHistory.sentAt));
  }

  async createOutreachHistory(history: InsertOutreachHistory): Promise<OutreachHistory> {
    const [newHistory] = await db.insert(outreachHistory).values(history).returning();
    return newHistory;
  }

  async getScrapingJobs(limit = 10): Promise<ScrapingJob[]> {
    return await db
      .select()
      .from(scrapingJobs)
      .orderBy(desc(scrapingJobs.createdAt))
      .limit(limit);
  }

  async createScrapingJob(job: InsertScrapingJob): Promise<ScrapingJob> {
    const [newJob] = await db
      .insert(scrapingJobs)
      .values(job)
      .returning();
    return newJob;
  }

  async updateScrapingJob(id: number, job: Partial<InsertScrapingJob>): Promise<ScrapingJob | undefined> {
    const [updatedJob] = await db
      .update(scrapingJobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(scrapingJobs.id, id))
      .returning();
    return updatedJob;
  }

  async getLatestScrapingJob(source: string): Promise<ScrapingJob | undefined> {
    const [job] = await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.source, source))
      .orderBy(desc(scrapingJobs.createdAt))
      .limit(1);
    return job;
  }

  // AI operations
  async createAIInteraction(interaction: InsertAIInteraction): Promise<AIInteraction> {
    const [newInteraction] = await db.insert(aiInteractions).values(interaction).returning();
    return newInteraction;
  }

  async getAIInteractions(userId: string, limit = 50): Promise<AIInteraction[]> {
    return await db
      .select()
      .from(aiInteractions)
      .where(eq(aiInteractions.userId, userId))
      .orderBy(desc(aiInteractions.createdAt))
      .limit(limit);
  }

  // Activities for CRM Timeline
  async createActivity(data: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(data).returning();
    return activity;
  }

  async getActivitiesByLead(leadId: number, limit = 100): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.leadId, leadId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getActivitiesByProperty(propertyId: number, limit = 100): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.propertyId, propertyId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getRecentActivities(userId: string, limit = 50): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  // PDF operations
  async createPDFBinder(binder: InsertPDFBinder): Promise<PDFBinder> {
    const [newBinder] = await db.insert(pdfBinders).values(binder).returning();
    return newBinder;
  }

  async getPDFBinders(propertyId: number): Promise<PDFBinder[]> {
    return await db
      .select()
      .from(pdfBinders)
      .where(eq(pdfBinders.propertyId, propertyId))
      .orderBy(desc(pdfBinders.generatedAt));
  }

  // Investor operations
  async getInvestors(userId: string, filters?: {
    island?: string;
    strategy?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Investor[]> {
    try {
      const conditions = [eq(investors.userId, userId)];

      if (filters?.island && filters.island !== 'all') {
        conditions.push(sql`${investors.preferredIslands} @> ${[filters.island]}`);
      }

      if (filters?.strategy && filters.strategy !== 'all') {
        conditions.push(sql`${investors.strategies} @> ${[filters.strategy]}`);
      }

      if (filters?.priority && filters.priority !== 'all') {
        conditions.push(eq(investors.priority, filters.priority));
      }

      let query = db
        .select({
          id: investors.id,
          userId: investors.userId,
          name: investors.name,
          email: investors.email,
          phone: investors.phone,
          maxBudget: investors.maxBudget,
          minBudget: investors.minBudget,
          preferredIslands: investors.preferredIslands,
          strategies: investors.strategies,
          priority: investors.priority,
          status: investors.status,
          notes: investors.notes,
          createdAt: investors.createdAt,
          updatedAt: investors.updatedAt
        })
        .from(investors)
        .where(and(...conditions))
        .orderBy(desc(investors.createdAt));

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const result = await query;
      return result || [];
    } catch (error) {
      console.error('Error in getInvestors:', error);
      return [];
    }
  }

  async getInvestor(id: number): Promise<Investor | undefined> {
    const [investor] = await db.select().from(investors).where(eq(investors.id, id));
    return investor;
  }

  async createInvestor(investor: InsertInvestor): Promise<Investor> {
    const [created] = await db.insert(investors).values({
      ...investor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return created;
  }

  async updateInvestor(id: number, investor: Partial<InsertInvestor>): Promise<Investor | undefined> {
    const [updated] = await db
      .update(investors)
      .set({
        ...investor,
        updatedAt: new Date(),
      })
      .where(eq(investors.id, id))
      .returning();
    return updated;
  }

  async deleteInvestor(id: number): Promise<boolean> {
    const result = await db.delete(investors).where(eq(investors.id, id));
    return result.rowCount > 0;
  }

  async getInvestorStats(userId: string): Promise<{
    totalInvestors: number;
    vipInvestors: number;
    activeDeals: number;
    avgBudget: number;
  }> {
    const [stats] = await db
      .select({
        totalInvestors: count(),
        vipInvestors: count(sql`CASE WHEN ${investors.status} = 'vip' THEN 1 END`),
        avgBudget: sql<number>`AVG(${investors.maxBudget})`,
      })
      .from(investors)
      .where(eq(investors.userId, userId));

    return {
      totalInvestors: stats.totalInvestors,
      vipInvestors: stats.vipInvestors,
      activeDeals: stats.totalInvestors, // For now, assume all are active deals
      avgBudget: Math.round(stats.avgBudget || 0),
    };
  }

  async getMatchedBuyers(propertyId: number): Promise<any[]> {
    try {
      // In a real app, this would query the buyers table and matching logic
      // For now, return mock matched buyers
      return [
        {
          name: 'Wave Ventures LLC',
          strategy: 'Fix & Flip',
          maxPrice: 750000,
          email: 'waves@ventures.com'
        },
        {
          name: 'Aloha Holdings',
          strategy: 'Buy & Hold',
          maxPrice: 700000,
          email: 'info@alohaholdings.com'
        }
      ];
    } catch (error) {
      console.error('Error fetching matched buyers:', error);
      return [];
    }
  }

  async deleteAIInteraction(id: number): Promise<void> {
    await db.delete(aiInteractions).where(eq(aiInteractions.id, id));
  }

  async getOutreachCampaigns() {
    // Return mock campaigns for now - replace with real DB query when outreach table is created
    return [
      {
        id: 1,
        name: "Foreclosure Outreach",
        template: "Hi {ownerName}, I noticed your property at {address} may be going through foreclosure..."
      },
      {
        id: 2, 
        name: "Cash Offer Template",
        template: "Hello {ownerName}, I'm interested in purchasing your property at {address}..."
      }
    ];
  }

  async createOutreachHistory(data: any) {
    // Mock implementation - replace with real DB insert when outreach_history table is created
    console.log('Outreach history created:', data);
    return { id: Date.now(), ...data };
  }

  async updateLead(leadId: number, data: any, userId: string) {
    const existingLead = await this.getLead(leadId);
    if (!existingLead) {
      throw new Error('Lead not found');
    }

    await db.update(leads)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(leads.id, leadId));

    return this.getLead(leadId);
  }

  async createLead(data: any) {
    const [lead] = await db.insert(leads).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return lead;
  }

  async getScrapingJobs(limit: number = 10) {
    // Mock implementation - replace with real DB query when scraping_jobs table is created
    return [
      {
        id: 1,
        source: 'foreclosures',
        status: 'completed',
        recordsFound: 15,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: new Date(Date.now() - 3000000) // 50 minutes ago
      },
      {
        id: 2,
        source: 'tax_liens',
        status: 'running',
        recordsFound: 8,
        createdAt: new Date(Date.now() - 600000), // 10 minutes ago
        completedAt: null
      }
    ].slice(0, limit);
  }

  async getLeadsPipeline(userId: string) {
    const allLeads = await this.getLeads({ userId, limit: 1000 });

    const pipeline = {
      new: allLeads.filter(lead => lead.status === 'new'),
      contacted: allLeads.filter(lead => lead.status === 'contacted'),
      qualified: allLeads.filter(lead => lead.status === 'qualified'),
      negotiating: allLeads.filter(lead => lead.status === 'negotiating'),
      under_contract: allLeads.filter(lead => lead.status === 'under_contract'),
      closed: allLeads.filter(lead => lead.status === 'closed'),
      dead: allLeads.filter(lead => lead.status === 'dead')
    };

    return pipeline;
  }

  // Notes
  async getNotes(userId: string) {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
  }

  async createNote(noteData: { userId: string; note: string; title?: string; content?: string; is_public?: boolean }) {
    const [result] = await db
      .insert(notes)
      .values(noteData)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();