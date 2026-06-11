from datetime import datetime
from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db

bp = Blueprint('calendar', __name__, url_prefix='/calendar')

@bp.route('/', methods=['GET'])
@login_required
def calendar_page():
    return render_template('calendar.html')

@bp.route('/events', methods=['GET'])
@login_required
def get_events():
    db = get_db()
    plans = db.execute('''
        SELECT dp.plan_date, COUNT(*) as topic_count
        FROM daily_plans dp
        JOIN topics t ON dp.topic_id = t.id
        WHERE dp.user_id = ?
        GROUP BY dp.plan_date
    ''', (current_user.id,)).fetchall()
    events = {}
    for row in plans:
        events[row['plan_date']] = {"topics": row['topic_count']}
    return jsonify(events)

@bp.route('/available', methods=['GET'])
@login_required
def get_available():
    db = get_db()
    topics = db.execute('SELECT id, title FROM topics WHERE user_id = ? ORDER BY title LIMIT 100', (current_user.id,)).fetchall()
    return jsonify({"topics": [{"id": row['id'], "title": row['title']} for row in topics]})

@bp.route('/assign', methods=['POST'])
@login_required
def assign_content():
    data = request.get_json(silent=True) or {}
    db = get_db()
    topic_id = data.get('topic_id')
    plan_date = data.get('date')

    try:
        topic_id = int(topic_id)
        datetime.strptime(plan_date, '%Y-%m-%d')
    except (TypeError, ValueError):
        return jsonify({"error": "A valid topic and YYYY-MM-DD date are required"}), 400

    topic = db.execute('SELECT id FROM topics WHERE id = ? AND user_id = ?', (topic_id, current_user.id)).fetchone()
    if not topic:
        return jsonify({"error": "Topic not found"}), 404

    db.execute('''
        INSERT OR IGNORE INTO daily_plans (user_id, plan_date, topic_id)
        VALUES (?, ?, ?)
    ''', (current_user.id, plan_date, topic_id))
    db.commit()
    return jsonify({"success": True})
