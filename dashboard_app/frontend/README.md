# AMR-X Dashboard Frontend

React and Vite frontend for the AMR-X monitoring and mission-control
dashboard.

## Prerequisites

- Node.js 20.9+
- npm 10+

## Install and start

From the repository root:

```bash
npm run setup:dashboard
npm run dashboard:frontend
```

Open <http://localhost:5173/> in a browser. Press `Ctrl+C` to stop the
development server.

The dashboard sends requests under `/api` to the backend at
<http://localhost:8000>. Start the backend separately if you need live data;
see the [backend setup guide](../backend/README.md).

To start PostgreSQL, FastAPI, and this frontend together, use:

```bash
npm run dashboard
```

## Other commands

```bash
npm run build:dashboard  # Create a production build in dist/
npm run check:dashboard  # Check Python, lint the frontend, and build it
```

The lower-level frontend commands remain available when working inside
`dashboard_app/frontend`: `npm run dev`, `npm run build`, `npm run preview`,
and `npm run lint`.
