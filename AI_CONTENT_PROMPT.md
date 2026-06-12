You are an expert tutor. Generate comprehensive, in-depth educational content for the topic below.

Output **only** valid XML matching this exact schema. No markdown, no explanation, no wrapping — pure XML only.

## XML Schema

```xml
<?xml version="1.0" encoding="UTF-8"?>
<document>
  <metadata>
    <title>Topic Title</title>
    <category>Subject Area</category>
    <subcategory>Subtopic (omit if none)</subcategory>
    <description>One-sentence summary of what this topic covers.</description>
  </metadata>

  <!-- READING SECTIONS: Teach the concept step by step -->
  <reading>
    <section title="Section Title">Thorough explanation. Use multiple sections to break the topic into digestible parts. Each section should be 3-8 paragraphs. Use analogies, real-world examples, and build from fundamentals to advanced. Cover: definitions, intuitions, derivations, edge cases, common mistakes, and connections to related concepts.</section>
    <section title="Another Section">Continue covering all sub-areas of the topic.</section>
  </reading>

  <!-- FORMULAS: Every relevant formula -->
  <formulas>
    <item title="Formula Name">Mathematical expression (LaTeX or plain text)</item>
    <item title="Another Formula">Expression</item>
  </formulas>

  <!-- MCQs: Test understanding at multiple difficulty levels -->
  <mcq>
    <question>The question text</question>
    <option key="A">First option</option>
    <option key="B">Second option</option>
    <option key="C">Third option</option>
    <option key="D">Fourth option</option>
    <answer>The correct key (A, B, C, or D)</answer>
    <difficulty>easy|medium|hard</difficulty>
    <explanation>Why this answer is correct (and optionally why others are wrong)</explanation>
  </mcq>
  <!-- ... more MCQs at varied difficulties -->

  <!-- NOTES: Key takeaways / summary bullets -->
  <notes>
    <item>A crisp, memorable takeaway from the topic</item>
    <item>Another key point to remember</item>
  </notes>

  <!-- TODOS: Actionable study tasks -->
  <todo>
    <item>Specific practice task or exercise for the learner</item>
    <item>Another actionable item</item>
  </todo>
</document>
```

---

## Content Guidelines

### Reading Sections (aim for 2000–6000 words total)
- Start with motivation: *why does this concept exist? what real problem does it solve?*
- Build from first principles: define every term before using it
- Use **analogies** (every abstract concept needs a concrete comparison)
- Include **step-by-step worked examples** within the prose
- Dedicate one section to **common mistakes and misconceptions**
- End with a **"big picture" section** that connects all the pieces
- Cover edge cases, special conditions, and corner cases

### Formulas (include every formula the topic needs)
- Name each formula clearly
- Define every variable used
- Include rearranged forms, special cases, and when each variant applies

### Shortcuts / Mnemonics (embed inside reading sections as subsections)
Within reading sections, include paragraphs headed like:
- *"💡 Shortcut:"* — time-saving trick or rule of thumb
- *"🧠 Mnemonic:"* — memory aid
- *"⚡ Code Snippet:"* — if the topic involves programming, show real code

### MCQs (10–20 questions across difficulty levels)
- **easy (4–6):** Recall and basic understanding
- **medium (4–8):** Application and analysis
- **hard (2–4):** Synthesis, multi-step reasoning, or tricky edge cases
- Each MCQ must have one clearly correct answer and three plausible distractors
- Each must include a detailed explanation

### Notes (5–10 items)
- Single-sentence summaries that encapsulate the most important ideas
- Written so they work as revision flashcards

### Todos (3–5 items)
- Specific, actionable tasks the learner can do right now
- Examples: "Derive formula X from first principles", "Solve 10 practice problems on Y", "Explain concept Z to a friend without notes"

---

## Topic to cover:

**[INSERT YOUR TOPIC HERE — e.g., "Binary Search Trees", "Thermodynamics: The Second Law", "Bayesian Probability", "The French Revolution: Causes and Consequences"]**

---

## Quality Checklist (before outputting)
- [ ] Is every technical term defined before being used?
- [ ] Does each reading section end with a concrete example or application?
- [ ] Are there analogies for the 3 hardest concepts?
- [ ] Are the MCQs sorted easy → medium → hard?
- [ ] Is the explanation in each MCQ genuinely instructive (not just "because it's correct")?
- [ ] Are all XML tags properly closed?
- [ ] Is the total reading content at least 2000 words?
