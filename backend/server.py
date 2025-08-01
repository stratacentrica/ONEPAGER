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

class EmailRequest(BaseModel):
    page_id: str
    to_email: str
    subject: str
    message: str
    format: str = "html"  # html, json, iframe

class ExportRequest(BaseModel):
    page_id: str
    format: str = "html"  # html, json, iframe

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
    return {"message": "APEXONE HIT ONE PAGER API"}

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
    """Get list of royalty-free chill music and atmospheric sounds"""
    sounds = [
        {
            "id": "chill-lofi-1",
            "name": "Chill LoFi Beats",
            "url": "https://www.chosic.com/wp-content/uploads/2021/02/Chill-Abstract-Intention.mp3",
            "duration": "3:45",
            "genre": "LoFi",
            "mood": "Relaxing"
        },
        {
            "id": "ambient-space",
            "name": "Ambient Space",
            "url": "https://www.chosic.com/wp-content/uploads/2020/08/Ethereal-Relaxation.mp3",
            "duration": "4:20",
            "genre": "Ambient",
            "mood": "Dreamy"
        },
        {
            "id": "rain-forest",
            "name": "Rain Forest",
            "url": "https://www.soundjay.com/misc/sounds/rain-03.wav",
            "duration": "10:00",
            "genre": "Nature",
            "mood": "Peaceful"
        },
        {
            "id": "ocean-waves",
            "name": "Ocean Waves",
            "url": "https://www.soundjay.com/misc/sounds/ocean-wave-1.wav",
            "duration": "8:30",
            "genre": "Nature",
            "mood": "Calming"
        },
        {
            "id": "soft-piano",
            "name": "Soft Piano",
            "url": "https://www.chosic.com/wp-content/uploads/2021/05/Scott-Buckley-Snowfall.mp3",
            "duration": "4:15",
            "genre": "Piano",
            "mood": "Serene"
        },
        {
            "id": "campfire",
            "name": "Campfire Crackling",
            "url": "https://www.soundjay.com/misc/sounds/campfire-1.wav",
            "duration": "5:45",
            "genre": "Nature",
            "mood": "Cozy"
        },
        {
            "id": "wind-chimes",
            "name": "Wind Chimes",
            "url": "https://www.soundjay.com/misc/sounds/wind-chimes-1.wav",
            "duration": "3:20",
            "genre": "Nature",
            "mood": "Zen"
        },
        {
            "id": "meditation-bells",
            "name": "Meditation Bells",
            "url": "https://www.chosic.com/wp-content/uploads/2020/12/Meditation-Impromptu-02.mp3",
            "duration": "6:30",
            "genre": "Meditation",
            "mood": "Spiritual"
        }
    ]
    return {"sounds": sounds}

