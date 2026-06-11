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
    plans = db.find('daily_plans', user_id=current_user.id)
    events = {}
    for p in plans:
        d = p['plan_date']
        if d not in events:
            events[d] = {'topics': 0}
        events[d]['topics'] += 1
    return jsonify(events)

@bp.route('/available', methods=['GET'])
@login_required
def get_available():
    db = get_db()
    topics = db.find('topics', user_id=current_user.id)
    topics.sort(key=lambda t: t.get('title', ''))
    return jsonify({
        "topics": [{"id": t['id'], "title": t['title']} for t in topics[:100]]
    })

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

    topic = db.get('topics', topic_id)
    if not topic or topic.get('user_id') != current_user.id:
        return jsonify({"error": "Topic not found"}), 404

    existing = db.find_one('daily_plans', user_id=current_user.id, plan_date=plan_date, topic_id=topic_id)
    if not existing:
        db.insert('daily_plans', {
            'user_id': current_user.id,
            'plan_date': plan_date,
            'topic_id': topic_id,
        })

    return jsonify({"success": True})
