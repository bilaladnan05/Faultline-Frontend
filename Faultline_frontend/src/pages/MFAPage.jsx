import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Zap, ShieldCheck, AlertCircle } from "lucide-react";

export default function MFAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "user@faultline.io";
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Please enter the 6-digit code."); return; }
    setLoading(true);
    setTimeout(() => {
      sessionStorage.setItem("fl_auth", "ok");
      navigate("/dashboard");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap size={20} className="text-white" fill="white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Faultline</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={28} className="text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Two-factor authentication</h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Enter the 6-digit code sent to<br />
              <span className="font-semibold text-gray-700">{email}</span>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-center gap-3 mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (refs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Verify & Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Demo: enter any 6 digits to proceed · FR-04
          </p>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button onClick={() => navigate("/login")} className="text-sm text-blue-600 hover:underline font-medium">
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
