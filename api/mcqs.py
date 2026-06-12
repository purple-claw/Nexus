from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import list_mcqs

bp = Blueprint('api_mcqs', __name__)

@bp.route('/mcqs')
@login_required
def mcq_list():
    db = get_db()
    result = list_mcqs(db, current_user.id)
    return jsonify(result)

@bp.route('/mcqs/<int:mcq_id>/answer', methods=['POST'])
@login_required
def record_answer(mcq_id):
    data = request.get_json(silent=True) or {}
    is_correct = bool(data.get('is_correct', False))
    db = get_db()

    mcq = db.get('mcqs', mcq_id)
    if not mcq:
        return jsonify({"error": "Question not found"}), 404
    topic = db.get('topics', mcq.get('topic_id'))
    if not topic or topic.get('user_id') != current_user.id:
        return jsonify({"error": "Question not found"}), 404

    existing = db.find_one('progress', user_id=current_user.id, mcq_id=mcq_id)
    if existing:
        db.update('progress', existing['id'], {
            'attempts': existing.get('attempts', 0) + 1,
            'correct_count': existing.get('correct_count', 0) + (1 if is_correct else 0),
        })
    else:
        db.insert('progress', {
            'user_id': current_user.id,
            'mcq_id': mcq_id,
            'attempts': 1,
            'correct_count': 1 if is_correct else 0,
        })

    return jsonify({"success": True})
