import { useState, useEffect } from 'react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import ArticleCard from './components/ArticleCard'
import { useArticles, useSources } from './hooks/useArticles'
import './App.css'

export default function App() {
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
      <Header onRefresh={refetch} lastFetched={lastFetched} loading={loading} />

      <main className="main-content">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          sources={sources}
          articleCount={articles.length}
        />

        {unreadCount > 0 && (
          <div className="unread-banner">
            <span className="unread-dot" />
            {unreadCount} unread article{unreadCount !== 1 ? 's' : ''}
          </div>
        )}

        {error && (
          <div className="error-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>Could not load articles. Check your connection.</p>
            <button onClick={refetch}>Try again</button>
          </div>
        )}

        {loading && articles.length === 0 && (
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="sk sk-meta" />
                <div className="sk sk-title" />
                <div className="sk sk-title short" />
                <div className="sk sk-summary" />
                <div className="sk sk-summary short" />
                <div className="sk sk-link" />
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
        <span>Refreshes every 2 hours</span>
      </footer>
    </div>
  )
}
