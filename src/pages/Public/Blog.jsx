import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import PublicNav from '../../components/PublicNav'
import Footer from '../../components/Footer'
import { useSEO } from '../../hooks/useSEO'
import { posts } from '../../content/blog/index'

const CATEGORIES = [
  { id: 'all',              label: 'All' },
  { id: 'formats',          label: 'Formats',          tags: ['formats', 'tournament format', 'playoff format', 'group stage', 'bracket', 'bracket seeding', 'knockout', 'round-robin', 'double elimination', 'brackets', 'format', 'design'] },
  { id: 'scheduling',       label: 'Scheduling',        tags: ['scheduling', 'tournament planning', 'pitches'] },
  { id: 'match-day',        label: 'Match Day',         tags: ['match day', 'participants'] },
  { id: 'registration',     label: 'Registration',      tags: ['registration', 'admin', 'tournament management'] },
  { id: 'beach-volleyball', label: 'Beach Volleyball',  tags: ['beach volleyball', 'scoring', 'rules'] },
  { id: 'guides',           label: 'Guides',            tags: ['guide', 'tournament organization', 'planning', 'tools', 'software', 'tournament planning'] },
]

const PER_PAGE = 8

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [page, setPage] = useState(1)

  useSEO({
    title: 'Blog — Tournament Management Tips & Guides',
    description: 'Practical guides on organizing sports tournaments: format selection, scheduling, standings, match day tips, and more. Free resources for tournament organizers.',
    path: '/blog',
  })

  function selectCategory(id) {
    setActiveCategory(id)
    setPage(1)
  }

  const categoryTags = CATEGORIES.find(c => c.id === activeCategory)?.tags ?? []
  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.tags.some(tag => categoryTags.includes(tag)))

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const pillBase = {
    border: 'none',
    borderRadius: '999px',
    padding: '0.35rem 0.9rem',
    fontSize: '0.8125rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background var(--transition-fast), color var(--transition-fast)',
  }

  const pageBtn = (active, disabled) => ({
    minWidth: '2.25rem',
    height: '2.25rem',
    border: active ? 'none' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--color-accent)' : 'transparent',
    color: active ? '#000' : disabled ? 'var(--color-text-muted)' : 'var(--color-text)',
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: '0.875rem',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <PublicNav />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '3.5rem 1.25rem 4rem' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <p style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-heading)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Blog
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: 0 }}>
            Tournament Organization Guides
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.75rem', maxWidth: 560, lineHeight: 1.6 }}>
            Practical articles for coaches, club secretaries, and organizers who want to run better tournaments.
          </p>
        </header>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {CATEGORIES.map(cat => {
            const active = cat.id === activeCategory
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                style={{
                  ...pillBase,
                  background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: active ? '#000' : 'var(--color-text-muted)',
                  border: active ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Result count */}
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          {filtered.length === 0
            ? 'No articles in this category.'
            : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length} article${filtered.length !== 1 ? 's' : ''}`
          }
          {activeCategory !== 'all' && filtered.length > 0 && (
            <button
              onClick={() => selectCategory('all')}
              style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.8125rem', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-body)' }}
            >
              Clear filter
            </button>
          )}
        </p>

        {/* Post list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {paginated.map(post => (
            <article
              key={post.slug}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'clamp(1.25rem, 4vw, 1.75rem) clamp(1rem, 4vw, 2rem)',
                transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
                e.currentTarget.style.transform = 'none'
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {post.tags.slice(0, 2).map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-heading)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-accent)',
                    background: 'rgba(240,165,0,0.1)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.6rem', lineHeight: 1.3 }}>
                <Link
                  to={`/blog/${post.slug}`}
                  style={{ color: 'var(--color-text)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text)' }}
                >
                  {post.title}
                </Link>
              </h2>

              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.65, margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
                {post.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.825rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    {new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={13} />
                    {post.readTime}
                  </span>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Read article <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginTop: '2.5rem' }}>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              style={pageBtn(false, page === 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={pageBtn(n === page, false)}
                aria-current={n === page ? 'page' : undefined}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              style={pageBtn(false, page === totalPages)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
