# EpiBlogs

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Backend-Express-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/ODM-Mongoose-880000?logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vitest](https://img.shields.io/badge/Test-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Postman](https://img.shields.io/badge/API-Postman-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)

Full stack editorial dashboard built with a modular Node.js/Express backend and a React frontend. The project includes JWT authentication, protected API routes, author and post management, automated tests, and a Postman collection aligned with the current API.

## Quick Links

- [Screenshots](#screenshots)
- [Tech Links](#tech-links)
- [Project Structure](#project-structure)
- [API Collection](#api-collection)
- [Italiano](#italiano)
- [English](#english)

## Screenshots

Portfolio-ready screenshot paths:

- `docs/screenshots/01-login.png`
- `docs/screenshots/02-register.png`
- `docs/screenshots/03-dashboard.png`
- `docs/screenshots/04-posts.png`
- `docs/screenshots/05-authors.png`
- `docs/screenshots/06-post-details.png`

Recommended showcase order:

1. Login
2. Register
3. Dashboard overview
4. Posts section
5. Authors section
6. Detail or interaction screen

Suggested GitHub markdown:

```md
## Screenshots

### Login
![Login](docs/screenshots/01-login.png)

### Register
![Register](docs/screenshots/02-register.png)

### Dashboard
![Dashboard](docs/screenshots/03-dashboard.png)

### Posts
![Posts](docs/screenshots/04-posts.png)

### Authors
![Authors](docs/screenshots/05-authors.png)
```

## Tech Links

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
- [Vitest](https://vitest.dev/)
- [Supertest](https://github.com/ladjs/supertest)
- [Postman](https://www.postman.com/)
- [Cloudinary](https://cloudinary.com/)
- [Nodemailer](https://nodemailer.com/)

## Project Structure

```text
EpiBlogs/
|- backend/
|  |- app.js
|  |- server.js
|  |- middlewares/
|  |- models/
|  |- routes/
|  |  |- auth/
|  |  |- authors/
|  |  |- posts/
|  |- utils/
|  |- postman/
|- frontend/
|  |- src/
|  |  |- assets/
|  |  |- hooks/
|- test/
|  |- backend/
|  |- frontend/
|- docs/
|  |- screenshots/
|- package.json
```

## API Collection

Postman collection:

- [backend/postman/EpiBlogs.postman_collection.json](/C:/Users/Utente/OneDrive/Dokumente/GitHub/m6-backend/EpiBlogs/backend/postman/EpiBlogs.postman_collection.json)

## Italiano

### Panoramica

EpiBlogs e una dashboard editoriale full stack sviluppata per gestire:

- autenticazione JWT
- registrazione e login utenti
- recupero utente autenticato con `/me`
- CRUD autori
- CRUD post
- CRUD commenti
- upload immagini con Cloudinary
- invio email con Nodemailer / SendGrid

Il progetto e stato rifattorizzato con una struttura piu modulare sia nel backend sia nei test, mantenendo stabile il comportamento applicativo.

### Stack Tecnologico

- Frontend: React, Vite, React Bootstrap
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth e sicurezza: JWT, bcrypt
- Integrazioni: Cloudinary, Nodemailer
- Testing: Vitest, Supertest, jsdom
- Tooling: ESLint, Postman

### Funzionalita Principali

- Tutti gli endpoint protetti richiedono `Authorization: Bearer <token>`.
- `POST /login` restituisce il token di accesso.
- `GET /me` restituisce l'utente collegato al token.
- Il frontend salva il token in `localStorage` e ripristina la sessione al refresh.
- Se il token non e piu valido, il frontend forza il logout automaticamente.
- La collection Postman e allineata al progetto attuale.
- La suite test copre backend e frontend con file separati in `test/backend` e `test/frontend`.

### Avvio Locale

#### Installazione

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

#### Variabili ambiente

Configura `backend/.env` con almeno:

- `PORT`
- `MONGODB_CONNECTION_URI`
- `JWT_SECRET_KEY`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `SENDGRID_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### Avvio backend

```bash
npm run dev
```

#### Avvio frontend

```bash
npm --prefix frontend run dev
```

### Test e Qualita

```bash
npm test
npm run test:backend
npm run test:frontend
npm --prefix frontend run lint
npm --prefix frontend run build
```

Stato review finale:

- test automatici: OK
- lint frontend: OK
- build frontend: OK
- collection Postman: OK
- struttura Git: ripulita da `node_modules` tracciati

### Endpoints Principali

- `POST /login`
- `GET /me`
- `POST /authors`
- `GET /api/v1/authors`
- `POST /api/v1/posts`
- `GET /api/v1/posts/:postId/comments`

### Portfolio Value

Questo repository mostra competenze su:

- progettazione REST API protette
- modularizzazione backend Express
- integrazione reale frontend/backend
- session management lato client
- testing multi-layer
- pulizia strutturale del repository

---

## English

### Overview

EpiBlogs is a full stack editorial dashboard built to manage:

- JWT authentication
- user registration and login
- authenticated user retrieval through `/me`
- author CRUD operations
- post CRUD operations
- comment CRUD operations
- image uploads through Cloudinary
- email notifications with Nodemailer / SendGrid

The project was refactored into a cleaner, more modular structure across backend and testing layers while keeping the existing behavior stable.

### Tech Stack

- Frontend: React, Vite, React Bootstrap
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth and security: JWT, bcrypt
- Integrations: Cloudinary, Nodemailer
- Testing: Vitest, Supertest, jsdom
- Tooling: ESLint, Postman

### Core Features

- All protected endpoints require `Authorization: Bearer <token>`.
- `POST /login` returns the access token.
- `GET /me` returns the authenticated user linked to the token.
- The frontend stores the token in `localStorage` and restores the session on refresh.
- Invalid tokens trigger an automatic logout on the client.
- The Postman collection is aligned with the current API.
- The automated suite covers both backend and frontend in `test/backend` and `test/frontend`.

### Local Setup

#### Install

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

#### Environment variables

Configure `backend/.env` with at least:

- `PORT`
- `MONGODB_CONNECTION_URI`
- `JWT_SECRET_KEY`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_FROM`
- `SENDGRID_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

#### Start backend

```bash
npm run dev
```

#### Start frontend

```bash
npm --prefix frontend run dev
```

### Testing and Quality

```bash
npm test
npm run test:backend
npm run test:frontend
npm --prefix frontend run lint
npm --prefix frontend run build
```

Final review status:

- automated tests: OK
- frontend lint: OK
- frontend build: OK
- Postman collection: OK
- Git structure: cleaned from tracked `node_modules`

### Main Endpoints

- `POST /login`
- `GET /me`
- `POST /authors`
- `GET /api/v1/authors`
- `POST /api/v1/posts`
- `GET /api/v1/posts/:postId/comments`

### Portfolio Value

This repository highlights practical skills in:

- protected REST API design
- Express backend modularization
- real frontend/backend integration
- client-side session management
- multi-layer automated testing
- repository cleanup and maintainability work
