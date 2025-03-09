// Language translations
const translations = {
    ru: {
        title: 'SenterosAI - Дружелюбный ИИ-ассистент',
        subtitle: 'Ваш дружелюбный ИИ-ассистент',
        chatHistory: 'История чатов',
        newChat: 'Новый чат',
        inputPlaceholder: 'Введите ваше сообщение...',
        welcomeMessage: 'Привет! Я SenterosAI, ваш дружелюбный ассистент! (●\'◡\'●) Чем я могу вам помочь сегодня?',
        settings: {
            language: 'Язык / Language',
            theme: 'Тема / Theme',
            light: 'Светлая / Light',
            dark: 'Темная / Dark',
            chatSettings: 'Настройки чата',
            autoScroll: 'Автопрокрутка к новым сообщениям',
            soundNotifications: 'Звуковые уведомления'
        }
    },
    en: {
        title: 'SenterosAI - Friendly AI Assistant',
        subtitle: 'Your friendly AI assistant',
        chatHistory: 'Chat History',
        newChat: 'New Chat',
        inputPlaceholder: 'Type your message...',
        welcomeMessage: 'Hi! I\'m SenterosAI, your friendly assistant! (●\'◡\'●) How can I help you today?',
        settings: {
            language: 'Language / Язык',
            theme: 'Theme / Тема',
            light: 'Light / Светлая',
            dark: 'Dark / Темная',
            chatSettings: 'Chat Settings',
            autoScroll: 'Auto-scroll to new messages',
            soundNotifications: 'Sound notifications'
        }
    },
    es: {
        title: 'SenterosAI - Asistente de IA Amigable',
        subtitle: 'Tu asistente de IA amigable',
        chatHistory: 'Historial de Chat',
        newChat: 'Nuevo Chat',
        inputPlaceholder: 'Escribe tu mensaje...',
        welcomeMessage: '¡Hola! Soy SenterosAI, ¡tu asistente amigable! (●\'◡\'●) ¿Cómo puedo ayudarte hoy?',
        settings: {
            language: 'Idioma / Язык',
            theme: 'Tema / Тема',
            light: 'Claro / Светлая',
            dark: 'Oscuro / Темная',
            chatSettings: 'Configuración del Chat',
            autoScroll: 'Desplazamiento automático a nuevos mensajes',
            soundNotifications: 'Notificaciones de sonido'
        }
    },
    de: {
        title: 'SenterosAI - Freundlicher KI-Assistent',
        subtitle: 'Dein freundlicher KI-Assistent',
        chatHistory: 'Chat-Verlauf',
        newChat: 'Neuer Chat',
        inputPlaceholder: 'Gib deine Nachricht ein...',
        welcomeMessage: 'Hallo! Ich bin SenterosAI, dein freundlicher Assistent! (●\'◡\'●) Wie kann ich dir heute helfen?',
        settings: {
            language: 'Sprache / Язык',
            theme: 'Thema / Тема',
            light: 'Hell / Светлая',
            dark: 'Dunkel / Темная',
            chatSettings: 'Chat-Einstellungen',
            autoScroll: 'Automatisches Scrollen zu neuen Nachrichten',
            soundNotifications: 'Ton-Benachrichtigungen'
        }
    }
};

// Function to safely update text content of an element
function safeSetTextContent(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
}

// Function to safely update placeholder of an input
function safeSetPlaceholder(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        element.placeholder = text;
    }
}

// Function to safely update innerHTML of an element
function safeSetInnerHTML(selector, html) {
    const element = document.querySelector(selector);
    if (element) {
        element.innerHTML = html;
    }
}

// Function to update page content based on selected language
function updatePageLanguage(lang) {
    const t = translations[lang];
    if (!t) return; // Guard against invalid language selection
    
    // Update document title
    document.title = t.title;
    
    // Update header content
    safeSetTextContent('.logo h1', 'SenterosAI');
    safeSetTextContent('.logo p', t.subtitle);
    
    // Update sidebar content
    safeSetTextContent('.sidebar-header h3', t.chatHistory);
    safeSetInnerHTML('#new-chat-btn', `<i class="fas fa-plus"></i> ${t.newChat}`);
    
    // Update input placeholder
    safeSetPlaceholder('#user-input', t.inputPlaceholder);
    
    // Update settings panel content
    const settingsGroups = document.querySelectorAll('.settings-group');
    if (settingsGroups.length >= 3) {
        safeSetTextContent('.settings-group:nth-child(1) h4', t.settings.language);
        safeSetTextContent('.settings-group:nth-child(2) h4', t.settings.theme);
        safeSetTextContent('.settings-group:nth-child(3) h4', t.settings.chatSettings);
    }
    
    // Update settings labels
    safeSetTextContent('label[for="theme-light"]', t.settings.light);
    safeSetTextContent('label[for="theme-dark"]', t.settings.dark);
    safeSetTextContent('label[for="auto-scroll"]', t.settings.autoScroll);
    safeSetTextContent('label[for="sound-notifications"]', t.settings.soundNotifications);
    
    // Update welcome message if it's still visible
    const firstMessage = document.querySelector('.message.bot:first-child .message-content p');
    if (firstMessage && firstMessage.textContent === translations.ru.welcomeMessage) {
        firstMessage.textContent = t.welcomeMessage;
    }
}

// Export for use in main script
window.translations = translations;
window.updatePageLanguage = updatePageLanguage;