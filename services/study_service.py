import json
from parser import get_or_create_category


def parse_options(value):
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []
    return parsed if isinstance(parsed, list) else []


def dashboard_summary(db, user_id, today):
    topics = db.find('topics', user_id=user_id)
    categories = db.find('categories', user_id=user_id)

    mcq_ids = []
    topic_ids = [t['id'] for t in topics]
    mcqs = []
    for t in topics:
        mcqs.extend(db.find('mcqs', topic_id=t['id']))
    mcq_ids = [m['id'] for m in mcqs]

    pending_todos = 0
    for t in topics:
        pending_todos += db.count('todos', topic_id=t['id'], is_completed=0)

    today_plans = db.count('daily_plans', user_id=user_id, plan_date=today)

    attempts = 0
    correct = 0
    for m_id in mcq_ids:
        p = db.find_one('progress', user_id=user_id, mcq_id=m_id)
        if p:
            attempts += p.get('attempts', 0)
            correct += p.get('correct_count', 0)

    accuracy = round((correct / attempts) * 100) if attempts else None

    stats = {
        'topic_count': len(topics),
        'category_count': len(categories),
        'mcq_count': len(mcqs),
        'pending_todos': pending_todos,
        'today_plans': today_plans,
        'attempts': attempts,
        'correct_count': correct,
        'accuracy': accuracy,
    }

    recent = []
    for t in sorted(topics, key=lambda x: x['id'], reverse=True)[:6]:
        cat = db.get('categories', t.get('category_id'))
        recent.append({
            'id': t['id'],
            'title': t['title'],
            'description': t.get('description', ''),
            'category_name': cat['name'] if cat else '',
        })

    return {'stats': stats, 'recent_topics': recent}


def library_tree(db, user_id):
    cats = db.find('categories', user_id=user_id)

    def build(cat):
        return {
            'id': cat['id'],
            'name': cat['name'],
            'parent_id': cat.get('parent_id'),
            'children': [],
            'topics': [],
            'topic_count': 0,
            'total_topic_count': 0,
        }

    by_id = {}
    for c in cats:
        node = build(c)
        by_id[node['id']] = node

    roots = []
    for node in by_id.values():
        if node['parent_id'] and node['parent_id'] in by_id:
            by_id[node['parent_id']]['children'].append(node)
        else:
            roots.append(node)

    topics = db.find('topics', user_id=user_id)
    topic_ids = [t['id'] for t in topics]

    mcq_counts = {}
    reading_counts = {}
    formula_counts = {}
    note_counts = {}

    for tid in topic_ids:
        mcq_counts[tid] = db.count('mcqs', topic_id=tid)
        reading_counts[tid] = db.count('reading_blocks', topic_id=tid)
        formula_counts[tid] = db.count('formulas', topic_id=tid)
        note_counts[tid] = db.count('notes', topic_id=tid)

    for t in topics:
        cat = by_id.get(t.get('category_id'))
        if cat:
            entry = {
                'id': t['id'],
                'title': t['title'],
                'description': t.get('description', ''),
                'category_id': t.get('category_id'),
                'category_name': cat['name'],
                'mcq_count': mcq_counts.get(t['id'], 0),
                'reading_count': reading_counts.get(t['id'], 0),
                'formula_count': formula_counts.get(t['id'], 0),
                'note_count': note_counts.get(t['id'], 0),
            }
            cat['topics'].append(entry)
            cat['topic_count'] += 1

    def rollup(cat):
        total = cat['topic_count']
        for child in cat['children']:
            total += rollup(child)
        cat['total_topic_count'] = total
        return total

    for root in roots:
        rollup(root)

    return roots


