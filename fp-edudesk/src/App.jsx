import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import ArticleCard from './components/ArticleCard'
import { useArticles, useSources } from './hooks/useArticles'
import { useTheme } from './hooks/useTheme'
import './App.css'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [filters, setFilters] = useState({ category: 'all', source: 'all', search: '' })
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fp_read_ids') || '[]') } catch { return [] }
  })

  const { articles, loading, error, refetch, lastFetched } = useArticles(filters)
  const sources = useSources()

  const markRead = (id) => {
    setReadIds(prev => {
      const next = [...new Set([...prev, id])]
      localStorage.setItem('fp_read_ids', JSON.stringify(next))
      return next
    })
  }

  const unreadCount = articles.filter(a => !readIds.includes(a.id)).length

  return (
    <div className="app">
      <Header
        onRefresh={refetch}
        loading={loading}
        theme={theme}
        onToggleTheme={toggle}
      />

      <main className="main-content">
        <div className="hero-strip">
          <span className="hero-greeting">
            {greeting()} — <strong>here's what's happening in education</strong>
          </span>
          {lastFetched && (
            <span className="last-updated">
              Updated {formatDistanceToNow(lastFetched, { addSuffix: true })}
            </span>
          )}
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          sources={sources}
        />

        {unreadCount > 0 && (
          <div className="unread-banner">
            <span className="unread-dot" />
            {unreadCount} unread article{unreadCount !== 1 ? 's' : ''}
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>Could not load articles. Check your connection.</p>
            <button onClick={refetch}>Try again</button>
          </div>
        )}

        {loading && articles.length === 0 && (
          <div className="loading-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="sk-col">
                  <div className="sk sk-meta" />
                  <div className="sk sk-title" />
                  <div className="sk sk-title short" />
                  <div className="sk sk-summary" />
                </div>
                <div className="sk sk-thumb" />
              </div>
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No articles found</h3>
            <p>Try adjusting your filters or check back soon.</p>
          </div>
        )}

        <div className="articles-grid">
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              isRead={readIds.includes(article.id)}
              onMarkRead={markRead}
            />
          ))}
        </div>
      </main>

      <footer className="app-footer">
        <span>FP EduDesk · FACE Prep Internal</span>
        <span>Auto-refreshes every 2 hours</span>
      </footer>
    </div>
  )
}
