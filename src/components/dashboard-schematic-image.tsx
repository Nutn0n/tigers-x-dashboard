import {
  DASHBOARD_SCHEMATIC_IMAGE_CLASS,
  DASHBOARD_SCHEMATIC_IMAGE_WRAPPER_CLASS,
} from "@/lib/dashboard-panel-styles";
import { withBasePath } from "@/lib/app-path";

type DashboardSchematicImageProps = {
  /** Public asset path, e.g. `/chip.svg`. */
  src: string;
  alt: string;
};

export function DashboardSchematicImage({
  src,
  alt,
}: DashboardSchematicImageProps) {
  return (
    <div className={DASHBOARD_SCHEMATIC_IMAGE_WRAPPER_CLASS}>
      <img
        src={withBasePath(src)}
        alt={alt}
        className={DASHBOARD_SCHEMATIC_IMAGE_CLASS}
      />
    </div>
  );
}
