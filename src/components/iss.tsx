import { FullscreenPanel } from "@/components/FullscreenPanel";
import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";
import { withBasePath } from "@/lib/app-path";

export function Iss() {
  return (
    <FullscreenPanel className="flex flex-col items-center">
      <section
        className="flex min-h-0 w-full flex-1 flex-col items-center pt-1"
        aria-labelledby="iss-panel-title"
      >
        <h2 id="iss-panel-title" className={DASHBOARD_PANEL_TITLE_CLASS}>
          International Space Station
        </h2>
        <div className="mt-3 flex min-h-0 min-w-0 w-full flex-1 flex-col items-stretch justify-center overflow-x-hidden overflow-y-auto pb-3">
          <div className="relative w-full shrink-0">
            <img
              src={withBasePath("/iss.png")}
              alt="International Space Station"
              className="h-auto w-full object-contain object-center"
            />
            <div
              className="pointer-events-none absolute left-[45%] top-[42%] z-10 flex size-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
              aria-label="ICE Cubes payload location"
            >
              <div className="relative flex size-0 items-center justify-center">
                <span className="absolute bottom-full left-1/2 z-[2] mb-[14px] w-max -translate-x-1/2 rounded bg-white px-2 py-0.5 text-center text-[10px] font-semibold leading-tight text-black shadow-md whitespace-nowrap">
                  ICE Cubes
                </span>
                <span
                  className="absolute z-0 inline-flex size-5 rounded-full bg-white animate-iss-payload-ping-ring"
                  aria-hidden
                />
                <span className="relative z-[1] inline-flex size-[4px] shrink-0 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_6px_2px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </FullscreenPanel>
  );
}
