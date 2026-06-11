from flask import Blueprint, render_template
from flask_login import login_required, current_user
from database import get_db
from services.study_service import topic_detail as get_topic_detail

bp = Blueprint('topic', __name__, url_prefix='/topic')

@bp.route('/<int:topic_id>', strict_slashes=False)
@login_required
def topic_detail(topic_id):
    db = get_db()
    detail = get_topic_detail(db, current_user.id, topic_id)
    if not detail:
        return "Topic not found", 404
    return render_template('topic/detail.html', **detail)
