from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
import re
import json
import logging
import traceback

from groq import Groq
from dotenv import load_dotenv
from pdf_generator import generate_pdf

load_dotenv()

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ── Models ────────────────────────────────────────────────────────────────────

class WorkExperience(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = ""
    start_date: str
    end_date: str
    description: str

class Project(BaseModel):
    name: str
    description: str
    tech_stack: List[str]
    live_url: Optional[str] = ""
    github_url: Optional[str] = ""
    images: Optional[List[str]] = []
    problem_statement: Optional[str] = ""
    dataset: Optional[str] = ""
    features: Optional[str] = ""
    model_approach: Optional[str] = ""
    accuracy: Optional[str] = ""
    results: Optional[str] = ""
    additional_notes: Optional[str] = ""

class Education(BaseModel):
    degree: str
    institution: str
    start_year: str
    end_year: str
    grade: Optional[str] = ""

class Achievement(BaseModel):
    title: str
    organization: str
    date: str
    credential_url: Optional[str] = ""
    image: Optional[str] = ""
    description: Optional[str] = ""

class PortfolioRequest(BaseModel):
    full_name: str
    professional_title: str
    email: str
    bio: str
    photo: Optional[str] = ""
    location: Optional[str] = ""
    github: Optional[str] = ""
    linkedin: Optional[str] = ""
    website: Optional[str] = ""
    twitter: Optional[str] = ""
    technical_skills: List[str]
    soft_skills: Optional[List[str]] = []
    spoken_languages: Optional[List[str]] = []
    work_experience: Optional[List[WorkExperience]] = []
    projects: List[Project]
    education: List[Education]
    achievements: Optional[List[Achievement]] = []
    availability: Optional[str] = ""
    open_to_work: Optional[bool] = False

class PDFRequest(BaseModel):
    portfolio_data: dict
    template_id: int
    orientation: Optional[str] = "portrait"


# ── Helpers ───────────────────────────────────────────────────────────────────

def strip_images(obj):
    """Replace base64 image strings with a placeholder to keep prompts small."""
    if isinstance(obj, str) and obj.startswith("data:image"):
        return "[image]"
    if isinstance(obj, list):
        return [strip_images(i) for i in obj]
    if isinstance(obj, dict):
        return {k: strip_images(v) for k, v in obj.items()}
    return obj


def fix_json_strings(s: str) -> str:
    """Escape literal newlines/tabs that appear inside JSON string values."""
    result = []
    in_string = False
    escape_next = False
    for ch in s:
        if escape_next:
            result.append(ch)
            escape_next = False
        elif ch == "\\":
            result.append(ch)
            escape_next = True
        elif ch == '"' and not escape_next:
            in_string = not in_string
            result.append(ch)
        elif in_string and ch == "\n":
            result.append("\\n")
        elif in_string and ch == "\r":
            result.append("\\r")
        elif in_string and ch == "\t":
            result.append("\\t")
        else:
            result.append(ch)
    return "".join(result)


def parse_ai_json(raw: str) -> dict:
    """
    Robustly extract and parse a JSON object from the AI response.
    Tries several strategies before giving up.
    """
    content = raw.strip()

    # 1. Strip markdown fences
    if "```" in content:
        for part in content.split("```"):
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                content = part
                break

    # 2. Grab everything between the first { and last }
    start = content.find("{")
    end = content.rfind("}") + 1
    if start != -1 and end > start:
        content = content[start:end]

    # 3. Remove illegal control characters (keep \n \r \t which are handled next)
    content = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", content)

    # 4. Escape literal newlines inside string values
    content = fix_json_strings(content)

    # 5. Try to parse
    try:
        return json.loads(content)
    except json.JSONDecodeError as first_err:
        logger.warning("Standard json.loads failed: %s", first_err)

    # 6. Last-resort: try json-repair if available, otherwise re-raise
    try:
        from json_repair import repair_json  # pip install json-repair
        repaired = repair_json(content, return_objects=True)
        if isinstance(repaired, dict):
            logger.info("json-repair recovered the response successfully.")
            return repaired
    except ImportError:
        pass
    except Exception as repair_err:
        logger.warning("json-repair also failed: %s", repair_err)

    raise json.JSONDecodeError(
        f"Could not parse AI response as JSON. Raw content snippet: {content[:300]}",
        content,
        0,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/generate")
async def generate_portfolio(data: PortfolioRequest):
    try:
        safe_projects = strip_images([p.dict() for p in data.projects])
        safe_work = strip_images([w.dict() for w in (data.work_experience or [])])
        safe_certs = [
            {k: v for k, v in a.dict().items() if k not in ("image", "credential_url")}
            for a in (data.achievements or [])
        ]

        prompt = f"""You are a professional portfolio writer. Return ONLY valid JSON, no markdown, no explanation:
{{
  "summary": "3-4 sentence first-person professional summary",
  "tagline": "punchy tagline under 10 words",
  "projects": [{{"name":"as given","enhanced_description":"2-3 sentences highlighting impact","tech_stack":["tech"],"live_url":"","github_url":""}}],
  "work_experience": [{{"job_title":"as given","company":"as given","location":"","start_date":"","end_date":"","enhanced_description":"bullet points starting with action verbs, newline separated"}}],
  "achievements": [{{"title":"as given","organization":"as given","date":"","enhanced_description":"2 sentences on what was learned and career value"}}]
}}

Name: {data.full_name}
Title: {data.professional_title}
Bio: {data.bio}
Skills: {', '.join(data.technical_skills)}
Projects: {json.dumps(safe_projects, indent=1)}
Work: {json.dumps(safe_work, indent=1)}
Certs: {json.dumps(safe_certs, indent=1)}"""

        logger.info("Calling Groq API for user: %s", data.full_name)

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500,
        )

        raw_content = response.choices[0].message.content
        logger.info("Groq response received (%d chars)", len(raw_content))
        logger.debug("Raw AI response: %s", raw_content[:500])

        ai_content = parse_ai_json(raw_content)

        full_portfolio = data.dict()
        full_portfolio["ai_content"] = ai_content

        return {"success": True, "portfolio": full_portfolio}

    except json.JSONDecodeError as e:
        logger.error("JSON parse error: %s", e)
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        logger.error("Unexpected error in /api/generate:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/download-pdf")
async def download_pdf(req: PDFRequest):
    try:
        logger.info("Generating PDF — template %d, orientation: %s", req.template_id, req.orientation)
        pdf_bytes = generate_pdf(req.portfolio_data, req.template_id, req.orientation)
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=portfolio.pdf"},
        )
    except Exception as e:
        logger.error("PDF generation error:\n%s", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


# ── Serve React frontend ──────────────────────────────────────────────────────

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))