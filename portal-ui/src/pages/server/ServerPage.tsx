import { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";

function ServerSidebar() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 mt-10">
      <h1 className="font-bold uppercase tracking-wider text-text-500 px-2 py-1 text-2xl">
        Server
        {/* To do make name change to game profile name */}
      </h1>
      <button className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer">
        Game Dashboard
      </button>
      <button className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer">
        Game Logs
      </button>
      <button className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer">
        Game Settings
      </button>
    </div>
  );
}

export default function ServerPage() {
  const { setSidebarContent } = useSidebar();

  useEffect(() => {
    setSidebarContent(<ServerSidebar />);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-text-900 mb-2">Server Page</h1>
      <p className="text-text-600">Configure your server preferences here.</p>
    </div>
  );
}
