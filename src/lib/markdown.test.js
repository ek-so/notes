import { describe, it, expect } from 'vitest'
import { renderBlocks, tapOffset } from './markdown.js'

describe('markdown', () => {
  it('tags each block with its source range', () => {
    const md = '# Title\n\nSome **bold** text.\n'
    const html = renderBlocks(md)
    const starts = [...html.matchAll(/data-src="(\d+)" data-len="(\d+)"/g)].map(m => md.slice(+m[1], +m[1] + +m[2]))
    expect(starts).toEqual(['# Title\n\n', 'Some **bold** text.\n'])
  })

  it('maps a tap to the same occurrence and letter of the word', () => {
    const raw = 'a cat and a **cat** here'
    // rendered "a cat and a cat here", tap inside the second "cat" after "c"
    expect(tapOffset(raw, 'a cat and a c', 'at here')).toBe(raw.indexOf('**cat**') + 3)
    expect(tapOffset(raw, 'a c', 'at and a cat here')).toBe(3)
    expect(tapOffset(raw, 'a cat and ', ' ')).toBe(0)
  })
})

describe('highlightMarkdown', () => {
  it('styles markdown without changing the text', async () => {
    const { highlightMarkdown } = await import('./markdown.js')
    const md = '# Title\nSee [docs](a.md), **bold** and *it* <u>u</u> snake_case_name'
    const html = highlightMarkdown(md)
    const text = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    expect(text).toBe(md + ' ')
    expect(html).toContain('<span class="text-primary">[docs](a.md)</span>')
    expect(html).toContain('<span class="font-bold">**bold**</span>')
    expect(html).toContain('<span class="italic">*it*</span>')
    expect(html).not.toContain('<span class="italic">_case_</span>')
    expect(highlightMarkdown('[docs(a.md)')).not.toContain('text-primary')
  })
})
