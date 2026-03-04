import { useEffect, useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import AddServerModal from "./AddServerModal";
import RemoveServerModal from "./remove-server-modal/RemoveServerModal";
import AllServers from "./all-servers/AllServers";
import type { Server } from "@/shared/models/Server";

const getServers = async () => {
  const res = await fetch(`/api/servers`);
  if (!res.ok) throw new Error("Failed to load servers");
  return (await res.json()) as Server[];
};

function ServersSidebar({
  setPage,
  onAddServer,
  onRemoveServer,
}: {
  setPage: (p: string) => void;
  onAddServer: () => void;
  onRemoveServer: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 mt-10">
      <h1 className="font-bold uppercase tracking-wider text-text-500 px-2 py-1 text-2xl">
        Servers
      </h1>
      <button
        className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer"
        onClick={() => setPage("all-servers")}
      >
        All Game Servers
      </button>
      <button
        className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer"
        onClick={onAddServer}
      >
        Add Game Server
      </button>
      <button
        className="text-left w-full px-3 py-2 rounded-md text-text-700 hover:bg-background-200 transition-all duration-150 cursor-pointer"
        onClick={onRemoveServer}
      >
        Remove Game Server
      </button>
    </div>
  );
}

export default function ServersPage() {
  const [page, setPage] = useState<string>("all-servers");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const { setSidebarContent } = useSidebar();

  function refreshServers() {
    getServers()
      .then(setServers)
      .catch((e) => console.error("Error fetching servers:", e));
  }

  useEffect(() => {
    refreshServers();
    const interval = setInterval(() => refreshServers(), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  useEffect(() => {
    setSidebarContent(
      <ServersSidebar
        setPage={setPage}
        onAddServer={() => setIsCreateModalOpen(true)}
        onRemoveServer={() => setIsDeleteModalOpen(true)}
      />,
    );
  }, [page]);

  return (
    <div className="p-8">
      {page === "all-servers" && <AllServers servers={servers} />}

      <AddServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        refreshServers={refreshServers}
      />

      <RemoveServerModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        refreshServers={refreshServers}
      />
    </div>
  );
}
