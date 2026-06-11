import { DashboardQuarterGrid } from "@/components/dashboard-quarter-grid";
import { MissionDataProvider } from "@/components/data-source-provider";
import { MissionEndedNotice } from "@/components/mission-ended-notice";
import { TelemetryProvider } from "@/components/telemetry-provider";
import { DashboardTopBar } from "@/components/DashboardTopBar";
import { Iss } from "@/components/iss";
import { Timeline } from "@/components/timeline";
import {
  DASHBOARD_CONTENT_MAX,
  DASHBOARD_PAGE_SHELL,
  DASHBOARD_TOP_GRID,
  DASHBOARD_TOP_GRID_CELL,
} from "@/lib/dashboard-layout-classes";

export default function Home() {
  return (
    <MissionDataProvider>
      <TelemetryProvider>
      <MissionEndedNotice />
      <div className={DASHBOARD_PAGE_SHELL}>
        <div className={DASHBOARD_CONTENT_MAX}>
          <DashboardTopBar />

          <div className={DASHBOARD_TOP_GRID}>
            <div className={DASHBOARD_TOP_GRID_CELL}>
              <Iss />
            </div>
            <div className={DASHBOARD_TOP_GRID_CELL}>
              <Timeline />
            </div>
          </div>

          <DashboardQuarterGrid />
        </div>
      </div>
      </TelemetryProvider>
    </MissionDataProvider>
  );
}
