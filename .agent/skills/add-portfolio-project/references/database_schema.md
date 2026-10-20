# Neon PostgreSQL Projects Table Schema Reference

This reference document defines the complete schema, data types, constraints, and semantic conventions for the `projects` table in the Neon PostgreSQL database powering this Machine Learning Engineer portfolio website.

---

## 1. Schema Definition

```sql
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  date_start TEXT,
  date_end TEXT,
  tags TEXT[],
  image_url TEXT,
  tier TEXT DEFAULT 'standard',
  sort_order INTEGER DEFAULT 0,
  visual_type TEXT DEFAULT 'image',
  is_confidential BOOLEAN DEFAULT FALSE,
  repo_visibility TEXT DEFAULT 'public',
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 2. Column Specification & Semantics

| Column | Data Type | Nullable | Default | Description & Formatting Guidelines |
|---|---|---|---|---|
| `id` | `SERIAL` (INTEGER) | No | Auto-increment | Primary key uniquely identifying the project. |
| `title` | `TEXT` | No | *None* | Display title of the project (e.g., `Real-Time Multi-Object Tracking with YOLOv8 & DeepSORT`). |
| `description` | `TEXT` | Yes | `''` | Project summary and technical highlights. **Markdown supported** (supports bold, lists, inline code, and math syntax). |
| `link` | `TEXT` | Yes | `''` | Primary destination URL: GitHub repository link (e.g., `https://github.com/hengweibin/project-name`) or live demonstration. |
| `date_start` | `TEXT` | Yes | `''` | Project start date formatted as `YYYY-MM` (e.g., `'2023-07'`). |
| `date_end` | `TEXT` | Yes | `''` | Project end date formatted as `YYYY-MM` (e.g., `'2024-10'`) or `'PRESENT'` for ongoing work. |
| `tags` | `TEXT[]` | Yes | `'{}'::text[]` | Array of domain tags, frameworks, or competencies (e.g., `ARRAY['PyTorch', 'Computer Vision', 'CUDA', 'TensorRT']`). |
| `image_url` | `TEXT` | Yes | `NULL` | Public Cloudflare R2 CDN URL (e.g., `https://pub-<id>.r2.dev/projects/...`). **Never use raw.githubusercontent.com** due to CORS and browser anti-hotlinking referrer headers. |
| `tier` | `TEXT` | No | `'standard'` | Card tier classification: `'featured'` (highlighted flagship projects showcased on top) or `'standard'` (general portfolio grid). |
| `sort_order` | `INTEGER` | No | `0` | Ascending sort weight (0 is top rank / flagship). When inserting with `sort_order: 0`, existing projects with `sort_order >= 0` should be incremented. |
| `visual_type` | `TEXT` | No | `'image'` | Frontend visualization renderer component: `'image'`, `'ResultViz'`, `'NeuralArch'`, or `'CodeBlock'`. |
| `is_confidential`| `BOOLEAN` | No | `FALSE` | Indicates proprietary or NDA-protected enterprise project. If `TRUE`, sensitive repository links and client internals are masked in the UI. |
| `repo_visibility`| `TEXT` | No | `'public'` | Repository accessibility status: `'public'` (open-source) or `'private'` (internal enterprise / restricted). |
| `metrics` | `JSONB` | No | `'{}'::jsonb` | Key-value pairs for ML benchmarks, inference throughput, or evaluation statistics (e.g., `{"mAP50": "84.2%", "FPS": "120", "Latency": "8.3ms"}`). |
| `created_at` | `TIMESTAMP` | No | `NOW()` | Timestamp when the record was inserted into the database. |

---

## 3. Detailed Field Conventions

### `tier`
- `'featured'`: Renders in prominent featured project showcase cards with rich preview visualizers, full metrics chips, and expanded technical descriptions.
- `'standard'`: Displayed in the secondary project catalog grid with compact badges and summary metadata.

### `sort_order`
- `0`: Top flagship project. Displayed first in the portfolio UI.
- When assigning `sort_order: 0` to a newly added project, execute an atomic shift to maintain unique ordering:
  ```sql
  UPDATE projects SET sort_order = sort_order + 1 WHERE sort_order >= 0;
  ```
- Subsequent projects are ordered in ascending order (`ORDER BY sort_order ASC, id DESC`).

### `visual_type`
The UI maps `visual_type` to specialized visualization components:
- `'image'`: Standard project thumbnail or architecture graphic served from Cloudflare R2 CDN.
- `'ResultViz'`: Interactive charts or evaluation visualizer (e.g., precision-recall curves, loss curves).
- `'NeuralArch'`: Neural network topology or pipeline workflow diagram.
- `'CodeBlock'`: Terminal code snippet or model inference signature preview.

### `metrics` (JSONB)
Stores quantifiable machine learning benchmarks and performance metrics. Format as key-value pairs where values include units:
```json
{
  "mAP@0.5": "76.4%",
  "FPS (RTX 4090)": "142",
  "Model Size": "48.2 MB",
  "Params": "25.3M"
}
```

---

## 4. Query Examples (Neon Parameterized SQL)

### Select Projects by Display Order
```sql
SELECT * FROM projects 
ORDER BY sort_order ASC, id DESC;
```

### Shift Existing Sort Order for Flagship Insertion
```sql
UPDATE projects 
SET sort_order = sort_order + 1 
WHERE sort_order >= 0;
```

### Parameterized Insert
```javascript
import { neon } from '@netlify/neon';
const sql = neon(process.env.NETLIFY_DATABASE_URL || process.env.REACT_APP_DATABASE_URL);

const result = await sql`
  INSERT INTO projects (
    title, description, link, date_start, date_end,
    tags, image_url, tier, sort_order, visual_type,
    is_confidential, repo_visibility, metrics
  ) VALUES (
    ${title},
    ${description},
    ${link},
    ${date_start},
    ${date_end},
    ${tags},
    ${image_url},
    ${tier},
    ${sort_order},
    ${visual_type},
    ${is_confidential},
    ${repo_visibility},
    ${JSON.stringify(metrics)}
  )
  RETURNING *;
`;
```

---

## 5. Sample JSON Record

```json
{
  "title": "Low-Latency Transformer Inference Engine",
  "description": "Optimized TensorRT and CUDA execution kernel for real-time vision-language models, achieving 3.2x latency reduction on edge devices.",
  "link": "https://github.com/hengweibin/transformer-trt-infer",
  "date_start": "2024-01",
  "date_end": "2024-08",
  "tags": ["TensorRT", "CUDA", "C++", "PyTorch", "ONNX"],
  "image_url": "https://pub-xxxxxx.r2.dev/projects/transformer-trt-infer_1718000000000.png",
  "tier": "featured",
  "sort_order": 0,
  "visual_type": "NeuralArch",
  "is_confidential": false,
  "repo_visibility": "public",
  "metrics": {
    "Latency": "4.2 ms",
    "Speedup": "3.2x",
    "Throughput": "240 req/s"
  }
}
```
