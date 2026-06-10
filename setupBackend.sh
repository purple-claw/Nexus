#!/bin/bash

echo "🚀 Phase 6: Comprehensive Architecture Fix & Unification..."

# 1. Fix Main App (Remove invalid Jinja logic, fix imports)
cat << 'EOF' > main.py
from flask import Flask, g
from config import Config
from database import close_db, init_db, get_db
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(os.path.dirname(app.config['DATABASE']), exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

    # Simple, robust context processor
    @app.context_processor
    def inject_globals():
        db = get_db()
        first_topic = db.execute('SELECT id, title FROM topics ORDER BY id LIMIT 1').fetchone()
        return dict(first_topic=first_topic)

    from routes.dashboard import bp as dashboard_bp
    from routes.upload import bp as upload_bp
    from routes.calendar import bp as calendar_bp
    from routes.daily import bp as daily_bp
    from routes.mcq import bp as mcq_bp
    from routes.reading import bp as reading_bp
    from routes.tree import bp as tree_bp
    from routes.topic import bp as topic_bp
    from routes.library import bp as library_bp
    from routes.todos import bp as todos_bp

    app.register_blueprint(dashboard_bp)
    app.register_blueprint(upload_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(daily_bp)
    app.register_blueprint(mcq_bp)
    app.register_blueprint(reading_bp)
    app.register_blueprint(tree_bp)
    app.register_blueprint(topic_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(todos_bp)
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
EOF

# 2. Fix Reading & Daily Routes (Use correct schema)
cat << 'EOF' > routes/reading.py
from flask import Blueprint, request, render_template, jsonify
from database import get_db

bp = Blueprint('reading', __name__, url_prefix='/reading')

@bp.route('/', methods=['GET'])
def reading_list():
    db = get_db()
    texts = db.execute('''
        SELECT rb.id, rb.title, rb.content, t.title as topic_title
        FROM reading_blocks rb
        JOIN topics t ON rb.topic_id = t.id
        ORDER BY rb.order_idx
    ''').fetchall()
    result = [{"id": row['id'], "title": row['title'], "topic_title": row['topic_title'], "content": row['content']} for row in texts]
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify(result)
    return render_template('reading/list.html', texts=result)

@bp.route('/<int:text_id>', methods=['GET'])
def reading_detail(text_id):
    db = get_db()
    text = db.execute('''
        SELECT rb.content, rb.title, t.title as topic_title 
        FROM reading_blocks rb JOIN topics t ON rb.topic_id = t.id WHERE rb.id = ?
    ''', (text_id,)).fetchone()
    if not text: return "Not found", 404
    return render_template('reading/detail.html', title=text['title'], topic_title=text['topic_title'], content=text['content'])
EOF

cat << 'EOF' > routes/daily.py
from flask import Blueprint, request, render_template, jsonify
from database import get_db
import json

bp = Blueprint('daily', __name__, url_prefix='/daily')

@bp.route('/<date>', methods=['GET'])
def daily_view(date):
    db = get_db()
    plans = db.execute('''
        SELECT dp.id as plan_id, t.id as topic_id, t.title as topic_title
        FROM daily_plans dp JOIN topics t ON dp.topic_id = t.id WHERE dp.plan_date = ?
    ''', (date,)).fetchall()
    
    result = {"topics": [], "reading": [], "mcqs": [], "todos": []}
    for plan in plans:
        topic_id = plan['topic_id']
        result["topics"].append({"id": topic_id, "title": plan['topic_title']})
        for r in db.execute('SELECT id, title, content FROM reading_blocks WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall():
            result["reading"].append({"id": r['id'], "topic_id": topic_id, "title": r['title'], "content": r['content']})
        for m in db.execute('SELECT id, question, options, answer, explanation FROM mcqs WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall():
            result["mcqs"].append({"id": m['id'], "topic_id": topic_id, "question": m['question'], "options": json.loads(m['options']), "answer": m['answer'], "explanation": m['explanation']})
        for t in db.execute('SELECT id, content, is_completed FROM todos WHERE topic_id = ? ORDER BY order_idx', (topic_id,)).fetchall():
            result["todos"].append({"id": t['id'], "topic_id": topic_id, "content": t['content'], "is_completed": t['is_completed']})
            
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest': return jsonify(result)
    return render_template('daily_view.html', date=date, data=result)
EOF

# 3. Fix Topic Route (Smart Tab Defaulting & Consistent Naming)
cat << 'EOF' > routes/topic.py
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
EOF

# 4. Fix Base Template (Clean, Robust Sidebar)
cat << 'EOF' > templates/base.html
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus | Intelligent Study Planner</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.3/dist/cdn.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.13.3/dist/cdn.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
    <script>
        tailwind.config = { theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'] }, colors: { primary: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' } } } } }
    </script>
</head>
<body class="flex flex-col h-screen overflow-hidden text-slate-900" x-data="{ sidebarOpen: false }">
    <div class="flex flex-1 overflow-hidden">
        <aside class="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-all duration-300" :class="sidebarOpen ? 'translate-x-0' : '-translate-x-64 absolute lg:relative lg:translate-x-0 z-50 h-full'">
            <div class="h-16 flex items-center px-6 border-b border-slate-100">
                <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3">N</div>
                <span class="font-semibold text-slate-800 text-lg tracking-tight">Nexus</span>
            </div>
            <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <a href="/" class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {{ 'bg-primary-50 text-primary-700' if request.path == '/' else 'text-slate-600 hover:bg-slate-50' }}">📊 Dashboard</a>
                <a href="/library/" class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {{ 'bg-primary-50 text-primary-700' if request.path == '/library/' else 'text-slate-600 hover:bg-slate-50' }}"> Content Library</a>
                <a href="/calendar/" class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {{ 'bg-primary-50 text-primary-700' if request.path == '/calendar/' else 'text-slate-600 hover:bg-slate-50' }}">📅 Calendar</a>
                <a href="/todos/" class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {{ 'bg-primary-50 text-primary-700' if request.path == '/todos/' else 'text-slate-600 hover:bg-slate-50' }}">✅ My Todos</a>
                <div class="pt-6 mt-6 border-t border-slate-100">
                    <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tools</p>
                    <a href="/upload/" class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {{ 'bg-primary-50 text-primary-700' if request.path == '/upload/' else 'text-slate-600 hover:bg-slate-50' }}">⬆️ Upload XML</a>
                    <a href="/mcq/" class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors {{ 'bg-primary-50 text-primary-700' if '/mcq/' in request.path else 'text-slate-600 hover:bg-slate-50' }}">❓ Question Bank</a>
                </div>
            </nav>
        </aside>
        <div class="flex-1 flex flex-col overflow-hidden">
            <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
                <button @click="sidebarOpen = !sidebarOpen" class="lg:hidden text-slate-500">☰</button>
                <span class="text-sm text-slate-500" id="current-date"></span>
            </header>
            <main class="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">{% block content %}{% endblock %}</main>
        </div>
    </div>
    <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-3"></div>
    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
    <script>document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });</script>
    {% block scripts %}{% endblock %}
