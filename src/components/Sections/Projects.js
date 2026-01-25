import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import sql from '../../services/db';

// Visualizations
import NeuralArch from '../Visualizations/NeuralArch';
import CodeBlock from '../Visualizations/CodeBlock';
import ResultViz from '../Visualizations/ResultViz';
import { Skeleton } from '../Common/Loading';
import 'github-markdown-css/github-markdown.css'

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
  /* --- Layout & Base --- */
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.7; /* 稍微增加行高，提升閱讀舒適度 */
  margin-bottom: 2rem;
  flex-grow: 1;
  overflow-y: auto;
  
  /* --- Typography & Markdown Styles --- */
  
  /* 通用間距：除了最後一個元素外，都保持底部間距 */
  > *:not(:last-child) {
    margin-bottom: 1.25rem;
  }

  /* 標題 H1-H6 */
  h1, h2, h3, h4, h5, h6 {
    color: var(--text-primary, #fff); /* 建議使用更亮的顏色對比 */
    font-weight: 600;
    line-height: 1.3;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
  
  h1 { font-size: 1.8rem; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3rem; }
  h3 { font-size: 1.25rem; }

  /* 段落 P */
  p {
    margin-bottom: 1rem;
    color: inherit;
  }

  /* 連結 A */
  a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease, opacity 0.2s;

    &:hover {
      border-bottom-color: var(--accent);
      opacity: 0.9;
    }
  }

  /* 列表 UL, OL */
  ul, ol {
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.5rem;
    padding-left: 0.25rem;
    
    /* 讓列表內的文字對齊更好看 */
    &::marker {
      color: var(--text-secondary); 
      opacity: 0.7;
    }
  }

  /* 引用 Blockquote */
  blockquote {
    border-left: 4px solid var(--accent);
    background: rgba(127, 127, 127, 0.05); /* 極淡的背景 */
    margin: 1.5rem 0;
    padding: 0.8rem 1rem;
    font-style: italic;
    color: var(--text-secondary);
    border-radius: 0 4px 4px 0;
  }

  /* 行內程式碼 Code (Inline) */
  :not(pre) > code {
    background: rgba(110, 118, 129, 0.2); /* 降低不透明度，讓文字更融合 */
    color: var(--accent, #58a6ff); /* 讓程式碼有點顏色 */
    padding: 0.2em 0.4em;
    border-radius: 6px;
    font-size: 0.85em;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    border: 1px solid rgba(255, 255, 255, 0.05); /* 微妙的邊框 */
  }

  /* 程式碼區塊 Pre > Code (Block) */
  pre {
    background: #1e1e1e; /* 深色背景，模擬 IDE */
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    code {
      background: transparent;
      padding: 0;
      color: #e6edf3;
      font-size: 0.9rem;
      font-family: 'JetBrains Mono', 'Fira Code', monospace; /* 推薦使用現代程式碼字體 */
    }
  }

  /* 圖片 Img */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 1.5rem 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  /* 表格 Table (如果有的話) */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    
    th, td {
      padding: 0.75rem;
      border: 1px solid rgba(255,255,255,0.1);
      text-align: left;
    }
    
    th {
      background: rgba(255,255,255,0.05);
      font-weight: 600;
    }
  }

  /* 捲軸樣式優化 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: rgba(155, 155, 155, 0.3);
    border-radius: 20px;
    border: transparent;
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
  text-decoration: none;
  border-bottom: 1px dashed var(--accent);
  
  &:hover {
    border-bottom-style: solid;
  }
`;

// Configuration to map specific projects to visualizations
// In a real app, this "type" could be stored in the DB
const PROJECT_VISUALS = {
  // Example mapping based on potential project titles or IDs
  // 'CenterFusionDetect3D': <ResultViz label="Car" confidence="0.98" />,
  // 'TransformerModel': <NeuralArch />,
  'CenterFusionDetect3D': 'ResultViz',
  'StudentsRegistrationSystem': 'CodeBlock',
  'RadarCameraFusion': 'NeuralArch',
};

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await sql`SELECT * FROM projects ORDER BY date_end DESC`;
        setProjects(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const renderVisual = (project) => {
    // 1. Check if there's a mapped visual type
    const visualType = PROJECT_VISUALS[project.title] || PROJECT_VISUALS[Object.keys(PROJECT_VISUALS).find(k => project.title?.includes(k))];

    if (visualType === 'NeuralArch') return <NeuralArch />;
    if (visualType === 'CodeBlock') return <CodeBlock code={`# Core Algorithm\ndef fuse_sensors(radar, camera):\n    """\n    Fuse radar point clouds with\n    camera image features.\n    """\n    return kalman_filter(radar, camera)`} />;
    if (visualType === 'ResultViz') return <ResultViz label="Pedestrian" confidence="0.92" image={project.image_base64} />;

    // 2. Fallback to image from DB
    if (project.image_base64) {
      return <img src={project.image_base64} alt={project.title} loading="lazy" />;
    }

    // 3. Default fallback
    return (
      <div style={{ color: 'var(--text-secondary)', padding: '2px', fontFamily: 'monospace', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
        <CodeBlock language="bash" code={`> locating_assets...\n> error: visualization_not_found\n> using_fallback_mode...`} />
      </div>
    );
  };

  return (
    <Section id="projects">
      <div className="container">
        <SectionTitle>Featured Projects</SectionTitle>

        {loading ? (
          [1, 2].map(i => (
            <ProjectCard key={i} style={{ pointerEvents: 'none' }}>
              <div style={{ flex: 1, minHeight: '300px', background: '#0d1117' }} />
              <ContentArea>
                <Skeleton width="70%" height="2rem" mb="1.5rem" />
                <Skeleton width="40%" height="1rem" mb="1.5rem" />
                <Skeleton height="80px" mb="2rem" />
                <Skeleton width="30%" />
              </ContentArea>
            </ProjectCard>
          ))
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id}>
              <VisualArea>
                {renderVisual(project)}
              </VisualArea>
              <ContentArea>
                <ProjectTitle>{project.title}</ProjectTitle>
                <TechStack>
                  [{project.date_start} - {project.date_end}]
                </TechStack>
                <Description>
                  <ReactMarkdown>{project.description}</ReactMarkdown>
                </Description>
                <Links>
                  <LinkBtn href={project.link} target="_blank">[View Source / Demo]</LinkBtn>
                </Links>
              </ContentArea>
            </ProjectCard>
          ))
        )}
      </div>
    </Section>
  );
};

export default Projects;
