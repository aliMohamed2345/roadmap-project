<div align="center">

# 🗺️ Roadmap Project API

### *A complete learning platform backend — built for scale, designed for clarity*

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![JWT](https://img.shields.io/badge/Auth-JWT_Cookies-FB015B?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Swagger](https://img.shields.io/badge/Docs-Swagger_UI-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://swagger.io)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

<br/>

**Production URL** → `https://roadmap-project-chi.vercel.app/api/v1`  
**Swagger Docs** → [`/api-docs`](https://roadmap-project-api-production.up.railway.app/api-docs/)

<br/>

[Features](#-features) · [Tech Stack](#-tech-stack) · [Installation](#-installation) · [API Reference](#-api-reference) · [Data Models](#-data-models) · [Auth](#-authentication) · [Error Handling](#-error-handling)

---

</div>

## 📖 Overview

The **Roadmap Project API** is a production-ready RESTful backend powering a full learning platform. Users follow structured roadmaps, take ranked quizzes, build projects, and track their progress — all protected by cookie-based JWT authentication and a clean role-based access system.

```
Roadmap → Sections → Resources (video / article / course)
Quiz    → Questions → Submit → Auto-grade (A+ to F)
Project → Steps → Toggle completion → Track user progress
```

---

## ✨ Features

| Category | What's included |
|---|---|
| 🔐 **Auth** | Signup · Login · Logout via `httpOnly` JWT cookie (3-day expiry) |
| 👤 **Users** | Profile CRUD · Password change · Image upload/delete via Cloudinary |
| 🗺️ **Roadmaps** | Full CRUD · Sections · Resources · Cascade deletes |
| ✅ **Progress** | Mark sections complete · Per-roadmap tracking · Export to JSON / PDF / CSV |
| 🧠 **Quizzes** | Create quizzes · Add questions · Submit answers · Auto-grade · Restart |
| 🏗️ **Projects** | CRUD with tags & level · Embedded steps · Toggle step completion |
| 🛡️ **Security** | Helmet · Rate limiting (100 req / 15 min) · Mongo sanitize · XSS clean · API key middleware |
| 📄 **Docs** | Interactive Swagger UI at `/api-docs` |

---

## 🛠 Tech Stack

```
Runtime      Node.js v18+
Framework    Express.js
Database     MongoDB + Mongoose ODM
Auth         JWT in httpOnly cookies (bcryptjs, salt: 12)
Storage      Cloudinary (profile images via Multer memoryStorage)
Exports      pdfkit + json2csv
Security     helmet · express-rate-limit · mongo-sanitize · xss-clean
Docs         Swagger UI Express
Deployment   Vercel / Railway / Render
```

---

## ⚡ Installation

### 1 · Clone

```bash
git clone https://github.com/aliMohamed2345/roadmap-project-api
cd roadmap-project-api
```

### 2 · Install dependencies

```bash
npm install
```

### 3 · Environment variables

Create a `.env` file in the root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://127.0.0.1:27017/roadmap_quiz_db
# MongoDB Atlas: mongodb+srv://<user>:<pass>@cluster0.mongodb.net/roadmap_quiz_db

# Auth
JWT_SECRET_KEY=your_very_long_and_secure_secret_here
CLIENT_URL=http://localhost:3000

# API Key (required by roadmap middleware)
API_KEY=your_api_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> 💡 Generate a strong secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4 · Run

```bash
npm run dev    # development (nodemon)
npm start      # production
```

Server starts at → `http://localhost:5000`  
Swagger UI at → `http://localhost:5000/api-docs`

---

## 📡 API Reference

**Base URL (local):** `http://localhost:5000/api/v1`  
**Base URL (prod):** `https://roadmap-project-chi.vercel.app/api/v1`

### Access levels

| Badge | Meaning |
|---|---|
| `Public` | No authentication required |
| `Auth` | Valid JWT cookie required |
| `Admin` | JWT cookie + `isAdmin: true` required |

> ⚠️ **Roadmap routes** also require `?key=YOUR_API_KEY` as a query parameter.

---

### 🔑 Auth  `/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/auth/signup` | Register — sets JWT cookie | `Public` |
| `POST` | `/auth/login` | Login — sets JWT cookie | `Public` |
| `POST` | `/auth/logout` | Clears JWT cookie | `Auth` |

<details>
<summary><b>POST /auth/signup</b> — Request body</summary>

```json
{
  "username": "ali123",
  "email": "ali@example.com",
  "password": "Password123!"
}
```

Rules: username 3–50 chars (alphanumeric + `_`), valid email, password min 6 chars with uppercase + lowercase + digit + special char.

Response `201`:
```json
{
  "success": true,
  "user": { "id": "...", "username": "ali123", "email": "ali@example.com", "isAdmin": false, "imageURL": "..." }
}
```
</details>

<details>
<summary><b>POST /auth/login</b> — Request body</summary>

```json
{
  "email": "ali@example.com",
  "password": "Password123!"
}
```
Response `200`: same shape as signup.
</details>

---

### 👤 Users  `/users`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/users/profile` | Get own profile (with quiz progress) | `Auth` |
| `PUT` | `/users/profile` | Update username / email / bio / imageURL | `Auth` |
| `DELETE` | `/users/profile` | Delete own account | `Auth` |
| `PUT` | `/users/profile/change-password` | Change password | `Auth` |
| `PUT` | `/users/profile/upload-image` | Upload profile image (multipart/form-data) | `Auth` |
| `DELETE` | `/users/profile/delete-image` | Delete profile image from Cloudinary | `Auth` |
| `GET` | `/users` | Get all users (paginated + search) | `Admin` |
| `GET` | `/users/:id` | Get specific user by ID | `Auth` |
| `PUT` | `/users/:id` | Update any user | `Admin` |
| `DELETE` | `/users/:id` | Delete any user | `Admin` |
| `PUT` | `/users/:id/role` | Toggle `isAdmin` role | `Admin` |

<details>
<summary><b>PUT /users/profile</b> — all fields optional</summary>

```json
{
  "username": "newname",
  "email": "new@email.com",
  "imageURL": "https://example.com/photo.jpg",
  "bio": "Full-stack developer"
}
```
</details>

<details>
<summary><b>PUT /users/profile/change-password</b></summary>

```json
{
  "currentPassword": "OldPass123!",
  "password": "NewPass456@",
  "confirmPassword": "NewPass456@"
}
```
</details>

<details>
<summary><b>GET /users</b> — query params</summary>

| Param | Type | Description |
|---|---|---|
| `q` | string | Search by username or email |
| `page` | number | Page number (default `1`, 10 per page) |
| `isAdmin` | boolean | Filter by role (`true` / `false`) |

</details>

---

### 🗺️ Roadmaps  `/roadmap`

> All roadmap routes require `?key=YOUR_API_KEY`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/roadmap` | Get all roadmaps | `Public` |
| `POST` | `/roadmap` | Create roadmap | `Admin` |
| `GET` | `/roadmap/:id` | Get roadmap with section titles | `Public` |
| `PUT` | `/roadmap/:id` | Update roadmap | `Admin` |
| `DELETE` | `/roadmap/:id` | Delete + cascade all sections & resources | `Admin` |
| `GET` | `/roadmap/:id/progress` | Get user's progress on a roadmap | `Auth` |
| `GET` | `/roadmap/:id/progress/export/json` | Download roadmap as `.json` | `Auth` |
| `GET` | `/roadmap/:id/progress/export/pdf` | Download roadmap as `.pdf` | `Auth` |
| `GET` | `/roadmap/:id/progress/export/csv` | Download sections list as `.csv` | `Auth` |

<details>
<summary><b>POST & PUT /roadmap</b> — Request body</summary>

```json
{
  "title": "Frontend Development",
  "description": "A complete path to becoming a frontend developer."
}
```
Rules: title 3–100 chars, description 10–1,000 chars.
</details>

<details>
<summary><b>GET /roadmap/:id/progress</b> — Response shape</summary>

```json
{
  "success": true,
  "roadmap": { "_id": "...", "title": "...", "description": "..." },
  "sections": [
    {
      "_id": "...",
      "title": "HTML Basics",
      "difficulty": "Beginner",
      "completed": true,
      "resources": [{ "_id": "...", "title": "...", "url": "...", "type": "video" }]
    }
  ],
  "total": 10,
  "completed": 4,
  "progressPercentage": 40
}
```
</details>

#### Sections  `/roadmap/:id/sections`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/roadmap/:id/sections` | Get all sections (with resources) | `Public` |
| `POST` | `/roadmap/:id/sections` | Create section | `Admin` |
| `GET` | `/roadmap/:id/sections/:sectionId` | Get single section | `Public` |
| `PUT` | `/roadmap/:id/sections/:sectionId` | Update section | `Admin` |
| `DELETE` | `/roadmap/:id/sections/:sectionId` | Delete section + its resources | `Admin` |
| `POST` | `/roadmap/:id/sections/:sectionId/complete` | Toggle completion for current user | `Auth` |

<details>
<summary><b>POST & PUT section</b> — Request body</summary>

```json
{
  "title": "CSS Fundamentals",
  "description": "Learn the core concepts of CSS including the box model and flexbox.",
  "difficulty": "Beginner"
}
```
`difficulty` options: `Beginner` · `Intermediate` · `Advanced` · `Expert`
</details>

#### Resources  `/roadmap/:id/sections/:sectionId/resources`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `.../resources` | Get all resources in section | `Public` |
| `POST` | `.../resources` | Create resource | `Admin` |
| `GET` | `.../resources/:resourceId` | Get single resource | `Public` |
| `PUT` | `.../resources/:resourceId` | Update resource | `Admin` |
| `DELETE` | `.../resources/:resourceId` | Delete resource | `Admin` |

<details>
<summary><b>POST & PUT resource</b> — Request body</summary>

```json
{
  "title": "CSS Box Model Explained",
  "url": "https://www.youtube.com/watch?v=...",
  "type": "video"
}
```
`type` options: `video` · `article` · `course`  
⚠️ If `type` is `video`, the URL must be a valid YouTube link (`youtube.com` or `youtu.be`).
</details>

---

### 🧠 Quizzes  `/quiz`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/quiz` | Get all quizzes | `Public` |
| `POST` | `/quiz` | Create quiz | `Admin` |
| `GET` | `/quiz/:id` | Get quiz; add `?question=N` for a specific question | `Public` |
| `PUT` | `/quiz/:id` | Update quiz | `Admin` |
| `DELETE` | `/quiz/:id` | Delete quiz + all questions + user refs | `Admin` |
| `GET` | `/quiz/:quizId/questions` | Get questions (paginated or random) | `Auth` |
| `POST` | `/quiz/:quizId/questions` | Add question to quiz | `Admin` |
| `GET` | `/quiz/:quizId/questions/:questionId` | Get single question | `Auth` |
| `PUT` | `/quiz/:quizId/questions/:questionId` | Update question | `Admin` |
| `DELETE` | `/quiz/:quizId/questions/:questionId` | Delete question | `Admin` |
| `POST` | `/quiz/:quizId/questions/submit` | Submit answers → grade + save to profile | `Auth` |
| `GET` | `/quiz/:quizId/questions/restart` | Reset attempt from user progress | `Auth` |

<details>
<summary><b>POST /quiz</b> — Request body</summary>

```json
{
  "title": "JavaScript Fundamentals",
  "description": "Test your knowledge of JavaScript core concepts.",
  "rank": "Beginner"
}
```
`rank` options: `Beginner` · `Intermediate` · `Advanced` · `Expert` · `Master`  
`description` must be 5–50 words.
</details>

<details>
<summary><b>POST .../questions</b> — Request body</summary>

```json
{
  "question": "What does the '===' operator check in JavaScript?",
  "answer": "Value and type",
  "options": ["Only value", "Only type", "Value and type", "Neither"]
}
```
Rules: exactly 4 unique options, `answer` must match one of the options exactly.
</details>

<details>
<summary><b>GET .../questions</b> — Query params</summary>

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Max `50` (max `20` in random mode) |
| `q` | string | — | Search question text |
| `sort` | string | `createdAt` | `createdAt` · `updatedAt` · `question` |
| `random` | string | `false` | `true` returns random `$sample` |

</details>

<details>
<summary><b>POST .../submit</b> — Request & Response</summary>

**Request:**
```json
{
  "answers": [
    { "questionId": "64a1b2c3...", "answer": "Value and type" },
    { "questionId": "64a1b2c4...", "answer": "undefined" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "quizTitle": "JavaScript Fundamentals",
    "totalQuestions": 10,
    "correctAnswers": 9,
    "wrongAnswers": 1,
    "percentage": 90,
    "grade": "A+",
    "status": "Passed",
    "answerDetails": [
      { "question": "...", "userAnswer": "...", "correctAnswer": "...", "isCorrect": true }
    ]
  }
}
```

**Grading scale:**

| Score | Grade | Status |
|---|---|---|
| ≥ 90% | `A+` | ✅ Passed |
| ≥ 80% | `A` | ✅ Passed |
| ≥ 70% | `B` | ✅ Passed |
| ≥ 60% | `C` | ✅ Passed |
| ≥ 50% | `D` | ✅ Passed |
| < 50% | `F` | ❌ Failed |

</details>

---

### 🏗️ Projects  `/project`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/project` | Get all projects (search + filter + pagination) | `Public` |
| `POST` | `/project` | Create project | `Admin` |
| `GET` | `/project/:projectId` | Get specific project | `Auth` |
| `PUT` | `/project/:projectId` | Update project | `Admin` |
| `DELETE` | `/project/:projectId` | Delete project | `Admin` |
| `GET` | `/project/:projectId/steps` | Get all steps | `Auth` |
| `POST` | `/project/:projectId/steps` | Add steps (1–10 at once) | `Admin` |
| `PUT` | `/project/:projectId/steps/:stepId` | Update step title/description | `Admin` |
| `PATCH` | `/project/:projectId/steps/:stepId` | Toggle `isCompleted` + update user progress | `Auth` |
| `DELETE` | `/project/:projectId/steps/:stepId` | Delete step | `Admin` |

<details>
<summary><b>POST /project</b> — Request body</summary>

```json
{
  "title": "Build a REST API",
  "description": "Create a fully documented REST API with Node.js and Express.",
  "level": "Intermediate",
  "tags": ["node", "express", "api"]
}
```
`level` options: `Beginner` · `Intermediate` · `Advanced`
</details>

<details>
<summary><b>GET /project</b> — Query params</summary>

| Param | Type | Default | Description |
|---|---|---|---|
| `q` | string | `""` | Search title or description |
| `level` | string | — | Filter: `Beginner` · `Intermediate` · `Advanced` |
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Max `30` per page |

</details>

<details>
<summary><b>POST .../steps</b> — Request body (1–10 steps)</summary>

```json
{
  "steps": [
    { "title": "Set up the project", "description": "Initialize npm and install dependencies." },
    { "title": "Create the server", "description": "Set up Express with basic middleware." }
  ]
}
```
</details>

---

## 🗄️ Data Models

<details>
<summary><b>User</b></summary>

```ts
{
  username:    String   // unique, 3–50 chars
  email:       String   // unique, valid email
  password:    String   // bcrypt hashed
  isAdmin:     Boolean  // default: false
  imageURL:    String   // Cloudinary URL or default avatar
  bio:         String   // max 100 words
  progressData: {
    roadmap:  [{ roadmap, completedSections[], numberOfAllSections }]
    quiz:     [{ quiz, percentage, totalQuestions, correctAnswers, wrongAnswers, grade, status }]
    project:  [{ project, completedSteps[], totalSteps, completedCount }]
  }
}
```
</details>

<details>
<summary><b>Roadmap · Section · Resource</b></summary>

```ts
// Roadmap
{ title, description, sections: [ObjectId → Section] }

// Section
{ title, description, difficulty: enum, roadmapId, resources: [ObjectId → Resource] }

// Resource
{ title, url, type: enum["video","article","course"], sectionId }
```
</details>

<details>
<summary><b>Quiz · Question</b></summary>

```ts
// Quiz
{ title, description, rank: enum, questions: [ObjectId → Question] }

// Question
{ question, answer, options: [String × 4], quizId }
```
</details>

<details>
<summary><b>Project · Step (embedded)</b></summary>

```ts
// Project
{ title, description, level: enum, tags: [String], userId, steps: [Step] }

// Step (embedded schema)
{ title, description, isCompleted: Boolean }
```
</details>

---

## 🔐 Authentication

All protected routes read the JWT from an `httpOnly` cookie automatically set on login/signup.

```
Cookie name  : token
httpOnly     : true
secure       : true  (HTTPS only in production)
sameSite     : none  (cross-domain support)
maxAge       : 3 days
```

The cookie is **inaccessible to JavaScript** on the client, protecting against XSS attacks. The `sameSite: none` + `secure: true` combination enables cross-domain requests from a separately hosted frontend.

---

## ⚠️ Error Handling

All errors return a consistent JSON shape:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```

| Code | Meaning |
|---|---|
| `400` | Bad Request — validation failed |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — not admin / invalid API key |
| `404` | Not Found |
| `500` | Internal Server Error |

---

## 🧪 Testing with Swagger UI

1. Open `http://localhost:5000/api-docs` (local) or the [production docs](https://roadmap-project-api-production.up.railway.app/api-docs/)
2. Use `POST /auth/login` or `POST /auth/signup` to authenticate — the JWT cookie is set automatically in your browser
3. All `Auth` and `Admin` routes are now unlocked via the "Try it out" button
4. For roadmap routes, append `?key=YOUR_API_KEY` to requests

---

## 🤝 Contributing

Contributions are welcome!

```bash
# 1. Fork the repo
# 2. Create your branch
git checkout -b feature/your-feature-name

# 3. Commit your changes
git commit -m "feat: add your feature"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please follow conventional commits and keep PRs focused on a single concern.

---

<div align="center">

Built with ❤️ using **Node.js · Express · MongoDB · JWT · Cloudinary**

</div>