@api_router.post("/pages/{page_id}/export")
async def export_landing_page(page_id: str):
    """Export landing page in multiple formats"""
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
async def get_embed_code(page_id: str, format: str = "iframe"):
    """Get embed code for landing page in different formats"""
    page = await db.landing_pages.find_one({"id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Landing page not found")
    
    if format == "iframe":
        embed_code = f'''<iframe src="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/preview/{page_id}" 
                         width="100%" height="600" frameborder="0" scrolling="auto"
                         style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                      </iframe>'''
    elif format == "javascript":
        embed_code = f'''<script>
                         (function() {{
                             var iframe = document.createElement('iframe');
                             iframe.src = '{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/preview/{page_id}';
                             iframe.width = '100%';
                             iframe.height = '600';
                             iframe.frameBorder = '0';
                             iframe.style.borderRadius = '12px';
                             iframe.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                             document.currentScript.parentNode.insertBefore(iframe, document.currentScript);
                         }})();
                         </script>'''
    else:  # HTML snippet
        embed_code = f'''<div id="apexone-page-{page_id}" style="width: 100%; height: 600px; background: url('{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/preview/{page_id}'); background-size: cover; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);"></div>'''
    
    return {"embed_code": embed_code, "format": format}

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
        
        # Get the public URL
        public_url = f"http://{ftp_data.ftp_host.replace('ftp.', '')}/{filename}"
        ftp.quit()
        
        return {
            "message": f"Page uploaded successfully!",
            "filename": filename,
            "public_url": public_url,
            "ftp_path": f"{ftp_data.ftp_host}/{ftp_data.remote_path}/{filename}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FTP upload failed: {str(e)}")

@api_router.post("/pages/{page_id}/email")
async def email_landing_page(page_id: str, email_data: EmailRequest):
    """Email landing page in specified format"""
    try:
        page = await db.landing_pages.find_one({"id": page_id})
        if not page:
            raise HTTPException(status_code=404, detail="Landing page not found")
        
        page_data = LandingPageData(**page)
        
        if email_data.format == "html":
            content = generate_html_export(page_data)
            attachment_name = f"{page_data.title.replace(' ', '_')}.html"
        elif email_data.format == "json":
            content = json.dumps(page_data.dict(), indent=2)
            attachment_name = f"{page_data.title.replace(' ', '_')}.json"
        else:  # iframe
            iframe_code = f'''<iframe src="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/preview/{page_id}" 
                             width="100%" height="600" frameborder="0" scrolling="auto">
                          </iframe>'''
            content = iframe_code
            attachment_name = f"{page_data.title.replace(' ', '_')}_embed.txt"
        
        # In a real implementation, you would integrate with an email service like SendGrid
        # For now, we'll simulate the email sending
        
        return {
            "message": f"Email sent successfully to {email_data.to_email}",
            "subject": email_data.subject,
            "format": email_data.format,
            "attachment": attachment_name,
            "preview": content[:200] + "..." if len(content) > 200 else content
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")

def generate_html_export(page_data: LandingPageData) -> str:
    """Generate enhanced HTML export of landing page"""
    components_html = ""
    
    for component in page_data.components:
        # Convert ComponentData object to dict for easier access
        comp_dict = component.dict() if hasattr(component, 'dict') else component
        
        component_style = f"""
            position: absolute; 
            left: {comp_dict['position']['x']}px; 
            top: {comp_dict['position']['y']}px;
            background: {comp_dict['style'].get('background', 'rgba(192,192,192,0.1)')};
            color: {comp_dict['style'].get('color', '#ffffff')};
            border-radius: {comp_dict['style'].get('borderRadius', '12px')};
            backdrop-filter: blur(12px);
            border: 1px solid rgba(192,192,192,0.2);
            font-family: {comp_dict['content'].get('fontFamily', 'Inter')};
            text-transform: {'uppercase' if comp_dict['content'].get('allCaps') else 'none'};
        """
        
        if comp_dict['type'] == 'text':
            tag = comp_dict['content'].get('tag', 'p')
            font_size = comp_dict['style'].get('fontSize', '16')
            components_html += f'''
            <{tag} style="{component_style} font-size: {font_size}px; padding: 12px;">
                {comp_dict['content'].get('text', '')}
            </{tag}>'''
            
        elif comp_dict['type'] == 'button':
            components_html += f'''
            <button style="{component_style} padding: 12px 24px; cursor: pointer; font-size: 14px; font-weight: 500;"
                    onclick="{comp_dict['content'].get('action', '')}"
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.2)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                {comp_dict['content'].get('text', 'Button')}
            </button>'''
            
        elif comp_dict['type'] == 'chatbot':
            components_html += f'''
            <div style="{component_style} width: 300px; height: 400px; padding: 16px; display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: 600; color: #60a5fa;">
                    <span>💬</span>
                    <span>ElevenLabs AI</span>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin-bottom: 16px;">{comp_dict['content'].get('greeting', 'Hello! How can I help you today?')}</p>
                    <div style="display: flex; gap: 8px;">
                        <input style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #ffffff;" placeholder="{comp_dict['content'].get('placeholder', 'Ask me anything...')}" />
                        <button style="padding: 8px; background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); border: none; border-radius: 8px; color: #ffffff; cursor: pointer;">⚡</button>
                    </div>
                </div>
            </div>'''
            
        elif comp_dict['type'] == 'livechat':
            provider_name = comp_dict['content'].get('provider', 'tidio').title()
            components_html += f'''
            <div style="{component_style} width: 280px; height: 350px; padding: 16px; display: flex; flex-direction: column;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: 600; color: #60a5fa;">
                    <span>🤖</span>
                    <span>{provider_name} Chat</span>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="background: rgba(192,192,192,0.15); padding: 12px; border-radius: 12px; font-size: 14px; color: rgba(255,255,255,0.9); margin-bottom: 8px;">
                        Hi! How can we help you today?
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <input style="flex: 1; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #ffffff;" placeholder="Type your message..." />
                        <button style="padding: 8px 16px; background: rgba(192,192,192,0.2); border: 1px solid rgba(192,192,192,0.3); border-radius: 8px; color: #ffffff; cursor: pointer;">Send</button>
                    </div>
                </div>
            </div>'''
    
    html_template = f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{page_data.title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
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
                transition: all 0.3s ease;
                font-weight: 500;
                text-decoration: none;
                display: inline-block;
            }}
            
            .glass-button:hover {{
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                background: rgba(192,192,192,0.2) !important;
            }}
            
            .component {{
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                transition: all 0.3s ease;
            }}
            
            .component:hover {{
                transform: scale(1.02);
            }}
            
            .apexone-logo {{
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 1;
            }}
            
            .logo-watermark {{
                width: 80px;
                height: auto;
                opacity: 0.3;
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
            <div class="apexone-logo">
                <img src="https://customer-assets.emergentagent.com/job_minimalcraft/artifacts/0zqivsrz_APEXONE_OFFICIAL_LOGOPNG.png" alt="APEXONE" class="logo-watermark">
            </div>
            {components_html}
        </div>
        <script>
            // Add smooth interactions
            document.querySelectorAll('.component').forEach(el => {{
                el.addEventListener('mouseenter', () => {{
                    el.style.transform = 'scale(1.05)';
                }});
                el.addEventListener('mouseleave', () => {{
                    el.style.transform = 'scale(1)';
                }});
            }});
        </script>
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