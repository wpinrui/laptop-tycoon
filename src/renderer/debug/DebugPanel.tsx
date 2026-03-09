import { useState, useRef, useCallback, CSSProperties, useMemo } from "react";
import { useGame } from "../state/GameContext";
import { getPlayerCompany, CompanyState, LaptopModel } from "../state/gameTypes";
import { computeStatsForDesign } from "../../simulation/statCalculation";
import { ALL_STATS, LaptopStat, DemographicId, StatVector } from "../../data/types";
import { DEMOGRAPHICS } from "../../data/demographics";
import { STARTING_DEMAND_POOL } from "../../data/startingDemand";
import { getDemandPoolSize, getScreenSizeFit } from "../../simulation/demographicData";
import { PRICE_SENSITIVITY_EXPONENT, REPLACEMENT_CYCLE, QUARTER_SHARES, QUARTER_SHARES_SUM, DEMAND_NOISE_MIN, DEMAND_NOISE_MAX } from "../../simulation/tunables";
import { tokens } from "../shell/tokens";

const DEMOGRAPHIC_IDS = DEMOGRAPHICS.map((d) => d.id);

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
            {collapsed ? ">" : "v"}
          </button>
          <button style={btnStyle} onClick={onClose} title="Close">x</button>
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
            //
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
              <span style={{ color: "#666", fontSize: 10 }}>{isExpanded ? "v" : ">"}</span>
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

