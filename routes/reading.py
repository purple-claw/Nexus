from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('reading', __name__, url_prefix='/reading')

@bp.route('/', methods=['GET'])
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
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(result)
    return render_template('reading/list.html', texts=result)

@bp.route('/<int:text_id>', methods=['GET'])
@login_required
def reading_detail(text_id):
    db = get_db()
    rb = db.get('reading_blocks', text_id)
    if not rb:
        return "Not found", 404
    topic = db.get('topics', rb.get('topic_id'))
    if not topic or topic.get('user_id') != current_user.id:
        return "Not found", 404
    return render_template('reading/detail.html',
                           title=rb.get('title', ''),
                           topic_title=topic['title'],
                           content=rb.get('content', ''))
