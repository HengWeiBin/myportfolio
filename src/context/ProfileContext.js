import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { fetchPortfolioData } from '../services/api';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState({
    profile: null,
    skills: [],
    projects: [],
    experience: [],
    certificates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortfolioData();
      setPortfolio({
        profile: data.profile || {},
        skills: data.skills || [],
        projects: data.projects || [],
        experience: data.experience || [],
        certificates: data.certificates || [],
        tiered_projects: data.tiered_projects || {},
        tiered_certificates: data.tiered_certificates || {},
        tiered: data.tiered || { projects: {}, certificates: {} }
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const refreshPortfolio = () => {
    fetchPortfolio();
  };

  const contextValue = {
    portfolio,
    profile: portfolio.profile,
    skills: portfolio.skills,
    projects: portfolio.projects,
    experience: portfolio.experience,
    certificates: portfolio.certificates,
    tiered_projects: portfolio.tiered_projects || {},
    tiered_certificates: portfolio.tiered_certificates || {},
    tiered: portfolio.tiered || { projects: {}, certificates: {} },
    loading,
    error,
    refreshPortfolio,
    refreshProfile: refreshPortfolio
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const usePortfolio = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a ProfileProvider');
  }
  return context;
};
