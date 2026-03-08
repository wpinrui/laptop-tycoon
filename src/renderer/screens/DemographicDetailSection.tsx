import { DEMOGRAPHICS } from "../../data/demographics";
import { DemographicId } from "../../data/types";
import { LaptopSalesResult, PerceptionChange } from "../../simulation/salesTypes";
import { computeLossReasons, LOSS_REASON_LABELS, LossReason } from "../../simulation/lossReasons";
import { tokens } from "../shell/tokens";
import { formatNumber } from "../utils/formatCash";
import { sectionStyle, tableStyle, thStyle, tdStyle, tdRight, sectionHeadingStyle } from "./summaryStyles";

interface DemographicDetailProps {
  /** All laptop results (player + competitors) for the period */
  allLaptopResults: LaptopSalesResult[];
  /** Player laptop results only */
  playerResults: LaptopSalesResult[];
  /** Perception changes for the period */
  perceptionChanges: PerceptionChange[];
}

/** Aggregate player results across all models for a given demographic */
function aggregatePlayerDemographic(
  playerResults: LaptopSalesResult[],
  demId: DemographicId,
) {
  let totalPool = 0;
  let addressablePool = 0;
  let unitsSold = 0;

  for (const lr of playerResults) {
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
    if (!db) continue;
    totalPool = db.totalPool; // Same across models for same demographic
    addressablePool = db.addressablePool; // Same across models for same owner+demographic
    unitsSold += db.unitsDemanded;
  }

  // Market share: player units vs total units in this demographic
  return { totalPool, addressablePool, unitsSold };
}

function getTotalDemographicUnits(
  allResults: LaptopSalesResult[],
  demId: DemographicId,
): number {
  let total = 0;
  for (const lr of allResults) {
    const db = lr.demographicBreakdown.find((b) => b.demographicId === demId);
    if (db) total += db.unitsDemanded;
  }
  return total;
}

function lossReasonColor(reason: LossReason): string {
  if (reason.impact < -0.15) return tokens.colors.danger;
  if (reason.impact < -0.05) return tokens.colors.warning;
  return tokens.colors.textMuted;
}

function perceptionExplanation(pc: PerceptionChange): string {
  const abs = Math.abs(pc.delta);
  if (abs < 0.1) return "No meaningful change";
  if (pc.delta > 0) {
    if (abs > 5) return "Strong sales with great value-for-money";
    if (abs > 2) return "Solid value perception from buyers";
    return "Slight improvement from positive experiences";
  }
  if (abs > 5) return "Very poor value-for-money drove perception down";
  if (abs > 2) return "Buyers felt they overpaid for what they got";
  return "Slight decline from underwhelming experiences";
}

export function DemographicDetailSection({ allLaptopResults, playerResults, perceptionChanges }: DemographicDetailProps) {
  if (playerResults.length === 0) return null;

  // Get all demographics that have any activity
  const activeDemographics = DEMOGRAPHICS.filter((dem) => {
    const totalUnits = getTotalDemographicUnits(allLaptopResults, dem.id);
    return totalUnits > 0;
  });

  // Compute loss reasons per model per demographic
  const lossReasonsByModelDem = new Map<string, LossReason[]>();
  for (const lr of playerResults) {
    for (const db of lr.demographicBreakdown) {
      const reasons = computeLossReasons(db, allLaptopResults, db.demographicId, lr.laptopId);
      lossReasonsByModelDem.set(`${lr.laptopId}:${db.demographicId}`, reasons);
    }
  }

  // Aggregate loss reasons across player models per demographic (use worst model's reasons)
  const lossReasonsByDem = new Map<string, LossReason[]>();
  for (const dem of activeDemographics) {
    let worstReasons: LossReason[] = [];
    for (const lr of playerResults) {
      const key = `${lr.laptopId}:${dem.id}`;
      const reasons = lossReasonsByModelDem.get(key) ?? [];
      if (reasons.length > worstReasons.length) {
        worstReasons = reasons;
      }
    }
    lossReasonsByDem.set(dem.id, worstReasons);
  }

  return (
    <>
      {/* Demographic Breakdown */}
      <div style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Demographic Breakdown</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Demographic</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Total Pool</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Addressable</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Units Sold</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Share</th>
              <th style={thStyle}>Loss Reasons</th>
            </tr>
          </thead>
          <tbody>
            {activeDemographics.map((dem) => {
              const agg = aggregatePlayerDemographic(playerResults, dem.id);
              const totalDemUnits = getTotalDemographicUnits(allLaptopResults, dem.id);
              const share = totalDemUnits > 0 ? agg.unitsSold / totalDemUnits : 0;
              const reasons = lossReasonsByDem.get(dem.id) ?? [];

              return (
                <tr key={dem.id}>
                  <td style={tdStyle}>{dem.name}</td>
                  <td style={tdRight}>{formatNumber(agg.totalPool)}</td>
                  <td style={tdRight}>{formatNumber(agg.addressablePool)}</td>
                  <td style={tdRight}>{formatNumber(agg.unitsSold)}</td>
                  <td style={tdRight}>{(share * 100).toFixed(1)}%</td>
                  <td style={{ ...tdStyle, fontSize: tokens.font.sizeSmall }}>
                    {reasons.length === 0 ? (
                      <span style={{ color: tokens.colors.success }}>--</span>
                    ) : (
                      reasons.map((r, i) => (
                        <span key={r.type} style={{ color: lossReasonColor(r) }}>
                          {LOSS_REASON_LABELS[r.type]}{i < reasons.length - 1 ? ", " : ""}
                        </span>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Perception Changes */}
      {perceptionChanges && perceptionChanges.some((pc) => Math.abs(pc.delta) >= 0.1) && (
        <div style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Brand Perception Changes</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Demographic</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Before</th>
                <th style={{ ...thStyle, textAlign: "right" }}>After</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Change</th>
                <th style={thStyle}>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {perceptionChanges
                .filter((pc) => Math.abs(pc.delta) >= 0.1)
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((pc) => {
                  const demName = DEMOGRAPHICS.find((d) => d.id === pc.demographicId)?.name ?? pc.demographicId;
                  const deltaColor = pc.delta > 0 ? tokens.colors.success : pc.delta < 0 ? tokens.colors.danger : undefined;
                  const sign = pc.delta > 0 ? "+" : "";
                  return (
                    <tr key={pc.demographicId}>
                      <td style={tdStyle}>{demName}</td>
                      <td style={tdRight}>{pc.oldPerception.toFixed(1)}</td>
                      <td style={tdRight}>{pc.newPerception.toFixed(1)}</td>
                      <td style={{ ...tdRight, color: deltaColor, fontWeight: 600 }}>
                        {sign}{pc.delta.toFixed(1)}
                      </td>
                      <td style={{ ...tdStyle, fontSize: tokens.font.sizeSmall, color: tokens.colors.textMuted }}>
                        {perceptionExplanation(pc)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
