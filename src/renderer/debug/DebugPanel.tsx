import { useState, useRef, useCallback, CSSProperties, useMemo } from "react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany, CompanyState, LaptopModel } from "../state/gameTypes";
import { computeStatsForDesign } from "../../simulation/statCalculation";
import { ALL_STATS, LaptopStat, DemographicId } from "../../data/types";
import { tokens } from "../shell/tokens";

const DEMOGRAPHIC_IDS: DemographicId[] = [
  "corporate", "businessProfessional", "student", "creativeProfessional",
  "gamer", "techEnthusiast", "generalConsumer", "budgetBuyer",
];

const DEMO_SHORT: Record<DemographicId, string> = {
  corporate: "Corp",
  businessProfessional: "BizPro",
  student: "Stud",
  creativeProfessional: "Creative",
  gamer: "Gamer",
  techEnthusiast: "TechEn",
  generalConsumer: "GenCon",
  budgetBuyer: "Budget",
};

const STAT_SHORT: Record<LaptopStat, string> = {
  performance: "Perf",
  gamingPerformance: "Game",
  batteryLife: "Batt",
  display: "Disp",
  connectivity: "Conn",
  speakers: "Spkr",
  webcam: "Wcam",
  design: "Dsgn",
  buildQuality: "Build",
  keyboard: "Keyb",
  trackpad: "Tpad",
  weight: "Wght",
  thinness: "Thin",
  thermals: "Therm",
};

type Tab = "laptops" | "companies" | "simulation";

export function DebugPanel({ onClose }: { onClose: () => void }) {
  const { state } = useGame();
  const [tab, setTab] = useState<Tab>("laptops");
  const [pos, setPos] = useState({ x: 20, y: 60 });
  const [size, setSize] = useState({ w: 720, h: 520 });
  const [collapsed, setCollapsed] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.origX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.origY + (ev.clientY - dragRef.current.startY),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [pos]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      setSize({
        w: Math.max(400, resizeRef.current.origW + (ev.clientX - resizeRef.current.startX)),
        h: Math.max(200, resizeRef.current.origH + (ev.clientY - resizeRef.current.startY)),
      });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [size]);

  const player = getPlayerCompany(state);
  const competitors = state.companies.filter((c) => !c.isPlayer);

  const panelStyle: CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    width: collapsed ? 300 : size.w,
    height: collapsed ? "auto" : size.h,
    background: "rgba(0, 0, 0, 0.92)",
    border: "1px solid rgba(255, 200, 0, 0.5)",
    borderRadius: 8,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    fontFamily: tokens.font.family,
    fontSize: 11,
    color: "#ddd",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
  };

  const titleBarStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 8px",
    background: "rgba(255, 200, 0, 0.15)",
    cursor: "grab",
    userSelect: "none",
    borderBottom: "1px solid rgba(255, 200, 0, 0.3)",
    flexShrink: 0,
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    padding: "3px 8px",
    background: active ? "rgba(255, 200, 0, 0.25)" : "transparent",
    border: "1px solid " + (active ? "rgba(255, 200, 0, 0.5)" : "transparent"),
    borderRadius: 4,
    color: active ? "#ffc800" : "#999",
    cursor: "pointer",
    fontSize: 11,
  });

  const btnStyle: CSSProperties = {
    background: "none",
    border: "none",
    color: "#999",
    cursor: "pointer",
    fontSize: 14,
    padding: "0 4px",
  };

  return (
    <div style={panelStyle}>
      <div style={titleBarStyle} onMouseDown={onDragStart}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "#ffc800", fontWeight: "bold", fontSize: 12 }}>DEBUG</span>
          <span style={{ color: "#888", fontSize: 10 }}>Y{state.year} Q{state.quarter} | ${(state.cash / 1e6).toFixed(1)}M</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {!collapsed && (
            <>
              <button style={tabStyle(tab === "laptops")} onClick={() => setTab("laptops")}>Laptops</button>
              <button style={tabStyle(tab === "companies")} onClick={() => setTab("companies")}>Companies</button>
              <button style={tabStyle(tab === "simulation")} onClick={() => setTab("simulation")}>Simulation</button>
            </>
          )}
          <button style={btnStyle} onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "\u25b6" : "\u25bc"}
          </button>
          <button style={btnStyle} onClick={onClose} title="Close">\u2715</button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div style={{ flex: 1, overflow: "auto", padding: 6 }}>
            {tab === "laptops" && <LaptopsTab player={player} competitors={competitors} year={state.year} />}
            {tab === "companies" && <CompaniesTab player={player} competitors={competitors} />}
            {tab === "simulation" && <SimulationTab />}
          </div>
          <div
            onMouseDown={onResizeStart}
            style={{
              position: "absolute", right: 0, bottom: 0, width: 16, height: 16,
              cursor: "nwse-resize", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#555", fontSize: 10, userSelect: "none",
            }}
          >
            \u25e2
          </div>
        </>
      )}
    </div>
  );
}

// ---- Tabs ----

