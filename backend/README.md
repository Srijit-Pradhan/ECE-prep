# ECE ExamHub Backend

Express + MongoDB API for ECE ExamHub.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill MongoDB + ImageKit credentials.

3. Run development server:

```bash
npm run dev
```

## Key APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/resources`
- `GET /api/resources/subject/:subject`
- `POST /api/resources/upload`
- `POST /api/resources/upvote`
- `POST /api/resources/:id/download`
- `GET /api/admin/pending`
- `POST /api/admin/approve`
- `DELETE /api/admin/resource/:id`
- `GET /api/admin/users`
