from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
import os, base64, re, tempfile, shutil, copy

os.environ.setdefault('FONTCONFIG_FILE', '')
os.environ.setdefault('FONTCONFIG_PATH', '')


def process_images(obj, tmp_dir, counter):
    """Recursively find base64 image strings, save as real files, return file:// path."""
    if isinstance(obj, str) and obj.startswith('data:image'):
        match = re.match(r'data:([^;]+);base64,(.+)', obj, re.DOTALL)
        if match:
            mime = match.group(1)
            ext = mime.split('/')[-1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
            counter[0] += 1
            fpath = os.path.join(tmp_dir, f"img_{counter[0]}.{ext}")
            with open(fpath, 'wb') as f:
                f.write(base64.b64decode(match.group(2)))
            uri = 'file:///' + fpath.replace('\\', '/')
            print(f"[IMG] Saved image {counter[0]} → {uri}")
            return uri
        return obj
    if isinstance(obj, list):
        return [process_images(i, tmp_dir, counter) for i in obj]
    if isinstance(obj, dict):
        return {k: process_images(v, tmp_dir, counter) for k, v in obj.items()}
    return obj


def merge_images_into_ai_projects(portfolio_data: dict) -> dict:
    """Copy images + DS fields from original projects into ai_content projects."""
    data = copy.deepcopy(portfolio_data)
    ai = data.get("ai_content", {})
    orig_projects = data.get("projects", [])
    ai_projects = ai.get("projects", [])

    for i, ai_proj in enumerate(ai_projects):
        if i < len(orig_projects):
            orig = orig_projects[i]
            ai_proj["images"]            = orig.get("images", [])
            ai_proj["problem_statement"] = orig.get("problem_statement", "")
            ai_proj["dataset"]           = orig.get("dataset", "")
            ai_proj["features"]          = orig.get("features", "")
            ai_proj["model_approach"]    = orig.get("model_approach", "")
            ai_proj["accuracy"]          = orig.get("accuracy", "")
            ai_proj["results"]           = orig.get("results", "")
            ai_proj["additional_notes"]  = orig.get("additional_notes", "")
            ai_proj["live_url"]          = orig.get("live_url", "")
            ai_proj["github_url"]        = orig.get("github_url", "")

    print(f"[PDF] Project images: {[len(p.get('images',[])) for p in ai_projects]}")
    print(f"[PDF] Profile photo: {bool(data.get('photo'))}")
    print(f"[PDF] Cert images: {sum(1 for a in data.get('achievements',[]) if a.get('image'))}")
    return data


def inject_orientation(html: str, orientation: str) -> str:
    """Inject CSS to override @page size for landscape/portrait."""
    # For portrait, use explicit dimensions and override everything
    if orientation == 'landscape':
        override = """
<style>
  @page { size: 297mm 210mm !important; margin: 0 !important; }
  @page cover-p { size: 297mm 210mm !important; margin: 0 !important; }
  @page inner-p { size: 297mm 210mm !important; }
  @page cover-page { size: 297mm 210mm !important; }
  @page inner-page { size: 297mm 210mm !important; }
</style>"""
    else:
        # Portrait: 210mm × 297mm (explicit to override any landscape defaults)
        override = """
<style>
  @page { size: 210mm 297mm !important; margin: 0 !important; }
  @page cover-p { size: 210mm 297mm !important; margin: 0 !important; }
  @page inner-p { size: 210mm 297mm !important; }
  @page cover-page { size: 210mm 297mm !important; }
  @page inner-page { size: 210mm 297mm !important; }
</style>"""
    # Inject right before </head>
    return html.replace('</head>', override + '\n</head>', 1)


def generate_pdf(portfolio_data: dict, template_id: int, orientation: str = 'portrait') -> bytes:
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template(f"template_{template_id}.html")

    # Merge images from original into ai_content projects
    merged_data = merge_images_into_ai_projects(portfolio_data)

    # Build context — keep ai_content separate, promote only safe top-level keys
    context = copy.deepcopy(merged_data)
    ai = merged_data.get("ai_content", {})
    for key in ["summary", "tagline", "enhanced_bio", "skills_highlight"]:
        if key in ai:
            context[key] = ai[key]

    tmp_dir = tempfile.mkdtemp(prefix="pfimgs_")
    try:
        counter = [0]
        context = process_images(context, tmp_dir, counter)
        print(f"[PDF] Total images saved: {counter[0]}, orientation: {orientation}")

        html_content = template.render(**context)

        # Inject orientation CSS override
        html_content = inject_orientation(html_content, orientation)

        img_count = html_content.count('<img ')
        print(f"[PDF] <img> tags in HTML: {img_count}")

        pdf_bytes = HTML(
            string=html_content,
            base_url='file:///' + template_dir.replace('\\', '/') + '/'
        ).write_pdf()

        print(f"[PDF] Done — {len(pdf_bytes)} bytes, {orientation}")

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return pdf_bytes
