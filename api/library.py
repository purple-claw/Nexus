from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import library_tree

bp = Blueprint('api_library', __name__)

@bp.route('/library')
@login_required
def library():
    db = get_db()
    return jsonify({"categories": library_tree(db, current_user.id)})
