from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('todos', __name__, url_prefix='/todos')

@bp.route('/', methods=['GET'])
@login_required
def todos_list():
    db = get_db()
    topics = db.find('topics', user_id=current_user.id)
    groups = []
    for t in topics:
        topic_todos = db.find('todos', topic_id=t['id'])
        if topic_todos:
            topic_todos.sort(key=lambda x: x.get('order_idx', 0))
            groups.append({
                'topic': t['title'],
                'todos': topic_todos
            })

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        all_todos = []
        for g in groups:
            for td in g['todos']:
                all_todos.append(td)
        return jsonify(all_todos)
    return render_template('todos/list.html', groups=groups)

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
