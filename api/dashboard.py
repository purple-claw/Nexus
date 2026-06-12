from datetime import date
from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import dashboard_summary

bp = Blueprint('api_dashboard', __name__)

@bp.route('/dashboard')
@login_required
def index():
    db = get_db()
    today = date.today().isoformat()
    summary = dashboard_summary(db, current_user.id, today)
    return jsonify(summary)
