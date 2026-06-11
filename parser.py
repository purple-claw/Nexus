import xml.etree.ElementTree as ET
import json


def _clean_text(value, fallback=""):
    if value is None:
        return fallback
    cleaned = value.strip()
    return cleaned if cleaned else fallback

def parse_xml(content):
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        raise ValueError(f"Invalid XML format: {e}")

    result = {
        "metadata": {"title": "Untitled", "category": "General", "subcategory": None, "description": ""},
        "reading": [],
        "formulas": [],
        "mcqs": [],
        "notes": [],
        "todos": []
    }

    meta = root.find('metadata')
    if meta is not None:
        if meta.find('title') is not None:
            result["metadata"]["title"] = _clean_text(meta.find('title').text, "Untitled")
        if meta.find('category') is not None:
            result["metadata"]["category"] = _clean_text(meta.find('category').text, "General")
        if meta.find('subcategory') is not None:
            result["metadata"]["subcategory"] = _clean_text(meta.find('subcategory').text, None)
        if meta.find('description') is not None:
            result["metadata"]["description"] = _clean_text(meta.find('description').text)

    order_idx = 0

    reading_root = root.find('reading')
    if reading_root is not None:
        for section in reading_root.findall('section'):
            result["reading"].append({
                "title": _clean_text(section.get('title'), 'Section'),
                "content": _clean_text(section.text),
                "order_idx": order_idx
            })
            order_idx += 1

    formula_root = root.find('formulas')
    if formula_root is not None:
        for item in formula_root.findall('item'):
            result["formulas"].append({
                "title": _clean_text(item.get('title'), 'Formula'),
                "content": _clean_text(item.text),
                "order_idx": order_idx
            })
            order_idx += 1

    for mcq_elem in root.findall('mcq'):
        question = _clean_text(mcq_elem.findtext('question', ''))
        if not question:
            continue

        options = []
        for opt in mcq_elem.findall('option'):
            key = _clean_text(opt.get('key')).upper()
            text = _clean_text(opt.text)
            if key and text:
                options.append({"key": key, "text": text})

        answer = _clean_text(mcq_elem.findtext('answer', '')).upper()
        if not options or not answer:
            continue

        result["mcqs"].append({
            "question": question,
            "options": json.dumps(options),
            "answer": answer,
            "explanation": _clean_text(mcq_elem.findtext('explanation', '')),
            "difficulty": _clean_text(mcq_elem.findtext('difficulty', 'medium'), 'medium').lower(),
            "order_idx": order_idx
        })
        order_idx += 1

    notes_root = root.find('notes')
    if notes_root is not None:
        for item in notes_root.findall('item'):
            result["notes"].append({
                "content": _clean_text(item.text),
                "order_idx": order_idx
            })
            order_idx += 1

    todo_root = root.find('todo')
    if todo_root is not None:
        for item in todo_root.findall('item'):
            result["todos"].append({
                "content": _clean_text(item.text),
                "is_completed": 0,
                "order_idx": order_idx
            })
            order_idx += 1

    return result

def get_or_create_category(db, name, parent_name=None, user_id=None):
    name = _clean_text(name, "General")
    parent_name = _clean_text(parent_name, None)
    parent_id = None
    if parent_name:
        parent = db.execute(
            "SELECT id FROM categories WHERE name = ? AND parent_id IS NULL AND user_id = ?",
            (parent_name, user_id)
        ).fetchone()
        if parent:
            parent_id = parent['id']
        else:
            cursor = db.execute("INSERT INTO categories (name, parent_id, user_id) VALUES (?, NULL, ?)", (parent_name, user_id))
            parent_id = cursor.lastrowid

    category = db.execute(
        "SELECT id FROM categories WHERE name = ? AND parent_id IS ? AND user_id = ?",
        (name, parent_id, user_id)
    ).fetchone()
    if category:
        return category['id']
    else:
        cursor = db.execute(
            "INSERT INTO categories (name, parent_id, user_id) VALUES (?, ?, ?)",
            (name, parent_id, user_id)
        )
        return cursor.lastrowid
