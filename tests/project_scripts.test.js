import { describe, it, expect } from 'vitest';
import {
  parseCliArgs as parseAddArgs,
  sanitizeFilename,
  inferMimeAndExt,
  parseMetrics
} from '../.agent/skills/add-portfolio-project/scripts/add_project.mjs';
import {
  parseCliArgs as parseEditArgs,
  computeContiguousReorder,
  reorderAfterDelete,
  updateTags,
  extractR2Key
} from '../.agent/skills/edit-portfolio-project/scripts/edit_project.mjs';

describe('add_project CLI helper logic', () => {
  it('parses --list, --json, and --sort-order arguments', () => {
    const args = ['--list', '--json', '--sort-order=3', '--tier=featured'];
    const opts = parseAddArgs(args);
    expect(opts.list).toBe(true);
    expect(opts.json).toBe(true);
    expect(opts.sortOrder).toBe('3');
    expect(opts.tier).toBe('featured');
  });

  it('parses comma-separated tags and dry-run flag', () => {
    const args = ['--title=My Project', '--tags=PyTorch,CUDA,TensorRT', '--dry-run'];
    const opts = parseAddArgs(args);
    expect(opts.title).toBe('My Project');
    expect(opts.tags).toEqual(['PyTorch', 'CUDA', 'TensorRT']);
    expect(opts.dryRun).toBe(true);
  });

  it('sanitizes filenames correctly', () => {
    expect(sanitizeFilename('My Architecture Diagram (v2).PNG')).toBe('my-architecture-diagram-v2-.png');
    expect(sanitizeFilename('---clean-name---')).toBe('clean-name');
  });

  it('infers MIME types and extensions accurately', () => {
    expect(inferMimeAndExt('https://example.com/photo.png')).toEqual({ ext: '.png', mime: 'image/png' });
    expect(inferMimeAndExt('graphic.webp')).toEqual({ ext: '.webp', mime: 'image/webp' });
    expect(inferMimeAndExt('unknown', 'image/jpeg')).toEqual({ ext: '.jpg', mime: 'image/jpeg' });
  });

  it('parses metrics from JSON string or key=val string', () => {
    const jsonParsed = parseMetrics(null, '{"Latency":"5ms","FPS":"120"}');
    expect(jsonParsed).toEqual({ Latency: '5ms', FPS: '120' });

    const kvParsed = parseMetrics(null, 'mAP=88.5%,Speedup=3x');
    expect(kvParsed).toEqual({ mAP: '88.5%', Speedup: '3x' });
  });
});

