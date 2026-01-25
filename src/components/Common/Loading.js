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

const TableRow = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

export const AdminTableSkeleton = () => (
  <div style={{ width: '100%', border: '1px solid var(--border-color)' }}>
    <div style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
      <Skeleton height="1.5rem" width="30%" />
    </div>
    {[1, 2, 3, 4, 5].map(i => (
      <TableRow key={i}>
        <div style={{ flex: 1 }}><Skeleton height="1.2rem" width="80%" /></div>
        <div style={{ flex: 2 }}><Skeleton height="1.2rem" width="60%" /></div>
        <div style={{ width: '100px' }}><Skeleton height="2rem" /></div>
      </TableRow>
    ))}
  </div>
);

