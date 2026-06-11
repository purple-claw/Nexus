from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import list_mcqs

bp = Blueprint('mcq', __name__, url_prefix='/mcq')

@bp.route('/', methods=['GET'])
@login_required
def mcq_list():
    db = get_db()
    result = list_mcqs(db, current_user.id)
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(result)
    return render_template('mcq/list.html', mcqs=result)

@bp.route('/practice/', methods=['GET'])
@login_required
def mcq_practice():
    return render_template('mcq/practice.html')

@bp.route('/<int:mcq_id>/answer', methods=['POST'])
@login_required
def record_answer(mcq_id):
    data = request.get_json(silent=True) or {}
    is_correct = bool(data.get('is_correct', False))
    db = get_db()
    mcq = db.execute('''
        SELECT m.id FROM mcqs m
        JOIN topics t ON m.topic_id = t.id
        WHERE m.id = ? AND t.user_id = ?
    ''', (mcq_id, current_user.id)).fetchone()
    if not mcq:
        return jsonify({"error": "Question not found"}), 404

    db.execute('''INSERT INTO progress (user_id, mcq_id, attempts, correct_count) VALUES (?, ?, 1, ?)
        ON CONFLICT(user_id, mcq_id) DO UPDATE SET attempts = attempts + 1, correct_count = correct_count + ?''',
        (current_user.id, mcq_id, 1 if is_correct else 0, 1 if is_correct else 0))
    db.commit()
    return jsonify({"success": True})
