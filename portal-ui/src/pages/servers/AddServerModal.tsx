import { useRef, useState } from "react";
import ModalContainer from "@components/shared/modal-container/ModalContainer";

type CreateServerForm = {
  modpackId: string;
  modpackName: string;
  minecraftVersion: string;
  modLoader: string;
  memory: string;
};

const defaultForm: CreateServerForm = {
  modpackId: "",
  modpackName: "",
  minecraftVersion: "",
  modLoader: "forge",
  memory: "4G",
};

export default function AddServerModal({
  isOpen,
  onClose,
  refreshServers,
}: {
  isOpen: boolean;
  onClose: () => void;
  refreshServers: () => void;
}) {
  const [form, setForm] = useState<CreateServerForm>(defaultForm);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setForm(defaultForm);
    setFile(null);
    setErr(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function set(field: keyof CreateServerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    if (
      !form.modpackId ||
      !form.modpackName ||
      !form.minecraftVersion ||
      !file
    ) {
      setErr("Please fill in all fields and select a modpack zip file.");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("modpackId", form.modpackId);
      fd.append("modpackName", form.modpackName);
      fd.append("minecraftVersion", form.minecraftVersion);
      fd.append("modLoader", form.modLoader);
      fd.append("memory", form.memory);
      fd.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: fd });

      if (res.status === 409) {
        const data = await res.json();
        const confirmOverwrite = window.confirm(
          `Modpack '${form.modpackId}' already has ${data.existingFiles} files.\n\nOverwriting will DELETE all existing files. Continue?`,
        );
        if (!confirmOverwrite) {
          setLoading(false);
          return;
        }
        fd.append("force", "true");
        const retry = await fetch("/api/upload", { method: "POST", body: fd });
        if (!retry.ok)
          throw new Error((await retry.json()).error ?? "Upload failed");
      } else if (!res.ok) {
        throw new Error((await res.json()).error ?? "Upload failed");
      }
      refreshServers();
      handleClose();
    } catch (e: any) {
      setErr(e?.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-md bg-background-100 border border-background-200 text-text-900 placeholder:text-text-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all duration-150";
  const labelClass = "block text-sm font-medium text-text-700 mb-1";

  return (
    <ModalContainer
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Game Server"
      size="md"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-text-700 hover:bg-background-100 transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Add Server"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {err && (
          <p className="text-sm text-accent-600 bg-accent-50 border border-accent-200 rounded-md px-3 py-2">
            {err}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Server ID</label>
            <input
              className={inputClass}
              placeholder="e.g. my-modpack"
              value={form.modpackId}
              onChange={(e) => set("modpackId", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Server Name</label>
            <input
              className={inputClass}
              placeholder="e.g. My Modpack"
              value={form.modpackName}
              onChange={(e) => set("modpackName", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Minecraft Version</label>
            <input
              className={inputClass}
              placeholder="e.g. 1.20.1"
              value={form.minecraftVersion}
              onChange={(e) => set("minecraftVersion", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Mod Loader</label>
            <select
              className={inputClass}
              value={form.modLoader}
              onChange={(e) => set("modLoader", e.target.value)}
            >
              <option value="forge">Forge</option>
              <option value="fabric">Fabric</option>
              <option value="neoforge">NeoForge</option>
              <option value="vanilla">Vanilla</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Memory</label>
          <input
            className={inputClass}
            placeholder="e.g. 4G"
            value={form.memory}
            onChange={(e) => set("memory", e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Modpack ZIP</label>
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className={`${inputClass} cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-background-200 file:text-text-700 file:cursor-pointer`}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </ModalContainer>
  );
}
