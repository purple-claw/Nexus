from flask import Blueprint, request, render_template, jsonify
from database import get_db

bp = Blueprint('calendar', __name__, url_prefix='/calendar')

@bp.route('/', methods=['GET'])
def calendar_page():
    return render_template('calendar.html')

@bp.route('/events', methods=['GET'])
def get_events():
    db = get_db()
    plans = db.execute('''
        SELECT dp.plan_date, t.title as topic_title
        FROM daily_plans dp
        JOIN topics t ON dp.topic_id = t.id
    ''').fetchall()
    
    events = {}
    for row in plans:
        date = row['plan_date']
        if date not in events:
            events[date] = {"topics": 0}
        events[date]["topics"] += 1
            
    return jsonify(events)

@bp.route('/available', methods=['GET'])
def get_available():
    db = get_db()
    topics = db.execute('SELECT id, title FROM topics ORDER BY title LIMIT 100').fetchall()
    return jsonify({
        "topics": [{"id": row['id'], "title": row['title']} for row in topics]
    })

@bp.route('/assign', methods=['POST'])
def assign_content():
    data = request.json
    db = get_db()
    topic_id = data.get('topic_id')
    plan_date = data.get('date')
    
    db.execute('''
        INSERT INTO daily_plans (plan_date, topic_id)
        VALUES (?, ?)
    ''', (plan_date, topic_id))
    db.commit()
    return jsonify({"success": True})
