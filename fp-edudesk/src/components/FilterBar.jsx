const CATEGORIES = [
  'all',
  'Placements',
  'Jobs & Hiring',
  'University',
  'AI in Education',
  'AI News',
  'Policy',
  'Exams',
  'Higher Ed',
  'EdTech',
  'Schools',
  'General',
]

export default function FilterBar({ filters, onChange, sources }) {
  return (
    <div className="filter-bar">
      <div className="search-wrap">
        <svg className="search-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="search-input"
          type="text"
          placeholder="Search education news..."
          value={filters.search || ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="cat-scroll">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`chip ${filters.category === cat ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, category: cat })}
          >
            {cat === 'all' ? 'All News' : cat}
          </button>
        ))}
      </div>

      {sources.length > 0 && (
        <div className="source-row">
          <span className="source-row-label">Source</span>
          <button
            className={`chip sm ${filters.source === 'all' ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, source: 'all' })}
          >
            All
          </button>
          {sources.map(src => (
            <button
              key={src}
              className={`chip sm ${filters.source === src ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, source: src })}
            >
              {src}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
