-- Migration 003: Seed Default Skills and Admin if Empty

-- Skills seed
INSERT INTO skills (category, name)
SELECT 'Languages', 'Go' WHERE NOT EXISTS (SELECT 1 FROM skills LIMIT 1);

INSERT INTO skills (category, name)
SELECT 'Languages', 'Python' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Python');

INSERT INTO skills (category, name)
SELECT 'Languages', 'Rust' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Rust');

INSERT INTO skills (category, name)
SELECT 'Languages', 'SQL' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'SQL');

INSERT INTO skills (category, name)
SELECT 'Backend', 'Docker' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Docker');

INSERT INTO skills (category, name)
SELECT 'Backend', 'Kubernetes' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Kubernetes');

INSERT INTO skills (category, name)
SELECT 'Backend', 'gRPC' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'gRPC');

INSERT INTO skills (category, name)
SELECT 'Backend', 'PostgreSQL' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'PostgreSQL');

INSERT INTO skills (category, name)
SELECT 'Backend', 'Redis' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Redis');

INSERT INTO skills (category, name)
SELECT 'Tools & Infra', 'AWS' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'AWS');

INSERT INTO skills (category, name)
SELECT 'Tools & Infra', 'Terraform' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Terraform');

INSERT INTO skills (category, name)
SELECT 'Tools & Infra', 'Git' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Git');

INSERT INTO skills (category, name)
SELECT 'Tools & Infra', 'Linux' WHERE NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Linux');
