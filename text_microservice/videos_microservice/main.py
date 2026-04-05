import time
import io
import os
import base64
import json
import tempfile
import requests
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Video Deepfake Detector",
    description="Detects whether a video is AI-generated or real using LLaMA 4 Vision via Groq.",
    version="2.0.0"
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ALLOWED_TYPES = {"video/mp4", "video/avi", "video/quicktime", "video/x-matroska", "video/x-msvideo"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
NUM_FRAMES = 5  # number of frames to sample and analyze


def get_verdict(fake_score: float) -> str:
    if fake_score >= 0.85:
        return "Almost certainly AI-generated / deepfake"
    elif fake_score >= 0.65:
        return "Likely AI-generated / deepfake"
    elif fake_score >= 0.50:
        return "Possibly AI-generated / deepfake"
    elif fake_score >= 0.25:
        return "Likely real"
    else:
        return "Almost certainly real"


def extract_frames(video_path: str, num_frames: int = NUM_FRAMES) -> list:
    """Extract evenly spaced frames from a video as JPEG bytes."""
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    if total_frames == 0:
        raise ValueError("Could not read frames from video.")

    indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    frames = []

    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if ret:
            # Resize frame to reduce payload size
            frame = cv2.resize(frame, (512, 512))
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(frame_rgb)
            buffer = io.BytesIO()
            pil_img.save(buffer, format="JPEG", quality=80)
            frames.append(buffer.getvalue())

    cap.release()
    return frames


def analyze_frame_with_groq(frame_bytes: bytes, frame_number: int) -> dict:
    """Send a single frame to Groq Vision LLM for analysis."""
    base64_image = base64.b64encode(frame_bytes).decode("utf-8")

    payload = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": (
                            f"This is frame {frame_number} extracted from a video. "
                            "Analyze it carefully and determine if it is from an AI-generated/deepfake video or a real recording.\n"
                            "Look for these artifacts:\n"
                            "- Unnatural skin texture or blurring around face edges\n"
                            "- Inconsistent lighting or shadows\n"
                            "- Distorted or morphed facial features\n"
                            "- Flickering or unnatural motion blur\n"
                            "- Mismatched lip sync artifacts\n"
                            "- Overly smooth or waxy skin\n"
                            "- Background inconsistencies\n\n"
                            "Respond ONLY in this exact JSON format, no extra text:\n"
                            "{\n"
                            "  \"is_ai_generated\": true or false,\n"
                            "  \"confidence\": 0.0 to 1.0,\n"
                            "  \"reasoning\": [\"reason 1\", \"reason 2\"]\n"
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

    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    return json.loads(content)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "video-deepfake-detector", "version": "2.0.0"}


@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    start = time.time()

    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in .env file.")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported type '{file.content_type}'. Allowed: MP4, AVI, MOV, MKV."
        )

    video_bytes = await file.read()
    if len(video_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 100 MB.")

    # Save to temp file for OpenCV
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        frames = extract_frames(tmp_path, NUM_FRAMES)
        os.unlink(tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Frame extraction failed: {exc}")

    if not frames:
        raise HTTPException(status_code=422, detail="No frames could be extracted from the video.")

    # Analyze each frame with Groq Vision
    frame_results = []
    all_reasoning = []

    for i, frame_bytes in enumerate(frames):
        try:
            result = analyze_frame_with_groq(frame_bytes, i + 1)
            confidence = result.get("confidence", 0.5)
            is_ai = result.get("is_ai_generated", False)
            fake_score = confidence if is_ai else 1.0 - confidence
            frame_results.append({
                "frame": i + 1,
                "is_ai_generated": is_ai,
                "fake_score": round(fake_score, 4),
                "reasoning": result.get("reasoning", [])
            })
            all_reasoning.extend(result.get("reasoning", []))
        except Exception as exc:
            # Skip failed frames
            frame_results.append({
                "frame": i + 1,
                "error": str(exc)
            })

    # Average fake scores across all successfully analyzed frames
    valid_scores = [r["fake_score"] for r in frame_results if "fake_score" in r]
    if not valid_scores:
        raise HTTPException(status_code=422, detail="All frame analyses failed.")

    avg_fake_score = sum(valid_scores) / len(valid_scores)
    real_score = 1.0 - avg_fake_score
    is_deepfake = avg_fake_score > 0.5

    elapsed_ms = round((time.time() - start) * 1000)

    return JSONResponse({
        "input_type": "video",
        "deepfake_detection": {
            "is_deepfake":       is_deepfake,
            "confidence":        round(avg_fake_score, 4),
            "real_score":        round(real_score, 4),
            "verdict":           get_verdict(avg_fake_score),
            "model_used":        "meta-llama/llama-4-scout-17b-16e-instruct (Vision)",
            "frames_analyzed":   len(valid_scores),
            "frame_details":     frame_results,
            "reasoning":         list(set(all_reasoning))[:6]
        },
        "metadata": {
            "filename":             file.filename,
            "content_type":         file.content_type,
            "file_size_bytes":      len(video_bytes),
            "api_response_time_ms": elapsed_ms
        }
    })
