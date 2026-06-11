from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('reading', __name__, url_prefix='/reading')

@bp.route('/', methods=['GET'])
@login_required
def reading_list():
    db = get_db()
    texts = db.execute('''
        SELECT rb.id, rb.title, rb.content, t.title as topic_title
        FROM reading_blocks rb
        JOIN topics t ON rb.topic_id = t.id
        WHERE t.user_id = ?
        ORDER BY rb.order_idx
    ''', (current_user.id,)).fetchall()
    result = [{"id": row['id'], "title": row['title'], "topic_title": row['topic_title'], "content": row['content']} for row in texts]
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(result)
    return render_template('reading/list.html', texts=result)

@bp.route('/<int:text_id>', methods=['GET'])
@login_required
def reading_detail(text_id):
    db = get_db()
    text = db.execute('''
        SELECT rb.content, rb.title, t.title as topic_title
        FROM reading_blocks rb
        JOIN topics t ON rb.topic_id = t.id
        WHERE rb.id = ? AND t.user_id = ?
    ''', (text_id, current_user.id)).fetchone()
    if not text:
        return "Not found", 404
    return render_template('reading/detail.html', title=text['title'], topic_title=text['topic_title'], content=text['content'])
