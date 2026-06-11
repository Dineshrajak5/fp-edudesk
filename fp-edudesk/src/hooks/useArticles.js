import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useArticles(filters = {}) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(filters.limit || 50)

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source)
      }
      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error: err } = await query
      if (err) throw err
      setArticles(data || [])
      setLastFetched(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.category, filters.source, filters.search, filters.limit])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  // Realtime subscription for new articles
  useEffect(() => {
    const channel = supabase
      .channel('articles-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'articles'
      }, () => {
        fetchArticles()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchArticles])

  return { articles, loading, error, refetch: fetchArticles, lastFetched }
}

export function useSources() {
  const [sources, setSources] = useState([])
  useEffect(() => {
    supabase
      .from('articles')
      .select('source')
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(d => d.source))].filter(Boolean)
          setSources(unique)
        }
      })
  }, [])
  return sources
}
