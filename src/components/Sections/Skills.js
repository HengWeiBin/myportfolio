import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getSkills } from '../../services/api';
import { Skeleton } from '../Common/Loading';

const Section = styled.section`
  padding: 4rem 0;
  border-bottom: 1px solid var(--border-color);
`;

const SectionTitle = styled.h2`
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 2rem;
  
  &::before {
    content: '// ';
    color: var(--warning);
  }
`;

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;

const SkillCategory = styled.div`
  background: rgba(22, 27, 34, 0.6); // Terminal bg with transparency
  border: 1px solid #30363d;
  padding: 1.5rem;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
    border-color: var(--primary-color);
  }
`;

const CategoryTitle = styled.h3`
  color: var(--primary-color);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #30363d;
  padding-bottom: 0.5rem;
  font-family: var(--font-mono);
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const SkillTag = styled.span`
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--text-color);
  background: #30363d; // Muted gray/blue
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    color: var(--terminal-green);
    border-color: var(--terminal-green);
    background: rgba(0, 255, 65, 0.1);
  }
`;

const Skills = () => {
  const [skillsData, setSkillsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const skills = await getSkills();
        // Group skills by category
        const grouped = skills.reduce((acc, skill) => {
          if (!acc[skill.category]) acc[skill.category] = [];
          acc[skill.category].push(skill.name);
          return acc;
        }, {});
        
        // Convert to array format for rendering
        const formattedData = Object.keys(grouped).map(category => ({
          category,
          items: grouped[category]
        }));
        setSkillsData(formattedData);
      } catch (e) {
        console.error("Failed to load skills", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  return (
    <Section id="skills">
      <div className="container">
        <SectionTitle>Technical Arsenal_</SectionTitle>
        {loading ? (
          <Skeleton width="100%" height="200px" />
        ) : (
          <SkillsGrid>
            {skillsData.map((group) => (
              <SkillCategory key={group.category}>
                <CategoryTitle>{group.category}</CategoryTitle>
                <TagCloud>
                  {group.items.map((skill) => (
                    <SkillTag key={skill}>[{skill}]</SkillTag>
                  ))}
                </TagCloud>
              </SkillCategory>
            ))}
          </SkillsGrid>
        )}
      </div>
    </Section>
  );
};

export default Skills;
