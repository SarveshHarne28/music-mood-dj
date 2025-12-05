import React, { useEffect, useState, useRef } from 'react'
import { listTracks } from '../services/api'

export default function TrackList() {
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(false)
  const audioRef = useRef(null)
  const [current, setCurrent] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const t = await listTracks()
      setTracks(t)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('tracks:updated', handler)
    return () => window.removeEventListener('tracks:updated', handler)
  }, [])

  function playTrack(track) {
    setCurrent(track.id)
    const audio = audioRef.current
    if (!audio) return
    audio.src = track.url
    audio.play().catch(e => console.warn('Play failed', e))
  }

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <h3>All Tracks {loading ? ' (loading...)' : ''}</h3>

      <div style={{ maxHeight: 380, overflow: 'auto' }}>
        {tracks.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #fafafa' }}>
            <div>
              <strong style={{ display: 'block' }}>{t.original_name}</strong>
              <small style={{ color: '#666' }}>{t.duration_seconds ? `${t.duration_seconds}s` : ''}</small>
            </div>
            <div>
              <button onClick={() => playTrack(t)} style={{ marginRight: 8 }}>Play</button>
            </div>
          </div>
        ))}
        {tracks.length === 0 && <div style={{ color: '#666' }}>No tracks yet — upload one above.</div>}
      </div>

      <audio ref={audioRef} controls style={{ width: '100%', marginTop: 12 }} />
    </div>
  )
}