</body>
</html>
EOF

# 5. Fix Topic Detail Template (Smart Tabs & Unified MCQ Engine)
cat << 'EOF' > templates/topic/detail.html
{% extends 'base.html' %}
{% block content %}
<div class="max-w-5xl mx-auto" x-data="topicView({{ questions | tojson }}, '{{ default_tab }}')">
    <div class="mb-8">
        <span class="text-xs font-semibold text-primary-600 uppercase tracking-wider bg-primary-50 px-2 py-1 rounded">{{ topic.category_name }}</span>
        <h1 class="text-3xl font-bold text-slate-900 mt-2">{{ topic.title }}</h1>
        {% if topic.description %}<p class="text-slate-500 mt-2">{{ topic.description }}</p>{% endif %}
    </div>

    <div class="flex border-b border-slate-200 mb-8 gap-6 overflow-x-auto">
        <button @click="activeTab = 'reading'" :class="activeTab === 'reading' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'" class="pb-3 text-sm font-medium border-b-2 whitespace-nowrap">📖 Reading ({{ counts.reading }})</button>
        <button @click="activeTab = 'formulas'" :class="activeTab === 'formulas' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'" class="pb-3 text-sm font-medium border-b-2 whitespace-nowrap">📐 Formulas ({{ counts.formulas }})</button>
        <button @click="activeTab = 'notes'" :class="activeTab === 'notes' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'" class="pb-3 text-sm font-medium border-b-2 whitespace-nowrap">📝 Notes ({{ counts.notes }})</button>
        <button @click="activeTab = 'mcqs'" :class="activeTab === 'mcqs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500'" class="pb-3 text-sm font-medium border-b-2 whitespace-nowrap">❓ MCQs ({{ counts.mcqs }})</button>
    </div>

    <div x-show="activeTab === 'reading'">
        {% if readings %}{% for r in readings %}<div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm prose max-w-none mb-4"><h3 class="text-lg font-semibold">{{ r.title }}</h3>{{ r.content | replace('\n', '<br>') | safe }}</div>{% endfor %}
        {% else %}<div class="text-slate-500 text-center py-12">No reading content.</div>{% endif %}
    </div>

    <div x-show="activeTab === 'formulas'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {% if formulas %}{% for f in formulas %}<div class="bg-purple-50 p-5 rounded-xl border border-purple-100"><h4 class="text-sm font-bold text-purple-900 uppercase mb-2">{{ f.title }}</h4><code class="text-lg font-mono block bg-white p-3 rounded">{{ f.content }}</code></div>{% endfor %}
        {% else %}<p class="text-slate-500 text-center py-12 col-span-2">No formulas.</p>{% endif %}
    </div>

    <div x-show="activeTab === 'notes'">
        {% if notes %}{% for n in notes %}<div class="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-3">💡 {{ n.content }}</div>{% endfor %}
        {% else %}<p class="text-slate-500 text-center py-12">No notes.</p>{% endif %}
    </div>

    <div x-show="activeTab === 'mcqs'" class="space-y-6">
        <template x-if="questions.length === 0"><p class="text-slate-500 text-center py-12">No MCQs in this topic.</p></template>
        <template x-for="q in questions" :key="q.id">
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-slate-900" x-text="q.question"></h3>
                    <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase" x-text="q.difficulty"></span>
                </div>
                <div class="space-y-3 mb-4">
                    <template x-for="opt in q.options" :key="opt.key">
                        <button @click="selectAnswer(q.id, opt.key)" class="w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3" :class="getOptClass(q.id, opt.key)">
                            <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100" x-text="opt.key"></span>
                            <span class="text-sm" x-text="opt.text"></span>
                        </button>
                    </template>
                </div>
                <div x-show="answered[q.id]" x-transition class="mt-4 p-4 rounded-lg" :class="isCorrect(q.id) ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'">
                    <p class="font-semibold mb-2" :class="isCorrect(q.id) ? 'text-emerald-800' : 'text-rose-800'" x-text="isCorrect(q.id) ? '✓ Correct!' : '✗ Incorrect. Answer: ' + q.answer"></p>
                    <p class="text-sm text-slate-700" x-text="q.explanation"></p>
                </div>
            </div>
        </template>
    </div>
