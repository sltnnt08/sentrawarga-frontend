import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./hooks/use-theme";
import Index from "./pages/Index.tsx";
import Masuk from "./pages/Masuk.tsx";
import Daftar from "./pages/Daftar.tsx";
import LupaPassword from "./pages/LupaPassword.tsx";
import VerifikasiEmail from "./pages/VerifikasiEmail.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import GuestRoute from "./components/GuestRoute.tsx";
import AdminRoute from "./components/AdminRoute.tsx";
import AuthRoute from "./components/AuthRoute.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminTindakLaporan from "./pages/AdminTindakLaporan.tsx";
import UploadLaporan from "./pages/UploadLaporan.tsx";
import LaporanSaya from "./pages/LaporanSaya.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Analytics />
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/masuk"
              element={(
                <GuestRoute>
                  <Masuk />
                </GuestRoute>
              )}
            />
            <Route
              path="/daftar"
              element={(
                <GuestRoute>
                  <Daftar />
                </GuestRoute>
              )}
            />
            <Route path="/lupa-password" element={<LupaPassword />} />
            <Route path="/verifikasi-email" element={<VerifikasiEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/admin"
              element={(
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              )}
            />
            <Route
              path="/admin/laporan/:id/tindak"
              element={(
                <AdminRoute>
                  <AdminTindakLaporan />
                </AdminRoute>
              )}
            />
            <Route
              path="/lapor"
              element={(
                <AuthRoute>
                  <UploadLaporan />
                </AuthRoute>
              )}
            />
            <Route
              path="/laporan-saya"
              element={(
                <AuthRoute>
                  <LaporanSaya />
                </AuthRoute>
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
