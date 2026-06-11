from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('todos', __name__, url_prefix='/todos')

@bp.route('/', methods=['GET'])
@login_required
def todos_list():
    db = get_db()
    topics = db.find('topics', user_id=current_user.id)
    todos = []
    for t in topics:
        for td in db.find('todos', topic_id=t['id']):
            td_copy = dict(td)
            td_copy['topic_title'] = t['title']
            todos.append(td_copy)
    todos.sort(key=lambda x: (x.get('topic_title', ''), x.get('order_idx', 0)))

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(todos)
    return render_template('todos/list.html', todos=todos)

@bp.route('/<int:todo_id>/toggle', methods=['POST'])
@login_required
def toggle_todo(todo_id):
    db = get_db()
    todo = db.get('todos', todo_id)
    if not todo:
        return jsonify({"error": "Not found"}), 404
    new_status = 0 if todo.get('is_completed') else 1
    db.update('todos', todo_id, {'is_completed': new_status})
    return jsonify({"success": True, "is_completed": bool(new_status)})
