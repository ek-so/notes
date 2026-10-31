import { marked } from 'marked'

marked.setOptions({ breaks: true, gfm: true })

// HTML (unsanitized) where each top-level block is wrapped in
// <div data-src="start" data-len="length"> pointing at its markdown source.
export function renderBlocks(markdown) {
  const tokens = marked.lexer(markdown)
  let offset = 0
  let html = ''
  for (const token of tokens) {
    const found = markdown.indexOf(token.raw, offset)
    const start = found === -1 ? offset : found
    offset = start + token.raw.length
    if (token.type === 'space') continue
    const part = marked.parser(Object.assign([token], { links: tokens.links }))
    if (part) html += `<div data-src="${start}" data-len="${token.raw.length}">${part}</div>`
  }
  return html
}

const WORD_END = /[\p{L}\p{N}_'-]*$/u
const WORD_START = /^[\p{L}\p{N}_'-]*/u

// Offset in a block's markdown `raw` for a tap between rendered
// `textBefore` and `textAfter`: the same occurrence of the tapped word, at
// the same letter. 0 (block start) when the word can't be found.
export function tapOffset(raw, textBefore, textAfter) {
  const prefix = textBefore.match(WORD_END)[0]
  const word = prefix + textAfter.match(WORD_START)[0]
  if (!word) return 0
  const earlier = textBefore.slice(0, textBefore.length - prefix.length).split(word).length - 1
  let at = -1
  for (let i = 0; i <= earlier; i++) {
    at = raw.indexOf(word, at + 1)
    if (at === -1) return 0
  }
  return at + prefix.length
}

// Repo path for a relative image src in the note at `notePath`, or null for
// external URLs.
export function resolveImage(notePath, src) {
  if (!src || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(src)) return null
  let rel
  try { rel = decodeURI(src.split(/[?#]/)[0]) } catch { return null }
  const parts = rel.startsWith('/') ? [] : notePath.split('/').slice(0, -1)
  for (const seg of rel.split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts.join('/')
}
