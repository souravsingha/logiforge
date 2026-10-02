# LOGIFORGE AI — Backend

Predictive Logistics & Forward Supply Chain Decision Support System.

The backend follows the project workflow:

DATA → MONITOR → FORECAST → IDENTIFY RISK → PRIORITIZE → OPTIMIZE → SIMULATE → RECOMMEND → HUMAN REVIEW

## Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT
- bcrypt
- Zod
- Helmet
- CORS

## Run locally

```bash
npm install
```

Create `.env` from `.env.example`.

Create PostgreSQL database:

```sql
CREATE DATABASE logiforge;
```

Apply schema:

```bash
psql -U postgres -d logiforge -f sql/schema.sql
```

Seed synthetic demo data:

```bash
npm run seed
```

Start:

```bash
npm run dev
```

Health:

`GET http://localhost:5000/api/health`

## Demo login

Email:

`planner@logiforge.demo`

Password:

`Demo@12345`

## API groups

- `/api/auth`
- `/api/dashboard`
- `/api/locations`
- `/api/items`
- `/api/inventory`
- `/api/consumption`
- `/api/requests`
- `/api/transport`
- `/api/alerts`
- `/api/forecast`
- `/api/scenarios`
- `/api/optimization`
- `/api/assistant`

## Production

Use environment variables for:

- DATABASE_URL
- JWT_SECRET
- FRONTEND_URL
- ML_SERVICE_URL
- OPTIMIZATION_SERVICE_URL

Do not commit `.env`.

The system uses synthetic/demo logistics data only and is intended for decision-support prototyping.