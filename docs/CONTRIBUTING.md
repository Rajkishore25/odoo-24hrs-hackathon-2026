# Contributing to PeoplePay360

## Branch Strategy

```
main
 ├── feature/employee-ui
 ├── feature/contract-ui
 ├── feature/payroll-ui
 ├── feature/employee-api
 ├── feature/attendance-api
 ├── feature/payroll-engine
 └── feature/auth
```

Never push directly to `main`.

## Commit Messages

Use semantic prefixes:

```
feat: add employee listing interface
fix: correct contract overlap detection
chore: update prisma schema
docs: add API endpoint for payslips
```

## Environment

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

Copy `.env.example` to `.env` and fill in values before running.

## Running locally

```bash
# backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# frontend
cd frontend
npm install
npm run dev
```

## API Contract Rule

If an API shape must change:
1. Update `docs/API.md`
2. Notify the affected owner
3. Update shared types in `frontend/src/types/`
4. Test both sides
