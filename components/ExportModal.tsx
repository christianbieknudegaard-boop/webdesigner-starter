'use client';

import { WebsiteConfig } from '@/types/website';
import { useState } from 'react';

interface ExportModalProps {
  config: WebsiteConfig;
  onClose: () => void;
}

export default function ExportModal({ config, onClose }: ExportModalProps) {
  const [exportType, setExportType] = useState<'html' | 'json'>('html');
  const [copied, setCopied] = useState(false);

  const generateHTML = () => {
    return `<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.siteName || 'Min Hjemmeside'}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
        }
        nav {
            background-color: ${config.secondaryColor};
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        nav h1 {
            color: white;
            font-size: 1.5rem;
        }
        nav p {
            color: #d1d5db;
            font-size: 0.875rem;
        }
        nav a {
            color: white;
            text-decoration: none;
            margin-left: 1.5rem;
        }
        nav a:hover {
            text-decoration: underline;
        }
        .nav-links {
            display: flex;
        }
        .hero {
            background-color: ${config.primaryColor};
            ${config.sections.hero.backgroundImage ? `background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.sections.hero.backgroundImage});` : ''}
            background-size: cover;
            background-position: center;
            color: white;
            text-align: center;
            padding: 6rem 2rem;
        }
        .hero h2 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .hero p {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
        }
        .cta-button {
            background-color: ${config.secondaryColor};
            color: white;
            padding: 1rem 2rem;
            font-size: 1.125rem;
            border: none;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
        }
        .cta-button:hover {
            opacity: 0.9;
        }
        .about {
            padding: 4rem 2rem;
            background-color: #f9fafb;
        }
        .about-content {
            max-width: 1024px;
            margin: 0 auto;
        }
        .about h2 {
            color: ${config.secondaryColor};
            font-size: 2rem;
            margin-bottom: 1.5rem;
            text-align: center;
        }
        .about p {
            font-size: 1.125rem;
            color: #374151;
            white-space: pre-line;
        }
        .services {
            padding: 4rem 2rem;
            background-color: white;
        }
        .services-content {
            max-width: 1280px;
            margin: 0 auto;
        }
        .services h2 {
            color: ${config.secondaryColor};
            font-size: 2rem;
            margin-bottom: 3rem;
            text-align: center;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        .service-card {
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-top: 4px solid ${config.primaryColor};
        }
        .service-card h3 {
            color: ${config.primaryColor};
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
        }
        .service-card p {
            color: #6b7280;
        }
        .contact {
            background-color: ${config.secondaryColor};
            color: white;
            padding: 4rem 2rem;
            text-align: center;
        }
        .contact h2 {
            font-size: 2rem;
            margin-bottom: 2rem;
        }
        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            max-width: 1024px;
            margin: 0 auto;
        }
        .contact-item h3 {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        footer {
            background-color: #111827;
            color: #9ca3af;
            text-align: center;
            padding: 1.5rem;
        }
        ${config.logo ? `.logo { height: 40px; margin-right: 1rem; }` : ''}
    </style>
</head>
<body>
    <nav>
        <div style="display: flex; align-items: center;">
            ${config.logo ? `<img src="${config.logo}" alt="Logo" class="logo">` : ''}
            <div>
                <h1>${config.siteName || 'Firmanavn'}</h1>
                ${config.tagline ? `<p>${config.tagline}</p>` : ''}
            </div>
        </div>
        <div class="nav-links">
            <a href="#home">Hjem</a>
            <a href="#about">Om oss</a>
            <a href="#services">Tjenester</a>
            <a href="#contact">Kontakt</a>
        </div>
    </nav>

    <section id="home" class="hero">
        <h2>${config.sections.hero.title}</h2>
        <p>${config.sections.hero.subtitle}</p>
        <button class="cta-button">${config.sections.hero.ctaText}</button>
    </section>

    <section id="about" class="about">
        <div class="about-content">
            <h2>${config.sections.about.title}</h2>
            <p>${config.sections.about.content}</p>
        </div>
    </section>

    <section id="services" class="services">
        <div class="services-content">
            <h2>${config.sections.services.title}</h2>
            <div class="services-grid">
                ${config.sections.services.items.map(service => `
                <div class="service-card">
                    <h3>${service.title}</h3>
                    <p>${service.description}</p>
                </div>
                `).join('')}
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <h2>${config.sections.contact.title}</h2>
        <div class="contact-grid">
            <div class="contact-item">
                <h3>E-post</h3>
                <p>${config.sections.contact.email}</p>
            </div>
            <div class="contact-item">
                <h3>Telefon</h3>
                <p>${config.sections.contact.phone}</p>
            </div>
            <div class="contact-item">
                <h3>Adresse</h3>
                <p>${config.sections.contact.address}</p>
            </div>
        </div>
    </section>

    <footer>
        <p>&copy; ${new Date().getFullYear()} ${config.siteName || 'Firmanavn'}. Alle rettigheter reservert.</p>
    </footer>
</body>
</html>`;
  };

  const generateJSON = () => {
    return JSON.stringify(config, null, 2);
  };

  const handleCopy = () => {
    const content = exportType === 'html' ? generateHTML() : generateJSON();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = exportType === 'html' ? generateHTML() : generateJSON();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportType === 'html' ? 'website.html' : 'config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Eksporter hjemmeside</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setExportType('html')}
              className={`px-4 py-2 rounded-md font-medium ${
                exportType === 'html'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              HTML fil
            </button>
            <button
              onClick={() => setExportType('json')}
              className={`px-4 py-2 rounded-md font-medium ${
                exportType === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              JSON konfigurasjon
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
            <code>{exportType === 'html' ? generateHTML() : generateJSON()}</code>
          </pre>
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            {copied ? '✓ Kopiert!' : 'Kopier kode'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Last ned fil
          </button>
        </div>
      </div>
    </div>
  );
}
