import xml.etree.ElementTree as ET
import json
import re

def parse_xml(content):
    """
    Parses XML content into structured dictionaries.
    Expected root: <document>
    Expected children: <metadata>, <reading>, <formulas>, <mcq>, <notes>, <todo>
    """
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

    # 1. Parse Metadata
    meta = root.find('metadata')
    if meta is not None:
        if meta.find('title') is not None:
            result["metadata"]["title"] = meta.find('title').text or "Untitled"
        if meta.find('category') is not None:
            result["metadata"]["category"] = meta.find('category').text or "General"
        if meta.find('subcategory') is not None:
            result["metadata"]["subcategory"] = meta.find('subcategory').text
        if meta.find('description') is not None:
            result["metadata"]["description"] = meta.find('description').text or ""

    order_idx = 0

    # 2. Parse Reading Blocks
    reading_root = root.find('reading')
    if reading_root is not None:
        for section in reading_root.findall('section'):
            result["reading"].append({
                "title": section.get('title', 'Section'),
                "content": section.text.strip() if section.text else "",
                "order_idx": order_idx
            })
            order_idx += 1

    # 3. Parse Formulas
    formula_root = root.find('formulas')
    if formula_root is not None:
        for item in formula_root.findall('item'):
            result["formulas"].append({
                "title": item.get('title', 'Formula'),
                "content": item.text.strip() if item.text else "",
                "order_idx": order_idx
            })
            order_idx += 1

    # 4. Parse MCQs
    for mcq_elem in root.findall('mcq'):
        question = mcq_elem.findtext('question', '').strip()
        if not question:
            continue
            
        options = []
        for opt in mcq_elem.findall('option'):
            options.append({
                "key": opt.get('key', '').upper(),
                "text": opt.text.strip() if opt.text else ""
            })
            
        result["mcqs"].append({
            "question": question,
            "options": json.dumps(options),
            "answer": mcq_elem.findtext('answer', '').strip().upper(),
            "explanation": mcq_elem.findtext('explanation', '').strip(),
            "difficulty": mcq_elem.findtext('difficulty', 'medium').strip().lower(),
            "order_idx": order_idx
        })
        order_idx += 1

    # 5. Parse Notes
    notes_root = root.find('notes')
    if notes_root is not None:
        for item in notes_root.findall('item'):
            result["notes"].append({
                "content": item.text.strip() if item.text else "",
                "order_idx": order_idx
            })
            order_idx += 1

    # 6. Parse Todos
    todo_root = root.find('todo')
    if todo_root is not None:
        for item in todo_root.findall('item'):
            result["todos"].append({
                "content": item.text.strip() if item.text else "",
                "is_completed": 0,
                "order_idx": order_idx
            })
            order_idx += 1

    return result

def get_or_create_category(db, name, parent_name=None):
    """Helper to get or create a category, handling hierarchy."""
    parent_id = None
    if parent_name:
        parent = db.execute("SELECT id FROM categories WHERE name = ?", (parent_name,)).fetchone()
        if parent:
            parent_id = parent['id']
        else:
            db.execute("INSERT INTO categories (name, parent_id) VALUES (?, NULL)", (parent_name,))
            parent_id = db.cursor().lastrowid
            
    category = db.execute("SELECT id FROM categories WHERE name = ? AND parent_id IS ?", (name, parent_id)).fetchone()
    if category:
        return category['id']
    else:
        db.execute("INSERT INTO categories (name, parent_id) VALUES (?, ?)", (name, parent_id))
        return db.cursor().lastrowid
