'use client';

import { useState } from 'react';
import WebsiteBuilder from '@/components/WebsiteBuilder';
import PreviewPane from '@/components/PreviewPane';
import { WebsiteConfig } from '@/types/website';

export default function Home() {
  const [config, setConfig] = useState<WebsiteConfig>({
    siteName: '',
    tagline: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    logo: '',
    sections: {
      hero: {
        title: 'Velkommen til din nye hjemmeside',
        subtitle: 'Vi hjelper deg med å bygge din drømmewebside',
        ctaText: 'Kom i gang',
        backgroundImage: '',
      },
      about: {
        title: 'Om oss',
        content: 'Fortell kundene dine hvem du er og hva du gjør.',
      },
      services: {
        title: 'Våre tjenester',
        items: [
          { title: 'Tjeneste 1', description: 'Beskrivelse av tjeneste 1' },
          { title: 'Tjeneste 2', description: 'Beskrivelse av tjeneste 2' },
          { title: 'Tjeneste 3', description: 'Beskrivelse av tjeneste 3' },
        ],
      },
      contact: {
        title: 'Kontakt oss',
        email: 'post@eksempel.no',
        phone: '+47 123 45 678',
        address: 'Gateadresse 1, 0123 Oslo',
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Webdesign Builder</h1>
          <p className="text-gray-600">Lag profesjonelle hjemmesider på minutter</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Konfigurer din hjemmeside</h2>
            <WebsiteBuilder config={config} onChange={setConfig} />
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Forhåndsvisning</h2>
              <PreviewPane config={config} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
