---
name: edit-portfolio-project
description: "Edits, updates, reorders, or deletes portfolio projects directly in Neon PostgreSQL database and manages Cloudflare R2 images without modifying application source code. Trigger when user wants to edit, update, reorder, delete, or inspect a portfolio project."
---

# Edit Portfolio Project Skill

Edits, updates, reorders, inspects, and deletes Machine Learning and software projects in the portfolio website without modifying frontend source code or git history. All project records are modified directly in Neon PostgreSQL, with automatic contiguous sort order re-indexing and Cloudflare R2 asset lifecycle management.

---

## Core Guardrails & Execution Policy

1. **Direct Execution Policy**:
   - When user intent is explicit (e.g., "change project 16 tier to featured", "update project 12 title", "reorder project 16 to rank 0", "delete project 9"), **execute immediately without redundant confirmation pauses**.
   - Use `--dry-run` when the user asks to preview or dry run changes first.
2. **Clean Git Tree Mandate**:
   - The script modifies database and storage directly. Git working tree must remain 100% clean.
3. **Contiguous Sort Order Invariant**:
   - All projects maintain contiguous sort order weights (`0, 1, 2, ...`).
   - When moving a project to `--sort-order=N`, the script automatically splices the target at index $N$ and normalizes all other items.
   - When deleting a project with `--delete <id>`, remaining projects are automatically re-indexed contiguously.
4. **Cloudflare R2 Asset Lifecycle**:
   - When replacing an image on an existing project, specify `--cleanup-old-image` to automatically delete the legacy asset from Cloudflare R2 via S3 `DeleteObjectCommand`.
   - When deleting a project, `--cleanup-old-image` cleans up its image asset from R2.

---

## Command Reference

### 1. List Projects
```bash
# Formatted table of all projects
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --list

# Filter by tier (featured, standard, archive)
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --list --tier="featured"

# Output as JSON
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --list --json
```

### 2. Inspect Single Project Record
```bash
# View complete project record
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --get 16

# View as JSON
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --get 16 --json
```

### 3. Edit Existing Project (Partial Update)
Untouched fields remain completely unchanged.
```bash
# Change tier and promote to top rank (contiguous reordering)
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --id 16 --tier="featured" --sort-order=0

# Update tags: append new tags or remove specific tags
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --id 16 --add-tags="TensorRT,CUDA"
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --id 16 --remove-tags="LegacyTag"

# Replace image and clean up old R2 asset
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs \
  --id 16 \
  --image-url="https://github.com/hengweibin/repo/raw/main/assets/new_arch.png" \
  --cleanup-old-image

# Dry-run preview
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --id 16 --tier="featured" --dry-run
```

### 4. Delete Project
```bash
# Delete project and re-normalize remaining sort orders
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --delete 9

# Delete project and also remove its image from R2
node .agent/skills/edit-portfolio-project/scripts/edit_project.mjs --delete 9 --cleanup-old-image
```

---

## Schema Reference

Refer to [references/database_schema.md](references/database_schema.md) for complete PostgreSQL field definitions, types, constraints, and metric schemas.
