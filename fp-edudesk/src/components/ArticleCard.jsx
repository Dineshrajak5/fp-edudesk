import { formatDistanceToNow } from 'date-fns'

const CATEGORY_COLORS = {
  'Policy': '#6366F1',
  'Exams': '#F59E0B',
  'Higher Ed': '#10B981',
  'EdTech': '#3B82F6',
  'Schools': '#EC4899',
  'General': '#6B7280'
}

const SOURCE_ICONS = {
  'Google News': '🔍',
  'The Hindu': '📰',
  'Indian Express': '📋',
  'NDTV': '📺',
  'Careers360': '🎓',
  'Times of India': '🗞️'
}

export default function ArticleCard({ article, isRead, onMarkRead }) {
  const categoryColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['General']
  const sourceIcon = SOURCE_ICONS[article.source] || '📡'

  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : 'recently'

  const handleClick = () => {
    onMarkRead(article.id)
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <article className={`article-card ${isRead ? 'read' : ''}`}>
      <div className="article-meta">
        <span className="source-badge">
          <span className="source-icon">{sourceIcon}</span>
          {article.source}
        </span>
        <span
          className="category-badge"
          style={{ '--cat-color': categoryColor }}
        >
          {article.category || 'General'}
        </span>
        <span className="time-ago">{timeAgo}</span>
      </div>

      <h2 className="article-title">{article.title}</h2>

      {article.ai_summary && (
        <div className="ai-summary">
          <span className="ai-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            AI Summary
          </span>
          <p>{article.ai_summary}</p>
        </div>
      )}

      <div className="article-footer">
        <button className="read-link" onClick={handleClick}>
          Read full article
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </button>
        {isRead && <span className="read-indicator">✓ Read</span>}
      </div>
    </article>
  )
}
