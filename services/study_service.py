import json
from parser import get_or_create_category

def row_dict(row):
    return dict(row) if row is not None else None

def parse_options(value):
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []
    return parsed if isinstance(parsed, list) else []

def dashboard_summary(db, user_id, today):
    stats = row_dict(db.execute('''
        SELECT
            (SELECT COUNT(*) FROM topics WHERE user_id = ?) as topic_count,
            (SELECT COUNT(*) FROM categories WHERE user_id = ?) as category_count,
            (SELECT COUNT(*) FROM mcqs m JOIN topics t ON m.topic_id = t.id WHERE t.user_id = ?) as mcq_count,
            (SELECT COUNT(*) FROM todos td JOIN topics t ON td.topic_id = t.id WHERE t.user_id = ? AND td.is_completed = 0) as pending_todos,
            (SELECT COUNT(*) FROM daily_plans WHERE user_id = ? AND plan_date = ?) as today_plans,
            (SELECT COALESCE(SUM(p.attempts), 0) FROM progress p JOIN mcqs m ON p.mcq_id = m.id JOIN topics t ON m.topic_id = t.id WHERE t.user_id = ?) as attempts,
            (SELECT COALESCE(SUM(p.correct_count), 0) FROM progress p JOIN mcqs m ON p.mcq_id = m.id JOIN topics t ON m.topic_id = t.id WHERE t.user_id = ?) as correct_count
    ''', (user_id, user_id, user_id, user_id, user_id, today, user_id, user_id)).fetchone())
    attempts = stats["attempts"] or 0
    stats["accuracy"] = round((stats["correct_count"] / attempts) * 100) if attempts else None
    recent_topics = [
        row_dict(row)
        for row in db.execute('''
            SELECT t.id, t.title, t.description, c.name as category_name
            FROM topics t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
            ORDER BY t.id DESC
            LIMIT 6
        ''', (user_id,)).fetchall()
    ]
    return {"stats": stats, "recent_topics": recent_topics}

def library_tree(db, user_id):
    categories = [
        {
            "id": row["id"],
            "name": row["name"],
            "parent_id": row["parent_id"],
            "children": [],
            "topics": [],
            "topic_count": 0,
            "total_topic_count": 0,
        }
        for row in db.execute('SELECT id, name, parent_id FROM categories WHERE user_id = ? ORDER BY name', (user_id,)).fetchall()
    ]
    by_id = {category["id"]: category for category in categories}
    topics = [
        row_dict(row)
        for row in db.execute('''
            SELECT t.id, t.title, t.description, t.category_id, c.name as category_name
            FROM topics t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
            ORDER BY c.name, t.title
        ''', (user_id,)).fetchall()
    ]
    roots = []
    for category in categories:
        parent = by_id.get(category["parent_id"])
        if parent:
            parent["children"].append(category)
        else:
            roots.append(category)

    topic_ids = [t["id"] for t in topics]
    if topic_ids:
        placeholders = ",".join("?" for _ in topic_ids)
        mcq_counts = {
            row["topic_id"]: row["count"]
            for row in db.execute(f'''
                SELECT topic_id, COUNT(*) as count FROM mcqs
                WHERE topic_id IN ({placeholders})
                GROUP BY topic_id
            ''', topic_ids).fetchall()
        }
        reading_counts = {
            row["topic_id"]: row["count"]
            for row in db.execute(f'''
                SELECT topic_id, COUNT(*) as count FROM reading_blocks
                WHERE topic_id IN ({placeholders})
                GROUP BY topic_id
            ''', topic_ids).fetchall()
        }
        formula_counts = {
            row["topic_id"]: row["count"]
            for row in db.execute(f'''
                SELECT topic_id, COUNT(*) as count FROM formulas
                WHERE topic_id IN ({placeholders})
                GROUP BY topic_id
            ''', topic_ids).fetchall()
        }
        note_counts = {
            row["topic_id"]: row["count"]
            for row in db.execute(f'''
                SELECT topic_id, COUNT(*) as count FROM notes
                WHERE topic_id IN ({placeholders})
                GROUP BY topic_id
            ''', topic_ids).fetchall()
        }
    else:
        mcq_counts = reading_counts = formula_counts = note_counts = {}

    for topic in topics:
        topic["mcq_count"] = mcq_counts.get(topic["id"], 0)
        topic["reading_count"] = reading_counts.get(topic["id"], 0)
        topic["formula_count"] = formula_counts.get(topic["id"], 0)
        topic["note_count"] = note_counts.get(topic["id"], 0)
        category = by_id.get(topic["category_id"])
        if category:
            category["topics"].append(topic)
            category["topic_count"] += 1

    def rollup(cat):
        total = cat["topic_count"]
        for child in cat["children"]:
            total += rollup(child)
        cat["total_topic_count"] = total
        return total

    for root in roots:
        rollup(root)
    return roots

