import os
from datetime import date
from flask import Flask, g, jsonify
from flask_login import LoginManager, current_user
from flask_cors import CORS
from database import init_db, get_db, close_db
from config import Config
from routes.auth import bp as auth_bp, User as AuthUser

login_manager = LoginManager()
login_manager.login_view = 'api_auth.login'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, supports_credentials=True, origins=[
        'https://nexus-iris.web.app',
        'https://nexus-iris.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:5000',
    ])

    login_manager.init_app(app)

    app.teardown_appcontext(close_db)

    @login_manager.user_loader
    def load_user(user_id):
        db = get_db()
        user = db.get('users', int(user_id))
        if user:
            return AuthUser(user['id'], user['username'], user['email'])
        return None

    with app.app_context():
        init_db()

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

    return app

app = create_app()

if __name__ == '__main__':
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=debug)
