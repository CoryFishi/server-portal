import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/home/Home";
import ServersPage from "./pages/servers/ServersPage";
import ServerPage from "./pages/server/ServerPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/server/*" element={<ServerPage />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
