import time
import io
import base64
import os
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Image Deepfake Detector",
    description="Detects whether an image is AI-generated or real using LLaMA Vision via Groq.",
    version="3.0.0"
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def get_verdict(fake_score: float) -> str:
    if fake_score >= 0.85:
        return "Almost certainly AI-generated"
    elif fake_score >= 0.65:
        return "Likely AI-generated"
    elif fake_score >= 0.50:
        return "Possibly AI-generated"
    elif fake_score >= 0.25:
        return "Likely real"
    else:
        return "Almost certainly real"


def analyze_image_with_groq(image_bytes: bytes, content_type: str) -> dict:
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{content_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": (
                            "Analyze this image carefully and determine if it is AI-generated or a real photograph.\n"
                            "Look for these AI artifacts:\n"
                            "- Unnatural textures, lighting, or shadows\n"
                            "- Distorted hands, fingers, or faces\n"
                            "- Inconsistent details or backgrounds\n"
                            "- Overly smooth or perfect skin\n"
                            "- Weird text or logos\n"
                            "- Unrealistic colors or blending\n\n"
                            "Respond ONLY in this exact JSON format, no extra text:\n"
                            "{\n"
                            "  \"is_ai_generated\": true or false,\n"
                            "  \"confidence\": 0.0 to 1.0,\n"
                            "  \"reasoning\": [\"reason 1\", \"reason 2\", \"reason 3\"]\n"
                            "}"
                        )
                    }
                ]
            }
        ],
        "temperature": 0.1,
        "max_tokens": 300
    }

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=30
    )

    if response.status_code != 200:
        raise Exception(f"Groq API error: {response.text}")

    content = response.json()["choices"][0]["message"]["content"].strip()

    # Clean up markdown if present
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    import json
    return json.loads(content)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "image-deepfake-detector", "version": "3.0.0"}


@app.post("/detect/image")
async def detect_image(file: UploadFile = File(...)):
    start = time.time()

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in .env file.")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported type '{file.content_type}'. Allowed: JPEG, PNG, WebP, BMP."
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 10 MB.")

    # Resize to reduce base64 payload size
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((512, 512))
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        image_bytes = buffer.getvalue()
        content_type = "image/jpeg"
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Image processing failed: {exc}")

    try:
        result = analyze_image_with_groq(image_bytes, content_type)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Analysis failed: {exc}")

    fake_score = result.get("confidence", 0.5) if result.get("is_ai_generated") else 1.0 - result.get("confidence", 0.5)
    real_score = 1.0 - fake_score
    elapsed_ms = round((time.time() - start) * 1000)

    return JSONResponse({
        "input_type": "image",
        "deepfake_detection": {
            "is_deepfake":  result.get("is_ai_generated", False),
            "confidence":   round(fake_score, 4),
            "real_score":   round(real_score, 4),
            "verdict":      get_verdict(fake_score),
            "reasoning":    result.get("reasoning", []),
            "model_used":   "meta-llama/llama-4-scout-17b-16e-instruct (Vision)"
        },
        "metadata": {
            "filename":             file.filename,
            "content_type":         file.content_type,
            "file_size_bytes":      len(image_bytes),
            "api_response_time_ms": elapsed_ms
        }
    })