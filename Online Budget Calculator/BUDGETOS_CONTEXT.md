# BudgetOS — Project Context File
# For use with Claude extension in VS Code

---

## Project Overview

BudgetOS is a personal finance tracker built for Abhishek Bolar (Markham, ON, Canada).
It tracks spending across 3 Scotiabank accounts and compares against monthly budget limits.
The goal is to save ~$1,500/month and track expenses in real time.

---

## Accounts

| Account | Type | Last 4 |
|---|---|---|
| Scotiabank Chequing | Day-to-day banking | 8628 |
| Scotiabank Scene+ Visa | Credit card | 3021 |
| Scotiabank Scene+ Visa | Credit card | 8010 |
| Scotiabank ScotiaLine | Line of credit | 0020 |

**Important:** When importing from chequing, skip any rows labelled
"MB-Transfer to Credit Card" or "Customer Transfer Dr. / Mb-Credit Card/Loc Pay."
These are inter-account payments and will double-count real spending.

---

## Income

- Monthly income: **$3,830**
- Paid **biweekly** (~$1,915 per deposit)
- Typical deposit dates: ~1st and ~15th of each month
- Source: EI (Employment Insurance) — Canada

---

## Budget Allocations

### Fixed Expenses (auto-apply every month — do not ask user to enter)

| Category | Monthly Amount | Notes |
|---|---|---|
| Rent | $780.00 | E-Transfer, due ~1st of month |
| Phone Bill (Fido) | $40.00 | Plan changed — was $70.63, now ~$40 |
| Work & Subscriptions | ~$241.65 | See breakdown below |

### Work & Subscriptions Breakdown (fixed recurring)

| Service | Amount |
|---|---|
| Hostinger (web hosting) | $60.01 |
| Hostinger (N8N) | $19.88 |
| Google Workspace | $12.43 |
| Apify | $41.22 |
| GoDaddy | $29.20 |
| Ubersuggest | $29.00 |
| Claude.ai | $31.64 |
| Google One | $3.15 |
| **Total** | **$226.53** |

### Variable Expense Budgets

| Category | Monthly Budget |
|---|---|
| Groceries | $200 |
| Outside Eating | $500 |
| Misc / Amazon | $100 |
| Transit | $50 |
| Entertainment | $100 |
| Family Payments | $100 |
| Personal Care | $202 |
| Laundry | $20 |
| Bank Fees | — (track only, no limit) |

### Personal Care Breakdown

Includes:
- Personal health/grooming: $104
- Haircut: $40
- Xyon Cream: $58
- **Total budget: $202**

---

## Categories (canonical list — use exactly these names)

```
Rent
Groceries
Outside Eating
Work & Subscriptions
Misc / Amazon
Phone Bill
Transit
Bank Fees
Entertainment
Family Payments
Personal Care
Income
Other
```

## Category Color Mapping

```js
const CATEGORY_COLORS = {
  "Rent":                 "#fb923c",
  "Groceries":            "#22c55e",
  "Outside Eating":       "#f97316",
  "Work & Subscriptions": "#6366f1",
  "Misc / Amazon":        "#ec4899",
  "Phone Bill":           "#f59e0b",
  "Transit":              "#3b82f6",
  "Bank Fees":            "#94a3b8",
  "Entertainment":        "#8b5cf6",
  "Family Payments":      "#e879f9",
  "Personal Care":        "#10b981",
  "Income":               "#22c55e",
  "Other":                "#6b7280",
};
```

---

## Auto-Categorization Rules

Use these rules when guessing category from merchant description:

```js
// Groceries
/groceri|superstore|no frills|loblaws|metro|freshco|sobeys|sunfood|hashim/i

// Outside Eating
/restaurant|cafe|coffee|mcdonald|starbucks|doordash|pizza|sushi|tim horton|second cup|
 uber.*eat|ubereats|lone star|caribbean queen|asian gourmet|dining/i

// Transit
/uber(?!.*eat)|presto|esso|petro|parking|bus pass|taxi|lyft/i

// Work & Subscriptions
/hostinger|godaddy|google.*workspace|apify|ubersuggest|claude|recraft|
 google.*one|n8n|paypal.*hostinger/i

// Misc / Amazon
/amazon|walmart|target|ebay|aliexpress|dollarama|shopkatymeo/i

// Phone Bill
/fido|rogers|bell|telus|koodo|phone bill|wireless/i

// Family Payments
/remitly/i

// Entertainment
/netflix|spotify|apple.*bill|steam|disney|segpay|upg.*paymentico/i

// Bank Fees
/interest charge|service charge|monthly fee|card protection|scotia.*protect/i

// Income
/salary|payroll|e-transfer.*in|direct deposit|paycheque|ei.*canada/i
```

---

## Weekly Budget Target

To save **$1,500/month**:

- Total income: $3,830
- Fixed expenses: ~$1,061.65
- Remaining after fixed: $2,768.35
- Savings target: $1,500
- **Max variable spend per month: $1,268.35**
- **Max variable spend per week: ~$272**

Weekly breakdown suggestion:
| Category | Weekly |
|---|---|
| Outside Eating | $100 |
| Groceries | $60 |
| Entertainment | $25 |
| Transit | $20 |
| Family Payments | $25 |
| Misc / Amazon | $25 |
| Other/buffer | $17 |
| **Total** | **$272** |

