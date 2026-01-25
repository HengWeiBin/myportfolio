import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';
import { TerminalLayout } from './components/Layout/TerminalLayout';
// Sections
import Hero from './components/Sections/Hero';
import Skills from './components/Sections/Skills';
import Projects from './components/Sections/Projects';
import Experience from './components/Sections/Experience';
import Certificates from './components/Sections/Certificates';
import Contact from './components/Sections/Contact';

// Admin
import AdminLayout from './pages/Admin/AdminLayout'; // To be created
import Login from './pages/Admin/Login'; // To be created


function HomePage() {
    return (
        <>
            <Hero />
            <Skills />
            <Projects />
            <Experience />
            <Certificates />
            <Contact />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <GlobalStyles />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={
                    <TerminalLayout>
                        <HomePage />
                    </TerminalLayout>
                } />

                {/* Admin Routes - Placeholder for now until next step */}
                <Route path="/admin/login" element={<Login />} />
                <Route path="/admin/*" element={<AdminLayout />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;