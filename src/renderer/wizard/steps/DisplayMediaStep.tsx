import { ComponentStepLayout, SlotDef } from "./ComponentStepLayout";

const SLOTS: SlotDef[] = [
  { slot: "resolution", label: "Resolution" },
  { slot: "displayTech", label: "Display Technology" },
  { slot: "displaySurface", label: "Surface Finish" },
  { slot: "webcam", label: "Webcam" },
  { slot: "speakers", label: "Speakers" },
];

export function DisplayMediaStep() {
  return (
    <ComponentStepLayout
      title="Display & Media"
      description="Select your display resolution, technology, surface finish, webcam, and speakers."
      slots={SLOTS}
    />
  );
}
