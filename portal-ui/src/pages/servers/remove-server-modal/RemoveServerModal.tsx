import { useEffect, useState } from "react";
import ModalContainer from "@components/shared/modal-container/ModalContainer";
import { RiServerLine, RiAlertLine } from "react-icons/ri";
import { Server } from "@/shared/models/Server";

type Stage = "select" | "confirm";

export default function RemoveServerModal({
  isOpen,
  onClose,
  refreshServers,
}: {
  isOpen: boolean;
  onClose: () => void;
  refreshServers: () => void;
}) {
  const [servers, setServers] = useState<Server[]>([]);
  const [selected, setSelected] = useState<Server | null>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFetching(true);
    setErr(null);
    fetch("/api/servers")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load servers");
        return r.json() as Promise<Server[]>;
      })
      .then(setServers)
      .catch((e) => setErr(e?.message ?? "Failed to load servers"))
      .finally(() => setFetching(false));
  }, [isOpen]);

  function reset() {
    setSelected(null);
    setStage("select");
    setErr(null);
    setServers([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleRemove() {
    if (!selected) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/servers/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      refreshServers();
      handleClose();
    } catch (e: any) {
      setErr(e?.message ?? "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  const selectFooter = (
    <>
      <button
        onClick={handleClose}
        className="px-4 py-2 rounded-md text-text-700 hover:bg-background-100 transition-all duration-150 cursor-pointer"
      >
        Cancel
      </button>
      <button
        disabled={!selected}
        onClick={() => setStage("confirm")}
        className="px-4 py-2 rounded-md bg-accent-500 text-white hover:bg-accent-600 transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </>
  );

  const confirmFooter = (
    <>
      <button
        onClick={() => {
          setStage("select");
          setErr(null);
        }}
        disabled={loading}
        className="px-4 py-2 rounded-md text-text-700 hover:bg-background-100 transition-all duration-150 cursor-pointer"
      >
        Back
      </button>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-accent-500 text-white hover:bg-accent-600 transition-all duration-150 cursor-pointer disabled:opacity-50"
      >
        {loading ? "Removing…" : "Remove Server"}
      </button>
    </>
  );

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={handleClose}
      title="Remove Game Server"
      size="md"
      footer={stage === "select" ? selectFooter : confirmFooter}
    >
      {err && (
        <p className="text-sm text-accent-600 bg-accent-50 border border-accent-200 rounded-md px-3 py-2 mb-4">
          {err}
        </p>
      )}

      {stage === "select" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-600 mb-2">
            Select the server you want to remove.
          </p>

          {fetching && (
            <p className="text-sm text-text-500 text-center py-6">
              Loading servers…
            </p>
          )}

          {!fetching && servers.length === 0 && !err && (
            <p className="text-sm text-text-500 text-center py-6">
              No servers found.
            </p>
          )}

          {!fetching &&
            servers.map((s) => {
              const isSelected = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-accent-400 bg-accent-50 text-accent-700"
                      : "border-background-200 bg-background-100 text-text-800 hover:border-background-300 hover:bg-background-150"
                  }`}
                >
                  <RiServerLine className="text-xl shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{s.name}</span>
                    <span className="text-xs text-text-500 truncate">
                      {s.id}
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {stage === "confirm" && selected && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-accent-200 bg-accent-50">
            <RiAlertLine className="text-2xl text-accent-500 shrink-0" />
            <p className="text-sm text-accent-700">
              This will permanently delete the server and all its files. This
              action cannot be undone.
            </p>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-background-200 bg-background-100">
            <RiServerLine className="text-xl text-text-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-text-900 truncate">
                {selected.name}
              </span>
              <span className="text-xs text-text-500 truncate">
                {selected.id}
              </span>
            </div>
          </div>
        </div>
      )}
    </ModalContainer>
  );
}
