import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { ProfileProvider } from './context/ProfileContext';
import { TerminalLayout } from './components/Layout/TerminalLayout';

// 5-Section Narrative Layout
import Hero from './components/Sections/Hero';
import Projects from './components/Sections/Projects';
import Experience from './components/Sections/Experience';
import Skills from './components/Sections/Skills';
import Certificates from './components/Sections/Certificates';
import Contact from './components/Sections/Contact';

// Dedicated Archive Page
import Archive from './pages/Archive';

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
      <BrowserRouter>
        <GlobalStyles />
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
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}

export default App;