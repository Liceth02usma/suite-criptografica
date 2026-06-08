import os
from flask import Flask, render_template

from backend.routes.digest import bp_digest
from backend.routes.firma_rsa import bp_firma_rsa
from backend.routes.simetrico import bp_simetrico
from backend.routes.asimetrico import bp_asimetrico
from backend.routes.ecc import bp_ecc


def create_app():
    app = Flask(
        __name__,
        template_folder=os.path.join(os.path.dirname(__file__), "..", "frontend", "templates"),
        static_folder=os.path.join(os.path.dirname(__file__), "..", "frontend", "static"),
    )

    env = os.getenv("FLASK_ENV", "development")
    if env == "production":
        app.config.from_object("backend.config.ProdConfig")
    else:
        app.config.from_object("backend.config.DevConfig")

    for bp in [bp_digest, bp_firma_rsa, bp_simetrico, bp_asimetrico, bp_ecc]:
        app.register_blueprint(bp, url_prefix="/api")

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline'; "
            "style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com 'unsafe-inline'; "
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; "
            "img-src 'self' data:;"
        )
        return response

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