describe('edit_project CLI argument parsing', () => {
  it('parses edit-specific flags', () => {
    const args = [
      '--id=16',
      '--tier=featured',
      '--sort-order=0',
      '--add-tags=TensorRT,CUDA',
      '--remove-tags=Legacy',
      '--cleanup-old-image',
      '--dry-run'
    ];
    const opts = parseEditArgs(args);
    expect(opts.id).toBe('16');
    expect(opts.tier).toBe('featured');
    expect(opts.sortOrder).toBe('0');
    expect(opts.addTags).toEqual(['TensorRT', 'CUDA']);
    expect(opts.removeTags).toEqual(['Legacy']);
    expect(opts.cleanupOldImage).toBe(true);
    expect(opts.dryRun).toBe(true);
  });

  it('parses --get and --delete flags', () => {
    const getOpts = parseEditArgs(['--get', '16', '--json']);
    expect(getOpts.get).toBe('16');
    expect(getOpts.json).toBe(true);

    const delOpts = parseEditArgs(['--delete', '5', '--cleanup-old-image']);
    expect(delOpts.delete).toBe('5');
    expect(delOpts.cleanupOldImage).toBe(true);
  });

  it('rejects --id, --get, or --delete without valid numeric ID preventing boolean coercion to 1', () => {
    expect(() => parseEditArgs(['--delete'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--delete', '--cleanup-old-image'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--get'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--get', '--json'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--id'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--id', '--dry-run'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--delete=abc'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
    expect(() => parseEditArgs(['--id=0'])).toThrow('Missing valid numeric ID for --delete / --get / --id');
  });
});

describe('Tag manipulation logic (updateTags)', () => {
  it('replaces tags completely when tags is specified', () => {
    const updated = updateTags(['Old1', 'Old2'], { tags: ['New1', 'New2'] });
    expect(updated).toEqual(['New1', 'New2']);
  });

  it('appends tags and removes duplicates with addTags', () => {
    const updated = updateTags(['PyTorch', 'Vision'], { addTags: ['Vision', 'CUDA', 'TensorRT'] });
    expect(updated).toEqual(['PyTorch', 'Vision', 'CUDA', 'TensorRT']);
  });

  it('removes tags case-insensitively with removeTags', () => {
    const updated = updateTags(['PyTorch', 'LegacyTag', 'CUDA'], { removeTags: ['legacytag'] });
    expect(updated).toEqual(['PyTorch', 'CUDA']);
  });

  it('handles simultaneous addTags and removeTags cleanly', () => {
    const updated = updateTags(['A', 'B', 'C'], { addTags: ['D'], removeTags: ['B'] });
    expect(updated).toEqual(['A', 'C', 'D']);
  });
});

describe('Contiguous re-indexing algorithm (computeContiguousReorder)', () => {
  const initialProjects = [
    { id: 10, sort_order: 0, title: 'Item 10' },
    { id: 20, sort_order: 1, title: 'Item 20' },
    { id: 30, sort_order: 2, title: 'Item 30' },
    { id: 40, sort_order: 3, title: 'Item 40' }
  ];

  it('promotes an item to rank 0 and shifts intermediate items down', () => {
    const { reordered, changedRows } = computeContiguousReorder(initialProjects, 30, 0);

    expect(reordered.map(p => p.id)).toEqual([30, 10, 20, 40]);
    expect(reordered.map(p => p.sort_order)).toEqual([0, 1, 2, 3]);

    // Item 30 changed (2 -> 0), Item 10 changed (0 -> 1), Item 20 changed (1 -> 2)
    // Item 40 stayed at 3
    const changedIds = changedRows.map(r => r.id);
    expect(changedIds).toContain(30);
    expect(changedIds).toContain(10);
    expect(changedIds).toContain(20);
    expect(changedIds).not.toContain(40);
  });

  it('demotes an item to end of list and shifts intermediate items up', () => {
    const { reordered, changedRows } = computeContiguousReorder(initialProjects, 10, 3);

    expect(reordered.map(p => p.id)).toEqual([20, 30, 40, 10]);
    expect(reordered.map(p => p.sort_order)).toEqual([0, 1, 2, 3]);

    const changedIds = changedRows.map(r => r.id);
    expect(changedIds).toEqual([20, 30, 40, 10]);
  });

  it('clamps out-of-bounds upper sort_order (e.g. 999) to [0, totalLength - 1] and maintains contiguous numbering', () => {
    const { reordered, clampedSortOrder } = computeContiguousReorder(initialProjects, 20, 999);
    expect(clampedSortOrder).toBe(3);
    const target = reordered.find(p => p.id === 20);
    expect(target.sort_order).toBe(3);
    expect(reordered.map(p => p.id)).toEqual([10, 30, 40, 20]);
    expect(reordered.map(p => p.sort_order)).toEqual([0, 1, 2, 3]);
  });

  it('clamps out-of-bounds negative sort_order to 0 and maintains contiguous numbering', () => {
    const { reordered, clampedSortOrder } = computeContiguousReorder(initialProjects, 30, -50);
    expect(clampedSortOrder).toBe(0);
    const target = reordered.find(p => p.id === 30);
    expect(target.sort_order).toBe(0);
    expect(reordered.map(p => p.id)).toEqual([30, 10, 20, 40]);
    expect(reordered.map(p => p.sort_order)).toEqual([0, 1, 2, 3]);
  });

  it('throws error when target project does not exist', () => {
    expect(() => computeContiguousReorder(initialProjects, 999, 1)).toThrow(/not found/);
  });
});

describe('Reorder after deletion (reorderAfterDelete)', () => {
  const initialProjects = [
    { id: 1, sort_order: 0, title: 'Project 1' },
    { id: 2, sort_order: 1, title: 'Project 2' },
    { id: 3, sort_order: 2, title: 'Project 3' },
    { id: 4, sort_order: 3, title: 'Project 4' }
  ];

  it('removes item and shifts subsequent items down contiguously', () => {
    const { reordered, changedRows } = reorderAfterDelete(initialProjects, 2);

    expect(reordered.map(p => p.id)).toEqual([1, 3, 4]);
    expect(reordered.map(p => p.sort_order)).toEqual([0, 1, 2]);

    expect(changedRows).toEqual([
      { id: 3, oldSortOrder: 2, newSortOrder: 1, title: 'Project 3' },
      { id: 4, oldSortOrder: 3, newSortOrder: 2, title: 'Project 4' }
    ]);
  });
});

describe('R2 key extraction (extractR2Key)', () => {
  const cdnBase = 'https://pub-abcdef123456.r2.dev';

  it('extracts key matching public base URL', () => {
    const url = 'https://pub-abcdef123456.r2.dev/projects/my-model_1710000000.png';
    expect(extractR2Key(url, cdnBase)).toBe('projects/my-model_1710000000.png');
  });

  it('handles public base URL with trailing slash', () => {
    const url = 'https://pub-abcdef123456.r2.dev/projects/arch.jpg';
    expect(extractR2Key(url, cdnBase + '/')).toBe('projects/arch.jpg');
  });

  it('extracts key using fallback projects regex if base URL does not match', () => {
    const url = 'https://custom-r2.domain.com/projects/diagram.webp';
    expect(extractR2Key(url, 'https://different-base.dev')).toBe('projects/diagram.webp');
  });

  it('returns null on invalid or empty URLs', () => {
    expect(extractR2Key(null, cdnBase)).toBeNull();
    expect(extractR2Key('', cdnBase)).toBeNull();
    expect(extractR2Key('https://github.com/user/repo', cdnBase)).toBeNull();
  });
});
