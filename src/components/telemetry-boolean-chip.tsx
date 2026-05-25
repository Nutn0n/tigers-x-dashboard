type TelemetryBooleanChipProps = {
  field: string;
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
};

export function TelemetryBooleanChip({
  field,
  value,
  trueLabel = "True",
  falseLabel = "False",
}: TelemetryBooleanChipProps) {
  const label = value ? trueLabel : falseLabel;
  return (
    <span
      className={`inline-flex min-h-4 min-w-[2.25rem] items-center justify-center rounded px-1 py-px text-[9px] font-medium leading-none ${
        value ? "bg-green-600 text-white" : "bg-[#3a3a3a] text-[#eee]/45"
      }`}
      aria-label={`${field} ${label}`}
    >
      {label}
    </span>
  );
}
