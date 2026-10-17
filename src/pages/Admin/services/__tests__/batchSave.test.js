import { describe, it, expect, vi, beforeEach } from 'vitest';
import { batchUpdateItems } from '../batchSave';
import * as api from '../../../../services/api';

vi.mock('../../../../services/api', () => ({
  updateProject: vi.fn(),
  updateCertificate: vi.fn(),
  updateExperience: vi.fn(),
}));

describe('batchUpdateItems service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty array when dirtyItems is empty or not an array', async () => {
    expect(await batchUpdateItems('projects', [])).toEqual([]);
    expect(await batchUpdateItems('projects', null)).toEqual([]);
    expect(await batchUpdateItems('projects', undefined)).toEqual([]);
    expect(api.updateProject).not.toHaveBeenCalled();
  });

  it('updates project items in parallel with item.id and item object', async () => {
    const dirtyProjects = [
      { id: 'p1', title: 'Radar Fusion', sort_order: 1, tier: 'featured' },
      { id: 'p2', title: 'LiDAR Odometry', sort_order: 0, tier: 'standard' },
    ];

    api.updateProject.mockImplementation((id, item) =>
      Promise.resolve({ updated: id, ...item })
    );

    const results = await batchUpdateItems('projects', dirtyProjects);

    expect(api.updateProject).toHaveBeenCalledTimes(2);
    expect(api.updateProject).toHaveBeenCalledWith('p1', dirtyProjects[0]);
    expect(api.updateProject).toHaveBeenCalledWith('p2', dirtyProjects[1]);
    expect(results).toEqual([
      { updated: 'p1', ...dirtyProjects[0] },
      { updated: 'p2', ...dirtyProjects[1] },
    ]);
  });

  it('updates certificate items in parallel with item.id and item object', async () => {
    const dirtyCerts = [
      { id: 'c1', title: 'AWS ML', sort_order: 0, tier: 'featured' },
    ];

    api.updateCertificate.mockResolvedValue({ success: true });

    const results = await batchUpdateItems('certificates', dirtyCerts);

    expect(api.updateCertificate).toHaveBeenCalledTimes(1);
    expect(api.updateCertificate).toHaveBeenCalledWith('c1', dirtyCerts[0]);
    expect(results).toEqual([{ success: true }]);
  });

  it('updates experience items in parallel with item.id and item object', async () => {
    const dirtyExp = [
      { id: 'e1', company: 'Google', sort_order: 1 },
      { id: 'e2', company: 'DeepMind', sort_order: 0 },
    ];

    api.updateExperience.mockResolvedValue({ success: true });

    const results = await batchUpdateItems('experience', dirtyExp);

    expect(api.updateExperience).toHaveBeenCalledTimes(2);
    expect(api.updateExperience).toHaveBeenCalledWith('e1', dirtyExp[0]);
    expect(api.updateExperience).toHaveBeenCalledWith('e2', dirtyExp[1]);
    expect(results).toHaveLength(2);
  });

  it('propagates rejection if any update fails', async () => {
    const dirtyProjects = [
      { id: 'p1', title: 'P1' },
      { id: 'p2', title: 'P2' },
    ];

    api.updateProject
      .mockResolvedValueOnce({ id: 'p1' })
      .mockRejectedValueOnce(new Error('Network error on p2'));

    await expect(batchUpdateItems('projects', dirtyProjects)).rejects.toThrow(
      'Network error on p2'
    );
  });

  it('throws an error for unsupported tabs', async () => {
    const items = [{ id: 's1', name: 'Python' }];
    await expect(batchUpdateItems('skills', items)).rejects.toThrow(
      'Unsupported tab for batch persistence: skills'
    );
  });
});
