import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getSkills } from '../../services/api';

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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
`;

const SkillCategory = styled.div`
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  padding: 1.5rem;
  border-radius: 4px;
`;

const CategoryTitle = styled.h3`
  color: var(--accent);
  font-size: 1.1rem;
  margin-bottom: 1rem;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 0.5rem;
`;

const TagCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const SkillTag = styled.span`
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
  padding: 5px 10px;
  border-radius: 2px;
  border: 1px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(139, 233, 253, 0.1);
  }
`;

const Skills = () => {
    const [skills, setSkills] = useState([]);

    useEffect(() => {
        getSkills().then(setSkills);
    }, []);

    // Group skills by category
    const groupedSkills = skills.reduce((acc, skill) => {
        if (!acc[skill.category]) {
            acc[skill.category] = [];
        }
        acc[skill.category].push(skill);
        return acc;
    }, {});

    return (
        <Section id="skills">
            <div className="container">
                <SectionTitle>My Toolkit</SectionTitle>
                <SkillsGrid>
                    {Object.keys(groupedSkills).map((category) => (
                        <SkillCategory key={category}>
                            <CategoryTitle>{category}:</CategoryTitle>
                            <TagCloud>
                                {groupedSkills[category].map((skill) => (
                                    <SkillTag key={skill.id}>[{skill.name}]</SkillTag>
                                ))}
                            </TagCloud>
                        </SkillCategory>
                    ))}
                </SkillsGrid>
            </div>
        </Section>
    );
};

export default Skills;
