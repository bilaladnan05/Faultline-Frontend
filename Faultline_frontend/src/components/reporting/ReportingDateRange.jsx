import { REPORTING_RANGES } from "./reportingRange";

export default function ReportingDateRange({ value, onChange }) {
  return (
    <fieldset>
      <legend className="sr-only">Reporting date range</legend>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Reporting date range">
        {REPORTING_RANGES.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={value === option.key}
            onClick={() => onChange(option.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              value === option.key
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
