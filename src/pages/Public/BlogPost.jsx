import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'
import { posts, getPost } from '../../content/blog/index'
import './BlogPost.css'

export default function BlogPost() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const post = getPost(slug)

  useSEO({
    title: post?.title ?? 'Article Not Found',
    description: post?.description ?? '',
    path: post ? `/blog/${post.slug}` : '/blog',
    noSuffix: true,
  })

  useEffect(() => {
    if (!post) return
    const id = 'article-ld'
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.type = 'application/ld+json'
      document.head.appendChild(el)
    }
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      author: { '@type': 'Person', name: 'Silvestrs Endelis' },
      publisher: {
        '@type': 'Organization',
        name: 'Fixturday',
        logo: { '@type': 'ImageObject', url: 'https://www.fixturday.com/logo-horizontal.svg' },
      },
      url: `https://www.fixturday.com/blog/${post.slug}`,
      keywords: post.keywords?.join(', '),
    })
    return () => { document.getElementById(id)?.remove() }
  }, [post])

  if (!post) return <Navigate to="/blog" replace />

  const postIndex = posts.findIndex(p => p.slug === slug)
  const prevPost = posts[postIndex + 1] ?? null
  const nextPost = posts[postIndex - 1] ?? null
  const { Component } = post

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <PublicNav />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '7rem 1.25rem 4rem' }}>

        {/* Back link */}
        <Link
          to="/blog"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            color: 'var(--color-text-muted)', fontSize: '0.875rem', textDecoration: 'none',
            marginBottom: '2.5rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          <ArrowLeft size={14} /> All articles
        </Link>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {post.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-accent)',
                background: 'rgba(240,165,0,0.1)',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
              }}>
                {tag}
              </span>
            ))}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.7rem, 4vw, 2.4rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: '0 0 1rem',
          }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} />
              {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} />
              {post.readTime}
            </span>
          </div>
        </header>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '2.5rem' }} />

        {/* Post content */}
        <Component />

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-border)', margin: '3rem 0 2rem' }} />

        {/* Prev / Next navigation */}
        <nav style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {prevPost ? (
            <Link
              to={`/blog/${prevPost.slug}`}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: '1.125rem 1.25rem',
                textDecoration: 'none', transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ArrowLeft size={12} /> Previous
              </div>
              <div style={{ color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3 }}>
                {prevPost.title}
              </div>
            </Link>
          ) : <div />}

          {nextPost ? (
            <Link
              to={`/blog/${nextPost.slug}`}
              style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)', padding: '1.125rem 1.25rem',
                textDecoration: 'none', textAlign: 'right',
                transition: 'border-color var(--transition-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
            >
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                Next <ArrowRight size={12} />
              </div>
              <div style={{ color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.3 }}>
                {nextPost.title}
              </div>
            </Link>
          ) : <div />}
        </nav>
      </main>

      <Footer />
    </div>
  )
}
