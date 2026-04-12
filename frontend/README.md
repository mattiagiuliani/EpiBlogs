# Frontend

React + Vite client for the EpiBlogs platform.

## Responsibilities

- Render login, Google OAuth callback, and authenticated dashboard flows
- Hydrate auth state from the backend session and JWT exchange response
- Send protected API requests with `credentials: include` and `Authorization: Bearer <token>`
- Render ownership-aware post actions only for the authenticated author

## Auth Flow

1. Local login posts credentials to `/login`
2. Google login redirects through `/auth/google` and returns to `/auth/callback?code=...`
3. The client exchanges the one-time code with `/auth/google/exchange-code`
4. The backend sets the HttpOnly cookie and returns `{ token, author }`
5. The frontend stores the JWT in `sessionStorage` and normalizes the authenticated user to `{ _id, email }`

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Environment

Optional `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FRONTEND_BASE_URL=http://localhost:5173
```

## Notes

- Authentication state is managed in `src/hooks/useAuthSession.js`
- API helpers live in `src/assets/api.js`
- Owner-only post actions are rendered in `src/PostList.jsx`
