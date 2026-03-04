import { Server } from "@/shared/models/Server";
import { GrStatusCritical, GrStatusInfo, GrStatusGood } from "react-icons/gr";
import { useSelectedServer } from "@/context/SelectedServerContext";
import { useNavigate } from "react-router-dom";

export default function AllServers({ servers }: { servers: Server[] }) {
  const { setSelectedServerId, selectedServerId } = useSelectedServer();
  const navigate = useNavigate();

  return (
    <div className="p-8 h-full">
      {servers.length === 0 ? (
        <p className="text-center text-text-500">No servers found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div
              key={server.id}
              className="border border-border border-primary-300 flex rounded p-4"
            >
              <div className="flex items-center pr-5 pl-2">
                {server.status === "stopped" ? (
                  <GrStatusCritical className="text-red-500 text-5xl" />
                ) : server.status === "starting" ||
                  server.status === "stopping" ? (
                  <GrStatusInfo className="text-yellow-500 text-5xl" />
                ) : (
                  <GrStatusGood className="text-green-500 text-5xl" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-900">
                  {server.name}
                </h2>
                <p className="text-text-500">{server.game}</p>
              </div>
              <button
                className={`ml-auto flex items-center mr-5 cursor-pointer py-1 px-5 rounded-2xl hover:text-text-900 transition-all duration-150 disabled:cursor-not-allowed ${
                  selectedServerId === server.id
                    ? "bg-primary-700"
                    : "bg-background-100 text-text-500"
                }`}
                disabled={selectedServerId === server.id}
                onClick={() => {
                  setSelectedServerId(server.id);
                  navigate(`/server/${server.id}`);
                }}
              >
                {selectedServerId === server.id ? (
                  <span>Selected</span>
                ) : (
                  <span>Select</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
