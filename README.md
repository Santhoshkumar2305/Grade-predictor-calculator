# 🎓 GradeTrack — Academic Grade Predictor & Performance Calculator

GradeTrack is a modern, full-stack academic management and performance forecasting platform built with **Next.js 15 (App Router)**, **React 19**, and **MongoDB (Mongoose)**. It empowers university students to model syllabus weightages, reverse-calculate required final exam scores, analyze performance trends with custom SVG visual analytics, and export official printable academic audits.

---

## 🌟 Key Features & Capabilities

### 🧮 1. Dual-Mode Grade Prediction Engine
- **Weighted Grade Calculator (Forward Mode)**:
  - Add, edit, and dynamically remove assessment rows (assignments, quizzes, lab reports, midterms, projects).
  - Real-time input validation: handles score $\le$ max score, positive values, and weights between 0% and 100%.
  - Real-time **Course Weightage Allocation Progress Bar** with color-coded feedback (progress, complete 100%, or overflow warning $>100\%$).
  - Automatic calculation of cumulative weighted percentage score and conversion to a **10.0 CGPA Scale** and collegiate letter grade (`A+` through `F`).
- **Final Exam Target Solver (Reverse Planner Mode)**:
  - Input a desired course grade (e.g., 85% for an `A`) and remaining final exam weight.
  - Automatically calculates the exact minimum score required on the final exam to secure that grade.
  - **Instant Feasibility Diagnostics**:
    - 🏆 **Secured**: Target already locked in (even with 0% on the final exam).
    - ✅ **Comfortably Achievable**: Requires $\le 75\%$ on the final exam.
    - ⚡ **Challenging**: Requires between $75\%$ and $90\%$.
    - 🔥 **Demanding**: Requires between $90\%$ and $100\%$.
    - 🚫 **Mathematically Impossible**: Required score $> 100\%$, with immediate display of the **Maximum Possible Achievable Grade**.

---

### 📊 2. Interactive Visual Insights & Academic Analytics
- **Zero-dependency, custom-engineered SVG visual analytics** rendered natively in React:
  1. **Course Performance & 10.0 CGPA Comparison (Bar Chart)**: Side-by-side vertical bar chart comparing subject percentage scores with **Distinction (83% / 8.3 CGPA)** and **Pass (60% / 6.0 CGPA)** benchmark guide lines.
  2. **Cumulative 10.0 CGPA Trajectory (Line & Area Chart)**: Chronological momentum curve charting cumulative collegiate GPA evolution from the first evaluated course to the latest, complete with starting, cumulative, and momentum indicators ($\blacktriangle$ / $\blacktriangledown$).
  3. **Academic Grade Band Distribution**: Progress breakdown visualizing course distribution across **Distinction (83%+ / 8.3+ CGPA)**, **Merit (71–82.9% / 7.1–8.2 CGPA)**, **Pass (60–70.9% / 6.0–7.0 CGPA)**, and **Academic Warning (<60% / <6.0 CGPA)**, highlighting your top-performing course.

---

### 📜 3. Comprehensive Audit History & In-Place Record Management
- **Detailed Evaluation History**: Chronological audit trail showing course titles, academic terms, recorded dates, weighted percentages, letter badges, CGPA ratings, and complete breakdowns of individual assessments.
- **Multi-Filter & Instant Search Bar**:
  - Real-time text search across course names, semesters, and grade percentages.
  - **Semester Dropdown Filter**: Dynamically populated from your saved academic terms.
  - **Mode Filter**: Filter between Weighted Calculator and Target Planner records.
  - **Grade Band Filter**: Filter by Distinction, Merit, Pass, or Warning.
  - **Sorting**: Order records by Newest First, Oldest First, Highest Grade, or Lowest Grade.
- **In-Place Interactive Edit Modal**:
  - Update course codes, semesters, or target criteria.
  - Dynamically add, modify scores, max scores, weightages, or delete individual evaluation rows.
  - Live recalculation preview displaying updated total weight, percentage score, letter grade, and CGPA in real-time before saving.
