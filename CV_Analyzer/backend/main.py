from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import uvicorn
import os
from typing import List, Optional
import json

# Local imports
from database.connection import get_db, engine
from models.models import Base, User, CVFile, ExtractedInfo
from services.cv_analyzer import CVAnalyzer
from services.nlp_processor import NLPProcessor
from routers import cv_router, user_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CV Analyzer API",
    description="AI-powered CV analysis and information extraction system",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
cv_analyzer = CVAnalyzer()
nlp_processor = NLPProcessor()

# Include routers
app.include_router(cv_router.router, prefix="/api/cv", tags=["CV Analysis"])
app.include_router(user_router.router, prefix="/api/users", tags=["Users"])

@app.get("/")
async def root():
    return {"message": "CV Analyzer API is running!", "version": "1.0.0"}

@app.post("/api/upload-cv")
async def upload_cv(
    file: UploadFile = File(...),
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Upload and analyze CV file
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.doc', '.docx')):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF, DOC, and DOCX files are supported"
            )
        
        # Save uploaded file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Extract text from CV
        extracted_text = cv_analyzer.extract_text_from_file(file_path)
        
        # Process with NLP
        cv_data = nlp_processor.analyze_cv_text(extracted_text)
        
        # Save to database
        # Create user if not exists
        if user_id is None:
            user = User(name=cv_data.get('name', 'Unknown'), email=cv_data.get('email', ''))
            db.add(user)
            db.commit()
            db.refresh(user)
            user_id = user.id
        
        # Save CV file record
        cv_file = CVFile(
            user_id=user_id,
            filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            extracted_text=extracted_text
        )
        db.add(cv_file)
        db.commit()
        db.refresh(cv_file)
        
        # Save extracted information
        extracted_info = ExtractedInfo(
            cv_file_id=cv_file.id,
            name=cv_data.get('name', ''),
            email=cv_data.get('email', ''),
            phone=cv_data.get('phone', ''),
            address=cv_data.get('address', ''),
            education=json.dumps(cv_data.get('education', [])),
            experience=json.dumps(cv_data.get('experience', [])),
            skills=json.dumps(cv_data.get('skills', [])),
            languages=json.dumps(cv_data.get('languages', [])),
            raw_data=json.dumps(cv_data)
        )
        db.add(extracted_info)
        db.commit()
        db.refresh(extracted_info)
        
        # Clean up uploaded file
        os.remove(file_path)
        
        return {
            "message": "CV uploaded and analyzed successfully",
            "cv_file_id": cv_file.id,
            "extracted_info_id": extracted_info.id,
            "data": cv_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing CV: {str(e)}")

@app.get("/api/cv/{cv_id}")
async def get_cv_analysis(cv_id: int, db: Session = Depends(get_db)):
    """
    Get CV analysis results
    """
    cv_file = db.query(CVFile).filter(CVFile.id == cv_id).first()
    if not cv_file:
        raise HTTPException(status_code=404, detail="CV not found")
    
    extracted_info = db.query(ExtractedInfo).filter(ExtractedInfo.cv_file_id == cv_id).first()
    if not extracted_info:
        raise HTTPException(status_code=404, detail="Extracted information not found")
    
    return {
        "cv_file": {
            "id": cv_file.id,
            "filename": cv_file.filename,
            "uploaded_at": cv_file.uploaded_at,
            "file_size": cv_file.file_size
        },
        "extracted_info": {
            "id": extracted_info.id,
            "name": extracted_info.name,
            "email": extracted_info.email,
            "phone": extracted_info.phone,
            "address": extracted_info.address,
            "education": json.loads(extracted_info.education) if extracted_info.education else [],
            "experience": json.loads(extracted_info.experience) if extracted_info.experience else [],
            "skills": json.loads(extracted_info.skills) if extracted_info.skills else [],
            "languages": json.loads(extracted_info.languages) if extracted_info.languages else [],
            "created_at": extracted_info.created_at
        }
    }

@app.put("/api/cv/{cv_id}/update")
async def update_cv_info(
    cv_id: int,
    update_data: dict,
    db: Session = Depends(get_db)
):
    """
    Update extracted CV information
    """
    extracted_info = db.query(ExtractedInfo).filter(ExtractedInfo.cv_file_id == cv_id).first()
    if not extracted_info:
        raise HTTPException(status_code=404, detail="Extracted information not found")
    
    # Update fields
    for field, value in update_data.items():
        if hasattr(extracted_info, field):
            if field in ['education', 'experience', 'skills', 'languages']:
                setattr(extracted_info, field, json.dumps(value))
            else:
                setattr(extracted_info, field, value)
    
    db.commit()
    db.refresh(extracted_info)
    
    return {"message": "CV information updated successfully"}

@app.get("/api/cvs")
async def list_cvs(db: Session = Depends(get_db)):
    """
    List all uploaded CVs
    """
    cvs = db.query(CVFile).all()
    result = []
    
    for cv in cvs:
        extracted_info = db.query(ExtractedInfo).filter(ExtractedInfo.cv_file_id == cv.id).first()
        result.append({
            "id": cv.id,
            "filename": cv.filename,
            "uploaded_at": cv.uploaded_at,
            "file_size": cv.file_size,
            "name": extracted_info.name if extracted_info else "Unknown",
            "email": extracted_info.email if extracted_info else ""
        })
    
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
