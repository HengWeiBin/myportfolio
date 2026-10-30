/**
 * Fallback / seed portfolio dataset for Heng Wei Bin (Wayne).
 * Used when the backend database is unconfigured or unreachable during local development.
 */

export const FALLBACK_PROFILE = {
  id: 1,
  name: 'Heng Wei Bin (Wayne)',
  title: 'AI Systems & Knowledge Engineer',
  email: 'hengweibin1898@gmail.com',
  phone: '+886-900-000-000',
  bio: 'Specializing in Agentic RAG architectures, LLM deployment, and ontology engineering to bridge complex domain knowledge with reliable AI solutions.',
  github: 'https://github.com/hengweibin',
  linkedin: 'https://www.linkedin.com/in/wayne-hengweibin-ai',
  instagram: '',
  facebook: '',
  resume_link: '/resume.pdf'
};

export const FALLBACK_PROJECTS = [
  {
    id: 1,
    title: 'CenterFusionDetect3D',
    description: 'Real-time 3D sensor fusion architecture integrating millimeter-wave radar point clouds with RGB camera imagery using low-latency Kalman filtering and deep feature association.',
    link: 'https://github.com/hengweibin/CenterFusionDetect3D',
    date_start: '2023-01',
    date_end: '2023-08',
    image_url: '/img/websiteThumbnail.jpg',
    tags: ['Python', 'PyTorch', 'Sensor Fusion', 'LiDAR', 'ROS2', 'CUDA'],
    tier: 'featured',
    sort_order: 1,
    visual_type: 'image',
    is_confidential: false,
    repo_visibility: 'public',
    metrics: { latency: '12ms', mAP: '84.6%', fps: '60 FPS' }
  },
  {
    id: 2,
    title: 'RadarCameraFusion',
    description: 'High-throughput sensor fusion perception pipeline with TensorRT acceleration and asynchronous multi-sensor synchronization.',
    link: 'https://github.com/hengweibin/RadarCameraFusion',
    date_start: '2023-09',
    date_end: '2024-02',
    image_url: '/img/websiteThumbnail.jpg',
    tags: ['C++', 'TensorRT', 'CUDA', 'Autonomous Driving', 'PyTorch'],
    tier: 'featured',
    sort_order: 2,
    visual_type: 'image',
    is_confidential: false,
    repo_visibility: 'public',
    metrics: { fps: '60 FPS', precision: '92.4%' }
  },
  {
    id: 3,
    title: 'StudentsRegistrationSystem',
    description: 'Scalable student administration and course enrollment management system with automated validation and role-based access control.',
    link: 'https://github.com/hengweibin/StudentsRegistrationSystem',
    date_start: '2022-03',
    date_end: '2022-07',
    image_url: '/img/websiteThumbnail.jpg',
    tags: ['Python', 'FastAPI', 'PostgreSQL', 'Docker'],
    tier: 'standard',
    sort_order: 3,
    visual_type: 'image',
    is_confidential: false,
    repo_visibility: 'public',
    metrics: { uptime: '99.9%' }
  }
];

export const FALLBACK_SKILLS = [
  { id: 1, category: 'Deep Learning', name: 'PyTorch', icon: 'pytorch' },
  { id: 2, category: 'Deep Learning', name: 'TensorRT', icon: 'tensorrt' },
  { id: 3, category: 'Deep Learning', name: 'TensorFlow', icon: 'tensorflow' },
  { id: 4, category: 'Deep Learning', name: 'CUDA', icon: 'cuda' },
  { id: 5, category: 'Computer Vision', name: 'OpenCV', icon: 'opencv' },
  { id: 6, category: 'Computer Vision', name: '3D Object Detection', icon: 'vision' },
  { id: 7, category: 'Computer Vision', name: 'Sensor Fusion', icon: 'fusion' },
  { id: 8, category: 'Computer Vision', name: 'ROS2', icon: 'ros' },
  { id: 9, category: 'Languages', name: 'Python', icon: 'python' },
  { id: 10, category: 'Languages', name: 'C++', icon: 'cpp' },
  { id: 11, category: 'Languages', name: 'Go', icon: 'go' },
  { id: 12, category: 'Languages', name: 'SQL', icon: 'sql' },
  { id: 13, category: 'Backend & MLOps', name: 'Docker', icon: 'docker' },
  { id: 14, category: 'Backend & MLOps', name: 'Kubernetes', icon: 'k8s' },
  { id: 15, category: 'Backend & MLOps', name: 'FastAPI', icon: 'fastapi' },
  { id: 16, category: 'Backend & MLOps', name: 'PostgreSQL', icon: 'postgres' }
];

export const FALLBACK_EXPERIENCE = [
  {
    id: 1,
    role: 'Perception Engineer & ML Researcher',
    company: 'Autonomous Systems & Robotics Lab',
    date_range: '2023 - PRESENT',
    description: 'Leading real-time 3D perception architectures, integrating millimeter-wave radar and camera image features with low-latency Kalman filtering.',
    tech_stack: ['PyTorch', 'ROS2', 'CUDA', 'TensorRT', 'C++', 'Python'],
    sort_order: 1
  },
  {
    id: 2,
    role: 'AI Software Engineer',
    company: 'Intelligent Vision Systems',
    date_range: '2021 - 2023',
    description: 'Engineered high-throughput computer vision models, scalable inference microservices, and automated data pipelines.',
    tech_stack: ['Python', 'FastAPI', 'Docker', 'PostgreSQL', 'OpenCV'],
    sort_order: 2
  }
];

export const FALLBACK_CERTIFICATES = [
  {
    id: 1,
    title: 'Deep Learning Specialization',
    issuer: 'DeepLearning.AI',
    date: '2023-04',
    image_url: '',
    credential_id: 'DL-SPEC-9823',
    category: 'Certificate',
    tier: 'featured',
    sort_order: 1
  },
  {
    id: 2,
    title: 'AWS Certified Machine Learning - Specialty',
    issuer: 'Amazon Web Services',
    date: '2023-11',
    image_url: '',
    credential_id: 'AWS-MLS-7821',
    category: 'Certificate',
    tier: 'featured',
    sort_order: 2
  }
];

export const FALLBACK_PORTFOLIO_DATA = {
  profile: FALLBACK_PROFILE,
  skills: FALLBACK_SKILLS,
  projects: FALLBACK_PROJECTS,
  experience: FALLBACK_EXPERIENCE,
  certificates: FALLBACK_CERTIFICATES,
  tiered_projects: {
    featured: FALLBACK_PROJECTS.filter(p => p.tier === 'featured'),
    standard: FALLBACK_PROJECTS.filter(p => p.tier === 'standard')
  },
  tiered_certificates: {
    featured: FALLBACK_CERTIFICATES.filter(c => c.tier === 'featured'),
    standard: FALLBACK_CERTIFICATES.filter(c => c.tier === 'standard')
  },
  tiered: {
    projects: {
      featured: FALLBACK_PROJECTS.filter(p => p.tier === 'featured'),
      standard: FALLBACK_PROJECTS.filter(p => p.tier === 'standard')
    },
    certificates: {
      featured: FALLBACK_CERTIFICATES.filter(c => c.tier === 'featured'),
      standard: FALLBACK_CERTIFICATES.filter(c => c.tier === 'standard')
    }
  }
};
