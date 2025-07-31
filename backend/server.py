from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json
import shutil
import tempfile
import ftplib
from io import BytesIO
import base64


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Ensure uploads directory exists
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Models for Landing Page Builder
class ComponentData(BaseModel):
    id: str
    type: str  # 'text', 'button', 'form', 'timer', 'audio', 'video', 'logo'
    content: Dict[str, Any]
    position: Dict[str, float]  # x, y coordinates
    style: Dict[str, Any]

class LandingPageData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    background_image: Optional[str] = None
    background_color: str = "#000000"
    theme: str = "dark"  # dark, light
    components: List[ComponentData] = []
    settings: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LandingPageCreate(BaseModel):
    title: str
    background_color: str = "#000000"
    theme: str = "dark"

class FTPUploadRequest(BaseModel):
    page_id: str
    ftp_host: str
    ftp_username: str
    ftp_password: str
    remote_path: str = "/"

# Status check models (existing)
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Existing status routes
@api_router.get("/")
async def root():
    return {"message": "ONEderpage Landing Page Builder API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Landing Page Builder Routes

@api_router.post("/pages", response_model=LandingPageData)
async def create_landing_page(page_data: LandingPageCreate):
    """Create a new landing page"""
    page_dict = page_data.dict()
    page_obj = LandingPageData(**page_dict)
    await db.landing_pages.insert_one(page_obj.dict())
    return page_obj

@api_router.get("/pages", response_model=List[LandingPageData])
async def get_landing_pages():
    """Get all landing pages"""
    pages = await db.landing_pages.find().to_list(1000)
    return [LandingPageData(**page) for page in pages]

@api_router.get("/pages/{page_id}", response_model=LandingPageData)
async def get_landing_page(page_id: str):
    """Get a specific landing page"""
    page = await db.landing_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return LandingPageData(**page)

@api_router.put("/pages/{page_id}", response_model=LandingPageData)
async def update_landing_page(page_id: str, page_data: Dict[str, Any]):
    """Update a landing page"""
    page_data["updated_at"] = datetime.utcnow()
    await db.landing_pages.update_one(
        {"id": page_id}, 
        {"$set": page_data}
    )
    updated_page = await db.landing_pages.find_one({"id": page_id})
    if not updated_page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return LandingPageData(**updated_page)

@api_router.delete("/pages/{page_id}")
async def delete_landing_page(page_id: str):
    """Delete a landing page"""
    result = await db.landing_pages.delete_one({"id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Landing page not found")
    return {"message": "Landing page deleted successfully"}

@api_router.post("/pages/{page_id}/components")
async def add_component(page_id: str, component: ComponentData):
    """Add a component to a landing page"""
    await db.landing_pages.update_one(
        {"id": page_id},
        {"$push": {"components": component.dict()}, "$set": {"updated_at": datetime.utcnow()}}
    )
    return {"message": "Component added successfully"}

@api_router.put("/pages/{page_id}/components/{component_id}")
async def update_component(page_id: str, component_id: str, component: ComponentData):
    """Update a specific component"""
    await db.landing_pages.update_one(
        {"id": page_id, "components.id": component_id},
        {"$set": {"components.$": component.dict(), "updated_at": datetime.utcnow()}}
    )
    return {"message": "Component updated successfully"}

@api_router.delete("/pages/{page_id}/components/{component_id}")
async def delete_component(page_id: str, component_id: str):
    """Delete a component from a landing page"""
    await db.landing_pages.update_one(
        {"id": page_id},
        {"$pull": {"components": {"id": component_id}}, "$set": {"updated_at": datetime.utcnow()}}
    )
    return {"message": "Component deleted successfully"}

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@api_router.post("/upload/audio")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file"""
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOADS_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"filename": filename, "url": f"/api/uploads/{filename}"}

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@api_router.get("/royalty-free-sounds")
async def get_royalty_free_sounds():
    """Get list of royalty-free atmospheric sounds"""
    sounds = [
        {
            "id": "rain-forest",
            "name": "Rain Forest",
            "url": "https://www.soundjay.com/misc/sounds/rain-03.wav",
            "duration": "10:00"
        },
        {
            "id": "ocean-waves",
            "name": "Ocean Waves",
            "url": "https://www.soundjay.com/misc/sounds/ocean-wave-1.wav",
            "duration": "8:30"
        },
        {
            "id": "campfire",
            "name": "Campfire Crackling",
            "url": "https://www.soundjay.com/misc/sounds/campfire-1.wav",
            "duration": "5:45"
        },
        {
            "id": "wind-chimes",
            "name": "Wind Chimes",
            "url": "https://www.soundjay.com/misc/sounds/wind-chimes-1.wav",
            "duration": "3:20"
        }
    ]
    return {"sounds": sounds}

@api_router.post("/pages/{page_id}/export")
async def export_landing_page(page_id: str):
    """Export landing page as HTML"""
    page = await db.landing_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    
    page_data = LandingPageData(**page)
    
    # Generate HTML content
    html_content = generate_html_export(page_data)
    
    # Save to temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8')
    temp_file.write(html_content)
    temp_file.close()
    
    return FileResponse(
        temp_file.name,
        media_type='text/html',
        filename=f"{page_data.title.replace(' ', '_')}.html"
    )

@api_router.post("/pages/{page_id}/embed-code")
async def get_embed_code(page_id: str):
    """Get embed code for landing page"""
    page = await db.landing_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    
    embed_code = f'''<iframe src="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/preview/{page_id}" 
                     width="100%" height="600" frameborder="0" scrolling="auto">
                  </iframe>'''
    
    return {"embed_code": embed_code}

@api_router.post("/pages/{page_id}/ftp-upload")
async def ftp_upload_page(page_id: str, ftp_data: FTPUploadRequest):
    """Upload landing page via FTP"""
    try:
        page = await db.landing_pages.find_one({"id": page_id})
        if not page:
            raise HTTPException(status_code=404, detail="Landing page not found")
        
        page_data = LandingPageData(**page)
        html_content = generate_html_export(page_data)
        
        # FTP upload
        ftp = ftplib.FTP(ftp_data.ftp_host)
        ftp.login(ftp_data.ftp_username, ftp_data.ftp_password)
        
        if ftp_data.remote_path != "/":
            ftp.cwd(ftp_data.remote_path)
        
        # Upload HTML file
        filename = f"{page_data.title.replace(' ', '_')}.html"
        ftp.storbinary(f'STOR {filename}', BytesIO(html_content.encode()))
        ftp.quit()
        
        return {"message": f"Page uploaded successfully to {ftp_data.ftp_host}/{filename}"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FTP upload failed: {str(e)}")

def generate_html_export(page_data: LandingPageData) -> str:
    """Generate HTML export of landing page"""
    components_html = ""
    
    for component in page_data.components:
        if component['type'] == 'text':
            components_html += f'''
            <div class="component text-component" style="position: absolute; left: {component['position']['x']}px; top: {component['position']['y']}px;">
                <{component['content'].get('tag', 'p')} style="color: {component['style'].get('color', '#ffffff')}; font-size: {component['style'].get('fontSize', '16')}px;">
                    {component['content'].get('text', '')}
                </{component['content'].get('tag', 'p')}>
            </div>'''
        elif component['type'] == 'button':
            components_html += f'''
            <div class="component button-component" style="position: absolute; left: {component['position']['x']}px; top: {component['position']['y']}px;">
                <button class="glass-button" onclick="{component['content'].get('action', '')}" 
                        style="background: {component['style'].get('background', 'rgba(255,255,255,0.1)')}; 
                               color: {component['style'].get('color', '#ffffff')}; 
                               padding: {component['style'].get('padding', '12px 24px')}; 
                               border-radius: {component['style'].get('borderRadius', '12px')}; 
                               border: 1px solid rgba(255,255,255,0.2); 
                               backdrop-filter: blur(10px);">
                    {component['content'].get('text', 'Button')}
                </button>
            </div>'''
    
    html_template = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{page_data.title}</title>
        <style>
            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}
            
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, {page_data.background_color} 0%, #000000 100%);
                background-image: url('{page_data.background_image or ''}');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
                min-height: 100vh;
                position: relative;
                overflow-x: hidden;
            }}
            
            .container {{
                position: relative;
                width: 100%;
                height: 100vh;
            }}
            
            .glass-button {{
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
                text-decoration: none;
                display: inline-block;
            }}
            
            .glass-button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                background: rgba(255,255,255,0.2) !important;
            }}
            
            .component {{
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }}
            
            @media (max-width: 768px) {{
                .component {{
                    position: relative !important;
                    left: 0 !important;
                    top: auto !important;
                    margin: 20px auto;
                    text-align: center;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            {components_html}
        </div>
    </body>
    </html>
    '''
    
    return html_template

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()