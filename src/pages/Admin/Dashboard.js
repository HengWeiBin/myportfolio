import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import sql from '../../services/db';
import { addProject, deleteProject, addCertificate, deleteCertificate } from '../../services/api';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Section = styled.div`
  margin-bottom: 4rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    border: 1px solid var(--border-color);
    padding: 10px;
    text-align: left;
  }
  
  th {
     color: var(--accent);
  }
`;

const Button = styled.button`
  background: ${props => props.$danger ? 'var(--danger)' : 'var(--accent)'};
  color: ${props => props.$danger ? 'white' : 'var(--bg-dark)'};
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  margin-right: 5px;
`;

const Modal = styled.div`
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalForm = styled.div`
  background: var(--bg-dark);
  padding: 2rem;
  width: 500px;
  border: 1px solid var(--accent);
  max-height: 90vh;
  overflow-y: auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background: #222;
  border: 1px solid #444;
  color: white;
`;
const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background: #222;
  border: 1px solid #444;
  color: white;
  min-height: 100px;
`;

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [certs, setCerts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'project' or 'cert'
    const [formData, setFormData] = useState({});

    const fetchData = async () => {
        const p = await sql`SELECT * FROM projects ORDER BY id DESC`;
        const c = await sql`SELECT * FROM certificates ORDER BY id DESC`;
        setProjects(p);
        setCerts(c);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (type, id) => {
        if (!window.confirm('Delete this item?')) return;
        if (type === 'project') await deleteProject(id);
        if (type === 'cert') await deleteCertificate(id);
        fetchData();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image_base64: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'project') {
                await addProject({ ...formData, tags: [] });
            } else {
                await addCertificate(formData);
            }
            setShowModal(false);
            setFormData({});
            fetchData();
        } catch (err) {
            alert('Error saving: ' + err.message);
        }
    };

    return (
        <div>
            <Header>
                <h1>Dashboard</h1>
            </Header>

            <Section>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2>Projects</h2>
                    <Button onClick={() => { setModalType('project'); setShowModal(true); setFormData({}); }}>+ New Project</Button>
                </div>
                <Table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(p => (
                            <tr key={p.id}>
                                <td>{p.title}</td>
                                <td>{p.date_end}</td>
                                <td>
                                    <Button $danger onClick={() => handleDelete('project', p.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Section>

            <Section>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h2>Certificates</h2>
                    <Button onClick={() => { setModalType('cert'); setShowModal(true); setFormData({}); }}>+ New Certificate</Button>
                </div>
                <Table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certs.map(c => (
                            <tr key={c.id}>
                                <td>{c.title}</td>
                                <td>{c.date}</td>
                                <td>
                                    <Button $danger onClick={() => handleDelete('cert', c.id)}>Delete</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Section>

            {showModal && (
                <Modal>
                    <ModalForm>
                        <h3>Add New {modalType === 'project' ? 'Project' : 'Certificate'}</h3>
                        <form onSubmit={handleSubmit}>
                            <Input placeholder="Title" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required />

                            {modalType === 'project' ? (
                                <>
                                    <TextArea placeholder="Description (HTML allowed)" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                                    <Input placeholder="Link (URL)" value={formData.link || ''} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                                    <Input placeholder="Start Date" value={formData.date_start || ''} onChange={e => setFormData({ ...formData, date_start: e.target.value })} />
                                    <Input placeholder="End Date" value={formData.date_end || ''} onChange={e => setFormData({ ...formData, date_end: e.target.value })} />
                                </>
                            ) : (
                                <>
                                    <Input placeholder="Issuer" value={formData.issuer || ''} onChange={e => setFormData({ ...formData, issuer: e.target.value })} />
                                    <Input placeholder="Date (e.g. 2023-12)" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    <Input placeholder="Credential ID" value={formData.credential_id || ''} onChange={e => setFormData({ ...formData, credential_id: e.target.value })} />
                                </>
                            )}

                            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Image</label>
                            <Input type="file" onChange={handleFileChange} />

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <Button type="submit">Save</Button>
                                <Button type="button" $danger onClick={() => setShowModal(false)}>Cancel</Button>
                            </div>
                        </form>
                    </ModalForm>
                </Modal>
            )}
        </div>
    );
};

export default Dashboard;
