# ECE ExamHub (MERN)

ECE ExamHub is a full-stack platform for ECE students to upload, discover, and download exam resources with admin moderation.

## Tech Stack

- MongoDB
- Express.js + Node.js
- React + Vite + Tailwind CSS
- ImageKit for PDF storage and CDN delivery

## Project Structure

- `frontend/` React client
- `backend/` Express API

## Quick Start

### 1) Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set valid values in `.env` for:

- `MONGODB_URI`
- `JWT_SECRET`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`

### 2) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and API on `http://localhost:5000`.

## Implemented Features

- JWT authentication (register/login/logout)
- JWT token blacklist on logout for secure token invalidation
- Role-based access (student/admin)
- PDF upload (5MB max) with MIME validation
- ImageKit server-side upload and URL persistence
- Duplicate upload prevention (same title + subject)
- Pending approval workflow for uploads
- Admin approve/reject/delete moderation
- Subject-wise and filtered resource browsing
- Simple pagination (10 resources per page with next/previous)
- Upvote system with duplicate vote prevention
- Download tracking
- Contributor leaderboard (top uploaders)
- Modern responsive UI with landing page and dashboards

## Frontend Layers

- pages
- components
- services
- hooks and utils
