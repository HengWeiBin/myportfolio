import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% { opacity: 0.1; }
  50% { opacity: 0.3; }
  100% { opacity: 0.1; }
`;

export const Skeleton = styled.div`
  background-color: var(--text-secondary);
  border-radius: 4px;
  animation: ${pulse} 1.5s ease-in-out infinite;
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '1rem'};
  margin-bottom: ${props => props.mb || '0.5rem'};
`;

export const SkeletonCard = styled.div`
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 6px;
  background: rgba(255,255,255,0.01);
  margin-bottom: 2rem;
`;
