import re
import json

def _clean(value, fallback=""):
    if value is None:
        return fallback
    cleaned = value.strip()
    return cleaned if cleaned else fallback


def parse_markdown(content):
    result = {
        "metadata": {"title": "Untitled", "category": "General", "subcategory": None, "description": ""},
        "reading": [],
        "formulas": [],
        "mcqs": [],
        "notes": [],
        "todos": [],
    }

    lines = content.split('\n')
    current_section = "metadata"
    section_buffer = []
    metadata_done = False
    order_idx = 0
    in_code_block = False

    # Collect all h2-delimited sections
    sections = {} 
    current_h2 = None

    for line in lines:
        if line.startswith('```'):
            in_code_block = not in_code_block
        if line.startswith('# ') and not in_code_block:
            title = _clean(line[2:])
            if title:
                result["metadata"]["title"] = title
        elif line.startswith('## ') and not in_code_block:
            if current_h2 and section_buffer:
                sections[current_h2] = '\n'.join(section_buffer).strip()
            current_h2 = _clean(line[3:]).lower().replace(' ', '_')
            section_buffer = []
        else:
            section_buffer.append(line)

    if current_h2 and section_buffer:
        sections[current_h2] = '\n'.join(section_buffer).strip()

    # Extract metadata from ## Metadata section
    meta_text = sections.get('metadata', '')
    for line in meta_text.split('\n'):
        line = line.strip()
        lower = line.lower()
        if lower.startswith('- category:'):
            result["metadata"]["category"] = _clean(line.split(':', 1)[1], "General")
        elif lower.startswith('- subcategory:'):
            val = _clean(line.split(':', 1)[1])
            result["metadata"]["subcategory"] = val if val else None
        elif lower.startswith('- description:'):
            result["metadata"]["description"] = _clean(line.split(':', 1)[1])

    # Parse reading content (from ## Content or ## Reading)
    reading_key = None
    for key in ['content', 'reading']:
        if key in sections:
            reading_key = key
            break

    if reading_key:
        reading_text = sections[reading_key]
        # Split into h3 sections
        reading_sections = re.split(r'\n(?=### )', reading_text)
        for sec in reading_sections:
            sec = sec.strip()
            if not sec:
                continue
            title = ""
            content_lines = []
            for line in sec.split('\n'):
                if line.startswith('### '):
                    title = _clean(line[4:])
                else:
                    content_lines.append(line)
            body = '\n'.join(content_lines).strip()
            if body:
                result["reading"].append({
                    "title": title or "Section",
                    "content": body,
                    "order_idx": order_idx
                })
                order_idx += 1

    # Parse formulas from ## Formulas section
    formulas_text = sections.get('formulas', '')
    if formulas_text:
        for line in formulas_text.split('\n'):
            line = line.strip()
            if not line:
                continue
            m = re.match(r'\*\*(.+?):\*\*\s*(.+)', line)
            if m:
                title = _clean(m.group(1))
                content = _clean(m.group(2))
                if title and content:
                    result["formulas"].append({
                        "title": title,
                        "content": content,
                        "order_idx": order_idx
                    })
                    order_idx += 1

    # Parse MCQs from ## MCQs section
    mcqs_text = sections.get('mcqs', '')
    if mcqs_text:
        mcq_blocks = re.split(r'\n(?=\*\*Q\d+:)', mcqs_text)
        for block in mcq_blocks:
            block = block.strip()
            if not block:
                continue
            q_match = re.search(r'\*\*Q\d+:\*\*\s*(.+?)(?=\n(?:-\s+[A-D]\)))', block, re.DOTALL)
            if not q_match:
                continue
            question = _clean(q_match.group(1))

            options = []
            opt_matches = re.findall(r'-\s*([A-D])\)\s*(.+)', block)
            for key, text in opt_matches:
                options.append({"key": key.upper(), "text": _clean(text)})

            answer_m = re.search(r'\*\*Answer:\*\*\s*([A-D])', block)
            answer = _clean(answer_m.group(1)).upper() if answer_m else ""

            difficulty_m = re.search(r'\*\*Difficulty:\*\*\s*(.+)', block)
            difficulty = _clean(difficulty_m.group(1), 'medium').lower() if difficulty_m else 'medium'

            expl_m = re.search(r'\*\*Explanation:\*\*\s*(.+)', block, re.DOTALL)
            explanation = _clean(expl_m.group(1)) if expl_m else ""

            if options and answer:
                result["mcqs"].append({
                    "question": question,
                    "options": json.dumps(options),
                    "answer": answer,
                    "explanation": explanation,
                    "difficulty": difficulty,
                    "order_idx": order_idx
                })
                order_idx += 1

    # Parse notes from ## Notes section (bullet points)
    notes_text = sections.get('notes', '')
    if notes_text:
        for line in notes_text.split('\n'):
            line = line.strip()
            if line.startswith('- '):
                note = _clean(line[2:])
                if note:
                    result["notes"].append({"content": note, "order_idx": order_idx})
                    order_idx += 1

    # Parse todos from ## Todos section
    todos_text = sections.get('todos', '')
    if todos_text:
        for line in todos_text.split('\n'):
            line = line.strip()
            if line.startswith('- [ ]'):
                todo = _clean(line[5:])
                if todo:
                    result["todos"].append({"content": todo, "is_completed": 0, "order_idx": order_idx})
                    order_idx += 1
            elif line.startswith('- [x]'):
                todo = _clean(line[5:])
                if todo:
                    result["todos"].append({"content": todo, "is_completed": 1, "order_idx": order_idx})
                    order_idx += 1
            elif line.startswith('- '):
                todo = _clean(line[2:])
                if todo:
                    result["todos"].append({"content": todo, "is_completed": 0, "order_idx": order_idx})
                    order_idx += 1

    return result

def get_or_create_category(db, name, parent_name=None, user_id=None):
    name = _clean(name, "General")
    parent_id = None
    if isinstance(parent_name, int):
        parent_id = parent_name
    elif parent_name:
        parent_name = _clean(parent_name, None)
        if parent_name:
            parent = db.find_one('categories', name=parent_name, parent_id=None, user_id=user_id)
            if parent:
                parent_id = parent['id']
            else:
                parent_id = db.insert('categories', {'name': parent_name, 'parent_id': None, 'user_id': user_id})

    category = db.find_one('categories', name=name, parent_id=parent_id, user_id=user_id)
    if category:
        return category['id']
    else:
        return db.insert('categories', {'name': name, 'parent_id': parent_id, 'user_id': user_id})
