// Local changes are kept as an overlay on the remote tree, keyed by the
// file's original (remote) path so edits survive renames:
//   edits: { origPath: content }
//   moves: { origPath: newPath | null }   null = deleted
//   base:  { origPath: blobSha }          remote sha when first touched
// A path is in `base` only while it has an edit or a move.

export const empty = () => ({ edits: {}, moves: {}, base: {} })

export function count(ch) {
  return Object.keys(ch.base).length
}

function touch(ch, orig, sha) {
  if (!(orig in ch.base)) ch.base[orig] = sha
}

function tidy(ch, orig) {
  if (!(orig in ch.edits) && !(orig in ch.moves)) delete ch.base[orig]
}

function clone(ch) {
  return { edits: { ...ch.edits }, moves: { ...ch.moves }, base: { ...ch.base } }
}

// Map of virtual path -> { orig, sha, mode } as the user currently sees it.
export function virtualFiles(files, ch) {
  const result = {}
  const origs = new Set([...Object.keys(files), ...Object.keys(ch.base)])
  for (const orig of origs) {
    const target = orig in ch.moves ? ch.moves[orig] : orig
    if (target === null) continue
    const sha = orig in ch.base ? ch.base[orig] : files[orig].sha
    result[target] = { orig, sha, mode: files[orig]?.mode || '100644' }
  }
  return result
}

export function listDir(virtual, dir) {
  const prefix = dir ? dir + '/' : ''
  const dirs = new Map()
  const items = []
  for (const path of Object.keys(virtual)) {
    if (!path.startsWith(prefix)) continue
    const rest = path.slice(prefix.length)
    const slash = rest.indexOf('/')
    if (slash === -1) {
      if (rest.endsWith('.md')) items.push({ name: rest, path, type: 'file' })
    } else {
      const name = rest.slice(0, slash)
      dirs.set(name, { name, path: prefix + name, type: 'dir' })
    }
  }
  return [...dirs.values(), ...items]
    .filter(i => !i.name.startsWith('.'))
    .sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'dir' ? -1 : 1
    })
}

export function exists(virtual, path) {
  if (path in virtual) return true
  return Object.keys(virtual).some(p => p.startsWith(path + '/'))
}

// Files under `path` (the file itself, or everything inside a folder).
function affected(virtual, path, isDir) {
  if (!isDir) return virtual[path] ? [[path, virtual[path]]] : []
  return Object.entries(virtual).filter(([p]) => p.startsWith(path + '/'))
}

export function setEdit(ch, entry, content, original) {
  const next = clone(ch)
  if (content === original) delete next.edits[entry.orig]
  else {
    next.edits[entry.orig] = content
    touch(next, entry.orig, entry.sha)
  }
  tidy(next, entry.orig)
  return next
}

export function rename(ch, virtual, from, to, isDir) {
  const next = clone(ch)
  for (const [path, entry] of affected(virtual, from, isDir)) {
    const target = to + path.slice(from.length)
    if (target === entry.orig) delete next.moves[entry.orig]
    else {
      next.moves[entry.orig] = target
      touch(next, entry.orig, entry.sha)
    }
    tidy(next, entry.orig)
  }
  return next
}

export function remove(ch, virtual, path, isDir) {
  const next = clone(ch)
  for (const [, entry] of affected(virtual, path, isDir)) {
    delete next.edits[entry.orig]
    next.moves[entry.orig] = null
    touch(next, entry.orig, entry.sha)
  }
  return next
}

// Touched files whose remote version changed since they were touched.
export function conflicts(ch, files) {
  return Object.keys(ch.base).filter(orig => files[orig]?.sha !== ch.base[orig])
}

export function discard(ch, origs) {
  const next = clone(ch)
  for (const orig of origs) {
    delete next.edits[orig]
    delete next.moves[orig]
    delete next.base[orig]
  }
  return next
}

// Tree entries (for the Git Data API) that apply all changes onto `files`.
export function treeEntries(ch, files) {
  const entries = []
  for (const orig of Object.keys(ch.base)) {
    const target = orig in ch.moves ? ch.moves[orig] : orig
    const mode = files[orig]?.mode || '100644'
    if (target !== orig && files[orig]) {
      entries.push({ path: orig, mode, type: 'blob', sha: null })
    }
    if (target === null) continue
    if (orig in ch.edits) entries.push({ path: target, mode, type: 'blob', content: ch.edits[orig] })
    else entries.push({ path: target, mode, type: 'blob', sha: ch.base[orig] })
  }
  return entries
}

const shortName = p => p.split('/').pop().replace(/\.md$/, '')

export function commitMessage(ch) {
  const lines = Object.keys(ch.base).map(orig => {
    const target = orig in ch.moves ? ch.moves[orig] : orig
    if (target === null) return `Delete ${shortName(orig)}`
    if (target !== orig) return `Rename ${orig} → ${target}`
    return `Update ${shortName(orig)}`
  })
  if (lines.length === 1) return lines[0]
  return `Update ${lines.length} files\n\n${lines.map(l => `- ${l}`).join('\n')}`
}
