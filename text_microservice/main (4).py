from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
import os
import time
import json

load_dotenv()

app = FastAPI(
    title="Text Deepfake Detection API",
    description="Detects AI-generated text using Groq LLaMA",
    version="1.0.0"
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class TextInput(BaseModel):
    text: str

@app.get("/")
def health_check():
    return {"status": "ok", "service": "deepfake-detector"}

@app.post("/detect/text")
def detect_text(input: TextInput):
    start_time = time.time()

    prompt = f"""
    Analyze the following text and determine if it was AI-generated or written by a human.

    Respond ONLY with a valid JSON object in this exact format, no extra text, no markdown, no backticks:
    {{
        "is_ai_generated": true or false,
        "confidence": a float between 0.0 and 1.0,
        "misinformation_score": a float between 0.0 and 1.0,
        "propaganda_score": a float between 0.0 and 1.0,
        "reasoning_bullets": ["reason 1", "reason 2", "reason 3"]
    }}

    Text to analyze:
    {input.text}
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI detection expert. You only respond with raw JSON, no markdown, no explanation."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1
        )

        response_text = response.choices[0].message.content.strip()

        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]

        result = json.loads(response_text)

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "input_type": "text",
            "ai_content_detection": {
                "is_ai_generated": result["is_ai_generated"],
                "confidence": result["confidence"],
                "model_used": "llama-3.3-70b-versatile",
                "misinformation_score": result["misinformation_score"],
                "propaganda_score": result["propaganda_score"],
                "reasoning_bullets": result["reasoning_bullets"]
            },
            "metadata": {
                "text_length_chars": len(input.text),
                "api_response_time_ms": elapsed_ms
            }
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse model response as JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)