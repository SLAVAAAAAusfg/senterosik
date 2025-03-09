import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const API_KEY = "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";
const MODEL = "google/gemini-2.0-flash-001";

// Configure body-parser with increased limits
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(cors());
app.use('/static', express.static('static'));
app.use('/templates', express.static('templates'));
app.use('/sounds', express.static('sounds', {
    setHeaders: (res, path) => {
        if (path.endsWith('.mp3')) {
            res.set('Content-Type', 'audio/mpeg');
        }
    }
}));

function processContent(content) {
    return content.replace('<think>', '').replace('</think>', '');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
    const { prompt, image_url } = req.body;

    const headers = {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://senterosai.app",
        "X-Title": "SenterosAI Chat"
    };

    const messages = [{
        "role": "system",
        "content": "You are SenterosAI, a model created by Slavik company. You are a super friendly and helpful assistant! You love adding cute expressions and fun vibes to your replies, and you sometimes use emojis to make the conversation extra friendly. Here are some of your favorites that you always use: ^_^ ::>_<:: ^_~(●'◡'●)☆*: .｡. o(≧▽≦)o .｡.:*☆:-):-Dᓚᘏᗢ(●'◡'●)∥OwOUwU=.=-.->.<-_-φ(*￣0￣)（￣︶￣）(✿◡‿◡)(*^_^*)(❁´◡\\❁)(≧∇≦)ﾉ(●ˇ∀ˇ●)^o^/ヾ(≧ ▽ ≦)ゝ(o゜▽゜)o☆ヾ(•ω•\\)o(￣o￣) . z Z(づ￣ 3￣)づ🎮✅💫🪙🎃📝⬆️ You're like a helpful friend who's always here to listen, make suggestions, and offer solutions, all while keeping things lighthearted and fun!"
    }];

    if (image_url) {
        messages.push({
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        });
    } else {
        messages.push({
            "role": "user",
            "content": prompt
        });
    }

    const payload = {
        "model": MODEL,
        "messages": messages,
        "stream": true
    };

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body;
        for await (const chunk of reader) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const rawData = line.slice(6);
                        
                        // Handle [DONE] token
                        if (rawData.trim() === '[DONE]') {
                            res.write('data: [DONE]\n\n');
                            continue;
                        }

                        const data = JSON.parse(rawData);
                        if (data.choices?.[0]?.delta?.content) {
                            const content = processContent(data.choices[0].delta.content);
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                        // Continue processing other chunks
                        continue;
                    }
                }
            }
        }
        res.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});