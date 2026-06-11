const CATEGORIES = ['all', 'Policy', 'Exams', 'Higher Ed', 'EdTech', 'Schools', 'General']

export default function FilterBar({ filters, onChange, sources, articleCount }) {
  return (
    <div className="filter-bar">
      <div className="filter-row">
        <div className="search-wrap">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search articles..."
            value={filters.search || ''}
            onChange={e => onChange({ ...filters, search: e.target.value })}
          />
        </div>
        <span className="article-count">{articleCount} articles</span>
      </div>

      <div className="filter-chips">
        <div className="chip-group">
          <span className="chip-label">Category</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`chip ${filters.category === cat ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, category: cat })}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {sources.length > 0 && (
          <div className="chip-group">
            <span className="chip-label">Source</span>
            <button
              className={`chip ${filters.source === 'all' ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, source: 'all' })}
            >
              All
            </button>
            {sources.map(src => (
              <button
                key={src}
                className={`chip ${filters.source === src ? 'active' : ''}`}
                onClick={() => onChange({ ...filters, source: src })}
              >
                {src}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
