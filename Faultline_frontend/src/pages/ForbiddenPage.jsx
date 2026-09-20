import { Link, useLocation } from "react-router-dom";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ROLES, roleLabel } from "../auth/roles";

/**
 * Where a refused navigation lands.
 *
 * Says plainly what happened and who to ask, rather than bouncing the user somewhere
 * else — a silent redirect reads as a broken link and generates a support ticket, while
 * "this project is not assigned to you" is actionable.
 */
export default function ForbiddenPage() {
  const location = useLocation();
  const { user } = useAuth();
  const projectId = location.state?.projectId;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto">
          <ShieldOff size={22} className="text-red-600" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 mt-4">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          {projectId ? (
            <>
              You are not assigned to{" "}
              <span className="font-semibold text-gray-700">{projectId}</span>. Ask an
              administrator to assign you to this project.
            </>
          ) : (
            <>
              Your role does not have access to this area.
              {user?.role === ROLES.ONSITE_ENGINEER
                ? " Administration is limited to administrators."
                : ""}
            </>
          )}
        </p>
        {user && (
          <p className="text-xs text-gray-400 mt-3">
            Signed in as {user.email} · {roleLabel(user.role)}
          </p>
        )}
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 mt-6 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft size={14} /> Back to my projects
        </Link>
      </div>
    </div>
  );
}