- **Official Print & PDF Export Engine**:
  - **Full Audit Report**: Generates an official, printer-friendly institutional audit report of all records.
  - **Single Course Report**: One-click print button on individual cards for single-subject grade sheet printing.
  - Uses specialized print CSS (`@media print`) that automatically strips navigation bars, action buttons, and background gradients.
- **Record Deletion**: Secure user-scoped deletion with browser confirmation prompts.

---

### 📈 4. Command Center Dashboard
- **Collegiate Academic KPIs**:
  - Average Calculated Score (%) across all recorded courses.
  - Projected Cumulative CGPA on a standard 10.0 collegiate scale.
  - Peak / Highest recorded course score (%).
  - Academic Standing Rating (High Distinction, First Class Merit, Good Standing, or Needs Improvement).
- **Quick Feature Launchpad**: Fast access to grade prediction, target planning, visual analytics, and history.
- **Collegiate Grading Matrix Reference**: Embedded 11-tier academic scale reference table.
- **Academic Strategy Cards**: High-impact test preparation guidance (weightage prioritization, 5% safety buffer, scenario modeling).

---

### 🔐 5. Secure Authentication & Data Isolation
- **User Registration & Login**: Validated credentials with email regex checking and minimum password length constraints.
- **Password Hashing**: Salted password hashing with `bcryptjs` (10 rounds).
- **Session Security**: Stateless `jsonwebtoken` (JWT) authorization with client-side session management (`lib/auth.js`) and API route middleware (`utils/authMiddleware.js`).
- **Data Isolation**: Strict user-level schema scoping ensures every prediction is tied specifically to the authenticated user's `userId`.

---

### 🗄️ 6. Dual Database Architecture & Fault Tolerance
- **Database Helper (`lib/db.js`)**:
  - Implements global singleton caching (`global.mongoose`) to eliminate connection leaks during Next.js App Router hot-reloads and serverless executions.
  - **Dual Mode Support**: Works out of the box with **Local MongoDB (Compass)** and **MongoDB Atlas (Cloud)**.
  - **Fast-fail timeout (`serverSelectionTimeoutMS: 8000`)**: Prevents long hangs if the database is offline or if an Atlas IP whitelist is missing.
  - **Safe URI Masking**: Automatic credential masking in server logs (`//user:****@...`).

---

## 🏆 Collegiate Academic Grading Matrix (10.0 Scale)

