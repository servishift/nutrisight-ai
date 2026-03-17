import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { RegionProvider } from "@/contexts/RegionContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState, useEffect } from "react";
import MaintenancePage from "./pages/MaintenancePage";
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
import FrequencyAnalysisPage from "./pages/FrequencyAnalysisPage";
import GraphIntelligencePage from "./pages/GraphIntelligencePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PricingPage from "./pages/PricingPage";
import SimilaritySearchPage from "./pages/SimilaritySearchPage";
import BrandPredictionPage from "./pages/BrandPredictionPage";
import ReformulationPage from "./pages/ReformulationPage";
import EmbeddingsPage from "./pages/EmbeddingsPage";
import NutritionLookupPage from "./pages/NutritionLookupPage";
import IngredientBrowserPage from "./pages/IngredientBrowserPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import ApiPlaygroundPage from "./pages/ApiPlaygroundPage";
import ApiPricingPage from "./pages/ApiPricingPage";
import ApiUsagePage from "./pages/ApiUsagePage";
import WebhooksPage from "./pages/WebhooksPage";
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
import AdminApiKeysPage from "./admin/pages/AdminApiKeysPage";
import AdminReportsPage from "./admin/pages/AdminReportsPage";
import AdminMarketingPage from "./admin/pages/AdminMarketingPage";
import AdminContentPage from "./admin/pages/AdminContentPage";
import AdminWebhooksPage from "./admin/pages/AdminWebhooksPage";
import AdminSubscriptionsPage from "./admin/pages/AdminSubscriptionsPage";
import AdminPricingPage from "./admin/pages/AdminPricingPage";

// Indian Version
import { IndianHome } from "./indian/pages/IndianHome";
import { IndianSearch } from "./indian/pages/IndianSearch";
import { IndianCategories } from "./indian/pages/IndianCategories";
import { IndianPredict } from "./indian/pages/IndianPredict";
import { IndianAnalyzer } from "./indian/pages/IndianAnalyzer";
import TestSwitchingPage from "./pages/TestSwitchingPage";
import MinimalTest from "./pages/MinimalTest";
import { DietEngine } from "./pages/DietEngine/index";

const queryClient = new QueryClient();

const App = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/admin/settings/public`);
      if (response.ok) {
        const data = await response.json();
        const mode = data.maintenanceMode || 'off';
        
        // Admin maintenance locks everyone out
        if (mode === 'admin') {
          setMaintenanceMode(true);
        }
        // Full maintenance only locks users, not admins
        else if (mode === 'full') {
          const isAdminRoute = window.location.pathname.startsWith('/admin');
          setMaintenanceMode(!isAdminRoute);
        }
        // Partial mode handled in components
        else {
          setMaintenanceMode(false);
        }
      }
    } catch (error) {
      console.log('Could not check maintenance mode');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RegionProvider>
        <AuthProvider>
          <SubscriptionProvider>
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
            <Route path="/frequency" element={<ProtectedRoute><FrequencyAnalysisPage /></ProtectedRoute>} />
            <Route path="/graph" element={<ProtectedRoute><GraphIntelligencePage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/similarity" element={<ProtectedRoute><SimilaritySearchPage /></ProtectedRoute>} />
            <Route path="/brand-prediction" element={<ProtectedRoute><BrandPredictionPage /></ProtectedRoute>} />
            <Route path="/reformulation" element={<ProtectedRoute><ReformulationPage /></ProtectedRoute>} />
            <Route path="/embeddings" element={<ProtectedRoute><EmbeddingsPage /></ProtectedRoute>} />
            <Route path="/nutrition-lookup" element={<ProtectedRoute><NutritionLookupPage /></ProtectedRoute>} />
            <Route path="/ingredient-browser" element={<ProtectedRoute><IngredientBrowserPage /></ProtectedRoute>} />
            <Route path="/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
            <Route path="/api-playground" element={<ProtectedRoute><ApiPlaygroundPage /></ProtectedRoute>} />
            <Route path="/api-pricing" element={<ProtectedRoute><ApiPricingPage /></ProtectedRoute>} />
            <Route path="/api-usage" element={<ProtectedRoute><ApiUsagePage /></ProtectedRoute>} />
            <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/diet-engine" element={<ProtectedRoute><DietEngine /></ProtectedRoute>} />

            {/* Test Switching */}
            <Route path="/test-switching" element={<TestSwitchingPage />} />
            <Route path="/minimal-test" element={<MinimalTest />} />

            {/* Indian Version Routes */}
            <Route path="/indian" element={<IndianHome />} />
            <Route path="/indian/search" element={<IndianSearch />} />
            <Route path="/indian/categories" element={<IndianCategories />} />
            <Route path="/indian/category/:category" element={<IndianCategories />} />
            <Route path="/indian/predict" element={<IndianPredict />} />
            <Route path="/indian/analyzer" element={<IndianAnalyzer />} />

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
              <Route path="api-keys" element={<AdminApiKeysPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="marketing" element={<AdminMarketingPage />} />
              <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              <Route path="pricing" element={<AdminPricingPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="webhooks" element={<AdminWebhooksPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </SubscriptionProvider>
        </AuthProvider>
      </RegionProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;




