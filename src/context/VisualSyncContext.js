import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const VisualSyncContext = createContext({
  activeSkill: null,
  activeCategory: null,
  highlightSkill: () => {},
  clearHighlight: () => {},
});

export const VisualSyncProvider = ({ children }) => {
  const [activeSkill, setActiveSkill] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const highlightSkill = useCallback((skill, category = null) => {
    setActiveSkill(skill);
    if (category) {
      setActiveCategory(category);
    }
  }, []);

  const clearHighlight = useCallback(() => {
    setActiveSkill(null);
    setActiveCategory(null);
  }, []);

  const value = useMemo(() => ({
    activeSkill,
    activeCategory,
    highlightSkill,
    clearHighlight,
  }), [activeSkill, activeCategory, highlightSkill, clearHighlight]);

  return (
    <VisualSyncContext.Provider value={value}>
      {children}
    </VisualSyncContext.Provider>
  );
};

export const useVisualSync = () => useContext(VisualSyncContext);

export default VisualSyncContext;
