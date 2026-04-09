# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal expense tracking web app with a Django 6.0 backend (REST API + server-rendered templates) and a React 19 SPA frontend. Deployed on Railway using Nixpacks with PostgreSQL in production, SQLite locally.

## Commands

### Backend (from project root)
```bash
python manage.py runserver                    # Dev server on :8000
python manage.py migrate                      # Apply migrations
python manage.py makemigrations tracker       # Generate new migrations
python manage.py loaddata tracker/fixtures/categories.json  # Seed categories
python manage.py test tracker                 # Run tests
python manage.py process_recurring            # Process due recurring transactions
python manage.py send_weekly_summary          # Send weekly email summaries
```

### Frontend (from `frontend/`)
```bash
npm run dev      # Vite dev server on :5173 (proxies /api to :8000)
npm run build    # Production build to frontend/dist/
npm run lint     # ESLint
```

### Production
Uses `DJANGO_SETTINGS_MODULE=tracking_expenses.settings_prod`. Build steps are in `nixpacks.toml`. Runtime entry is `Procfile` -> `start.sh` (runs migrate then gunicorn).

## Architecture

### Dual UI System
The app serves two UIs from the same Django backend:
- **Django templates** (`templates/`): Server-rendered views, used in development (`DEBUG=True`). Routed via `tracker/urls.py`.
- **React SPA** (`frontend/`): Client-side app, used in production (`DEBUG=False`). Served as a catch-all for non-API/admin routes via `tracking_expenses/urls.py`. The Vite dev server proxies `/api` to Django.

Both UIs consume the same REST API at `/api/`.

### API Structure
- `/api/token/` and `/api/token/refresh/` — JWT auth (SimpleJWT)
- `/api/register/` — Public registration endpoint
- `/api/me/` — Current user info + notification prefs
- `/api/transactions/`, `/api/categories/`, `/api/budgets/`, `/api/recurring/` — CRUD resources
- `/api/summary/` — Aggregated financial summary

API routes are defined in `tracker/api_urls.py`. All authenticated endpoints use JWT + session auth.

### Key Backend Patterns
- **Transaction.save()** auto-signs amounts: expenses become negative, income positive. All financial aggregation depends on this convention.
- **Email notifications** (`tracker/emails.py`): Triggered on transaction create — `check_large_expense()` and `check_budget_alert()` (at 80%/100% thresholds). Uses console email backend locally, Gmail SMTP in production.
- **Recurring transactions**: Management command `process_recurring` creates Transaction records from active RecurringTransaction entries whose `next_run <= today`, then advances `next_run`.
- Budget uniqueness is enforced at DB level: `unique_together = ['user', 'category', 'month']`.

### Frontend Structure
- `frontend/src/contexts/AuthContext.jsx` — JWT token management (localStorage), login/signup/logout
- `frontend/src/utils/api.js` — Axios instance with auto-refresh interceptor on 401
- `frontend/src/pages/` — Route-level components (Dashboard, Transactions, Reports, Budgets, Recurring, Profile)
- `frontend/src/components/` — Shared components (Layout, ProtectedRoute, StatCard)
- Charts use Chart.js via react-chartjs-2

### Production Deployment (Railway)
- `settings_prod.py` extends `settings.py`: PostgreSQL via `DATABASE_URL`, WhiteNoise for static files, Gmail SMTP for emails
- `nixpacks.toml` builds frontend then runs `collectstatic`
- `WHITENOISE_ROOT` points to `frontend/dist/` so Vite assets are served directly
- `start.sh` runs migrations at startup before launching gunicorn

### Environment Variables (production)
`SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
