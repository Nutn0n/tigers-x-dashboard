import { ActivityDescription } from "@/components/activity-description";
import { ActivityMonitor } from "@/components/activity-monitor";
import { Microfludic } from "@/components/microfludic";
import { PayloadViewer } from "@/components/payload-viewer";
import { Telecommand } from "@/components/telecommand";
import { Telemetry } from "@/components/telemetry";
import { Trajectory } from "@/components/trajectory";
import {
  DASHBOARD_MICRO_COLUMN,
  DASHBOARD_QUARTER_CELL,
  DASHBOARD_QUARTER_INNER_GRID,
  DASHBOARD_QUARTER_OUTER,
} from "@/lib/dashboard-layout-classes";

const GRID_TILES = [
  { key: "trajectory", Tile: Trajectory },
  { key: "activity-monitor", Tile: ActivityMonitor },
  { key: "telemetry", Tile: Telemetry },
  { key: "payload-viewer", Tile: PayloadViewer },
  { key: "activity-description", Tile: ActivityDescription },
  { key: "telecommand", Tile: Telecommand },
] as const;

export function DashboardQuarterGrid() {
  return (
    <div className={DASHBOARD_QUARTER_OUTER}>
      <div className={DASHBOARD_MICRO_COLUMN}>
        <Microfludic />
      </div>
      <div className={DASHBOARD_QUARTER_INNER_GRID}>
        {GRID_TILES.map(({ key, Tile }) => (
          <div key={key} className={DASHBOARD_QUARTER_CELL}>
            <Tile />
          </div>
        ))}
      </div>
    </div>
  );
}
