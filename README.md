# Learning Roadmap & Quiz Platform API

## Overview
The **Learning Roadmap & Quiz Platform API** is a modern, secure RESTful backend service built with **Node.js, Express.js, MongoDB, and Mongoose**. It powers a complete structured learning experience where users can follow curated roadmaps (with sections and resources), take ranked quizzes, track their progress, and earn grades — all while admins manage content seamlessly.

This API uses **JWT authentication stored in HTTP-only cookies** for security, includes role-based access control (user/admin), and features progress tracking for both roadmaps and quizzes. It's fully production-ready with security middleware, rate limiting, input sanitization, and clean error handling.

Deployed example (when live): `https://roadmap-project-chi.vercel.app/api/v1`  
Includes full Postman collection support for testing.

## Features

* User Authentication: Secure signup, login, logout, profile management with JWT in HTTP-only cookies.
* Roadmap System: Create hierarchical learning paths → Roadmap → Sections → Resources (videos, articles, courses).
* Progress Tracking: Users can mark sections as complete; progress saved per roadmap.
* Quiz Engine: Full-featured quizzes with multiple-choice questions, ranked difficulty, answer submission, scoring, grading, and attempt history.
* Admin Panel: Full CRUD for roadmaps, sections, resources, quizzes, and user management (toggle admin role).
* Profile Management: Update bio, username, upload profile picture.
* Security-First: Helmet, rate limiting, MongoDB injection protection, XSS sanitization.
* Scalable & Clean: Built with best practices, modular routes, middleware, and error handling.

## Tech Stack

* Framework: Node.js with Express.js
* Database: MongoDB (Atlas or local) + Mongoose ODM
* Authentication: JSON Web Tokens (JWT) in HTTP-only cookies
* File Upload: Multer (profile images)
* Security: helmet, express-rate-limit, mongo-sanitize, xss-clean
* API Testing: Postman ready
* Deployment: Vercel, Render, Railway, or any Node.js host

## Prerequisites
To run the API locally, ensure you have:# Roadmap Project API

This is the backend API for a learning platform focused on tracking roadmaps, completing quizzes, and managing user progress. Built with Node.js, Express, and MongoDB.