</div>
{% endblock %}
{% block scripts %}
<script src="{{ url_for('static', filename='js/topic.js') }}"></script>
{% endblock %}
EOF

# 6. Fix Global Question Bank (Use same engine as Topic View)
cat << 'EOF' > templates/mcq/list.html
{% extends 'base.html' %}
{% block content %}
<div class="max-w-6xl mx-auto" x-data="topicView({{ mcqs | tojson }}, 'mcqs')">
    <div class="mb-6"><h1 class="text-2xl font-bold text-slate-900">Question Bank</h1><p class="text-slate-500">Browse and practice all parsed MCQs.</p></div>
    <div class="space-y-6">
        <template x-if="questions.length === 0"><div class="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500">No MCQs found. <a href="/upload/" class="text-primary-600 hover:underline">Upload XML</a> first!</div></template>
        <template x-for="q in questions" :key="q.id">
            <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                    <div><span class="text-[10px] font-bold text-slate-500 uppercase" x-text="q.topic_title"></span><h3 class="text-lg font-semibold text-slate-900 mt-1" x-text="q.question"></h3></div>
                    <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase" x-text="q.difficulty"></span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <template x-for="opt in q.options" :key="opt.key">
                        <button @click="selectAnswer(q.id, opt.key)" class="text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3" :class="getOptClass(q.id, opt.key)">
                            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100" x-text="opt.key"></span>
                            <span class="text-sm" x-text="opt.text"></span>
                        </button>
                    </template>
                </div>
                <div x-show="answered[q.id]" x-transition class="mt-4 p-4 rounded-lg" :class="isCorrect(q.id) ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'">
                    <p class="font-semibold mb-2 text-sm" :class="isCorrect(q.id) ? 'text-emerald-800' : 'text-rose-800'" x-text="isCorrect(q.id) ? '✓ Correct!' : '✗ Incorrect. Answer: ' + q.answer"></p>
                    <p class="text-sm text-slate-700" x-text="q.explanation"></p>
                </div>
            </div>
        </template>
    </div>
