# EpiBlogs

Full-stack MERN blogging platform built as a portfolio project focused on production-style backend architecture, auth security, API design, and modern React UX.

This repository is a monorepo with:

- backend: Express 5 + MongoDB (Mongoose) API
- frontend: React 19 + Vite client
- test: backend and frontend Vitest suites
- seed/scripts: data maintenance and normalization utilities

## Tech Badges

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Passport](https://img.shields.io/badge/Passport-34E27A?style=for-the-badge&logo=passport&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-729B1B?style=for-the-badge&logo=vitest&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

## Italiano

### Panoramica

EpiBlogs e una piattaforma blogging full-stack con backend Express/MongoDB e frontend React/Vite. Il progetto dimostra competenze pratiche su autenticazione sicura, API REST versionate, ownership checks lato server, upload media su Cloudinary e testing automatico.

### Funzionalita principali

- Autenticazione cookie-first con cookie HttpOnly.
- Login locale + Google OAuth con code exchange.
- CRUD completo per authors, posts, comments.
- Likes sui post con endpoint dedicati.
- Upload avatar e cover con Cloudinary.
- Ricerca post, filtro category/tag e lista tag aggregata.
- CORS e Helmet configurati per ambienti reali (dev/prod).

### Note tecniche specifiche

- API versionata su /api/v1.
- Health check dedicato su /health.
- Cookie di sessione auth: epiblogs.accessToken (HttpOnly, maxAge 1h).
- Google code exchange con codice monouso TTL 60 secondi.
- Backend body limit JSON: 100kb.
- Server port default: 3000.

### Competenze dimostrate

- Progettazione API REST versionata (/api/v1).
- Sicurezza applicativa (auth middleware, ownership enforcement, rate limits).
- Data modeling MongoDB/Mongoose.
- Gestione stato frontend e UX orientata al prodotto.
- Test backend/frontend con Vitest.
- Coerenza documentazione tecnica (README + Postman).

## English

### Overview

EpiBlogs is a full-stack blogging platform designed as a job-ready portfolio project. It focuses on production-minded backend architecture, secure auth flows, structured API design, and maintainable frontend patterns.

### Key Features

- Cookie-first authentication with HttpOnly session cookies.
- Local login + Google OAuth one-time code exchange.
- Full CRUD for authors, posts, and comments.
- Post likes endpoints (read + toggle).
- Cloudinary media upload for avatars and covers.
- Post search, category/tag filtering, aggregated tag endpoint.
- CORS and Helmet hardening for real deployment scenarios.

### Engineering Highlights

- Versioned REST API under /api/v1.
- Server-side authorization and ownership checks.
- Clear backend/frontend domain separation.
- Automated test coverage with Vitest.
- API collection aligned with runtime behavior (Postman).

### Concrete Runtime Details

- Auth cookie name: epiblogs.accessToken.
- Auth cookie max age: 60 minutes.
- One-time Google auth exchange code TTL: 60 seconds.
- Default backend port: 3000.
- CSP and CORS are configured for local and production environments.

## Screenshots

### Core Views

![Login Section](screenshots/LoginSection.png)
![Dashboard](screenshots/Dashboard.png)
![Authors Section](screenshots/AuthorsSection.png)
![Post Details](screenshots/PostDetails.png)
![Comment Section](screenshots/CommentSection.png)
![Your Profile](screenshots/YourProfile.png)

## Repository Layout

```
EpiBlogs/                               ← monorepo root
│
├── package.json                        ← root scripts (dev, test, lint, build, verify)
├── package-lock.json                   ← root lockfile (devDependencies for Vitest + Testing Library)
├── vitest.config.js                    ← Vitest configuration (jsdom environment for frontend tests)
├── .env.test                           ← committed test env (VITE_API_URL for Vitest runs, no secrets)
├── .gitignore                          ← ignores node_modules, dist, .env, coverage, logs
├── .gitattributes                      ← Git line-ending and diff settings
├── readme.md                           ← this file
│
├── .github/
│   └── workflows/
│       └── ci.yml                      ← GitHub Actions CI: install → check → test → lint → build
│                                          also guards against hardcoded localhost URLs in source
│
├── backend/                            ← Express 5 + MongoDB API (Node.js ESM package)
│   ├── package.json                    ← backend scripts: dev (nodemon), start, check, seed:*
│   ├── jsconfig.json                   ← JS paths config for editor tooling
│   ├── .env.example                    ← template for backend/.env (all supported variables)
│   │
│   ├── server.js                       ← entry point: validates env, connects Mongoose, starts HTTP
│   │                                      server on PORT (default 3000), handles SIGINT/SIGTERM
│   │
│   ├── app.js                          ← Express app factory:
│   │                                      1. CORS (shared buildCorsOptions)
│   │                                      2. Preflight pass-through
│   │                                      3. Helmet + CSP (Google OAuth / Cloudinary / fonts)
│   │                                      4. JSON body parser (100 kb limit)
│   │                                      5. Passport initialisation
│   │                                      6. GET /health → { status: "ok" }
│   │                                      7. Authentication middleware
│   │                                      8. /api/v1 → apiRouter
│   │
│   ├── routes/
│   │   ├── apiRouter.js                ← mounts /auth, /authors, /categories, /posts under /api/v1
│   │   ├── authRouter.js               ← auth route definitions (register, login, logout, me, Google)
│   │   ├── authorRouter.js             ← author CRUD route definitions
│   │   ├── categoryRouter.js           ← category route definitions
│   │   ├── postRouter.js               ← post, like, comment route definitions
│   │   │
│   │   ├── auth/
│   │   │   ├── handlers.js             ← register, login, logout, me, Google OAuth handlers
│   │   │   ├── validators.js           ← input validation for auth payloads
│   │   │   └── responseHelpers.js      ← shared helpers for building auth responses
│   │   │
│   │   ├── authors/
│   │   │   ├── handlers.js             ← list, get, update, avatar upload handlers
│   │   │   └── validators.js           ← input validation for author payloads
│   │   │
│   │   ├── categories/
│   │   │   └── handlers.js             ← list categories handler
│   │   │
│   │   └── posts/
│   │       ├── postHandlers.js         ← list, get, create, update, delete, cover upload handlers
│   │       ├── commentHandlers.js      ← list, create, delete comment handlers
│   │       ├── likeHandlers.js         ← get likes count, toggle like handlers
│   │       ├── postHelpers.js          ← shared helpers (populate, serialise)
│   │       └── validators.js           ← input validation for post/comment payloads
│   │
│   ├── middlewares/
│   │   ├── authentication.js           ← JWT cookie extraction → req.author (skips if missing/invalid)
│   │   ├── rateLimit.js                ← MongoDB-backed sliding-window rate limiter middleware
│   │   ├── uploadCloudinary.js         ← multer-storage-cloudinary config for avatar / cover uploads
│   │   └── mailer.js                   ← nodemailer transporter setup
│   │
│   ├── models/
│   │   ├── Author.js                   ← Mongoose schema: name, email, password, avatar, googleId, …
│   │   ├── Post.js                     ← Mongoose schema: title, content, category, tags, cover, author, …
│   │   ├── Category.js                 ← Mongoose schema: name, slug
│   │   ├── PostLike.js                 ← Mongoose schema: post ref + author ref (unique compound)
│   │   ├── AuthCode.js                 ← Mongoose schema: one-time Google exchange code (TTL 60 s)
│   │   ├── JwtBlacklist.js             ← Mongoose schema: revoked JWT jti values
│   │   └── RateLimitEntry.js           ← Mongoose schema: sliding-window rate limit log
│   │
│   ├── utils/
│   │   ├── authCookie.js               ← set / clear epiblogs.accessToken HttpOnly cookie (maxAge 1 h)
│   │   ├── authExchange.js             ← generate and verify one-time Google auth exchange codes
│   │   ├── authenticatedAuthor.js      ← guard helper: asserts req.author is present
│   │   ├── authorData.js               ← serialise Author document (strips sensitive fields)
│   │   ├── cookieUtils.js              ← low-level cookie read / write helpers
│   │   ├── cors.js                     ← buildCorsOptions: reads env vars, resolves allowed origins
│   │   ├── googleOAuth.js              ← Passport Google OAuth 2.0 strategy configuration
│   │   ├── jwt.js                      ← sign / verify JWT (uses JWT_SECRET_KEY)
│   │   ├── logger.js                   ← pino logger instance
│   │   ├── oauthState.js               ← CSRF state param generation and validation for OAuth flow
│   │   ├── ownership.js                ← assertOwnership: checks req.author._id vs resource owner
│   │   ├── passwords.js                ← bcrypt hash and compare wrappers
│   │   ├── postData.js                 ← serialise Post document
│   │   ├── routeErrors.js              ← typed HTTP error helpers (400, 401, 403, 404, 409, 500)
│   │   └── validateEnv.js              ← checks required env variables on startup, logs warnings
│   │
│   ├── scripts/                        ← data maintenance utilities (run with node / npm run seed:*)
│   │   ├── seedCategories.js           ← upserts categories from categories.json into MongoDB
│   │   ├── syncSeedToMongo.js          ← upserts authors + posts from seed/ files into MongoDB
│   │   ├── fixPosts.js                 ← normalises post fields (slugs, dates, categories)
│   │   ├── fixPostCategorySlugs.js     ← re-links posts to category documents by slug
│   │   ├── applyStablePostCovers.js    ← assigns stable Cloudinary URLs to posts
│   │   ├── applyThemedPlaceholderCovers.js ← assigns placeholder covers by category theme
│   │   ├── freezeUnsplashCovers.js     ← downloads Unsplash covers and re-uploads to Cloudinary
│   │   ├── categories.json             ← seed data: category list
│   │   └── postCoverMap.json           ← seed data: post-id → cover URL mapping
│   │
│   ├── postman/
│   │   └── EpiBlogs.postman_collection.json  ← full Postman collection for manual API testing
│   │
│   └── striveBlog.drawio.svg           ← architecture diagram (draw.io)
│
├── frontend/                           ← React 19 + Vite SPA
│   ├── package.json                    ← frontend scripts: dev, build, lint, preview
│   ├── vite.config.js                  ← Vite configuration
│   ├── eslint.config.js                ← ESLint flat config for React / JSX
│   ├── index.html                      ← HTML entry point (Vite SPA shell)
│   ├── .env.example                    ← template for frontend/.env (VITE_API_URL_* vars)
│   ├── vercel.json                     ← Vercel SPA rewrite rules (/* → /index.html)
│   │
│   └── src/
│       ├── main.jsx                    ← React entry point (ReactDOM.createRoot)
│       ├── App.jsx                     ← root component: React Router routes + auth context
│       ├── App.css                     ← global styles
│       │
│       ├── AuthPage.jsx                ← login / register page (local + Google OAuth)
│       ├── AuthorList.jsx              ← paginated authors listing page
│       ├── PostList.jsx                ← dashboard post list with search and tag/category filter
│       ├── PostCard.jsx                ← single post card component
│       ├── PostDetail.jsx              ← full post view with comments and likes
│       ├── PostCover.jsx               ← cover image upload component
│       ├── ProfilePage.jsx             ← authenticated user profile and avatar upload
│       ├── Form.jsx                    ← reusable create/edit post form
│       ├── List.jsx                    ← generic list wrapper component
│       ├── CategorySelect.jsx          ← category dropdown selector component
│       ├── SearchBar.jsx               ← text search input component
│       ├── SearchPost.jsx              ← combined search + filter panel
│       ├── TagFilter.jsx               ← tag filter selector component
│       ├── TagInput.jsx                ← tag creation input component
│       │
│       ├── api/
│       │   └── client.js              ← fetch wrapper: base URL resolution, credentials: "include"
│       │
│       ├── assets/
│       │   ├── api.js                 ← domain API calls (authors, posts, comments, likes, categories)
│       │   └── createPostFetch.js     ← multipart fetch helper for post creation with cover
│       │
│       ├── constants/
│       │   └── tags.js                ← predefined tag list used across the UI
│       │
│       ├── hooks/
│       │   ├── useAuthSession.js      ← auth session state hook (login, logout, me, Google exchange)
│       │   ├── authSessionHelpers.js  ← helper functions for useAuthSession
│       │   ├── usePostComments.js     ← hook: fetch / create / delete comments for a post
│       │   └── usePostLikes.js        ← hook: fetch like count and toggle like for a post
│       │
│       └── utils/
│           └── navigation.js          ← programmatic navigation helpers
│
├── test/                              ← Vitest test suites (run from root)
│   ├── backend/                       ← backend integration and unit tests (supertest + Vitest)
│   │   ├── appCors.test.js            ← CORS middleware integration tests
│   │   ├── authRouter.test.js         ← auth route integration tests (register, login, logout, me)
│   │   ├── authentication.test.js     ← authentication middleware unit tests
│   │   ├── authorHandlers.test.js     ← author handler unit tests
│   │   ├── categoryHandlers.test.js   ← category handler unit tests
│   │   ├── commentHandlers.test.js    ← comment handler unit tests
│   │   ├── cors.test.js               ← CORS utility unit tests
│   │   ├── googleOAuth.test.js        ← Google OAuth utility unit tests
│   │   ├── googleOAuthHandlers.test.js← Google OAuth handler unit tests
│   │   ├── googleOAuthSync.test.js    ← Google OAuth flow synchronisation tests
│   │   ├── inputSanitizers.test.js    ← input validation/sanitization unit tests
│   │   ├── jwt.test.js                ← JWT sign/verify unit tests
│   │   ├── likeHandlers.test.js       ← like handler unit tests
│   │   ├── models.test.js             ← Mongoose model validation tests
│   │   ├── oauthState.test.js         ← OAuth state param unit tests
│   │   ├── ownership.test.js          ← ownership assertion unit tests
│   │   ├── passwords.test.js          ← bcrypt hash/compare unit tests
│   │   ├── postHandlers.test.js       ← post handler unit tests
│   │   ├── postValidators.test.js     ← post validator unit tests
│   │   ├── rateLimit.test.js          ← rate limit middleware unit tests
│   │   ├── routeErrors.test.js        ← route error helper unit tests
│   │   └── routeProtection.test.js    ← protected route integration tests
│   │
│   └── frontend/                      ← frontend component and API tests (jsdom + Testing Library)
│       ├── App.test.jsx               ← App routing and render tests
│       ├── AuthPage.test.jsx          ← auth page component tests
│       ├── PostDetail.test.jsx        ← post detail component tests
│       ├── ProfilePage.test.jsx       ← profile page component tests
│       ├── api.test.jsx               ← API client and domain API function tests
│       ├── domainComponents.test.jsx  ← shared/domain component tests
│       └── vercel.json                ← Vercel rewrite config for Vitest server (frontend tests)
│
├── seed/                              ← static seed data (used by backend/scripts/)
│   ├── authors.json                   ← seed authors (name, email, avatar, …)
│   └── posts.json                     ← seed posts (title, content, category, tags, cover, …)
│
└── screenshots/                       ← UI screenshots used in this README
    ├── LoginSection.png
    ├── Dashboard.png
    ├── AuthorsSection.png
    ├── PostDetails.png
    ├── CommentSection.png
    └── YourProfile.png
```

## Architecture and API

- API base: /api/v1
- Health endpoint: GET /health
- Main route groups:
  - /api/v1/auth
  - /api/v1/authors
  - /api/v1/categories
  - /api/v1/posts

Core auth endpoints:

- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/auth/me
- GET /api/v1/auth/google
- GET /api/v1/auth/google/callback
- POST /api/v1/auth/google/exchange-code

Posts and comments endpoints (selected):

- GET /api/v1/posts
- GET /api/v1/posts/:postId
- POST /api/v1/posts
- PATCH /api/v1/posts/:postId/cover
- GET /api/v1/posts/:postId/likes
- POST /api/v1/posts/:postId/likes
- GET /api/v1/posts/:postId/comments
- POST /api/v1/posts/:postId/comments

Authors endpoints (selected):

- GET /api/v1/authors
- GET /api/v1/authors/:authorId
- PUT /api/v1/authors/:authorId
- PATCH /api/v1/authors/:authorId/avatar

## Local Setup

Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Run backend and frontend (two terminals):

```bash
npm run dev:backend
npm run dev:frontend
```

Alternative shortcuts:

```bash
npm run dev
```

Starts backend only (root shortcut):

```bash
npm start
```

Expected local URLs:

- frontend: http://localhost:5173
- backend: http://localhost:3000

Run checks:

```bash
npm run check
npx vitest --run
```

Full CI-style verification:

```bash
npm run verify
```

This runs tests + backend syntax check + frontend lint + frontend build.

## Environment Variables

Use these templates:

- backend/.env.example
- frontend/.env.example

Backend required:

- MONGODB_CONNECTION_URI
- JWT_SECRET_KEY

Backend commonly configured:

- NODE_ENV
- PORT
- DEVELOPMENT_FRONTEND_URL
- DEPLOYMENT_FRONTEND_URL
- CORS_ALLOWED_ORIGINS
- CORS_ALLOW_CREDENTIALS
- CORS_ALLOW_VERCEL_PREVIEWS
- TRUST_PROXY
- AUTH_COOKIE_SECURE
- AUTH_COOKIE_SAME_SITE
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- DEVELOPMENT_GOOGLE_CALLBACK_URL
- DEPLOYMENT_GOOGLE_CALLBACK_URL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

Frontend public vars:

- VITE_API_URL_DEVELOPMENT
- VITE_API_URL_PRODUCTION
- Optional fallback: VITE_API_URL

Recommended local setup:

- Copy backend/.env.example to backend/.env
- Copy frontend/.env.example to frontend/.env
- Keep VITE_API_URL_DEVELOPMENT=http://localhost:3000

## Testing and QA

- Backend + frontend tests via Vitest.
- Focused suites for auth, routing, handlers, domain components.
- Postman collection for manual API validation:
  - backend/postman/EpiBlogs.postman_collection.json

Useful test commands:

```bash
npm run test
npm run test:backend
npm run test:frontend
npm run test:watch
```

## Project Utilities

- Seed sync script:
  - backend/scripts/syncSeedToMongo.js

Backend seed and maintenance scripts:

```bash
npm --prefix backend run seed:categories
npm --prefix backend run seed:sync-mongo
npm --prefix backend run seed:fix-posts
npm --prefix backend run seed:fix-category-slugs
npm --prefix backend run seed:all
```

It upserts data from seed/authors.json and seed/posts.json with normalization rules.

## Security Notes

- HttpOnly auth cookie.
- Server-side ownership enforcement.
- Rate limiting on sensitive auth endpoints.
- Helmet + CORS protection.
- Sensitive author fields removed from serialized output.

## Troubleshooting

- If node server.js fails from repository root, run backend from backend folder or use npm run dev:backend from root.
- If frontend cannot call API, verify VITE_API_URL_DEVELOPMENT in frontend/.env and backend CORS env values.
- If uploads fail, verify Cloudinary env variables and ensure multipart/form-data requests are used.
- If Google login fails locally, verify DEVELOPMENT_GOOGLE_CALLBACK_URL and Google OAuth console redirect URL.
