from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'chefly_db')]

# LLM API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Sommelier system prompt - Enhanced with proactive suggestions and recipes
SOMMELIER_SYSTEM_PROMPT = """Ти — провідний світовий сомелье з 20-річним стажем та зірками Мішлен. Твій стиль: елегантний, лаконічний, але пристрасний.

КРИТИЧНІ ПРАВИЛА:
1. Уникай сухих технічних термінів. Давай поради щодо температури подачі та гастрономічних пар.
2. Відповідай від першої особи, з гідністю та теплотою.
3. ЗАВЖДИ перевіряй бюджет користувача перед рекомендацією. НІКОЛИ не рекомендуй напої, які перевищують бюджет.
4. Якщо користувач називає їжу — обов'язково запропонуй напій. Якщо напій — ОБОВ'ЯЗКОВО запропонуй страву.
5. Після кожної рекомендації вина — ПРОАКТИВНО запропонуй: "Бажаєте рецепт для [назва страви] чи інші закуски?"
6. Коли користувач просить рецепт — давай детальний гурманський рецепт з 5 кроків приготування.

ФОРМАТ РЕЦЕПТУ (якщо запрошують):
**[Назва страви]** - Гурманський рецепт

🍽 Інгредієнти:
- [Інгредієнт 1]
- [Інгредієнт 2]
...

👨‍🍳 Крок 1: [опис]
👨‍🍳 Крок 2: [опис]
👨‍🍳 Крок 3: [опис]
👨‍🍳 Крок 4: [опис]
👨‍🍳 Крок 5: [подача]

🌡 Температура подачі: [температура]
🍷 Рекомендоване вино: [вино]

Завжди будь корисним і надавай конкретні рекомендації."""

