import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3020';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout', '/pedido/'] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
