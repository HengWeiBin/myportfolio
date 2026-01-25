import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import sql from '../../services/db';

const Section = styled.section`
  padding: 4rem 0;
`;

const SectionTitle = styled.h2`
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 3rem;
  
  &::before {
    content: '$ ls ';
    color: var(--success);
  }
  &::after {
    content: ' /var/log/achievements/';
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
`;

const Card = styled.div`
  background: ${props => props.$highlight ? 'rgba(88, 166, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${props => props.$highlight ? 'var(--primary-color)' : 'var(--border-color)'};
  padding: 20px;
  position: relative;
  transition: all 0.2s;
  border-left: ${props => props.$highlight ? '4px solid var(--primary-color)' : '1px solid var(--border-color)'};
  
  &:hover {
    border-color: var(--accent);
    box-shadow: 0 0 15px rgba(139, 233, 253, 0.1);
    transform: translateY(-2px);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TypeBadge = styled.span`
  font-family: var(--font-mono);
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${props => props.$bg || '#333'};
  color: ${props => props.$color || '#fff'};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Title = styled.h3`
  font-family: var(--font-mono);
  font-size: 1rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const MetaData = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  
  span {
    display: inline-block;
    margin-right: 15px;
  }
`;

const ViewButton = styled.button`
  background: transparent;
  border: 1px dashed var(--border-color);
  color: var(--text-secondary);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: rgba(0,255,65,0.05);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  max-width: 90%;
  max-height: 90%;
  
  img {
    max-width: 100%;
    max-height: 80vh;
    border: 1px solid var(--terminal-green);
    box-shadow: 0 0 30px rgba(0, 255, 65, 0.2);
  }
`;

const Certificates = () => {
  const [achievements, setAchievements] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await sql`SELECT * FROM certificates ORDER BY date DESC`;
        setAchievements(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  // Helper to categorize achievements if categorical data is missing
  const getCategory = (item) => {
    const lowerTitle = item.title.toLowerCase();
    if (lowerTitle.includes('paper') || lowerTitle.includes('conference') || lowerTitle.includes('journal')) return 'Paper';
    if (lowerTitle.includes('competition') || lowerTitle.includes('hackathon') || lowerTitle.includes('award')) return 'Competition';
    return 'Certificate';
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'Paper': return { bg: 'rgba(88, 166, 255, 0.2)', color: '#58a6ff', label: 'PUBLICATION' };
      case 'Competition': return { bg: 'rgba(210, 153, 34, 0.2)', color: '#d29922', label: 'AWARD' };
      default: return { bg: 'rgba(56, 139, 253, 0.1)', color: '#8b949e', label: 'CERT' };
    }
  };

  // Sort: Papers > Competitions > Certs
  const sortedAchievements = [...achievements].sort((a, b) => {
    const score = (type) => {
      if (type === 'Paper') return 3;
      if (type === 'Competition') return 2;
      return 1;
    };
    return score(getCategory(b)) - score(getCategory(a));
  });

  return (
    <Section id="certificates">
      <div className="container">
        <SectionTitle>Credentials</SectionTitle>
        <Grid>
          {sortedAchievements.map((item) => {
            const category = getCategory(item);
            const styles = getTypeStyles(category);
            const isHighlight = category === 'Paper' || category === 'Competition';

            return (
              <Card key={item.id} $highlight={isHighlight}>
                <Header>
                  <TypeBadge $bg={styles.bg} $color={styles.color}>{styles.label}</TypeBadge>
                  <span style={{ fontSize: '1.2rem', opacity: 0.5 }}>
                    {category === 'Paper' ? '📄' : category === 'Competition' ? '🏆' : '📜'}
                  </span>
                </Header>
                <Title>{item.title}</Title>
                <MetaData>
                  <span>{item.date}</span>
                  <span>{item.issuer}</span>
                </MetaData>

                {item.image_base64 && (
                  <ViewButton onClick={() => setSelectedImage(item.image_base64)}>
                    &gt; view_proof.jpg
                  </ViewButton>
                )}
              </Card>
            );
          })}
        </Grid>
      </div>

      {selectedImage && (
        <ModalOverlay onClick={() => setSelectedImage(null)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Credential Proof" />
          </ModalContent>
        </ModalOverlay>
      )}
    </Section>
  );
};

export default Certificates;
