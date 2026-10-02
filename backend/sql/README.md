# LOGIFORGE AI Database

## Local PostgreSQL

Create the database:

```sql
CREATE DATABASE logiforge;
```

Then run:

```bash
psql -U postgres -d logiforge -f sql/schema.sql
```

Seed:

```bash
npm run seed
```

Demo credentials:

- planner@logiforge.demo
- Demo@12345

All coordinates and logistics records are synthetic demo data.