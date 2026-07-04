"""
RiseUp AI - End-to-end backend test suite.
Covers auth, onboarding, personality, goals + AI plan (Claude Sonnet 4.5),
tasks + XP, habits + streak, mood, journal, chat (AI), alarms + verify,
dashboard, weekly reports, and auth protection.
Follows /api prefix and public URL from EXPO_PUBLIC_BACKEND_URL / EXPO_BACKEND_URL.
"""
import os
import time
import uuid
import pytest
import requests
from dotenv import load_dotenv

# load frontend .env for public URL
FRONT_ENV = "/app/frontend/.env"
if os.path.exists(FRONT_ENV):
    load_dotenv(FRONT_ENV)

BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or os.environ.get("EXPO_BACKEND_URL")
    or ""
).rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set"
API = f"{BASE_URL}/api"

TS = int(time.time())
EMAIL = f"test+{TS}@riseup.io"
PASSWORD = "Test1234"
NAME = "Test User"


# ---------- Shared state ----------
class Ctx:
    token = None
    user = None
    goal_id = None
    task_id = None
    habit_id = None
    alarm_id = None
    initial_xp = 0


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def auth_headers():
    return {"Authorization": f"Bearer {Ctx.token}"}


# ------------- Health -------------
def test_00_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ------------- Auth -------------
def test_01_register(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "name": NAME})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data["access_token"]
    u = data["user"]
    assert u["email"] == EMAIL.lower()
    assert u["onboarded"] is False
    assert u["xp"] == 0
    assert u["level"] == 1
    Ctx.token = data["access_token"]
    Ctx.user = u


def test_02_duplicate_register(session):
    r = session.post(f"{API}/auth/register", json={"email": EMAIL, "password": PASSWORD, "name": NAME})
    assert r.status_code == 400


def test_03_login(session):
    r = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data.get("access_token")
    assert data["user"]["email"] == EMAIL.lower()


def test_04_login_wrong_password(session):
    r = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": "WRONGpass9"})
    assert r.status_code == 401


def test_05_me(session):
    r = session.get(f"{API}/auth/me", headers=auth_headers())
    assert r.status_code == 200, r.text
    assert r.json()["email"] == EMAIL.lower()


