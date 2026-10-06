import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import ToastContainer from "../ui/Toast";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F5F6F8]">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        {children ?? <Outlet />}
      </div>
      <ToastContainer />
    </div>
  );
}
