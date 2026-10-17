import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { fetchPortfolioData } from '../services/api';
import { FALLBACK_PORTFOLIO_DATA } from '../data/fallbackPortfolio';

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState(FALLBACK_PORTFOLIO_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPortfolioData();
      if (!data || (!data.projects?.length && !data.skills?.length && !data.profile?.name)) {
        // Fall back if database returns empty payload
        setPortfolio(FALLBACK_PORTFOLIO_DATA);
      } else {
        setPortfolio({
          profile: data.profile || FALLBACK_PORTFOLIO_DATA.profile,
          skills: data.skills?.length ? data.skills : FALLBACK_PORTFOLIO_DATA.skills,
          projects: data.projects?.length ? data.projects : FALLBACK_PORTFOLIO_DATA.projects,
          experience: data.experience?.length ? data.experience : FALLBACK_PORTFOLIO_DATA.experience,
          certificates: data.certificates?.length ? data.certificates : FALLBACK_PORTFOLIO_DATA.certificates,
          tiered_projects: data.tiered_projects || FALLBACK_PORTFOLIO_DATA.tiered_projects,
          tiered_certificates: data.tiered_certificates || FALLBACK_PORTFOLIO_DATA.tiered_certificates,
          tiered: data.tiered || FALLBACK_PORTFOLIO_DATA.tiered
        });
      }
      setError(null);
    } catch (err) {
      console.warn('[ProfileContext] Database unconfigured or unavailable; using fallback portfolio dataset:', err.message);
      setPortfolio(FALLBACK_PORTFOLIO_DATA);
      setError(null);
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
