from flask import Blueprint, render_template
from flask_login import login_required, current_user
from database import get_db
from services.study_service import library_tree

bp = Blueprint('library', __name__, url_prefix='/library')

@bp.route('/', methods=['GET'])
@login_required
def library():
    db = get_db()
    return render_template('library.html', categories=library_tree(db, current_user.id))
