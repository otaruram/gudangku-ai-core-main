from langchain_groq import ChatGroq
from app.core.config import get_settings
from fastapi import UploadFile
import io
import PyPDF2

# Import the Forecast Summary Helper
from app.services.prophet_service import get_latest_forecast_summary

settings = get_settings()

async def extract_text_from_pdf(file: UploadFile) -> str:
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text[:10000] # Limit context to avoid token limits
    except Exception as e:
        return f"[Error membaca PDF: {str(e)}]"

async def ask_gudangku_ai(user_question: str, file: UploadFile = None):
    if not settings.GROQ_API_KEY:
        return "GROQ_API_KEY is not set. Please configure the backend."
        
    # 1. Get Warehouse Context (Live Forecast)
    forecast_context = await get_latest_forecast_summary()
    
    # Sanitization: Don't feed raw error logs to the LLM
    if "Gagal" in forecast_context or "Error" in forecast_context:
        # Fallback context so LLM doesn't panic
        forecast_context = "Data forecast belum tersedia. Arahkan user untuk upload CSV di menu 'Intelligence Engine' jika menanyakan stok."

    # 2. Get Document Context (PDF)
    document_context = ""
    if file:
        document_context = await extract_text_from_pdf(file)
        document_context = f"\nISI DOKUMEN/KONTRAK YG DIUPLOAD:\n{document_context}\n"
        
    llm = ChatGroq(
        temperature=0.3, # Slight creativity for professional tone
        groq_api_key=settings.GROQ_API_KEY, 
        model_name="llama-3.3-70b-versatile"
    )
    
    prompt = f"""
    ROLE: Kamu adalah 'Gudangku Virtual Manager', asisten profesional Supply Chain.
    
    DATA GUDANG SAAT INI (LIVE FORECAST):
    {forecast_context}

    {document_context}

    PERTANYAAN USER:
    {user_question}

    INSTRUKSI:
    1. Jawab dengan nada profesional, solutif, dan ringkas (mirip konsultan McKinsey).
    2. GABUNGKAN data forecast dengan isi dokumen jika relevan. 
       Contoh: "Stok Beras kritis (sisa 2 hari). Sesuai kontrak PT. Padi (PDF), lead time pengiriman 3 hari, jadi Anda harus pesan SEKARANG."
    3. Jika kondisi aman, katakan "Operasional lancar".
    4. Gunakan bahasa Indonesia yang baik.
    """
    
    try:
        response = await llm.ainvoke(prompt) # Async invoke
        content = response.content

        # Save to DB for History
        try:
             from app.core.db import db
             if db.is_connected():
                 await db.chatlog.create(
                     data={
                         "question": user_question,
                         "answer": content,
                         "isHelpful": True 
                     }
                 )
        except Exception as save_err:
            print(f"⚠️ Failed to save ChatLog: {save_err}")

        return content
    except Exception as e:
        return f"Error contacting AI: {str(e)}"
