import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import CategoryPage from './pages/CategoryPage';
import InviteAccess from './pages/InviteAccess';
import InvitePage from './pages/InvitePage';
import EntryPass from './pages/EntryPass';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EventMasterPage from './pages/EventMasterPage';
import EnableTwoFactor from './pages/EnableTwoFactor';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { CMSThemeProvider } from './components/cms/CMSThemeProvider';

export default function App() {
  return (
    <ErrorBoundary>
      <CMSThemeProvider>
        <HashRouter>
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:category_slug" element={<CategoryPage />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="terms-conditions" element={<TermsConditions />} />
            <Route path="invite-access" element={<InviteAccess />} />
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin/enable-2fa" element={
              <ProtectedRoute>
                <EnableTwoFactor />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/events/:eventId" element={
              <ProtectedRoute>
                <EventMasterPage />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="invite/:slug" element={<InvitePage />} />
          <Route path="/pass/:slug" element={<EntryPass />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
     </CMSThemeProvider>
    </ErrorBoundary>
  );
}
