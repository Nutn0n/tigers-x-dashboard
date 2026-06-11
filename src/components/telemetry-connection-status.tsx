export function TelemetryConnectionStatus() {
  return (
    <div
      className="flex items-center gap-2 text-[10px] text-[#eee]/70 sm:text-[11px]"
      title="Archived telemetry snapshot at experiment cube deactivation"
    >
      <span
        className="inline-block size-2 shrink-0 rounded-full"
        style={{ backgroundColor: "#6b7280", boxShadow: "0 0 6px #6b7280" }}
        aria-hidden
      />
      <span className="font-medium text-[#eee]/90">Archive</span>
    </div>
  );
}
