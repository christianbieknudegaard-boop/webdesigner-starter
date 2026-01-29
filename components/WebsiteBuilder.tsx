'use client';

import { WebsiteConfig } from '@/types/website';
import { useState } from 'react';

interface WebsiteBuilderProps {
  config: WebsiteConfig;
  onChange: (config: WebsiteConfig) => void;
}

export default function WebsiteBuilder({ config, onChange }: WebsiteBuilderProps) {
  const [activeTab, setActiveTab] = useState('general');

  const updateConfig = (path: string[], value: any) => {
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  const tabs = [
    { id: 'general', label: 'Generelt' },
    { id: 'hero', label: 'Hovedseksjon' },
    { id: 'about', label: 'Om oss' },
    { id: 'services', label: 'Tjenester' },
    { id: 'contact', label: 'Kontakt' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nettstedsnavn
            </label>
            <input
              type="text"
              value={config.siteName}
              onChange={(e) => updateConfig(['siteName'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mitt Firma AS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slagord
            </label>
            <input
              type="text"
              value={config.tagline}
              onChange={(e) => updateConfig(['tagline'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Din pålitelige partner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primærfarge
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig(['primaryColor'], e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={config.primaryColor}
                  onChange={(e) => updateConfig(['primaryColor'], e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sekundærfarge
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.secondaryColor}
                  onChange={(e) => updateConfig(['secondaryColor'], e.target.value)}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={config.secondaryColor}
                  onChange={(e) => updateConfig(['secondaryColor'], e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="#1F2937"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo URL (valgfritt)
            </label>
            <input
              type="text"
              value={config.logo}
              onChange={(e) => updateConfig(['logo'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>
      )}

      {/* Hero Section */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hovedoverskrift
            </label>
            <input
              type="text"
              value={config.sections.hero.title}
              onChange={(e) => updateConfig(['sections', 'hero', 'title'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Velkommen til vår hjemmeside"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Undertekst
            </label>
            <textarea
              value={config.sections.hero.subtitle}
              onChange={(e) => updateConfig(['sections', 'hero', 'subtitle'], e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="En kort beskrivelse av hva du tilbyr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call-to-Action tekst
            </label>
            <input
              type="text"
              value={config.sections.hero.ctaText}
              onChange={(e) => updateConfig(['sections', 'hero', 'ctaText'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Kom i gang"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bakgrunnsbilde URL (valgfritt)
            </label>
            <input
              type="text"
              value={config.sections.hero.backgroundImage}
              onChange={(e) => updateConfig(['sections', 'hero', 'backgroundImage'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/hero.jpg"
            />
          </div>
        </div>
      )}

      {/* About Section */}
      {activeTab === 'about' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overskrift
            </label>
            <input
              type="text"
              value={config.sections.about.title}
              onChange={(e) => updateConfig(['sections', 'about', 'title'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Om oss"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Innhold
            </label>
            <textarea
              value={config.sections.about.content}
              onChange={(e) => updateConfig(['sections', 'about', 'content'], e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Fortell om din bedrift, din historie og dine verdier..."
            />
          </div>
        </div>
      )}

      {/* Services Section */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overskrift
            </label>
            <input
              type="text"
              value={config.sections.services.title}
              onChange={(e) => updateConfig(['sections', 'services', 'title'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Våre tjenester"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Tjenester
            </label>
            {config.sections.services.items.map((service, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md space-y-2">
                <input
                  type="text"
                  value={service.title}
                  onChange={(e) => {
                    const newItems = [...config.sections.services.items];
                    newItems[index].title = e.target.value;
                    updateConfig(['sections', 'services', 'items'], newItems);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Tjenestenavn"
                />
                <textarea
                  value={service.description}
                  onChange={(e) => {
                    const newItems = [...config.sections.services.items];
                    newItems[index].description = e.target.value;
                    updateConfig(['sections', 'services', 'items'], newItems);
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Beskrivelse av tjenesten"
                />
              </div>
            ))}
            
            <button
              onClick={() => {
                const newItems = [
                  ...config.sections.services.items,
                  { title: '', description: '' }
                ];
                updateConfig(['sections', 'services', 'items'], newItems);
              }}
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              + Legg til tjeneste
            </button>
          </div>
        </div>
      )}

      {/* Contact Section */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overskrift
            </label>
            <input
              type="text"
              value={config.sections.contact.title}
              onChange={(e) => updateConfig(['sections', 'contact', 'title'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Kontakt oss"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-post
            </label>
            <input
              type="email"
              value={config.sections.contact.email}
              onChange={(e) => updateConfig(['sections', 'contact', 'email'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="post@eksempel.no"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={config.sections.contact.phone}
              onChange={(e) => updateConfig(['sections', 'contact', 'phone'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="+47 123 45 678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={config.sections.contact.address}
              onChange={(e) => updateConfig(['sections', 'contact', 'address'], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Gateadresse 1, 0123 Oslo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
