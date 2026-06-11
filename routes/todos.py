from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('todos', __name__, url_prefix='/todos')

@bp.route('/', methods=['GET'])
@login_required
def todos_list():
    db = get_db()
    todos = db.execute('''
        SELECT td.*, t.title as topic_title
        FROM todos td
        JOIN topics t ON td.topic_id = t.id
        WHERE t.user_id = ?
        ORDER BY t.title, td.order_idx
    ''', (current_user.id,)).fetchall()
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify([dict(t) for t in todos])
    return render_template('todos/list.html', todos=todos)

@bp.route('/<int:todo_id>/toggle', methods=['POST'])
@login_required
def toggle_todo(todo_id):
    db = get_db()
    db.execute('UPDATE todos SET is_completed = CASE WHEN is_completed THEN 0 ELSE 1 END WHERE id = ?', (todo_id,))
    db.commit()
    todo = db.execute('SELECT * FROM todos WHERE id = ?', (todo_id,)).fetchone()
    return jsonify({"success": True, "is_completed": bool(todo['is_completed'])})