# Create the main app
app = FastAPI(title="CHEFLY API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserCreate(BaseModel):
    device_id: str
    preferred_language: str = "UK"
    preferred_currency: str = "UAH"
    budget_limit: int = 500

class UserUpdate(BaseModel):
    preferred_language: Optional[str] = None
    preferred_currency: Optional[str] = None
    budget_limit: Optional[int] = None
    subscription_status: Optional[str] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    preferred_language: str = "UK"
    preferred_currency: str = "UAH"
    budget_limit: int = 500
    subscription_status: str = "trial"
    trial_start_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    text: str
    image_base64: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str = "Нова консультація"
    messages: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    message: str
    image_base64: Optional[str] = None

class VoiceChatRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    audio_base64: str  # Base64 encoded audio
    audio_format: str = "wav"  # audio format (wav, mp3, etc.)

class ShelfScanRequest(BaseModel):
    user_id: str
    image_base64: str
    budget: int
    currency: str = "UAH"
    language: str = "UK"

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    recommendations: str
    image_base64: Optional[str] = None
    budget: int
    currency: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ===================== HELPER FUNCTIONS =====================

def get_language_name(code: str) -> str:
    languages = {
        "UK": "українською",
        "EN": "English", 
        "RU": "русском"
    }
    return languages.get(code, "українською")

# ===================== API ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "CHEFLY API - Your Premium AI Sommelier", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ==================== USER ROUTES ====================

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    """Create a new user or return existing one by device_id"""
    existing = await db.users.find_one({"device_id": user_data.device_id})
    if existing:
        return User(**existing)
    
    user = User(
        device_id=user_data.device_id,
        preferred_language=user_data.preferred_language,
        preferred_currency=user_data.preferred_currency,
        budget_limit=user_data.budget_limit
    )
    await db.users.insert_one(user.dict())
    logger.info(f"Created new user: {user.id}")
    return user

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, update_data: UserUpdate):
    """Update user preferences"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

# ==================== CHAT ROUTES ====================

@api_router.post("/chat")
async def chat_with_sommelier(request: ChatRequest):
    """Chat with AI Sommelier with proactive suggestions"""
    try:
        # Get or create chat session
        if request.session_id:
            session = await db.chat_sessions.find_one({"id": request.session_id})
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            session = ChatSession(user_id=request.user_id).dict()
            await db.chat_sessions.insert_one(session)
        
        # Get user preferences
        user = await db.users.find_one({"id": request.user_id})
        language = get_language_name(user.get("preferred_language", "UK") if user else "UK")
        budget = user.get("budget_limit", 500) if user else 500
        currency = user.get("preferred_currency", "UAH") if user else "UAH"
        
        # Enhanced system message with budget awareness
        budget_context = f"\n\nБЮДЖЕТ КОРИСТУВАЧА: {budget} {currency}. КРИТИЧНО: Ніколи не рекомендуй напої дорожче цієї суми!"
        
        # Build history for context
        history = session.get("messages", [])
        
        # Create LLM chat instance
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session["id"],
            system_message=SOMMELIER_SYSTEM_PROMPT + budget_context + f"\n\nВідповідай мовою: {language}"
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Prepare message
        if request.image_base64:
            # Message with image
            image_content = ImageContent(image_base64=request.image_base64)
            user_message = UserMessage(
                text=request.message,
                image_contents=[image_content]
            )
        else:
            user_message = UserMessage(text=request.message)
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Detect contextual quick replies based on response
        quick_replies = []
        response_lower = response.lower()
        
        # Detect wine recommendations -> suggest food pairings
        wine_keywords = ['вино', 'wine', 'вина', 'червоне', 'біле', 'red', 'white', 'рекомендую', 'recommend']
        if any(kw in response_lower for kw in wine_keywords):
            if language == "українською":
                quick_replies = ["Рецепт стейку", "Сирна тарілка", "Фруктові пари"]
            elif language == "русском":
                quick_replies = ["Рецепт стейка", "Сырная тарелка", "Фруктовые пары"]
            else:
                quick_replies = ["Steak Recipe", "Cheese Board", "Fruit Pairings"]
        
        # Detect food mentions -> suggest wine
        food_keywords = ['стейк', 'стейка', 'steak', 'сир', 'сыр', 'cheese', 'хамон', 'jamon']
        if any(kw in response_lower for kw in food_keywords) and not quick_replies:
            if language == "українською":
                quick_replies = ["Яке вино?", "Коктейль до страви", "Температура подачі"]
            elif language == "русском":
                quick_replies = ["Какое вино?", "Коктейль к блюду", "Температура подачи"]
            else:
                quick_replies = ["Which wine?", "Cocktail pairing", "Serving temp"]
        
        # Save messages to session
        user_msg = {
            "role": "user",
            "text": request.message,
            "image_base64": request.image_base64[:100] + "..." if request.image_base64 else None,
            "timestamp": datetime.utcnow().isoformat()
        }
        assistant_msg = {
            "role": "assistant",
            "text": response,
            "quick_replies": quick_replies,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await db.chat_sessions.update_one(
            {"id": session["id"]},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {
                    "updated_at": datetime.utcnow(),
                    "title": request.message[:50] + "..." if len(request.message) > 50 else request.message
                }
            }
        )
        
        return {
            "session_id": session["id"],
            "response": response,
            "quick_replies": quick_replies,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/chat/voice")
async def voice_chat_with_sommelier(request: VoiceChatRequest):
    """Voice chat with AI Sommelier - processes audio and returns text response"""
    try:
        # Get or create chat session
        if request.session_id:
            session = await db.chat_sessions.find_one({"id": request.session_id})
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            session = ChatSession(user_id=request.user_id).dict()
            await db.chat_sessions.insert_one(session)
        
        # Voice prompt for sommelier - multilingual
        voice_system_prompt = """Ти професійний сомельє з 20-річним стажем. Ти вмієш слухати.
