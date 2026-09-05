# PeoplePay360 — Frontend Guidelines

## 1. UI Stack
* React 18+ with TypeScript & Vite
* Tailwind CSS for utility styling
* shadcn/ui components (Radix UI primitives)
* Lucide React icons
* Axios for HTTP client
* React Router v6

## 2. Design System & Tokens
* Consistent typography: Modern sans-serif (Inter / Outfit / system-ui).
* Curated theme colors:
  * Primary: Deep Slate / Indigo (`#1e293b`, `#4f46e5`)
  * Accent: Emerald (`#10b981`) for approvals, Rose/Red (`#ef4444`) for critical errors, Amber (`#f59e0b`) for warnings.
* Consistent border radiuses (`rounded-lg`, `rounded-xl`) and subtle border lines (`border-slate-200 dark:border-slate-800`).

## 3. Communication Contract
* Always communicate with `/api` endpoints using the standard `{ success, data, error }` contract.
* Display validation cockpit issues clearly with badges for CRITICAL, WARNING, INFO.
* Disable the Finalize Payrun button if critical issues exist, and display clear explanation dialogs.