def topic_detail(db, user_id, topic_id):
    topic = db.find_one('topics', id=topic_id, user_id=user_id)
    if not topic:
        return None

    cat = db.get('categories', topic.get('category_id'))
    topic_dict = dict(topic)
    topic_dict['category_name'] = cat['name'] if cat else ''

    readings = db.find('reading_blocks', topic_id=topic_id)
    for r in readings:
        r['order_idx'] = r.get('order_idx', 0)
    readings.sort(key=lambda x: x.get('order_idx', 0))

    formulas = db.find('formulas', topic_id=topic_id)
    formulas.sort(key=lambda x: x.get('order_idx', 0))

    notes = db.find('notes', topic_id=topic_id)
    notes.sort(key=lambda x: x.get('order_idx', 0))

    mcq_rows = db.find('mcqs', topic_id=topic_id)
    mcq_rows.sort(key=lambda x: x.get('order_idx', 0))

    questions = []
    for row in mcq_rows:
        questions.append({
            'id': row['id'],
            'question': row['question'],
            'options': parse_options(row['options']),
            'answer': row['answer'],
            'explanation': row.get('explanation', ''),
            'difficulty': row.get('difficulty', 'medium'),
        })

    counts = {
        'reading': len(readings),
        'formulas': len(formulas),
        'notes': len(notes),
        'mcqs': len(questions),
    }
    default_tab = next((k for k in ('reading', 'formulas', 'notes', 'mcqs') if counts[k]), 'reading')

    return {
        'topic': topic_dict,
        'readings': readings,
        'formulas': formulas,
        'notes': notes,
        'questions': questions,
        'counts': counts,
        'default_tab': default_tab,
    }


def daily_plan(db, user_id, plan_date):
    plans = db.find('daily_plans', user_id=user_id, plan_date=plan_date)
    result = {'topics': [], 'reading': [], 'mcqs': [], 'todos': []}

    for plan in plans:
        t = db.get('topics', plan.get('topic_id'))
        if t:
            result['topics'].append({'id': t['id'], 'title': t['title']})

    topic_ids = [p['topic_id'] for p in plans]
    if not topic_ids:
        return result

    for tid in topic_ids:
        for r in db.find('reading_blocks', topic_id=tid):
            result['reading'].append(r)
        for m in db.find('mcqs', topic_id=tid):
            m_copy = dict(m)
            m_copy['options'] = parse_options(m.get('options', '[]'))
            result['mcqs'].append(m_copy)
        for td in db.find('todos', topic_id=tid):
            result['todos'].append(td)

    return result


def list_mcqs(db, user_id):
    topics = db.find('topics', user_id=user_id)
    result = []

    for t in topics:
        for m in db.find('mcqs', topic_id=t['id']):
            p = db.find_one('progress', user_id=user_id, mcq_id=m['id'])
            result.append({
                'id': m['id'],
                'topic_title': t['title'],
                'question': m['question'],
                'options': parse_options(m.get('options', '[]')),
                'answer': m['answer'],
                'explanation': m.get('explanation', ''),
                'difficulty': m.get('difficulty', 'medium'),
                'attempts': p.get('attempts', 0) if p else 0,
                'correct_count': p.get('correct_count', 0) if p else 0,
            })

    result.sort(key=lambda x: (x['topic_title'], x['id']))
    return result


def save_parsed_document(db, user_id, parsed, filename):
    meta = parsed['metadata']

    parent_id = None
    if meta['subcategory']:
        parent = get_or_create_category(db, meta['category'], user_id=user_id)
        category_id = get_or_create_category(db, meta['subcategory'], parent, user_id=user_id)
    else:
        category_id = get_or_create_category(db, meta['category'], user_id=user_id)

    doc_id = db.insert('documents', {'user_id': user_id, 'filename': filename})

    topic_id = db.insert('topics', {
        'user_id': user_id,
        'document_id': doc_id,
        'category_id': category_id,
        'title': meta['title'],
        'description': meta.get('description', ''),
    })

    reading_records = [
        {'topic_id': topic_id, 'title': item['title'], 'content': item['content'], 'order_idx': item['order_idx']}
        for item in parsed['reading']
    ]
    db.insert_many('reading_blocks', reading_records)

    formula_records = [
        {'topic_id': topic_id, 'title': item['title'], 'content': item['content'], 'order_idx': item['order_idx']}
        for item in parsed['formulas']
    ]
    db.insert_many('formulas', formula_records)

    mcq_records = [
        {
            'topic_id': topic_id, 'question': item['question'], 'options': item['options'],
            'answer': item['answer'], 'explanation': item.get('explanation', ''),
            'difficulty': item.get('difficulty', 'medium'), 'order_idx': item['order_idx'],
        }
        for item in parsed['mcqs']
    ]
    db.insert_many('mcqs', mcq_records)

    note_records = [
        {'topic_id': topic_id, 'content': item['content'], 'order_idx': item['order_idx']}
        for item in parsed['notes']
    ]
    db.insert_many('notes', note_records)

    todo_records = [
        {'topic_id': topic_id, 'content': item['content'], 'is_completed': item.get('is_completed', 0), 'order_idx': item['order_idx']}
        for item in parsed['todos']
    ]
    db.insert_many('todos', todo_records)

    return topic_id
