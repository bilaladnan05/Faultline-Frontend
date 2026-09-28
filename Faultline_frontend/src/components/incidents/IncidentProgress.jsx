import { Check } from "lucide-react";
import { formatTimestamp } from "../../api/adapters";

/** Horizontal lifecycle stepper; the first step not yet reached is highlighted as current. */
export default function IncidentProgress({ steps }) {
  if (!steps?.length) return null;
  const currentIndex = steps.findIndex((step) => !step.done);

  return (
    <div className="overflow-x-auto">
      <ol className="flex min-w-[480px]">
        {steps.map((step, index) => {
          const current = index === currentIndex;
          const next = steps[index + 1];
          const connectorActive = next && (next.done || index + 1 === currentIndex);
          return (
            <li
              key={step.label}
              className="relative flex-1 flex flex-col items-center"
              title={step.at ? formatTimestamp(step.at) : undefined}
            >
              {next && (
                <span
                  aria-hidden="true"
                  className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${connectorActive ? "bg-blue-500" : "bg-gray-200"}`}
                />
              )}
              <StepMarker done={step.done} current={current} />
              <span
                className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                  current ? "text-blue-700" : step.done ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepMarker({ done, current }) {
  if (done) {
    return (
      <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-sm">
        <Check size={16} strokeWidth={3} />
      </span>
    );
  }
  if (current) {
    return (
      <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-blue-600 ring-4 ring-blue-100">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
      </span>
    );
  }
  return (
    <span className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200">
      <span className="w-2 h-2 rounded-full bg-gray-300" />
    </span>
  );
}
