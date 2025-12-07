import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// import { getProjects } from '../../services/api'; // Commented out to prevent errors if api.js issues
import sql from '../../services/db'; // Direct import to be safe or use api wrapper

const Section = styled.section`
  padding: 4rem 0;
  border-bottom: 1px solid var(--border-color);
`;

const SectionTitle = styled.h2`
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 3rem;
  
  &::before {
    content: '/* ';
    color: var(--text-secondary);
  }
  &::after {
    content: ' */';
    color: var(--text-secondary);
  }
`;

const ProjectCard = styled.div`
  display: flex;
  flex-direction: column;
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  margin-bottom: 4rem;
  overflow: hidden;
  transition: transform 0.2s;
  
  &:hover {
    border-color: var(--accent);
  }

  @media (min-width: 768px) {
    flex-direction: row;
    height: 400px;
  }
`;

const VisualArea = styled.div`
  flex: 1;
  background: #000;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  
  @media (min-width: 768px) {
    border-right: 1px solid var(--border-color);
    border-bottom: none;
    flex: 1.2;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    transition: opacity 0.3s;
  }

  &:hover img {
    opacity: 1;
  }
  
  /* Syntax Highlighting Overlay Effect - conceptual simulation */
  &::after {
    content: '';
    position: absolute;
    top: 0; 
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
    pointer-events: none;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
`;

const ProjectTitle = styled.h3`
  font-size: 1.8rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const TechStack = styled.div`
  margin-bottom: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--warning);
`;

const Description = styled.div`
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
  flex-grow: 1;
  overflow-y: auto;
  
  /* Custom Scrollbar for inner content */
  &::-webkit-scrollbar {
    width: 4px;
  }
`;

const Links = styled.div`
  display: flex;
  gap: 1.5rem;
  font-family: var(--font-mono);
  margin-top: auto;
`;

const LinkBtn = styled.a`
  color: var(--accent);
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Projects = () => {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        // Fetch projects directly
        const fetchProjects = async () => {
            try {
                const data = await sql`SELECT * FROM projects ORDER BY date_end DESC`;
                setProjects(data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchProjects();
    }, []);

    return (
        <Section id="projects">
            <div className="container">
                <SectionTitle>Featured Projects</SectionTitle>

                {projects.map((project) => (
                    <ProjectCard key={project.id}>
                        <VisualArea>
                            {/* Using image from DB (Base64) or fallback to code snippet view later */}
                            {project.image_base64 ? (
                                <img src={project.image_base64} alt={project.title} loading="lazy" />
                            ) : (
                                <div style={{ color: 'var(--text-secondary)', padding: '20px', fontFamily: 'monospace' }}>
                                    &lt;Visuals not found /&gt;
                                </div>
                            )}
                        </VisualArea>
                        <ContentArea>
                            <ProjectTitle>{project.title}</ProjectTitle>
                            <TechStack>
                                [{project.date_start} - {project.date_end}]
                            </TechStack>
                            <Description dangerouslySetInnerHTML={{ __html: project.description }} />
                            <Links>
                                <LinkBtn href={project.link} target="_blank">[View Source / Demo]</LinkBtn>
                            </Links>
                        </ContentArea>
                    </ProjectCard>
                ))}
            </div>
        </Section>
    );
};

export default Projects;
