import {
  updateProject,
  updateCertificate,
  updateExperience,
} from '../../../services/api';

/**
 * Persists modified items for a given tab in parallel.
 *
 * @param {string} activeTab - The active admin tab ('projects', 'certificates', or 'experience')
 * @param {Array} dirtyItems - The items that have modified fields
 * @returns {Promise<Array>} Results of the parallel updates
 */
export async function batchUpdateItems(activeTab, dirtyItems) {
  if (!Array.isArray(dirtyItems) || dirtyItems.length === 0) {
    return [];
  }

  const updatePromises = dirtyItems.map((item) => {
    if (activeTab === 'projects') {
      return updateProject(item.id, item);
    }
    if (activeTab === 'certificates') {
      return updateCertificate(item.id, item);
    }
    if (activeTab === 'experience') {
      return updateExperience(item.id, item);
    }
    throw new Error(`Unsupported tab for batch persistence: ${activeTab}`);
  });

  return Promise.all(updatePromises);
}
