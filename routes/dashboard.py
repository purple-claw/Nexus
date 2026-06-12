from datetime import date
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from database import get_db
from services.study_service import dashboard_summary

bp = Blueprint('dashboard', __name__)

@bp.route('/')
@login_required
def index():
    db = get_db()
    today = date.today().isoformat()
    summary = dashboard_summary(db, current_user.id, today)
    return render_template('dashboard.html', stats=summary["stats"], topics=summary["topics"],
                           reading=summary["reading"], mcqs=summary["mcqs"], todos=summary["todos"])
