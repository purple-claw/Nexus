import json
from flask import Blueprint, request, render_template, jsonify
from database import get_db

bp = Blueprint('mcq', __name__, url_prefix='/mcq')

@bp.route('/', methods=['GET'])
def mcq_list():
    db = get_db()
    mcqs = db.execute('''
        SELECT m.*, t.title as topic_title, p.attempts, p.correct_count 
        FROM mcqs m JOIN topics t ON m.topic_id = t.id LEFT JOIN progress p ON m.id = p.mcq_id ORDER BY m.order_idx
    ''').fetchall()
    
    result = []
    for row in mcqs:
        result.append({
            "id": row['id'], "topic_title": row['topic_title'], "question": row['question'],
            "options": json.loads(row['options']), "answer": row['answer'],
            "explanation": row['explanation'], "difficulty": row['difficulty'],
            "attempts": row['attempts'] or 0, "correct_count": row['correct_count'] or 0
        })
        
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest': return jsonify(result)
    return render_template('mcq/list.html', mcqs=result)

@bp.route('/practice/', methods=['GET'])
def mcq_practice(): return render_template('mcq/practice.html')

@bp.route('/<int:mcq_id>/answer', methods=['POST'])
def record_answer(mcq_id):
    data = request.json
    is_correct = data.get('is_correct', False)
    db = get_db()
    db.execute('''INSERT INTO progress (mcq_id, attempts, correct_count) VALUES (?, 1, ?)
        ON CONFLICT(mcq_id) DO UPDATE SET attempts = attempts + 1, correct_count = correct_count + ?''', 
        (mcq_id, 1 if is_correct else 0, 1 if is_correct else 0))
    db.commit()
    return jsonify({"success": True})
