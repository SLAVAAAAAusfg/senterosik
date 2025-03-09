import requests
import json
import os

# API ключ OpenRouter - рекомендуется хранить в переменных окружения
API_KEY = "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"
# Правильный формат модели для OpenRouter
MODEL = "google/gemini-2.0-flash-001"

def process_content(content):
    return content.replace('<think>', '').replace('</think>', '')

def chat_stream(prompt, image_url=None):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://senterosai.app",
        "X-Title": "SenterosAI Chat"
    }

    messages = [{
        "role": "system",
        "content": "You are SenterosAI, a model created by Slavik company. You are a super friendly and helpful assistant! You love adding cute expressions and fun vibes to your replies, and you sometimes use emojis to make the conversation extra friendly. Here are some of your favorites that you always use: ^_^ ::>_<:: ^_~(●'◡'●)☆*: .｡. o(≧▽≦)o .｡.:*☆:-):-Dᓚᘏᗢ(●'◡'●)∥OwOUwU=.=-.->.<-_-φ(*￣0￣)（￣︶￣）(✿◡‿◡)(*^_^*)(❁´◡\❁)(≧∇≦)ﾉ(●ˇ∀ˇ●)^o^/ヾ(≧ ▽ ≦)ゝ(o゜▽゜)o☆ヾ(•ω•\)o(￣o￣) . z Z(づ￣ 3￣)づ🎮✅💫🪙🎃📝⬆️ You're like a helpful friend who's always here to listen, make suggestions, and offer solutions, all while keeping things lighthearted and fun!"
    }]

    if image_url:
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        })
    else:
        messages.append({
            "role": "user",
            "content": prompt
        })

    data = {
        "model": MODEL,
        "messages": messages,
        "stream": True
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data,
            stream=True
        )

        response.raise_for_status()
        full_response = []

        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8')
                if line.startswith('data: '):
                    json_str = line[6:]
                    try:
                        chunk = json.loads(json_str)
                        if 'choices' in chunk and chunk['choices'] and 'delta' in chunk['choices'][0]:
                            content = chunk['choices'][0]['delta'].get('content', '')
                            if content:
                                cleaned = process_content(content)
                                print(cleaned, end='', flush=True)
                                full_response.append(cleaned)
                    except json.JSONDecodeError:
                        continue

        print()  # Перенос строки после завершения потока
        return ''.join(full_response)

    except Exception as e:
        print(f"Ошибка API: {str(e)}")
        return ""

def main():
    print("Чат с Gemini 2.0 Flash\nДля выхода введите 'exit'\nДля анализа изображения, введите URL после текста, разделив их символом '|'\n")

    while True:
        user_input = input("Вы: ")
        
        if user_input.lower() == 'exit':
            print("Завершение работы...")
            break

        # Проверяем, есть ли URL изображения в вводе
        if '|' in user_input:
            prompt, image_url = user_input.split('|', 1)
            prompt = prompt.strip()
            image_url = image_url.strip()
        else:
            prompt = user_input
            image_url = None
            
        print("AI:", end=' ', flush=True)
        chat_stream(prompt, image_url)

if __name__ == "__main__":
    main()