The API documentation is available via **Swagger UI** on the live server and locally:
* **Production API Documentation:** [https://roadmap-project-api-production.up.railway.app/api-docs/](https://roadmap-project-api-production.up.railway.app/api-docs/)
* **Local API Documentation:** `http://localhost:5000/api-docs/` (after installation)

## Features

* **User Authentication:** Secure registration and login using JWT (stored in HTTP-only cookies).
* **User Management:** Get profile, update details, change password, and upload profile pictures.
* **Admin Tools:** Endpoints for managing users, roadmaps, and quizzes (requires `isAdmin: true`).
* **Roadmap Tracking:** Create, view, and manage multi-layered roadmaps (Roadmaps -> Sections -> Resources).
* **Progress Tracking:** Mark roadmap sections as complete and track user progress.
* **Quiz System:** Create quizzes and questions, submit answers, and calculate scores.

## Prerequisites

Before running the API locally, ensure you have the following installed:

* **Node.js:** v18.x or higher
* **MongoDB:** Local instance or a cloud service like MongoDB Atlas
* **Git**
* **Code Editor** (e.g., VS Code)

## Installation

Follow these steps to set up and run the API locally:

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/aliMohamed2345/roadmap-project-api](https://github.com/aliMohamed2345/roadmap-project-api)
    cd roadmap-project-api
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Create Environment Variables:**
    Create a `.env` file in the root directory and add the following:

    ```env
    # Basic Setup
    PORT=5000
    NODE_ENV=development

    # MongoDB Connection
    MONGO_URI=mongodb://127.0.0.1:27017/roadmap_quiz_db
    # Or use MongoDB Atlas:
    # MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/roadmap_quiz_db

    # JWT Authentication
    JWT_SECRET=your_very_long_and_secure_random_secret_here_2025
    JWT_EXPIRE=30d

    # API Key for middleware (optional, if you plan to use this feature)
    API_KEY=your_secret_api_key_for_requests
    ```
    > **Tip:** Generate a strong `JWT_SECRET` using `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

4.  **Start MongoDB:**
    * **Local:** Make sure your local MongoDB instance is running (e.g., using the `mongod` command or MongoDB service).
    * **Atlas:** Just ensure your `MONGO_URI` is correct and your IP address is whitelisted in the Atlas settings.

5.  **Run the Application:**
    ```bash
    # Development (with auto-restart)
    npm run dev

    # Or production mode
    npm start
    ```
    The server will start at: `http://localhost:5000`

6.  **Test the API & View Docs:**
    * Open your browser to the base URL: `http://localhost:5000/`
        → Should return:
        ```json
        { "message": "Server is running" }
        ```
    * View the interactive documentation: `http://localhost:5000/api-docs/`

## API Endpoints

**Base URL:**
`http://localhost:5000/api/v1` (local)
`https://roadmap-project-api-production.up.railway.app/api/v1` (production)

All protected routes require a valid **JWT** stored in an **HTTP-only cookie** (automatically set after `/auth/login` or `/auth/signup`).

### Authentication (`/auth` routes)

| Method | Endpoint | Description | Request Body Example | Response Example |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register new user | `{ "username": "alex", "email": "alex@example.com", "password": "123456" }` | Sets JWT cookie + user object |
| `POST` | `/auth/login` | Login user | `{ "email": "alex@example.com", "password": "123456" }` | Sets JWT cookie + user object |
| `POST` | `/auth/logout` | Logout (clears cookie) | — | `{ "message": "Logged out successfully" }` |

### Users (`/users` routes)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/profile` | Get own profile | Auth |
| `PUT` | `/users/profile` | Update username, email, bio | Auth |
| `PUT` | `/users/profile/change-password` | Change password | Auth |
| `PUT` | `/users/profile/upload-image` | Upload profile picture (multipart/form-data) | Auth |
| `GET` | `/users` | Get all users | Admin |
| `PUT` | `/users/:id/role` | Toggle admin role for a specific user | Admin |

### Roadmaps (`/roadmap` routes)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/roadmap` | Get all roadmaps | Public |
| `POST` | `/roadmap` | Create new roadmap | Admin |
| `GET` | `/roadmap/:id` | Get single roadmap with its sections and resources | Public |
| `PUT` | `/roadmap/:id` | Update roadmap details | Admin |
| `DELETE` | `/roadmap/:id` | Delete roadmap | Admin |
| `GET` | `/roadmap/:id/progress` | Get current user's progress on a roadmap | Auth |

#### Roadmaps Sections (Nested under `/roadmap/:id/sections`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/roadmap/:id/sections` | List all sections of a roadmap | Public |
| `POST` | `/roadmap/:id/sections` | Create new section in a roadmap | Admin |
| `GET` | `/roadmap/:id/sections/:sectionId` | Get single section details | Public |
| `PUT` | `/roadmap/:id/sections/:sectionId` | Update section details | Admin |
| `DELETE` | `/roadmap/:id/sections/:sectionId` | Delete section | Admin |
| `POST` | `/roadmap/:id/sections/:sectionId/complete` | Toggle section completion status for the current user | Auth |

#### Roadmaps Resources (Nested under `/roadmap/:id/sections/:sectionId/resources`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/roadmap/:id/sections/:sectionId/resources` | List all resources in a section | Public |
| `POST` | `/roadmap/:id/sections/:sectionId/resources` | Create new resource in a section | Admin |
| `GET` | `/roadmap/:id/sections/:sectionId/resources/:resourceId` | Get single resource details | Public |
| `PUT` | `/roadmap/:id/sections/:sectionId/resources/:resourceId` | Update resource details | Admin |
| `DELETE` | `/roadmap/:id/sections/:sectionId/resources/:resourceId` | Delete resource | Admin |

### Quizzes (`/quiz` routes)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/quiz` | Get all quizzes | Public |
| `POST` | `/quiz` | Create new quiz | Admin |
| `GET` | `/quiz/:id` | Get quiz with questions | Public |
| `PUT` | `/quiz/:id` | Update quiz metadata | Admin |
| `DELETE` | `/quiz/:id` | Delete quiz | Admin |

#### Quiz Questions & Taking (Nested under `/quiz/:quizId`)

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/quiz/:quizId/questions` | Add new question to a quiz | Admin |
| `GET` | `/quiz/:quizId/questions/:questionId` | Get specific question details | Auth |
| `PUT` | `/quiz/:quizId/questions/:questionId` | Update question details | Admin |
| `DELETE` | `/quiz/:quizId/questions/:questionId` | Delete question | Admin |
| `POST` | `/quiz/:quizId/questions/submit` | Submit answers, which saves score & grade | Auth |
| `GET` | `/quiz/:quizId/questions/restart` | Reset user's quiz attempt | Auth |

---

# 📁 Projects API

## Base Route
`/projects`

---

## 📌 Endpoints Overview

| Method | Endpoint | Description | Access |
|--------|----------|------------|--------|
| GET | `/projects` | Get all projects (search, filter, pagination) | Public |
| POST | `/projects` | Create new project | Auth |
| GET | `/projects/:projectId` | Get specific project | Public |
| PUT | `/projects/:projectId` | Update project | Auth |
| DELETE | `/projects/:projectId` | Delete project | Auth |

---

# 🧩 Project Steps  
(Nested under `/projects/:projectId/steps`)

| Method | Endpoint | Description | Access |
|--------|----------|------------|--------|
| GET | `/projects/:projectId/steps` | Get all steps of a project | Public |
| POST | `/projects/:projectId/steps` | Add one or multiple steps | Auth |
| PUT | `/projects/:projectId/steps/:stepId` | Update specific step | Auth |
| DELETE | `/projects/:projectId/steps/:stepId` | Delete specific step | Auth |
| PATCH | `/projects/:projectId/steps/:stepId/toggle` | Toggle step completion & update user progress | Auth |

---

# 🔎 Get All Projects

### Endpoint
`GET /project`

### Query Parameters

| Query | Type | Description | Default |
|-------|------|------------|----------|
| q | string | Search by title or description | `""` |
| level | string | Filter by level (`Beginner`, `Intermediate`, `Advanced`) | - |
| page | number | Page number | `1` |
| limit | number | Projects per page | `10` |

---

### Example Request


## Authorization

* **Authentication:** Handled via **JWT** stored in **HTTP-only cookies** (secure and inaccessible to client-side JavaScript).
* **Admin Routes:** All endpoints requiring 'Admin' access are protected and check for an `isAdmin: true` flag on the authenticated user.

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Detailed error message"
}
```
Common HTTP status codes used include: 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), and 500 (Internal Server Error).

Testing the API (Using Swagger UI)
The API documentation at http://localhost:5000/api-docs/ (or the production link) is fully interactive and allows you to test all endpoints directly:

Navigate to the Swagger UI page.

Use the /auth/signup or /auth/login endpoints to authenticate.

The browser's cookies will automatically store the JWT, allowing you to execute requests against the protected ('Auth' and 'Admin') endpoints using the "Try it out" feature within Swagger.

Contributing
Contributions are welcome! If you have suggestions or want to improve the project:

Fork the repository.

Create a feature branch: git checkout -b feature/amazing-feature

Commit your changes: git commit -m "Add amazing feature"

Push to the branch and open a Pull Request.

Please see CONTRIBUTING.md for more detailed guidelines (if you create that file).
