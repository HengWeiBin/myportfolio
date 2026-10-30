const fs = require('fs');
const path = require('path');
const { ROUTE_SEO_METADATA } = require('../src/data/seoMetadata.js');

const defaultBuildDir = path.resolve(__dirname, '../build');

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;');
}

function replaceOrInsert(html, regex, replacement, insertionPoint = '</head>') {
  if (regex.test(html)) {
    return html.replace(regex, replacement);
  }
  return html.replace(insertionPoint, `  ${replacement}\n${insertionPoint}`);
}

function prerenderSeoPages(buildDir = defaultBuildDir) {
  const indexHtmlPath = path.join(buildDir, 'index.html');
  if (!fs.existsSync(indexHtmlPath)) {
    console.warn(`[prerender-seo] ${indexHtmlPath} does not exist. Skipping prerender.`);
    return;
  }

  const baseHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // 1. Homepage build/index.html
  const homeMeta = ROUTE_SEO_METADATA['/'];
  const homeRootContent = `    <header class="site-header">
      <h1>王偉斌 (Wayne) — AI Systems &amp; Knowledge Engineer</h1>
      <p class="bio">Specializing in Agentic RAG architectures, LLM deployment, and ontology engineering to bridge complex domain knowledge with reliable AI solutions.</p>
      <nav>
        <a href="/">Home</a>
        <a href="/archive">Archive</a>
        <a href="/resume.pdf">Resume</a>
      </nav>
    </header>
    <main>
      <section id="featured-work">
        <h2>Featured Projects</h2>
        <article>
          <h3>CenterFusionDetect3D</h3>
          <p>Real-time 3D sensor fusion architecture integrating millimeter-wave radar point clouds with RGB camera imagery using low-latency Kalman filtering and deep feature association.</p>
        </article>
        <article>
          <h3>RadarCameraFusion</h3>
          <p>High-throughput sensor fusion perception pipeline with TensorRT acceleration and asynchronous multi-sensor synchronization.</p>
        </article>
      </section>
      <section id="system-evolution">
        <h2>System Evolution</h2>
        <article>
          <h3>Perception Engineer &amp; ML Researcher</h3>
          <p>Autonomous Systems &amp; Robotics Lab</p>
        </article>
        <article>
          <h3>AI Software Engineer</h3>
          <p>Intelligent Vision Systems</p>
        </article>
      </section>
    </main>`;

  let homeHtml = baseHtml;
  homeHtml = replaceOrInsert(
    homeHtml,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(homeMeta.title)}</title>`
  );
  homeHtml = replaceOrInsert(
    homeHtml,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(homeMeta.description)}">`
  );
  homeHtml = replaceOrInsert(
    homeHtml,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${homeMeta.canonical}">`
  );
  homeHtml = replaceOrInsert(
    homeHtml,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(homeMeta.ogTitle)}" />`
  );
  homeHtml = replaceOrInsert(
    homeHtml,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(homeMeta.ogDescription)}" />`
  );
  homeHtml = replaceOrInsert(
    homeHtml,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${homeMeta.ogUrl}" />`
  );
  homeHtml = replaceOrInsert(
    homeHtml,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${homeMeta.robots}">`
  );
  homeHtml = homeHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${homeRootContent}\n  </div>`);

  fs.writeFileSync(indexHtmlPath, homeHtml, 'utf8');
  console.log(`[prerender-seo] Generated ${indexHtmlPath}`);

  // 2. Archive Page build/archive/index.html
  const archiveDir = path.join(buildDir, 'archive');
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const archiveMeta = ROUTE_SEO_METADATA['/archive'];
  const archiveRootContent = `    <header>
      <nav>
        <a href="/">Return to Mission Control</a>
      </nav>
      <h1>Artifacts Archive</h1>
      <p>Explore the engineering archive of Wayne (王偉斌), featuring Agentic RAG architectures, LLM deployment, ontology engineering, and AI systems artifacts.</p>
    </header>
    <main>
      <section>
        <h2>All Engineering Artifacts &amp; Credentials</h2>
        <article>
          <h3>CenterFusionDetect3D</h3>
          <p>Real-time 3D sensor fusion architecture integrating millimeter-wave radar point clouds with RGB camera imagery.</p>
        </article>
        <article>
          <h3>RadarCameraFusion</h3>
          <p>High-throughput sensor fusion perception pipeline with TensorRT acceleration and asynchronous multi-sensor synchronization.</p>
        </article>
        <article>
          <h3>Deep Learning Specialization</h3>
          <p>DeepLearning.AI credential in neural network design and hyperparameter tuning.</p>
        </article>
      </section>
    </main>`;

  let archiveHtml = baseHtml;
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(archiveMeta.title)}</title>`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeHtml(archiveMeta.description)}">`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${archiveMeta.canonical}">`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeHtml(archiveMeta.ogTitle)}" />`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(archiveMeta.ogDescription)}" />`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+property=["']og:url["'][^>]*>/i,
    `<meta property="og:url" content="${archiveMeta.ogUrl}" />`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeHtml(archiveMeta.twitterTitle)}" />`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeHtml(archiveMeta.twitterDescription)}" />`
  );
  archiveHtml = replaceOrInsert(
    archiveHtml,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${archiveMeta.robots}">`
  );
  archiveHtml = archiveHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${archiveRootContent}\n  </div>`);

  const archiveHtmlPath = path.join(archiveDir, 'index.html');
  fs.writeFileSync(archiveHtmlPath, archiveHtml, 'utf8');
  console.log(`[prerender-seo] Generated ${archiveHtmlPath}`);

  // 3. 404 Not Found build/404.html
  const notFoundMeta = ROUTE_SEO_METADATA.notFound;
  const notFoundRootContent = `    <main class="not-found-container">
      <h1>404 // ROUTE_NOT_FOUND</h1>
      <p>The requested trajectory does not exist within the neural lattice.</p>
      <nav>
        <a href="/">Return to Mission Control</a>
      </nav>
    </main>`;

  let notFoundHtml = baseHtml;
  notFoundHtml = replaceOrInsert(
    notFoundHtml,
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(notFoundMeta.title)}</title>`
  );
  notFoundHtml = replaceOrInsert(
    notFoundHtml,
    /<meta\s+name=["']robots["'][^>]*>/i,
    `<meta name="robots" content="${notFoundMeta.robots}">`
  );
  // Remove canonical tag on 404 page so it does NOT canonicalize to root
  notFoundHtml = notFoundHtml.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '');
  notFoundHtml = notFoundHtml.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">\n${notFoundRootContent}\n  </div>`);

  const notFoundHtmlPath = path.join(buildDir, '404.html');
  fs.writeFileSync(notFoundHtmlPath, notFoundHtml, 'utf8');
  console.log(`[prerender-seo] Generated ${notFoundHtmlPath}`);
}

module.exports = { prerenderSeoPages };

if (require.main === module) {
  prerenderSeoPages();
}
