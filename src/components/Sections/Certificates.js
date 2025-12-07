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

const CertificatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const CertCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  padding: 20px;
  position: relative;
  transition: all 0.2s;
  
  &:hover {
    border-color: var(--accent);
    box-shadow: 0 0 15px rgba(139, 233, 253, 0.1);
    transform: translateY(-2px);
  }
`;

const CertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const Icon = styled.div`
  font-size: 1.5rem;
`;

const CertTitle = styled.h3`
  font-family: var(--font-mono);
  font-size: 1rem;
  line-height: 1.4;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const MetaData = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  
  p {
    margin-bottom: 0.2rem;
  }
`;

const VerifyLink = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 5px 10px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  cursor: pointer;
  width: 100%;
  text-align: left;
  
  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  max-width: 90%;
  max-height: 90%;
  
  img {
    max-width: 100%;
    max-height: 80vh;
    border: 2px solid var(--accent);
  }
`;

const Certificates = () => {
    const [certs, setCerts] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchCerts = async () => {
            const data = await sql`SELECT * FROM certificates ORDER BY date DESC`;
            setCerts(data);
        };
        fetchCerts();
    }, []);

    return (
        <Section id="certificates">
            <div className="container">
                <SectionTitle>Credentials</SectionTitle>
                <CertificatesGrid>
                    {certs.map((cert) => (
                        <CertCard key={cert.id}>
                            <CertHeader>
                                <Icon>🏅</Icon>
                            </CertHeader>
                            <CertTitle>{cert.title}</CertTitle>
                            <MetaData>
                                <p>Date: {cert.date}</p>
                                {cert.issuer && <p>Issuer: {cert.issuer}</p>}
                                {cert.credential_id && <p>ID: {cert.credential_id}</p>}
                            </MetaData>

                            {cert.image_base64 && (
                                <VerifyLink onClick={() => setSelectedImage(cert.image_base64)}>
                                    $ view_cert.png
                                </VerifyLink>
                            )}
                        </CertCard>
                    ))}
                </CertificatesGrid>
            </div>

            {selectedImage && (
                <ModalOverlay onClick={() => setSelectedImage(null)}>
                    <ModalContent onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Certificate" />
                    </ModalContent>
                </ModalOverlay>
            )}
        </Section>
    );
};

export default Certificates;
