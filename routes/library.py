from flask import Blueprint, render_template
from database import get_db

bp = Blueprint('library', __name__, url_prefix='/library')

@bp.route('/', methods=['GET'])
def library():
    db = get_db()
    
    # Get root categories
    categories = db.execute('''
        SELECT c1.id, c1.name, 
               (SELECT COUNT(*) FROM topics t WHERE t.category_id = c1.id) as topic_count
        FROM categories c1
        WHERE c1.parent_id IS NULL
        ORDER BY c1.name
    ''').fetchall()
    
    # Get subcategories
    subcategories = db.execute('''
        SELECT c2.id, c2.name, c2.parent_id, c1.name as parent_name,
               (SELECT COUNT(*) FROM topics t WHERE t.category_id = c2.id) as topic_count
        FROM categories c2
        JOIN categories c1 ON c2.parent_id = c1.id
        ORDER BY c1.name, c2.name
    ''').fetchall()
    
    # Get all topics
    topics = db.execute('''
        SELECT t.id, t.title, t.category_id, c.name as category_name, c.parent_id
        FROM topics t
        JOIN categories c ON t.category_id = c.id
        ORDER BY c.name, t.title
    ''').fetchall()
    
    return render_template('library.html', categories=categories, subcategories=subcategories, topics=topics)
