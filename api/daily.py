from datetime import date as dt_date
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import daily_plan

bp = Blueprint('api_daily', __name__)

@bp.route('/daily/<date_str>')
@login_required
def daily(date_str):
    db = get_db()
    result = daily_plan(db, current_user.id, date_str)
    return jsonify(result)
