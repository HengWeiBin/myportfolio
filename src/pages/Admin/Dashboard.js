import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getProjects, addProject, updateProject, deleteProject,
  getCertificates, addCertificate, updateCertificate, deleteCertificate,
  getExperience, addExperience, updateExperience, deleteExperience,
  getProfile, updateProfile,
  getSkills, addSkill, updateSkill, deleteSkill,
} from '../../services/api';
import { uploadImageToR2, deleteImageFromR2 } from '../../services/upload';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { FloatingActionBar } from './components/Shared';
import useStagedList from './hooks/useStagedList';
import ProjectsTab from './components/ProjectsTab';
import ProjectModal from './components/ProjectModal';
import CertificatesTab from './components/CertificatesTab';
import CertificateModal from './components/CertificateModal';
import ExperienceTab from './components/ExperienceTab';
import ExperienceModal from './components/ExperienceModal';
import SkillsTab from './components/SkillsTab';
import SkillModal from './components/SkillModal';
import ProfileTab from './components/ProfileTab';
import AgentTab from './components/AgentTab';

const TABS = ['projects', 'certificates', 'experience', 'profile', 'skills', 'agent'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [isEdit, setIsEdit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isSaving, setIsSaving] = useState(false);

  const isBatchSupportedTab = ['projects', 'certificates', 'experience'].includes(activeTab);

  const {
    stagedData, isDirty, dirtyCount, isItemDirty,
    discard, commit, moveUp, moveDown, updateField,
  } = useStagedList(isBatchSupportedTab ? data : []);

  const handleBatchSave = async () => {
    setIsSaving(true);
    try {
      commit();
      toast.success('Changes saved successfully');
    } catch (e) {
      toast.error('Failed to save changes: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (activeTab === 'agent') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'projects') setData(await getProjects());
      else if (activeTab === 'certificates') setData(await getCertificates());
      else if (activeTab === 'experience') setData(await getExperience());
      else if (activeTab === 'skills') setData(await getSkills());
      else if (activeTab === 'profile') setProfile((await getProfile()) || {});
    } catch (e) { toast.error('Failed to fetch data: ' + e.message); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenAdd = () => { setIsEdit(false); setModalData({}); setShowModal(true); };
  const handleOpenEdit = (item) => { setIsEdit(true); setModalData(item); setShowModal(true); };

  const performDelete = async () => {
    try {
      const item = data.find((i) => i.id === confirmModal.id);
      if (item?.image_url && (activeTab === 'projects' || activeTab === 'certificates')) {
        try { await deleteImageFromR2(item.image_url); } catch (e) { console.warn(e); }
      }
      if (activeTab === 'projects') await deleteProject(confirmModal.id);
      else if (activeTab === 'certificates') await deleteCertificate(confirmModal.id);
      else if (activeTab === 'experience') await deleteExperience(confirmModal.id);
      else if (activeTab === 'skills') await deleteSkill(confirmModal.id);

      toast.success('Item deleted successfully');
      setConfirmModal({ isOpen: false, id: null });
      fetchData();
    } catch (e) { toast.error(e.message); }
  };

  const handleSave = async (formData) => {
    try {
      let dataToSave = { ...formData };
      if (dataToSave.file) {
        setUploading(true);
        toast.info('Uploading image to R2...');
        dataToSave.image_url = await uploadImageToR2(dataToSave.file, activeTab);
        setUploading(false);
      }
      if (activeTab === 'projects') {
        if (isEdit) await updateProject(dataToSave.id, dataToSave);
        else await addProject({ ...dataToSave, tags: dataToSave.tags || [] });
      } else if (activeTab === 'certificates') {
        if (isEdit) await updateCertificate(dataToSave.id, dataToSave);
        else await addCertificate(dataToSave);
      } else if (activeTab === 'experience') {
        if (isEdit) await updateExperience(dataToSave.id, dataToSave);
        else await addExperience(dataToSave);
      } else if (activeTab === 'skills') {
        if (isEdit) await updateSkill(dataToSave.id, dataToSave);
        else await addSkill(dataToSave);
      }
      setShowModal(false);
      toast.success(`${isEdit ? 'Updated' : 'Added'} successfully`);
      fetchData();
    } catch (err) {
      setUploading(false);
      toast.error('Error saving: ' + err.message);
    }
  };

  const handleUpdateItem = async (id, updatedItem) => {
    try {
      if (activeTab === 'projects') await updateProject(id, updatedItem);
      else if (activeTab === 'certificates') await updateCertificate(id, updatedItem);
      else if (activeTab === 'experience') await updateExperience(id, updatedItem);
      toast.success('Updated successfully');
      fetchData();
    } catch (err) { toast.error('Failed to update: ' + err.message); }
  };

  const handleProfileSave = async (updated) => {
    try {
      await updateProfile(updated);
      toast.success('Profile updated successfully!');
      fetchData();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-cyber-border">
        <h1 className="text-xl font-mono font-bold text-cyan-electric uppercase tracking-widest flex items-center gap-2">
          <span className="text-slate-400">&gt;</span>
          <span>Control Panel</span>
          <span className="inline-block w-2 h-4 bg-cyan-electric animate-pulse" />
        </h1>
      </div>

      <div className="flex gap-1 p-1 bg-cyber-dark border border-cyber-border rounded-lg overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[110px] py-2.5 px-4 font-mono text-xs font-semibold capitalize rounded transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-cyber-surface text-cyan-electric border border-cyan-electric/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab === 'agent' ? 'Agent Console' : tab}
          </button>
        ))}
      </div>

      <div className="bg-cyber-card/40 border border-cyber-border rounded-lg p-5">
        {activeTab === 'projects' && (
          <ProjectsTab
            data={data} stagedData={stagedData} loading={loading} onAdd={handleOpenAdd}
            onEdit={handleOpenEdit} onDelete={(id) => setConfirmModal({ isOpen: true, id })}
            onUpdateProject={handleUpdateItem} onMoveUp={moveUp} onMoveDown={moveDown}
            onUpdateField={updateField} isItemDirty={isItemDirty}
          />
        )}
        {activeTab === 'certificates' && (
          <CertificatesTab
            data={data} stagedData={stagedData} loading={loading} onAdd={handleOpenAdd}
            onEdit={handleOpenEdit} onDelete={(id) => setConfirmModal({ isOpen: true, id })}
            onUpdateCertificate={handleUpdateItem} onMoveUp={moveUp} onMoveDown={moveDown}
            onUpdateField={updateField} isItemDirty={isItemDirty}
          />
        )}
        {activeTab === 'experience' && (
          <ExperienceTab
            data={data} stagedData={stagedData} loading={loading} onAdd={handleOpenAdd}
            onEdit={handleOpenEdit} onDelete={(id) => setConfirmModal({ isOpen: true, id })}
            onUpdateExperience={handleUpdateItem} onMoveUp={moveUp} onMoveDown={moveDown}
            onUpdateField={updateField} isItemDirty={isItemDirty}
          />
        )}
        {activeTab === 'skills' && (
          <SkillsTab
            data={data} loading={loading} onAdd={handleOpenAdd}
            onEdit={handleOpenEdit} onDelete={(id) => setConfirmModal({ isOpen: true, id })}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab initialProfile={profile} onSaveProfile={handleProfileSave} />
        )}
        {activeTab === 'agent' && (
          <AgentTab />
        )}
      </div>

      {showModal && activeTab === 'projects' && (
        <ProjectModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} uploading={uploading} />
      )}
      {showModal && activeTab === 'certificates' && (
        <CertificateModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} uploading={uploading} />
      )}
      {showModal && activeTab === 'experience' && (
        <ExperienceModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
      {showModal && activeTab === 'skills' && (
        <SkillModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={performDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      <FloatingActionBar
        isVisible={isBatchSupportedTab && isDirty}
        dirtyCount={dirtyCount}
        onDiscard={discard}
        onSave={handleBatchSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default Dashboard;
