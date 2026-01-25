import React, { useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContainer = styled(motion.div)`
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
  overflow: hidden;
  font-family: var(--font-mono);
`;

const Header = styled.div`
  background: #1f2428;
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const Content = styled.div`
  padding: 2rem;
  color: var(--text-primary);
  
  p {
    margin-bottom: 2rem;
    line-height: 1.6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button`
  background: ${props => props.$primary ? 'var(--danger)' : 'transparent'};
  color: ${props => props.$primary ? 'white' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.$primary ? 'var(--danger)' : 'var(--border-color)'};
  padding: 8px 20px;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$primary ? '#ff3333' : 'rgba(255,255,255,0.05)'};
    border-color: ${props => props.$primary ? '#ff3333' : 'var(--text-primary)'};
    color: ${props => props.$primary ? 'white' : 'var(--text-primary)'};
  }
`;

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <ModalContainer
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <Header>
              <h3>{title || 'System Warning'}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></div>
              </div>
            </Header>
            <Content>
              <p>{message}</p>
              <ButtonGroup>
                <Button onClick={onCancel}>{cancelText}</Button>
                <Button $primary onClick={onConfirm}>{confirmText}</Button>
              </ButtonGroup>
            </Content>
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
