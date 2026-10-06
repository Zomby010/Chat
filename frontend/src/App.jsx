import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CrisisProvider } from './context/CrisisContext';
import { RedirectIfSignedIn, RequireAuth } from './components/layout/RequireAuth';
import AppShell from './components/layout/AppShell';
import PublicLayout from './components/layout/PublicLayout';
import AdaptiveLayout from './components/layout/AdaptiveLayout';
import { PageLoader } from './components/ui';
import Landing from './pages/Landing';

// Pages are loaded on demand so the first visit downloads less.
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Home = lazy(() => import('./pages/Home'));
const Mood = lazy(() => import('./pages/Mood'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const WellbeingHub = lazy(() => import('./pages/wellbeing/WellbeingHub'));
const Breathing = lazy(() => import('./pages/wellbeing/Breathing'));
const Mindfulness = lazy(() => import('./pages/wellbeing/Mindfulness'));
const Movement = lazy(() => import('./pages/wellbeing/Movement'));
const Sleep = lazy(() => import('./pages/wellbeing/Sleep'));
const Connection = lazy(() => import('./pages/wellbeing/Connection'));
const Plans = lazy(() => import('./pages/wellbeing/Plans'));
const Resources = lazy(() => import('./pages/info/Resources'));
const About = lazy(() => import('./pages/info/About'));
const Privacy = lazy(() => import('./pages/info/Privacy'));
const NotFound = lazy(() => import('./pages/info/NotFound'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
        </Route>

        <Route element={<AdaptiveLayout />}>
          <Route path="resources" element={<Resources />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<Privacy />} />
        </Route>

        <Route path="login" element={<RedirectIfSignedIn><Login /></RedirectIfSignedIn>} />
        <Route path="signup" element={<RedirectIfSignedIn><Signup /></RedirectIfSignedIn>} />
        <Route path="forgot-password" element={<ForgotPassword />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="home" element={<Home />} />
          <Route path="mood" element={<Mood />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:id" element={<Chat />} />
          <Route path="wellbeing" element={<WellbeingHub />} />
          <Route path="wellbeing/breathing" element={<Breathing />} />
          <Route path="wellbeing/mindfulness" element={<Mindfulness />} />
          <Route path="wellbeing/movement" element={<Movement />} />
          <Route path="wellbeing/sleep" element={<Sleep />} />
          <Route path="wellbeing/connection" element={<Connection />} />
          <Route path="wellbeing/plans" element={<Plans />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<Navigate to="/home" replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <CrisisProvider>
              <AppRoutes />
            </CrisisProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
