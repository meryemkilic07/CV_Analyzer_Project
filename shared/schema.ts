import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const cvFiles = pgTable("cv_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
});

export const extractedInfo = pgTable("extracted_info", {
  id: serial("id").primaryKey(),
  cvFileId: integer("cv_file_id").notNull().references(() => cvFiles.id),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  summary: text("summary"),
  skills: jsonb("skills").$type<string[]>().default([]),
  experience: jsonb("experience").$type<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }[]>().default([]),
  education: jsonb("education").$type<{
    degree: string;
    institution: string;
    graduationYear: number;
    gpa?: string;
  }[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cvFilesRelations = relations(cvFiles, ({ one }) => ({
  extractedInfo: one(extractedInfo, {
    fields: [cvFiles.id],
    references: [extractedInfo.cvFileId],
  }),
}));

export const extractedInfoRelations = relations(extractedInfo, ({ one }) => ({
  cvFile: one(cvFiles, {
    fields: [extractedInfo.cvFileId],
    references: [cvFiles.id],
  }),
}));

export const insertCvFileSchema = createInsertSchema(cvFiles).pick({
  filename: true,
  originalName: true,
  fileSize: true,
  status: true,
});

export const insertExtractedInfoSchema = createInsertSchema(extractedInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateExtractedInfoSchema = insertExtractedInfoSchema.partial();

export type InsertCvFile = z.infer<typeof insertCvFileSchema>;
export type CvFile = typeof cvFiles.$inferSelect;
export type InsertExtractedInfo = z.infer<typeof insertExtractedInfoSchema>;
export type ExtractedInfo = typeof extractedInfo.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
