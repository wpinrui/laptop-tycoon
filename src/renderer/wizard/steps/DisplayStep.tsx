import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";

const SLOTS: SlotDef[] = [
  { slot: "resolution", label: "Resolution" },
  { slot: "displayTech", label: "Display Technology" },
  { slot: "displaySurface", label: "Surface Finish" },
];

export function DisplayStep() {
  return (
    <ComponentStepLayout
      title="Display"
      description="Select your display resolution, technology, and surface finish."
      slots={SLOTS}
    />
  );
}
