import os
from flask import Blueprint, request, render_template, jsonify
from database import get_db
from parser import parse_xml, get_or_create_category

bp = Blueprint('upload', __name__, url_prefix='/upload')

@bp.route('/', methods=['GET', 'POST'])
def upload_page():
    if request.method == 'POST':
        xml_content = None
        
        # Handle file upload
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename.endswith('.xml'):
                xml_content = file.read().decode('utf-8')
            else:
                return jsonify({"error": "Please upload a valid .xml file"}), 400
                
        # Handle raw XML text from textarea
        elif request.form.get('xml_content'):
            xml_content = request.form.get('xml_content')
            
        if not xml_content:
            return jsonify({"error": "No XML content provided"}), 400

        try:
            parsed = parse_xml(xml_content)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400
        except Exception as e:
            return jsonify({"error": f"Failed to parse XML: {str(e)}"}), 400

        db = get_db()
        cursor = db.cursor()
        
        try:
            # 1. Handle Category Hierarchy
            meta = parsed['metadata']
            category_name = meta['category']
            subcategory_name = meta['subcategory']
            
            # If subcategory exists, it becomes the actual category for the topic, 
            # and category_name becomes its parent.
            if subcategory_name:
                get_or_create_category(db, category_name) # Ensure parent exists
                category_id = get_or_create_category(db, subcategory_name, category_name)
            else:
                category_id = get_or_create_category(db, category_name)

            # 2. Create Document record (tracks raw uploads)
            filename = request.files['file'].filename if 'file' in request.files and request.files['file'].filename else 'manual_entry.xml'
            cursor.execute("INSERT INTO documents (filename) VALUES (?)", (filename,))
            doc_id = cursor.lastrowid

            # 3. Create Topic
            cursor.execute('''
                INSERT INTO topics (document_id, category_id, title, description) 
                VALUES (?, ?, ?, ?)
            ''', (doc_id, category_id, meta['title'], meta['description']))
            topic_id = cursor.lastrowid

            # 4. Insert Reading Blocks
            for block in parsed['reading']:
                cursor.execute('''
                    INSERT INTO reading_blocks (topic_id, title, content, order_idx) 
                    VALUES (?, ?, ?, ?)
                ''', (topic_id, block['title'], block['content'], block['order_idx']))

            # 5. Insert Formulas
            for formula in parsed['formulas']:
                cursor.execute('''
                    INSERT INTO formulas (topic_id, title, content, order_idx) 
                    VALUES (?, ?, ?, ?)
                ''', (topic_id, formula['title'], formula['content'], formula['order_idx']))

            # 6. Insert MCQs
            for mcq in parsed['mcqs']:
                cursor.execute('''
                    INSERT INTO mcqs (topic_id, question, options, answer, explanation, difficulty, order_idx) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (topic_id, mcq['question'], mcq['options'], mcq['answer'], 
                      mcq['explanation'], mcq['difficulty'], mcq['order_idx']))

            # 7. Insert Notes
            for note in parsed['notes']:
                cursor.execute('''
                    INSERT INTO notes (topic_id, content, order_idx) 
                    VALUES (?, ?, ?)
                ''', (topic_id, note['content'], note['order_idx']))

            # 8. Insert Todos
            for todo in parsed['todos']:
                cursor.execute('''
                    INSERT INTO todos (topic_id, content, is_completed, order_idx) 
                    VALUES (?, ?, ?, ?)
                ''', (topic_id, todo['content'], todo['is_completed'], todo['order_idx']))

            db.commit()
            
            return jsonify({
                "success": True, 
                "message": f"Successfully parsed and saved '{meta['title']}'!",
                "stats": {
                    "reading": len(parsed['reading']),
                    "formulas": len(parsed['formulas']),
                    "mcqs": len(parsed['mcqs']),
                    "notes": len(parsed['notes']),
                    "todos": len(parsed['todos'])
                }
            })
            
        except Exception as e:
            db.rollback()
            return jsonify({"error": f"Database error: {str(e)}"}), 500

    return render_template('upload.html')
