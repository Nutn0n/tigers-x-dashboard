import { FullscreenPanel } from "@/components/FullscreenPanel";
import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";

export function Iss() {
  return (
    <FullscreenPanel className="flex flex-col items-center">
      <section
        className="flex w-full flex-1 flex-col items-center px-10 pt-1"
        aria-labelledby="iss-panel-title"
      >
        <h2 id="iss-panel-title" className={DASHBOARD_PANEL_TITLE_CLASS}>
          International Space Station
        </h2>
      </section>
    </FullscreenPanel>
  );
}
