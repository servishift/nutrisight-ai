import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Analyzer from "./pages/Analyzer";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOTPPage from "./pages/auth/VerifyOTPPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import BatchUploadPage from "./pages/BatchUploadPage";
import AdditiveDatabasePage from "./pages/AdditiveDatabasePage";
import PricingPage from "./pages/PricingPage";
import SimilaritySearchPage from "./pages/SimilaritySearchPage";
import BrandPredictionPage from "./pages/BrandPredictionPage";
import ReformulationPage from "./pages/ReformulationPage";
import EmbeddingsPage from "./pages/EmbeddingsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Admin
import { AdminAuthProvider } from "./admin/contexts/AdminAuthContext";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import AdminLayout from "./admin/layouts/AdminLayout";
import AdminLoginPage from "./admin/pages/AdminLoginPage";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUsersPage from "./admin/pages/AdminUsersPage";
import AdminAdditivesPage from "./admin/pages/AdminAdditivesPage";
import AdminAnalyticsPage from "./admin/pages/AdminAnalyticsPage";
import AdminAuditLogsPage from "./admin/pages/AdminAuditLogsPage";
import AdminSettingsPage from "./admin/pages/AdminSettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/analyzer" element={<Analyzer />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOTPPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Auth-gated routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/batch" element={<ProtectedRoute><BatchUploadPage /></ProtectedRoute>} />
            <Route path="/additives" element={<ProtectedRoute><AdditiveDatabasePage /></ProtectedRoute>} />
            <Route path="/similarity" element={<ProtectedRoute><SimilaritySearchPage /></ProtectedRoute>} />
            <Route path="/brand-prediction" element={<ProtectedRoute><BrandPredictionPage /></ProtectedRoute>} />
            <Route path="/reformulation" element={<ProtectedRoute><ReformulationPage /></ProtectedRoute>} />
            <Route path="/embeddings" element={<ProtectedRoute><EmbeddingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* ─── Admin Portal ─── */}
            <Route path="/admin/login" element={
              <AdminAuthProvider><AdminLoginPage /></AdminAuthProvider>
            } />
            <Route path="/admin" element={
              <AdminAuthProvider>
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              </AdminAuthProvider>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="additives" element={<AdminAdditivesPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
