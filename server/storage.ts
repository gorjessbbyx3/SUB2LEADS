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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, gte, lte, count, sql } from "drizzle-orm";

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
  createActivity(data: {
    leadId?: number;
    propertyId?: number;
    userId: string;
    type: string;
    title: string;
    description?: string;
    metadata?: string;
  }): Promise<any>; // Type any because activities schema is not defined

  getActivitiesByLead(leadId: number, limit?: number): Promise<any>; // Type any because activities schema is not defined

  getActivitiesByProperty(propertyId: number, limit?: number): Promise<any>; // Type any because activities schema is not defined

  getRecentActivities(userId: string, limit?: number): Promise<any>; // Type any because activities schema is not defined
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
  async getProperties(filters?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<Property[]> {
    let query = db.select().from(properties);

    if (filters?.status) {
      query = query.where(eq(properties.status, filters.status)) as any;
    }
    if (filters?.priority) {
      query = query.where(eq(properties.priority, filters.priority)) as any;
    }

    query = query.orderBy(desc(properties.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query;
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
  async getLeads(filters?: {
    status?: string;
    priority?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Lead[]> {
    let query = db.select().from(leads);

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

    return await query;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
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
  async createActivity(data: {
    leadId?: number;
    propertyId?: number;
    userId: string;
    type: string;
    title: string;
    description?: string;
    metadata?: string;
  }) {
    // Assuming 'activities' table exists in your database
    const [activity] = await db.insert(activities).values(data).returning();
    return activity;
  }

  async getActivitiesByLead(leadId: number, limit = 100) {
    return db
      .select()
      .from(activities)
      .where(eq(activities.leadId, leadId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getActivitiesByProperty(propertyId: number, limit = 100) {
    return db
      .select()
      .from(activities)
      .where(eq(activities.propertyId, propertyId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getRecentActivities(userId: string, limit = 50) {
    return db
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
}

export const storage = new DatabaseStorage();