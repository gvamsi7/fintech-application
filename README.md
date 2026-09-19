# FinOrbit

An original India-focused fintech starter that combines personal money management, payments, wealth tracking and a broker-ready trading experience.

## Current MVP

- Responsive Home dashboard with net worth, monthly budget, activity and savings pots
- Pay, Wealth and Profile integration surfaces
- Trade terminal with watchlist, streaming demo quotes and interactive instrument selection
- Buy/Sell paper order ticket with quantity and order type controls
- ₹10,00,000 paper account with simulated fills and recent order history
- Mobile bottom navigation and responsive layouts
- Server-side broker adapter contract in `lib/trading.ts`
- Environment template for live broker integration

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Trading modes

The committed starter defaults conceptually to **paper trading**. The prices on the Trade screen are a simulated browser stream; they are not exchange quotes and no real order is sent.

For live trading, implement a regulated broker adapter on the server and configure credentials through environment variables. Do not expose broker API secrets or access tokens in client-side code.

```bash
cp .env.example .env.local
```

The intended architecture is:

```text
Web / Mobile UI
      |
FinOrbit server
      |
Broker adapter (Zerodha / supported broker)
      |
Market WebSocket + order APIs
```

## Next production milestones

1. Authentication, database and encrypted broker-token storage
2. Zerodha/supported broker OAuth login
3. Live WebSocket market-data gateway
4. Holdings, positions, funds and order synchronization
5. UPI/payment provider integration
6. KYC and compliance workflows
7. Audit logs, MFA, device/session controls and observability

FinOrbit uses original branding and UI. It is not affiliated with Jupiter.
