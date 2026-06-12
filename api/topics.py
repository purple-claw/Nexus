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

@bp.route('/topics/<int:topic_id>', methods=['DELETE'])
@login_required
def delete_topic(topic_id):
    db = get_db()
    topic = db.find_one('topics', id=topic_id, user_id=current_user.id)
    if not topic:
        return jsonify({"error": "Topic not found"}), 404

    mcq_ids = [m['id'] for m in db.find('mcqs', topic_id=topic_id)]
    for mid in mcq_ids:
        db.delete_where('progress', mcq_id=mid, user_id=current_user.id)
    db.delete_where('mcqs', topic_id=topic_id)
    db.delete_where('reading_blocks', topic_id=topic_id)
    db.delete_where('formulas', topic_id=topic_id)
    db.delete_where('notes', topic_id=topic_id)
    db.delete_where('todos', topic_id=topic_id)
    db.delete_where('daily_plans', topic_id=topic_id)
    db.delete('topics', topic_id)

    return jsonify({"success": True})

@bp.route('/topics/tracker')
@login_required
def topic_tracker():
    db = get_db()
    topics = db.find('topics', user_id=current_user.id)
    topics.sort(key=lambda t: t.get('id', 0), reverse=True)

    plans = db.find('daily_plans', user_id=current_user.id)
    plan_map = {}
    for p in plans:
        tid = p.get('topic_id')
        if tid not in plan_map or p['plan_date'] > plan_map[tid]:
            plan_map[tid] = p['plan_date']

    result = []
    for t in topics:
        tid = t['id']
        cat = db.get('categories', t.get('category_id'))
        result.append({
            'id': tid,
            'title': t['title'],
            'description': t.get('description', ''),
            'category_name': cat['name'] if cat else '',
            'reading_count': db.count('reading_blocks', topic_id=tid),
            'mcq_count': db.count('mcqs', topic_id=tid),
            'formula_count': db.count('formulas', topic_id=tid),
            'note_count': db.count('notes', topic_id=tid),
            'todo_count': db.count('todos', topic_id=tid),
            'plan_date': plan_map.get(tid),
        })

    return jsonify(result)
