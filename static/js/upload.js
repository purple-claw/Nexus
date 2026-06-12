function uploadApp() {
    return {
        mdContent: '',
        isSaving: false,
        parseError: null,
        preview: {
            metadata: { title: '', category: '', subcategory: '', description: '' },
            reading: [],
            formulas: [],
            mcqs: [],
            notes: [],
            todos: []
        },
        debounceTimer: null,

        debouncedParse() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.parseMarkdown(), 300);
        },

        parseMarkdown() {
            if (!this.mdContent.trim()) {
                this.parseError = null;
                this.preview = { metadata: { title: '', category: '', subcategory: '', description: '' }, reading: [], formulas: [], mcqs: [], notes: [], todos: [] };
                return;
            }

            try {
                const lines = this.mdContent.split('\n');
                const preview = { metadata: { title: '', category: 'General', subcategory: '', description: '' }, reading: [], formulas: [], mcqs: [], notes: [], todos: [] };
                const sections = {};
                let currentH2 = null;
                const sectionBuffer = [];

                for (const line of lines) {
                    if (line.startsWith('# ') && !currentH2) {
                        preview.metadata.title = line.slice(2).trim();
                    } else if (line.startsWith('## ')) {
                        if (currentH2 && sectionBuffer.length) {
                            sections[currentH2] = sectionBuffer.join('\n').trim();
                        }
                        currentH2 = line.slice(3).trim().toLowerCase().replace(/\s+/g, '_');
                        sectionBuffer.length = 0;
                    } else {
                        sectionBuffer.push(line);
                    }
                }
                if (currentH2 && sectionBuffer.length) {
                    sections[currentH2] = sectionBuffer.join('\n').trim();
                }

                // Metadata
                const metaText = sections['metadata'] || '';
                for (const line of metaText.split('\n')) {
                    const t = line.trim();
                    if (t.toLowerCase().startsWith('- category:'))
                        preview.metadata.category = t.split(':').slice(1).join(':').trim();
                    else if (t.toLowerCase().startsWith('- subcategory:'))
                        preview.metadata.subcategory = t.split(':').slice(1).join(':').trim();
                    else if (t.toLowerCase().startsWith('- description:'))
                        preview.metadata.description = t.split(':').slice(1).join(':').trim();
                }

                // Reading (content / reading section)
                const readingKey = sections['content'] ? 'content' : (sections['reading'] ? 'reading' : null);
                if (readingKey) {
                    const parts = sections[readingKey].split(/\n(?=### )/);
                    for (const part of parts) {
                        const p = part.trim();
                        if (!p) continue;
                        const lines2 = p.split('\n');
                        let title = '';
                        const body = [];
                        for (const l of lines2) {
                            if (l.startsWith('### ')) title = l.slice(4).trim();
                            else body.push(l);
                        }
                        const content = body.join('\n').trim();
                        if (content) {
                            preview.reading.push({ title: title || 'Section', content: content });
                        }
                    }
                }

                // MCQs
                const mcqText = sections['mcqs'] || '';
                if (mcqText) {
                    const blocks = mcqText.split(/\n(?=\*\*Q\d+:)/);
                    for (const block of blocks) {
                        const b = block.trim();
                        if (!b) continue;
                        const qMatch = b.match(/\*\*Q\d+:\*\*\s*(.+?)(?=\n(?:-\s+[A-D]\)))/s);
                        if (!qMatch) continue;

                        const opts = [];
                        const optMatches = b.matchAll(/-\s*([A-D])\)\s*(.+)/g);
                        for (const m of optMatches) opts.push({ key: m[1].toUpperCase(), text: m[2].trim() });

                        const diffMatch = b.match(/\*\*Difficulty:\*\*\s*(.+)/);
                        const difficulty = diffMatch ? diffMatch[1].trim().toLowerCase() : 'medium';

                        if (opts.length) {
                            preview.mcqs.push({ question: qMatch[1].trim(), options: opts, difficulty: difficulty });
                        }
                    }
                }

                // Formulas
                const formulasText = sections['formulas'] || '';
                for (const line of formulasText.split('\n')) {
                    const t = line.trim();
                    const m = t.match(/^\*\*(.+?):\*\*\s*(.+)/);
                    if (m) preview.formulas.push({ title: m[1].trim(), content: m[2].trim() });
                }

                // Notes
                const notesText = sections['notes'] || '';
                for (const line of notesText.split('\n')) {
                    const t = line.trim();
                    if (t.startsWith('- ')) preview.notes.push({ content: t.slice(2).trim() });
                }

                // Todos
                const todosText = sections['todos'] || '';
                for (const line of todosText.split('\n')) {
                    const t = line.trim();
                    if (t.startsWith('- [ ]')) preview.todos.push({ content: t.slice(5).trim() });
                    else if (t.startsWith('- [x]')) preview.todos.push({ content: t.slice(5).trim() });
                    else if (t.startsWith('- ')) preview.todos.push({ content: t.slice(2).trim() });
                }

                this.preview = preview;
                this.parseError = null;
            } catch (e) {
                this.parseError = e.message;
            }
        },

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.mdContent = e.target.result;
                this.parseMarkdown();
                showToast('File loaded successfully', 'success');
            };
            reader.readAsText(file);
        },

        loadSample() {
            this.mdContent = `# Introduction to Kinematics

> Core concepts of motion without considering forces.

## Metadata
- Category: Physics
- Subcategory: Mechanics
- Description: Core concepts of motion without considering forces.

## Content

### What is Kinematics?

Kinematics is the branch of mechanics that describes the motion of points, bodies, and systems of bodies without considering the forces that cause them to move.

\`\`\`mermaid
flowchart LR
  A[Position] --> B[Displacement]
  B --> C[Velocity]
  C --> D[Acceleration]
\`\`\`

## Formulas

**Velocity-Time Equation:** \`v = u + at\`
**Displacement-Time Equation:** \`s = ut + \\u00bdat\\u00b2\`

## MCQs

**Q1:** A car accelerates from rest at 2 m/s\\u00b2 for 5 seconds. What is its final velocity?
- A) 5 m/s
- B) 10 m/s
- C) 15 m/s
- D) 25 m/s
**Answer:** B
**Difficulty:** easy
**Explanation:** Using v = u + at, with u=0, a=2, t=5, we get v = 10 m/s.

## Notes

- These equations only apply when acceleration is constant.
- Velocity is the rate of change of displacement.

## Todos

- [ ] Solve 5 practice problems on kinematics
- [ ] Review the derivation of the third equation of motion
`;
            this.parseMarkdown();
            showToast('Sample document loaded', 'success');
        },

        async saveToDatabase() {
            if (!this.mdContent.trim()) return;

            this.isSaving = true;
            const formData = new FormData();
            formData.append('md_content', this.mdContent);

            try {
                const response = await fetch('/upload/', {
                    method: 'POST',
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                    body: formData
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    showToast(data.message, 'success');
                    this.mdContent = '';
                    this.parseMarkdown();
                } else {
                    showToast(data.error || 'Failed to save', 'error');
                }
            } catch (err) {
                showToast('Network error occurred', 'error');
            } finally {
                this.isSaving = false;
            }
        },

        init() {
            // Ready to go!
        }
    }
}
