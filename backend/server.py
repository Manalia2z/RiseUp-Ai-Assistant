"""
RiseUp AI - Backend Server
AI-Powered Goal Achievement & Life Coach
"""
import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from jose import jwt, JWTError
from passlib.context import CryptContext

# Load env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------- Configuration ----------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET_KEY"]
JWT_ALG = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "anthropic")
LLM_MODEL = os.environ.get("LLM_MODEL", "claude-sonnet-4-5-20250929")

# ---------------- Init ----------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("riseup")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

app = FastAPI(title="RiseUp AI")
api = APIRouter(prefix="/api")


# ---------------- Models ----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class OnboardingPayload(BaseModel):
    role: str
    age: Optional[int] = None
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    work_hours: Optional[str] = None
    free_hours: Optional[str] = None
    stress_level: Optional[int] = None  # 1-10
    fitness_level: Optional[int] = None
    current_habits: Optional[str] = None
    distractions: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    routine_style: Optional[str] = None  # strict/flexible
    learning_style: Optional[str] = None
    ai_personality: Optional[str] = "Best Friend"


class GoalCreate(BaseModel):
    title: str
    category: str  # health, career, learning, mindset, finance, custom
    description: Optional[str] = None
    deadline_days: Optional[int] = 30
    context: Optional[Dict[str, Any]] = None  # role-specific answers


class TaskCreate(BaseModel):
    title: str
    time_of_day: str = "morning"  # morning/afternoon/evening/night
    goal_id: Optional[str] = None
    scheduled_date: Optional[str] = None  # ISO date YYYY-MM-DD
    reminder_time: Optional[str] = None   # HH:MM
    icon: Optional[str] = "check-circle"
    xp: int = 10


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    time_of_day: Optional[str] = None
    scheduled_date: Optional[str] = None
    reminder_time: Optional[str] = None


class HabitCreate(BaseModel):
    title: str
    icon: Optional[str] = "flame"
    target_per_day: int = 1


class MoodEntry(BaseModel):
    mood: str  # great/good/okay/low/bad
    energy: int = 5
    stress: int = 5
    sleep_quality: int = 5
    note: Optional[str] = None


class JournalEntry(BaseModel):
    kind: str = "journal"  # journal/gratitude/reflection
    text: str


class ChatMessage(BaseModel):
    text: str
    session_id: Optional[str] = None


class AlarmCreate(BaseModel):
    label: str
    time: str  # HH:MM
    verification: str = "math"  # math/typing/selfie/voice
    active: bool = True


# ---------------- Helpers ----------------
def now_utc():
    return datetime.now(timezone.utc)


def hash_password(p: str) -> str:
    return pwd_context.hash(p)


def verify_password(p: str, h: str) -> bool:
    try:
        return pwd_context.verify(p, h)
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    exp = now_utc() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": exp}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, Any]:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        uid = payload.get("sub")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def public_user(u: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name"),
        "xp": u.get("xp", 0),
        "level": u.get("level", 1),
        "coins": u.get("coins", 0),
        "streak": u.get("streak", 0),
        "onboarded": u.get("onboarded", False),
        "profile": u.get("profile", {}),
        "ai_personality": u.get("ai_personality", "Best Friend"),
        "created_at": u.get("created_at"),
    }


