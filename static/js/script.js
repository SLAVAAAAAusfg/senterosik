document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const elements = {
        chat: {
            messages: document.getElementById('chat-messages'),
            input: document.getElementById('user-input'),
            sendButton: document.getElementById('send-btn'),
            sidebar: document.getElementById('chat-sidebar'),
            list: document.getElementById('chat-list'),
            newChatBtn: document.getElementById('new-chat-btn')
        },
        settings: {
            panel: document.getElementById('settings-panel'),
            button: document.getElementById('settings-btn'),
            toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
            language: {
                ru: document.getElementById('lang-ru'),
                en: document.getElementById('lang-en')
            },
            theme: {
                light: document.getElementById('theme-light'),
                dark: document.getElementById('theme-dark')
            },
            autoScroll: document.getElementById('auto-scroll'),
            soundNotifications: document.getElementById('sound-notifications')
        },
        image: {
            uploadBtn: document.getElementById('image-upload-btn'),
            uploadInput: document.getElementById('image-upload'),
            previewContainer: document.getElementById('image-preview-container'),
            preview: document.getElementById('image-preview'),
            removeBtn: document.getElementById('remove-image-btn')
        }
    };

    // State management
    const state = {
        currentImageUrl: null,
        notificationSound: null
    };

    // Initialize notification sound
    function initNotificationSound() {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();

        // Fetch and decode audio file - fixed path to include static prefix
        fetch('/static/sounds/message.mp3')
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                state.notificationSound = {
                    play: () => {
                        const source = audioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContext.destination);
                        source.start(0);
                        return Promise.resolve();
                    }
                };
                console.log('Sound notification initialized successfully');
            })
            .catch(err => {
                console.error('Failed to load notification sound:', err);
                elements.settings.soundNotifications.checked = false;
                localStorage.setItem('sound_notifications', 'false');
            });

        // Resume audio context on user interaction
        document.addEventListener('click', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });
    }

    // Initialize chat and load preferences
    function init() {
        const activeChat = chatHistoryManager.init();
        loadChatHistory(activeChat);
        updateChatList();
        loadUserPreferences();
        setupEventListeners();
    }

    // Event listeners setup
    function setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Chat functionality
        elements.chat.sendButton.addEventListener('click', function(e) {
            console.log('Send button clicked');
            e.preventDefault();
            sendMessage();
        });
        elements.chat.input.addEventListener('keypress', handleEnterPress);
        elements.chat.newChatBtn.addEventListener('click', function(e) {
            console.log('New chat button clicked');
            e.preventDefault();
            createNewChat();
        });

        // Settings functionality
        // Remove previous event listener if exists
        if (elements.settings.button) {
            const oldButton = elements.settings.button;
            const newButton = oldButton.cloneNode(true);
            oldButton.parentNode.replaceChild(newButton, oldButton);
            elements.settings.button = newButton;
            
            // Add new event listener
            elements.settings.button.addEventListener('click', function(e) {
                console.log('Settings button clicked with new handler');
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                toggleSettings();
            });
        } else {
            console.error('Settings button not found!');
        }
        
        elements.settings.toggleSidebarBtn.addEventListener('click', function(e) {
            console.log('Toggle sidebar button clicked');
            e.preventDefault();
            toggleSidebar();
        });
        document.getElementById('close-settings-btn').addEventListener('click', function(e) {
            console.log('Close settings button clicked');
            e.preventDefault();
            toggleSettings();
        });
        setupSettingsListeners();

        // Image handling
        elements.image.uploadBtn.addEventListener('click', function(e) {
            console.log('Image upload button clicked');
            e.preventDefault();
            elements.image.uploadInput.click();
        });
        elements.image.uploadInput.addEventListener('change', handleImageUpload);
        elements.image.removeBtn.addEventListener('click', function(e) {
            console.log('Remove image button clicked');
            e.preventDefault();
            removeImage();
        });

        // Click outside settings panel handler
        document.addEventListener('click', handleClickOutside);
    }

    // Settings event listeners
    function setupSettingsListeners() {
        // Language settings
        elements.settings.language.ru.addEventListener('change', () => setLanguage('ru'));
        elements.settings.language.en.addEventListener('change', () => setLanguage('en'));
        
        // Add event listeners for new language options
        const langEs = document.getElementById('lang-es');
        const langDe = document.getElementById('lang-de');
        if (langEs) langEs.addEventListener('change', () => setLanguage('es'));
        if (langDe) langDe.addEventListener('change', () => setLanguage('de'));

        // Theme settings
        elements.settings.theme.light.addEventListener('change', () => setTheme('light'));
        elements.settings.theme.dark.addEventListener('change', () => setTheme('dark'));

        // Other settings
        elements.settings.autoScroll.addEventListener('change', 
            () => localStorage.setItem('auto_scroll', elements.settings.autoScroll.checked));
        elements.settings.soundNotifications.addEventListener('change', 
            () => localStorage.setItem('sound_notifications', elements.settings.soundNotifications.checked));
    }

    // Chat functionality
    async function sendMessage() {
        const message = elements.chat.input.value.trim();
        if (!message && !state.currentImageUrl) return;

        try {
            if (state.currentImageUrl) {
                addMessageWithImage(message, state.currentImageUrl);
            } else {
                addMessage(message, true);
            }
            
            elements.chat.input.value = '';
            const typingIndicator = addTypingIndicator();

            if (elements.settings.soundNotifications.checked && state.notificationSound) {
                try {
                    await state.notificationSound.play();
                } catch (error) {
                    console.error('Error playing notification sound:', error);
                    initNotificationSound();
                }
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: message,
                    image_url: state.currentImageUrl
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await handleStreamResponse(response, typingIndicator);

        } catch (error) {
            console.error('Error:', error);
            if (typingIndicator) typingIndicator.remove();
            addMessage('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.', false);
        }

        if (state.currentImageUrl) removeImage();
    }

    // Stream response handler
    async function handleStreamResponse(response, typingIndicator) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponse = '';
        let messageDiv = null;
        let hasError = false;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;
                    
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            if (jsonStr.trim() === '[DONE]') continue;
                            
                            const data = JSON.parse(jsonStr);
                            
                            if (data.error) {
                                hasError = true;
                                if (typingIndicator) {
                                    typingIndicator.remove();
                                    typingIndicator = null;
                                }
                                addMessage(data.error, false);
                                return;
                            }
                            
                            if (data.content) {
                                botResponse += data.content;
                                
                                if (typingIndicator) {
                                    typingIndicator.remove();
                                    typingIndicator = null;
                                }

                                messageDiv = updateOrCreateMessageDiv(messageDiv, botResponse);
                                scrollToBottom();
                            }
                        } catch (parseError) {
                            console.warn('Error parsing chunk:', parseError);
                            continue;
                        }
                    }
                }
            }

            if (botResponse && !hasError) {
                chatHistoryManager.saveMessage(botResponse, false);
                updateChatList();
            }

        } catch (error) {
            console.error('Stream processing error:', error);
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            if (!messageDiv || hasError) {
                addMessage('Извините, произошла ошибка при обработке ответа. Пожалуйста, попробуйте еще раз.', false);
            }
        }
    }

    // Message handling
    function updateOrCreateMessageDiv(messageDiv, content) {
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.className = 'message bot';
            
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageDiv.appendChild(messageContent);
            elements.chat.messages.appendChild(messageDiv);
        }

        const messageContent = messageDiv.querySelector('.message-content');
        messageContent.innerHTML = markdownParser.parse(content);
        return messageDiv;
    }

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = isUser ? `<p>${content}</p>` : markdownParser.parse(content);
        
        messageDiv.appendChild(messageContent);
        elements.chat.messages.appendChild(messageDiv);
        scrollToBottom();

        if (!isUser || content.trim() !== '') {
            chatHistoryManager.saveMessage(content, isUser);
        }
    }
    
    function addMessageWithImage(content, imageUrl) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Add text content if provided
        if (content && content.trim() !== '') {
            messageContent.innerHTML = `<p>${content}</p>`;
        }
        
        // Add image
        const imageElement = document.createElement('div');
        imageElement.className = 'message-image';
        imageElement.style.backgroundImage = `url(${imageUrl})`;
        messageContent.appendChild(imageElement);
        
        messageDiv.appendChild(messageContent);
        elements.chat.messages.appendChild(messageDiv);
        scrollToBottom();
        
        // Save message with image indicator
        const messageText = content ? content + ' [Image]' : '[Image]';
        chatHistoryManager.saveMessage(messageText, true);
    }

    function addTypingIndicator() {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.className = 'message bot';
        indicatorDiv.innerHTML = `
            <div class="message-content typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        elements.chat.messages.appendChild(indicatorDiv);
        scrollToBottom();
        return indicatorDiv;
    }

    // Chat history management
    function loadChatHistory(chatId) {
        elements.chat.messages.innerHTML = '';
        const history = chatHistoryManager.loadChatHistory(chatId);
        
        if (history.length === 0) {
            const lang = localStorage.getItem('user_language') || 'ru';
            addMessage(translations[lang].welcomeMessage, false);
        } else {
            history.forEach(msg => addMessage(msg.content, msg.isUser));
        }
    }

    function updateChatList() {
        const chats = chatHistoryManager.loadChatsList();
        const activeChat = chatHistoryManager.activeChat;
        elements.chat.list.innerHTML = '';

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === activeChat ? 'active' : ''}`;
            chatItem.innerHTML = `
                <i class="fas fa-comments chat-item-icon"></i>
                <div class="chat-item-content">
                    <div class="chat-item-title">${chat.title}</div>
                    <div class="chat-item-preview">${chat.lastMessage || 'Нет сообщений'}</div>
                </div>
            `;
            chatItem.addEventListener('click', () => switchChat(chat.id, chatItem));
            elements.chat.list.appendChild(chatItem);
        });
    }

    function switchChat(chatId, chatItem) {
        chatHistoryManager.setActiveChat(chatId);
        loadChatHistory(chatId);
        document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
        chatItem.classList.add('active');
    }

    function createNewChat() {
        const newChatId = chatHistoryManager.createNewChat();
        loadChatHistory(newChatId);
        updateChatList();
    }

    // Settings functionality
    function loadUserPreferences() {
        const sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (sidebarCollapsed) elements.chat.sidebar.classList.add('collapsed');

        elements.settings.soundNotifications.checked = localStorage.getItem('sound_notifications') !== 'false';
        elements.settings.autoScroll.checked = localStorage.getItem('auto_scroll') !== 'false';

        const userLanguage = localStorage.getItem('user_language') || 'ru';
        elements.settings.language[userLanguage].checked = true;
        updatePageLanguage(userLanguage);

        const userTheme = localStorage.getItem('user_theme') || 'light';
        elements.settings.theme[userTheme].checked = true;
        setTheme(userTheme);
    }

    function setLanguage(lang) {
        localStorage.setItem('user_language', lang);
        updatePageLanguage(lang);
    }

    function setTheme(theme) {
        localStorage.setItem('user_theme', theme);
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
    }

    // UI handlers
    function toggleSidebar() {
        console.log('Toggling sidebar...');
        if (elements.chat.sidebar) {
            elements.chat.sidebar.classList.toggle('collapsed');
            console.log('Sidebar collapsed:', elements.chat.sidebar.classList.contains('collapsed'));
            localStorage.setItem('sidebar_collapsed', elements.chat.sidebar.classList.contains('collapsed'));
        } else {
            console.error('Sidebar element not found!');
        }
    }

    function toggleSettings() {
        const overlay = document.getElementById('overlay');
        const settingsPanel = document.getElementById('settings-panel');
        
        if (settingsPanel.classList.contains('active')) {
            settingsPanel.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            settingsPanel.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function handleClickOutside(e) {
        const settingsPanel = document.getElementById('settings-panel');
        const overlay = document.getElementById('overlay');
        
        if (settingsPanel.classList.contains('active') &&
            !settingsPanel.contains(e.target) && 
            e.target !== document.getElementById('settings-btn')) {
            settingsPanel.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function handleEnterPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // Image handling
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                state.currentImageUrl = e.target.result;
                elements.image.preview.style.backgroundImage = `url(${state.currentImageUrl})`;
                elements.image.previewContainer.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        }
    }

    function removeImage() {
        state.currentImageUrl = null;
        elements.image.previewContainer.style.display = 'none';
        elements.image.preview.style.backgroundImage = '';
    }

    function scrollToBottom() {
        if (elements.settings.autoScroll.checked) {
            elements.chat.messages.scrollTop = elements.chat.messages.scrollHeight;
        }
    }

    // Initialize the application
    init();
    initNotificationSound();
    
    // Add console log to verify initialization
    console.log('SenterosAI initialized successfully');
});