import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';

// --- Styled Components ---

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const NavContainer = styled.nav`
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(18, 18, 18, 0.95);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(5px);
  padding: 1rem 0;
  font-family: var(--font-mono);
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Logo = styled(Link)`
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--success); // Terminal prompt color often green
  text-decoration: none !important;
  
  &:hover {
    text-shadow: 0 0 8px rgba(80, 250, 123, 0.4);
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const NavLinkItem = styled(Link)`
  color: ${props => props.$active ? 'var(--accent)' : 'var(--text-secondary)'};
  position: relative;
  text-decoration: none !important;
  
  &::before {
    content: '>';
    position: absolute;
    left: -15px;
    opacity: ${props => props.$active ? 1 : 0};
    color: var(--accent);
    transition: opacity 0.2s ease;
  }

  &:hover {
    color: var(--text-primary);
    &::before {
      opacity: 0.5;
    }
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding-top: 2rem;
`;

const FooterContainer = styled.footer`
  border-top: 1px solid var(--border-color);
  padding: 2rem 0;
  margin-top: 4rem;
  text-align: center;
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
`;

const ContactLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
  
  a {
    color: var(--text-secondary);
    &:hover {
        color: var(--accent);
    }
  }
`;

// --- Components ---

const Navbar = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Smooth scroll if on home page
  const scrollToSection = (id) => {
    if (!isHome) return;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <NavContainer>
      <NavContent>
        <Logo to="/">
          &gt; root@hengweibin:~$
        </Logo>
        <NavLinks>
          <NavLinkItem to="/" $active={location.pathname === '/' && !location.hash} onClick={() => window.scrollTo(0, 0)}>[Home]</NavLinkItem>
          <NavLinkItem to="/#skills" onClick={() => scrollToSection('skills')}>[Skills]</NavLinkItem>
          <NavLinkItem to="/#projects" onClick={() => scrollToSection('projects')}>[Projects]</NavLinkItem>
          <NavLinkItem to="/#experience" onClick={() => scrollToSection('experience')}>[Experience]</NavLinkItem>
          <NavLinkItem to="/#certificates" onClick={() => scrollToSection('certificates')}>[Certificates]</NavLinkItem>
          <NavLinkItem to="/#contact" onClick={() => scrollToSection('contact')}>[Contact]</NavLinkItem>
        </NavLinks>
      </NavContent>
    </NavContainer>
  );
};

const Footer = () => {
  return (
    <FooterContainer>
      <div className="container">
        <div>$ echo "Let's connect."</div>
        <ContactLinks>
          <a href="https://github.com/HengWeiBin" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
          <a href="mailto:hengweibin1898@gmail.com">Email</a>
        </ContactLinks>
        <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.6 }}>
          Built with React & Neon DB. © {new Date().getFullYear()}
        </div>
      </div>
    </FooterContainer>
  );
};

export const TerminalLayout = ({ children }) => {
  return (
    <LayoutWrapper>
      <Navbar />
      <MainContent>
        {children}
      </MainContent>
      <Footer />
    </LayoutWrapper>
  );
};
