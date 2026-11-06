# FIRE Planner

Static FIRE planner for solo users and couples in Europe.

deployed at: https://myfireplanner.netlify.app/

The app models long-term portfolio growth and drawdown for one or two people, with support for pensions, inflation, extra costs, multiple analysis modes, and four interface languages.

## What It Does

- Supports both `solo` and `couple` household modes.
- Models one or two people with separate current age, retirement age, pension age, and end age.
- Projects a shared portfolio through the relevant work and retirement phases for the selected household mode.
- Includes current assets, yearly contributions, yearly spending, investment return, and inflation.
- Adds pension income once pension age is reached for the active household setup.
- Supports recurring or one-time extra costs such as studies, mortgage, renovation, healthcare, travel, or custom entries.
- Shows both a portfolio chart and a yearly cashflow chart.
- Supports deterministic, Monte Carlo, and stress-test style analyses.
- Supports Dutch, English, French, and German.
- Persists inputs and preferences in `localStorage`.

## Quick Start

This project has no build step and no backend. It is a static browser app.

1. Serve the repository over HTTP.
2. Open `index.html` in your browser through that local server.

Example options:

```powershell
py -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Running Tests

Regression tests cover the core portfolio and scenario calculations with Node's built-in test runner.

```powershell
npm test
```

If you prefer, you can also run them directly with:

```powershell
node --test --test-isolation=none
```

## Why A Local Server Is Needed

The app loads:

- translation files from `locales/*.json`
- local vendored frontend libraries in `vendor/`

Because locale files are fetched over HTTP, opening `index.html` directly via `file://` is not a reliable way to run the app.

## Usage Notes

- `Shared settings` contains the portfolio assumptions used by the active household setup.
- `Household` lets you switch between a solo projection and a couple projection.
- `Extras` lets you add cost events that affect the projection in specific years.
- `Show in today's purchasing power` adjusts values for inflation when displaying the charts.
- `Monte Carlo` and the stress modes are useful for comparing downside scenarios, not for predicting exact outcomes.

### Calculation conventions

- Contributions are the household's net salary surplus after ordinary living expenses. They exclude pensions and the separately configured extra costs; a negative contribution represents a deficit while one person works. Do not include pension income in this input: the app adds each person's pension separately after that person stops working and reaches pension age, even if their partner still works.
- Enter pensions as net monthly amounts in today's purchasing power. Pensions, retirement spending and extra costs are indexed using the simulated cumulative inflation. The contribution input is the amount for the first projected year and is indexed from the following year onward.
- The starting point represents current assets after any extra costs scheduled for the current calendar year. Subsequent rows apply a full year's investment return to the previous balance, followed by the annual cashflow. The app does not model monthly cashflow timing.
- Ages are annual labels: the row at the stop age includes the last working-year contribution; retirement spending starts in the next row. Pension eligibility uses the row's age and requires the person to have stopped working. Birthdays and partial pension years are not modelled.
- A plan succeeds only if every modelled cashflow can be funded. A zero balance is allowed when there is no unmet spending. An unfunded shortfall of more than half a currency cent permanently marks a simulation as unsuccessful, even if later income rebuilds the portfolio. Balances are floored at zero for display; unpaid expenses are recorded as shortfalls, not carried as debt. Base and stress summaries flag the first shortfall year.
- Real-value stress charts use the stress scenario's own cumulative inflation, while the base comparison uses base inflation. Monte Carlo converts each individual simulation to purchasing power before calculating percentiles. Summary amounts use the same units as the charts.
- Saved historical extra costs retain their dates. Expired costs are excluded; ongoing recurring costs apply only to remaining years, including the current year if applicable.
- Household spending stays unchanged after one person's end age. Pensions stop after that person's end age. The model assumes full pension indexation and does not model survivor pensions.

## Deployment

The app can be hosted on any static host that serves plain HTML, CSS, JS, and JSON files, for example:

- GitHub Pages
- Netlify
- Vercel static hosting
- any regular web server

Important deployment notes:

- Keep the `locales/` directory next to `index.html`.
- The app now uses relative locale loading, so it can be hosted from a subpath as well as from the site root.
- Keep the `vendor/` directory next to `index.html`, because it contains the locally hosted frontend libraries.

## Project Structure

```text
index.html        Main UI shell
style.css         Layout and styling
script.js         Calculation logic, charts, i18n, persistence
locales/          Translations
tests/            Regression tests for calculation logic
package.json      Minimal Node test script
```

## Developer Notes

### Architecture

- `index.html` defines the panels, sliders, chart canvases, language switcher, and analysis controls.
- `script.js` handles:
  - i18n initialization with `i18next`
  - restoring persisted state from `localStorage`
  - extra-cost management
  - portfolio and cashflow calculations
  - Monte Carlo and stress scenario analysis
  - rendering the Chart.js charts
- `style.css` contains the full responsive layout and visual design.

### Persistence

The app stores user state in the browser via `localStorage`, including:

- slider values
- selected language
- selected chart tab
- selected analysis mode
- extra costs
- the real-values toggle

There is no server-side storage.

### Dependencies

Loaded locally from `vendor/` and referenced by `index.html`:

- [Chart.js](https://www.chartjs.org/)
- [i18next](https://www.i18next.com/)
- [i18next-http-backend](https://github.com/i18next/i18next-http-backend)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector)

## Customization

Common changes are straightforward:

- Update translations in `locales/*.json`.
- Adjust slider ranges and defaults in `index.html`.
- Tune the financial logic and scenario behavior in `script.js`.
- Change the visual design in `style.css`.

## Limitations

- This is a simplified planning tool, not financial advice.
- The model uses high-level annual assumptions and does not model taxes, fees, asset allocation changes, or country-specific pension/tax rules.
- Frontend libraries are vendored locally rather than managed through a frontend build pipeline.

## Suggested Next Improvements

- Expand the README with screenshots or a worked example scenario.
- Pin or vendor frontend dependencies for more predictable long-term hosting.
- Consider separating calculation logic from DOM/chart code to make testing easier.
