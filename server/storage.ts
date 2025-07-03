import { users, cvFiles, extractedInfo, type User, type InsertUser, type CvFile, type InsertCvFile, type ExtractedInfo, type InsertExtractedInfo } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // CV File methods
  createCvFile(insertCvFile: InsertCvFile): Promise<CvFile>;
  getCvFile(id: number): Promise<CvFile | undefined>;
  updateCvFileStatus(id: number, status: string): Promise<void>;
  deleteCvFile(id: number): Promise<void>;
  getAllCvFilesWithExtractedInfo(): Promise<Array<CvFile & { extractedInfo?: ExtractedInfo }>>;
  
  // Extracted Info methods
  createExtractedInfo(insertExtractedInfo: InsertExtractedInfo): Promise<ExtractedInfo>;
  getExtractedInfoByCvFileId(cvFileId: number): Promise<ExtractedInfo | undefined>;
  updateExtractedInfo(cvFileId: number, data: Partial<InsertExtractedInfo>): Promise<ExtractedInfo | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // CV File methods
  async createCvFile(insertCvFile: InsertCvFile): Promise<CvFile> {
    const [cvFile] = await db
      .insert(cvFiles)
      .values(insertCvFile)
      .returning();
    return cvFile;
  }

  async getCvFile(id: number): Promise<CvFile | undefined> {
    const [cvFile] = await db.select().from(cvFiles).where(eq(cvFiles.id, id));
    return cvFile || undefined;
  }

  async updateCvFileStatus(id: number, status: string): Promise<void> {
    await db
      .update(cvFiles)
      .set({ status })
      .where(eq(cvFiles.id, id));
  }

  async deleteCvFile(id: number): Promise<void> {
    // Delete extracted info first (foreign key constraint)
    await db.delete(extractedInfo).where(eq(extractedInfo.cvFileId, id));
    // Then delete the CV file
    await db.delete(cvFiles).where(eq(cvFiles.id, id));
  }

  async getAllCvFilesWithExtractedInfo(): Promise<Array<CvFile & { extractedInfo?: ExtractedInfo }>> {
    const result = await db
      .select()
      .from(cvFiles)
      .leftJoin(extractedInfo, eq(cvFiles.id, extractedInfo.cvFileId))
      .orderBy(desc(cvFiles.uploadedAt));
    
    return result.map(row => ({
      ...row.cv_files,
      extractedInfo: row.extracted_info || undefined
    }));
  }

  // Extracted Info methods
  async createExtractedInfo(insertExtractedInfo: InsertExtractedInfo): Promise<ExtractedInfo> {
    const [info] = await db
      .insert(extractedInfo)
      .values(insertExtractedInfo as any)
      .returning();
    return info;
  }

  async getExtractedInfoByCvFileId(cvFileId: number): Promise<ExtractedInfo | undefined> {
    const [info] = await db
      .select()
      .from(extractedInfo)
      .where(eq(extractedInfo.cvFileId, cvFileId));
    return info || undefined;
  }

  async updateExtractedInfo(cvFileId: number, data: Partial<InsertExtractedInfo>): Promise<ExtractedInfo | undefined> {
    const [info] = await db
      .update(extractedInfo)
      .set(data as any)
      .where(eq(extractedInfo.cvFileId, cvFileId))
      .returning();
    return info || undefined;
  }
}

export const storage = new DatabaseStorage();