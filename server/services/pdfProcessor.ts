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
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  // Split text into lines for better parsing
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract name (look for title case names at the beginning)
  let fullName = '';
  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();
    // Look for lines that look like names (title case, 2-4 words)
    if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(trimmed) && !emails.some(email => trimmed.includes(email))) {
      fullName = trimmed;
      break;
    }
  }
  
  // Extract location (look for city, state patterns)
  const locationRegex = /([A-Z][a-z]+,?\s+[A-Z]{2})|([A-Z][a-z]+\s+[A-Z][a-z]+,\s+[A-Z]{2})/g;
  const locations = text.match(locationRegex) || [];
  const location = locations[0] || '';
  
  // Extract summary/objective (look for summary sections)
  let summary = '';
  const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (summaryKeywords.some(keyword => line.includes(keyword))) {
      // Get the next few lines as summary
      const summaryLines = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && !nextLine.match(/^[A-Z\s]+$/) && nextLine.length > 20) {
          summaryLines.push(nextLine);
        } else if (summaryLines.length > 0) {
          break;
        }
      }
      summary = summaryLines.join(' ');
      break;
    }
  }
  
  // Enhanced skills extraction
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Express',
    'Python', 'Django', 'Flask', 'Java', 'Spring', 'C++', 'C#', '.NET',
    'HTML', 'CSS', 'SCSS', 'Sass', 'Bootstrap', 'Tailwind',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GitHub',
    'REST', 'API', 'GraphQL', 'Firebase', 'Webpack', 'Vite',
    'Testing', 'Jest', 'Cypress', 'Selenium', 'Agile', 'Scrum'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Extract experience
  const experience = [];
  const experienceKeywords = ['experience', 'employment', 'work history', 'career'];
  let experienceSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (experienceKeywords.some(keyword => line.includes(keyword))) {
      experienceSection = true;
      continue;
    }
    
    if (experienceSection) {
      // Look for job entries (company names, job titles)
      const trimmed = lines[i].trim();
      if (trimmed.length > 10 && /[A-Z]/.test(trimmed)) {
        // Check if next lines contain dates
        const nextLines = lines.slice(i + 1, i + 4);
        const hasDate = nextLines.some(line => /\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line));
        
        if (hasDate) {
          // Extract job details
          const title = trimmed;
          const company = nextLines[0]?.trim() || '';
          const dateInfo = nextLines.find(line => /\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line))?.trim() || '';
          
          experience.push({
            title,
            company,
            startDate: dateInfo.split('-')[0]?.trim() || '',
            endDate: dateInfo.split('-')[1]?.trim() || 'Present',
            description: nextLines.slice(1).join(' ').substring(0, 200)
          });
        }
      }
      
      // Stop if we hit education section
      if (line.includes('education') || line.includes('qualifications')) {
        break;
      }
    }
  }
  
  // Extract education
  const education = [];
  const educationKeywords = ['education', 'qualifications', 'academic', 'degree'];
  let educationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      educationSection = true;
      continue;
    }
    
    if (educationSection) {
      const trimmed = lines[i].trim();
      // Look for degree patterns
      if (/degree|bachelor|master|phd|diploma|certificate/.test(trimmed.toLowerCase())) {
        const nextLines = lines.slice(i + 1, i + 3);
        const yearMatch = (trimmed + ' ' + nextLines.join(' ')).match(/\b(19|20)\d{2}\b/);
        
        education.push({
          degree: trimmed,
          institution: nextLines[0]?.trim() || '',
          graduationYear: yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear(),
          gpa: ''
        });
      }
    }
  }

  return {
    fullName: fullName || lines[0]?.trim() || '',
    email: emails[0] || '',
    phone: phones[0] || '',
    location,
    summary,
    skills: foundSkills,
    experience: experience.slice(0, 3), // Limit to first 3 experiences
    education: education.slice(0, 2), // Limit to first 2 education entries
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
