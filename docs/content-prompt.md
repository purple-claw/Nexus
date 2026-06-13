# Content Generation Prompt

Use this prompt with an LLM (Claude, ChatGPT, etc.) to generate educational content that perfectly matches the Nexus app's database schema. The output JSON can be imported directly without errors.

---

You are a technical curriculum writer. Generate a complete educational module on **[TOPIC_NAME]** that follows the exact JSON schema below. The output must be valid JSON — no markdown wrappers, no explanatory text.

## SCHEMA

```json
{
  "topic": {
    "title": "string — short, descriptive name",
    "description": "string — 1-2 sentence overview"
  },
  "reading_blocks": [
    {
      "title": "string — section heading (use Title Case)",
      "content": "string — full markdown body for reading content. Rules: use ### for subheadings, **bold** for key terms, `code` for inline syntax, ```language for code blocks with correct language tag. Include 1-2 practical examples per block. Write conversationally — like a senior dev teaching a junior. NO mermaid diagrams.",
      "order_idx": "number — position in sequence (0-based)"
    }
  ],
  "formulas": [
    {
      "title": "string — name of the formula/syntax rule",
      "content": "string — the formula expression using backtick syntax. Use → for 'produces/returns', include a brief parenthetical explanation. Example: `\"a\" + \"b\"` → `\"ab\"` (requires both operands to be strings)",
      "order_idx": "number"
    }
  ],
  "notes": [
    {
      "content": "string — quick-reference tip or gotcha. Must use markdown with backtick formatting. Max 2 sentences. Example: `print()` displays output; use `sep` and `end` to control formatting.",
      "order_idx": "number"
    }
  ],
  "mcqs": [
    {
      "question": "string — short question ending with ?",
      "options": "JSON string of array: [{\"key\":\"A\",\"text\":\"...\"},{\"key\":\"B\",\"text\":\"...\"},{\"key\":\"C\",\"text\":\"...\"},{\"key\":\"D\",\"text\":\"...\"}]",
      "answer": "string — one of A|B|C|D",
      "explanation": "string — explain why this answer is correct and the others are wrong. 1-3 sentences.",
      "difficulty": "string — 'easy', 'medium', or 'hard'",
      "order_idx": "number"
    }
  ],
  "todos": [
    {
      "content": "string — actionable task. Start with a verb. Example: Install Python, VS Code, and Git; verify each with `--version` commands.",
      "is_completed": 0,
      "order_idx": "number"
    }
  ]
}
```

## CONTENT RULES

1. **Reading blocks:** Each block should teach one cohesive concept. Use code blocks with language tags (```python, ```bash, ```js, ```json) and real working examples. Include edge cases and common mistakes. Target 300-800 words per block. Write clean, flowing markdown without excessive code blocks interrupting the narrative.

2. **Formulas:** Extract every syntax pattern or rule mentioned in the reading. One formula per distinct pattern. Use backticks for readability. Max one line per formula.

3. **Notes:** Short-format tips, gotchas, or mnemonics that reinforce the reading. 1-2 sentences each. Use markdown.

4. **MCQs:** Test understanding, not memorization. Distractors should be plausible wrong answers that reflect real misconceptions. Include one 'hard' difficulty MCQ per 3 'medium' ones.

5. **Todos:** Convert each reading section into 2-4 actionable tasks. Ordered by learning sequence. Start every todo with a verb.

6. **Consistency:** The `order_idx` values must form a single global sequence across all content types — reading_blocks (0-19), formulas (20-39), notes (40-59), mcqs (60-89), todos (90-109). This ordering controls display in the UI.

7. **Markdown:** Must be valid CommonMark. Code fence language tags are critical — use `python`, `bash`, `js`, `json`, or omit for plain text. Wrap inline code in single backticks. Avoid mermaid diagrams.

8. **Code extraction:** Code blocks with language tags and 3+ words of content will be automatically extracted to the Code Snippets section. Ensure code examples are complete and meaningful.

## OUTPUT FORMAT

Return ONLY the JSON object. No explanation, no markdown code block wrappers around the JSON. The parser expects raw JSON starting with `{`.

## EXAMPLE TOPIC (reference only)

```json
{
  "topic": {
    "title": "Python Basics",
    "description": "A complete starter guide to installing Python, VS Code, and Git, then mastering print, comments, variables, dynamic typing, input(), and string concatenation."
  },
  "reading_blocks": [
    {
      "title": "Set Up Your Development Environment",
      "content": "Writing code without the right tools is like cooking without a stove...",
      "order_idx": 0
    }
  ],
  "formulas": [
    {
      "title": "String concatenation",
      "content": "`\"a\" + \"b\"` → `\"ab\"` (requires both operands to be strings)",
      "order_idx": 20
    }
  ],
  "notes": [
    {
      "content": "`print()` displays output; use `sep` and `end` to control formatting.",
      "order_idx": 40
    }
  ],
  "mcqs": [
    {
      "question": "What does the `print()` function do?",
      "options": "[{\"key\":\"A\",\"text\":\"Sends text to the printer\"},{\"key\":\"B\",\"text\":\"Displays output on the console\"},{\"key\":\"C\",\"text\":\"Returns a string value\"},{\"key\":\"D\",\"text\":\"Reads data from the keyboard\"}]",
      "answer": "B",
      "explanation": "`print()` writes to standard output (the console). It returns `None`, not a string. It doesn't interact with physical printers or input devices.",
      "difficulty": "easy",
      "order_idx": 60
    }
  ],
  "todos": [
    {
      "content": "Install Python, VS Code, and Git; verify each with `--version` commands.",
      "is_completed": 0,
      "order_idx": 90
    }
  ]
}
```
