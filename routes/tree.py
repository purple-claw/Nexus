from flask import Blueprint, jsonify
from database import get_db

bp = Blueprint('tree', __name__, url_prefix='/api')

@bp.route('/tree', methods=['GET'])
def get_tree():
    db = get_db()
    cats = db.execute('SELECT id, name, parent_id FROM categories ORDER BY name').fetchall()
    topics = db.execute('SELECT id, category_id, title FROM topics ORDER BY title').fetchall()
    
    # Build nested dictionary
    cat_dict = {c['id']: {"id": c['id'], "name": c['name'], "children": [], "topics": []} for c in cats}
    
    roots = []
    for c in cats:
        if c['parent_id'] and c['parent_id'] in cat_dict:
            cat_dict[c['parent_id']]["children"].append(cat_dict[c['id']])
        elif not c['parent_id']:
            roots.append(cat_dict[c['id']])
            
    # Attach topics to their respective categories
    for t in topics:
        if t['category_id'] in cat_dict:
            cat_dict[t['category_id']]["topics"].append({"id": t['id'], "title": t['title']})
            
    return jsonify(roots)
