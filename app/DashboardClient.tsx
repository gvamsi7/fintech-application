"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Tab = "Home" | "Pay" | "Trade" | "Wealth" | "Profile";
type Side = "BUY" | "SELL";
type Quote = { symbol: string; name: string; exchange: string; price: number; change: number };
type PaperOrder = { id: number; symbol: string; side: Side; qty: number; price: number; time: string };

const STARTING_CASH = 1000000;
const seedQuotes: Quote[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", exchange: "NSE", price: 2948.25, change: 1.34 },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE", price: 4218.80, change: -0.42 },
  { symbol: "HDFCBANK", name: "HDFC Bank", exchange: "NSE", price: 1784.10, change: 0.86 },
  { symbol: "NIFTY 50", name: "NSE Index", exchange: "NSE", price: 25384.15, change: 0.61 },
  { symbol: "GOLD", name: "MCX Gold", exchange: "MCX", price: 112470, change: 0.28 }
];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

function Spark({ up }: { up: boolean }) {
  const points = up
    ? "0,29 14,22 28,25 42,14 56,18 70,8 84,13 98,5 120,9"
    : "0,8 14,11 28,9 42,18 56,14 70,24 84,21 98,30 120,27";
  return (
    <svg className={"spark " + (up ? "up" : "down")} viewBox="0 0 120 36" aria-hidden="true">
      <polyline points={points} />
    </svg>
  );
}

function Home({ quotes, onNavigate }: { quotes: Quote[]; onNavigate: (tab: Tab) => void }) {
  return (
    <>
      <div className="pageHead">
        <div>
          <p className="eyebrow">FINORBIT</p>
          <h1>Good evening, Vamshi.</h1>
          <span>Your money, payments and markets in one place.</span>
        </div>
        <button className="primary" onClick={() => onNavigate("Pay")}>+ Add money</button>
      </div>

      <div className="heroGrid">
        <article className="card dark">
          <span className="label">Total net worth</span>
          <h2>{inr.format(486250)}</h2>
          <div className="gain">↑ ₹8,420 this month</div>
          <div className="split">
            <div><small>Bank balance</small><b>₹1,28,450</b></div>
            <div><small>Investments</small><b>₹3,57,800</b></div>
          </div>
        </article>

        <article className="card">
          <div className="rowTitle"><span>September budget</span><b>75%</b></div>
          <h2>₹48,620</h2>
          <p className="muted">Spent of ₹65,000</p>
          <div className="progress"><i style={{ width: "75%" }} /></div>
          <div className="chips"><span>Food ₹12.4k</span><span>Shopping ₹9.8k</span><span>Bills ₹8.1k</span></div>
        </article>

        <article className="card">
          <div className="rowTitle"><span>Portfolio</span><button onClick={() => onNavigate("Trade")}>Trade →</button></div>
          <h2>₹3,57,800</h2>
          <div className="gain">+₹2,164 today · +0.61%</div>
          <Spark up />
          <div className="index"><span>NIFTY 50</span><b>{quotes[3].price.toFixed(2)}</b><em>+{quotes[3].change.toFixed(2)}%</em></div>
        </article>
      </div>

      <h3 className="sectionTitle">Quick actions</h3>
      <div className="quickGrid">
        {[
          ["▦", "Scan & Pay", "UPI QR", "Pay"],
          ["₹", "Send money", "UPI / bank", "Pay"],
          ["↙", "Receive", "Your QR", "Pay"],
          ["↗", "Trade", "Stocks & ETFs", "Trade"],
          ["◎", "Invest", "Mutual funds", "Wealth"],
          ["▤", "Bills", "Recharge & pay", "Pay"]
        ].map((item) => (
          <button className="quick" key={item[1]} onClick={() => onNavigate(item[3] as Tab)}>
            <i>{item[0]}</i><b>{item[1]}</b><small>{item[2]}</small>
          </button>
        ))}
      </div>

      <div className="twoCol">
        <article className="card">
          <div className="rowTitle"><div><b>Recent activity</b><p className="muted">Latest transactions</p></div><button>See all</button></div>
          {[
            ["S", "Swiggy", "Food · Today", "− ₹428"],
            ["₹", "Salary", "Income · 17 Sep", "+ ₹89,750"],
            ["A", "Amazon", "Shopping · 16 Sep", "− ₹2,199"],
            ["N", "Nifty 50 SIP", "Investment · 15 Sep", "− ₹5,000"]
          ].map((x) => (
            <div className="activity" key={x[1]}>
              <i>{x[0]}</i><div><b>{x[1]}</b><small>{x[2]}</small></div>
              <strong className={x[3].startsWith("+") ? "gain" : ""}>{x[3]}</strong>
            </div>
          ))}
        </article>

        <article className="card">
          <div className="rowTitle"><div><b>Savings pots</b><p className="muted">Goals you are building</p></div><button>+ New</button></div>
          {[
            ["Emergency fund", "₹52,000", "₹1,00,000", 52],
            ["New bike", "₹84,000", "₹2,00,000", 42],
            ["Travel", "₹18,500", "₹60,000", 31]
          ].map((g) => (
            <div className="goal" key={g[0]}>
              <div><b>{g[0]}</b><span>{g[1]} <small>of {g[2]}</small></span></div>
              <div className="progress"><i style={{ width: g[3] + "%" }} /></div>
            </div>
          ))}
        </article>
      </div>
    </>
  );
}

