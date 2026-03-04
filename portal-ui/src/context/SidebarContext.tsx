import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarContextType = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarContent: ReactNode;
  setSidebarContent: (content: ReactNode) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<ReactNode>(null);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        sidebarContent,
        setSidebarContent,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
  return ctx;
}
