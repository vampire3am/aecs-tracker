# AECS TRACKER — Enterprise Work-Tracking & Management Platform

**AECS TRACKER** is a production-ready employee work-tracking, attendance, task-management, project-management, developer activity, and work-reporting platform.

Its core purpose is to answer one question extremely well:

> *"When did I start work, what did I work on, how much time did I spend, what did I complete, what is pending, what blocked me, and what should I report to my manager?"*

---

## 🚀 Key Features

1. **Explicit Work Documentation (No Surveillance)**
   - Prioritizes developer trust and transparency.
   - Absolutely **no** invasive monitoring, webcam tracking, screenshot surveillance, keylogging, or mouse tracking.
   - Recorded hours are paired with tangible outcomes, tasks, and achievements.

2. **Work Session & Break Tracking**
   - Single active work session per employee strictly enforced in backend logic.
   - Non-overlapping break tracking (`Lunch`, `Short Break`, `Personal`, `Meeting`, `Other`).
   - Net work time calculated mathematically:
     $$\text{Net Work Time} = \text{Total Work Session Duration} - \text{Total Break Duration}$$
   - Live, natural timer ticking without page refreshes.

3. **Projects & Tasks Context Engine**
   - Projects with unique keys (`AECS`, `SEC`, `RTM`), target dates, and priorities.
   - Tasks supporting `TODO`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `COMPLETED`, `CANCELLED`.
   - Automatic `completedAt` timestamp capture and tracking.
   - Database-backed task timer that survives page refreshes and server restarts.

4. **Dedicated Blocker & Dependency System**
   - Makes external bottlenecks, credential delays, and team blockers visible and trackable.
   - Automatically synchronizes task statuses.
   - Feeds directly into daily standup notes and manager reports.

5. **Deterministic Zero-Hallucination Reporting**
   - Daily, Weekly, and Monthly reports generated deterministically from actual PostgreSQL records.
   - Structured sections: Working Hours, Completed Work, In Progress, Blockers, Meetings, Key Achievements, and Recommended Next Steps based on actual pending deliverables.
   - Reports are fully editable by the employee before submission.

6. **Server-Side Analytics & Performance**
   - Hours worked by day, category breakdown (`Development`, `Bug Fix`, `Code Review`, `Architecture`, etc.), project time investments, and blocker resolution rates.
   - Real database aggregations without fetching thousands of records into the browser.

7. **Manager Team Dashboard & Administrator Portal**
   - Scoped manager view showing live team status, working hours, and blockers.
   - Role-Based Access Control (`EMPLOYEE`, `MANAGER`, `ADMIN`).
   - Enterprise audit logging for security, session lifecycle, and data modifications.
   - CSV export for work logs and session histories.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React
- **Database**: PostgreSQL 16 (Relational, normalized schema)
- **ORM**: Prisma Client v6
- **Authentication**: Stateless, cryptographically signed JWT cookies with `bcryptjs` password hashing
- **Validation**: Zod schema validation on all inputs and API routes
- **Testing**: Vitest automated test suite verifying critical business constraints

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v20 or v22 LTS
- **PostgreSQL**: v15 or v16 running on port 5432

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aecs_tracker?schema=public"
JWT_SECRET="aecs-tracker-secure-production-jwt-secret-replace-in-production-2026"
NEXT_PUBLIC_APP_NAME="AECS TRACKER"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Migrations
Synchronize the PostgreSQL schema:
```bash
npx prisma db push
npx prisma generate
```

### 5. Seed Development Data
Populate realistic projects, tasks, work logs, meetings, blockers, and user accounts:
```bash
node scripts/seed.mjs
```

### 6. Run the Application
**Development Server:**
```bash
npm run dev
```

**Production Build & Start:**
```bash
npm run build
npm start
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests & Quality Checks

Run the automated test suite:
```bash
npm test
```

Run TypeScript strict type-checking:
```bash
npm run type-check
```

---

## 🔑 Demo & Test Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Employee** | Alex Rivera | `dev@aecstracker.internal` | `DevPassword123!` |
| **Employee** | Priya Sharma | `priya@aecstracker.internal` | `DevPassword123!` |
| **Manager** | David Chen | `manager@aecstracker.internal` | `ManagerPassword123!` |
| **Admin** | Sarah Jenkins | `admin@aecstracker.internal` | `AdminPassword123!` |

*(The login screen also features 1-click test credentials for instant evaluation.)*

---

## 🔒 Security & Architecture Decisions

1. **Authorization Enforced Server-Side**: Every route handler checks the signed JWT session token and role permissions using `requireAuth()` and `requireRole()`.
2. **Audit Logging**: Operations such as login, session start/end, task creation/completion, and blocker updates are immutably logged with actor, entity, and timestamp.
3. **UTC Timestamps with User Timezone Presentation**: All dates and times are stored in UTC in PostgreSQL and translated to the employee's configured timezone (`America/New_York`, `Asia/Kolkata`, etc.) for date cutoffs and reporting.
4. **Deterministic Reports First**: AI assistance is designed as an optional future enhancement. The core platform guarantees accurate, non-hallucinatory reports directly from PostgreSQL data.
