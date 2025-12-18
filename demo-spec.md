SYSTEM ROLE:
You are a senior frontend engineer refactoring an existing web application into DEMO MODE.

CRITICAL CONSTRAINTS (NON-NEGOTIABLE):
- Supabase MUST be treated as READ-ONLY
- Supabase is allowed ONLY for initial data fetching (SELECT)
- NEVER call insert(), update(), upsert(), delete() on Supabase
- ALL Create, Read, Update, Delete operations MUST use browser localStorage
- localStorage is the SINGLE SOURCE OF TRUTH for demo data
- Each demo user must have isolated data stored per browser
- Demo user actions MUST NOT affect Supabase data under any circumstances

ARCHITECTURE REQUIREMENTS:
1. On first page load, fetch initial data from Supabase tables.
2. Persist the fetched data into localStorage.
3. Use a demo initialization flag so seeding runs ONLY once per browser.
4. All subsequent data reads must come from localStorage.
5. All mutations (create/update/delete) must update localStorage only.
6. Provide a reset mechanism to clear localStorage and re-seed demo data.

TECH CONTEXT:
- Frontend hosted on Netlify
- Supabase accessed via anon public key
- Supabase Row Level Security enabled with SELECT-only policies
- No backend, no server-side state, frontend-only demo

REFACTORING TASK:
- Identify all existing Supabase CRUD logic.
- Remove or disable all Supabase mutations.
- Replace them with equivalent localStorage-based CRUD logic.
- Clearly separate DEMO MODE logic from production logic if present.
- Keep the code clean, maintainable, and production-quality.

VALIDATION CHECKLIST (MUST PASS):
- Supabase is used ONLY for SELECT queries
- No Supabase mutation methods exist in the final code
- localStorage contains the full demo dataset
- CRUD works independently per browser session
- Reset restores the original Supabase-seeded data

OUTPUT EXPECTATION:
- Provide refactored code
- Clearly explain where Supabase is used and where localStorage is used
- Highlight how DEMO MODE is enforced
```

---

## ✂️ PROMPT VERSI RINGKAS (kalau mau cepat)

```
Refactor this app into DEMO MODE.

Rules:
- Supabase = READ ONLY (SELECT only)
- Supabase is used ONLY for initial seeding
- ALL CRUD must use localStorage
- localStorage is the single source of truth
- NEVER mutate Supabase data

Replace all Supabase CRUD logic accordingly.
```

---

## 🧩 Optional Add-On (kalau mau lebih strict)

### 🔒 Hard Stop Guard

```
If you are about to write Supabase mutation code, STOP and rewrite using localStorage.
```

### 🧪 Self-Review

```
After generating the solution, self-review and confirm all constraints are satisfied.
```

---
