import { useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

type ServerStatus = "running" | "stopped";

type ServerRow = {
    id: string;
    name: string;
    status: ServerStatus;
};

type LogLineMsg = {
    id: string;   // server id
    line: string; // log line
};

export default function App() {
    const [servers, setServers] = useState<ServerRow[]>([]);
    const [selectedId, setSelectedId] = useState<string>("minecraft");
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const connRef = useRef<signalR.HubConnection | null>(null);
    const lastSelectedRef = useRef<string | null>(null);

    const selected = useMemo(
        () => servers.find((s) => s.id === selectedId),
        [servers, selectedId]
    );

    async function refreshServers() {
        setErr(null);
        const res = await fetch("/api/servers");
        if (!res.ok) throw new Error(`GET /api/servers failed (${res.status})`);
        const data = (await res.json()) as ServerRow[];
        setServers(data);
        if (data.length && !data.some((s) => s.id === selectedId)) {
            setSelectedId(data[0].id);
        }
    }

    async function startServer(id: string) {
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch(`/api/servers/${id}/start`, { method: "POST" });
            if (!res.ok) throw new Error(`Start failed (${res.status})`);
            await refreshServers();
            setLogs([]);
        } catch (e: any) {
            setErr(e?.message ?? "Start failed");
        } finally {
            setLoading(false);
        }
    }

    async function stopServer(id: string) {
        setLoading(true);
        setErr(null);
        try {
            const res = await fetch(`/api/servers/${id}/stop`, { method: "POST" });
            if (!res.ok) throw new Error(`Stop failed (${res.status})`);
            await refreshServers();
        } catch (e: any) {
            setErr(e?.message ?? "Stop failed");
        } finally {
            setLoading(false);
        }
    }

    async function connectLogs() {
        if (connRef.current) return;

        const conn = new signalR.HubConnectionBuilder()
            .withUrl("/hubs/logs")
            .withAutomaticReconnect()
            .build();

        conn.on("logLine", (msg: LogLineMsg) => {
            setLogs((prev) => {
                const next = [...prev, msg.line];
                if (next.length > 500) next.splice(0, next.length - 500);
                return next;
            });
        });

        await conn.start();
        connRef.current = conn;
    }

    async function joinServerLogs(serverId: string) {
        const conn = connRef.current;
        if (!conn) return;

        if (lastSelectedRef.current && lastSelectedRef.current !== serverId) {
            try {
                await conn.invoke("LeaveServer", lastSelectedRef.current);
            } catch {
                // ignore
            }
        }

        await conn.invoke("JoinServer", serverId);
        lastSelectedRef.current = serverId;
    }

    useEffect(() => {
        refreshServers().catch((e) => setErr(e?.message ?? "Failed to load servers"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        connectLogs().catch((e) => setErr(e?.message ?? "Failed to connect logs"));
        return () => {
            connRef.current?.stop().catch(() => { });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedId) return;
        setLogs([]);
        joinServerLogs(selectedId).catch((e) =>
            setErr(e?.message ?? "Failed to join log group")
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    return (
        <div style={{ 
            minHeight: "100vh",
            minWidth: "100vw",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "24px",
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
        }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ 
                    background: "rgba(255, 255, 255, 0.95)", 
                    borderRadius: 16, 
                    padding: 32,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
                }}>
                    <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 12, 
                        marginBottom: 32,
                        paddingBottom: 24,
                        borderBottom: "2px solid #e0e0e0"
                    }}>
                        <div style={{ 
                            width: 48, 
                            height: 48, 
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            borderRadius: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24
                        }}>🎮</div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 28, color: "#1a1a1a" }}>Minecraft Server Portal</h1>
                            <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: 14 }}>Manage your modded servers with ease</p>
                        </div>
                    </div>

                    {err && (
                        <div style={{ 
                            padding: 16, 
                            border: "2px solid #ef4444", 
                            background: "#fef2f2", 
                            borderRadius: 12,
                            marginBottom: 24,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            animation: "slideIn 0.3s ease-out"
                        }}>
                            <span style={{ fontSize: 20 }}>⚠️</span>
                            <span style={{ color: "#dc2626", fontWeight: 500 }}>{err}</span>
                        </div>
                    )}

                    <div style={{ display: "flex", gap: 24 }}>
                        {/* Left: servers list */}
                        <div style={{ width: 380 }}>
                            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", justifyContent: "space-between" }}>
                                <h3 style={{ margin: 0, fontSize: 18, color: "#1a1a1a" }}>Your Servers</h3>
                                <button 
                                    onClick={() => refreshServers().catch(() => { })} 
                                    disabled={loading}
                                    style={{
                                        padding: "8px 16px",
                                        border: "none",
                                        borderRadius: 8,
                                        background: loading ? "#e0e0e0" : "#667eea",
                                        color: "white",
                                        cursor: loading ? "not-allowed" : "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        transition: "all 0.2s",
                                        opacity: loading ? 0.6 : 1
                                    }}
                                >
                                    🔄 Refresh
                                </button>
                            </div>

                            <div style={{ 
                                border: "2px solid #e0e0e0", 
                                borderRadius: 12, 
                                overflow: "hidden",
                                background: "white"
                            }}>
                                {servers.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedId(s.id)}
                                        style={{
                                            padding: 16,
                                            cursor: "pointer",
                                            background: s.id === selectedId ? "linear-gradient(135deg, #667eea15, #764ba215)" : "white",
                                            borderBottom: "1px solid #f0f0f0",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            transition: "all 0.2s",
                                            borderLeft: s.id === selectedId ? "4px solid #667eea" : "4px solid transparent"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (s.id !== selectedId) {
                                                e.currentTarget.style.background = "#f9fafb";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (s.id !== selectedId) {
                                                e.currentTarget.style.background = "white";
                                            }
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a1a" }}>{s.name}</div>
                                            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{s.id}</div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                padding: "6px 12px",
                                                borderRadius: 999,
                                                background: s.status === "running" ? "#10b981" : "#6b7280",
                                                color: "white",
                                                fontWeight: 600,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px"
                                            }}
                                        >
                                            {s.status === "running" ? "🟢 Online" : "⚫ Offline"}
                                        </span>
                                    </div>
                                ))}
                                {!servers.length && (
                                    <div style={{ 
                                        padding: 32, 
                                        textAlign: "center", 
                                        color: "#999",
                                        fontSize: 14
                                    }}>
                                        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                                        No servers found
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                                <button
                                    onClick={() => selected && startServer(selected.id)}
                                    disabled={loading || !selected}
                                    style={{
                                        flex: 1,
                                        padding: "12px 20px",
                                        border: "none",
                                        borderRadius: 10,
                                        background: (loading || !selected) ? "#e0e0e0" : "linear-gradient(135deg, #10b981, #059669)",
                                        color: "white",
                                        cursor: (loading || !selected) ? "not-allowed" : "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        transition: "all 0.2s",
                                        boxShadow: (loading || !selected) ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)"
                                    }}
                                >
                                    ▶️ Start Server
                                </button>
                                <button
                                    onClick={() => selected && stopServer(selected.id)}
                                    disabled={loading || !selected}
                                    style={{
                                        flex: 1,
                                        padding: "12px 20px",
                                        border: "none",
                                        borderRadius: 10,
                                        background: (loading || !selected) ? "#e0e0e0" : "linear-gradient(135deg, #ef4444, #dc2626)",
                                        color: "white",
                                        cursor: (loading || !selected) ? "not-allowed" : "pointer",
                                        fontWeight: 600,
                                        fontSize: 14,
                                        transition: "all 0.2s",
                                        boxShadow: (loading || !selected) ? "none" : "0 4px 12px rgba(239, 68, 68, 0.3)"
                                    }}
                                >
                                    ⏹️ Stop Server
                                </button>
                            </div>

                            {/* Add New Modpack Section */}
                            <div style={{ 
                                marginTop: 24, 
                                padding: 20, 
                                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", 
                                borderRadius: 12, 
                                border: "2px solid #10b981",
                                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)"
                            }}>
                                <h4 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 20 }}>📦</span> Add New Modpack
                                </h4>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formElement = e.target as HTMLFormElement;
                            const modpackId = (formElement.elements.namedItem("modpackId") as HTMLInputElement).value;
                            const fileInput = formElement.elements.namedItem("file") as HTMLInputElement;
                            const file = fileInput.files?.[0];

                            if (!modpackId || !file) {
                                setErr("Please enter modpack ID and select a file");
                                return;
                            }

                            setLoading(true);
                            setErr(null);

                            const formData = new FormData();
                            formData.append("modpackId", modpackId);
                            formData.append("file", file);
                            formData.append("modpackName", (formElement.elements.namedItem("modpackName") as HTMLInputElement).value);
                            formData.append("minecraftVersion", (formElement.elements.namedItem("minecraftVersion") as HTMLInputElement).value);
                            formData.append("modLoader", (formElement.elements.namedItem("modLoader") as HTMLSelectElement).value);
                            formData.append("memory", (formElement.elements.namedItem("memory") as HTMLInputElement).value);

                            try {
                                const res = await fetch("/api/upload", {
                                    method: "POST",
                                    body: formData,
                                });

                                if (res.status === 409) {
                                    const data = await res.json();
                                    const confirmOverwrite = window.confirm(
                                        `⚠️ Modpack '${modpackId}' already has ${data.existingFiles} files.\n\nOverwriting will DELETE all existing files!\n\nAre you sure?`
                                    );

                                    if (confirmOverwrite) {
                                        formData.append("force", "true");
                                        const retryRes = await fetch("/api/upload", {
                                            method: "POST",
                                            body: formData,
                                        });

                                        if (!retryRes.ok) {
                                            const retryData = await retryRes.json();
                                            throw new Error(retryData.error || "Upload failed");
                                        }

                                        const retryData = await retryRes.json();
                                        const nestingMsg = retryData.nestingFixed 
                                            ? `\n🔧 Fixed ${retryData.nestingLevelsRemoved} level(s) of folder nesting` 
                                            : '';
                                        const versionInfo = retryData.modLoaderVersionDetected 
                                            ? `\n🔍 Detected mod loader version: ${retryData.modLoaderVersionDetected}` 
                                            : '\n⚠️ Could not auto-detect version - will use latest';
                                        alert(`✅ ${retryData.message}${nestingMsg}${versionInfo}\n\nNext steps:\n1. Restart backend\n2. Start the server`);
                                        formElement.reset();
                                    }
                                    return;
                                }

                                if (!res.ok) {
                                    const data = await res.json();
                                    throw new Error(data.error || "Upload failed");
                                }

                                const data = await res.json();
                                const versionInfo = data.modLoaderVersionDetected 
                                    ? `\n🔍 Detected mod loader version: ${data.modLoaderVersionDetected}` 
                                    : '\n⚠️ Could not auto-detect version - will use latest';
                                alert(`✅ ${data.message}${versionInfo}\n\nNext steps:\n1. Restart backend\n2. Start the server`);
                                formElement.reset();
                            } catch (err: any) {
                                setErr(err?.message ?? "Upload failed");
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                                    Modpack ID (e.g., "mc_atm10"):
                                </label>
                                <input
                                    type="text"
                                    name="modpackId"
                                    placeholder="mc_atm10"
                                    disabled={loading}
                                    style={{ 
                                        width: "100%", 
                                        padding: "10px 12px", 
                                        fontSize: 14, 
                                        borderRadius: 8, 
                                        border: "2px solid #d1d5db",
                                        outline: "none",
                                        transition: "border-color 0.2s"
                                    }}
                                    pattern="mc_[a-z0-9_]+"
                                    title="Must start with 'mc_' and contain only lowercase letters, numbers, and underscores"
                                    required
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
                                />
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                                    Display Name:
                                </label>
                                <input
                                    type="text"
                                    name="modpackName"
                                    placeholder="All The Mods 10"
                                    disabled={loading}
                                    style={{ 
                                        width: "100%", 
                                        padding: "10px 12px", 
                                        fontSize: 14, 
                                        borderRadius: 8, 
                                        border: "2px solid #d1d5db",
                                        outline: "none",
                                        transition: "border-color 0.2s"
                                    }}
                                    required
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                                        Minecraft Version:
                                    </label>
                                    <input
                                        type="text"
                                        name="minecraftVersion"
                                        placeholder="1.21.1"
                                        disabled={loading}
                                        style={{ 
                                            width: "100%", 
                                            padding: "10px 12px", 
                                            fontSize: 14, 
                                            borderRadius: 8, 
                                            border: "2px solid #d1d5db",
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        required
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                                        onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                                        Memory:
                                    </label>
                                    <input
                                        type="text"
                                        name="memory"
                                        placeholder="10G"
                                        disabled={loading}
                                        style={{ 
                                            width: "100%", 
                                            padding: "10px 12px", 
                                            fontSize: 14, 
                                            borderRadius: 8, 
                                            border: "2px solid #d1d5db",
                                            outline: "none",
                                            transition: "border-color 0.2s"
                                        }}
                                        required
                                        onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                                        onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                                    Mod Loader:
                                </label>
                                <select
                                    name="modLoader"
                                    disabled={loading}
                                    style={{ 
                                        width: "100%", 
                                        padding: "10px 12px", 
                                        fontSize: 14, 
                                        borderRadius: 8, 
                                        border: "2px solid #d1d5db",
                                        outline: "none",
                                        transition: "border-color 0.2s",
                                        cursor: "pointer"
                                    }}
                                    required
                                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                                    onBlur={(e) => e.currentTarget.style.borderColor = "#d1d5db"}
                                >
                                    <option value="NEOFORGE">NeoForge</option>
                                    <option value="FORGE">Forge</option>
                                    <option value="FABRIC">Fabric</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>
                                    Modpack Server Files (.zip):
                                </label>
                                <input
                                    type="file"
                                    name="file"
                                    accept=".zip"
                                    disabled={loading}
                                    style={{ 
                                        width: "100%",
                                        padding: "10px 12px",
                                        fontSize: 14,
                                        borderRadius: 8,
                                        border: "2px solid #d1d5db",
                                        background: "white",
                                        cursor: "pointer"
                                    }}
                                    required
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading} 
                                style={{ 
                                    width: "100%", 
                                    padding: "12px 20px", 
                                    fontSize: 15, 
                                    fontWeight: 600,
                                    border: "none",
                                    borderRadius: 10,
                                    background: loading ? "#d1d5db" : "linear-gradient(135deg, #10b981, #059669)",
                                    color: "white",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    transition: "all 0.2s",
                                    boxShadow: loading ? "none" : "0 4px 12px rgba(16, 185, 129, 0.3)"
                                }}
                            >
                                {loading ? "⏳ Uploading..." : "📤 Upload & Extract"}
                            </button>
                        </form>
                        <div style={{ 
                            fontSize: 12, 
                            color: "#065f46", 
                            marginTop: 12, 
                            lineHeight: 1.6,
                            background: "rgba(255, 255, 255, 0.6)",
                            padding: 12,
                            borderRadius: 8
                        }}>
                            <div>💡 Uploads to <code style={{ 
                                background: "rgba(16, 185, 129, 0.1)", 
                                padding: "2px 6px", 
                                borderRadius: 4,
                                fontWeight: 600 
                            }}>data/[modpackId]/</code></div>
                            <div>🔍 Mod loader version auto-detected</div>
                            <div>✅ Just restart backend after upload</div>
                        </div>
                    </div>

                    {selected && (
                        <div style={{ 
                            marginTop: 20, 
                            padding: 16, 
                            background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
                            borderRadius: 12,
                            fontSize: 14,
                            border: "2px solid #d1d5db"
                        }}>
                            <div style={{ color: "#6b7280", marginBottom: 4 }}>Currently Selected:</div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{selected.name}</div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{selected.id}</div>
                            <div style={{ 
                                marginTop: 8,
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: selected.status === "running" ? "#d1fae5" : "#f3f4f6",
                                color: selected.status === "running" ? "#065f46" : "#6b7280",
                                fontWeight: 600,
                                fontSize: 12,
                                display: "inline-block"
                            }}>
                                Status: {selected.status === "running" ? "🟢 Running" : "⚫ Stopped"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: logs */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 18, color: "#1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 20 }}>📜</span> Server Logs
                        </h3>
                        <button 
                            onClick={() => setLogs([])} 
                            disabled={!logs.length}
                            style={{
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: 8,
                                background: !logs.length ? "#e0e0e0" : "#ef4444",
                                color: "white",
                                cursor: !logs.length ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                fontSize: 14,
                                transition: "all 0.2s",
                                opacity: !logs.length ? 0.6 : 1
                            }}
                        >
                            🗑️ Clear
                        </button>
                    </div>

                    <div
                        style={{
                            height: 680,
                            border: "2px solid #1f2937",
                            borderRadius: 12,
                            padding: 16,
                            overflow: "auto",
                            background: "linear-gradient(135deg, #0f172a, #1e293b)",
                            color: "#e2e8f0",
                            fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
                            fontSize: 13,
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)"
                        }}
                    >
                        {logs.length ? logs.join("\n") : (
                            <div style={{ 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                height: "100%",
                                color: "#64748b"
                            }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                                <div style={{ fontSize: 15 }}>No logs yet...</div>
                                <div style={{ fontSize: 13, marginTop: 8 }}>Start a server to see logs here</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
                </div></div></div>
    );
}