| Score Band | Letter Grade | CGPA (10.0 Scale) | Academic Classification | Color Code |
| :--- | :---: | :---: | :--- | :---: |
| **93.00% – 100.00%** | `A+` | 10.0 | Distinction | `#10b981` |
| **87.00% – 92.99%** | `A` | 9.0 – 9.9 | First Class Exemplary | `#10b981` |
| **83.00% – 86.99%** | `A-` | 8.3 – 8.9 | First Class High | `#059669` |
| **79.00% – 82.99%** | `B+` | 7.9 – 8.2 | Above Average | `#3b82f6` |
| **75.00% – 78.99%** | `B` | 7.5 – 7.8 | Good Standing | `#3b82f6` |
| **71.00% – 74.99%** | `B-` | 7.1 – 7.4 | Satisfactory | `#6366f1` |
| **67.00% – 70.99%** | `C+` | 6.7 – 7.0 | Average | `#eab308` |
| **63.00% – 66.99%** | `C` | 6.3 – 6.6 | Marginal Pass | `#eab308` |
| **60.00% – 62.99%** | `C-` | 6.0 – 6.2 | Needs Improvement | `#f97316` |
| **50.00% – 59.99%** | `D` | 5.0 – 5.9 | Academic Warning | `#ef4444` |
| **0.00% – 49.99%** | `F` | 0.0 – 4.9 | Failing / Academic Probation | `#dc2626` |

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15.4](https://nextjs.org/) (App Router, Server & Client Components) |
| **UI Library** | [React 19](https://react.dev/) |
| **Styling & Design System** | Vanilla CSS3 Custom Design System (Glassmorphism, CSS Custom Properties, Dark Mode, `@media print`) |
| **Typography** | Plus Jakarta Sans & JetBrains Mono (Google Fonts) |
| **Backend & Routing** | Next.js Serverless Route Handlers (`app/api/*`) |
| **Database & ORM** | [MongoDB](https://www.mongodb.com/) with [Mongoose 8.16](https://mongoosejs.com/) |
| **Authentication & Security** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Data Visualizations** | Custom Responsive SVG Visuals (Bar Charts, Trajectory Lines & Area Gradients) |

---

## 📁 Project Structure

```
grade-predictor-calculator/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js          # POST /api/auth/login
│   │   │   └── register/route.js       # POST /api/auth/register
│   │   ├── history/
│   │   │   ├── [id]/route.js           # DELETE & PUT /api/history/:id
│   │   │   └── route.js                # GET /api/history (Fetch all user records)
│   │   └── predict/
│   │       └── route.js                # POST /api/predict (Validate & save calculation)
│   ├── dashboard/
│   │   └── page.js                     # KPI Command Center & academic overview
│   ├── history/
│   │   └── page.js                     # Audit list, search, filter, edit modal & print
│   ├── login/
│   │   └── page.js                     # User login page
│   ├── predict/
│   │   └── page.js                     # Grade calculation & target solver interface
│   ├── register/
│   │   └── page.js                     # User registration page
│   ├── visuals/
│   │   └── page.js                     # Interactive SVG charts & visual analytics
│   ├── layout.js                       # Root HTML/Body layout & global meta tags
│   └── page.js                         # Root entry point & auth-based redirect
├── components/
│   ├── AuthForm.js                     # Shared Login & Registration form component
│   ├── Navbar.js                       # Top navigation bar with active route highlight & logout
│   └── PredictionForm.js               # Multi-tab grade calculator & target solver component
├── lib/
│   ├── auth.js                         # LocalStorage & token management helpers
│   └── db.js                           # Mongoose singleton connection with Atlas/Local auto-detection
├── models/
│   ├── Prediction.js                   # Mongoose schema for course predictions & assessments
│   └── User.js                         # Mongoose schema for user credentials
├── public/
│   ├── favicon.ico                     # Application favicon
│   └── grade-predictor.png             # Application preview visual asset
├── styles/
│   └── globals.css                     # Comprehensive design tokens, components & print styling
├── utils/
│   ├── authMiddleware.js               # JWT verification middleware for Route Handlers
│   ├── gradeUtils.js                   # Grading scale, CGPA conversions & reverse target formulas
│   └── jwt.js                          # Token signing & verification utilities
├── jsconfig.json                       # Path alias & JS compiler config
├── next.config.mjs                     # Next.js runtime configuration
├── package.json                        # Project dependencies and npm scripts
└── README.md                           # Complete project documentation
```

---

## 🌐 API Route Reference

| Method | Endpoint | Auth Required | Description |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Registers a new user account with hashed password. |
| `POST` | `/api/auth/login` | No | Authenticates user credentials and returns a signed JWT. |
| `GET` | `/api/history` | **Yes** (Bearer Token) | Retrieves all saved predictions for the logged-in user. |
| `POST` | `/api/predict` | **Yes** (Bearer Token) | Validates assessments, computes grade, and saves record to MongoDB. |
| `PUT` | `/api/history/:id` | **Yes** (Bearer Token) | Updates an existing course audit, recalculating grade metrics. |
| `DELETE`| `/api/history/:id` | **Yes** (Bearer Token) | Permanently deletes a course calculation record. |

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.17.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (either running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- `npm` or `yarn`

### 2. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/Santhoshkumar2305/Grade-predictor-calculator.git
cd grade-predictor-calculator
npm install
```

### 3. Configure Environment Variables
Create a file named `.env.local` in the root directory:

#### Option A: Local MongoDB Compass (Offline / Local Development)
Ensure your local MongoDB service is running (port `27017`):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/grade_db
JWT_SECRET=your_super_secret_jwt_key_for_development
```

#### Option B: MongoDB Atlas (Cloud)
Provide your Atlas connection URI (make sure your IP address is whitelisted under Atlas Network Access):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxxxx.mongodb.net/grade_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_production_jwt_key
```

### 4. Run the Development Server
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

### 5. Build for Production
To build and start the production-optimized Next.js bundle:
```bash
npm run build
npm run start
```