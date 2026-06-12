from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from database import get_db
from services.study_service import save_parsed_document
from parser import parse_markdown as parse_document

bp = Blueprint('api_upload', __name__)

@bp.route('/upload', methods=['POST'])
@login_required
def upload():
    content = None
    filename = 'document.md'

    if 'file' in request.files and request.files['file'].filename:
        f = request.files['file']
        content = f.read().decode('utf-8')
        filename = f.filename
    elif request.form.get('md_content'):
        content = request.form['md_content']
    elif request.is_json:
        data = request.get_json(force=True)
        content = data.get('content', data.get('md_content'))

    if not content:
        return jsonify({"error": "No content provided"}), 400

    try:
        parsed = parse_document(content)
        db = get_db()
        topic_id = save_parsed_document(db, current_user.id, parsed, filename)
        return jsonify({"success": True, "message": "Document saved successfully!", "topic_id": topic_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
