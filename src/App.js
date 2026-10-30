import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProfileProvider } from './context/ProfileContext';
import { AgentProvider } from './components/Agent/AgentContext';
import { TerminalLayout } from './components/Layout/TerminalLayout';
import FloatingDock from './components/Agent/FloatingDock';

// 5-Section Narrative Layout
import Hero from './components/Sections/Hero';
import Projects from './components/Sections/Projects';
import Experience from './components/Sections/Experience';
import Skills from './components/Sections/Skills';
import Certificates from './components/Sections/Certificates';
import Contact from './components/Sections/Contact';

// Dedicated Archive Page
import Archive from './pages/Archive';

// 404 Not Found Page
import NotFound from './pages/NotFound';

// SEO Route Metadata Synchronizer
import SeoHead from './components/Common/SeoHead';

// Admin Panel Routes
import AdminLayout from './pages/Admin/AdminLayout';
import Login from './pages/Admin/Login';

function HomePage() {
  return (
    <>
      {/* 1. Mission Control Hero */}
      <Hero />
      {/* 2. Featured Work / Artifacts */}
      <Projects />
      {/* 3. System Evolution / Timeline */}
      <Experience />
      {/* 4. Capabilities & Technical Arsenal */}
      <Skills />
      {/* 5. Credentials & Direct Link Handshake */}
      <Certificates />
      <Contact />
    </>
  );
}

function App() {
  return (
    <ProfileProvider>
      <AgentProvider>
        <BrowserRouter>
          <SeoHead />
          <Routes>
            {/* Public 5-Section Narrative Homepage */}
            <Route
              path="/"
              element={
                <TerminalLayout>
                  <HomePage />
                </TerminalLayout>
              }
            />

            {/* Dedicated Archive Route */}
            <Route path="/archive" element={<Archive />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/*" element={<AdminLayout />} />

            {/* 404 Catch-All Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <FloatingDock />
        </BrowserRouter>
      </AgentProvider>
    </ProfileProvider>
  );
}

export default App;