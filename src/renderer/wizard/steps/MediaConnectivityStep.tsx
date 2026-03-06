import { useState } from "react";
import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";
import { useWizard } from "../WizardContext";
import { GAME_YEAR } from "../constants";
import { PORT_TYPES } from "../../../data/portTypes";
import { PortType } from "../../../data/types";
import { Tooltip } from "../Tooltip";

const COMPONENT_SLOTS: SlotDef[] = [
  { slot: "webcam", label: "Webcam" },
  { slot: "speakers", label: "Speakers" },
  { slot: "wifi", label: "WiFi / Bluetooth" },
];

const PORT_CATEGORIES: { id: string; label: string }[] = [
  { id: "usb", label: "USB" },
  { id: "video", label: "Video Output" },
  { id: "networking", label: "Networking" },
  { id: "audio", label: "Audio" },
  { id: "expansion", label: "Expansion" },
  { id: "legacy", label: "Legacy" },
];

function getAvailablePorts(year: number): PortType[] {
  return PORT_TYPES.filter(
    (p) =>
      p.yearIntroduced <= year &&
      (p.yearDiscontinued === null || p.yearDiscontinued >= year),
  );
}

export function MediaConnectivityStep() {
  const { state, dispatch } = useWizard();
  const availablePorts = getAvailablePorts(GAME_YEAR);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set(["legacy"]));

  const totalPortCost = availablePorts.reduce(
    (sum, p) => sum + (state.ports[p.id] ?? 0) * p.costPerPort,
    0,
  );
  const totalPortWeight = availablePorts.reduce(
    (sum, p) => sum + (state.ports[p.id] ?? 0) * p.weightPerPortG,
    0,
  );

  function toggleCategory(id: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Group ports by category
  const portsByCategory = PORT_CATEGORIES.map((cat) => ({
    ...cat,
    ports: availablePorts.filter((p) => p.category === cat.id),
  })).filter((cat) => cat.ports.length > 0);

  return (
    <ComponentStepLayout
      title="Media & Connectivity"
      description="Select your webcam, speakers, and WiFi. Configure ports below."
      slots={COMPONENT_SLOTS}
    >
      <div style={{ borderTop: "1px solid #333", paddingTop: "20px", marginTop: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: "bold", color: "#ccc", marginBottom: "4px" }}>
              Ports / Connectivity
            </div>
            <p style={{ color: "#888", fontSize: "0.75rem", marginBottom: "16px" }}>
              Each port takes up internal space and adds weight. Bulky legacy ports force a thicker chassis.
            </p>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#888", textAlign: "right", flexShrink: 0 }}>
            <div>Port cost: <span style={{ color: "#4caf50" }}>${totalPortCost}</span></div>
            <div>Port weight: <span style={{ color: "#e0e0e0" }}>{totalPortWeight}g</span></div>
          </div>
        </div>

        {portsByCategory.map((cat) => {
          const isCollapsed = collapsedCategories.has(cat.id);
          return (
            <div key={cat.id} style={{ marginBottom: "12px" }}>
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: "4px 0",
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <span style={{
                  fontSize: "0.625rem",
                  display: "inline-block",
                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 0.15s",
                }}>
                  &#9660;
                </span>
                {cat.label}
              </button>
              {!isCollapsed && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginTop: "6px",
                  }}
                >
                  {cat.ports.map((port) => (
                    <PortSelector
                      key={port.id}
                      port={port}
                      count={state.ports[port.id] ?? 0}
                      onChange={(count) =>
                        dispatch({ type: "SET_PORT_COUNT", portId: port.id, count })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ComponentStepLayout>
  );
}

function PortSelector({
  port,
  count,
  onChange,
}: {
  port: PortType;
  count: number;
  onChange: (count: number) => void;
}) {
  const active = count > 0;
  return (
    <Tooltip
      content={
        <div>
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#90caf9" }}>{port.name}</div>
          <div style={{ color: "#ccc" }}>{port.description}</div>
        </div>
      }
    >
      <div
        style={{
          background: active ? "#1a3a5c" : "#2a2a2a",
          border: active ? "2px solid #90caf9" : "1px solid #444",
          borderRadius: "8px",
          padding: "10px 12px",
          color: "#e0e0e0",
          fontSize: "0.75rem",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "0.8125rem",
            marginBottom: "4px",
            color: active ? "#90caf9" : "#e0e0e0",
          }}
        >
          {port.name}
        </div>

        <div style={{ color: "#888", fontSize: "0.6875rem", marginBottom: "8px" }}>
          ${port.costPerPort}/ea · {port.weightPerPortG}g · {port.volumePerPortCm3}cm³
          {port.minThicknessCm > 0 && ` · min ${port.minThicknessCm}cm`}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => onChange(Math.max(0, count - 1))}
            disabled={count <= 0}
            style={{
              width: "28px",
              height: "28px",
              border: "1px solid #555",
              borderRadius: "4px",
              background: count <= 0 ? "#1a1a1a" : "#333",
              color: count <= 0 ? "#555" : "#e0e0e0",
              cursor: count <= 0 ? "default" : "pointer",
              fontFamily: "inherit",
              fontSize: "1rem",
              lineHeight: "1",
            }}
          >
            &#8722;
          </button>
          <span style={{ fontWeight: "bold", fontSize: "1rem", minWidth: "16px", textAlign: "center" }}>
            {count}
          </span>
          <button
            onClick={() => onChange(Math.min(port.maxCount, count + 1))}
            disabled={count >= port.maxCount}
            style={{
              width: "28px",
              height: "28px",
              border: "1px solid #555",
              borderRadius: "4px",
              background: count >= port.maxCount ? "#1a1a1a" : "#333",
              color: count >= port.maxCount ? "#555" : "#e0e0e0",
              cursor: count >= port.maxCount ? "default" : "pointer",
              fontFamily: "inherit",
              fontSize: "1rem",
              lineHeight: "1",
            }}
          >
            +
          </button>
          <span style={{ color: "#666", fontSize: "0.6875rem" }}>max {port.maxCount}</span>
        </div>
      </div>
    </Tooltip>
  );
}
