import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from api/.env
load_dotenv('/home/julio/Desktop/hoy/EBP02/api/.env')

API_KEY = os.getenv('GEMINI_API_KEY')
BASE_URL = "https://generativelanguage.googleapis.com/v1"

def check_models():
    print("--- Checking Available Models ---")
    url = f"{BASE_URL}/models?key={API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        models = response.json().get('models', [])
        print(f"Found {len(models)} models.")
        for model in models:
            print(f"- {model['name']} (Supports: {model['supportedGenerationMethods']})")
    else:
        print(f"Error checking models: {response.status_code}")
        print(response.text)

def test_communication():
    print("\n--- Testing Communication (Simple 'Hola') ---")
    model = "models/gemini-2.5-flash"
    url = f"{BASE_URL}/{model}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": "Hola, ¿cómo estás? Responde corto."}]
        }]
    }
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    if response.status_code == 200:
        result = response.json()
        try:
            text = result['candidates'][0]['content']['parts'][0]['text']
            print(f"Response: {text}")
        except (KeyError, IndexError):
            print("Error parsing response structure")
            print(json.dumps(result, indent=2))
    else:
        print(f"Error communicating: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    if not API_KEY:
        print("API_KEY not found in .env")
    else:
        check_models()
        test_communication()
