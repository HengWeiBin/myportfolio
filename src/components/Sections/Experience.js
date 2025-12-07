import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import sql from '../../services/db';

const Section = styled.section`
  padding: 4rem 0;
  border-bottom: 1px solid var(--border-color);
`;

const SectionTitle = styled.h2`
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 3rem;
  
  &::before {
    content: '> ';
    color: var(--success);
  }
`;

const TimelineWrapper = styled.div`
  position: relative;
  padding-left: 20px;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 2px;
    background: var(--border-color);
  }
`;

const TimelineItem = styled.div`
  position: relative;
  padding-bottom: 3rem;
  padding-left: 2rem;
  
  &::before {
    content: '';
    position: absolute;
    left: -26px; /* Adjust based on line position and dot size */
    top: 5px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--bg-color);
    border: 2px solid var(--accent);
  }
`;

const Role = styled.h3`
  font-size: 1.4rem;
  color: var(--text-primary);
  margin-bottom: 0.2rem;
`;

const Company = styled.h4`
  font-size: 1.1rem;
  color: var(--accent);
  font-weight: 500;
  font-family: var(--font-sans);
  margin-bottom: 0.5rem;
`;

const DateRange = styled.span`
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 1rem;
`;

const Description = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
`;

const Experience = () => {
    const [experiences, setExperiences] = useState([]);

    useEffect(() => {
        const fetchExperience = async () => {
            const data = await sql`SELECT * FROM experience ORDER BY id DESC`;
            setExperiences(data);
        };
        fetchExperience();
    }, []);

    if (experiences.length === 0) return null; // Don't show if empty

    return (
        <Section id="experience">
            <div className="container">
                <SectionTitle>Experience Log</SectionTitle>
                <TimelineWrapper>
                    {experiences.map((exp) => (
                        <TimelineItem key={exp.id}>
                            <Role>{exp.role}</Role>
                            <Company>{exp.company}</Company>
                            <DateRange>{exp.date_range}</DateRange>
                            <Description>{exp.description}</Description>
                        </TimelineItem>
                    ))}
                </TimelineWrapper>
            </div>
        </Section>
    );
};

export default Experience;
