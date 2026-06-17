const styles = {
  CRITICAL: "bg-red-50 text-red-600 border border-red-200",
  HIGH: "bg-orange-50 text-orange-600 border border-orange-200",
  MEDIUM: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  LOW: "bg-gray-100 text-gray-500 border border-gray-200",
  Active: "bg-blue-50 text-blue-600 border border-blue-200",
  Resolved: "bg-green-50 text-green-600 border border-green-200",
  Triaged: "bg-cyan-50 text-cyan-600 border border-cyan-200",
  Investigating: "bg-purple-50 text-purple-600 border border-purple-200",
  Assigned: "bg-indigo-50 text-indigo-600 border border-indigo-200",
  Monitoring: "bg-teal-50 text-teal-600 border border-teal-200",
  connected: "bg-green-50 text-green-600 border border-green-200",
  disconnected: "bg-red-50 text-red-600 border border-red-200",
  degraded: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Answered: "bg-green-50 text-green-600 border border-green-200",
  "No Answer": "bg-gray-100 text-gray-500 border border-gray-200",
  Escalated: "bg-orange-50 text-orange-600 border border-orange-200",
};

export default function StatusPill({ status, className = "" }) {
  const base = styles[status] ?? "bg-gray-100 text-gray-500 border border-gray-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${base} ${className}`}>
      {status}
    </span>
  );
}
