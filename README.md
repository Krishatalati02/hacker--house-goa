# Hacker House Goa 2026 — Builder Card (Python / Flask)

## Flow

1. **Home** `/` — landing page  
2. **Create** `/card` — fill form → **Create Card**  
3. **Result** `/result` — full-screen card + Download + Share on X  

## Unique ID + Barcode (Python)

- `POST /api/builder-id` issues a unique ID like `#HH-GOA-A7K3-9281`
- Generates a real **Code128** barcode (via `python-barcode`) as SVG data-URL
- Shown on the live preview and final card
- **↻ New Builder ID** requests a fresh ID + barcode from the server

## Run

```bash
cd hacker-house-goa
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000

## Requirements

```
flask>=3.0.0
gunicorn>=21.0.0
python-barcode>=0.15.1
```

## Structure

```
hacker-house-goa/
├── app.py                 # Flask + unique ID + barcode API
├── requirements.txt
├── templates/
│   ├── index.html
│   ├── card.html
│   └── result.html
└── static/
    ├── css/
    └── js/
```

#FrameInGoa · 28–31 Oct 2026 · Assagao, Goa
