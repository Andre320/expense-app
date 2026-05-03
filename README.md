# Ledger — expense app

Local-first expense and forecast UI (Next.js App Router, Prisma + SQLite, TanStack Query/Table, Recharts). Data stays on device.

## Setup

```bash
npm install
npx prisma migrate dev
npm run db:seed   # optional sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Configure currencies and forecast inputs under **Settings**.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- Repo agent notes: [`AGENTS.md`](./AGENTS.md)
