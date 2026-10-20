import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as api from '../../services/api';
import { uploadImageToR2, deleteImageFromR2 } from '../../services/upload';
import ConfirmModal from '../../components/Common/ConfirmModal';
import { FloatingActionBar } from './components/Shared';
import useStagedList from './hooks/useStagedList';
import useNavigationGuard from './hooks/useNavigationGuard';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import { batchUpdateItems } from './services/batchSave';
import { usePortfolio } from '../../context/ProfileContext';
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

const Dashboard = ({ refreshPortfolio: propRefreshPortfolio }) => {
  const portfolioContext = usePortfolio();
  const refreshPortfolio = propRefreshPortfolio || portfolioContext?.refreshPortfolio;
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
    stagedData, isDirty, dirtyCount, dirtyItems, isItemDirty,
    discard, commit, moveUp, moveDown, updateField,
  } = useStagedList(isBatchSupportedTab ? data : []);

  const handleBatchSave = async () => {
    if (!dirtyItems || dirtyItems.length === 0) return true;
    setIsSaving(true);
    try {
      await batchUpdateItems(activeTab, dirtyItems);
      setData(stagedData);
      commit(stagedData);
      toast.success('Changes saved successfully');
      if (refreshPortfolio) refreshPortfolio();
      return true;
    } catch (e) {
      toast.error('Failed to save changes: ' + e.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const {
    isGuardOpen, requestTransition,
    handleSaveAndProceed, handleDiscardAndProceed, handleCancel,
  } = useNavigationGuard({
    isDirty: isBatchSupportedTab && isDirty,
    onSave: handleBatchSave,
    onDiscard: discard,
  });

  const handleTabChange = (tab) => {
    if (tab !== activeTab) requestTransition(() => setActiveTab(tab));
  };

  const fetchData = useCallback(async () => {
    if (activeTab === 'agent') { setLoading(false); return; }
    setLoading(true);
    try {
      const fetchers = { projects: api.getProjects, certificates: api.getCertificates, experience: api.getExperience, skills: api.getSkills };
      if (fetchers[activeTab]) setData(await fetchers[activeTab]());
      else if (activeTab === 'profile') setProfile((await api.getProfile()) || {});
    } catch (e) { toast.error('Failed to fetch data: ' + e.message); }
    finally { setLoading(false); }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenAdd = () => requestTransition(() => { setIsEdit(false); setModalData({}); setShowModal(true); });
  const handleOpenEdit = (item) =>
    requestTransition(() => {
      const freshItem = data.find((i) => i.id === item.id) || item;
      setIsEdit(true);
      setModalData(freshItem);
      setShowModal(true);
    });
  const handleDelete = (id) => requestTransition(() => setConfirmModal({ isOpen: true, id }));

  const performDelete = async () => {
    try {
      const item = data.find((i) => i.id === confirmModal.id);
      if (item?.image_url && (activeTab === 'projects' || activeTab === 'certificates')) {
        try { await deleteImageFromR2(item.image_url); } catch (e) { console.warn(e); }
      }
      const deletes = { projects: api.deleteProject, certificates: api.deleteCertificate, experience: api.deleteExperience, skills: api.deleteSkill };
      if (deletes[activeTab]) await deletes[activeTab](confirmModal.id);

      toast.success('Item deleted successfully');
      setConfirmModal({ isOpen: false, id: null });
      fetchData();
      if (refreshPortfolio) refreshPortfolio();
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
      const mutations = {
        projects: { update: api.updateProject, add: (d) => api.addProject({ ...d, tags: d.tags || [] }) },
        certificates: { update: api.updateCertificate, add: api.addCertificate },
        experience: { update: api.updateExperience, add: api.addExperience },
        skills: { update: api.updateSkill, add: api.addSkill },
      };
      const apiSet = mutations[activeTab];
      if (apiSet) {
        if (isEdit) {
          const targetId = dataToSave.id || modalData?.id;
          await apiSet.update(targetId, dataToSave);
        } else {
          await apiSet.add(dataToSave);
        }
      }
      setShowModal(false);
      toast.success(`${isEdit ? 'Updated' : 'Added'} successfully`);
      fetchData();
      if (refreshPortfolio) refreshPortfolio();
    } catch (err) {
      setUploading(false);
      toast.error('Error saving: ' + err.message);
    }
  };

  const handleProfileSave = async (updated) => {
    try {
      await api.updateProfile(updated);
      toast.success('Profile updated successfully!');
      fetchData();
      if (refreshPortfolio) refreshPortfolio();
    } catch (e) { toast.error(e.message); }
  };

  const batchTabProps = {
    data, stagedData, loading, onAdd: handleOpenAdd, onEdit: handleOpenEdit,
    onDelete: handleDelete, onMoveUp: moveUp, onMoveDown: moveDown,
    onUpdateField: updateField, isItemDirty,
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
            onClick={() => handleTabChange(tab)}
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
        {activeTab === 'projects' && <ProjectsTab {...batchTabProps} />}
        {activeTab === 'certificates' && <CertificatesTab {...batchTabProps} />}
        {activeTab === 'experience' && <ExperienceTab {...batchTabProps} />}
        {activeTab === 'skills' && <SkillsTab data={data} loading={loading} onAdd={handleOpenAdd} onEdit={handleOpenEdit} onDelete={handleDelete} />}
        {activeTab === 'profile' && <ProfileTab initialProfile={profile} onSaveProfile={handleProfileSave} />}
        {activeTab === 'agent' && <AgentTab />}
      </div>

      {showModal && (
        <>
          {activeTab === 'projects' && <ProjectModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} uploading={uploading} />}
          {activeTab === 'certificates' && <CertificateModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} uploading={uploading} />}
          {activeTab === 'experience' && <ExperienceModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} />}
          {activeTab === 'skills' && <SkillModal isOpen isEdit={isEdit} initialData={modalData} onClose={() => setShowModal(false)} onSave={handleSave} />}
        </>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen} title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        onConfirm={performDelete} onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        confirmText="Delete" cancelText="Cancel"
      />

      <UnsavedChangesModal
        isOpen={isGuardOpen}
        onSaveAndProceed={handleSaveAndProceed}
        onDiscardAndProceed={handleDiscardAndProceed}
        onCancel={handleCancel}
        isSaving={isSaving}
      />

      <FloatingActionBar
        isVisible={isBatchSupportedTab && isDirty} dirtyCount={dirtyCount}
        onDiscard={discard} onSave={handleBatchSave} isSaving={isSaving}
      />
    </div>
  );
};

export default Dashboard;
