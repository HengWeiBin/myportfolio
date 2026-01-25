import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import sql from '../../services/db';
import {
    addProject, updateProject, deleteProject,
    addCertificate, updateCertificate, deleteCertificate,
    addExperience, updateExperience, deleteExperience,
    getProfile, updateProfile
} from '../../services/api';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  background: ${props => props.$active ? 'var(--accent)' : 'transparent'};
  color: ${props => props.$active ? 'var(--bg-dark)' : 'var(--text-secondary)'};
  border: 1px solid ${props => props.$active ? 'var(--accent)' : 'var(--border-color)'};
  padding: 10px 20px;
  cursor: pointer;
  font-family: var(--font-mono);
  
  &:hover {
    border-color: var(--accent);
  }
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
  font-weight: bold;
`;

const Modal = styled.div`
  position: fixed;
  top:0; left:0; right:0; bottom:0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
`;

const ModalForm = styled.div`
  background: #161b22;
  padding: 2rem;
  width: 600px;
  border: 1px solid var(--accent);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0,0,0,0.7);
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  font-family: var(--font-mono);
  
  &:focus {
      border-color: var(--accent);
      outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  background: #0d1117;
  border: 1px solid #30363d;
  color: #c9d1d9;
  min-height: 150px;
  font-family: var(--font-mono);
  
  &:focus {
      border-color: var(--accent);
      outline: none;
  }
`;

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('projects');
    const [data, setData] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({});
    const [isEdit, setIsEdit] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({});

    const fetchData = React.useCallback(async () => {
        let result = [];
        if (activeTab === 'projects') {
            result = await sql`SELECT * FROM projects ORDER BY date_end DESC`;
            setData(result);
        } else if (activeTab === 'certificates') {
            result = await sql`SELECT * FROM certificates ORDER BY date DESC`;
            setData(result);
        } else if (activeTab === 'experience') {
            result = await sql`SELECT * FROM experience ORDER BY id DESC`;
            setData(result);
        } else if (activeTab === 'profile') {
            try {
                const p = await getProfile();
                setProfile(p || {});
            } catch (e) {
                console.log("Profile fetch error/empty", e);
            }
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (item) => {
        setModalData(item);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item?')) return;

        try {
            if (activeTab === 'projects') await deleteProject(id);
            if (activeTab === 'certificates') await deleteCertificate(id);
            if (activeTab === 'experience') await deleteExperience(id);
            fetchData();
        } catch (e) {
            alert(e.message);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setModalData({ ...modalData, image_base64: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profile);
            alert("Profile updated!");
        } catch (e) {
            alert(e.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === 'projects') {
                if (isEdit) await updateProject(modalData.id, modalData);
                else await addProject({ ...modalData, tags: [] });
            } else if (activeTab === 'certificates') {
                if (isEdit) await updateCertificate(modalData.id, modalData);
                else await addCertificate(modalData);
            } else if (activeTab === 'experience') {
                if (isEdit) await updateExperience(modalData.id, modalData);
                else await addExperience(modalData);
            }
            setShowModal(false);
            setModalData({});
            fetchData();
        } catch (err) {
            alert('Error saving: ' + err.message);
        }
    };

    const renderTable = () => {
        if (activeTab === 'profile') return null; // handled separately
        if (data.length === 0) return <p>No data found.</p>;

        return (
            <Table>
                <thead>
                    <tr>
                        <th>Title/Role</th>
                        <th>Subtitle/Company</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id}>
                            <td>{item.title || item.role}</td>
                            <td>{item.company || item.issuer || item.date_end || item.date}</td>
                            <td>
                                <Button onClick={() => handleEdit(item)}>Edit</Button>
                                <Button $danger onClick={() => handleDelete(item.id)}>Delete</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    const renderProfileForm = () => {
        return (
            <Section>
                <h2>Edit User Configuration (Profile)</h2>
                <form onSubmit={handleProfileSave} style={{ maxWidth: '600px' }}>
                    <label>Admin Name</label>
                    <Input value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} />

                    <label>Title</label>
                    <Input value={profile.title || ''} onChange={e => setProfile({ ...profile, title: e.target.value })} />

                    <label>Bio (About Me)</label>
                    <TextArea value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} />

                    <label>Email</label>
                    <Input value={profile.email || ''} onChange={e => setProfile({ ...profile, email: e.target.value })} />

                    <label>Phone</label>
                    <Input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} />

                    <h3>Social Links</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <Input placeholder="GitHub URL" value={profile.github || ''} onChange={e => setProfile({ ...profile, github: e.target.value })} />
                        <Input placeholder="LinkedIn URL" value={profile.linkedin || ''} onChange={e => setProfile({ ...profile, linkedin: e.target.value })} />
                        <Input placeholder="Instagram URL" value={profile.instagram || ''} onChange={e => setProfile({ ...profile, instagram: e.target.value })} />
                        <Input placeholder="Facebook URL" value={profile.facebook || ''} onChange={e => setProfile({ ...profile, facebook: e.target.value })} />
                    </div>

                    <Button type="submit" style={{ marginTop: '20px', width: '100%', padding: '15px' }}>UPDATE SYSTEM PROFILE</Button>
                </form>
            </Section>
        );
    };

    return (
        <div>
            <Header>
                <h1>Control Panel</h1>
            </Header>

            <TabContainer>
                <Tab $active={activeTab === 'projects'} onClick={() => setActiveTab('projects')}>Projects</Tab>
                <Tab $active={activeTab === 'certificates'} onClick={() => setActiveTab('certificates')}>Certificates</Tab>
                <Tab $active={activeTab === 'experience'} onClick={() => setActiveTab('experience')}>Experience</Tab>
                <Tab $active={activeTab === 'profile'} onClick={() => setActiveTab('profile')}>Profile</Tab>
            </TabContainer>

            {activeTab === 'profile' ? renderProfileForm() : (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ textTransform: 'capitalize' }}>{activeTab} Management</h2>
                        <Button onClick={() => { setIsEdit(false); setModalData({}); setShowModal(true); }}>+ New Entry</Button>
                    </div>
                    {renderTable()}
                </Section>
            )}

            {showModal && (
                <Modal>
                    <ModalForm>
                        <h3>{isEdit ? 'Edit' : 'Add'} {activeTab}</h3>
                        <form onSubmit={handleSubmit}>
                            {/* Dynamic Form Fields */}

                            {activeTab === 'projects' && (
                                <>
                                    <Input placeholder="Title" value={modalData.title || ''} onChange={e => setModalData({ ...modalData, title: e.target.value })} required />
                                    <TextArea placeholder="Description (Markdown supported)" value={modalData.description || ''} onChange={e => setModalData({ ...modalData, description: e.target.value })} />
                                    <Input placeholder="Link (URL)" value={modalData.link || ''} onChange={e => setModalData({ ...modalData, link: e.target.value })} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Input placeholder="Start Date" value={modalData.date_start || ''} onChange={e => setModalData({ ...modalData, date_start: e.target.value })} />
                                        <Input placeholder="End Date" value={modalData.date_end || ''} onChange={e => setModalData({ ...modalData, date_end: e.target.value })} />
                                    </div>
                                    <label>Project Image (Visual)</label>
                                    <Input type="file" onChange={handleFileChange} />
                                </>
                            )}

                            {activeTab === 'certificates' && (
                                <>
                                    <Input placeholder="Certificate Title" value={modalData.title || ''} onChange={e => setModalData({ ...modalData, title: e.target.value })} required />
                                    <Input placeholder="Issuer" value={modalData.issuer || ''} onChange={e => setModalData({ ...modalData, issuer: e.target.value })} />
                                    <Input placeholder="Date (YYYY-MM-DD)" value={modalData.date || ''} onChange={e => setModalData({ ...modalData, date: e.target.value })} />
                                    <Input placeholder="Credential ID" value={modalData.credential_id || ''} onChange={e => setModalData({ ...modalData, credential_id: e.target.value })} />
                                    <label>Certificate Image</label>
                                    <Input type="file" onChange={handleFileChange} />
                                </>
                            )}

                            {activeTab === 'experience' && (
                                <>
                                    <Input placeholder="Role / Position" value={modalData.role || ''} onChange={e => setModalData({ ...modalData, role: e.target.value })} required />
                                    <Input placeholder="Company" value={modalData.company || ''} onChange={e => setModalData({ ...modalData, company: e.target.value })} />
                                    <Input placeholder="Date Range (e.g. 2021 - Present)" value={modalData.date_range || ''} onChange={e => setModalData({ ...modalData, date_range: e.target.value })} />
                                    <TextArea placeholder="Description" value={modalData.description || ''} onChange={e => setModalData({ ...modalData, description: e.target.value })} />
                                </>
                            )}

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <Button type="button" $danger onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </ModalForm>
                </Modal>
            )}
        </div>
    );
};

export default Dashboard;
