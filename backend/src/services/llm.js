const safeJsonExtract = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const objMatch = text.match(/(\{[\s\S]*\})/m);
    const arrMatch = text.match(/(\[[\s\S]*\])/m);
    const candidate = objMatch ? objMatch[1] : (arrMatch ? arrMatch[1] : null);
    if (!candidate) throw new Error('No JSON found in LLM response');
    return JSON.parse(candidate);
  }
};

const randomPick = (tracks, maxTracks = 5) => {
  const max = Math.min(6, Math.max(3, Number(maxTracks)));
  const shuffled = tracks.slice().sort(() => Math.random() - 0.5).slice(0, max);
  return {
    playlist: shuffled.map((t, idx) => ({
      id: t.id,
      position: idx + 1,
      weight: 1.0,
      note: 'fallback-random'
    }))
  };
};

async function callOpenAI(promptText) {
  let OpenAI;
  try {
    OpenAI = require('openai');
  } catch (e) {
    throw new Error('OpenAI SDK not installed. Run `npm install openai` or set LLM_PROVIDER=none');
  }
  const client = new OpenAI.OpenAI({ apiKey: process.env.LLM_API_KEY });

  const model = process.env.LLM_MODEL || 'gpt-4o-mini'; 
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant that generates music playlists in strict JSON format.' },
      { role: 'user', content: promptText }
    ],
    max_tokens: 700,
    temperature: 0.2
  });

  const content = response?.choices?.[0]?.message?.content || response?.choices?.[0]?.text || JSON.stringify(response);
  return content;
}

function buildPrompt({ mood, prompt, tracks, maxTracks = 5 }) {
  const compact = tracks.map(t => ({
    id: t.id,
    title: t.original_name || t.title || 'unknown',
    duration: t.duration_seconds || null
  }));

  return `
You are a playlist generator. User mood: "${mood}".
User prompt (optional): "${prompt || ''}".

Available tracks (JSON array):
${JSON.stringify(compact, null, 2)}

Task:
Choose between 3 and 6 tracks from the list to build a single playlist for the mood.
Output **ONLY** valid JSON in exactly this format:

{
  "playlist": [
    {"id":"<track-id>","position":1,"weight":0.65,"note":"short note (optional)"},
    ...
  ]
}

Rules:
- Use only the track ids provided.
- Provide positions starting at 1 (integer).
- Provide weight as a float between 0.0 and 1.0 (represents prominence).
- Return exactly one JSON object and nothing else (no commentary).
- If you cannot find suitable tracks, still return 3 tracks selected from the list.
- Max tracks: ${Math.min(6, Math.max(3, Number(maxTracks)))}
`;
}

module.exports = {
  async generatePlaylist({ mood, prompt, tracks, maxTracks = 5 }) {
    if (!tracks || tracks.length === 0) return { playlist: [] };

    if (!process.env.LLM_PROVIDER || process.env.LLM_PROVIDER.toLowerCase() === 'none') {
      return randomPick(tracks, maxTracks);
    }

    const promptText = buildPrompt({ mood, prompt, tracks, maxTracks });

    try {
      const raw = await callOpenAI(promptText);
      const parsed = safeJsonExtract(raw);

      if (!parsed || !Array.isArray(parsed.playlist)) {
        return randomPick(tracks, maxTracks);
      }

      const trackIds = new Set(tracks.map(t => String(t.id)));
      const cleaned = parsed.playlist
        .filter(p => p && p.id && trackIds.has(String(p.id)))
        .slice(0, 6) 
        .map((p, idx) => ({
          id: String(p.id),
          position: Number(p.position || idx + 1),
          weight: Number(p.weight != null ? p.weight : 1.0),
          note: p.note || ''
        }));

      if (cleaned.length < 3) {
        const fallback = randomPick(tracks, maxTracks).playlist;
        for (const f of fallback) {
          if (!cleaned.find(c => c.id === f.id)) cleaned.push(f);
          if (cleaned.length >= 3) break;
        }
      }

      cleaned.sort((a,b) => a.position - b.position);
      cleaned.forEach((c, i) => c.position = i + 1);

      return { playlist: cleaned };
    } catch (err) {
      console.warn('LLM error or parse error, falling back to random:', err?.message || err);
      return randomPick(tracks, maxTracks);
    }
  }
};