function LaptopsTab({ player, competitors, year }: { player: CompanyState; competitors: CompanyState[]; year: number }) {
  const [expandedCompany, setExpandedCompany] = useState<string | null>("player");

  const allCompanies = [player, ...competitors];

  return (
    <div>
      {allCompanies.map((company) => {
        const activeModels = company.models.filter((m) => m.status === "manufacturing" || m.status === "onSale");
        if (activeModels.length === 0 && !company.isPlayer) return null;
        const isExpanded = expandedCompany === company.id;
        return (
          <div key={company.id} style={{ marginBottom: 4 }}>
            <div
              onClick={() => setExpandedCompany(isExpanded ? null : company.id)}
              style={{
                cursor: "pointer", padding: "3px 6px",
                background: company.isPlayer ? "rgba(79, 195, 247, 0.1)" : "rgba(255,255,255,0.03)",
                borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <span style={{ color: company.isPlayer ? tokens.colors.accent : "#ccc", fontWeight: company.isPlayer ? "bold" : "normal" }}>
                {company.name} ({activeModels.length} active)
              </span>
              <span style={{ color: "#666", fontSize: 10 }}>{isExpanded ? "\u25bc" : "\u25b6"}</span>
            </div>
            {isExpanded && activeModels.map((model) => (
              <LaptopStatsRow key={model.design.id} model={model} year={year} companyName={company.name} />
            ))}
            {isExpanded && activeModels.length === 0 && (
              <div style={{ padding: "4px 12px", color: "#666", fontStyle: "italic" }}>No active models</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LaptopStatsRow({ model, year, companyName }: { model: LaptopModel; year: number; companyName: string }) {
  const stats = useMemo(() => computeStatsForDesign(model.design, year), [model.design, year]);

  const cellStyle: CSSProperties = { padding: "1px 4px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.05)" };
  const headerCell: CSSProperties = { ...cellStyle, textAlign: "left", color: "#aaa" };

  return (
    <div style={{ margin: "2px 0 4px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 4, padding: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ color: "#eee", fontWeight: "bold" }}>{companyName} {model.design.name}</span>
        <span style={{ color: "#888" }}>
          {model.status} | ${model.retailPrice?.toLocaleString() ?? "?"} | {model.design.screenSize}" |
          Stock: {model.unitsInStock.toLocaleString()} |
          Cost: ${model.design.unitCost.toLocaleString()}
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead>
          <tr>
            {ALL_STATS.map((s) => (
              <th key={s} style={{ ...headerCell, fontSize: 9, fontWeight: "normal" }}>{STAT_SHORT[s]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {ALL_STATS.map((s) => (
              <td key={s} style={cellStyle}>{stats[s] ?? 0}</td>
            ))}
          </tr>
        </tbody>
      </table>
      {model.manufacturingPlan?.results && (
        <div style={{ color: "#888", fontSize: 10, marginTop: 2 }}>
          Sold: {model.manufacturingPlan.results.unitsSold.toLocaleString()} |
          Rev: ${(model.manufacturingPlan.results.revenue / 1e6).toFixed(2)}M |
          Profit: ${(model.manufacturingPlan.results.profit / 1e6).toFixed(2)}M |
          Campaign mod: {(model.manufacturingPlan.results.campaignPerceptionMod * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function CompaniesTab({ player, competitors }: { player: CompanyState; competitors: CompanyState[] }) {
  const allCompanies = [player, ...competitors];

  const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 10 };
  const thStyle: CSSProperties = { padding: "2px 4px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#aaa", fontSize: 9, fontWeight: "normal" };
  const tdStyle: CSSProperties = { padding: "2px 4px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)" };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4 }}>Brand Reach (%)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Company</th>
                {DEMOGRAPHIC_IDS.map((d) => <th key={d} style={{ ...thStyle, textAlign: "right" }}>{DEMO_SHORT[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {allCompanies.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...tdStyle, textAlign: "left", color: c.isPlayer ? tokens.colors.accent : "#ccc", fontWeight: c.isPlayer ? "bold" : "normal" }}>
                    {c.name}
                  </td>
                  {DEMOGRAPHIC_IDS.map((d) => (
                    <td key={d} style={{ ...tdStyle, color: reachColor(c.brandReach[d]) }}>
                      {c.brandReach[d].toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4 }}>Brand Perception (-50 to +50)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Company</th>
                {DEMOGRAPHIC_IDS.map((d) => <th key={d} style={{ ...thStyle, textAlign: "right" }}>{DEMO_SHORT[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {allCompanies.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...tdStyle, textAlign: "left", color: c.isPlayer ? tokens.colors.accent : "#ccc", fontWeight: c.isPlayer ? "bold" : "normal" }}>
                    {c.name}
                  </td>
                  {DEMOGRAPHIC_IDS.map((d) => (
                    <td key={d} style={{ ...tdStyle, color: perceptionColor(c.brandPerception[d]) }}>
                      {c.brandPerception[d].toFixed(1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SimulationTab() {
  const { state } = useGame();
  const lastSim = state.lastSimulationResult;

  if (!lastSim) {
    return <div style={{ color: "#888", padding: 8 }}>No simulation results yet. Advance a quarter to see data.</div>;
  }

  const cellStyle: CSSProperties = { padding: "2px 4px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 10 };
  const thStyle: CSSProperties = { padding: "2px 4px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#aaa", fontSize: 9, fontWeight: "normal" };

  return (
    <div>
      <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4 }}>
        Last Simulation: Y{lastSim.year} Q{lastSim.quarter}
      </div>
      <div style={{ color: "#aaa", marginBottom: 8, fontSize: 10 }}>
        Revenue: ${(lastSim.totalRevenue / 1e6).toFixed(2)}M |
        Profit: ${(lastSim.totalProfit / 1e6).toFixed(2)}M |
        Cash: ${(lastSim.cashAfterResolution / 1e6).toFixed(2)}M
      </div>

      {lastSim.perceptionChanges.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: "#ccc", fontWeight: "bold", marginBottom: 2, fontSize: 10 }}>Perception Changes</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Demo</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Old</th>
                <th style={{ ...thStyle, textAlign: "right" }}>New</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {lastSim.perceptionChanges.map((pc) => (
                <tr key={pc.demographicId}>
                  <td style={{ ...cellStyle, textAlign: "left" }}>{DEMO_SHORT[pc.demographicId]}</td>
                  <td style={cellStyle}>{pc.oldPerception.toFixed(2)}</td>
                  <td style={cellStyle}>{pc.newPerception.toFixed(2)}</td>
                  <td style={{ ...cellStyle, color: pc.delta >= 0 ? "#6b6" : "#f66" }}>
                    {pc.delta >= 0 ? "+" : ""}{pc.delta.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <div style={{ color: "#ccc", fontWeight: "bold", marginBottom: 2, fontSize: 10 }}>All Laptop Results (this quarter)</div>
        {lastSim.laptopResults.map((lr) => (
          <LaptopResultRow key={lr.laptopId} result={lr} companies={[]} />
        ))}
      </div>
    </div>
  );
}

function LaptopResultRow({ result }: { result: { laptopId: string; owner: string; retailPrice: number; unitsDemanded: number; unitsSold: number; unsoldUnits: number; revenue: number; profit: number; campaignPerceptionMod: number; demographicBreakdown: { demographicId: DemographicId; marketShare: number; unitsDemanded: number; rawVP: number; totalPool: number; weightedStatScore: number; screenPenalty: number; perceptionMod: number }[] }; companies: CompanyState[] }) {
  const [expanded, setExpanded] = useState(false);

  const cellStyle: CSSProperties = { padding: "1px 4px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: 10 };
  const thStyle: CSSProperties = { padding: "1px 4px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#aaa", fontSize: 9, fontWeight: "normal" };

  return (
    <div style={{ marginBottom: 4, background: "rgba(255,255,255,0.02)", borderRadius: 4, padding: 4 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span style={{ color: result.owner === "player" ? tokens.colors.accent : "#ccc" }}>
          {result.owner} / {result.laptopId.slice(0, 8)}
        </span>
        <span style={{ color: "#888", fontSize: 10 }}>
          Sold: {result.unitsSold.toLocaleString()} / {result.unitsDemanded.toLocaleString()} |
          ${result.retailPrice.toLocaleString()} |
          Profit: ${(result.profit / 1e6).toFixed(2)}M
          {expanded ? " \u25bc" : " \u25b6"}
        </span>
      </div>
      {expanded && (
        <div style={{ marginTop: 4, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}>Demo</th>
                <th style={thStyle}>Pool</th>
                <th style={thStyle}>Demand</th>
                <th style={thStyle}>Share%</th>
                <th style={thStyle}>StatScore</th>
                <th style={thStyle}>ScrPen</th>
                <th style={thStyle}>RawVP</th>
                <th style={thStyle}>PercMod%</th>
              </tr>
            </thead>
            <tbody>
              {result.demographicBreakdown.map((db) => (
                <tr key={db.demographicId}>
                  <td style={{ ...cellStyle, textAlign: "left" }}>{DEMO_SHORT[db.demographicId]}</td>
                  <td style={cellStyle}>{db.totalPool.toLocaleString()}</td>
                  <td style={cellStyle}>{Math.round(db.unitsDemanded).toLocaleString()}</td>
                  <td style={cellStyle}>{(db.marketShare * 100).toFixed(1)}</td>
                  <td style={cellStyle}>{db.weightedStatScore.toFixed(3)}</td>
                  <td style={cellStyle}>{db.screenPenalty.toFixed(2)}</td>
                  <td style={cellStyle}>{db.rawVP.toFixed(6)}</td>
                  <td style={{ ...cellStyle, color: db.perceptionMod >= 0 ? "#6b6" : "#f66" }}>
                    {(db.perceptionMod * 100).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Helpers ----

function reachColor(reach: number): string {
  if (reach >= 50) return "#6b6";
  if (reach >= 20) return "#cc6";
  return "#888";
}

function perceptionColor(perception: number): string {
  if (perception >= 10) return "#6b6";
  if (perception >= 0) return "#cc6";
  if (perception >= -10) return "#f96";
  return "#f66";
}
