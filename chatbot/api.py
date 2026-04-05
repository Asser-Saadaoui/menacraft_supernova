"""
chatbot/api.py
──────────────
A tiny Flask API that wraps AIDetectorBot so the Node.js backend
(and through it, the HTML frontend) can ask it questions.

Run with:
    pip install flask
    python api.py
It will listen on http://localhost:5000
"""

from flask import Flask, request, jsonify
from main import AIDetectorBot

app = Flask(__name__)
bot = AIDetectorBot()   # one shared instance per process


@app.route('/ask', methods=['POST'])
def ask():
    data     = request.get_json(force=True)
    question = data.get('question', '')
    analysis = data.get('analysis', {})

    if not question:
        return jsonify({'error': 'question is required'}), 400

    answer = bot.ask_with_json(question, analysis)
    return jsonify({'answer': answer})


@app.route('/reset', methods=['POST'])
def reset():
    """Clear the conversation history (call between sessions if needed)."""
    bot.context = ''
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(port=5000, debug=False)
