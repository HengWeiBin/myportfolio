import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* Import Fonts - adding Google Fonts import for Fira Code and Inter */
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;700&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --bg-color: #121212;
    --bg-dark: #0a0c10;
    --text-primary: #e6e6e6;
    --text-secondary: #a0a0a0;
    --accent: #8be9fd; /* Electric Blue/Cyan */
    --accent-glow: rgba(139, 233, 253, 0.3);
    --border-color: #333333;
    --success: #50fa7b;
    --warning: #ffb86c;
    --danger: #ff5555;
    
    --font-mono: 'Fira Code', 'Courier New', monospace;
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    background-color: var(--bg-color);
    background-image: linear-gradient(180deg, var(--bg-color) 0%, var(--bg-dark) 100%);
    color: var(--text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    min-height: 100vh;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-mono);
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  a {
    color: var(--accent);
    text-decoration: none;
    transition: all 0.2s ease;
    
    &:hover {
      text-decoration: underline;
      text-shadow: 0 0 5px var(--accent-glow);
    }
  }

  ul {
    list-style: none;
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: var(--bg-dark); 
  }
  ::-webkit-scrollbar-thumb {
    background: #333; 
    border-radius: 4px;
    
    &:hover {
      background: #555; 
    }
  }

  /* Utility Classes */
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .text-mono {
    font-family: var(--font-mono);
  }

  .text-accent {
    color: var(--accent);
  }
  
  .terminal-cursor::after {
    content: '_';
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
`;
