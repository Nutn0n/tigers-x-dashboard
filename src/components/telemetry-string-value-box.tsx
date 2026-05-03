type TelemetryStringValueBoxProps = {
  /** Raw value shown inside the box (empty / whitespace → em dash). */
  value: string;
  /** Field name for `aria-label`. */
  field: string;
};

/** White outline, transparent fill — for string / enum telemetry fields. */
export function TelemetryStringValueBox({ value, field }: TelemetryStringValueBoxProps) {
  const display = value.trim() === "" ? "—" : value;
  return (
    <span
      className="inline-block max-w-[min(100%,12rem)] truncate rounded border border-solid border-white bg-transparent px-1.5 py-px text-left text-[9px] text-[#eee]/90"
      title={value.trim() === "" ? undefined : value}
      aria-label={`${field} ${display}`}
    >
      {display}
    </span>
  );
}
