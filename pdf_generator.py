from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright
import asyncio
import nest_asyncio
import os, base64, re, tempfile, shutil, copy


nest_asyncio.apply()


def process_images(obj, tmp_dir, counter):
    if isinstance(obj, str) and obj.startswith('data:image'):
        match = re.match(r'data:([^;]+);base64,(.+)', obj, re.DOTALL)
        if match:
            mime = match.group(1)
            ext = mime.split('/')[-1].replace('jpeg', 'jpg').replace('svg+xml', 'svg')
            counter[0] += 1
            fpath = os.path.join(tmp_dir, f"img_{counter[0]}.{ext}")
            with open(fpath, 'wb') as f:
                f.write(base64.b64decode(match.group(2)))
            return 'file:///' + fpath.replace('\\', '/')
        return obj
    if isinstance(obj, list):
        return [process_images(i, tmp_dir, counter) for i in obj]
    if isinstance(obj, dict):
        return {k: process_images(v, tmp_dir, counter) for k, v in obj.items()}
    return obj


def merge_images_into_ai_projects(portfolio_data: dict) -> dict:
    data = copy.deepcopy(portfolio_data)
    ai = data.get("ai_content", {})
    orig_projects = data.get("projects", [])
    ai_projects = ai.get("projects", [])

    for i, ai_proj in enumerate(ai_projects):
        if i < len(orig_projects):
            orig = orig_projects[i]
            ai_proj["images"] = orig.get("images", [])
            ai_proj["problem_statement"] = orig.get("problem_statement", "")
            ai_proj["dataset"] = orig.get("dataset", "")
            ai_proj["features"] = orig.get("features", "")
            ai_proj["model_approach"] = orig.get("model_approach", "")
            ai_proj["accuracy"] = orig.get("accuracy", "")
            ai_proj["results"] = orig.get("results", "")
            ai_proj["additional_notes"] = orig.get("additional_notes", "")
            ai_proj["live_url"] = orig.get("live_url", "")
            ai_proj["github_url"] = orig.get("github_url", "")

    return data


def inject_orientation(html: str, orientation: str) -> str:
    if orientation == 'landscape':
        override = """
<style>
  @page { size: A4 landscape; margin: 0; }
</style>"""
    else:
        override = """
<style>
  @page { size: A4 portrait; margin: 0; }
</style>"""
    return html.replace('</head>', override + '\n</head>', 1)


# ✅ ASYNC PLAYWRIGHT ENGINE
async def html_to_pdf_async(html_content: str) -> bytes:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.set_content(html_content, wait_until="networkidle")

        pdf_bytes = await page.pdf(
            format="A4",
            print_background=True
        )

        await browser.close()
        return pdf_bytes


# ✅ FIXED WRAPPER (NO asyncio.run ❌)
def html_to_pdf(html_content: str) -> bytes:
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(html_to_pdf_async(html_content))


def generate_pdf(portfolio_data: dict, template_id: int, orientation: str = 'portrait') -> bytes:
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    env = Environment(loader=FileSystemLoader(template_dir))
    template = env.get_template(f"template_{template_id}.html")

    merged_data = merge_images_into_ai_projects(portfolio_data)

    context = copy.deepcopy(merged_data)
    ai = merged_data.get("ai_content", {})
    for key in ["summary", "tagline", "enhanced_bio", "skills_highlight"]:
        if key in ai:
            context[key] = ai[key]

    tmp_dir = tempfile.mkdtemp(prefix="pfimgs_")
    try:
        counter = [0]
        context = process_images(context, tmp_dir, counter)

        html_content = template.render(**context)
        html_content = inject_orientation(html_content, orientation)

        # ✅ PDF generation (same flow)
        pdf_bytes = html_to_pdf(html_content)

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

    return pdf_bytes
