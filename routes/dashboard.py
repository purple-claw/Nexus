from flask import Blueprint, render_template
from database import get_db

bp = Blueprint('dashboard', __name__)

@bp.route('/')
def index():
    db = get_db()
    stats = db.execute('''
        SELECT 
            (SELECT COUNT(*) FROM mcqs) as mcq_count,
            (SELECT COUNT(*) FROM todos WHERE is_completed = 0) as pending_todos,
            (SELECT COUNT(*) FROM daily_plans WHERE plan_date = date('now')) as today_plans
    ''').fetchone()
    return render_template('dashboard.html', stats=stats)
