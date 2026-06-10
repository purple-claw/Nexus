from flask import Blueprint, request, render_template, jsonify
from database import get_db

bp = Blueprint('todos', __name__, url_prefix='/todos')

@bp.route('/', methods=['GET'])
def todos_list():
    """Smart view: Shows all incomplete todos across the entire app, grouped by topic."""
    db = get_db()
    todos = db.execute('''
        SELECT t.id, t.content, t.is_completed, top.title as topic_name
        FROM todos t
        JOIN topics top ON t.topic_id = top.id
        WHERE t.is_completed = 0
        ORDER BY top.title, t.order_idx
    ''').fetchall()
    return render_template('todos/list.html', todos=todos)

@bp.route('/<int:todo_id>/toggle', methods=['POST'])
def toggle_todo(todo_id):
    """Robust toggle: Flips the status and returns the new state to the frontend."""
    db = get_db()
    db.execute('''
        UPDATE todos 
        SET is_completed = 1 - is_completed 
        WHERE id = ?
    ''', (todo_id,))
    db.commit()
    
    # Fetch new state to ensure frontend sync
    todo = db.execute('SELECT is_completed FROM todos WHERE id = ?', (todo_id,)).fetchone()
    return jsonify({"success": True, "is_completed": todo['is_completed']})
