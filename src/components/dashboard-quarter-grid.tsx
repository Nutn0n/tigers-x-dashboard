import { ActivityMonitor } from "@/components/activity-monitor";
import { Microfludic } from "@/components/microfludic";
import { Telemetry } from "@/components/telemetry";
import {
  DASHBOARD_QUARTER_CELL,
  DASHBOARD_QUARTER_OUTER,
} from "@/lib/dashboard-layout-classes";

export function DashboardQuarterGrid() {
  return (
    <div className={DASHBOARD_QUARTER_OUTER}>
      <div className={DASHBOARD_QUARTER_CELL}>
        <Microfludic />
      </div>
      <div className={DASHBOARD_QUARTER_CELL}>
        <ActivityMonitor />
      </div>
      <div className={DASHBOARD_QUARTER_CELL}>
        <Telemetry />
      </div>
    </div>
  );
}
