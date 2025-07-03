# CV Analyzer System - replit.md

## Overview

This is a full-stack CV/Resume analysis web application built to automatically extract information from uploaded PDF documents and present it through a user-friendly interface. The system allows users to upload CV files, processes them using text extraction techniques, and provides an editable interface for the extracted data.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **File Processing**: Multer for multipart file uploads
- **PDF Processing**: Basic text extraction (placeholder for advanced PDF parsing)
- **API Design**: RESTful endpoints with JSON responses

### Database Architecture
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Components

### Database Schema
- **users**: User authentication and management
- **cvFiles**: Metadata for uploaded CV files (filename, size, status)
- **extractedInfo**: Structured data extracted from CVs including:
  - Personal information (name, email, phone, location)
  - Professional summary
  - Skills array
  - Experience history with job details
  - Education background

### File Upload System
- **File Types**: PDF and Word documents (.pdf, .docx, .doc) with 10MB size limit
- **Storage**: Local filesystem in uploads/ directory
- **Processing**: Asynchronous document text extraction and data parsing
- **Status Tracking**: Pending → Processing → Completed/Failed states

### Data Extraction Pipeline
- **Text Extraction**: PDF and Word document text extraction using pdf-parse and mammoth libraries
- **Pattern Recognition**: Regex-based extraction for emails, phones, names
- **Skill Detection**: Keyword matching for technical skills
- **Structured Output**: JSON format stored in PostgreSQL JSONB fields

### User Interface Components
- **Dashboard**: Main interface with sidebar navigation
- **FileUpload**: Drag-and-drop file upload with progress tracking
- **CVAnalysisForm**: Editable form for extracted CV data
- **CVHistory**: List view of all processed CVs with status indicators

## Data Flow

1. **File Upload**: User uploads PDF via drag-drop or file picker
2. **Initial Storage**: File metadata saved to database with "pending" status
3. **Background Processing**: PDF text extraction and parsing starts asynchronously
4. **Data Extraction**: Text analysis extracts structured information
5. **Database Update**: Extracted data saved, status updated to "completed"
6. **User Interface**: Real-time updates show processing status and results
7. **Data Editing**: Users can review and modify extracted information
8. **Persistence**: Updated data saved back to database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **multer**: File upload handling
- **zod**: Runtime type validation

### Development Tools
- **TypeScript**: Static type checking
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast development and build tool
- **ESBuild**: Fast JavaScript bundler

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution
- **Database**: Neon PostgreSQL serverless

### Production Build
- **Frontend**: Vite static build to dist/public
- **Backend**: ESBuild bundle to dist/index.js
- **Deployment**: Single Node.js process serving both frontend and API

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment detection (development/production)
- **File Storage**: Local filesystem (expandable to cloud storage)

### Database Management
- **Migrations**: Drizzle Kit for schema changes
- **Schema**: Shared TypeScript definitions between frontend and backend

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

- July 03, 2025: Initial setup with PDF support
- July 03, 2025: Added Word document support (.docx, .doc) using mammoth library
- July 03, 2025: Updated file upload to accept both PDF and Word documents