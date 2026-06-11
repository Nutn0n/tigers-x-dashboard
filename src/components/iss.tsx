import { DASHBOARD_PANEL_TITLE_CLASS } from "@/lib/dashboard-panel-styles";
import { withBasePath } from "@/lib/app-path";

export function Iss() {
  return (
    <div className="relative isolate z-0 flex w-full min-w-0 flex-col items-center overflow-hidden">
      <section
        className="flex w-full flex-col items-center rounded-[10px] border-[1px] border-solid border-[#eeeeee] pt-1"
        aria-labelledby="iss-panel-title"
      >
        <h2 id="iss-panel-title" className={DASHBOARD_PANEL_TITLE_CLASS}>
          International Space Station
        </h2>
        <div className="mt-3 flex w-full flex-col items-stretch overflow-x-hidden pb-3">
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
                <span className="relative z-[1] inline-flex size-[4px] shrink-0 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_0_6px_2px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
