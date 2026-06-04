import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
import aiosmtplib
from email.message import EmailMessage

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

app = FastAPI(title="TravelPro API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TourRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Имя клиента не может быть пустым")
    phone: str = Field(..., min_length=5, description="Телефон не может быть пустым")
    email: Optional[EmailStr] = None
    comment: Optional[str] = None


async def send_email_notification(data: TourRequest):
    message = EmailMessage()
    message["From"] = SMTP_USER
    message["To"] = ADMIN_EMAIL
    message["Subject"] = f"Новая заявка на тур от {data.name}"

    body = f"""
    Поступила новая заявка с лендинга:
    
    Имя: {data.name}
    Телефон: {data.phone}
    Email: {data.email if data.email else 'Не указан'}
    Направление/Комментарий: {data.comment if data.comment else 'Не указано'}
    """
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            use_tls=True,
        )
    except Exception as e:

        print(f"Ошибка при отправке email: {e}")


@app.post("/api/tour-request")
async def create_tour_request(
    request_data: TourRequest, background_tasks: BackgroundTasks
):
    try:

        background_tasks.add_task(send_email_notification, request_data)

        return {"status": "success", "message": "Заявка успешно принята"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")
