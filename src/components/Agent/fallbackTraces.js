/**
 * Curated bilingual fallback conversation traces for offline / rate-limit playback.
 * Used when the daily rate limit (5 queries/day) is hit or network/backend is unavailable.
 */

export const FALLBACK_TRACES = [
  // 1. Projects - English
  {
    id: 'projects_en',
    lang: 'en',
    keywords: ['project', 'work', 'build', 'portfolio', 'centerfusion', 'radar', 'camera', 'detection', 'sensor'],
    thought: 'Analyzing inquiry regarding engineering projects. Querying portfolio database via list_projects() to retrieve sensor fusion and deep learning repositories...',
    toolCalls: [
      {
        tool: 'list_projects',
        params: {},
        result: [
          {
            title: 'CenterFusionDetect3D',
            tier: 'featured',
            tags: ['Python', 'PyTorch', 'Sensor Fusion', 'LiDAR', 'ROS'],
            is_confidential: false
          },
          {
            title: 'RadarCameraFusion',
            tier: 'featured',
            tags: ['C++', 'TensorRT', 'CUDA', 'Autonomous Driving'],
            is_confidential: false
          }
        ]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'projects' },
      { type: 'highlight_project', target: 'CenterFusionDetect3D' }
    ],
    response: "I've retrieved Wayne's flagship perception projects. A key highlight is CenterFusionDetect3D—a real-time 3D sensor fusion architecture merging radar point clouds and camera image features with low-latency Kalman filtering. I have highlighted this project on your mission control board."
  },

  // 2. Projects - Traditional Chinese
  {
    id: 'projects_zh',
    lang: 'zh',
    keywords: ['專案', '作品', '作品集', '核心專案', '感測器', '融合', 'centerfusion', '雷達'],
    thought: '分析專案相關查詢意圖。透過 list_projects() 工具檢索感測器融合與機器學習相關公開專案...',
    toolCalls: [
      {
        tool: 'list_projects',
        params: {},
        result: [
          {
            title: 'CenterFusionDetect3D',
            tier: 'featured',
            tags: ['Python', 'PyTorch', 'Sensor Fusion', 'LiDAR', 'ROS'],
            is_confidential: false
          },
          {
            title: 'RadarCameraFusion',
            tier: 'featured',
            tags: ['C++', 'TensorRT', 'CUDA', 'Autonomous Driving'],
            is_confidential: false
          }
        ]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'projects' },
      { type: 'highlight_project', target: 'CenterFusionDetect3D' }
    ],
    response: "已為您檢索工程師的核心專案！重點項目包含 CenterFusionDetect3D，這是一套結合毫米波雷達點雲與相機影像特徵的即時 3D 感測器融合架構。我已為您平滑滾動並在主控面板上高亮此專案。"
  },

  // 3. Skills - English
  {
    id: 'skills_en',
    lang: 'en',
    keywords: ['skill', 'stack', 'tech', 'technology', 'language', 'tools', 'pytorch', 'python', 'deep learning'],
    thought: 'Querying technical arsenal via list_skills(). Filtering deep learning and computer vision proficiencies...',
    toolCalls: [
      {
        tool: 'list_skills',
        params: {},
        result: [
          { category: 'Deep Learning', name: 'PyTorch' },
          { category: 'Deep Learning', name: 'TensorFlow' },
          { category: 'Computer Vision', name: 'OpenCV' },
          { category: 'Deployment', name: 'Docker' }
        ]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'skills' },
      { type: 'filter_skills', target: 'Deep Learning' }
    ],
    response: "The engineer specializes in Deep Learning, Computer Vision, and high-throughput MLOps. Key proficiencies include PyTorch, TensorRT, CUDA, and distributed inference pipelines. I've focused the technical arsenal grid on Deep Learning modules for you."
  },

  // 4. Skills - Traditional Chinese
  {
    id: 'skills_zh',
    lang: 'zh',
    keywords: ['技術', '技能', '專長', '工具', '程式語言', '技術棧', 'deep learning', '深度學習', 'pytorch'],
    thought: '透過 list_skills() 檢索技術軍火庫，鎖定深度學習與電腦視覺核心專長...',
    toolCalls: [
      {
        tool: 'list_skills',
        params: {},
        result: [
          { category: 'Deep Learning', name: 'PyTorch' },
          { category: 'Deep Learning', name: 'TensorFlow' },
          { category: 'Computer Vision', name: 'OpenCV' },
          { category: 'Deployment', name: 'Docker' }
        ]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'skills' },
      { type: 'filter_skills', target: 'Deep Learning' }
    ],
    response: "工程師的核心技術棧涵蓋深度學習（PyTorch、TensorRT）、電腦視覺（OpenCV、3D 物件辨識）與高效能 MLOps 部署。我已為您導引至技術軍火庫並聚焦高亮深度學習模組。"
  },

  // 5. Experience - English
  {
    id: 'experience_en',
    lang: 'en',
    keywords: ['experience', 'career', 'job', 'work', 'company', 'history', 'role'],
    thought: 'Retrieving chronological career timeline and ML engineering milestones via get_experience()...',
    toolCalls: [
      {
        tool: 'get_experience',
        params: {},
        result: [
          {
            role: 'Machine Learning Engineer',
            company: 'Autonomous Perception Labs',
            date_range: '2022 - PRESENT'
          }
        ]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'experience' }
    ],
    response: "Wayne has extensive professional experience designing perception architectures, optimizing real-time sensor pipelines, and deploying scalable deep learning models. I have navigated your view directly to the System Evolution timeline."
  },

  // 6. Experience - Traditional Chinese
  {
    id: 'experience_zh',
    lang: 'zh',
    keywords: ['經歷', '工作', '職歷', '職涯', '公司', '工作經歷', '背景'],
    thought: '調閱工作歷程與研究背景 via get_experience()...',
    toolCalls: [
      {
        tool: 'get_experience',
        params: {},
        result: [
          {
            role: 'Machine Learning Engineer',
            company: 'Autonomous Perception Labs',
            date_range: '2022 - PRESENT'
          }
        ]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'experience' }
    ],
    response: "工程師具備紮實的機器學習與感知演算法工程資歷，曾主導自動駕駛多感測器融合與邊緣運算優化。已為您滾動至職涯演進（System Evolution）時間軸。"
  },

  // 7. Profile / Contact - English
  {
    id: 'profile_en',
    lang: 'en',
    keywords: ['who', 'about', 'contact', 'email', 'resume', 'linkedin', 'github', 'reach', 'connect'],
    thought: 'Retrieving bio and verified contact channels via get_profile()...',
    toolCalls: [
      {
        tool: 'get_profile',
        params: {},
        result: {
          name: 'Wayne Heng',
          title: 'Machine Learning Engineer & Perception Researcher',
          email: 'hengweibin1898@gmail.com'
        }
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'contact' }
    ],
    response: "Wayne Heng is a Machine Learning Engineer specializing in computer vision, autonomous perception, and sensor fusion architectures. You can establish a direct handshake via email or LinkedIn below."
  },

  // 8. Profile / Contact - Traditional Chinese
  {
    id: 'profile_zh',
    lang: 'zh',
    keywords: ['誰', '介紹', '聯絡', '信箱', '履歷', '聯絡方式', '關於', 'wayne', 'heng'],
    thought: '查詢工程師個人簡介與聯絡通道 via get_profile()...',
    toolCalls: [
      {
        tool: 'get_profile',
        params: {},
        result: {
          name: 'Wayne Heng',
          title: 'Machine Learning Engineer & Perception Researcher',
          email: 'hengweibin1898@gmail.com'
        }
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'contact' }
    ],
    response: "Wayne Heng 是一位專注於電腦視覺、多感測器融合與邊緣 AI 部署的機器學習工程師。已為您捲動至聯絡握手區，可透過電子郵件或 LinkedIn 與他取得聯繫。"
  },

  // 9. Default Fallback - English
  {
    id: 'default_en',
    lang: 'en',
    keywords: [],
    thought: 'Synthesizing comprehensive overview of the portfolio system and available modules...',
    toolCalls: [
      {
        tool: 'get_profile',
        params: {},
        result: {
          name: 'Wayne Heng',
          title: 'Machine Learning Engineer'
        }
      },
      {
        tool: 'list_projects',
        params: {},
        result: [{ title: 'CenterFusionDetect3D' }]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'projects' },
      { type: 'highlight_project', target: 'CenterFusionDetect3D' }
    ],
    response: "I can help you explore Wayne's projects, core capabilities, research timeline, and verified credentials. You can ask about 3D sensor fusion architectures, technical stack proficiencies, or previous ML roles."
  },

  // 10. Default Fallback - Traditional Chinese
  {
    id: 'default_zh',
    lang: 'zh',
    keywords: [],
    thought: '彙整作品集核心模組概覽，準備提供引導式回應...',
    toolCalls: [
      {
        tool: 'get_profile',
        params: {},
        result: {
          name: 'Wayne Heng',
          title: 'Machine Learning Engineer'
        }
      },
      {
        tool: 'list_projects',
        params: {},
        result: [{ title: 'CenterFusionDetect3D' }]
      }
    ],
    uiActions: [
      { type: 'scroll_to', target: 'projects' },
      { type: 'highlight_project', target: 'CenterFusionDetect3D' }
    ],
    response: "我可以協助您探索工程師的研究專案、核心技術棧、工作歷程與專業認證。您可以詢問 3D 感測器融合架構、深度學習模型部署或職涯經歷。"
  }
];

/**
 * Resolves curated fallback conversation trace for a given prompt string.
 * @param {string} prompt
 * @returns {typeof FALLBACK_TRACES[0]}
 */
export function getFallbackTrace(prompt = '') {
  const isChinese = /[\u4e00-\u9fa5]/.test(prompt);
  const targetLang = isChinese ? 'zh' : 'en';
  const lowerPrompt = prompt.toLowerCase().trim();

  // Filter traces matching language
  const candidates = FALLBACK_TRACES.filter(t => t.lang === targetLang && t.keywords.length > 0);

  for (const trace of candidates) {
    if (trace.keywords.some(keyword => lowerPrompt.includes(keyword.toLowerCase()))) {
      return trace;
    }
  }

  // Fallback to default trace for that language
  return FALLBACK_TRACES.find(t => t.id === `default_${targetLang}`) || FALLBACK_TRACES[0];
}
