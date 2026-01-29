from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    # Placeholder: implement OCR parsing using pytesseract + pdf2image
    return JSONResponse({"text": "extracted text placeholder"})
