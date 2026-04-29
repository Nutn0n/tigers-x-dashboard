import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { withBasePath } from "@/lib/app-path";

export function PayloadViewer() {
  return (
    <TitledDashboardPanel title="Payload Viewer" panelId="payload-viewer">
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden">
        <img
          src={withBasePath("/payload.svg")}
          alt="Payload diagram"
          className="h-auto w-full object-contain object-center"
        />
      </div>
    </TitledDashboardPanel>
  );
}