def test_06_me_without_token_unauth(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ------------- Onboarding -------------
def test_10_onboarding(session):
    payload = {
        "role": "student",
        "age": 22,
        "wake_time": "06:30",
        "sleep_time": "23:00",
        "stress_level": 6,
        "fitness_level": 5,
        "ai_personality": "Best Friend",
    }
    r = session.post(f"{API}/onboarding", json=payload, headers=auth_headers())
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["onboarded"] is True
    assert body["ai_personality"] == "Best Friend"


def test_11_update_personality(session):
    r = session.put(f"{API}/profile/personality", json={"ai_personality": "Strict Coach"}, headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["ai_personality"] == "Strict Coach"
    # confirm via /me
    me = session.get(f"{API}/auth/me", headers=auth_headers()).json()
    assert me["ai_personality"] == "Strict Coach"


# ------------- Goals + AI Plan -------------
def test_20_create_goal(session):
    r = session.post(f"{API}/goals", json={
        "title": "Learn Python in 30 days",
        "category": "learning",
        "description": "Beginner to intermediate",
        "deadline_days": 30,
    }, headers=auth_headers())
    assert r.status_code == 200, r.text
    g = r.json()
    assert g["id"] and g["title"] == "Learn Python in 30 days"
    assert g["category"] == "learning"
    assert g["plan"] is None
    Ctx.goal_id = g["id"]


def test_21_list_goals(session):
    r = session.get(f"{API}/goals", headers=auth_headers())
    assert r.status_code == 200
    goals = r.json()
    assert any(g["id"] == Ctx.goal_id for g in goals)


def test_22_get_goal(session):
    r = session.get(f"{API}/goals/{Ctx.goal_id}", headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["id"] == Ctx.goal_id


def test_23_generate_ai_plan(session):
    """CRITICAL: Real AI plan with Claude Sonnet 4.5 via emergentintegrations."""
    r = session.post(f"{API}/goals/{Ctx.goal_id}/generate-plan", headers=auth_headers(), timeout=120)
    assert r.status_code == 200, r.text
    body = r.json()
    plan = body.get("plan")
    assert plan and isinstance(plan, dict)
    for k in ["summary", "milestones", "daily_tasks", "weekly_tasks", "tips"]:
        assert k in plan, f"Missing key {k}"
    assert isinstance(plan["daily_tasks"], list) and len(plan["daily_tasks"]) > 0
    # Detect fallback strings (indicating LLM/JSON parse failure)
    summary = plan.get("summary", "")
    is_fallback = summary.startswith("Let's work toward:")
    assert not is_fallback, f"AI plan appears to be fallback (LLM failure). Summary={summary}"
    # verify persisted
    g = session.get(f"{API}/goals/{Ctx.goal_id}", headers=auth_headers()).json()
    assert g.get("plan") is not None
    # verify tasks seeded
    seeded = body.get("seeded_tasks", 0)
    assert seeded > 0
    today = time.strftime("%Y-%m-%d")
    tr = session.get(f"{API}/tasks?date={today}", headers=auth_headers())
    assert tr.status_code == 200
    tasks = tr.json()
    assert any(t.get("goal_id") == Ctx.goal_id for t in tasks)


# ------------- Tasks + XP -------------
def test_30_create_manual_task(session):
    r = session.post(f"{API}/tasks", json={
        "title": "Manual test task",
        "time_of_day": "morning",
        "xp": 20,
    }, headers=auth_headers())
    assert r.status_code == 200, r.text
    t = r.json()
    assert t["id"] and t["completed"] is False
    Ctx.task_id = t["id"]


def test_31_list_today_tasks(session):
    today = time.strftime("%Y-%m-%d")
    r = session.get(f"{API}/tasks?date={today}", headers=auth_headers())
    assert r.status_code == 200
    ids = [t["id"] for t in r.json()]
    assert Ctx.task_id in ids


def test_32_complete_task_grants_xp(session):
    me_before = session.get(f"{API}/auth/me", headers=auth_headers()).json()
    xp_before = me_before.get("xp", 0)
    r = session.patch(f"{API}/tasks/{Ctx.task_id}", json={"completed": True}, headers=auth_headers())
    assert r.status_code == 200, r.text
    assert r.json()["completed"] is True
    me_after = session.get(f"{API}/auth/me", headers=auth_headers()).json()
    assert me_after["xp"] > xp_before, f"XP should increase. before={xp_before} after={me_after['xp']}"


# ------------- Habits -------------
def test_40_create_and_check_habit(session):
    r = session.post(f"{API}/habits", json={"title": "Drink water", "target_per_day": 1}, headers=auth_headers())
    assert r.status_code == 200
    Ctx.habit_id = r.json()["id"]
    r2 = session.post(f"{API}/habits/{Ctx.habit_id}/check", headers=auth_headers())
    assert r2.status_code == 200
    assert r2.json()["streak"] == 1


# ------------- Mood + Journal -------------
def test_50_mood(session):
    r = session.post(f"{API}/mood", json={"mood": "good", "energy": 7, "stress": 4, "sleep_quality": 6}, headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["mood"] == "good"


def test_51_journal(session):
    r = session.post(f"{API}/journal", json={"kind": "gratitude", "text": "Grateful for testing framework"}, headers=auth_headers())
    assert r.status_code == 200
    assert r.json()["kind"] == "gratitude"


# ------------- AI Chat -------------
def test_60_chat_message(session):
    """CRITICAL: Real AI reply via Claude Sonnet 4.5."""
    r = session.post(f"{API}/chat/message", json={"text": "I am feeling lazy today"}, headers=auth_headers(), timeout=90)
    assert r.status_code == 200, r.text
    body = r.json()
    reply = body.get("reply", "")
    assert reply and isinstance(reply, str)
    assert len(reply.strip()) > 10, f"Reply too short: {reply}"
    fallback = "I'm having trouble connecting right now"
    assert fallback not in reply, f"LLM fallback returned: {reply}"


def test_61_chat_history(session):
    r = session.get(f"{API}/chat/history", headers=auth_headers())
    assert r.status_code == 200
    msgs = r.json()
    assert len(msgs) >= 2
    roles = [m["role"] for m in msgs]
    # First is user, then assistant
    assert roles[0] == "user"
    assert "assistant" in roles


# ------------- Alarms -------------
def test_70_alarm_create_and_verify(session):
    r = session.post(f"{API}/alarms", json={"label": "Morning wake", "time": "06:30", "verification": "math"}, headers=auth_headers())
    assert r.status_code == 200
    Ctx.alarm_id = r.json()["id"]
    me_before = session.get(f"{API}/auth/me", headers=auth_headers()).json()
    xp_b = me_before["xp"]
    r2 = session.post(f"{API}/alarms/{Ctx.alarm_id}/verify", json={"proof": "42"}, headers=auth_headers())
    assert r2.status_code == 200
    assert r2.json()["xp_gained"] == 25
    me_after = session.get(f"{API}/auth/me", headers=auth_headers()).json()
    assert me_after["xp"] == xp_b + 25


# ------------- Dashboard -------------
def test_80_dashboard(session):
    r = session.get(f"{API}/dashboard", headers=auth_headers())
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ["today_tasks", "completed_count", "productivity", "streak", "xp", "level", "coins", "active_goals", "latest_mood"]:
        assert k in d, f"Missing dashboard key {k}"
    assert d["active_goals"] >= 1
    assert d["latest_mood"] is not None


# ------------- Weekly report -------------
def test_81_weekly_report(session):
    r = session.get(f"{API}/reports/weekly", headers=auth_headers())
    assert r.status_code == 200
    d = r.json()
    for k in ["completion_rate", "avg_energy", "by_day"]:
        assert k in d


# ------------- Auth protection -------------
@pytest.mark.parametrize("path,method", [
    ("/goals", "GET"),
    ("/tasks", "GET"),
    ("/dashboard", "GET"),
    ("/chat/history", "GET"),
    ("/mood", "GET"),
    ("/habits", "GET"),
    ("/alarms", "GET"),
    ("/reports/weekly", "GET"),
])
def test_90_protected_endpoints_require_auth(session, path, method):
    r = session.request(method, f"{API}{path}")
    assert r.status_code == 401, f"{path} should require auth, got {r.status_code}"
