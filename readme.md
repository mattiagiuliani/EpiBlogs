# EpiBlogs

Full-stack MERN blogging platform with:

- Express + MongoDB backend
- React + Vite frontend
- JWT authentication with HttpOnly cookie support and Bearer fallback
- Google OAuth login with one-time code exchange
- Ownership-based authorization for authors, posts, and comments

## Stack

- Backend: Node.js, Express, Mongoose, Passport, JWT, Helmet
- Frontend: React, Vite
- Storage/Services: MongoDB, Cloudinary, Nodemailer/SendGrid
- Testing: Vitest, Supertest, jsdom
- Tooling: ESLint, Postman, GitHub Actions

## Architecture

### Auth Flow

1. Local login: `POST /login`
2. Google login start: `GET /auth/google`
3. Google callback redirects the browser to the frontend with a short-lived `code`
4. Frontend exchanges the code at `POST /auth/google/exchange-code`
5. Backend sets the HttpOnly auth cookie and returns `{ token, author }`
6. Frontend stores the JWT for Bearer fallback and hydrates the authenticated user

### Identity Rules

- JWT `authorId` is the single source of truth
- `req.author` is normalized to `{ _id, email }`
- Google OAuth matches existing accounts by email first
- `googleId` is linked once and not treated as a mutable identity field

### Ownership Rules

- Authors can update/delete only their own author profile
- Posts can be created only for the authenticated author id
- Posts can be updated/deleted only by their owner
- Comments can be updated/deleted only by their owner

## API Summary

### Authentication

- `POST /login`
- `POST /logout`
- `GET /auth/logout`
- `POST /authors`
- `GET /me`
- `GET /auth/me`
- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/google/exchange-code`

Versioned aliases also exist under `/api/v1/auth/...` where implemented.

### Public Read Endpoints

- `GET /api/v1/authors`
- `GET /api/v1/authors/:authorId`
- `GET /api/v1/posts`
- `GET /api/v1/posts/:postId`
- `GET /api/v1/authors/:authorId/posts`
- `GET /api/v1/posts/:postId/comments`
- `GET /api/v1/posts/:postId/comments/:commentId`

### Protected Mutation Endpoints

- `PUT /api/v1/authors/:authorId`
- `PATCH /api/v1/authors/:authorId/avatar`
- `DELETE /api/v1/authors/:authorId`
- `POST /api/v1/posts`
- `PUT /api/v1/posts/:postId`
- `PATCH /api/v1/posts/:postId/cover`
- `DELETE /api/v1/posts/:postId`
- `POST /api/v1/posts/:postId/comments`
- `PUT /api/v1/posts/:postId/comments/:commentId`
- `DELETE /api/v1/posts/:postId/comments/:commentId`

Protected endpoints accept:

- HttpOnly cookie authentication
- `Authorization: Bearer <jwt>` fallback

## Environment Variables

The repo now uses `.env.example` files as the source of truth:

- [backend/.env.example](backend/.env.example)
- [frontend/.env.example](frontend/.env.example)

### Backend Required

- `MONGODB_CONNECTION_URI`
- `JWT_SECRET_KEY`

### Backend Common

- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`
- `TRUST_PROXY`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DEVELOPMENT_GOOGLE_CALLBACK_URL`
- `DEPLOYMENT_GOOGLE_CALLBACK_URL`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `SENDGRID_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `LOG_LEVEL`

### Backend Optional Advanced OAuth Cookie Overrides

- `OAUTH_COOKIE_DOMAIN`
- `OAUTH_COOKIE_SAME_SITE`

### Frontend Public Variables

- `VITE_API_BASE_URL`
- `VITE_FRONTEND_BASE_URL` (optional)

Frontend env must never contain backend secrets.

## Deprecated / Backward-Compatible Variables

These still work for compatibility, but should not be used for new deployments:

- `JWT_SECRET` -> use `JWT_SECRET_KEY`
- `GOOGLE_CALLBACK_URL` -> use `DEVELOPMENT_GOOGLE_CALLBACK_URL` and `DEPLOYMENT_GOOGLE_CALLBACK_URL`
- `OAUTH_COOKIE_SECURE` -> use `AUTH_COOKIE_SECURE`

Removed from docs because they are not used by the runtime:

- `BACKEND_HOST`

## Local Development

### Install

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Start

```bash
npm run dev:backend
npm run dev:frontend
```

### Verify

```bash
npm run check
npm run test:backend
npm run test:frontend
npm run lint
npm run build
```

## Deployment

### Render (Backend)

Set these in Render:

- `NODE_ENV=production`
- `MONGODB_CONNECTION_URI`
- `JWT_SECRET_KEY`
- `FRONTEND_URL=https://your-frontend.vercel.app`
- `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=none` if the frontend is on a different site
- `TRUST_PROXY=1`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DEPLOYMENT_GOOGLE_CALLBACK_URL=https://your-render-service.onrender.com/auth/google/callback`
- Optional service vars for email and Cloudinary

### Vercel (Frontend)

Set these in Vercel:

- `VITE_API_BASE_URL=https://your-render-service.onrender.com`
- Optional: `VITE_FRONTEND_BASE_URL=https://your-frontend.vercel.app`

Do not store backend secrets in Vercel env.

## Postman

Collection:

- [backend/postman/EpiBlogs.postman_collection.json](backend/postman/EpiBlogs.postman_collection.json)

Notes:

- Public GET requests intentionally omit `Authorization`
- `/me` and all mutations require a valid cookie or Bearer token
- `Login` and Google code exchange save `accessToken` and `authorId`
- Create post/comment requests save `postId` and `commentId`

## CI

GitHub Actions workflow:

- installs root/backend/frontend dependencies
- runs backend syntax checks
- runs backend tests
- runs frontend tests
- runs frontend lint
- runs frontend build

Workflow file:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Security Notes

- Auth cookies are `HttpOnly`
- Bearer fallback exists for API clients and Postman
- Ownership is enforced server-side
- Sensitive author fields are stripped from serialized responses
- Login and Google exchange are rate-limited
- Helmet and CORS are enabled

## Repo Notes

- Backend entrypoint: [backend/server.js](backend/server.js)
- Backend app wiring: [backend/app.js](backend/app.js)
- Frontend auth client: [frontend/src/assets/api.js](frontend/src/assets/api.js)
- Frontend auth state: [frontend/src/hooks/useAuthSession.js](frontend/src/hooks/useAuthSession.js)
