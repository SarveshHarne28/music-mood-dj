import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const client = axios.create({ baseURL: API_BASE, timeout: 30000 })

export async function listTracks() {
  const r = await client.get('/api/tracks')
  return r.data.tracks || []
}

export async function uploadTrack(file, onUploadProgress) {
  const form = new FormData()
  form.append('file', file)
  const r = await client.post('/api/tracks/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress
  })
  return r.data.track
}

export async function generateMix({ mood, prompt, maxTracks = 5 }) {
  const r = await client.post('/api/mixes/generate', { mood, prompt, maxTracks })
  return r.data.mix
}

export async function listMixes() {
  const r = await client.get('/api/mixes')
  return r.data.mixes || []
}

export async function getMix(id) {
  const r = await client.get(`/api/mixes/${id}`)
  return r.data.mix
}

export async function topTracks(limit = 10) {
  const r = await client.get(`/api/stats/top-tracks?limit=${limit}`)
  return r.data.tracks || []
}
