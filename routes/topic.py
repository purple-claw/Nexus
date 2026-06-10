from flask import Blueprint, render_template
from database import get_db
import json
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bp = Blueprint('topic', __name__, url_prefix='/topic')

@bp.route('/<int:topic_id>', methods=['GET'])
def topic_detail(topic_id):
    db = get_db()
    topic = db.execute('SELECT t.*, c.name as category_name FROM topics t JOIN categories c ON t.category_id = c.id WHERE t.id = ?', (topic_id,)).fetchone()
    if not topic: return "Topic not found", 404
        
    readings = db.execute('SELECT * FROM reading_blocks WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall()
    formulas = db.execute('SELECT * FROM formulas WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall()
    notes = db.execute('SELECT * FROM notes WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall()
    mcqs = db.execute('SELECT * FROM mcqs WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall()

    # Standardize MCQ data
    questions_list = []
    for m in mcqs:
        try: options_parsed = json.loads(m['options'])
        except: options_parsed = []
        questions_list.append({
            "id": m['id'], "question": m['question'], "options": options_parsed,
            "answer": m['answer'], "explanation": m['explanation'], "difficulty": m['difficulty']
        })

    counts = {"reading": len(readings), "formulas": len(formulas), "notes": len(notes), "mcqs": len(questions_list)}
    
    # Smart Default: Open the first tab that has content
    default_tab = 'reading'
    for tab in ['reading', 'formulas', 'notes', 'mcqs']:
        if counts[tab] > 0:
            default_tab = tab
            break
            
    return render_template('topic/detail.html', 
                           topic=topic, readings=readings, formulas=formulas, notes=notes, 
                           questions=questions_list, counts=counts, default_tab=default_tab)