def topic_detail(db, user_id, topic_id):
    topic = row_dict(db.execute('''
        SELECT t.*, c.name as category_name
        FROM topics t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ? AND t.user_id = ?
    ''', (topic_id, user_id)).fetchone())
    if not topic:
        return None

    readings = db.execute(
        'SELECT * FROM reading_blocks WHERE topic_id = ? ORDER BY order_idx',
        (topic_id,)
    ).fetchall()
    formulas = db.execute(
        'SELECT * FROM formulas WHERE topic_id = ? ORDER BY order_idx',
        (topic_id,)
    ).fetchall()
    notes = db.execute(
        'SELECT * FROM notes WHERE topic_id = ? ORDER BY order_idx',
        (topic_id,)
    ).fetchall()
    mcq_rows = db.execute(
        'SELECT * FROM mcqs WHERE topic_id = ? ORDER BY order_idx',
        (topic_id,)
    ).fetchall()

    questions = []
    for row in mcq_rows:
        questions.append({
            "id": row["id"],
            "question": row["question"],
            "options": parse_options(row["options"]),
            "answer": row["answer"],
            "explanation": row["explanation"],
            "difficulty": row["difficulty"],
        })

    counts = {
        "reading": len(readings),
        "formulas": len(formulas),
        "notes": len(notes),
        "mcqs": len(questions),
    }
    default_tab = next((key for key in ("reading", "formulas", "notes", "mcqs") if counts[key]), "reading")
    return {"topic": topic, "readings": readings, "formulas": formulas, "notes": notes, "questions": questions, "counts": counts, "default_tab": default_tab}

def daily_plan(db, user_id, plan_date):
    plans = db.execute('''
        SELECT dp.id as plan_id, t.id as topic_id, t.title as topic_title
        FROM daily_plans dp
        JOIN topics t ON dp.topic_id = t.id
        WHERE dp.user_id = ? AND dp.plan_date = ?
        ORDER BY t.title
    ''', (user_id, plan_date)).fetchall()

    result = {"topics": [], "reading": [], "mcqs": [], "todos": []}
    topic_ids = []
    for plan in plans:
        topic_ids.append(plan["topic_id"])
        result["topics"].append({"id": plan["topic_id"], "title": plan["topic_title"]})

    if not topic_ids:
        return result

    placeholders = ",".join("?" for _ in topic_ids)
    result["reading"] = [
        row_dict(row)
        for row in db.execute(f'''
            SELECT id, topic_id, title, content
            FROM reading_blocks
            WHERE topic_id IN ({placeholders})
            ORDER BY topic_id, order_idx
        ''', topic_ids).fetchall()
    ]

    for row in db.execute(f'''
        SELECT id, topic_id, question, options, answer, explanation, difficulty
        FROM mcqs
        WHERE topic_id IN ({placeholders})
        ORDER BY topic_id, order_idx
    ''', topic_ids).fetchall():
        item = row_dict(row)
        item["options"] = parse_options(row["options"])
        result["mcqs"].append(item)

    result["todos"] = [
        row_dict(row)
        for row in db.execute(f'''
            SELECT id, topic_id, content, is_completed
            FROM todos
            WHERE topic_id IN ({placeholders})
            ORDER BY topic_id, order_idx
        ''', topic_ids).fetchall()
    ]
    return result

def list_mcqs(db, user_id):
    mcqs = db.execute('''
        SELECT m.*, t.title as topic_title, p.attempts, p.correct_count
        FROM mcqs m
        JOIN topics t ON m.topic_id = t.id
        LEFT JOIN progress p ON m.id = p.mcq_id AND p.user_id = ?
        WHERE t.user_id = ?
        ORDER BY t.title, m.order_idx
    ''', (user_id, user_id)).fetchall()

    result = []
    for row in mcqs:
        result.append({
            "id": row["id"],
            "topic_title": row["topic_title"],
            "question": row["question"],
            "options": parse_options(row["options"]),
            "answer": row["answer"],
            "explanation": row["explanation"],
            "difficulty": row["difficulty"],
            "attempts": row["attempts"] or 0,
            "correct_count": row["correct_count"] or 0,
        })
    return result

def save_parsed_document(db, user_id, parsed, filename):
    meta = parsed["metadata"]
    if meta["subcategory"]:
        get_or_create_category(db, meta["category"], user_id=user_id)
        category_id = get_or_create_category(db, meta["subcategory"], meta["category"], user_id=user_id)
    else:
        category_id = get_or_create_category(db, meta["category"], user_id=user_id)

    cursor = db.cursor()
    cursor.execute("INSERT INTO documents (user_id, filename) VALUES (?, ?)", (user_id, filename))
    document_id = cursor.lastrowid

    cursor.execute('''
        INSERT INTO topics (user_id, document_id, category_id, title, description)
        VALUES (?, ?, ?, ?, ?)
    ''', (user_id, document_id, category_id, meta["title"], meta["description"]))
    topic_id = cursor.lastrowid

    cursor.executemany('''
        INSERT INTO reading_blocks (topic_id, title, content, order_idx)
        VALUES (?, ?, ?, ?)
    ''', [(topic_id, item["title"], item["content"], item["order_idx"]) for item in parsed["reading"]])

    cursor.executemany('''
        INSERT INTO formulas (topic_id, title, content, order_idx)
        VALUES (?, ?, ?, ?)
    ''', [(topic_id, item["title"], item["content"], item["order_idx"]) for item in parsed["formulas"]])

    cursor.executemany('''
        INSERT INTO mcqs (topic_id, question, options, answer, explanation, difficulty, order_idx)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', [
        (topic_id, item["question"], item["options"], item["answer"], item["explanation"], item["difficulty"], item["order_idx"])
        for item in parsed["mcqs"]
    ])

    cursor.executemany('''
        INSERT INTO notes (topic_id, content, order_idx)
        VALUES (?, ?, ?)
    ''', [(topic_id, item["content"], item["order_idx"]) for item in parsed["notes"]])

    cursor.executemany('''
        INSERT INTO todos (topic_id, content, is_completed, order_idx)
        VALUES (?, ?, ?, ?)
    ''', [(topic_id, item["content"], item["is_completed"], item["order_idx"]) for item in parsed["todos"]])

    db.commit()
    return topic_id