# ---------------- LLM (Claude) ----------------
async def call_llm(system_prompt: str, user_message: str, session_id: str) -> str:
    """Non-streaming LLM call using emergentintegrations."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt,
        ).with_model(LLM_PROVIDER, LLM_MODEL)
        response = await chat.send_message(UserMessage(text=user_message))
        return str(response)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return "I'm having trouble connecting right now, but I'm still here for you. Please try again in a moment."


def personality_prompt(personality: str, profile: Dict[str, Any], goals_summary: str) -> str:
    styles = {
        "Strict Coach": "You are a strict, no-nonsense coach. Direct and firm but always caring. Push the user hard.",
        "Best Friend": "You are the user's best friend. Warm, casual, funny, deeply empathetic. Use natural conversational tone.",
        "Big Brother": "You are a caring older brother. Protective, wise, encouraging with tough love when needed.",
        "Big Sister": "You are a caring older sister. Nurturing, wise, honest, kind.",
        "Calm Therapist": "You are a calm, non-clinical wellness therapist. Reflect feelings, ask gentle questions, validate emotions.",
        "Military Discipline Coach": "You are a military-style discipline coach. Firm commands, high standards, but respectful.",
        "Funny Friend": "You are a hilarious best friend. Use humor, memes vibe, keep it light while still supportive.",
        "Professional Mentor": "You are a seasoned professional mentor. Strategic, structured advice, growth-focused.",
        "Motivator": "You are a high-energy motivator. Inspiring, uplifting, quotable, action-oriented.",
        "Teacher": "You are a patient teacher. Explain step by step, ask reflective questions, celebrate learning.",
    }
    style = styles.get(personality, styles["Best Friend"])
    profile_str = ", ".join(f"{k}: {v}" for k, v in (profile or {}).items() if v) or "no profile yet"
    return f"""You are RiseUp AI — an AI life coach, mentor, therapist and best friend.
{style}

USER PROFILE: {profile_str}
USER GOALS: {goals_summary or 'no goals yet'}

RULES:
- Remember previous context in this session.
- Never make the user feel guilty. Always constructive.
- Keep replies focused (2-6 sentences unless a plan is requested).
- Use natural language, not corporate. Be human.
- Offer 1 tiny next step when relevant.
- If the user is emotional, listen first, advise second.
"""


# ---------------- Health ----------------
@api.get("/")
async def root():
    return {"app": "RiseUp AI", "status": "ok"}


# ---------------- Auth ----------------
@api.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "created_at": now_utc().isoformat(),
        "xp": 0,
        "level": 1,
        "coins": 50,
        "streak": 0,
        "onboarded": False,
        "profile": {},
        "ai_personality": "Best Friend",
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id)
    return TokenResponse(access_token=token, user=public_user(doc))


@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"])
    return TokenResponse(access_token=token, user=public_user(user))


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)


# ---------------- Onboarding ----------------
@api.post("/onboarding")
async def save_onboarding(payload: OnboardingPayload, user=Depends(get_current_user)):
    profile = payload.dict()
    ai_personality = profile.pop("ai_personality", "Best Friend")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"profile": profile, "onboarded": True, "ai_personality": ai_personality}},
    )
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return public_user(updated)


@api.put("/profile/personality")
async def set_personality(body: Dict[str, str], user=Depends(get_current_user)):
    persona = body.get("ai_personality", "Best Friend")
    await db.users.update_one({"id": user["id"]}, {"$set": {"ai_personality": persona}})
    return {"ai_personality": persona}


# ---------------- Goals ----------------
@api.post("/goals")
async def create_goal(payload: GoalCreate, user=Depends(get_current_user)):
    goal_id = str(uuid.uuid4())
    doc = {
        "id": goal_id,
        "user_id": user["id"],
        "title": payload.title,
        "category": payload.category,
        "description": payload.description or "",
        "deadline_days": payload.deadline_days or 30,
        "context": payload.context or {},
        "progress": 0,
        "plan": None,
        "created_at": now_utc().isoformat(),
        "status": "active",
    }
    await db.goals.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/goals")
async def list_goals(user=Depends(get_current_user)):
    goals = await db.goals.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    return goals


@api.get("/goals/{goal_id}")
async def get_goal(goal_id: str, user=Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": user["id"]}, {"_id": 0})
    if not goal:
        raise HTTPException(404, "Goal not found")
    return goal


@api.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user=Depends(get_current_user)):
    await db.goals.delete_one({"id": goal_id, "user_id": user["id"]})
    await db.tasks.delete_many({"goal_id": goal_id, "user_id": user["id"]})
    return {"ok": True}


@api.post("/goals/{goal_id}/generate-plan")
async def generate_plan(goal_id: str, user=Depends(get_current_user)):
    """AI-generate a daily/weekly plan for the goal."""
    goal = await db.goals.find_one({"id": goal_id, "user_id": user["id"]}, {"_id": 0})
    if not goal:
        raise HTTPException(404, "Goal not found")
    profile = user.get("profile", {})
    persona = user.get("ai_personality", "Best Friend")

    system = f"""You are RiseUp AI, an expert life coach and planner. Personality: {persona}.
