import React, { useEffect, useState } from 'react'
import { topTracks } from '../services/api'

export default function TopTracks() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const t = await topTracks(10)
      setTracks(t)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <h3>Top Tracks</h3>
      <div>
        {loading && <div>Loading…</div>}
        <ol>
          {tracks.map(t => (
            <li key={t.id}>
              <div style={{ fontSize: 14 }}>
                <strong>{t.original_name}</strong> <small style={{ color: '#666' }}>({t.selected_count})</small>
              </div>
            </li>
          ))}
        </ol>
        {tracks.length === 0 && <div style={{ color: '#666' }}>No top tracks yet.</div>}
      </div>
    </div>
  )
}
