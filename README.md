# Pricing calculator

Turns a salary into the monthly price charged to a client, and builds a full offer for a BOT team
with products, services and licenses. It started as a web version of two spreadsheets:

| Spreadsheet | Sheet | In the app |
| --- | --- | --- |
| Salary Calculator 2026 | Net calculator, FLC | **Single profile** tab: start from net or gross salary |
| BOT Calculator | BOT, NEW | **BOT team** tab: one card per position, plus a breakdown table with the same rows as the sheet |

The **BOT team** tab is also the offer builder: each position, product, service and license has its
own duration, the offer shows revenue and gross margin, and it can be exported or sent for approval.

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
    rates.ts      2026 statutory rates, pricing presets, working hours
    salary.ts     Net ↔ gross, payroll cost and price per profile
    bot.ts        Per-position and team totals for BOT pricing
    hourly.ts     Hourly cost and rate
    duration.ts   Durations in hours, days or months
    items.ts      Products, services and licenses: cost + markup
    offer.ts      Offer lines over their durations, revenue and gross margin
    export.ts     Internal and client exports as tables (used by Excel and PDF)
    xlsx.ts       Excel download (library loaded on demand)
    share.ts      Share links and the approval email
    money.ts      Excel-compatible rounding, EUR formatting, input parsing
  components/     Reusable inputs and result displays
  features/
    salary/       Single profile tab
    bot/          BOT team tab: positions, items, tables, export, approval
```

Everything in `src/lib` is independent of the UI, so it can move to a backend unchanged when the
calculator is connected to the CRM.

## Formulas

All amounts are in EUR.

**Net → gross** (`grossFromNet`): income tax is 10% and employee social security is 13.78%, capped
at 2,300 of insurable income. Above a net of 1,784.75 the employee contribution is fixed at 316.94.

**Price per profile** (`profileCost`), monthly:

```
payroll cost = gross + employer social security (18.92%, capped) + benefits (51.13) + insurance (50)
price        = payroll cost + rent (135) + overhead (4% of payroll) + markup (14% of payroll)
```

**BOT team** (`positionCost`), monthly: same structure, but amounts are totals for all FTEs of the
position, and travel, accommodation, equipment and a previous-month adjustment can be added.
Overhead also applies to travel and accommodation, markup only to payroll — as in the spreadsheet.
Employer social security is a manual figure in the sheet; the app estimates it from the average
salary per FTE until you enter the real one.

**Hourly rate** (`hourlyRate`), per FTE:

```
hourly cost = (monthly price − markup) / hours per month (145)
hourly rate = hourly cost × (1 + hourly markup)
```

**Products, services and licenses** (`itemCost`):

```
cost    = quantity × unit cost × duration   (× 1 for one-off items)
revenue = cost × (1 + markup)
GM      = revenue − cost
```

**Offer** (`offerSummary`): every line is priced over its own duration.
A position in months uses the monthly price (revenue = monthly price × months, GM = markup × months).
A position in hours or days uses the hourly rate (a day is 8 hours). For positions, GM is the markup:
rent, overhead, travel and equipment count as cost. The previous-month adjustment is a billing
correction and is left out of the offer.

Rent, benefits, insurance, overhead, markup, hourly markup and working hours are editable under
**Pricing assumptions**. **Standard** matches the salary calculator and the NEW sheet
(135 / 4% / 14%); **BOT template** matches the BOT sheet (200 / 5% / 20%). Switching presets keeps
the working hours.

## Export and approval

- **Internal, with costs**: offer with cost, revenue and GM per line, the monthly breakdown per
  position (with hourly cost and rate), products and licenses, and the pricing assumptions.
- **Client, prices only**: quantity, duration, unit price and total per line. No cost, markup or GM.

Each comes as Excel (`.xlsx`) or PDF (through the browser's print dialog: choose *Save as PDF*).

**Send for approval** opens an email to the approver with the revenue, cost and GM, a line summary
and a link that reopens the exact calculation; the internal Excel file is downloaded to attach.
The whole calculation is compressed into the link (`#q=…`), so no server is involved: anyone with
the link can see all costs. Opening a link shows the calculation without touching your own until
you choose **Save as my calculation**. The approver approves by replying to the email.

## Tests

`src/lib/*.test.ts` checks the functions against values computed by the spreadsheets themselves,
including every position on the NEW sheet and the salary-cap boundaries, plus hand-computed values
for hourly rates, durations, items, offer totals, exports and share links.
