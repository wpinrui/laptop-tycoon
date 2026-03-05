import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";

const SLOTS: SlotDef[] = [
  { slot: "cpu", label: "CPU" },
  { slot: "gpu", label: "GPU" },
  { slot: "ram", label: "RAM" },
  { slot: "storage", label: "Storage" },
];

export function ProcessingStep() {
  return (
    <ComponentStepLayout
      title="Processing"
      description="Select your CPU, GPU, RAM, and storage."
      slots={SLOTS}
    />
  );
}