---

## Data Months Available

| Month | Status | Notes |
|---|---|---|
| March 2026 | ✅ Complete | All 3 account PDFs uploaded |
| May 2026 | 🔄 Ongoing | Day-by-day screenshot uploads |
| April 2026 | ❌ Missing | Not yet uploaded |
| Jan/Feb 2026 | ❌ Partial | Only visible as opening balances |

---

## Current App Files

### 1. `budget-app.jsx` (React)
Main budget tracker with:
- March 2026 + May 2026 data hardcoded
- Month switcher (March / May toggle)
- Dashboard with real-time savings counter
- Weekly budget tracker (4 weeks, $272/week)
- Transactions tab grouped by category
- Budgets tab with progress bars
- Fixed expenses auto-loaded for May
- **AI Insights card on dashboard** — tap Generate to get 4–6 punchy, data-grounded tips (warnings, savings opportunities, patterns) via OpenRouter. Cached per-month in localStorage (`budgetos_insights_<month>`).
- **Ask AI tab** — free-form chat about your real budget data. Each message bundles a structured snapshot (categories, top merchants, recent txns) into the system prompt. Conversation cached per-month (`budgetos_chat_<month>`).
- Reuses the OpenRouter API key from `or_api_key` (same as transaction scanner). Defaults to Gemini 2.5 Pro, overridable via `or_model`.

### 2. `transaction-scanner.html` (Vanilla HTML/JS)
AI-powered screenshot scanner:
- Drop bank screenshots → AI reads transactions
- Uses OpenRouter API + Google Gemini 2.0 Flash
- API key stored in localStorage
- Returns categorized transaction list
- Export as JSON or CSV

---

## Features To Build Next

These are features the user wants added. Build them in VS Code:

### High Priority
- [ ] **Manual transaction entry form** — add date, description, amount, category, account
- [ ] **Income entry** — add income with date and source
- [ ] **Add/edit/delete categories** — custom category management
- [ ] **Persistent storage** — save all data to localStorage so it survives page refresh
- [ ] **Import from scanner** — paste JSON from transaction-scanner into budget-app
- [ ] **Month management** — add new months, don't hardcode data

### Medium Priority
- [ ] **Edit existing transactions** — tap to edit any field inline
- [ ] **Budget adjustment UI** — change budget limits from a settings screen
- [ ] **Notes field** — add a note to any transaction
- [ ] **Search transactions** — full-text search across all months
- [ ] **Export month report** — download CSV of any month

### Nice to Have
- [ ] **Recurring transaction detection** — flag if same merchant appears monthly
- [ ] **Spending pace alert** — warn if on track to exceed weekly budget
- [ ] **Year-over-year view** — once enough months accumulate
- [ ] **Split transactions** — e.g. one Amazon order split across categories

---

## Tech Stack

- **budget-app.jsx**: React (functional components + hooks), inline styles only, no CSS-in-JS library
- **transaction-scanner.html**: Vanilla HTML/CSS/JS, no framework
- **Storage**: localStorage (no backend)
- **AI**: OpenRouter API → Google Gemini 2.0 Flash (for image reading)
- **Fonts**: System UI / Syne / DM Mono

## Design System

```css
--bg: #080c12 or #0f0f1a       /* page background */
--surface: #13132b             /* card background */
--surface2: #1e1e2e            /* elevated surface */
--border: #2d2d4e              /* borders */
--accent: #f97316              /* primary orange */
--accent2: #3b82f6             /* blue */
--green: #22c55e               /* income / positive */
--red: #ef4444                 /* over budget / negative */
--text: #e2e8f0                /* primary text */
--muted: #64748b               /* secondary text */
```

---

## Key Business Rules

1. **Never double-count** credit card payments from chequing — skip "Transfer to Credit Card" rows
2. **Fixed expenses auto-load** — Rent, Fido, Work & Subscriptions don't need manual entry each month
3. **Phone bill is now $40** (was $70.63 in Feb/Mar due to old plan)
4. **Family Payments budget is $100/month** — Remitly transfers to family
5. **Personal Care = $202** combining personal health ($104) + haircut ($40) + Xyon Cream ($58)
6. **Weekly limit = $272** on variable spending to hit $1,500 monthly savings
7. **Income is biweekly** ~$1,915 each deposit, totalling $3,830/month
8. **UPG Paymentico** = ~$29/month recurring (unknown service, flagged for review)
9. **Caribbean Queen** = frequent restaurant, Outside Eating
10. **Asian Gourmet** = frequent restaurant, Outside Eating

---

## Scotiabank CSV Format

When Scotiabank exports CSV from chequing, columns are:
```
Date, Transactions, Withdrawals ($), Deposits ($), Balance ($)
```

Credit card CSV columns:
```
Date, Description, Amount ($)
```
Positive = charge to card (spending), Negative = payment/credit

---

## Notes for Claude in VS Code

- Always use the exact category names from the canonical list above
- Preserve the dark theme design system
- Keep React components as functional components with hooks
- Use localStorage keys prefixed with `budgetos_` to avoid conflicts
- When adding persistent storage, migrate existing hardcoded data on first load
- The user uploads screenshots daily — the app should make this as frictionless as possible
- The user's savings goal is $1,500/month — always keep this visible on the dashboard
