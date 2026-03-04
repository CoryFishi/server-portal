import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Server } from "@/shared/models/Server";

const STORAGE_KEY = "selectedServerId";

type SelectedServerContextValue = {
  selectedServer: Server | null;
  selectedServerId: number | null;
  loading: boolean;
  error: string | null;
  setSelectedServerId: (id: number) => void;
};

const SelectedServerContext = createContext<SelectedServerContextValue | null>(
  null,
);

async function fetchServer(id: number): Promise<Server> {
  const res = await fetch(`/api/servers/${id}`);
  if (!res.ok) throw new Error(`Failed to load server '${id}'`);
  return res.json() as Promise<Server>;
}

export function SelectedServerProvider({ children }: { children: ReactNode }) {
  const [selectedServerId, setSelectedServerIdState] = useState<number | null>(
    () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : null;
    },
  );
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedServerId) {
      setSelectedServer(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchServer(selectedServerId)
      .then(setSelectedServer)
      .catch((e) => {
        setError(e?.message ?? "Failed to load server");
        setSelectedServer(null);
      })
      .finally(() => setLoading(false));
  }, [selectedServerId]);

  function setSelectedServerId(id: number) {
    localStorage.setItem(STORAGE_KEY, id.toString());
    setSelectedServerIdState(id);
  }

  return (
    <SelectedServerContext.Provider
      value={{
        selectedServer,
        selectedServerId,
        loading,
        error,
        setSelectedServerId,
      }}
    >
      {children}
    </SelectedServerContext.Provider>
  );
}

export function useSelectedServer() {
  const ctx = useContext(SelectedServerContext);
  if (!ctx)
    throw new Error(
      "useSelectedServer must be used within a SelectedServerProvider",
    );
  return ctx;
}
