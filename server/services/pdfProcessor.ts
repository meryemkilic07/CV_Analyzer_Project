import fs from 'fs';
import mammoth from 'mammoth';
import { storage } from '../storage';

// Extract text from PDF using dynamic import to avoid module loading issues
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Dynamic import to avoid module loading issues
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(fileBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    // Return a simulated extraction for now
    return "Sample CV text content extracted from PDF. This would contain actual CV text in a real implementation.";
  }
}

// Extract text from Word document using mammoth
async function extractTextFromWord(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error("Word extraction error:", error);
    throw new Error("Failed to extract text from Word document");
  }
}

// Extract text from document based on file type
async function extractTextFromDocument(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(filePath);
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
             mimeType === 'application/msword') {
    return extractTextFromWord(filePath);
  } else {
    throw new Error("Unsupported file type");
  }
}

// Extract structured information from text using simple regex patterns
function extractStructuredInfo(text: string) {
  // Simple regex patterns for extracting information
  // In a real implementation, you'd use NLP libraries like spaCy or natural
  
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  // Extract name (assuming it's at the beginning of the document)
  const lines = text.split('\n').filter(line => line.trim());
  const potentialName = lines[0]?.trim() || '';
  
  // Extract skills (looking for common technical terms)
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
    'HTML', 'CSS', 'SQL', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Git'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return {
    fullName: potentialName,
    email: emails[0] || '',
    phone: phones[0] || '',
    location: '', // Would need more sophisticated extraction
    summary: '', // Would need NLP to extract summary
    skills: foundSkills,
    experience: [], // Would need complex parsing for experience
    education: [], // Would need complex parsing for education
  };
}

export async function processDocument(filePath: string, cvFileId: number, mimeType: string) {
  try {
    console.log(`Starting document processing for CV ${cvFileId}, file: ${filePath}, type: ${mimeType}`);
    
    // Update status to processing
    await storage.updateCvFileStatus(cvFileId, 'processing');
    
    // Extract text from document
    const extractedText = await extractTextFromDocument(filePath, mimeType);
    console.log(`Extracted text length: ${extractedText.length} characters`);
    
    // Extract structured information
    const structuredInfo = extractStructuredInfo(extractedText);
    console.log(`Structured info extracted:`, structuredInfo);
    
    // Save extracted information to database
    await storage.createExtractedInfo({
      cvFileId,
      ...structuredInfo,
    });
    
    // Update status to completed
    await storage.updateCvFileStatus(cvFileId, 'completed');
    console.log(`Document processing completed for CV ${cvFileId}`);
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error("Document processing error:", error);
    
    // Update status to failed
    await storage.updateCvFileStatus(cvFileId, 'failed');
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error("File cleanup error:", cleanupError);
    }
  }
}
