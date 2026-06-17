import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

let _show;
export function showToast(msg) { _show?.(msg); }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _show = (msg) => {
      const id = Date.now();
      setToasts((t) => [...t, { id, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
    return () => { _show = null; };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
          {t.msg}
          <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="ml-2 text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