</div>
{% endblock %}
{% block scripts %}
<script src="{{ url_for('static', filename='js/topic.js') }}"></script>
{% endblock %}
EOF

# 7. Fix MCQ Route to pass 'mcqs' correctly
cat << 'EOF' > routes/mcq.py
import json
from flask import Blueprint, request, render_template, jsonify
from database import get_db

bp = Blueprint('mcq', __name__, url_prefix='/mcq')

@bp.route('/', methods=['GET'])
def mcq_list():
    db = get_db()
    mcqs = db.execute('''
        SELECT m.*, t.title as topic_title, p.attempts, p.correct_count 
        FROM mcqs m JOIN topics t ON m.topic_id = t.id LEFT JOIN progress p ON m.id = p.mcq_id ORDER BY m.order_idx
    ''').fetchall()
    
    result = []
    for row in mcqs:
        result.append({
            "id": row['id'], "topic_title": row['topic_title'], "question": row['question'],
            "options": json.loads(row['options']), "answer": row['answer'],
            "explanation": row['explanation'], "difficulty": row['difficulty'],
            "attempts": row['attempts'] or 0, "correct_count": row['correct_count'] or 0
        })
        
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest': return jsonify(result)
    return render_template('mcq/list.html', mcqs=result)

@bp.route('/practice/', methods=['GET'])
def mcq_practice(): return render_template('mcq/practice.html')

@bp.route('/<int:mcq_id>/answer', methods=['POST'])
def record_answer(mcq_id):
    data = request.json
    is_correct = data.get('is_correct', False)
    db = get_db()
    db.execute('''INSERT INTO progress (mcq_id, attempts, correct_count) VALUES (?, 1, ?)
        ON CONFLICT(mcq_id) DO UPDATE SET attempts = attempts + 1, correct_count = correct_count + ?''', 
        (mcq_id, 1 if is_correct else 0, 1 if is_correct else 0))
    db.commit()
    return jsonify({"success": True})
EOF

echo "✅ FINAL ARCHITECTURE FIX COMPLETE!"
echo ""
echo "🚀 Please do the following:"
echo "1. Restart your Flask server (Ctrl+C, then python main.py)"
echo "2. Go to http://localhost:5000/library/ and click a topic."
echo "3. The page will AUTOMATICALLY open the tab that has your content (e.g., MCQs)."
echo "4. Click an option to test the interactive active-recall engine."