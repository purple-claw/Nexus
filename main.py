import os
from datetime import date
from flask import Flask, g
from flask_login import LoginManager, current_user
from database import init_db, get_db, close_db
from config import Config
from routes.auth import bp as auth_bp, User as AuthUser
from navigation import build_navigation

login_manager = LoginManager()
login_manager.login_view = 'auth.login'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    login_manager.init_app(app)

    app.teardown_appcontext(close_db)

    @login_manager.user_loader
    def load_user(user_id):
        db = get_db()
        user = db.execute('SELECT id, username, email FROM users WHERE id = ?', (user_id,)).fetchone()
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
            row = db.execute('SELECT COUNT(*) as cnt FROM topics WHERE user_id = ?', (current_user.id,)).fetchone()
            topic_count = row['cnt'] if row else 0
        return dict(today=today, navigation=nav, sidebar_topic_count=topic_count)

    with app.app_context():
        init_db()

    from routes import dashboard, library, reading, topic, mcq, upload, calendar, daily, todos
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(library.bp)
    app.register_blueprint(reading.bp)
    app.register_blueprint(topic.bp)
    app.register_blueprint(mcq.bp)
    app.register_blueprint(upload.bp)
    app.register_blueprint(calendar.bp)
    app.register_blueprint(daily.bp)
    app.register_blueprint(todos.bp)

    return app

app = create_app()

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=debug)