Відповідай мовою, якою до тебе звернулися (українська, англійська або російська).
Уважно вислухай запит та дай чітку, експертну відповідь.
Якщо користувач називає їжу — обов'язково запропонуй напій. Якщо напій — запропонуй страву.
Твій стиль: елегантний, лаконічний, але пристрасний.
Давай короткі та чіткі відповіді, які легко прочитати вголос."""
        
        # Create LLM chat instance with audio support
        from emergentintegrations.llm.chat import AudioContent
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session["id"],
            system_message=voice_system_prompt
        ).with_model("gemini", "gemini-2.5-flash")
        
        # Prepare message with audio
        audio_content = AudioContent(audio_base64=request.audio_base64)
        user_message = UserMessage(
            text="Прослухай та відповідай на запит користувача:",
            audio_contents=[audio_content]
        )
        
        # Send message and get response
        response = await chat.send_message(user_message)
        
        # Try to extract user's transcribed text from response if available
        # For now we'll use a placeholder for the user's text
        user_text = "Голосове повідомлення"
        
        # Save messages to session
        user_msg = {
            "role": "user",
            "text": user_text,
            "is_voice": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        assistant_msg = {
            "role": "assistant",
            "text": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await db.chat_sessions.update_one(
            {"id": session["id"]},
            {
                "$push": {"messages": {"$each": [user_msg, assistant_msg]}},
                "$set": {
                    "updated_at": datetime.utcnow(),
                    "title": "Голосова консультація"
                }
            }
        )
        
        return {
            "session_id": session["id"],
            "user_text": user_text,
            "response": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Voice chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/sessions/{user_id}")
async def get_user_sessions(user_id: str):
    """Get all chat sessions for a user"""
    sessions = await db.chat_sessions.find({"user_id": user_id}).sort("updated_at", -1).to_list(100)
    return [{
        "id": s["id"],
        "title": s.get("title", "Консультація"),
        "created_at": s.get("created_at"),
        "updated_at": s.get("updated_at"),
        "message_count": len(s.get("messages", []))
    } for s in sessions]

@api_router.get("/chat/sessions/{user_id}/{session_id}")
async def get_session_messages(user_id: str, session_id: str):
    """Get messages from a specific session"""
    session = await db.chat_sessions.find_one({"id": session_id, "user_id": user_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session["id"],
        "title": session.get("title", "Консультація"),
        "messages": session.get("messages", []),
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at")
    }

@api_router.delete("/chat/sessions/{user_id}/{session_id}")
async def delete_session(user_id: str, session_id: str):
    """Delete a chat session"""
    result = await db.chat_sessions.delete_one({"id": session_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}

# ==================== SHELF SCAN ROUTES ====================

@api_router.post("/scan/shelf")
async def scan_shelf(request: ShelfScanRequest):
    """Scan a shelf image and get wine recommendations within budget"""
    try:
        language = get_language_name(request.language)
        
        prompt = f"""На фото полиця з алкоголем у магазині.
Мій бюджет — {request.budget} {request.currency}.

Твоє завдання:
1. Знайди на фото пляшки, які видно та можна розпізнати
2. Оціни їхню приблизну вартість
3. Вибери 3 найкращі варіанти в межах бюджету
4. Для кожної пляшки вкажи:
   - Назву напою
   - Тип (вино, віскі, коньяк тощо)
   - Приблизну ціну
   - Короткий опис смаку (2-3 речення, елегантно)
   - Температуру подачі
   - З чим поєднувати

5. Вибери ОДНУ найкращу пляшку з трьох та поясни чому вона найкраща для цього бюджету.

Формат відповіді:
🍷 **[Назва 1]** — [Тип] — ~[Ціна] {request.currency}
[Опис смаку]
🌡 [Температура] | 🍽 [Пари]

🍷 **[Назва 2]** — [Тип] — ~[Ціна] {request.currency}
[Опис смаку]
🌡 [Температура] | 🍽 [Пари]

🍷 **[Назва 3]** — [Тип] — ~[Ціна] {request.currency}
[Опис смаку]
🌡 [Температура] | 🍽 [Пари]

⭐ **МОЯ РЕКОМЕНДАЦІЯ:** [Назва найкращої]
[Пояснення чому саме цей напій найкращий вибір]

