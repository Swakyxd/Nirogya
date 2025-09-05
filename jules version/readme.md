# 🏥 Medical Assistant - Northeast India

AI-powered assistant for waterborne diseases in Northeast India. Supports English, Hindi, Assamese, and Bengali.

## 🚀 Quick Setup

### Step 1: Install Python
Download Python 3.8+ from [python.org](https://python.org)

### Step 2: Get API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free)
3. Copy your API key

### Step 3: Download & Install
```bash
# Download the project files
# Extract to a folder

# Open terminal in project folder
pip install -r requirements.txt
```

### Step 4: Setup API Key
Create `.env` file in project folder:
```
GROQ_API_KEY=paste_your_api_key_here
```

### Step 5: Fix File Path
Open `chatbot.py` and find line ~180:
```python
# Change this line:
self.vector_store = self.create_vector_store("D:\\Visual Code\\Python Program\\SIH\\jules version\\disease.json")

# To this:
self.vector_store = self.create_vector_store("disease.json")
```

### Step 6: Run
```bash
python chatbot.py
```

## 📁 Files Needed
- `chatbot.py` (main program)
- `disease.json` (medical data)  
- `requirements.txt` (dependencies)
- `.env` (your API key)

## 🌐 Add to Website

### Simple Web Version
Create `app.py`:
```python
from flask import Flask, render_template, request, jsonify
from chatbot import MedicalAssistant

app = Flask(__name__)
assistant = MedicalAssistant()
assistant.initialize()

@app.route('/')
def home():
    return '<h1>Medical Assistant API</h1>'

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    
    language = assistant.detect_language(user_message)
    assistant.rag_chain = assistant.create_rag_chain(language)
    response = assistant.rag_chain.invoke(user_message)
    
    return jsonify({'response': response})

app.run(debug=True)
```

Then install Flask:
```bash
pip install flask
python app.py
```

## ⚠️ Important
- **Educational use only** - Always see a real doctor
- **Free API** has limits
- Keep your API key secret

## 🆘 Problems?
1. Check Python version: `python --version`
2. Check API key in `.env` file
3. Make sure all files are in same folder
