import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  uuid,
  date,
  json
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 10 }).notNull(),
  zipCode: varchar("zip_code", { length: 10 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  estimatedValue: integer("estimated_value"),
  status: varchar("status", { length: 50 }).notNull(), // 'foreclosure', 'tax_delinquent', 'auction'
  priority: varchar("priority", { length: 20 }).notNull().default('low'), // 'high', 'medium', 'low'
  auctionDate: date("auction_date"),
  amountOwed: integer("amount_owed"),
  daysUntilAuction: integer("days_until_auction"),
  aiSummary: text("ai_summary"),
  propertyType: varchar("property_type", { length: 50 }),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareFeet: integer("square_feet"),
  yearBuilt: integer("year_built"),
  imageUrl: text("image_url"),
  mapImageUrl: text("map_image_url"),
  sourceUrl: text("source_url"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  underContractStatus: text('under_contract_status').default('no'), // 'yes', 'no', 'unsure'
  contractUploadUrl: text('contract_upload_url'),
  mlsStatus: text('mls_status'), // Auto-populated from MLS checks
  dealType: text('deal_type'), // 'wholesaler', 'birddog'
  contractHolderName: text('contract_holder_name'),
  contractHolderPhone: text('contract_holder_phone'),
  contractHolderEmail: text('contract_holder_email'),
  askingPrice: integer('asking_price'),
  contractPrice: integer('contract_price'),
  estimatedARV: integer('estimated_arv'),
  repairsNeeded: text('repairs_needed'),
  contractExpiration: timestamp('contract_expiration'),
  exitStrategy: text('exit_strategy'),
  occupancyStatus: text('occupancy_status'),
  showingInstructions: text('showing_instructions'),
  distressType: text('distress_type'),
  leadSource: text('lead_source'),
  timeFound: timestamp('time_found'),
});

// Property owners/contacts
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isLLC: boolean("is_llc").default(false),
  linkedinUrl: text("linkedin_url"),
  facebookUrl: text("facebook_url"),
  contactScore: integer("contact_score").default(0), // 0-100 completeness score
  enrichmentStatus: varchar("enrichment_status", { length: 20 }).default('pending'), // 'pending', 'completed', 'failed'
  lastEnriched: timestamp("last_enriched"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lead management
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  contactId: integer("contact_id").references(() => contacts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: varchar("status", { length: 30 }).notNull().default('to_contact'), // 'to_contact', 'in_conversation', 'appointment_set', 'follow_up', 'closed_won', 'closed_lost'
  priority: varchar("priority", { length: 20 }).notNull().default('medium'),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  appointmentDate: timestamp("appointment_date"),
  notes: text("notes"),
  emailsSent: integer("emails_sent").default(0),
  smsSent: integer("sms_sent").default(0),
  callsMade: integer("calls_made").default(0),
  
  // New fields for financing, ownership, and contracting
  financingType: varchar("financing_type", { length: 50 }), // 'cash', 'conventional', 'hard_money', 'private_lender', 'owner_finance', 'other'
  ownershipType: varchar("ownership_type", { length: 50 }), // 'individual', 'llc', 'corporation', 'trust', 'partnership', 'other'
  ownershipDetails: text("ownership_details"), // Additional ownership information
  contractingType: varchar("contracting_type", { length: 50 }), // 'wholesale', 'assignment', 'double_close', 'bird_dog', 'direct_purchase', 'other'
  contractingDetails: text("contracting_details"), // Additional contracting information
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Outreach campaigns and templates
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'email', 'sms'
  subject: varchar("subject", { length: 255 }),
  template: text("template").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Outreach history
export const outreachHistory = pgTable("outreach_history", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  campaignId: integer("campaign_id").references(() => outreachCampaigns.id),
  type: varchar("type", { length: 20 }).notNull(), // 'email', 'sms', 'call'
  status: varchar("status", { length: 20 }).notNull(), // 'sent', 'delivered', 'opened', 'clicked', 'replied', 'failed'
  content: text("content"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  repliedAt: timestamp("replied_at"),
});

// Scraping jobs and status
export const scrapingJobs = pgTable("scraping_jobs", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 50 }).notNull(), // 'star_advertiser', 'tax_delinquent'
  status: varchar("status", { length: 20 }).notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  propertiesFound: integer("properties_found").default(0),
  propertiesProcessed: integer("properties_processed").default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI interactions and chat history
export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'chat', 'summary', 'email_generation'
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  contextId: text("context_id"),
  contextType: text("context_type"), // 'property', 'lead', 'contact'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Log for CRM Timeline
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  propertyId: integer("property_id").references(() => properties.id),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'email_sent', 'call_made', 'note_added', 'status_changed', 'email_opened', 'email_clicked'
  title: text("title").notNull(),
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// PDF binders generated
export const pdfBinders = pgTable("pdf_binders", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Investors table
export const investors = pgTable("investors", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  company: varchar("company", { length: 255 }),
  minBudget: integer("min_budget").default(0),
  maxBudget: integer("max_budget").default(0),
  preferredIslands: text("preferred_islands").array().default(['Oahu']),
  strategies: text("strategies").array().default(['Buy & Hold']),
  propertyTypes: text("property_types").array().default(['Single Family']),
  priority: varchar("priority", { length: 20 }).notNull().default('medium'),
  status: varchar("status", { length: 20 }).notNull().default('active'),
  notes: text("notes"),
  dealsCompleted: integer("deals_completed").default(0),
  lastContactDate: timestamp("last_contact_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many, one }) => ({
  contacts: many(contacts),
  leads: many(leads),
  pdfBinders: many(pdfBinders),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  property: one(properties, {
    fields: [contacts.propertyId],
    references: [properties.id],
  }),
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  property: one(properties, {
    fields: [leads.propertyId],
    references: [properties.id],
  }),
  contact: one(contacts, {
    fields: [leads.contactId],
    references: [contacts.id],
  }),
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  outreachHistory: many(outreachHistory),
}));

export const outreachHistoryRelations = relations(outreachHistory, ({ one }) => ({
  lead: one(leads, {
    fields: [outreachHistory.leadId],
    references: [leads.id],
  }),
  campaign: one(outreachCampaigns, {
    fields: [outreachHistory.campaignId],
    references: [outreachCampaigns.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type InsertOutreachCampaign = typeof outreachCampaigns.$inferInsert;

export type OutreachHistory = typeof outreachHistory.$inferSelect;
export type InsertOutreachHistory = typeof outreachHistory.$inferInsert;

export type ScrapingJob = typeof scrapingJobs.$inferSelect;
export type InsertScrapingJob = typeof scrapingJobs.$inferInsert;

export type AIInteraction = typeof aiInteractions.$inferSelect;
export type InsertAIInteraction = typeof aiInteractions.$inferInsert;

export type PDFBinder = typeof pdfBinders.$inferSelect;
export type InsertPDFBinder = typeof pdfBinders.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export type Investor = typeof investors.$inferSelect;
export type InsertInvestor = typeof investors.$inferInsert;

// Zod schemas

// Notes table definition (Since it was missing in the original schema)
export const notes = pgTable("notes", {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").references(() => users.id).notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// Notes schemas
export const insertNotesSchema = createInsertSchema(notes);
export const selectNotesSchema = createSelectSchema(notes);

// Export all insert and select schemas
export const insertPropertySchema = createInsertSchema(properties);
export const insertContactSchema = createInsertSchema(contacts);
export const insertLeadSchema = createInsertSchema(leads);
export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns);
export const insertAIInteractionSchema = createInsertSchema(aiInteractions);
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);
export const insertInvestorSchema = createInsertSchema(investors);
export const selectInvestorSchema = createSelectSchema(investors);

// Scraping Jobs table
export const scrapingJobs2 = pgTable("scraping_jobs2", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  propertiesFound: integer("properties_found").default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Logs table
export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  propertyId: integer("property_id").references(() => properties.id),
  contactId: integer("contact_id").references(() => contacts.id),
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  status: varchar("status", { length: 50 }).notNull(),
  templateId: varchar("template_id", { length: 100 }),
  sendgridMessageId: varchar("sendgrid_message_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Events table
export const emailEvents = pgTable("email_events", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  event: varchar("event", { length: 50 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  data: json("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScrapingJobSchema = createInsertSchema(scrapingJobs2);
export const selectScrapingJobSchema = createSelectSchema(scrapingJobs2);

export const insertEmailLogSchema = createInsertSchema(emailLogs);
export const selectEmailLogSchema = createSelectSchema(emailLogs);

export const insertEmailEventSchema = createInsertSchema(emailEvents);
export const selectEmailEventSchema = createSelectSchema(emailEvents);