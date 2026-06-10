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
