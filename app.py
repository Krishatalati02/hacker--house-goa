from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import uuid
import random
import string
import io
import base64
from datetime import datetime

app = Flask(__name__)

# In-memory store of issued IDs (fine for demo; use DB in production)
_issued_ids = set()


def generate_unique_builder_id():
    """Generate a unique Builder ID like #HH-GOA-A7K3-9281"""
    while True:
        letters = "".join(random.choices(string.ascii_uppercase, k=4))
        numbers = "".join(random.choices(string.digits, k=4))
        builder_id = f"#HH-GOA-{letters}-{numbers}"
        if builder_id not in _issued_ids:
            _issued_ids.add(builder_id)
            return builder_id


def generate_barcode_svg(code_text: str) -> str:
    """
    Generate a Code128 barcode as SVG (base64 data URL).
    Falls back to a simple SVG barcode pattern if python-barcode is missing.
    """
    # Strip # and use clean text for barcode payload
    payload = code_text.replace("#", "").replace(" ", "")

    try:
        from barcode import Code128
        from barcode.writer import SVGWriter

        buffer = io.BytesIO()
        writer = SVGWriter()
        # Quiet zone / module size tuned for card
        options = {
            "module_width": 0.25,
            "module_height": 10.0,
            "quiet_zone": 1.5,
            "font_size": 0,
            "text_distance": 1,
            "write_text": False,
        }
        Code128(payload, writer=writer).write(buffer, options)
        svg_bytes = buffer.getvalue()
        b64 = base64.b64encode(svg_bytes).decode("ascii")
        return f"data:image/svg+xml;base64,{b64}"
    except Exception:
        # Fallback: deterministic fake bars from hash of the id
        bars = []
        seed = sum(ord(c) for c in payload)
        x = 4
        for i in range(40):
            w = 1 + ((seed + i * 7) % 3)
            if i % 2 == 0:
                bars.append(f'<rect x="{x}" y="2" width="{w}" height="22" fill="#111"/>')
            x += w + 1
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{x + 4}" height="26">'
            f'{"".join(bars)}</svg>'
        )
        b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
        return f"data:image/svg+xml;base64,{b64}"


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/card")
def card():
    return render_template("card.html")


@app.route("/result")
def result():
    return render_template("result.html")


@app.route("/api/builder-id", methods=["GET", "POST"])
def api_builder_id():
    """Issue a unique Builder ID + matching barcode."""
    builder_id = generate_unique_builder_id()
    barcode_data_url = generate_barcode_svg(builder_id)
    return jsonify(
        {
            "id": builder_id,
            "barcode": barcode_data_url,
            "issued_at": datetime.utcnow().isoformat() + "Z",
        }
    )


@app.route("/static/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
