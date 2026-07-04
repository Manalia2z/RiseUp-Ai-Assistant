================================================================================
  RiseUp AI — AI-Powered Goal Achievement & Life Coach
  "Your AI Friend Who Never Lets You Give Up."
  Made with love. Partner: Manali Tech (https://manalitech.com)
================================================================================


TABLE OF CONTENTS
-----------------
 1.  Project overview
 2.  Feature list (v1)
 3.  Tech stack & languages
 4.  Repository structure
 5.  Prerequisites
 6.  Environment variables
 7.  How to run (Emergent preview — you are here)
 8.  How to run locally on your own machine
 9.  API reference (all endpoints)
10.  Test credentials & smoke tests
11.  Troubleshooting
12.  Deployment
13.  What is deferred to v2
14.  Credits


================================================================================
1. PROJECT OVERVIEW
================================================================================

RiseUp AI is a full-stack mobile app (Expo React Native + FastAPI + MongoDB)
that acts as an AI life coach, mentor, therapist and best friend. It builds a
personalized daily/weekly plan for every goal you set, remembers you across
chats, tracks your habits, mood, streaks, XP and levels, and includes a Smart
Alarm you can't dismiss until you solve a challenge.


================================================================================
2. FEATURE LIST (v1 — SHIPPED)
================================================================================

  * Email + Password authentication (JWT, bcrypt)
  * 6-step onboarding (role + 15 profile Qs + AI personality)
  * Goals with AI-generated plan
      - summary, milestones, daily tasks (auto-seeded), weekly tasks, tips
      - powered by Claude Sonnet 4.5
  * AI Friend Chat
      - multi-turn memory of goals & profile
      - 10 personality styles (Best Friend, Strict Coach, Big Brother/Sister,
        Calm Therapist, Military Discipline, Funny Friend, Professional Mentor,
        Motivator, Teacher)
  * Dashboard
      - greeting, streak hero card, bento stats, today's tasks, active goals,
        quick actions
  * Habits with streak tracking
  * Mood check-in, Journal / Gratitude / Reflection, 4-2-4 Breathing exercise,
    Daily affirmation, Emergency Calm mode
  * Smart Alarm with dismiss challenges
      - Math puzzle / Typing / Memory sequence / Read a sentence
      - Verification grants +25 XP and streak +1
  * Gamification: XP, Levels, Coins, Streaks
  * Weekly progress report (completion %, energy, streak, per-day breakdown)
  * Profile screen with Manali Tech logo footer (links to https://manalitech.com)


================================================================================
3. TECH STACK & LANGUAGES
================================================================================

  Layer         | Language / Framework
  --------------|-----------------------------------------------------------
  Frontend      | TypeScript (React Native / Expo SDK 54)
                | expo-router (file-based routing)
                | react-native-safe-area-context, expo-linear-gradient,
                | @expo/vector-icons (Ionicons), expo-secure-store
  Backend       | Python 3 (FastAPI + Uvicorn)
                | Motor (async MongoDB driver)
                | Passlib[bcrypt] for password hashing
                | python-jose for JWT
                | emergentintegrations (Claude Sonnet 4.5 via Emergent key)
  Database      | MongoDB
  Process mgr   | Supervisor (backend + expo services in the preview env)


================================================================================
4. REPOSITORY STRUCTURE
================================================================================

  /app
  ├── backend/
  │   ├── server.py              -> All API routes (single-file FastAPI app)
  │   ├── requirements.txt       -> Python deps
  │   └── .env                   -> Backend secrets (Mongo URL, JWT, LLM key)
  ├── frontend/
  │   ├── app/                   -> expo-router screens
  │   │   ├── _layout.tsx        -> Root: providers, safe-area, gestures
  │   │   ├── index.tsx          -> Splash / redirect based on auth state
  │   │   ├── (auth)/
  │   │   │   ├── _layout.tsx
  │   │   │   ├── welcome.tsx
  │   │   │   ├── login.tsx
  │   │   │   └── register.tsx
  │   │   ├── onboarding.tsx     -> 6-step questionnaire
  │   │   ├── (tabs)/
  │   │   │   ├── _layout.tsx    -> Bottom tab navigator
  │   │   │   ├── index.tsx      -> Home dashboard
  │   │   │   ├── goals.tsx      -> Goals list + create modal
  │   │   │   ├── chat.tsx       -> AI Coach chat
  │   │   │   ├── wellness.tsx   -> Mood, journal, breathing
  │   │   │   └── profile.tsx    -> Profile, personality, Manali footer
  │   │   ├── goal/[id].tsx      -> Goal detail + AI plan
  │   │   ├── alarms.tsx         -> Smart alarms list
  │   │   └── alarm/[id].tsx     -> Alarm dismiss challenge
  │   ├── src/
  │   │   ├── api/client.ts      -> Fetch wrapper with JWT
  │   │   ├── context/AuthContext.tsx
  │   │   ├── components/        -> Button, Card, Input, Chip
  │   │   ├── theme.ts           -> Dark palette tokens
  │   │   └── utils/storage/     -> Cross-platform secure storage
  │   ├── package.json
  │   ├── app.json
  │   └── .env                   -> EXPO_PUBLIC_BACKEND_URL (do not edit)
  ├── memory/
  │   ├── PRD.md
  │   └── test_credentials.md
  └── requirements.txt           -> THIS FILE


================================================================================
5. PREREQUISITES (for local development)
================================================================================

  * Node.js  >= 18
  * Yarn     >= 1.22  (project pinned to yarn 1.22)
  * Python   >= 3.10
  * MongoDB  >= 5.0  (local or Atlas)
  * Expo Go app on your phone (for scanning the QR)   [optional]


================================================================================
6. ENVIRONMENT VARIABLES
================================================================================

  ---- backend/.env ----

    MONGO_URL="mongodb://localhost:27017"
    DB_NAME="riseup_ai"

    JWT_SECRET_KEY="<64-hex-random-string>"    # openssl rand -hex 32
    JWT_ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=10080          # 7 days

    EMERGENT_LLM_KEY="sk-emergent-XXXXXXXX"    # Emergent Universal LLM Key
    LLM_PROVIDER=anthropic
    LLM_MODEL=claude-sonnet-4-5-20250929

  ---- frontend/.env ----   (DO NOT EDIT the packager vars in Emergent preview)

    EXPO_PUBLIC_BACKEND_URL=https://<your-app>.preview.emergentagent.com
    EXPO_PACKAGER_PROXY_URL=... (managed by Emergent)
    EXPO_PACKAGER_HOSTNAME=... (managed by Emergent)

  Note: The Emergent LLM key powers Claude Sonnet 4.5. If the key's balance is
        0, the API will still work — you'll just receive graceful fallback
        replies instead of AI-generated ones. Top up via:
            Emergent App -> Profile -> Universal Key -> Add Balance


================================================================================
7. HOW TO RUN — INSIDE THE EMERGENT PREVIEW (current environment)
================================================================================

  Everything is already running under Supervisor. You only need to know:

    # See status of both services
    sudo supervisorctl status

    # Restart backend after editing /app/backend/*.py
    sudo supervisorctl restart backend

    # Restart Expo (Metro bundler) after editing /app/frontend/*
    sudo supervisorctl restart expo

    # Restart everything at once
    sudo supervisorctl restart all

    # Watch backend logs (last 100 lines)
    tail -n 100 /var/log/supervisor/backend.err.log
    tail -n 100 /var/log/supervisor/backend.out.log

    # Watch Expo logs
    tail -n 100 /var/log/supervisor/expo.err.log

  The web preview URL is the value of EXPO_PUBLIC_BACKEND_URL.
  Open it in your browser — the same URL serves both the app and the /api routes.

  On a phone, install "Expo Go" and scan the QR code shown by Metro at
  the Emergent preview (or use the "Preview on device" option in the platform).


================================================================================
8. HOW TO RUN LOCALLY ON YOUR OWN MACHINE
================================================================================

  --- Step 1. Clone the project ---

    git clone <your-repo>
    cd riseup-ai

  --- Step 2. Start MongoDB ---

    # macOS (brew)
    brew services start mongodb-community

    # Linux (systemd)
    sudo systemctl start mongod

    # Or with Docker
    docker run -d --name mongo -p 27017:27017 mongo:7

  --- Step 3. Backend ---

    cd backend
    python -m venv .venv
    source .venv/bin/activate            # Windows: .venv\Scripts\activate

    pip install -r requirements.txt
    pip install 'passlib[bcrypt]'        # extra for hashing

    # Create backend/.env (see section 6 above)

    # Run the API on 0.0.0.0:8001
    uvicorn server:app --host 0.0.0.0 --port 8001 --reload

    # Sanity check
    curl http://localhost:8001/api/

  --- Step 4. Frontend ---

    cd ../frontend
    yarn install

    # Create frontend/.env with:
    #   EXPO_PUBLIC_BACKEND_URL=http://<your-lan-ip>:8001
    # (Use your machine's LAN IP so the phone can reach it, e.g. 192.168.1.42)

    yarn start                           # opens Metro + QR code
    # or
    yarn ios                             # iOS simulator (mac only)
    yarn android                         # Android emulator
    yarn web                             # web build

  --- Step 5. Open the app ---

    * Phone: scan the QR code with the Expo Go app
    * Simulator: press "i" (iOS) or "a" (Android) in the Metro terminal
    * Web: press "w" or visit http://localhost:19006


================================================================================
9. API REFERENCE
================================================================================

  All routes are prefixed with /api and (except /auth/*) require
  Authorization: Bearer <token>

  ---- Auth ----
    POST   /api/auth/register      {email, password, name}
    POST   /api/auth/login         {email, password}
    GET    /api/auth/me

  ---- Onboarding & Profile ----
    POST   /api/onboarding         {role, age, wake_time, sleep_time, ...}
    PUT    /api/profile/personality  {ai_personality}

  ---- Goals ----
    POST   /api/goals              {title, category, description, deadline_days}
    GET    /api/goals
    GET    /api/goals/{id}
    DELETE /api/goals/{id}
    POST   /api/goals/{id}/generate-plan     -> AI-generated plan

  ---- Tasks ----
    POST   /api/tasks              {title, time_of_day, goal_id?, xp?}
    GET    /api/tasks?date=YYYY-MM-DD
    PATCH  /api/tasks/{id}         {completed?, title?, ...}
    DELETE /api/tasks/{id}

  ---- Habits ----
    POST   /api/habits             {title, icon?, target_per_day?}
    GET    /api/habits
    POST   /api/habits/{id}/check
    DELETE /api/habits/{id}

  ---- Mood & Journal ----
    POST   /api/mood               {mood, energy, stress, sleep_quality, note?}
    GET    /api/mood
    POST   /api/journal            {kind, text}
    GET    /api/journal
    DELETE /api/journal/{id}

  ---- Chat ----
    POST   /api/chat/message       {text, session_id?}
    GET    /api/chat/history?session_id=

  ---- Alarms ----
    POST   /api/alarms             {label, time, verification, active}
    GET    /api/alarms
    POST   /api/alarms/{id}/verify -> awards XP & streak
    DELETE /api/alarms/{id}

  ---- Dashboard & Reports ----
    GET    /api/dashboard
    GET    /api/reports/weekly

  Interactive docs (Swagger UI): http://localhost:8001/docs


================================================================================
10. TEST CREDENTIALS & SMOKE TESTS
================================================================================

  Demo account (may already exist):
    email:    demo@rise.io
    password: test1234

  Or register a new user via the app / API.

  ---- Quick API smoke test ----

    # Register
    curl -X POST http://localhost:8001/api/auth/register \
      -H 'Content-Type: application/json' \
      -d '{"email":"you@test.io","password":"test1234","name":"You"}'

    # Login
    curl -X POST http://localhost:8001/api/auth/login \
      -H 'Content-Type: application/json' \
      -d '{"email":"you@test.io","password":"test1234"}'

    # Copy access_token from the response, then:
    TOKEN="<paste_token_here>"
    curl http://localhost:8001/api/auth/me \
      -H "Authorization: Bearer $TOKEN"


================================================================================
11. TROUBLESHOOTING
================================================================================

  Problem: AI plan / chat returns a canned fallback response
  ---------------------------------------------------------
  Cause:  Emergent LLM key balance is 0 (LiteLLM: "Max budget: 0.0")
  Fix:    Top up the Universal Key from the Emergent app:
            Profile -> Universal Key -> Add Balance
          No code change is needed. Next call will use Claude Sonnet 4.5.

  Problem: 401 Unauthorized on protected routes
  ---------------------------------------------
  Fix:    Send the JWT in `Authorization: Bearer <token>` header.

  Problem: Expo shows blank / white screen on device
  --------------------------------------------------
  Fix:    Make sure EXPO_PUBLIC_BACKEND_URL is reachable from the device.
          When testing on a phone, use your LAN IP, not localhost.

  Problem: MongoDB connection refused
  -----------------------------------
  Fix:    Start MongoDB (see Section 8, Step 2). Verify MONGO_URL in .env.

  Problem: bcrypt AttributeError warning in backend logs
  ------------------------------------------------------
  Cosmetic. Passlib logs an `__about__` warning with bcrypt 4+. The library
  works fine. To silence, pin `bcrypt<4` in requirements.txt.

  Problem: Metro bundler stuck
  ----------------------------
  Fix:    Clear cache and restart:
            yarn expo start -c

  Problem: The tab bar covers content
  -----------------------------------
  Fix:    Already handled via useSafeAreaInsets. If you customize, remember to
          add paddingBottom equal to (tabBarHeight + insets.bottom).


================================================================================
12. DEPLOYMENT
================================================================================

  * Use the Emergent "Publish" button (top right) to deploy the backend + web
    build to a live URL managed by Emergent.
  * For iOS / Android app-store builds, use the Emergent build flow (requires
    developer credentials). Do NOT use EAS CLI directly — the platform
    handles it.
  * Backups: MongoDB dumps recommended before major releases.


================================================================================
13. WHAT IS DEFERRED TO V2
================================================================================

  * Google / Apple / Phone-OTP social login
  * Wearables (Apple Health, Google Fit, heart rate)
  * Voice AI calls (real-time TTS/STT)
  * Website blocker & app blocker (desktop companion)
  * Community / accountability partners / study groups
  * Resume builder, coding-question drills, mock interviews
  * Selfie / smile / QR / walk-30-steps alarm verifications (needs native build)
  * Native push notifications


================================================================================
14. CREDITS
================================================================================

  App Concept & Brand: You (RiseUp AI)
  Partner Studio:      Manali Tech  ->  https://manalitech.com
  Built with:          Emergent AI Platform

  Enjoy the ride. Keep rising. 🔥
================================================================================
