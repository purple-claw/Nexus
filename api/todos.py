from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('api_todos', __name__)

@bp.route('/todos')
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
    return jsonify({"groups": groups})

@bp.route('/todos/<int:todo_id>/toggle', methods=['POST'])
@login_required
def toggle_todo(todo_id):
    db = get_db()
    todo = db.get('todos', todo_id)
    if not todo:
        return jsonify({"error": "Not found"}), 404
    if todo.get('topic_id'):
        topic = db.get('topics', todo['topic_id'])
        if not topic or topic.get('user_id') != current_user.id:
            return jsonify({"error": "Not found"}), 404
    new_status = 0 if todo.get('is_completed') else 1
    db.update('todos', todo_id, {'is_completed': new_status})
    return jsonify({"success": True, "is_completed": bool(new_status)})
