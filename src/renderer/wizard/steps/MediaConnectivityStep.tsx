import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";

const SLOTS: SlotDef[] = [
  { slot: "webcam", label: "Webcam" },
  { slot: "speakers", label: "Speakers" },
  { slot: "wifi", label: "WiFi / Bluetooth" },
  { slot: "ports", label: "Ports / Connectivity" },
];

export function MediaConnectivityStep() {
  return (
    <ComponentStepLayout
      title="Media & Connectivity"
      description="Select your webcam, speakers, WiFi, and ports."
      slots={SLOTS}
    />
  );
}
