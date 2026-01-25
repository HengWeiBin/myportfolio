import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import TrainingLog from '../Hero/TrainingLog';
import { getProfile } from '../../services/api';

const HeroSection = styled.section`
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const TerminalWindow = styled.div`
  width: 100%;
  max-width: 800px;
  background: rgba(10, 12, 16, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  overflow: hidden;
`;

const TerminalHeader = styled.div`
  background: #1f2229;
  padding: 10px 15px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #333;
`;

const Dot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
`;

const TerminalBody = styled.div`
  padding: 40px;
  font-family: var(--font-mono);
  
  @media (max-width: 576px) {
    padding: 20px;
  }
`;

// Greeting component removed as it was unused

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const CommandInput = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 3rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: transparent;
  border: 1px solid ${props => props.$primary ? 'var(--accent)' : 'var(--border-color)'};
  color: ${props => props.$primary ? 'var(--accent)' : 'var(--text-secondary)'};
  padding: 10px 20px;
  font-family: var(--font-mono);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$primary ? 'var(--accent-glow)' : 'rgba(255,255,255,0.05)'};
    transform: translateY(-2px);
  }
`;

const Hero = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getProfile().then(p => setProfile(p)).catch(e => console.error(e));
  }, []);

  const title = profile?.title || "Machine Learning Engineer \n& AI Researcher.";
  const subtitle = profile?.bio || "Translating data into intelligence. Specializing in LLMs, Computer Vision, and scalable MLOps pipelines.";

  return (
    <HeroSection id="home">
      <div className="container">
        <TerminalWindow>
          <TerminalHeader>
            <Dot color="#ff5555" />
            <Dot color="#ffb86c" />
            <Dot color="#50fa7b" />
            <span style={{ color: '#8b949e', fontSize: '0.8rem', marginLeft: 'auto', fontFamily: 'monospace' }}>bash -- 80x24</span>
          </TerminalHeader>
          <TerminalBody>
            <TrainingLog />

            <div style={{ marginTop: '2rem' }}>
              <Title dangerouslySetInnerHTML={{ __html: title.replace(/\n/g, '<br/>') }} />
              <Subtitle>{subtitle}</Subtitle>

              <CommandInput>
                <a href="#projects" onClick={(e) => { e.preventDefault(); document.getElementById('projects').scrollIntoView({ behavior: 'smooth' }) }}>
                  <Button $primary>$ view_projects.sh</Button>
                </a>
                <a href={profile?.resume_link || "/104.pdf"} target="_blank" rel="noreferrer">
                  <Button>$ cat resume.txt</Button>
                </a>
              </CommandInput>
            </div>
          </TerminalBody>
        </TerminalWindow>
      </div>
    </HeroSection>
  );
};

export default Hero;
