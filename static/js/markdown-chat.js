// Markdown parser library (using marked.js)
const markdownParser = {
    parse: (text) => {
        if (!window.marked) {
            console.error('Marked library not loaded');
            return text;
        }
        
        // Configure marked options for code highlighting
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
        
        const parsed = marked.parse(text);
        
        // Initialize syntax highlighting for any new code blocks
        setTimeout(() => {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }, 0);
        
        return parsed;
    }
};

// Chat history manager
const chatHistoryManager = {
    storageKey: 'senterosai_chat_history',
    chatsListKey: 'senterosai_chats_list',
    maxMessages: 100, // Maximum number of messages to store per chat
    activeChat: null, // Current active chat ID

    // Initialize chat history manager
    init: function() {
        // Load chats list or create default if none exists
        const chatsList = this.loadChatsList();
        if (chatsList.length === 0) {
            // Create a default chat if no chats exist
            this.createNewChat('Новый чат');
        } else {
            // Set the most recent chat as active
            this.activeChat = chatsList[0].id;
        }
        return this.activeChat;
    },

    // Create a new chat and set it as active
    createNewChat: function(title = 'Новый чат') {
        const chatId = 'chat_' + Date.now();
        const newChat = {
            id: chatId,
            title: title,
            created: new Date().toISOString(),
            lastMessage: ''
        };

        // Add to chats list
        let chatsList = this.loadChatsList();
        chatsList.unshift(newChat); // Add to beginning of array
        localStorage.setItem(this.chatsListKey, JSON.stringify(chatsList));

        // Create empty message history for this chat
        localStorage.setItem(this.getChatStorageKey(chatId), JSON.stringify([]));

        // Set as active chat
        this.activeChat = chatId;
        return chatId;
    },

    // Get storage key for a specific chat
    getChatStorageKey: function(chatId) {
        return `${this.storageKey}_${chatId}`;
    },

    // Save message to current active chat
    saveMessage: function(message, isUser) {
        if (!this.activeChat) {
            this.init();
        }

        // Get chat history for active chat
        let history = this.loadChatHistory(this.activeChat);
        const messageObj = {
            content: message,
            isUser: isUser,
            timestamp: new Date().toISOString()
        };
        history.push(messageObj);

        // Keep only the last maxMessages
        if (history.length > this.maxMessages) {
            history = history.slice(-this.maxMessages);
        }

        // Save updated history
        localStorage.setItem(this.getChatStorageKey(this.activeChat), JSON.stringify(history));

        // Update chat list with preview of last message
        this.updateChatPreview(this.activeChat, message);

        return messageObj;
    },

    // Update chat preview in the chat list
    updateChatPreview: function(chatId, lastMessage) {
        const chatsList = this.loadChatsList();
        const chatIndex = chatsList.findIndex(chat => chat.id === chatId);
        
        if (chatIndex !== -1) {
            // Update last message preview
            chatsList[chatIndex].lastMessage = lastMessage;
            
            // Move this chat to the top of the list
            const chat = chatsList.splice(chatIndex, 1)[0];
            chatsList.unshift(chat);
            
            localStorage.setItem(this.chatsListKey, JSON.stringify(chatsList));
        }
    },

    // Load chat history for a specific chat
    loadChatHistory: function(chatId) {
        const history = localStorage.getItem(this.getChatStorageKey(chatId));
        return history ? JSON.parse(history) : [];
    },

    // Load current active chat history
    loadHistory: function() {
        if (!this.activeChat) {
            this.init();
        }
        return this.loadChatHistory(this.activeChat);
    },

    // Load list of all chats
    loadChatsList: function() {
        const chatsList = localStorage.getItem(this.chatsListKey);
        return chatsList ? JSON.parse(chatsList) : [];
    },

    // Set active chat
    setActiveChat: function(chatId) {
        this.activeChat = chatId;
        return this.loadChatHistory(chatId);
    },

    // Delete a chat
    deleteChat: function(chatId) {
        // Remove from chats list
        let chatsList = this.loadChatsList();
        const chatIndex = chatsList.findIndex(chat => chat.id === chatId);
        
        if (chatIndex !== -1) {
            chatsList.splice(chatIndex, 1);
            localStorage.setItem(this.chatsListKey, JSON.stringify(chatsList));
            
            // Remove chat history
            localStorage.removeItem(this.getChatStorageKey(chatId));
            
            // If we deleted the active chat, set a new active chat
            if (this.activeChat === chatId) {
                this.activeChat = chatsList.length > 0 ? chatsList[0].id : this.createNewChat();
            }
            
            return this.activeChat;
        }
        return null;
    },

    // Clear all chat history
    clearHistory: function() {
        // Get all chats
        const chatsList = this.loadChatsList();
        
        // Remove each chat's history
        chatsList.forEach(chat => {
            localStorage.removeItem(this.getChatStorageKey(chat.id));
        });
        
        // Clear chats list
        localStorage.removeItem(this.chatsListKey);
        
        // Create a new default chat
        this.createNewChat();
    }
};

// Export for use in main script
window.markdownParser = markdownParser;
window.chatHistoryManager = chatHistoryManager;