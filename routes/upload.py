from flask import Blueprint, request, render_template, redirect, url_for, flash
from flask_login import login_required, current_user
from database import get_db
from services.study_service import save_parsed_document
from parser import parse_xml as parse_document

bp = Blueprint('upload', __name__, url_prefix='/upload')

@bp.route('/', methods=['GET', 'POST'])
@login_required
def upload_page():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected', 'error')
            return render_template('upload.html')
        file = request.files['file']
        if not file.filename:
            flash('No file selected', 'error')
            return render_template('upload.html')
        try:
            content = file.read().decode('utf-8')
            parsed = parse_document(content)
            db = get_db()
            topic_id = save_parsed_document(db, current_user.id, parsed, file.filename)
            flash('Document uploaded successfully!', 'success')
            return redirect(url_for('topic.topic_detail', topic_id=topic_id))
        except Exception as e:
            flash(f'Error: {str(e)}', 'error')
            return render_template('upload.html')
    return render_template('upload.html')
