import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = (process.env.REACT_APP_BACKEND_URL || 'https://advisorypro.com').replace(/\/api.*$/, '');
const SITE_NAME = 'AdvisoryPro';

const DEFAULTS = {
  title: 'AdvisoryPro, Every Financial Calculator. One Intelligent Platform.',
  description: '30+ professional financial calculators for Americans. 2025 IRS brackets, FIRE planning, RSU taxes, home affordability, paycheck calculator, Medicare IRMAA, AMT. Free to start.',
  keywords: '2025 tax calculator, FIRE calculator, paycheck calculator, home affordability calculator, financial independence, RSU tax calculator, capital gains tax 2025',
};

export default function SEOHead({
  title,
  description,
  path = '/',
  keywords,
  type = 'website',
  noIndex = false,
  jsonLd = null,
}) {
  const fullTitle = title ? `${title} | AdvisoryPro` : DEFAULTS.title;
  const metaDesc = description || DEFAULTS.description;
  const metaKeywords = keywords || DEFAULTS.keywords;
  const canonicalUrl = `${SITE_URL}${path}`;

  return (
    <Helmet>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@AdvisoryPro" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
