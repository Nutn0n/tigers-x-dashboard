import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";

export function Trajectory() {
  return (
    <TitledDashboardPanel
      title="Trajectory"
      panelId="trajectory"
      contentFlush
    >
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
        <img
          src="/map.svg"
          alt="Trajectory map"
          className="max-h-full max-w-full min-h-0 min-w-0 object-contain object-center"
        />
      </div>
    </TitledDashboardPanel>
  );
}
