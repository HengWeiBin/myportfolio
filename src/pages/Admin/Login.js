import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';

const LoginWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
`;

const LoginBox = styled.div`
  background: var(--bg-dark);
  border: 1px solid var(--border-color);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  border-radius: 4px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: var(--accent);
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  
  input {
    width: 100%;
    padding: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-family: var(--font-mono);
    
    &:focus {
      outline: none;
      border-color: var(--accent);
    }
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background: var(--accent);
  color: var(--bg-dark);
  border: none;
  font-weight: bold;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

const ErrorMsg = styled.p`
  color: var(--danger);
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.9rem;
`;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const res = await login(email, password);
        if (res.success) {
            localStorage.setItem('admin_user', JSON.stringify(res.user));
            navigate('/admin/dashboard');
        } else {
            setError(res.message);
        }
    };

    return (
        <LoginWrapper>
            <LoginBox>
                <Title>ROOT ACCESS</Title>
                <form onSubmit={handleLogin}>
                    {error && <ErrorMsg>{error}</ErrorMsg>}
                    <InputGroup>
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </InputGroup>
                    <InputGroup>
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </InputGroup>
                    <Button type="submit">LOGIN</Button>
                </form>
            </LoginBox>
        </LoginWrapper>
    );
};

export default Login;
