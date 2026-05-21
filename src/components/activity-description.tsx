import { TitledDashboardPanel } from "@/components/titled-dashboard-panel";
import { DASHBOARD_ACTIVITY_DESCRIPTION_SHELL_CLASS } from "@/lib/dashboard-panel-styles";

export function ActivityDescription() {
  return (
    <TitledDashboardPanel
      title="Activity Description"
      panelId="activity-description"
    >
      <div className={DASHBOARD_ACTIVITY_DESCRIPTION_SHELL_CLASS} aria-hidden />
    </TitledDashboardPanel>
  );
}
