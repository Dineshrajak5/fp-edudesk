import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

const CATEGORY_COLORS = {
  'Policy':          '#6366F1',
  'Exams':           '#D97706',
  'Higher Ed':       '#059669',
  'University':      '#0891B2',
  'EdTech':          '#2563EB',
  'AI in Education': '#7C3AED',
  'AI News':         '#DB2777',
  'Schools':         '#E11D48',
  'General':         '#64748B',
}

const CATEGORY_EMOJI = {
  'Policy': '🏛️',
  'Exams': '📝',
  'Higher Ed': '🎓',
  'University': '🏫',
  'EdTech': '💻',
  'AI in Education': '🤖',
  'AI News': '✨',
  'Schools': '🏫',
  'General': '📰',
}

export default function ArticleCard({ article, isRead, onMarkRead }) {
  const [imgFailed, setImgFailed] = useState(false)
  const categoryColor = CATEGORY_COLORS[article.category] || CATEGORY_COLORS['General']
  const emoji = CATEGORY_EMOJI[article.category] || '📰'

  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
    : 'recently'

  const showImage = article.image_url && !imgFailed

  return (
    <a
      className={`article-card ${isRead ? 'read' : ''}`}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => onMarkRead(article.id)}
    >
      <div className="card-body">
        <div className="card-text">
          <div className="article-meta">
            <span className="source-badge">{article.source}</span>
            <span
              className="category-badge"
              style={{ '--cat-color': categoryColor }}
            >
              {article.category || 'General'}
            </span>
            <span className="time-ago">{timeAgo}</span>
          </div>

          <h2 className="article-title">{article.title}</h2>
        </div>

        <div className="card-thumb">
          {showImage ? (
            <img
              src={article.image_url}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="thumb-fallback">{emoji}</div>
          )}
        </div>
      </div>

      {article.ai_summary && (
        <div className="ai-summary">
          <span className="ai-label">
            <svg className="ai-spark" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1l2.4 7.2L22 10l-7.6 1.8L12 19l-2.4-7.2L2 10l7.6-1.8L12 1z"/>
            </svg>
            AI Summary
          </span>
          <p>{article.ai_summary}</p>
        </div>
      )}

      <div className="article-footer">
        <span className="read-link">
          Read full article
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M7 7h10v10"/>
          </svg>
        </span>
        {isRead && <span className="read-indicator">✓ Read</span>}
      </div>
    </a>
  )
}
