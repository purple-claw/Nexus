from flask import Blueprint, request, render_template, jsonify
from database import get_db
import json

bp = Blueprint('daily', __name__, url_prefix='/daily')

@bp.route('/<date>', methods=['GET'])
def daily_view(date):
    db = get_db()
    plans = db.execute('''
        SELECT dp.id as plan_id, t.id as topic_id, t.title as topic_title
        FROM daily_plans dp JOIN topics t ON dp.topic_id = t.id WHERE dp.plan_date = ?
    ''', (date,)).fetchall()
    
    result = {"topics": [], "reading": [], "mcqs": [], "todos": []}
    for plan in plans:
        topic_id = plan['topic_id']
        result["topics"].append({"id": topic_id, "title": plan['topic_title']})
        for r in db.execute('SELECT id, title, content FROM reading_blocks WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall():
            result["reading"].append({"id": r['id'], "topic_id": topic_id, "title": r['title'], "content": r['content']})
        for m in db.execute('SELECT id, question, options, answer, explanation FROM mcqs WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall():
            result["mcqs"].append({"id": m['id'], "topic_id": topic_id, "question": m['question'], "options": json.loads(m['options']), "answer": m['answer'], "explanation": m['explanation']})
        for t in db.execute('SELECT id, content, is_completed FROM todos WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall():
            result["todos"].append({"id": t['id'], "topic_id": topic_id, "content": t['content'], "is_completed": t['is_completed']})
            
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest': return jsonify(result)
    return render_template('daily_view.html', date=date, data=result)
