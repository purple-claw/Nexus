from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('api_reading', __name__)

@bp.route('/reading')
@login_required
def reading_list():
    db = get_db()
    topics = db.find('topics', user_id=current_user.id)
    result = []
    for t in topics:
        for rb in db.find('reading_blocks', topic_id=t['id']):
            result.append({
                'id': rb['id'],
                'title': rb.get('title', ''),
                'topic_title': t['title'],
                'content': rb.get('content', ''),
            })
    return jsonify(result)

@bp.route('/reading/<int:text_id>')
@login_required
def reading_detail(text_id):
    db = get_db()
    rb = db.get('reading_blocks', text_id)
    if not rb:
        return jsonify({"error": "Not found"}), 404
    topic = db.get('topics', rb.get('topic_id'))
    if not topic or topic.get('user_id') != current_user.id:
        return jsonify({"error": "Not found"}), 404
    return jsonify({
        'title': rb.get('title', ''),
        'topic_title': topic['title'],
        'content': rb.get('content', ''),
    })
