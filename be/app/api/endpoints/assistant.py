from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.services.groq_service import ask_gudangku_ai

router = APIRouter()

@router.post("/chat")
async def chat_with_ai(
    question: str = Form(...),
    file: UploadFile = File(None)
):
    try:
        response = await ask_gudangku_ai(question, file)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
