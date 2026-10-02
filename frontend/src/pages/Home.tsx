import { ArrowRight, BarChart3, BrainCircuit, ChevronRight, Database, Map, Shield, Sparkles, Truck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../components/ThemeProvider";

export default function Home(){
  const nav=useNavigate(); const {theme,toggleTheme}=useTheme();
  const features=[
    [BrainCircuit,"PREDICT","Demand forecasting","See future consumption before supply pressure becomes a problem."],
    [Database,"DETECT","Risk intelligence","Track inventory health, days of supply and shortage signals."],
    [Zap,"OPTIMIZE","Smart allocation","Evaluate inventory, routes and transport constraints together."],
    [Map,"SIMULATE","Scenario planning","Test disruptions and compare the resulting logistics plan."]
  ];
  return <div className="landing">
    <div className="ambient ambient-a"/><div className="ambient ambient-b"/><div className="grid-bg"/>
    <header className="landing-nav">
      <button className="brand landing-brand" onClick={()=>nav("/")}>
        <span className="brand-mark"><Shield size={20}/></span>
        <span><b>LOGIFORGE</b><small>AI LOGISTICS</small></span>
      </button>
      <div className="landing-actions">
        <button className="theme-toggle" onClick={toggleTheme}><span className="theme-icon">{theme==="dark"?<span>☀</span>:<span>☾</span>}</span>{theme==="dark"?"Light":"Dark"}</button>
        <button className="outline-btn" onClick={()=>nav("/login")}>Sign in</button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="status-pill"><i/> AI-POWERED LOGISTICS DECISION SUPPORT</div>
          <h1>Turn logistics data into <em>better decisions.</em></h1>
          <p className="hero-sub">LOGIFORGE AI brings predictive demand, inventory risk, transport planning, optimization and scenario simulation into one focused command center.</p>
          <div className="hero-buttons">
            <button className="primary-btn" onClick={()=>nav("/login")}>Enter Command Center <ArrowRight size={17}/></button>
            <button className="text-btn" onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Explore system <ChevronRight size={16}/></button>
          </div>
          <div className="trust-row"><span>● Synthetic demo environment</span><span>● Explainable AI</span><span>● Human-in-the-loop</span></div>
        </div>

        <div className="hero-visual">
          <div className="command-window">
            <div className="window-head"><div className="window-dots"><i/><i/><i/></div><span>COMMAND / LIVE DEMO</span><b>● ONLINE</b></div>
            <div className="window-body">
              <div className="mini-kpis">
                <div><small>LOCATIONS</small><b>24</b><span>+4.2%</span></div>
                <div><small>RISK ALERTS</small><b>07</b><span className="warn">2 critical</span></div>
                <div><small>ACTIVE ASSETS</small><b>31</b><span>+6.4%</span></div>
              </div>
              <div className="network">
                <div className="network-label">SYNTHETIC LOGISTICS NETWORK <span>DECISION VIEW</span></div>
                <svg viewBox="0 0 600 300">
                  <path d="M65 92 C160 45 235 142 315 120 S445 60 535 98" className="route cyan"/>
                  <path d="M65 92 C160 160 205 245 325 220 S460 185 535 215" className="route teal"/>
                  <path d="M315 120 C330 165 320 190 325 220" className="route dashed"/>
                </svg>
                {[["A01","node n1"],["D01","node n2"],["A07","node n3"],["A12","node n4"],["D03","node n5"]].map(([x,c])=><div key={x} className={`map-node ${c}`}><i/><span>{x}</span></div>)}
                <div className="map-legend"><span><i className="cyan-dot"/> Depot</span><span><i className="teal-dot"/> Location</span><span><i className="amber-dot"/> Risk</span></div>
              </div>
              <div className="window-bottom"><div><small>FORECAST</small><b>+12.8%</b></div><div><small>STOCK-OUT RISK</small><b className="red">05</b></div><div><small>PLAN STATUS</small><b className="green">READY</b></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="feature-section">
        <div className="section-heading"><span>THE DECISION LOOP</span><h2>One platform. Four intelligence layers.</h2><p>Designed around the workflow: observe → predict → optimize → simulate.</p></div>
        <div className="feature-grid">{features.map(([Icon,kicker,title,text],i)=><div className="feature-card" key={title as string}>
          <div className="feature-num">0{i+1}</div><div className="feature-icon"><Icon size={21}/></div><span className="feature-kicker">{kicker as string}</span><h3>{title as string}</h3><p>{text as string}</p>
        </div>)}</div>
      </section>

      <section className="cta">
        <div><span>LOGIFORGE AI · DEMO ENVIRONMENT</span><h2>Ready to enter the command center?</h2><p>Sign in to access the interactive logistics dashboard.</p></div>
        <button className="primary-btn" onClick={()=>nav("/login")}>Continue <ArrowRight size={17}/></button>
      </section>
    </main>
    <footer><span>© 2026 LOGIFORGE AI</span><span>Predictive Logistics Decision Support System</span></footer>
  </div>
}
