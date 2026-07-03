import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../parser'

describe('parseMarkdown', () => {
  it('parses metadata title from H1', () => {
    const result = parseMarkdown('# Custom Title')
    expect(result.metadata.title).toBe('Custom Title')
  })

  it('parses formulas', () => {
    const md = `# Test\n\n## formulas\n**Rule:** \`code\` → \`result\``
    const result = parseMarkdown(md)
    expect(result.formulas).toHaveLength(1)
    expect(result.formulas[0].title).toBe('Rule')
  })

  it('parses MCQs', () => {
    const md = [
      '# Test',
      '',
      '## mcqs',
      '**Q1:** What is 2+2?',
      '- A) 3',
      '- B) 4',
      '- C) 5',
      '- D) 6',
      '**Answer:** B',
      '**Difficulty:** easy',
      '**Explanation:** Math.',
    ].join('\n')
    const result = parseMarkdown(md)
    expect(result.mcqs).toHaveLength(1)
    expect(result.mcqs[0].question).toContain('What is 2+2')
    expect(result.mcqs[0].answer).toBe('B')
  })

  it('parses notes', () => {
    const md = '# Test\n\n## notes\n- Note A\n- Note B'
    const result = parseMarkdown(md)
    expect(result.notes).toHaveLength(2)
    expect(result.notes[0].content).toBe('Note A')
    expect(result.notes[1].content).toBe('Note B')
  })

  it('parses reading blocks', () => {
    const md = '# Test\n\n## reading\n### Section\nHello world'
    const result = parseMarkdown(md)
    expect(result.reading).toHaveLength(1)
    expect(result.reading[0].title).toBe('Section')
    expect(result.reading[0].content).toContain('Hello world')
  })

  it('handles empty input', () => {
    const result = parseMarkdown('')
    expect(result.metadata.title).toBe('Untitled')
    expect(result.mcqs).toEqual([])
    expect(result.formulas).toEqual([])
    expect(result.notes).toEqual([])
    expect(result.reading).toEqual([])
  })

  it('skips oversized MCQ blocks', () => {
    const large = 'A'.repeat(15000)
    const md = `# Test\n\n## mcqs\n**Q1:** ${large}\n- A) x\n**Answer:** A\n`
    const result = parseMarkdown(md)
    expect(result.mcqs).toHaveLength(0)
  })
})
