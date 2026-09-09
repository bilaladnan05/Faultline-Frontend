import { Search, Bell, HelpCircle } from "lucide-react";

export default function TopBar({ breadcrumbs = [], action }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-4 px-6 flex-shrink-0">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm flex-1">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300">/</span>}
            <span className={i === breadcrumbs.length - 1 ? "text-gray-900 font-semibold" : "text-gray-400 font-medium"}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search size={14} className="absolute left-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search incidents, assets or logs..."
          className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72 placeholder:text-gray-400"
        />
      </div>

      {/* Icons */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 relative">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
          <HelpCircle size={15} />
        </button>
      </div>

      {/* Action slot */}
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