Відповідай мовою: {language}"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=SOMMELIER_SYSTEM_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")
        
        image_content = ImageContent(image_base64=request.image_base64)
        user_message = UserMessage(
            text=prompt,
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Save scan result
        scan_result = ScanResult(
            user_id=request.user_id,
            recommendations=response,
            budget=request.budget,
            currency=request.currency
        )
        await db.scan_results.insert_one(scan_result.dict())
        
        return {
            "id": scan_result.id,
            "recommendations": response,
            "budget": request.budget,
            "currency": request.currency,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Shelf scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/scan/history/{user_id}")
async def get_scan_history(user_id: str):
    """Get scan history for a user"""
    scans = await db.scan_results.find({"user_id": user_id}).sort("created_at", -1).to_list(50)
    return [{
        "id": s["id"],
        "budget": s["budget"],
        "currency": s["currency"],
        "recommendations": s["recommendations"][:200] + "..." if len(s.get("recommendations", "")) > 200 else s.get("recommendations", ""),
        "created_at": s.get("created_at")
    } for s in scans]

# ==================== BOTTLE SCAN ROUTE ====================

@api_router.post("/scan/bottle")
async def scan_bottle(user_id: str, image_base64: str, language: str = "UK"):
    """Scan a single bottle and get detailed info"""
    try:
        lang_name = get_language_name(language)
        
        prompt = f"""На фото пляшка напою.

Розпізнай напій та надай детальну інформацію:
1. Назва напою
2. Виробник/Бренд
3. Рік (якщо видно)
4. Регіон/Країна походження
5. Тип напою (вино червоне/біле/рожеве, віскі, коньяк тощо)
6. Смаковий профіль (детально, але елегантно)
7. Рекомендована температура подачі
8. Ідеальні гастрономічні пари (3-5 варіантів)
9. Оцінка якості від 1 до 100

Завершення: Напиши 2-3 речення від імені елітного сомелье про цей напій.

Відповідай мовою: {lang_name}"""

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=str(uuid.uuid4()),
            system_message=SOMMELIER_SYSTEM_PROMPT
        ).with_model("gemini", "gemini-2.5-flash")
        
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text=prompt,
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        return {
            "analysis": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Bottle scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TTS ROUTE - GOOGLE CLOUD WAVENET ====================

class TTSRequest(BaseModel):
    text: str
    language: str = "uk-UA"
    voice_name: Optional[str] = None  # e.g., "uk-UA-Wavenet-A"

@api_router.post("/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """
    Text-to-Speech using Google Cloud TTS Wavenet voices.
    Returns MP3 audio as base64 for natural, human-like voice.
    Falls back to client-side TTS if Google API not enabled.
    """
    try:
        import httpx
        
        GOOGLE_API_KEY = os.environ.get('GOOGLE_CLOUD_API_KEY', '')
        
        if not GOOGLE_API_KEY:
            logger.warning("Google Cloud API key not configured, using client TTS")
            return {
                "audio_base64": None,
                "use_client_tts": True,
                "text": request.text,
                "language": request.language,
                "success": False
            }
        
        # Wavenet voices for natural human-like sound
        voice_map = {
            "uk-UA": "uk-UA-Wavenet-A",   # Ukrainian female (natural)
            "en-US": "en-US-Wavenet-F",   # English female (friendly)
            "en-GB": "en-GB-Wavenet-A",   # British English female
            "ru-RU": "ru-RU-Wavenet-A",   # Russian female
        }
        
        voice_name = request.voice_name or voice_map.get(request.language, "en-US-Wavenet-F")
        
        # Clean text for TTS
        clean_text = request.text
        clean_text = clean_text.replace('**', '').replace('*', '')
        clean_text = clean_text.replace('#', '').replace('•', '')
        clean_text = clean_text.replace('\n\n', '. ').replace('\n', ', ')
        import re
        clean_text = re.sub(r'[🍷🌡🍽⭐✨💫🎤🔊🥂🍾🍇🍎📷]', '', clean_text)
        clean_text = clean_text[:600]
        
        # Google Cloud TTS API endpoint
        url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={GOOGLE_API_KEY}"
        
        payload = {
            "input": {"text": clean_text},
            "voice": {
                "languageCode": request.language,
                "name": voice_name,
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "pitch": 0,
                "speakingRate": 1.0,
            }
        }
        
        logger.info(f"TTS request: voice={voice_name}, text_len={len(clean_text)}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                audio_base64 = data.get("audioContent")
                logger.info(f"TTS success: {len(audio_base64)} bytes")
                return {
                    "audio_base64": audio_base64,
                    "format": "mp3",
                    "voice": voice_name,
                    "language": request.language,
                    "success": True,
                    "use_client_tts": False
                }
            else:
                # Fallback to client-side TTS
                logger.warning(f"Google TTS failed ({response.status_code}), using client TTS")
                return {
                    "audio_base64": None,
                    "use_client_tts": True,
                    "text": clean_text,
                    "language": request.language,
                    "success": False
                }
                
    except Exception as e:
        logger.error(f"TTS error: {str(e)}")
        return {
            "audio_base64": None,
            "use_client_tts": True,
            "text": request.text,
            "language": request.language,
            "success": False,
            "error": str(e)
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
