# Finanzas - Savings (Ahorros) Feature Specification

## Overview

This document specifies the implementation of Savings movements in the Finanzas module, enabling users to track savings contributions associated with Goals (Metas) and Domains (Dominios).

---

## 1. DATA MODEL

### 1.1 New Entity: `Saving`

```sql
-- Table: savings
CREATE TABLE savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  budget_account_id UUID REFERENCES budget_accounts(id) ON DELETE SET NULL,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES life_domains(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_savings_user ON savings(user_id);
CREATE INDEX idx_savings_date ON savings(date);
CREATE INDEX idx_savings_account ON savings(budget_account_id);
CREATE INDEX idx_savings_goal ON savings(goal_id);
CREATE INDEX idx_savings_domain ON savings(domain_id);
CREATE INDEX idx_savings_user_date ON savings(user_id, date);

-- Composite index for monthly aggregations
CREATE INDEX idx_savings_account_date ON savings(budget_account_id, date);

-- RLS Policies
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own savings"
  ON savings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings"
  ON savings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings"
  ON savings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings"
  ON savings FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger
CREATE TRIGGER trigger_savings_updated_at
  BEFORE UPDATE ON savings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 1.2 Updated Trigger: Auto-Create "Otros" for SAVINGS

Update the existing `create_otros_account()` trigger to also create a SAVINGS "Otros" account:

```sql
-- Replace existing trigger function
CREATE OR REPLACE FUNCTION create_otros_accounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Create "Otros" for EXPENSE (existing behavior)
  INSERT INTO budget_accounts
    (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
  VALUES
    (NEW.id, 'Otros', 'EXPENSE', 0, 999, true);

  -- Create "Otros" for SAVINGS (new behavior)
  INSERT INTO budget_accounts
    (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
  VALUES
    (NEW.id, 'Otros', 'SAVINGS', 0, 999, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 TypeScript Types

```typescript
// src/lib/types/finances.ts (additions)

// Input type for creating a saving
export interface CreateSavingInput {
  amount: number;
  date: string; // YYYY-MM-DD
  budget_account_id?: string | null; // Optional - defaults to SAVINGS "Otros"
  goal_id: string; // REQUIRED
  domain_id: string; // REQUIRED
  note?: string | null;
}

// Input type for updating a saving
export interface UpdateSavingInput {
  amount?: number;
  date?: string;
  budget_account_id?: string | null;
  goal_id?: string;
  domain_id?: string;
  note?: string | null;
}

// Saving with loaded relationships
export interface SavingWithRelations extends Saving {
  budget_account?: BudgetAccount | null;
  goal?: {
    id: string;
    title: string;
    domain_id: string;
  } | null;
  domain?: {
    id: string;
    name: string;
    icon: string;
  } | null;
}

// Extended BudgetSummary (update existing)
export interface BudgetSummary {
  budget: MonthlyBudget;
  accounts: BudgetAccountWithActual[];
  totals: {
    income: { base: number; actual: number };
    expense: { base: number; actual: number };
    savings: { base: number; actual: number }; // NOW COMPUTED
  };
  remaining: number; // UPDATED FORMULA
  isOverspending: boolean;
}

// Extended AnnualSummary (update existing)
export interface AnnualSummary {
  year: number;
  months: MonthData[];
  totals: {
    income: { base: number; actual: number };
    expense: { base: number; actual: number };
    savings: { base: number; actual: number }; // NOW COMPUTED
    remaining: number; // UPDATED FORMULA
  };
  topExpenseAccounts: TopAccount[];
  topSavingsAccounts: TopAccount[]; // NEW
  monthlyTrend: MonthlyTrendData[]; // UPDATED to include savings
}

// Updated MonthlyTrendData
export interface MonthlyTrendData {
  month: number;
  expenseActual: number;
  savingsActual: number; // NEW
}
```

---

## 2. API ENDPOINTS (Server Actions)

### 2.1 Saving CRUD Actions

```typescript
// src/lib/actions/savings-actions.ts

/**
 * Create a new saving
 * - Auto-assigns to SAVINGS "Otros" if no account specified
 * - Validates goal_id and domain_id are provided
 * - Validates domain belongs to user's selected life plan
 */
export async function createSaving(input: CreateSavingInput): Promise<Saving>

/**
 * Update an existing saving
 * - Partial updates allowed
 * - Validates goal_id and domain_id if provided
 */
export async function updateSaving(savingId: string, input: UpdateSavingInput): Promise<Saving>

/**
 * Delete a saving
 */
export async function deleteSaving(savingId: string): Promise<void>

/**
 * Get a single saving with relations
 */
export async function getSaving(savingId: string): Promise<SavingWithRelations>

/**
 * Get savings for a date range with filters
 * @param startDate - YYYY-MM-DD
 * @param endDate - YYYY-MM-DD
 * @param accountId - Optional filter by account
 * @param goalId - Optional filter by goal
 * @param domainId - Optional filter by domain
 */
export async function getSavingsForDateRange(
  startDate: string,
  endDate: string,
  accountId?: string,
  goalId?: string,
  domainId?: string
): Promise<SavingWithRelations[]>

/**
 * Get savings grouped by account for a month
 * Returns accounts with their savings aggregates
 */
export async function getSavingsByAccount(
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<SavingWithRelations[]>

/**
 * Get SAVINGS category accounts for a month
 * For use in the savings form dropdown
 */
export async function getSavingsAccountsForMonth(
  year: number,
  month: number
): Promise<BudgetAccount[]>
```

### 2.2 Updated Budget Actions

```typescript
// src/lib/actions/finances-actions.ts (updates)

/**
 * Get budget summary with SAVINGS actual computed
 * UPDATED: Now calculates savings.actual from savings movements
 */
export async function getBudgetSummary(year: number, month: number): Promise<BudgetSummary | null>

/**
 * Get annual summary with savings KPIs
 * UPDATED: Includes actualSavings, topSavingsAccounts, and trend
 */
export async function getAnnualSummary(year: number): Promise<AnnualSummary>
```

### 2.3 Validation Rules

```typescript
// src/lib/validations/savings-validation.ts

export function validateCreateSaving(input: CreateSavingInput, userLifePlanDomains: string[]) {
  const errors: string[] = [];

  // Amount validation
  if (!input.amount || input.amount <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }

  // Date validation
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.push('La fecha es requerida en formato válido');
  }

  // Goal validation (REQUIRED)
  if (!input.goal_id) {
    errors.push('La meta es requerida para registrar un ahorro');
  }

  // Domain validation (REQUIRED)
  if (!input.domain_id) {
    errors.push('El dominio es requerido para registrar un ahorro');
  }

  // Domain must belong to user's life plan
  if (input.domain_id && !userLifePlanDomains.includes(input.domain_id)) {
    errors.push('El dominio debe pertenecer a tu plan de vida seleccionado');
  }

  return errors;
}
```

---

## 3. UI/UX SPECIFICATION

### 3.1 Navigation Updates

Update `FinancesTabs` to include savings views:

```
Tabs:
- Agregar Gasto (/finanzas/gastos)
- Agregar Ahorro (/finanzas/ahorros) [NEW]
- Historial (/finanzas/historial) [UPDATED - subtabs for Gastos/Ahorros]
- Presupuesto (/finanzas/presupuesto)
- Anual (/finanzas/anual)
```

### 3.2 New Page: Add Saving (`/finanzas/ahorros`)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Finanzas > Agregar Ahorro               │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ SAVING FORM                         │ │
│ │                                     │ │
│ │ Monto *                             │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ $ 0.00                        │   │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ Fecha                               │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ 2024-01-29 (today)            │   │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ Meta * (Requerido)                  │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ Selecciona una meta...        │ ▼ │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ Dominio * (Requerido)               │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ Auto-populated from goal      │ ▼ │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ Cuenta de ahorro (opcional)         │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │ Sin asignar (Otros)           │ ▼ │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ Nota (opcional)                     │ │
│ │ ┌───────────────────────────────┐   │ │
│ │ │                               │   │ │
│ │ └───────────────────────────────┘   │ │
│ │                                     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │      Registrar Ahorro           │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ AHORROS RECIENTES                       │
│ ┌─────────────────────────────────────┐ │
│ │ Hoy                        $1,500   │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ $1,500  Fondo emergencia  🏠    │ │ │
│ │ │ Meta: Fondo de emergencia       │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Behavior:**
- Goal dropdown loads user's active goals
- When goal is selected, auto-populate domain from goal's domain
- User can override domain if needed (dropdown shows life plan domains)
- Account dropdown shows SAVINGS category accounts (with "Otros" last)
- Form validates goal and domain are selected before submit

### 3.3 New Component: `SavingForm`

```typescript
interface SavingFormProps {
  saving?: Saving; // For edit mode
  onSuccess?: () => void;
}

// Features:
// - Amount input (number, min 0.01)
// - Date picker (defaults to today)
// - Goal select (REQUIRED) - shows active goals
// - Domain select (REQUIRED) - auto-populated from goal, can override
// - Account select (optional) - SAVINGS accounts
// - Note textarea
// - Loading state
// - Validation feedback
```

### 3.4 New Page: Savings History (`/finanzas/historial/ahorros`)

**Layout:**
```
┌─────────────────────────────────────────┐
│ Finanzas > Historial > Ahorros          │
├─────────────────────────────────────────┤
│ FILTROS                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────────┐ │
│ │ Desde   │ │ Hasta   │ │ Cuenta    ▼ │ │
│ └─────────┘ └─────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌─────────────────────┐ │
│ │ Dominio   ▼ │ │ Meta              ▼ │ │
│ └─────────────┘ └─────────────────────┘ │
├─────────────────────────────────────────┤
│ Total: $5,500 (12 movimientos)          │
├─────────────────────────────────────────┤
│ Hoy                              $1,500 │
│ ┌─────────────────────────────────────┐ │
│ │ $1,500   Fondo emergencia      🏠   │ │
│ │ Meta: Fondo de emergencia           │ │
│ │ Nota: Quincena enero                │ │
│ │                           ⋮ (menu)  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 25 Ene                           $2,000 │
│ ┌─────────────────────────────────────┐ │
│ │ $2,000   Inversión largo plazo 💰   │ │
│ │ Meta: Retiro temprano               │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3.5 New Component: `SavingsList`

Similar to `ExpenseList`:
- Groups savings by date
- Shows date header with daily total
- Empty state message
- Renders `SavingCard` for each

### 3.6 New Component: `SavingCard`

```typescript
interface SavingCardProps {
  saving: SavingWithRelations;
  onDelete?: () => void;
}

// Display:
// - Amount (currency format)
// - Account badge (if assigned)
// - Goal name
// - Domain with icon
// - Note (if present)
// - More menu (Edit, Delete)
// - Links to /finanzas/ahorro/[savingId] for edit
```

### 3.7 Savings Grouped by Account View

Add to presupuesto page or create `/finanzas/cuenta-ahorro/[accountId]`:

**Layout:**
```
┌─────────────────────────────────────────┐
│ < Volver   Cuenta: Fondo de emergencia  │
├─────────────────────────────────────────┤
│ Total: $4,500 (8 movimientos)           │
├─────────────────────────────────────────┤
│ [List of savings in this account]       │
└─────────────────────────────────────────┘
```

### 3.8 Updated Budget Table

**Changes to SAVINGS section:**

```
┌─────────────────────────────────────────────────────────────┐
│ AHORROS                                                      │
├──────────────────────┬─────────┬─────────┬─────────┬────────┤
│ Cuenta               │ Base    │ Actual  │ Dispon. │ # Mov  │
├──────────────────────┼─────────┼─────────┼─────────┼────────┤
│ Fondo emergencia     │ $3,000  │ $2,500  │ $500    │   5    │ ← clickable
│ Inversión LP         │ $2,000  │ $2,000  │ $0      │   3    │ ← clickable
│ Otros                │ $0      │ $1,000  │ -$1,000 │   2    │ ← clickable
├──────────────────────┼─────────┼─────────┼─────────┼────────┤
│ Total Ahorros        │ $5,000  │ $5,500  │ -$500   │  10    │
└──────────────────────┴─────────┴─────────┴─────────┴────────┘

ME QUEDA DEL MES: $X,XXX
= Ingresos Base - Ahorro Actual - Gasto Actual
```

### 3.9 Updated Annual Summary

**New KPIs:**
```
┌───────────────┬───────────────┬───────────────┐
│   INGRESOS    │   AHORROS     │   GASTOS      │
│               │               │               │
│ Base: $120k   │ Base: $24k    │ Base: $80k    │
│ Actual: —     │ Actual: $22k  │ Actual: $75k  │
└───────────────┴───────────────┴───────────────┘

BALANCE ANUAL: $23,000
= Ingresos Base - Ahorro Actual - Gasto Actual
```

**New Top Savings Accounts:**
```
Top Cuentas de Ahorro
1. Fondo emergencia     $12,000
2. Inversión LP          $8,000
3. Viaje familia         $2,000
```

**Updated Monthly Trend Chart:**
- Show two lines: Expenses (red) and Savings (blue)
- Legend: "Gastos" / "Ahorros"

**Updated Monthly Breakdown Table:**
```
┌───────┬─────────┬─────────┬─────────┬─────────┐
│ Mes   │Ingresos │ Ahorros │ Gastos  │ Balance │
├───────┼─────────┼─────────┼─────────┼─────────┤
│ Ene   │ $10,000 │ $2,000  │ $6,500  │ $1,500  │
│ Feb   │ $10,000 │ $1,800  │ $7,200  │ $1,000  │
│ ...   │         │         │         │         │
└───────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 4. COMPUTATION RULES

### 4.1 Savings Account Actual

```
Actual[account][month] = SUM(savings.amount)
  WHERE savings.budget_account_id = account.id
  AND savings.date BETWEEN month_start AND month_end
```

### 4.2 Savings Account Available

```
Available[account][month] = account.base_budget - Actual[account][month]
```

### 4.3 Monthly Totals

```
Total Base Savings = SUM(account.base_budget)
  WHERE account.category = 'SAVINGS'

Total Actual Savings = SUM(Actual[account])
  FOR ALL SAVINGS accounts

Total Available Savings = Total Base Savings - Total Actual Savings
```

### 4.4 Monthly Balance ("Me queda del mes")

**NEW FORMULA:**
```
Me queda = Total Base Income - Total Actual Savings - Total Actual Expenses
```

**Rationale:** Since we now track actual savings, we use the actual amount saved (not just planned) to calculate remaining disposable income. This gives a more accurate picture of what the user actually has left.

### 4.5 Annual Totals

```
Annual Base Income = SUM(monthly Total Base Income)
Annual Base Savings = SUM(monthly Total Base Savings)
Annual Actual Savings = SUM(monthly Total Actual Savings)
Annual Actual Expenses = SUM(monthly Total Actual Expenses)

Annual Balance = Annual Base Income - Annual Actual Savings - Annual Actual Expenses
```

### 4.6 Edit Saving Impact

| Change | Impact |
|--------|--------|
| Change date (same month) | No aggregate change |
| Change date (different month) | Source month Actual ↓, Target month Actual ↑ |
| Change amount | Account Actual updated |
| Change account | Source account Actual ↓, Target account Actual ↑ |
| Change goal/domain | Data persisted, no aggregate impact |

---

## 5. JIRA BACKLOG

### Epic: FIN-05 - Savings Movements

**Description:** Enable users to track savings movements with mandatory Goal and Domain associations.

---

### Story: FIN-05-01 - Create Saving with Default "Otros" Account

**Summary:** As a user, I can add a savings movement with a goal and domain, so I can track my savings progress.

**Story Points:** 5

**Acceptance Criteria:**

```gherkin
Feature: Create Saving

Scenario: Create saving with all fields
  Given I am on the "Agregar Ahorro" page
  And I have active goals in my life plan
  When I enter amount "1500"
  And I select date "2024-01-29"
  And I select goal "Fondo de emergencia"
  And the domain auto-populates from the goal
  And I select savings account "Fondo emergencia"
  And I enter note "Quincena enero"
  And I click "Registrar Ahorro"
  Then the saving is created successfully
  And I see a success message
  And the form resets
  And the saving appears in "Ahorros recientes"

Scenario: Create saving without selecting account
  Given I am on the "Agregar Ahorro" page
  When I enter amount "500"
  And I select goal "Vacaciones"
  And I do NOT select a savings account
  And I click "Registrar Ahorro"
  Then the saving is created
  And it is assigned to the "Otros" SAVINGS account for that month

Scenario: Attempt to create saving without goal
  Given I am on the "Agregar Ahorro" page
  When I enter amount "1000"
  And I do NOT select a goal
  And I click "Registrar Ahorro"
  Then I see validation error "La meta es requerida para registrar un ahorro"
  And the saving is NOT created

Scenario: Attempt to create saving without domain
  Given I am on the "Agregar Ahorro" page
  When I enter amount "1000"
  And I select a goal
  And I clear the domain field
  And I click "Registrar Ahorro"
  Then I see validation error "El dominio es requerido para registrar un ahorro"
  And the saving is NOT created

Scenario: Auto-create SAVINGS "Otros" account for new month
  Given I have no budget for February 2024
  When I create a saving with date "2024-02-15"
  Then a MonthlyBudget is created for February 2024
  And a "Otros" SAVINGS account is automatically created
  And the saving is assigned to that account
```

**Dev Notes:**
- Update DB trigger `create_otros_accounts()` to create both EXPENSE and SAVINGS "Otros"
- Create migration to add SAVINGS "Otros" to existing budgets
- Implement `createSaving()` server action with validation
- Create `SavingForm` component

---

### Story: FIN-05-02 - Edit Saving

**Summary:** As a user, I can edit an existing saving to correct mistakes or update information.

**Story Points:** 3

**Acceptance Criteria:**

```gherkin
Feature: Edit Saving

Scenario: Edit saving amount
  Given I have a saving of $1,000 for "Fondo emergencia"
  When I edit the saving
  And I change amount to $1,500
  And I save
  Then the saving amount is updated to $1,500
  And the account's Actual is updated

Scenario: Edit saving date to different month
  Given I have a saving in January
  When I edit the saving
  And I change date to February
  And I save
  Then the saving appears in February
  And January's Actual decreases
  And February's Actual increases

Scenario: Edit saving account
  Given I have a saving assigned to "Fondo emergencia"
  When I edit the saving
  And I change account to "Inversión LP"
  And I save
  Then "Fondo emergencia" Actual decreases
  And "Inversión LP" Actual increases

Scenario: Edit saving goal and domain
  Given I have a saving with goal "Vacaciones" and domain "Ocio"
  When I edit the saving
  And I change goal to "Fondo emergencia"
  And domain updates to "Finanzas"
  And I save
  Then the goal and domain are updated
  And the change is visible in all views
```

**Dev Notes:**
- Create `/finanzas/ahorro/[savingId]/page.tsx` edit page
- Implement `updateSaving()` server action
- Reuse `SavingForm` in edit mode

---

### Story: FIN-05-03 - Savings List with Filters

**Summary:** As a user, I can view my savings history with filters to find specific movements.

**Story Points:** 5

**Acceptance Criteria:**

```gherkin
Feature: Savings List

Scenario: View savings for current month
  Given I have 10 savings in the current month
  When I navigate to "Historial > Ahorros"
  Then I see all 10 savings grouped by date
  And I see the total amount
  And I see the transaction count

Scenario: Filter by date range
  Given I have savings across multiple months
  When I set date range to "2024-01-01" to "2024-01-31"
  Then I only see savings from January 2024

Scenario: Filter by account
  Given I have savings in multiple accounts
  When I select account filter "Fondo emergencia"
  Then I only see savings for that account

Scenario: Filter by domain
  Given I have savings across multiple domains
  When I select domain filter "Finanzas"
  Then I only see savings with that domain

Scenario: Filter by goal
  Given I have savings for multiple goals
  When I select goal filter "Fondo de emergencia"
  Then I only see savings for that goal

Scenario: Edit saving from list
  Given I see a saving in the list
  When I click the edit option in the menu
  Then I navigate to the saving edit page

Scenario: Delete saving from list
  Given I see a saving in the list
  When I click delete and confirm
  Then the saving is removed
  And the list refreshes
  And the totals update
```

**Dev Notes:**
- Create `/finanzas/historial/ahorros/page.tsx`
- Add goal filter to `FinancesFilters` component
- Create `SavingsList` and `SavingCard` components
- Implement `getSavingsForDateRange()` with filters

---

### Story: FIN-05-04 - Savings Grouped by Account with Drilldown

**Summary:** As a user, I can see my savings grouped by account and drill down to see details.

**Story Points:** 3

**Acceptance Criteria:**

```gherkin
Feature: Savings Grouped by Account

Scenario: View savings accounts in budget table
  Given I have the monthly budget page open
  And I have SAVINGS accounts with movements
  Then I see each SAVINGS account with:
    - Base budget
    - Actual (sum of savings)
    - Available (base - actual)
    - Transaction count

Scenario: Click account to see details
  Given I see "Fondo emergencia" with 5 transactions
  When I click on the account row
  Then I navigate to the account detail page
  And I see all 5 savings for that account

Scenario: "Otros" savings account
  Given I have savings without assigned accounts
  Then they appear under "Otros" SAVINGS account
  And I can click to see details
```

**Dev Notes:**
- Create `/finanzas/cuenta-ahorro/[accountId]/page.tsx`
- Update `BudgetTable` to show SAVINGS Actual/Available
- Implement `getSavingsByAccount()` server action

---

### Story: FIN-05-05 - Monthly Budget: Compute Savings Actual/Available

**Summary:** As a user, I can see my savings progress in the monthly budget table with actual amounts.

**Story Points:** 5

**Acceptance Criteria:**

```gherkin
Feature: Monthly Budget Savings Computation

Scenario: Display savings actual for account
  Given I have a SAVINGS account "Fondo emergencia" with base $3,000
  And I have savings of $1,000 + $1,500 for that account this month
  When I view the monthly budget
  Then "Fondo emergencia" shows:
    - Base: $3,000
    - Actual: $2,500
    - Available: $500

Scenario: Display savings totals
  Given I have multiple SAVINGS accounts with movements
  When I view the monthly budget
  Then I see "Total Ahorros" row with:
    - Total Base
    - Total Actual
    - Total Available

Scenario: Calculate "Me queda del mes"
  Given:
    - Total Base Income: $10,000
    - Total Actual Savings: $2,000
    - Total Actual Expenses: $6,000
  When I view the monthly budget
  Then "Me queda del mes" shows $2,000
  (Formula: 10,000 - 2,000 - 6,000)

Scenario: Overspending alert with savings
  Given my Actual Savings + Actual Expenses > Base Income
  When I view the monthly budget
  Then I see an overspending alert
  And "Me queda del mes" is negative (red)
```

**Dev Notes:**
- Update `getBudgetSummary()` to compute savings actual from `savings` table
- Update `BudgetTable` to show savings section with computed values
- Update "Me queda" formula: `income.base - savings.actual - expense.actual`
- Update `KPICard` and `OverspendingAlert` logic

---

### Story: FIN-05-06 - Annual Summary: Savings KPIs and Trends

**Summary:** As a user, I can see my annual savings performance including KPIs, trends, and top accounts.

**Story Points:** 5

**Acceptance Criteria:**

```gherkin
Feature: Annual Savings Summary

Scenario: Display annual savings totals
  Given I have savings throughout the year
  When I view the annual summary
  Then I see savings card with:
    - Base Savings (annual)
    - Actual Savings (annual)

Scenario: Display annual balance with savings
  Given:
    - Annual Base Income: $120,000
    - Annual Actual Savings: $20,000
    - Annual Actual Expenses: $85,000
  When I view the annual summary
  Then "Balance Anual" shows $15,000
  (Formula: 120,000 - 20,000 - 85,000)

Scenario: Display top savings accounts
  Given I have savings across multiple accounts
  When I view the annual summary
  Then I see "Top Cuentas de Ahorro" section
  And it shows top 5 accounts by actual amount

Scenario: Display monthly trend with savings
  Given I have savings throughout the year
  When I view the annual summary
  Then the trend chart shows two lines:
    - Expenses (red)
    - Savings (blue)
  And I can see the comparison

Scenario: Display monthly breakdown with savings
  Given I have savings throughout the year
  When I view the annual summary
  Then the monthly table includes "Ahorros" column
  And balance = income - savings - expenses
```

**Dev Notes:**
- Update `getAnnualSummary()` to include savings aggregations
- Add `topSavingsAccounts` calculation
- Update `AnnualTrendChart` to show dual lines
- Update `AnnualSummary` component layout

---

### Story: FIN-05-07 - Data Migration: Add SAVINGS "Otros" to Existing Budgets

**Summary:** Migrate existing data to support savings tracking.

**Story Points:** 2

**Acceptance Criteria:**

```gherkin
Feature: Data Migration

Scenario: Add SAVINGS "Otros" to existing budgets
  Given there are existing monthly budgets without SAVINGS "Otros"
  When the migration runs
  Then each existing budget has a SAVINGS "Otros" account added
  With:
    - name: 'Otros'
    - category: 'SAVINGS'
    - base_budget: 0
    - order_position: 999
    - is_otros_account: true

Scenario: Do not duplicate if already exists
  Given a budget already has a SAVINGS "Otros" account
  When the migration runs
  Then no duplicate is created
```

**Dev Notes:**
```sql
-- Migration script
INSERT INTO budget_accounts (monthly_budget_id, name, category, base_budget, order_position, is_otros_account)
SELECT mb.id, 'Otros', 'SAVINGS', 0, 999, true
FROM monthly_budgets mb
WHERE NOT EXISTS (
  SELECT 1 FROM budget_accounts ba
  WHERE ba.monthly_budget_id = mb.id
  AND ba.category = 'SAVINGS'
  AND ba.is_otros_account = true
);
```

---

## 6. DEPENDENCIES

```
FIN-05-07 (Migration) → blocks all other stories
FIN-05-01 (Create) → blocks FIN-05-02, FIN-05-03, FIN-05-04
FIN-05-02 (Edit) → blocks FIN-05-03
FIN-05-03 (List) → blocks FIN-05-04
FIN-05-04 (Grouped) → blocks FIN-05-05
FIN-05-05 (Monthly Budget) → blocks FIN-05-06
```

**Suggested Implementation Order:**
1. FIN-05-07 - Migration (2 SP)
2. FIN-05-01 - Create Saving (5 SP)
3. FIN-05-02 - Edit Saving (3 SP)
4. FIN-05-03 - Savings List (5 SP)
5. FIN-05-04 - Grouped View (3 SP)
6. FIN-05-05 - Monthly Budget (5 SP)
7. FIN-05-06 - Annual Summary (5 SP)

**Total: 28 Story Points**

---

## 7. EDGE CASES & ERROR HANDLING

### 7.1 Edge Cases

| Case | Handling |
|------|----------|
| No goals exist | Show message "Crea una meta primero" with link to goals page |
| Goal deleted after saving created | Cascade delete (savings deleted with goal) |
| Domain deleted after saving created | Cascade delete (savings deleted with domain) |
| Life plan changed | Domain validation uses current life plan; existing savings keep old domain |
| Account deleted | Reassign savings to "Otros" SAVINGS account |
| Negative amount entered | Reject with validation error |
| Future date entered | Allow (for planned savings) |
| Very old date entered | Allow (for retroactive entry) |

### 7.2 Error Messages (Spanish)

```typescript
const SAVINGS_ERRORS = {
  GOAL_REQUIRED: 'La meta es requerida para registrar un ahorro',
  DOMAIN_REQUIRED: 'El dominio es requerido para registrar un ahorro',
  DOMAIN_INVALID: 'El dominio debe pertenecer a tu plan de vida seleccionado',
  AMOUNT_INVALID: 'El monto debe ser mayor a 0',
  DATE_INVALID: 'La fecha es requerida en formato válido',
  SAVING_NOT_FOUND: 'Ahorro no encontrado',
  UNAUTHORIZED: 'No tienes permiso para modificar este ahorro',
  CREATE_FAILED: 'Error al crear el ahorro',
  UPDATE_FAILED: 'Error al actualizar el ahorro',
  DELETE_FAILED: 'Error al eliminar el ahorro',
};
```

---

## 8. FILE STRUCTURE

```
src/
├── lib/
│   ├── types/
│   │   └── finances.ts          # Updated with Saving types
│   ├── actions/
│   │   ├── finances-actions.ts  # Updated getBudgetSummary, getAnnualSummary
│   │   └── savings-actions.ts   # NEW: Saving CRUD actions
│   └── validations/
│       └── savings-validation.ts # NEW: Validation rules
├── components/
│   └── finances/
│       ├── SavingForm.tsx       # NEW
│       ├── SavingsList.tsx      # NEW
│       ├── SavingCard.tsx       # NEW
│       ├── SavingsFilters.tsx   # NEW (extends FinancesFilters)
│       ├── BudgetTable.tsx      # UPDATED
│       ├── AnnualSummary.tsx    # UPDATED
│       ├── AnnualTrendChart.tsx # UPDATED
│       ├── FinancesTabs.tsx     # UPDATED
│       └── index.ts             # UPDATED exports
└── app/
    └── (app)/
        └── finanzas/
            ├── ahorros/
            │   └── page.tsx     # NEW: Add saving page
            ├── ahorro/
            │   └── [savingId]/
            │       └── page.tsx # NEW: Edit saving page
            ├── historial/
            │   ├── page.tsx     # UPDATED: Add subtabs
            │   └── ahorros/
            │       └── page.tsx # NEW: Savings history
            ├── cuenta-ahorro/
            │   └── [accountId]/
            │       └── page.tsx # NEW: Savings account detail
            ├── presupuesto/
            │   └── page.tsx     # UPDATED: Show savings actual
            └── anual/
                └── page.tsx     # UPDATED: Show savings KPIs

supabase/
└── migrations/
    └── 016_savings_schema.sql   # NEW: Savings table + trigger update
```

---

## 9. TESTING STRATEGY

### Unit Tests
- Validation functions
- Computation helpers (actual, available, balance)
- Date/timezone handling

### Integration Tests
- Server actions with database
- Budget summary calculations
- Annual aggregations

### E2E Tests
- Create saving flow (happy path)
- Create saving without goal (validation)
- Edit saving across months
- Delete saving
- Budget table updates
- Annual summary displays

---

## 10. FUTURE CONSIDERATIONS

1. **Savings Goals with Targets:** Track progress toward specific savings amounts
2. **Recurring Savings:** Auto-generate savings on schedule
3. **Savings Withdrawals:** Track when money is taken out of savings
4. **Multi-currency Support:** Handle different currencies
5. **Savings Interest Tracking:** For investment accounts
6. **Goal Completion Celebration:** Visual feedback when goal reached