Create a personalized, realistic action plan.
Return ONLY valid JSON, no markdown fences.
Schema:
{{
  "summary": "2-3 line motivating summary",
  "milestones": ["milestone 1", "milestone 2", "milestone 3"],
  "daily_tasks": [
    {{"title": "task title", "time_of_day": "morning|afternoon|evening|night", "xp": 10, "icon": "dumbbell"}}
  ],
  "weekly_tasks": [
    {{"title": "weekly task", "day": "monday|tuesday|...", "xp": 20}}
  ],
  "tips": ["tip 1", "tip 2", "tip 3"]
}}
"""
    user_prompt = f"""Goal: {goal['title']}
Category: {goal['category']}
Description: {goal.get('description','')}
Deadline: {goal.get('deadline_days',30)} days
Extra context: {goal.get('context', {})}
User profile: {profile}
Generate the plan JSON now."""

    session_id = f"plan-{goal_id}"
    raw = await call_llm(system, user_prompt, session_id)

    # Parse JSON
    import json, re
    plan = None
    try:
        # strip code fences if present
        cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        plan = json.loads(cleaned)
    except Exception:
        # try to find first { .. last }
        m = re.search(r"\{[\s\S]*\}", raw)
        if m:
            try:
                plan = json.loads(m.group(0))
            except Exception:
                plan = None

    if not plan:
        plan = {
            "summary": f"Let's work toward: {goal['title']}. Small steps daily. You've got this.",
            "milestones": ["Week 1: Foundation", "Week 2: Consistency", "Week 3: Momentum"],
            "daily_tasks": [
                {"title": f"Work on {goal['title']} (30 min)", "time_of_day": "morning", "xp": 15, "icon": "target"},
                {"title": "Reflect on progress", "time_of_day": "evening", "xp": 5, "icon": "book"},
            ],
            "weekly_tasks": [{"title": "Weekly review", "day": "sunday", "xp": 25}],
            "tips": ["Start small", "Track daily", "Celebrate wins"],
        }

    await db.goals.update_one({"id": goal_id, "user_id": user["id"]}, {"$set": {"plan": plan}})

    # Auto-seed today's tasks
    today = now_utc().date().isoformat()
    seed_tasks = []
    for t in (plan.get("daily_tasks") or [])[:6]:
        seed_tasks.append({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "goal_id": goal_id,
            "title": t.get("title", "Task"),
            "time_of_day": t.get("time_of_day", "morning"),
            "scheduled_date": today,
            "reminder_time": None,
            "icon": t.get("icon", "check-circle"),
            "xp": int(t.get("xp", 10)),
            "completed": False,
            "created_at": now_utc().isoformat(),
        })
    if seed_tasks:
        await db.tasks.insert_many([dict(t) for t in seed_tasks])
    return {"plan": plan, "seeded_tasks": len(seed_tasks)}


# ---------------- Tasks ----------------
@api.post("/tasks")
async def create_task(payload: TaskCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "goal_id": payload.goal_id,
        "title": payload.title,
        "time_of_day": payload.time_of_day,
        "scheduled_date": payload.scheduled_date or now_utc().date().isoformat(),
        "reminder_time": payload.reminder_time,
        "icon": payload.icon,
        "xp": payload.xp,
        "completed": False,
        "created_at": now_utc().isoformat(),
    }
    await db.tasks.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/tasks")
async def list_tasks(date: Optional[str] = None, user=Depends(get_current_user)):
    q: Dict[str, Any] = {"user_id": user["id"]}
    if date:
        q["scheduled_date"] = date
    tasks = await db.tasks.find(q, {"_id": 0}).to_list(500)
    return tasks


@api.patch("/tasks/{task_id}")
async def update_task(task_id: str, payload: TaskUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in payload.dict().items() if v is not None}
    task = await db.tasks.find_one({"id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(404, "Task not found")

    # XP reward when transitioning to completed=True
    if updates.get("completed") is True and not task.get("completed", False):
        xp_gain = int(task.get("xp", 10))
        current_xp = int(user.get("xp", 0)) + xp_gain
        new_level = max(1, current_xp // 100 + 1)
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"xp": xp_gain, "coins": 5}, "$set": {"level": new_level}},
        )
    if updates:
        await db.tasks.update_one({"id": task_id, "user_id": user["id"]}, {"$set": updates})
    updated = await db.tasks.find_one({"id": task_id, "user_id": user["id"]}, {"_id": 0})
    return updated


@api.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user=Depends(get_current_user)):
    await db.tasks.delete_one({"id": task_id, "user_id": user["id"]})
    return {"ok": True}


# ---------------- Habits ----------------
@api.post("/habits")
async def create_habit(payload: HabitCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": payload.title,
        "icon": payload.icon,
        "target_per_day": payload.target_per_day,
        "streak": 0,
        "log": {},  # date -> count
        "created_at": now_utc().isoformat(),
    }
    await db.habits.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/habits")
async def list_habits(user=Depends(get_current_user)):
    habits = await db.habits.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    return habits


@api.post("/habits/{habit_id}/check")
async def check_habit(habit_id: str, user=Depends(get_current_user)):
    habit = await db.habits.find_one({"id": habit_id, "user_id": user["id"]}, {"_id": 0})
    if not habit:
        raise HTTPException(404, "Habit not found")
    today = now_utc().date().isoformat()
    log = habit.get("log", {})
    log[today] = int(log.get(today, 0)) + 1
    # simple streak calc
    streak = 0
    d = now_utc().date()
    while True:
        key = d.isoformat()
        if log.get(key, 0) >= habit.get("target_per_day", 1):
            streak += 1
            d = d - timedelta(days=1)
        else:
            break
    await db.habits.update_one({"id": habit_id}, {"$set": {"log": log, "streak": streak}})
    await db.users.update_one({"id": user["id"]}, {"$inc": {"xp": 5}})
    return {"log": log, "streak": streak}


@api.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user=Depends(get_current_user)):
    await db.habits.delete_one({"id": habit_id, "user_id": user["id"]})
    return {"ok": True}


# ---------------- Mood / Journal ----------------
@api.post("/mood")
async def log_mood(payload: MoodEntry, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **payload.dict(),
        "date": now_utc().date().isoformat(),
        "created_at": now_utc().isoformat(),
    }
    await db.moods.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/mood")
async def list_mood(user=Depends(get_current_user)):
    items = await db.moods.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(60)
    return items


@api.post("/journal")
async def create_journal(payload: JournalEntry, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **payload.dict(),
        "created_at": now_utc().isoformat(),
    }
    await db.journals.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/journal")
async def list_journal(user=Depends(get_current_user)):
    items = await db.journals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return items


@api.delete("/journal/{entry_id}")
async def delete_journal(entry_id: str, user=Depends(get_current_user)):
    await db.journals.delete_one({"id": entry_id, "user_id": user["id"]})
    return {"ok": True}


# ---------------- AI Chat ----------------
@api.post("/chat/message")
async def chat_send(payload: ChatMessage, user=Depends(get_current_user)):
    session_id = payload.session_id or f"chat-{user['id']}"
    profile = user.get("profile", {})
    persona = user.get("ai_personality", "Best Friend")
    goals = await db.goals.find({"user_id": user["id"], "status": "active"}, {"_id": 0}).to_list(20)
    goals_summary = "; ".join(f"{g['title']} ({g['category']})" for g in goals)

    system = personality_prompt(persona, profile, goals_summary)
    reply = await call_llm(system, payload.text, session_id)

    # Persist history
    now = now_utc().isoformat()
    await db.chat_messages.insert_many([
        {"id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id, "role": "user", "text": payload.text, "created_at": now},
        {"id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id, "role": "assistant", "text": reply, "created_at": now_utc().isoformat()},
    ])
    return {"reply": reply, "session_id": session_id}


@api.get("/chat/history")
async def chat_history(session_id: Optional[str] = None, user=Depends(get_current_user)):
    sid = session_id or f"chat-{user['id']}"
    msgs = await db.chat_messages.find({"user_id": user["id"], "session_id": sid}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs


# ---------------- Alarms (Smart) ----------------
@api.post("/alarms")
async def create_alarm(payload: AlarmCreate, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **payload.dict(),
        "created_at": now_utc().isoformat(),
        "snoozes": 0,
    }
    await db.alarms.insert_one(dict(doc))
    doc.pop("_id", None)
    return doc


@api.get("/alarms")
async def list_alarms(user=Depends(get_current_user)):
    items = await db.alarms.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
    return items


@api.delete("/alarms/{alarm_id}")
async def delete_alarm(alarm_id: str, user=Depends(get_current_user)):
    await db.alarms.delete_one({"id": alarm_id, "user_id": user["id"]})
    return {"ok": True}


@api.post("/alarms/{alarm_id}/verify")
async def verify_alarm(alarm_id: str, body: Dict[str, Any], user=Depends(get_current_user)):
    """Log a successful alarm verification and give XP."""
    alarm = await db.alarms.find_one({"id": alarm_id, "user_id": user["id"]}, {"_id": 0})
    if not alarm:
        raise HTTPException(404, "Alarm not found")
    await db.users.update_one({"id": user["id"]}, {"$inc": {"xp": 25, "streak": 1, "coins": 10}})
    await db.alarms.update_one({"id": alarm_id}, {"$set": {"snoozes": 0}})
    return {"ok": True, "xp_gained": 25}


# ---------------- Dashboard ----------------
@api.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    today = now_utc().date().isoformat()
    tasks = await db.tasks.find({"user_id": user["id"], "scheduled_date": today}, {"_id": 0}).to_list(200)
    completed = [t for t in tasks if t.get("completed")]
    habits = await db.habits.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    latest_mood = await db.moods.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(1).to_list(1)
    goals = await db.goals.find({"user_id": user["id"], "status": "active"}, {"_id": 0}).to_list(20)

    productivity = int((len(completed) / len(tasks)) * 100) if tasks else 0
    return {
        "today_tasks": tasks,
        "completed_count": len(completed),
        "total_count": len(tasks),
        "productivity": productivity,
        "habits": habits,
        "latest_mood": latest_mood[0] if latest_mood else None,
        "active_goals": len(goals),
        "goals": goals,
        "xp": user.get("xp", 0),
        "level": user.get("level", 1),
        "coins": user.get("coins", 0),
        "streak": user.get("streak", 0),
    }


# ---------------- Reports ----------------
@api.get("/reports/weekly")
async def weekly_report(user=Depends(get_current_user)):
    since = (now_utc() - timedelta(days=7)).isoformat()
    tasks = await db.tasks.find({"user_id": user["id"], "created_at": {"$gte": since}}, {"_id": 0}).to_list(1000)
    completed = [t for t in tasks if t.get("completed")]
    moods = await db.moods.find({"user_id": user["id"], "created_at": {"$gte": since}}, {"_id": 0}).to_list(200)
    by_day: Dict[str, Dict[str, int]] = {}
    for t in tasks:
        d = t.get("scheduled_date", "")
        by_day.setdefault(d, {"total": 0, "done": 0})
        by_day[d]["total"] += 1
        if t.get("completed"):
            by_day[d]["done"] += 1
    avg_mood_energy = round(sum(m.get("energy", 5) for m in moods) / max(len(moods), 1), 1)
    return {
        "range_days": 7,
        "total_tasks": len(tasks),
        "completed_tasks": len(completed),
        "completion_rate": int((len(completed) / len(tasks)) * 100) if tasks else 0,
        "avg_energy": avg_mood_energy,
        "by_day": by_day,
        "xp": user.get("xp", 0),
        "streak": user.get("streak", 0),
    }


# ---------------- Mount ----------------
app.include_router(api)
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
