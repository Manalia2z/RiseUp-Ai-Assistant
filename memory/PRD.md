# RiseUp AI — Product Requirements (MVP v1)

## Vision
An AI-powered life coach & goal achievement app. Tagline: "Your AI Friend Who Never Lets You Give Up."

## Stack
- Frontend: Expo (React Native) with expo-router, TypeScript
- Backend: FastAPI + MongoDB (motor)
- Auth: JWT (email + password, bcrypt via passlib)
- LLM: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via Emergent Universal LLM Key (`emergentintegrations`)

## Feature scope (v1 – implemented)
1. **Auth**
   - Register (email/password/name)
   - Login → JWT
   - `GET /api/auth/me`
2. **Onboarding** — role selection + 15+ questions (age, wake/sleep, work hours, stress, fitness, distractions, strengths, weaknesses, routine style, learning style, AI personality)
3. **Goals**
   - CRUD (health, career, learning, mindset, finance, custom)
   - AI-generated plan: summary, milestones, daily tasks (auto-seeded to today), weekly tasks, coach tips
4. **Tasks & Habits** — day-scoped tasks with XP; habit streaks
5. **AI Friend Chat** — multi-turn memory, personality-driven system prompt, per-user session
6. **Wellness** — mood log, journal / gratitude / reflection, breathing exercise (4-2-4), affirmations, emergency calm
7. **Dashboard** — greeting, streak hero, bento stats (productivity, coins, tasks, goals), today's tasks, active goals, quick actions
8. **Profile** — user card with XP/level/streak badges, weekly report, AI personality selector, nav to alarms/goals/wellness, logout, Manali Tech footer (link to https://manalitech.com)
9. **Smart Alarm** — create alarms with verification challenge (math, typing, memory sequence, sentence read). Verification awards XP.
10. **Gamification** — XP + level + coins + streak; XP granted on task completion (+task xp), habit check (+5), alarm verify (+25 & streak +1).
11. **Progress reports** — `/api/reports/weekly` returns completion rate, energy, streak, per-day breakdown.

## Deferred to v2
Wearables, website blocker, social/community, voice AI calls, Face-ID/selfie/QR alarm challenges, resume builder, learning hub deep-dive, native push notifications, Apple/Phone/Google auth.

## Design
- Dark-first (Tactical Empathy) — `#0A0A0A` bg, `#141414` card, `#FF5E00` primary, `#3B82F6` accent
- Rounded, glassy, gradients on hero cards, safe-area everywhere, bottom tab bar
- Full test IDs on all interactive elements

## Env vars
Backend `.env`:
- `MONGO_URL`, `DB_NAME`
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `EMERGENT_LLM_KEY`, `LLM_PROVIDER=anthropic`, `LLM_MODEL=claude-sonnet-4-5-20250929`

Frontend `.env`:
- `EXPO_PUBLIC_BACKEND_URL` (preserved)
