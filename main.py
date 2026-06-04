import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv
import aiosmtplib
from email.message import EmailMessage

# Загружаем переменные окружения из .env
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

# Инициализация приложения
app = FastAPI(title="TravelPro API")

# Настройка CORS
# Разрешаем запросы с любых доменов (в продакшене лучше указать конкретные домены фронтенда)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Например: ["http://localhost:5500", "https://mysite.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic-модель для валидации входящего JSON
class TourRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Имя клиента не может быть пустым")
    phone: str = Field(..., min_length=5, description="Телефон не может быть пустым")
    email: Optional[EmailStr] = None
    comment: Optional[str] = None

# Асинхронная функция отправки email
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
            use_tls=True # Используем TLS для 465 порта
        )
    except Exception as e:
        # В реальном проекте здесь должен быть логгер (например, logging.error)
        print(f"Ошибка при отправке email: {e}")

# Эндпоинт обработки заявки
@app.post("/api/tour-request")
async def create_tour_request(request_data: TourRequest, background_tasks: BackgroundTasks):
    try:
        # Добавляем задачу отправки письма в фон
        background_tasks.add_task(send_email_notification, request_data)
        
        return {"status": "success", "message": "Заявка успешно принята"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")