import os
from datetime import date
from flask import Flask, g, send_from_directory, jsonify
from flask_login import LoginManager, current_user
from flask_cors import CORS
from database import init_db, get_db, close_db
from config import Config
from routes.auth import bp as auth_bp, User as AuthUser
from navigation import build_navigation
from markdown_filter import render_reading_markdown

login_manager = LoginManager()
login_manager.login_view = 'api_auth.login'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, supports_credentials=True)

    login_manager.init_app(app)

    app.teardown_appcontext(close_db)

    @login_manager.user_loader
    def load_user(user_id):
        db = get_db()
        user = db.get('users', int(user_id))
        if user:
            return AuthUser(user['id'], user['username'], user['email'])
        return None

    @app.context_processor
    def inject_globals():
        today = date.today().isoformat()
        nav = build_navigation()
        topic_count = 0
        if current_user.is_authenticated:
            db = get_db()
            topic_count = db.count('topics', user_id=current_user.id)
        return dict(today=today, navigation=nav, sidebar_topic_count=topic_count)

    app.jinja_env.filters['render_reading'] = render_reading_markdown

    with app.app_context():
        init_db()

    # Register JSON API routes (prefix: /api)
    from api import auth as api_auth, dashboard as api_dashboard, library as api_library
    from api import topics as api_topics, reading as api_reading, mcqs as api_mcqs
    from api import upload as api_upload, calendar as api_calendar, todos as api_todos
    from api import daily as api_daily

    api_prefix = '/api'
    app.register_blueprint(api_auth.bp, url_prefix=api_prefix)
    app.register_blueprint(api_dashboard.bp, url_prefix=api_prefix)
    app.register_blueprint(api_library.bp, url_prefix=api_prefix)
    app.register_blueprint(api_topics.bp, url_prefix=api_prefix)
    app.register_blueprint(api_reading.bp, url_prefix=api_prefix)
    app.register_blueprint(api_mcqs.bp, url_prefix=api_prefix)
    app.register_blueprint(api_upload.bp, url_prefix=api_prefix)
    app.register_blueprint(api_calendar.bp, url_prefix=api_prefix)
    app.register_blueprint(api_todos.bp, url_prefix=api_prefix)
    app.register_blueprint(api_daily.bp, url_prefix=api_prefix)

    # Serve React SPA
    frontend_dir = os.path.join(app.root_path, 'frontend', 'dist')

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    return app

app = create_app()

# Serve frontend static files
frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')

@app.route('/')
def serve_index():
    index_path = os.path.join(frontend_dir, 'index.html')
    if os.path.isfile(index_path):
        return send_from_directory(frontend_dir, 'index.html')
    return "Frontend not built. Run: cd frontend && npm install && npm run build", 503

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(frontend_dir, 'assets'), filename)

@app.route('/vite.svg')
def serve_favicon():
    return send_from_directory(frontend_dir, 'vite.svg')

@app.route('/<path:path>')
def serve_spa_routes(path):
    if path.startswith('api/'):
        return jsonify({"error": "Not found"}), 404
    # Serve file if it exists, otherwise serve index.html for SPA routing
    file_path = os.path.join(frontend_dir, path)
    if os.path.isfile(file_path):
        return send_from_directory(frontend_dir, path)
    index_path = os.path.join(frontend_dir, 'index.html')
    if os.path.isfile(index_path):
        return send_from_directory(frontend_dir, 'index.html')
    return "Frontend not built. Run: cd frontend && npm install && npm run build", 503

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=debug)
