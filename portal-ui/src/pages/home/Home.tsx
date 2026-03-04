import { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Dashboard from "./dashboard/Dashboard";
import Settings from "./settings/Settings";
import Logs from "./logs/Logs";

function HomeSidebar({
  page,
  setPage,
}: {
  page: string;
  setPage: (p: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 mt-10">
      <h1 className="font-bold uppercase tracking-wider text-text-500 px-2 py-1 text-2xl">
        Home
      </h1>
      <button
        className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer"
        onClick={() => setPage("dashboard")}
      >
        Server Dashboard
      </button>
      <button
        className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer"
        onClick={() => setPage("logs")}
      >
        Server Logs
      </button>
      <button
        className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer"
        onClick={() => setPage("settings")}
      >
        Server Settings
      </button>
      <h1 className="font-semibold uppercase tracking-wider text-text-500 px-2 py-1">
        How to...
      </h1>
      <button className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer">
        How to add game servers
      </button>
      <button className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer">
        How to check game logs
      </button>
      <button className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer">
        How to check server logs
      </button>
    </div>
  );
}

export default function Home() {
  const { setSidebarContent } = useSidebar();
  const [page, setPage] = useState<string>("dashboard");

  useEffect(() => {
    setSidebarContent(<HomeSidebar page={page} setPage={setPage} />);
  }, [page]);

  return (
    <div className="h-full w-full">
      {page === "dashboard" && <Dashboard />}
      {page === "logs" && <Logs />}
      {page === "settings" && <Settings />}
    </div>
  );
}
