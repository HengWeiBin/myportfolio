import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { checkSession, logout } from '../../services/auth';
import Dashboard from './Dashboard';

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
  
  .Toastify__toast-container {
    z-index: 9999;
  }
  
  .Toastify__toast {
    background: var(--bg-dark);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    font-family: var(--font-mono);
  }
  
  .Toastify__progress-bar {
    background: var(--accent);
  }
  
  .Toastify__close-button {
    color: var(--text-secondary);
  }
`;


const Sidebar = styled.div`
  width: 250px;
  background: var(--bg-dark);
  border-right: 1px solid var(--border-color);
  padding: 2rem;
  display: flex;
  flex-direction: column;
`;

const NavItem = styled(Link)`
  color: var(--text-secondary);
  padding: 10px;
  margin-bottom: 5px;
  display: block;
  
  &:hover {
    color: var(--accent);
    background: rgba(255,255,255,0.05);
  }
`;

const LogoutBtn = styled.button`
  margin-top: auto;
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 10px;
  cursor: pointer;
  
  &:hover {
    background: var(--danger);
    color: white;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const AdminLayout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!checkSession()) {
            navigate('/admin/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <Layout>
            <Sidebar>
                <h3 style={{ marginBottom: '2rem', color: 'var(--accent)' }}>Admin Panel</h3>
                <NavItem to="/admin/dashboard">Dashboard</NavItem>
                <NavItem to="/">View Site</NavItem>
                <LogoutBtn onClick={handleLogout}>Logout</LogoutBtn>
            </Sidebar>
            <Content>
                <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="*" element={<div>select an option</div>} />
                </Routes>
            </Content>
            <ToastContainer position="bottom-right" theme="dark" />
        </Layout>
    );
};


export default AdminLayout;
