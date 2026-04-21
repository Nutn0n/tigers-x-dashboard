import { FullscreenPanel } from "@/components/FullscreenPanel";

export function Timeline() {
  return (
    <FullscreenPanel className="flex flex-col">
      <section
        className="flex min-h-[500px] flex-1 flex-col rounded-[10px] border border-solid px-10 pt-1"
        aria-label="Mission timeline"
      />
    </FullscreenPanel>
  );
}
