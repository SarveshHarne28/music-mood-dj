import React from 'react'
import UploadForm from './components/UploadForm'
import TrackList from './components/TrackList'
import MixGenerator from './components/MixGenerator'
import TopTracks from './components/TopTracks'

export default function App() {
  return (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif', padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <h1>Music Mood DJ</h1>
        <p style={{ marginTop: 0 }}>Upload tracks, generate mood mixes, and play them in your browser.</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <UploadForm />
          </div>

          <div style={{ marginBottom: 16 }}>
            <MixGenerator />
          </div>

          <div>
            <TrackList />
          </div>
        </div>

        <aside>
          <TopTracks />
        </aside>
      </section>

      <footer style={{ marginTop: 32, color: '#666' }}>
        <small>Backend API: {import.meta.env.VITE_API_BASE_URL}</small>
      </footer>
    </div>
  )
}
