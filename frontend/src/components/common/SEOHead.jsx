import { useEffect } from 'react';

/**
 * SEO Head component for dynamic page titles and meta tags
 * @param {string} title - Page title
 * @param {string} description - Page description
 */
export default function SEOHead({ 
  title = 'Sisters Kitchen - Fresh Homemade Food from Local Women Vendors',
  description = 'Order delicious homemade food from amazing local women chefs. Support female entrepreneurs while enjoying authentic, fresh meals delivered to your door.'
}) {
  useEffect(() => {
    // Update title
    document.title = title.includes('Sisters Kitchen') ? title : `${title} | Sisters Kitchen`;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    // Update or create og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = document.title;

    // Update or create og:description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.content = description;
  }, [title, description]);

  return null;
}
