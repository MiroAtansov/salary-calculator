# Pricing calculator

Turns a salary into the monthly price charged to a client, and prices a whole BOT team.
It is a web version of two spreadsheets:

| Spreadsheet | Sheet | In the app |
| --- | --- | --- |
| Salary Calculator 2026 | Net calculator, FLC | **Single profile** tab: start from net or gross salary |
| BOT Calculator | BOT, NEW | **BOT team** tab: one card per position, plus a breakdown table with the same rows as the sheet |

There is no backend yet. Inputs are kept in the browser's local storage so a reload doesn't lose them.

## Running it

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm test` | Run the calculation tests once (`npm run test:watch` to keep watching) |
| `npm run lint` | Lint with oxlint |

## How it's organised

```
src/
  lib/            Calculation logic — plain functions, no React
    rates.ts      2026 statutory rates and the pricing presets
    salary.ts     Net ↔ gross, payroll cost and price per profile
    bot.ts        Per-position and team totals for BOT pricing
    money.ts      Excel-compatible rounding, EUR formatting, input parsing
  components/     Reusable inputs and result displays
  features/
    salary/       Single profile tab
    bot/          BOT team tab
```

Everything in `src/lib` is independent of the UI, so it can move to a backend unchanged when the
calculator is connected to the CRM.

## Formulas

All amounts are monthly, in EUR.

**Net → gross** (`grossFromNet`): income tax is 10% and employee social security is 13.78%, capped
at 2,300 of insurable income. Above a net of 1,784.75 the employee contribution is fixed at 316.94.

**Price per profile** (`profileCost`):

```
payroll cost = gross + employer social security (18.92%, capped) + benefits (51.13) + insurance (50)
price        = payroll cost + rent (135) + overhead (4% of payroll) + markup (14% of payroll)
```

**BOT team** (`positionCost`): same structure, but amounts are totals for all FTEs of the position,
and travel, accommodation, equipment and a previous-month adjustment can be added. Overhead also
applies to travel and accommodation, markup only to payroll — as in the spreadsheet.
Employer social security is a manual figure in the sheet; the app estimates it from the average
salary per FTE until you enter the real one.

Rent, benefits, insurance, overhead and markup are editable under **Pricing assumptions**.
**Standard** matches the salary calculator and the NEW sheet (135 / 4% / 14%);
**BOT template** matches the BOT sheet (200 / 5% / 20%).

## Tests

`src/lib/*.test.ts` checks the functions against values computed by the spreadsheets themselves,
including every position on the NEW sheet and the salary-cap boundaries.
