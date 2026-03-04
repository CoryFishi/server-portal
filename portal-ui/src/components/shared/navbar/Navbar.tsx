import {
  RiMenuFold3Fill,
  RiMenuUnfold3Fill,
  RiMoonFill,
  RiSunFill,
} from "react-icons/ri";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelectedServer } from "@/context/SelectedServerContext";

export default function Navbar({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (isOpen: boolean) => void;
}) {
  const { selectedServerId, selectedServer } = useSelectedServer();
  const [themeDark, setThemeDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored) return stored === "dark";
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (themeDark) root.setAttribute("data-theme", "dark");
      else root.removeAttribute("data-theme");
      localStorage.setItem("theme", themeDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [themeDark]);

  function toggleTheme() {
    setThemeDark((v) => !v);
  }

  return (
    <div className="flex justify-between px-4 w-full h-14 items-center bg-background-50 text-text-900 border-b border-background-200 shrink-0">
      {setIsSidebarOpen && isSidebarOpen !== undefined ? (
        <button
          className="p-2 cursor-pointer hover:bg-background-100 rounded-md transition-all duration-200"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? (
            <RiMenuFold3Fill className="text-2xl" />
          ) : (
            <RiMenuUnfold3Fill className="text-2xl" />
          )}
        </button>
      ) : (
        <div className="w-8 h-8">
          {/* Empty element to allow for correct navbar alignment */}
        </div>
      )}
      <NavLink to="/" className="flex gap-2 items-center uppercase">
        <img src="/logo_dark.png" alt="" className="h-10" />
        <h1 className="font-bold text-text-900">Server Portal</h1>
      </NavLink>
      <div className="flex gap-2 p-2 items-center">
        {selectedServerId && (
          <NavLink
            to={`/server/${selectedServerId}`}
            className={({ isActive }) =>
              `py-1 px-2 rounded-md transition-all duration-200 ${
                isActive
                  ? "bg-background-200 text-text-900 font-medium"
                  : "text-text-600 hover:text-text-900 hover:bg-background-100"
              }`
            }
          >
            {selectedServer ? selectedServer.name : "Server"}
            {/* To do: Make Name Change To Server Profile Name */}
          </NavLink>
        )}
        <NavLink
          to="/servers"
          className={({ isActive }) =>
            `py-1 px-2 rounded-md transition-all duration-200 ${
              isActive
                ? "bg-background-200 text-text-900 font-medium"
                : "text-text-600 hover:text-text-900 hover:bg-background-100"
            }`
          }
        >
          Servers
        </NavLink>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="ml-2 p-2 rounded-md hover:bg-background-100 transition-all duration-200"
        >
          {themeDark ? (
            <RiSunFill className="text-lg" />
          ) : (
            <RiMoonFill className="text-lg" />
          )}
        </button>
      </div>
    </div>
  );
}