function Trade({ quotes, setQuotes }: { quotes: Quote[]; setQuotes: React.Dispatch<React.SetStateAction<Quote[]>> }) {
  const [selected, setSelected] = useState("RELIANCE");
  const [side, setSide] = useState<Side>("BUY");
  const [qty, setQty] = useState(1);
  const [cash, setCash] = useState(STARTING_CASH);
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQuotes((current) => current.map((q) => {
        const drift = (Math.random() - 0.49) * Math.max(q.price * 0.00045, 0.25);
        return { ...q, price: Math.max(1, q.price + drift), change: q.change + (Math.random() - 0.5) * 0.03 };
      }));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [setQuotes]);

  const quote = useMemo(() => quotes.find((q) => q.symbol === selected) || quotes[0], [quotes, selected]);
  const estimate = quote.price * Math.max(1, qty);

  function placeOrder() {
    const safeQty = Math.max(1, qty);
    if (side === "BUY" && estimate > cash) {
      setToast("Insufficient paper funds");
      window.setTimeout(() => setToast(""), 2400);
      return;
    }
    const order: PaperOrder = {
      id: Date.now(), symbol: quote.symbol, side, qty: safeQty, price: quote.price,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    };
    setCash((value) => side === "BUY" ? value - estimate : value + estimate);
    setOrders((value) => [order, ...value].slice(0, 8));
    setToast(side + " " + safeQty + " " + quote.symbol + " completed in paper mode");
    window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <>
      {toast && <div className="toast">✓ {toast}</div>}
      <div className="pageHead tradeHead">
        <div><p className="eyebrow orange">PAPER TRADING</p><h1>Markets</h1><span>Streaming demo prices. Connect a supported broker for live executable trading.</span></div>
        <div className="funds"><small>Available paper funds</small><b>{inr.format(cash)}</b></div>
      </div>

      <div className="ticker">
        {quotes.slice(0, 4).map((q) => (
          <button key={q.symbol} className={selected === q.symbol ? "selected" : ""} onClick={() => setSelected(q.symbol)}>
            <span>{q.symbol}</span><b>{q.price.toFixed(2)}</b>
            <em className={q.change >= 0 ? "gain" : "loss"}>{q.change >= 0 ? "+" : ""}{q.change.toFixed(2)}%</em>
          </button>
        ))}
      </div>

      <div className="tradeGrid">
        <article className="card watch">
          <div className="rowTitle"><div><b>Watchlist</b><p className="muted">Demo stream</p></div><span className="live">● LIVE</span></div>
          {quotes.map((q) => (
            <button className={"quote " + (selected === q.symbol ? "active" : "")} key={q.symbol} onClick={() => setSelected(q.symbol)}>
              <div><b>{q.symbol}</b><small>{q.name}</small></div>
              <Spark up={q.change >= 0} />
              <div className="quotePrice"><b>{q.price.toFixed(2)}</b><small className={q.change >= 0 ? "gain" : "loss"}>{q.change >= 0 ? "+" : ""}{q.change.toFixed(2)}%</small></div>
            </button>
          ))}
        </article>

        <article className="card chartCard">
          <div className="instrument">
            <div><p>{quote.name} · {quote.exchange}</p><h2>{quote.symbol}</h2></div>
            <div><h2>₹{quote.price.toFixed(2)}</h2><span className={quote.change >= 0 ? "gain" : "loss"}>{quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)}%</span></div>
          </div>
          <div className="chart">
            <svg viewBox="0 0 720 280" preserveAspectRatio="none" aria-label="Demo price chart">
              <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".18"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
              <path className="area" d="M0 225 C45 200,55 215,90 187 S145 205,180 165 S230 176,270 133 S332 160,370 115 S430 134,470 93 S530 115,565 70 S625 87,660 48 S700 58,720 35 L720 280 L0 280 Z"/>
              <path className="line" d="M0 225 C45 200,55 215,90 187 S145 205,180 165 S230 176,270 133 S332 160,370 115 S430 134,470 93 S530 115,565 70 S625 87,660 48 S700 58,720 35"/>
            </svg>
          </div>
          <div className="timeframes"><button>1D</button><button>1W</button><button className="active">1M</button><button>3M</button><button>1Y</button><button>5Y</button></div>
          <div className="stats">
            <span>Open<b>{(quote.price * .994).toFixed(2)}</b></span>
            <span>High<b>{(quote.price * 1.012).toFixed(2)}</b></span>
            <span>Low<b>{(quote.price * .988).toFixed(2)}</b></span>
            <span>Volume<b>12.8M</b></span>
          </div>
        </article>

        <article className="card order">
          <div className="rowTitle"><div><b>Order ticket</b><p className="muted">{quote.symbol} · {quote.exchange}</p></div><span className="paper">PAPER</span></div>
          <div className="sideToggle">
            <button className={side === "BUY" ? "buyOn" : ""} onClick={() => setSide("BUY")}>BUY</button>
            <button className={side === "SELL" ? "sellOn" : ""} onClick={() => setSide("SELL")}>SELL</button>
          </div>
          <label>Order type<select><option>Market</option><option>Limit</option><option>Stop Loss</option></select></label>
          <label>Quantity<div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))}>−</button><input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} /><button onClick={() => setQty(qty + 1)}>+</button></div></label>
          <div className="estimate"><span>Estimated value</span><b>{inr.format(estimate)}</b></div>
          <button className={"place " + (side === "BUY" ? "buy" : "sell")} onClick={placeOrder}>{side} {quote.symbol}</button>
          <small className="fine">Paper mode only. No exchange order is sent until a regulated broker adapter and server-side credentials are configured.</small>
        </article>
      </div>

      <article className="card orders">
        <div className="rowTitle"><div><b>Paper orders</b><p className="muted">Most recent simulated fills</p></div></div>
        {orders.length === 0 ? <div className="empty">Place a paper order to see it here.</div> : orders.map((o) => (
          <div className="orderRow" key={o.id}>
            <span className={o.side === "BUY" ? "buyTag" : "sellTag"}>{o.side}</span>
            <b>{o.symbol}</b><span>{o.qty} qty</span><span>₹{o.price.toFixed(2)}</span><small>{o.time}</small><em>COMPLETE</em>
          </div>
        ))}
      </article>
    </>
  );
}

