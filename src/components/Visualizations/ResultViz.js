import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
`;

const BackgroundImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
`;

const Overlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid ${props => props.color || '#00ff41'};
  background: rgba(0, 255, 65, 0.1);
  padding: 5px;
  color: ${props => props.color || '#00ff41'};
  font-family: monospace;
  font-size: 0.8rem;
  
  &::before {
    content: '${props => props.label || "Object"} ${props => props.confidence || "0.99"}';
    position: absolute;
    top: -20px;
    left: 0;
    background: ${props => props.color || '#00ff41'};
    color: #000;
    padding: 2px 4px;
  }
`;

const ResultViz = ({ image, label, confidence }) => {
    // Fallback image if none provided
    const imgUrl = image || "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    return (
        <Container>
            <BackgroundImage src={imgUrl} alt="Result Visualization" />
            <Overlay label={label} confidence={confidence} color="#00ff41">
                {/* Dimensions could be dynamic, but fixed for vibe */}
                <div style={{ width: '120px', height: '80px' }}></div>
            </Overlay>
        </Container>
    );
};

export default ResultViz;
