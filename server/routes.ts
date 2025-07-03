import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertCvFileSchema, insertExtractedInfoSchema, updateExtractedInfoSchema } from "@shared/schema";
import { processDocument } from "./services/pdfProcessor";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload CV file
  app.post("/api/cv/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const cvFileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        status: "pending" as const,
      };

      const validatedData = insertCvFileSchema.parse(cvFileData);
      const cvFile = await storage.createCvFile(validatedData);

      // Start processing the document asynchronously
      processDocument(req.file.path, cvFile.id, req.file.mimetype).catch(console.error);

      res.json(cvFile);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get CV file status
  app.get("/api/cv/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cvFile = await storage.getCvFile(id);
      
      if (!cvFile) {
        return res.status(404).json({ message: "CV file not found" });
      }

      res.json(cvFile);
    } catch (error) {
      console.error("Get CV error:", error);
      res.status(500).json({ message: "Failed to get CV file" });
    }
  });

  // Get extracted information
  app.get("/api/cv/:id/extracted", async (req, res) => {
    try {
      const cvFileId = parseInt(req.params.id);
      const extractedInfo = await storage.getExtractedInfoByCvFileId(cvFileId);
      
      if (!extractedInfo) {
        return res.status(404).json({ message: "Extracted information not found" });
      }

      res.json(extractedInfo);
    } catch (error) {
      console.error("Get extracted info error:", error);
      res.status(500).json({ message: "Failed to get extracted information" });
    }
  });

  // Update extracted information
  app.patch("/api/cv/:id/extracted", async (req, res) => {
    try {
      const cvFileId = parseInt(req.params.id);
      const validatedData = updateExtractedInfoSchema.parse(req.body);
      
      const updatedInfo = await storage.updateExtractedInfo(cvFileId, validatedData);
      
      if (!updatedInfo) {
        return res.status(404).json({ message: "Extracted information not found" });
      }

      res.json(updatedInfo);
    } catch (error) {
      console.error("Update extracted info error:", error);
      res.status(500).json({ message: "Failed to update extracted information" });
    }
  });

  // Get all CV files with extracted info
  app.get("/api/cv", async (req, res) => {
    try {
      const cvFiles = await storage.getAllCvFilesWithExtractedInfo();
      res.json(cvFiles);
    } catch (error) {
      console.error("Get all CV files error:", error);
      res.status(500).json({ message: "Failed to get CV files" });
    }
  });

  // Delete CV file and its extracted info
  app.delete("/api/cv/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCvFile(id);
      res.json({ message: "CV file deleted successfully" });
    } catch (error) {
      console.error("Delete CV error:", error);
      res.status(500).json({ message: "Failed to delete CV file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
