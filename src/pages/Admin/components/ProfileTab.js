import React, { useState, useEffect } from 'react';
import { FormInput, FormTextarea, AdminButton } from './Shared';

/**
 * ProfileTab
 * User configuration editor for profile, bio, and social links.
 * Strictly under 250 LOC.
 */
const ProfileTab = ({
  initialProfile = {},
  onSaveProfile,
  saving = false,
}) => {
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    bio: '',
    email: '',
    phone: '',
    resume_link: '',
    github: '',
    linkedin: '',
    instagram: '',
    facebook: '',
    ...initialProfile,
  });

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      ...initialProfile,
    }));
  }, [initialProfile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSaveProfile) {
      onSaveProfile(profile);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="pb-3 border-b border-cyber-border">
        <h2 className="text-lg font-mono font-bold text-cyan-electric tracking-wide">
          Edit User Configuration (Profile)
        </h2>
        <p className="text-xs font-mono text-slate-400 mt-0.5">
          Update primary developer bio, contact coordinates, and social handles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Admin Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <FormInput
            label="Title"
            value={profile.title}
            onChange={(e) => setProfile({ ...profile, title: e.target.value })}
          />
        </div>

        <FormTextarea
          label="Bio (About Me)"
          rows={5}
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
          <FormInput
            label="Phone"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
        </div>

        <FormInput
          label="Resume Link (PDF URL)"
          placeholder="https://example.com/resume.pdf"
          value={profile.resume_link}
          onChange={(e) => setProfile({ ...profile, resume_link: e.target.value })}
        />

        <div className="pt-2">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">
            Social Links
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              placeholder="GitHub URL"
              value={profile.github}
              onChange={(e) => setProfile({ ...profile, github: e.target.value })}
            />
            <FormInput
              placeholder="LinkedIn URL"
              value={profile.linkedin}
              onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
            />
            <FormInput
              placeholder="Instagram URL"
              value={profile.instagram}
              onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
            />
            <FormInput
              placeholder="Facebook URL"
              value={profile.facebook}
              onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4">
          <AdminButton
            type="submit"
            loading={saving}
            size="lg"
            className="w-full uppercase tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            UPDATE SYSTEM PROFILE
          </AdminButton>
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;
