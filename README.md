# FitTrack

Fitness and nutrition tracker built as a scale-ready Node.js/Express/TypeScript monolith. The backend uses MongoDB Atlas, secure cookie-based JWT authentication, Google OAuth, Cloudinary avatars, and Docker.

## Structure

- [`backend`](./backend) — API, database models, tests, Docker image, and API documentation.
- `frontend` — reserved for the React/TypeScript client phase.

## Development

```powershell
cd backend
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Set the required real service values in `backend/.env`; do not commit that file. See the backend README for the complete API and environment reference.
