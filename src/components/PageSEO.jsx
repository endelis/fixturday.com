import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Fixturday'
const DEFAULT_TITLE = 'Fixturday — Free Tournament Management Software'
const DEFAULT_DESC = 'Organize sports tournaments in minutes. Auto schedules, real-time standings, team registration. Free forever.'
const DEFAULT_IMAGE = 'https://www.fixturday.com/og-image.png'
const BASE_URL = 'https://www.fixturday.com'

export default function PageSEO({ title, description, canonical, image, noindex = false }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE
  const metaDesc = description ?? DEFAULT_DESC
  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : null
  const ogImage = image ?? DEFAULT_IMAGE

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
    </Helmet>
  )
}
