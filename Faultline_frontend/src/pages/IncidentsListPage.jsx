import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, Search, LayoutGrid, List, Loader2 } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import StatusPill from "../components/ui/StatusPill";
import Avatar from "../components/ui/Avatar";
import { incidents } from "../mocks/incidents";

const SEVERITY_COLORS = { CRITICAL: "bg-red-500", HIGH: "bg-orange-400", MEDIUM: "bg-yellow-400", LOW: "bg-gray-300" };

export default function IncidentsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = incidents.filter((i) => {
    const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === "All" || i.severity === severityFilter;
    const matchStatus = statusFilter === "All" || i.status === statusFilter;
    return matchSearch && matchSev && matchStatus;
  });

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        breadcrumbs={["Incidents"]}
        action={
          <button
            onClick={() => navigate("/incidents/FL-101")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Create Manual Incident
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Incidents List</h1>
          <p className="text-sm text-gray-500 mt-1">Central command for monitoring, triaging, and resolving system-wide incidents detected by the Faultline monitoring core.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search incidents..."
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 placeholder:text-gray-400"
            />
          </div>

          <FilterDropdown label="Status" value={statusFilter} onChange={setStatusFilter} options={["All", "Active", "Triaged", "Resolved"]} />
          <FilterDropdown label="Severity" value={severityFilter} onChange={setSeverityFilter} options={["All", "CRITICAL", "HIGH", "MEDIUM", "LOW"]} />

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            Showing {filtered.length} of 1,204 results
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading incidents…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Search size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No incidents match your filters</p>
              <p className="text-xs mt-1">Try adjusting the search or filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["ID", "INCIDENT SUMMARY", "SEVERITY", "STATUS", "ASSIGNED TO", "AI CONFIDENCE", "ACTION"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => (
                  <tr
                    key={inc.id}
                    className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                  >
                    <td className="px-5 py-4 font-bold text-gray-400 text-xs tracking-wide">{inc.id}</td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-gray-900 leading-snug">{inc.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{inc.description}</p>
                    </td>
                    <td className="px-5 py-4"><StatusPill status={inc.severity} /></td>
                    <td className="px-5 py-4"><StatusPill status={inc.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar initials={inc.assignee.initials} color={inc.assignee.color} size="sm" />
                        <span className="text-gray-700 font-medium text-xs">{inc.assignee.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-20">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${inc.confidence}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600">{inc.confidence}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${inc.id}`); }}
                        className="text-xs font-bold text-blue-600 hover:underline tracking-wide"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of 51</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 font-medium text-sm">Previous</button>
            <button onClick={() => setPage((p) => p + 1)} className="px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <div className="relative inline-flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 select-none">
      <span className="font-medium">{label}:</span>
      <span className="text-blue-600 font-semibold">{value}</span>
      <ChevronDown size={13} className="text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
