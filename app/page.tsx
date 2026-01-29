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
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
