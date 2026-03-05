import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";

const SLOTS: SlotDef[] = [
  { slot: "battery", label: "Battery" },
  { slot: "wifi", label: "WiFi / Bluetooth" },
  { slot: "ports", label: "Ports / Connectivity" },
];

export function ConnectivityPowerStep() {
  return (
    <ComponentStepLayout
      title="Connectivity & Power"
      description="Select your battery, WiFi, and ports."
      slots={SLOTS}
    />
  );
}
