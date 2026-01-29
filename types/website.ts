export interface WebsiteConfig {
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  sections: {
    hero: {
      title: string;
      subtitle: string;
      ctaText: string;
      backgroundImage: string;
    };
    about: {
      title: string;
      content: string;
    };
    services: {
      title: string;
      items: Array<{
        title: string;
        description: string;
      }>;
    };
    contact: {
      title: string;
      email: string;
      phone: string;
      address: string;
    };
  };
}
