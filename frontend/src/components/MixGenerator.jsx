import React, { useEffect, useRef, useState } from 'react'
import { generateMix } from '../services/api'

export default function MixGenerator() {
  const [mood, setMood] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [playlist, setPlaylist] = useState([])
  const audioRef = useRef(null)
  const currentIndexRef = useRef(0)

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  function playPlaylist(pl) {
    setPlaylist(pl)
    currentIndexRef.current = 0
    if (pl.length === 0) return
    const audio = audioRef.current
    audio.src = pl[0].url
    audio.play().catch(err => console.warn('Play failed', err))
  }

  async function onGenerate(e) {
    e.preventDefault()
    if (!mood) return alert('Enter a mood (e.g., "calm focus")')
    setLoading(true)
    try {
      const mix = await generateMix({ mood, prompt, maxTracks: 5 })
      const items = (mix.items || []).map(it => ({ ...it, url: it.url, title: it.title }))
      setPlaylist(items)
      if (items.length > 0) playPlaylist(items)
      window.dispatchEvent(new CustomEvent('tracks:updated'))
    } catch (err) {
      console.error(err)
      alert('Failed to generate mix')
    } finally {
      setLoading(false)
    }
  }

  function onEnded() {
    const next = currentIndexRef.current + 1
    if (next >= playlist.length) {
      return
    }
    currentIndexRef.current = next
    const audio = audioRef.current
    audio.src = playlist[next].url
    audio.play().catch(e => console.warn('Play failed', e))
  }

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginBottom: 12 }}>
      <h3>Generate Mix from Mood</h3>
      <form onSubmit={onGenerate}>
        <div style={{ marginBottom: 8 }}>
          <input placeholder='Mood (e.g. "calm focus")' value={mood} onChange={e => setMood(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input placeholder='Optional prompt (e.g. "soft piano and gentle beats")' value={prompt} onChange={e => setPrompt(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </div>
        <div>
          <button type='submit' disabled={loading} style={{ padding: '6px 12px' }}>{loading ? 'Generating…' : 'Generate Mix'}</button>
        </div>
      </form>

      <div style={{ marginTop: 12 }}>
        <h4>Generated Playlist</h4>
        <ol>
          {playlist.map((p, idx) => (
            <li key={p.trackId} style={{ marginBottom: 6 }}>
              <div><strong>{p.title || p.trackId}</strong> — <small>weight: {p.weight}</small></div>
            </li>
          ))}
          {playlist.length === 0 && <div style={{ color: '#666' }}>No playlist yet.</div>}
        </ol>
      </div>

      <audio ref={audioRef} onEnded={onEnded} controls style={{ width: '100%', marginTop: 8 }} />
    </div>
  )
}
