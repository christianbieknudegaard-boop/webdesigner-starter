'use client';

import { WebsiteConfig } from '@/types/website';
import { useState } from 'react';
import ExportModal from './ExportModal';

interface PreviewPaneProps {
  config: WebsiteConfig;
}

export default function PreviewPane({ config }: PreviewPaneProps) {
  const [scale, setScale] = useState(0.5);
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Zoom:</label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{Math.round(scale * 100)}%</span>
        </div>
        
        <button
          onClick={() => setShowExport(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
        >
          Eksporter
        </button>
      </div>

      <div className="border border-gray-300 rounded-md overflow-auto bg-gray-100 p-4">
        <div 
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${100 / scale}%`,
          }}
        >
          <div className="bg-white shadow-lg" style={{ minHeight: '800px' }}>
            {/* Navigation */}
            <nav 
              className="px-6 py-4 flex items-center justify-between shadow-sm"
              style={{ backgroundColor: config.secondaryColor }}
            >
              <div className="flex items-center gap-3">
                {config.logo && (
                  <img src={config.logo} alt="Logo" className="h-10 w-auto" />
                )}
                <div>
                  <h1 className="text-xl font-bold text-white">{config.siteName || 'Firmanavn'}</h1>
                  {config.tagline && (
                    <p className="text-sm text-gray-300">{config.tagline}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-6 text-white">
                <a href="#home" className="hover:underline">Hjem</a>
                <a href="#about" className="hover:underline">Om oss</a>
                <a href="#services" className="hover:underline">Tjenester</a>
                <a href="#contact" className="hover:underline">Kontakt</a>
              </div>
            </nav>

            {/* Hero Section */}
            <section 
              className="relative px-6 py-24 text-center text-white"
              style={{
                backgroundColor: config.primaryColor,
                backgroundImage: config.sections.hero.backgroundImage 
                  ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${config.sections.hero.backgroundImage})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <h2 className="text-5xl font-bold mb-4">
                {config.sections.hero.title || 'Hovedoverskrift'}
              </h2>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                {config.sections.hero.subtitle || 'Din undertekst her'}
              </p>
              <button 
                className="px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:opacity-90 transition"
                style={{ backgroundColor: config.secondaryColor }}
              >
                {config.sections.hero.ctaText || 'Kom i gang'}
              </button>
            </section>

            {/* About Section */}
            <section id="about" className="px-6 py-16 bg-gray-50">
              <div className="max-w-4xl mx-auto">
                <h2 
                  className="text-3xl font-bold mb-6 text-center"
                  style={{ color: config.secondaryColor }}
                >
                  {config.sections.about.title}
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                  {config.sections.about.content}
                </p>
              </div>
            </section>

            {/* Services Section */}
            <section id="services" className="px-6 py-16 bg-white">
              <div className="max-w-6xl mx-auto">
                <h2 
                  className="text-3xl font-bold mb-12 text-center"
                  style={{ color: config.secondaryColor }}
                >
                  {config.sections.services.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {config.sections.services.items.map((service, index) => (
                    <div 
                      key={index} 
                      className="p-6 rounded-lg shadow-md border-t-4"
                      style={{ borderTopColor: config.primaryColor }}
                    >
                      <h3 className="text-xl font-semibold mb-3" style={{ color: config.primaryColor }}>
                        {service.title || `Tjeneste ${index + 1}`}
                      </h3>
                      <p className="text-gray-600">
                        {service.description || 'Beskrivelse av tjenesten'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section 
              id="contact" 
              className="px-6 py-16 text-white"
              style={{ backgroundColor: config.secondaryColor }}
            >
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-8">
                  {config.sections.contact.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h3 className="font-semibold mb-2">E-post</h3>
                    <p>{config.sections.contact.email}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Telefon</h3>
                    <p>{config.sections.contact.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Adresse</h3>
                    <p>{config.sections.contact.address}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-6 bg-gray-900 text-gray-400 text-center">
              <p>&copy; {new Date().getFullYear()} {config.siteName || 'Firmanavn'}. Alle rettigheter reservert.</p>
            </footer>
          </div>
        </div>
      </div>

      {showExport && (
        <ExportModal config={config} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
