import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";

const SLOTS: SlotDef[] = [
  { slot: "display", label: "Display Panel" },
  { slot: "webcam", label: "Webcam" },
  { slot: "speakers", label: "Speakers" },
];

export function DisplayMediaStep() {
  return (
    <ComponentStepLayout
      title="Display & Media"
      description="Select your display, webcam, and speakers."
      slots={SLOTS}
    />
  );
}
