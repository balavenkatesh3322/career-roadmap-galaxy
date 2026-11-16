import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, writeFileSync } from 'node:fs';

const root = import.meta.dirname;
// Every *.html file in the project root is a page.
const pages = readdirSync(root).filter((f) => f.endsWith('.html') && !f.startsWith('_'));
const input = Object.fromEntries(pages.map((f) => [f.replace('.html', ''), resolve(root, f)]));

/**
 * SEO for every page from one place: canonical URL, Open Graph + Twitter cards (per-page share image),
 * icons, manifest, theme colour and JSON-LD. Title/description come from each page's own <title> and
 * <meta name="description">. Also writes sitemap.xml and robots.txt into dist/.
 */
function seo(siteUrl) {
  const base = siteUrl.replace(/\/$/, '');
  const pathOf = (file) => (file === 'index.html' ? '/' : `/${file.replace('.html', '')}`);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return {
    name: 'career-galaxy-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const file = ctx.filename.split(/[\\/]/).pop();
        const page = file.replace('.html', '');
        const title = ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'Career Galaxy').replace(/&amp;/g, '&');
        const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
        const url = base + pathOf(file);
        const image = `${base}/og/${page}.jpg`;
        const ld = page === 'index' ? `
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Career Galaxy',
      url: base + '/',
      description: desc,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Any (web browser with WebGL)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      image,
      author: { '@type': 'Person', name: 'Bala Venkatesh' },
      isAccessibleForFree: true,
      license: 'https://opensource.org/licenses/MIT'
    })}</script>` : '';
        const tags = `
    <link rel="canonical" href="${url}">
    <meta name="theme-color" content="#0d0c14" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#fbfaff" media="(prefers-color-scheme: light)">
    <meta name="author" content="Bala Venkatesh">
    <meta name="keywords" content="tech career roadmap, developer roadmap, data science roadmap, machine learning engineer roadmap, gen ai engineer roadmap, devops roadmap, career switch, learning path, 3d, pixijs">
    <meta name="robots" content="index, follow, max-image-preview:large">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/site.webmanifest">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Career Galaxy">
    <meta property="og:locale" content="en_US">
    <meta property="og:url" content="${url}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${image}">
    <meta name="twitter:image:alt" content="${esc(title)}">${ld}`;
        // drop the page's own favicon line (the block above has all icons), inject after the description
        return html.replace(/\s*<link rel="icon"[^>]*>/, '').replace(/(<meta name="description"[^>]*>)/, `$1${tags}`);
      }
    },
    closeBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = pages.map((f) => `  <url><loc>${base}${pathOf(f)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${f === 'index.html' ? '1.0' : '0.8'}</priority></url>`);
      writeFileSync(resolve(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
      writeFileSync(resolve(root, 'dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, 'VITE_');
  const siteUrl = process.env.VITE_SITE_URL || env.VITE_SITE_URL || 'https://career-roadmap-galaxy.vercel.app';
  return {
    base: '/',
    plugins: [seo(siteUrl)],
    // pre-bundle up front so dev never re-optimizes mid-session
    optimizeDeps: { include: ['pixi.js', '@pixi/3d', '@pixi/3d/extras'] },
    server: { port: 5179 },
    build: { rollupOptions: { input }, chunkSizeWarningLimit: 1600 }
  };
});
