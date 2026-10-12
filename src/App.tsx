import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FinancialProvider } from './context/FinancialContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { OnboardingPage } from './pages/auth/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyMoneyPage } from './pages/MyMoneyPage';
import { InsightsPage } from './pages/InsightsPage';
import { PassportPage } from './pages/PassportPage';
import { SharedPassportViewPage } from './pages/SharedPassportViewPage';
import { DocumentsPage } from './pages/DocumentsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FinancialProvider>
          <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/passport/shared/:token" element={<SharedPassportViewPage />} />

                {/* Protected application routes */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-money"
                  element={
                    <ProtectedRoute>
                      <MyMoneyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <ProtectedRoute>
                      <InsightsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/passport"
                  element={
                    <ProtectedRoute>
                      <PassportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/documents"
                  element={
                    <ProtectedRoute>
                      <DocumentsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </FinancialProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
