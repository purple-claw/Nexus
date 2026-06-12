from flask import Blueprint, request, render_template, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import save_parsed_document
from parser import parse_markdown as parse_document

bp = Blueprint('upload', __name__, url_prefix='/upload')

@bp.route('/', methods=['GET', 'POST'])
@login_required
def upload_page():
    if request.method == 'POST':
        ajax = bool(request.form.get('md_content'))

        content = None
        filename = 'document.md'

        if 'file' in request.files and request.files['file'].filename:
            f = request.files['file']
            content = f.read().decode('utf-8')
            filename = f.filename
        elif request.form.get('md_content'):
            content = request.form['md_content']

        if not content:
            if ajax:
                return jsonify({"error": "No content provided"}), 400
            flash('No content provided', 'error')
            return render_template('upload.html')

        try:
            parsed = parse_document(content)
            db = get_db()
            topic_id = save_parsed_document(db, current_user.id, parsed, filename)
            if ajax:
                return jsonify({"success": True, "message": "Document saved successfully!", "topic_id": topic_id})
            flash('Document uploaded successfully!', 'success')
            return redirect(url_for('topic.topic_detail', topic_id=topic_id))
        except Exception as e:
            if ajax:
                return jsonify({"error": str(e)}), 500
            flash(f'Error: {str(e)}', 'error')
            return render_template('upload.html')

    return render_template('upload.html')
