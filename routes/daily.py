from datetime import date as dt_date
from flask import Blueprint, request, render_template, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import daily_plan

bp = Blueprint('daily', __name__, url_prefix='/daily')

@bp.route('/', defaults={'date_str': None})
@bp.route('/<date_str>', methods=['GET'])
@login_required
def daily_view(date_str):
    today = dt_date.today().isoformat()
    if date_str is None:
        date_str = today
    db = get_db()
    result = daily_plan(db, current_user.id, date_str)
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(result)
    return render_template('daily_view.html', date=date_str, data=result)