function BrandTable({ title, companies, getValue, colorFn }: {
  title: string;
  companies: CompanyState[];
  getValue: (company: CompanyState, demo: DemographicId) => number;
  colorFn: (value: number) => string;
}) {
  const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 10 };
  const thStyle: CSSProperties = { padding: "2px 4px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#aaa", fontSize: 9, fontWeight: "normal" };
  const tdStyle: CSSProperties = { padding: "2px 4px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.03)" };

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4 }}>{title}</div>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Company</th>
              {DEMOGRAPHIC_IDS.map((d) => <th key={d} style={{ ...thStyle, textAlign: "right" }}>{DEMO_SHORT[d]}</th>)}
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td style={{ ...tdStyle, textAlign: "left", color: c.isPlayer ? tokens.colors.accent : "#ccc", fontWeight: c.isPlayer ? "bold" : "normal" }}>
                  {c.name}
                </td>
                {DEMOGRAPHIC_IDS.map((d) => {
                  const val = getValue(c, d);
                  return (
                    <td key={d} style={{ ...tdStyle, color: colorFn(val) }}>
                      {val.toFixed(1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompaniesTab({ player, competitors }: { player: CompanyState; competitors: CompanyState[] }) {
  const allCompanies = [player, ...competitors];

  return (
    <div>
      <BrandTable
        title="Brand Reach (%)"
        companies={allCompanies}
        getValue={(c, d) => c.brandReach[d]}
        colorFn={reachColor}
      />
      <BrandTable
        title="Brand Perception (-50 to +50)"
        companies={allCompanies}
        getValue={(c, d) => c.brandPerception[d]}
        colorFn={perceptionColor}
      />
    </div>
  );
}

// --- Step-by-step formula types ---

interface MarketEntry {
  id: string;
  owner: string;
  companyName: string;
  modelName: string;
  stats: StatVector;
  retailPrice: number;
  screenSize: number;
  isPlayer: boolean;
}

interface VPComputeContext {
  maxStats: Record<LaptopStat, number>;
  demographic: (typeof DEMOGRAPHICS)[number];
  selectedDemo: DemographicId;
  companies: CompanyState[];
}

function computeVPForLaptop(laptop: MarketEntry, ctx: VPComputeContext) {
  const { maxStats, demographic, selectedDemo, companies } = ctx;

  const normalised = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) {
    normalised[stat] = maxStats[stat] > 0 ? (laptop.stats[stat] ?? 0) / maxStats[stat] : 0;
  }

  let weightedStatScore = 0;
  const weightedPerStat = {} as Record<LaptopStat, number>;
  for (const stat of ALL_STATS) {
    const w = normalised[stat] * (demographic.statWeights[stat] ?? 0);
    weightedPerStat[stat] = w;
    weightedStatScore += w;
  }

  const pref = demographic.screenSizePreference;
  const screenPenalty = getScreenSizeFit(laptop.screenSize, pref.preferredMin, pref.preferredMax, pref.penaltyPerInch);
  const exponent = PRICE_SENSITIVITY_EXPONENT[demographic.priceSensitivity];
  const priceComponent = Math.pow(laptop.retailPrice, exponent);
  const rawVP = (weightedStatScore * screenPenalty) / priceComponent;

  const company = companies.find((c) => c.id === laptop.owner);
  const brandPerception = company ? (company.brandPerception[selectedDemo] ?? 0) : 0;
  const campaignPerception = 0; // Can't know sampled value; show 0 as baseline
  const perceptionMod = ((1 + brandPerception / 100) * (1 + campaignPerception / 100) - 1) * 100;
  const biasedVP = Math.max(0, rawVP * (1 + perceptionMod / 100));

  const reach = company ? Math.min(company.brandReach[selectedDemo] ?? 0, 100) : 0;
  const effectiveVP = biasedVP * (reach / 100);

  return {
    laptop, normalised, weightedPerStat, weightedStatScore,
    screenPenalty, exponent, priceComponent, rawVP,
    brandPerception, campaignPerception, perceptionMod,
    biasedVP, reach, effectiveVP,
  };
}

const STEPS = [
  "1. Raw Stats",
  "2. Normalised Stats (0-1)",
  "3. Demographic Weights",
  "4. Weighted Stat Score",
  "5. Screen Size Penalty",
  "6. Raw Value Proposition",
  "7. Brand Perception",
  "8. Biased VP",
  "9. Brand Reach",
  "10. Effective VP",
  "11. Market Share",
  "12. Demand Allocation",
] as const;

function SimulationTab() {
  const { state } = useGame();
  const [selectedDemo, setSelectedDemo] = useState<DemographicId>("generalConsumer");
  const [selectedLaptops, setSelectedLaptops] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  // Build market entries from all companies (debug: show all active models, not just current-year)
  const marketEntries = useMemo(() => {
    const entries: MarketEntry[] = [];
    for (const company of state.companies) {
      for (const model of company.models) {
        if (model.status !== "manufacturing" && model.status !== "onSale") continue;
        if (!model.retailPrice) continue;
        entries.push({
          id: model.design.id,
          owner: company.id,
          companyName: company.name,
          modelName: model.design.name,
          stats: computeStatsForDesign(model.design, state.year),
          retailPrice: model.retailPrice,
          screenSize: model.design.screenSize,
          isPlayer: company.isPlayer,
        });
      }
    }
    return entries;
  }, [state]);

  // Auto-select all laptops if none selected
  const activeLaptops = selectedLaptops.size > 0
    ? marketEntries.filter((e) => selectedLaptops.has(e.id))
    : marketEntries;

  const toggleLaptop = (id: string) => {
    setSelectedLaptops((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const demographic = DEMOGRAPHICS.find((d) => d.id === selectedDemo)!;

  // Shared normalisation base: max stats across ALL market laptops
  const maxStats = useMemo(() => {
    const result = {} as Record<LaptopStat, number>;
    for (const stat of ALL_STATS) {
      result[stat] = Math.max(...marketEntries.map((e) => e.stats[stat] ?? 0));
    }
    return result;
  }, [marketEntries]);

  const vpContext: VPComputeContext = useMemo(
    () => ({ maxStats, demographic, selectedDemo, companies: state.companies }),
    [maxStats, demographic, selectedDemo, state.companies],
  );

  // --- Compute all intermediate values ---
  const computed = useMemo(
    () => activeLaptops.map((l) => computeVPForLaptop(l, vpContext)),
    [activeLaptops, vpContext],
  );

  // Step 11: Market share (needs sum of ALL market laptops, not just selected)
  const allComputed = useMemo(
    () => marketEntries.map((laptop) => {
      const { effectiveVP } = computeVPForLaptop(laptop, vpContext);
      return { id: laptop.id, effectiveVP };
    }),
    [marketEntries, vpContext],
  );

  const totalEffectiveVP = allComputed.reduce((s, c) => s + c.effectiveVP, 0);

  // Step 12: Demand pool
  const basePool = STARTING_DEMAND_POOL[selectedDemo];
  const demPopulation = getDemandPoolSize(selectedDemo, state.year, basePool);
  const annualBuyers = demPopulation / REPLACEMENT_CYCLE[selectedDemo];
  const quarterShare = QUARTER_SHARES[state.quarter - 1] / QUARTER_SHARES_SUM;
  const quarterlyBuyers = annualBuyers * quarterShare;

  const selectStyle: CSSProperties = {
    background: "#222", color: "#ddd", border: "1px solid #555", borderRadius: 4,
    padding: "2px 6px", fontSize: 11,
  };
  const stepBtnStyle = (active: boolean): CSSProperties => ({
    padding: "2px 6px", fontSize: 10, cursor: "pointer",
    background: active ? "rgba(255, 200, 0, 0.2)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(255, 200, 0, 0.4)" : "1px solid #333",
    borderRadius: 3, color: active ? "#ffc800" : "#aaa", whiteSpace: "nowrap",
  });
  const labelS: CSSProperties = { color: "#888", fontSize: 10 };
  const valS: CSSProperties = { color: "#eee", fontSize: 10, fontFamily: "monospace" };

  if (marketEntries.length === 0) {
    return <div style={{ color: "#888", padding: 8 }}>No laptops on the market. Design and manufacture a laptop first.</div>;
  }

  return (
    <div>
      {/* Selectors */}
      <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ color: "#aaa", fontSize: 10 }}>Demographic:</label>
        <select style={selectStyle} value={selectedDemo} onChange={(e) => setSelectedDemo(e.target.value as DemographicId)}>
          {DEMOGRAPHIC_IDS.map((d) => <option key={d} value={d}>{DEMO_SHORT[d]}</option>)}
        </select>
        <label style={{ color: "#aaa", fontSize: 10, marginLeft: 8 }}>Laptops (click to toggle):</label>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
        <button
          style={{ ...stepBtnStyle(selectedLaptops.size === 0), fontSize: 9 }}
          onClick={() => setSelectedLaptops(new Set())}
        >
          All ({marketEntries.length})
        </button>
        {marketEntries.map((e) => (
          <button
            key={e.id}
            style={{
              ...stepBtnStyle(selectedLaptops.has(e.id)),
              color: selectedLaptops.has(e.id) ? (e.isPlayer ? tokens.colors.accent : "#ffc800") : "#777",
              borderColor: selectedLaptops.has(e.id) ? (e.isPlayer ? tokens.colors.accent : "rgba(255,200,0,0.4)") : "#333",
              fontSize: 9,
            }}
            onClick={() => toggleLaptop(e.id)}
          >
            {e.companyName.slice(0, 8)} {e.modelName}
          </button>
        ))}
      </div>

      {/* Step selector */}
      <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
        {STEPS.map((step, i) => (
          <button key={i} style={stepBtnStyle(currentStep === i)} onClick={() => setCurrentStep(i)}>
            {step}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ overflowX: "auto" }}>
        {currentStep === 0 && (
          <StepTable
            title="Raw Stats (from components + chassis + design bonuses)"
            columns={ALL_STATS.map((s) => STAT_SHORT[s])}
            rows={computed.map((c) => ({
              label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
              isPlayer: c.laptop.isPlayer,
              cells: ALL_STATS.map((s) => String(c.laptop.stats[s] ?? 0)),
            }))}
          />
        )}

        {currentStep === 1 && (
          <StepTable
            title="Normalised Stats = raw / max(raw across all market laptops)"
            columns={ALL_STATS.map((s) => STAT_SHORT[s])}
            rows={computed.map((c) => ({
              label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
              isPlayer: c.laptop.isPlayer,
              cells: ALL_STATS.map((s) => c.normalised[s].toFixed(3)),
            }))}
          />
        )}

        {currentStep === 2 && (
          <StepTable
            title={`Demographic Weights: ${demographic.name} (sum = 1.0)`}
            columns={ALL_STATS.map((s) => STAT_SHORT[s])}
            rows={[{
              label: "Weight",
              isPlayer: false,
              cells: ALL_STATS.map((s) => demographic.statWeights[s].toFixed(2)),
            }]}
          />
        )}

        {currentStep === 3 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Weighted = normalised[stat] x weight[stat] ; Score = sum(weighted)
            </div>
            <StepTable
              columns={[...ALL_STATS.map((s) => STAT_SHORT[s]), "SCORE"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [...ALL_STATS.map((s) => c.weightedPerStat[s].toFixed(4)), c.weightedStatScore.toFixed(4)],
              }))}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Screen Size Penalty: 1.0 if in [{demographic.screenSizePreference.preferredMin}-{demographic.screenSizePreference.preferredMax}"], else -(distance x {demographic.screenSizePreference.penaltyPerInch}/inch), floor 0.05
            </div>
            <StepTable
              columns={["Screen Size", "Preferred", "Penalty"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [
                  `${c.laptop.screenSize}"`,
                  `${demographic.screenSizePreference.preferredMin}-${demographic.screenSizePreference.preferredMax}"`,
                  c.screenPenalty.toFixed(3),
                ],
              }))}
            />
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Raw VP = (weighted_score x screen_penalty) / price ^ {demographic.priceSensitivity} ({PRICE_SENSITIVITY_EXPONENT[demographic.priceSensitivity]})
            </div>
            <StepTable
              columns={["StatScore", "ScrPen", "Price", "Exponent", "Price^Exp", "Raw VP"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [
                  c.weightedStatScore.toFixed(4),
                  c.screenPenalty.toFixed(3),
                  `$${c.laptop.retailPrice.toLocaleString()}`,
                  c.exponent.toFixed(1),
                  c.priceComponent.toFixed(1),
                  c.rawVP.toExponential(4),
                ],
              }))}
            />
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Brand Perception in "{DEMO_SHORT[selectedDemo]}" (range: -50 to +50)
            </div>
            <StepTable
              columns={["Perception", "Modifier %"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [
                  c.brandPerception.toFixed(2),
                  `${c.perceptionMod >= 0 ? "+" : ""}${c.perceptionMod.toFixed(2)}%`,
                ],
              }))}
            />
            <div style={{ ...labelS, marginTop: 4 }}>
              Note: Campaign perception is sampled at simulation time. Shown as 0 here (baseline).
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Biased VP = Raw VP x (1 + perception_mod / 100)
            </div>
            <StepTable
              columns={["Raw VP", "Perc Mod %", "Biased VP"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [
                  c.rawVP.toExponential(4),
                  `${c.perceptionMod >= 0 ? "+" : ""}${c.perceptionMod.toFixed(2)}%`,
                  c.biasedVP.toExponential(4),
                ],
              }))}
            />
          </div>
        )}

        {currentStep === 8 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Brand Reach in "{DEMO_SHORT[selectedDemo]}" (0-100%)
            </div>
            <StepTable
              columns={["Reach %"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [c.reach.toFixed(2) + "%"],
              }))}
            />
          </div>
        )}

        {currentStep === 9 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Effective VP = Biased VP x (reach / 100)
            </div>
            <StepTable
              columns={["Biased VP", "Reach %", "Effective VP"]}
              rows={computed.map((c) => ({
                label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                isPlayer: c.laptop.isPlayer,
                cells: [
                  c.biasedVP.toExponential(4),
                  c.reach.toFixed(2) + "%",
                  c.effectiveVP.toExponential(4),
                ],
              }))}
            />
            <div style={{ ...labelS, marginTop: 4 }}>
              Sum of ALL effective VPs (full market): <span style={valS}>{totalEffectiveVP.toExponential(4)}</span>
            </div>
          </div>
        )}

        {currentStep === 10 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Market Share = effective_vp / sum(all effective_vps)
            </div>
            <StepTable
              columns={["Effective VP", "Sum All VPs", "Market Share %"]}
              rows={computed.map((c) => {
                const share = totalEffectiveVP > 0 ? c.effectiveVP / totalEffectiveVP : 0;
                return {
                  label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                  isPlayer: c.laptop.isPlayer,
                  cells: [
                    c.effectiveVP.toExponential(4),
                    totalEffectiveVP.toExponential(4),
                    (share * 100).toFixed(2) + "%",
                  ],
                };
              })}
            />
          </div>
        )}

        {currentStep === 11 && (
          <div>
            <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>
              Demand Allocation for "{DEMO_SHORT[selectedDemo]}" in Y{state.year} Q{state.quarter}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
              <div><span style={labelS}>Base pool: </span><span style={valS}>{basePool.toLocaleString()}</span></div>
              <div><span style={labelS}>Growth-adjusted: </span><span style={valS}>{demPopulation.toLocaleString()}</span></div>
              <div><span style={labelS}>Replacement cycle: </span><span style={valS}>{REPLACEMENT_CYCLE[selectedDemo]} yrs</span></div>
              <div><span style={labelS}>Annual buyers: </span><span style={valS}>{Math.round(annualBuyers).toLocaleString()}</span></div>
              <div><span style={labelS}>Q{state.quarter} share: </span><span style={valS}>{(quarterShare * 100).toFixed(1)}%</span></div>
              <div><span style={labelS}>Quarterly buyers: </span><span style={valS}>{Math.round(quarterlyBuyers).toLocaleString()}</span></div>
            </div>
            <StepTable
              columns={["Market Share %", "Units Demanded"]}
              rows={computed.map((c) => {
                const share = totalEffectiveVP > 0 ? c.effectiveVP / totalEffectiveVP : 0;
                const units = Math.round(quarterlyBuyers * share);
                return {
                  label: `${c.laptop.companyName.slice(0, 10)} ${c.laptop.modelName}`,
                  isPlayer: c.laptop.isPlayer,
                  cells: [
                    (share * 100).toFixed(2) + "%",
                    units.toLocaleString(),
                  ],
                };
              })}
            />
            <div style={{ ...labelS, marginTop: 4 }}>
              Note: Actual simulation adds +/- {DEMAND_NOISE_MIN}%-{DEMAND_NOISE_MAX}% sales noise on top.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable table for step display
function StepTable({ title, columns, rows }: {
  title?: string;
  columns: string[];
  rows: { label: string; isPlayer: boolean; cells: string[] }[];
}) {
  const thS: CSSProperties = { padding: "2px 5px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#aaa", fontSize: 9, fontWeight: "normal" };
  const cellS: CSSProperties = { padding: "2px 5px", textAlign: "right", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 10, fontFamily: "monospace" };

  return (
    <div>
      {title && <div style={{ color: "#ffc800", fontWeight: "bold", marginBottom: 4, fontSize: 10 }}>{title}</div>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ ...thS, textAlign: "left" }}>Laptop</th>
            {columns.map((c, i) => <th key={i} style={thS}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{ ...cellS, textAlign: "left", color: row.isPlayer ? tokens.colors.accent : "#ccc", fontFamily: tokens.font.family }}>
                {row.label}
              </td>
              {row.cells.map((val, j) => <td key={j} style={cellS}>{val}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
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
