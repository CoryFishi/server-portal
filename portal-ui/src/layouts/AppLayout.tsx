import { Outlet } from "react-router-dom";
import Navbar from "@components/shared/navbar/Navbar";
import PageContainer from "@components/shared/page-container/PageContainer";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function Layout() {
  const { isSidebarOpen, setIsSidebarOpen, sidebarContent } = useSidebar();

  const sidebar = (
    <div
      className={`flex flex-col h-full transition-all duration-300 bg-background-100 border-r border-background-200 text-text-800 shrink-0 ${
        isSidebarOpen ? "w-64" : "w-0"
      } overflow-hidden`}
    >
      <div className="p-2 w-64 shrink-0">{sidebarContent}</div>
    </div>
  );

  const navbar = (
    <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
  );

  return (
    <PageContainer sidebar={sidebar} navbar={navbar} content={<Outlet />} />
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <Layout />
    </SidebarProvider>
  );
}
