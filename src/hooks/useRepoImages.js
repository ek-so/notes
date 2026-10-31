import { useState, useEffect } from 'react'
import { getBlobBase64 } from '../lib/github.js'
import { imageMime } from '../lib/files.js'

// Data URLs for repo images, loaded through the API (works for private repos
// and offline once cached). Maps path -> data URL, or null if unavailable.
export function useRepoImages(paths, files) {
  const [images, setImages] = useState({})

  useEffect(() => {
    const missing = [...new Set(paths)].filter(p => !(p in images))
    if (!missing.length) return
    let cancelled = false
    Promise.all(missing.map(async p => {
      const mime = imageMime(p)
      if (!files[p]?.sha || !mime) return [p, null]
      try { return [p, `data:${mime};base64,${await getBlobBase64(files[p].sha)}`] } catch { return [p, null] }
    })).then(entries => {
      if (!cancelled) setImages(prev => ({ ...prev, ...Object.fromEntries(entries) }))
    })
    return () => { cancelled = true }
  }, [paths])

  return images
}
