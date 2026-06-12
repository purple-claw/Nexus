from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from database import get_db
from services.study_service import topic_detail

bp = Blueprint('api_topics', __name__)

@bp.route('/topics/<int:topic_id>')
@login_required
def topic(topic_id):
    db = get_db()
    detail = topic_detail(db, current_user.id, topic_id)
    if not detail:
        return jsonify({"error": "Topic not found"}), 404
    return jsonify(detail)

@bp.route('/topics/<int:topic_id>', methods=['PUT'])
@login_required
def update_topic(topic_id):
    db = get_db()
    topic = db.find_one('topics', id=topic_id, user_id=current_user.id)
    if not topic:
        return jsonify({"error": "Topic not found"}), 404

    data = request.get_json(silent=True) or {}
    if 'title' in data and data['title'].strip():
        db.update('topics', topic_id, {'title': data['title'].strip()})
        return jsonify({"success": True, "title": data['title'].strip()})

    return jsonify({"error": "Title is required"}), 400
