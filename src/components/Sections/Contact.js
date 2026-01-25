import React from 'react';
import styled from 'styled-components';

const Section = styled.section`
  padding: 4rem 0;
  border-top: 1px solid var(--border-color);
  text-align: center;
`;

const SectionTitle = styled.h2`
  color: var(--text-secondary);
  font-family: var(--font-mono);
  margin-bottom: 2rem;
  
  &::before {
    content: './';
    color: var(--success);
  }
`;

const ContactButton = styled.a`
  display: inline-block;
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 15px 30px;
  font-family: var(--font-mono);
  font-size: 1.2rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: rgba(0, 255, 65, 0.1);
    box-shadow: 0 0 20px rgba(0, 255, 65, 0.2);
    transform: translateY(-5px);
  }
`;

const ContactInfo = styled.div`
  margin-top: 2rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
`;

const Contact = () => {
    const scrollToFooter = (e) => {
        e.preventDefault();
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    return (
        <Section id="contact">
            <div className="container">
                <SectionTitle>initiate_handshake.sh</SectionTitle>
                <p style={{ maxWidth: '600px', margin: '0 auto 2rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    I am currently open to new opportunities in Machine Learning Engineering and AI Research.
                    Whether you have a question or just want to discuss the latest paper, my inbox is always open.
                </p>
                <ContactButton href="#footer" onClick={scrollToFooter}>
                    $ sh ./contact_me.sh
                </ContactButton>

                <ContactInfo>
                    <p>&lt;!-- Transmission End --&gt;</p>
                </ContactInfo>
            </div>
        </Section>
    );
};

export default Contact;
