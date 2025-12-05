import React, { useState } from 'react'
import { uploadTrack } from '../services/api'

export default function UploadForm() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return setMessage('Pick a file first')
    setUploading(true)
    setMessage(null)
    try {
      const track = await uploadTrack(file, ev => {
        if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
      })
      setMessage(`Uploaded: ${track.original_name}`)
      setFile(null)
      setProgress(0)
      window.dispatchEvent(new CustomEvent('tracks:updated'))
    } catch (err) {
      console.error(err)
      setMessage('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
      <h3>Upload Track</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".mp3,.wav,audio/*"
          onChange={e => setFile(e.target.files?.[0])}
          disabled={uploading}
        />
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={uploading} style={{ padding: '6px 12px' }}>
            {uploading ? `Uploading ${progress}%` : 'Upload'}
          </button>
        </div>
      </form>
      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </div>
  )
}