function SimpleView({ tab }: { tab: Exclude<Tab, "Home" | "Trade"> }) {
  const cards = tab === "Pay"
    ? [["Scan & Pay", "Pay any UPI QR"], ["Send money", "UPI ID, phone or bank"], ["Receive", "Share your payment QR"], ["Bills", "Recharge and utilities"]]
    : tab === "Wealth"
    ? [["Mutual funds", "Track SIPs and funds"], ["ETFs", "Long-term market investing"], ["Goals", "Connect investments to goals"], ["Portfolio", "Unified performance view"]]
    : [["Accounts", "Linked banks and brokers"], ["Security", "PIN, MFA and devices"], ["KYC", "Identity and verification"], ["Preferences", "Notifications and privacy"]];
  return (
    <>
      <div className="pageHead"><div><p className="eyebrow">{tab.toUpperCase()}</p><h1>{tab}</h1><span>Designed as a production integration surface for the FinOrbit platform.</span></div></div>
      <div className="simpleGrid">{cards.map((c, i) => <article className="card simple" key={c[0]}><i>{["◫","↗","◎","⚙"][i]}</i><h3>{c[0]}</h3><p>{c[1]}</p>{tab === "Profile" && c[0] === "KYC" ? <a href="/kyc">Start KYC →</a> : <button>Open →</button>}</article>)}</div>
    </>
  );
}

export default function DashboardClient({ initialTab = "Home" }: { initialTab?: Tab }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [quotes, setQuotes] = useState(seedQuotes);
  const tabs: Tab[] = ["Home", "Pay", "Trade", "Wealth", "Profile"];

  useEffect(() => {
    const routeTab: Record<string, Tab> = {
      "/": "Home",
      "/pay": "Pay",
      "/trade": "Trade",
      "/wealth": "Wealth",
      "/profile": "Profile"
    };
    const next = routeTab[pathname];
    if (next) setTab(next);
  }, [pathname]);

  function navigate(next: Tab) {
    setTab(next);
    router.push(next === "Home" ? "/" : "/" + next.toLowerCase());
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="logo">F</div><div><b>FinOrbit</b><small>Money, in one orbit.</small></div></div>
        <div className="topActions"><span className="marketStatus"><i /> Markets live</span><button className="avatar">VK</button></div>
      </header>

      <section className="content">
        {tab === "Home" && <Home quotes={quotes} onNavigate={navigate} />}
        {tab === "Trade" && <Trade quotes={quotes} setQuotes={setQuotes} />}
        {tab !== "Home" && tab !== "Trade" && <SimpleView tab={tab} />}
      </section>

      <nav className="bottomNav" aria-label="Primary">
        {tabs.map((name) => (
          <button key={name} className={tab === name ? "active" : ""} onClick={() => navigate(name)}>
            <span>{name === "Home" ? "⌂" : name === "Pay" ? "₹" : name === "Trade" ? "↗" : name === "Wealth" ? "◇" : "○"}</span>{name}
          </button>
        ))}
      </nav>
    </main>
  );
}
