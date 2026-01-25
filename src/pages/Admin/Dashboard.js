import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import sql from '../../services/db';
import {
    addProject, updateProject, deleteProject,
    addCertificate, updateCertificate, deleteCertificate,
    addExperience, updateExperience, deleteExperience,
    getProfile, updateProfile
} from '../../services/api';
import { uploadImageToR2 } from '../../services/upload';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { AdminTableSkeleton } from '../../components/Common/Loading';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  
  h1 {
    font-size: 1.5rem;
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 2px;
    
    &::before { content: '> '; color: var(--text-secondary); }
    &::after { content: '_'; animation: blink 1s infinite; }
  }
  
  @keyframes blink { 50% { opacity: 0; } }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 2rem;
  background: var(--border-color);
  padding: 1px;
  border-radius: 4px;
  overflow: hidden;
`;

const Tab = styled.button`
  background: ${props => props.$active ? 'var(--bg-dark)' : '#161b22'};
  color: ${props => props.$active ? 'var(--accent)' : 'var(--text-secondary)'};
  border: none;
  padding: 12px 24px;
  cursor: pointer;
  font-family: var(--font-mono);
  flex: 1;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background: var(--bg-dark);
    color: var(--text-primary);
  }
  
  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--accent);
    }
  `}
`;

const Section = styled.div`
  margin-bottom: 4rem;
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  
  th, td {
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }
  
  th {
     background: rgba(255,255,255,0.03);
     color: var(--accent);
     font-weight: normal;
     text-transform: uppercase;
     font-size: 0.85rem;
     letter-spacing: 1px;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background: rgba(255,255,255,0.02);
  }
`;

const Button = styled.button`
  background: ${props => props.$danger ? 'rgba(255, 85, 85, 0.1)' : 'rgba(139, 233, 253, 0.1)'};
  color: ${props => props.$danger ? 'var(--danger)' : 'var(--accent)'};
  border: 1px solid ${props => props.$danger ? 'var(--danger)' : 'var(--accent)'};
  padding: 6px 14px;
  cursor: pointer;
  margin-right: 8px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$danger ? 'var(--danger)' : 'var(--accent)'};
    color: ${props => props.$danger ? 'white' : 'var(--bg-dark)'};
    box-shadow: 0 0 10px ${props => props.$danger ? 'rgba(255, 85, 85, 0.3)' : 'rgba(139, 233, 253, 0.3)'};
  }
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
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({});
    const [isEdit, setIsEdit] = useState(false);
    
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const [profile, setProfile] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        let result = [];
        try {
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
                const p = await getProfile();
                setProfile(p || {});
            }
        } catch (e) {
            console.error("Fetch error", e);
            toast.error("Failed to fetch data: " + e.message);
        } finally {
            setLoading(false);
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

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this item? This action cannot be undone.',
            onConfirm: () => performDelete(id)
        });
    };

    const performDelete = async (id) => {
        try {
            if (activeTab === 'projects') await deleteProject(id);
            if (activeTab === 'certificates') await deleteCertificate(id);
            if (activeTab === 'experience') await deleteExperience(id);
            
            toast.success('Item deleted successfully');
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            fetchData();
        } catch (e) {
            toast.error(e.message);
        }
    };


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setModalData({ ...modalData, image_preview: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(profile);
            toast.success("Profile updated successfully!");
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let dataToSave = { ...modalData };
            
            if (selectedFile && (activeTab === 'projects' || activeTab === 'certificates')) {
                setUploading(true);
                toast.info('Uploading image to R2...');
                try {
                    const imageUrl = await uploadImageToR2(selectedFile, activeTab);
                    dataToSave.image_url = imageUrl;
                } catch (uploadErr) {
                    toast.error('Image upload failed: ' + uploadErr.message);
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }
            
            if (activeTab === 'projects') {
                if (isEdit) await updateProject(dataToSave.id, dataToSave);
                else await addProject({ ...dataToSave, tags: [] });
            } else if (activeTab === 'certificates') {
                if (isEdit) await updateCertificate(dataToSave.id, dataToSave);
                else await addCertificate(dataToSave);
            } else if (activeTab === 'experience') {
                if (isEdit) await updateExperience(dataToSave.id, dataToSave);
                else await addExperience(dataToSave);
            }
            setShowModal(false);
            setModalData({});
            setSelectedFile(null);
            toast.success(`${isEdit ? 'Updated' : 'Added'} successfully`);
            fetchData();
        } catch (err) {
            toast.error('Error saving: ' + err.message);
        }
    };


    const renderTable = () => {
        if (activeTab === 'profile') return null;
        
        if (loading) return <AdminTableSkeleton />;
        
        if (data.length === 0) return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
                No data found. Click "+ New Entry" to add some.
            </div>
        );

        return (
            <Table>
                <thead>
                    <tr>
                        <th>Title/Role</th>
                        <th>Subtitle/Company</th>
                        <th style={{ width: '150px', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(item => (
                        <tr key={item.id}>
                            <td>
                                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{item.title || item.role}</div>
                            </td>
                            <td>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>
                                    {item.company || item.issuer || item.date_end || item.date}
                                </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <Button onClick={() => handleEdit(item)}>Edit</Button>
                                <Button $danger onClick={() => handleDeleteClick(item.id)}>Delete</Button>
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

                    <label>Resume Link (PDF URL)</label>
                    <Input placeholder="https://example.com/resume.pdf" value={profile.resume_link || ''} onChange={e => setProfile({ ...profile, resume_link: e.target.value })} />

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0, color: 'var(--accent)' }}>{isEdit ? 'Edit' : 'Add'} {activeTab}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                        </div>
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
                                <Button type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Save Changes'}</Button>
                            </div>
                        </form>
                    </ModalForm>
                </Modal>
            )}
            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
};


export default Dashboard;
