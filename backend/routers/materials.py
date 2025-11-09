from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List
from models import CourseMaterial
from auth_utils import get_current_user
from database import get_database
import PyPDF2
import docx
import io

router = APIRouter()

async def extract_text_from_file(file: UploadFile) -> str:
    """Extract text from uploaded files"""
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text
    
    elif file.filename.endswith('.docx'):
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    
    elif file.filename.endswith('.txt'):
        return content.decode('utf-8')
    
    else:
        return content.decode('utf-8', errors='ignore')

@router.post("/upload")
async def upload_material(
    course_id: str = Form(...),
    title: str = Form(...),
    material_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "professor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only professors can upload materials"
        )
    
    db = get_database()
    
    # Verify course ownership
    course = await db.courses.find_one({"id": course_id, "professor_id": current_user["sub"]})
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or you don't have permission"
        )
    
    # Extract text from file
    try:
        content = await extract_text_from_file(file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing file: {str(e)}"
        )
    
    # Create material
    material = CourseMaterial(
        course_id=course_id,
        title=title,
        content=content,
        material_type=material_type
    )
    
    material_dict = material.model_dump()
    await db.course_materials.insert_one(material_dict)
    
    return {"message": "Material uploaded successfully", "material_id": material.id}

@router.post("/upload-text")
async def upload_text_material(
    course_id: str = Form(...),
    title: str = Form(...),
    material_type: str = Form(...),
    content: str = Form(...)
):
    db = get_database()
    
    # Create material
    material = CourseMaterial(
        course_id=course_id,
        title=title,
        content=content,
        material_type=material_type
    )
    
    material_dict = material.model_dump()
    await db.course_materials.insert_one(material_dict)
    
    return {"message": "Material uploaded successfully", "material_id": material.id}

@router.get("/course/{course_id}", response_model=List[CourseMaterial])
async def get_course_materials(course_id: str):
    db = get_database()
    
    materials = await db.course_materials.find({"course_id": course_id}).to_list(100)
    return [CourseMaterial(**material) for material in materials]

@router.delete("/{material_id}")
async def delete_material(material_id: str):
    db = get_database()
    
    material = await db.course_materials.find_one({"id": material_id})
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material not found"
        )
    
    await db.course_materials.delete_one({"id": material_id})
    
    return {"message": "Material deleted successfully"}
