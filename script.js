// Configurações do chat
const CHAT_CONFIG = {
    maxMessages: 100,
    soundEnabled: true,
    autoScroll: true,
    userName: null
};

// Estado do chat
let chatState = {
    messages: [],
    usersOnline: 1,
    isConnected: false,
    userName: localStorage.getItem('frutiChatUserName') || ''
};

// Elementos do DOM
const elements = {
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    userName: document.getElementById('userName'),
    onlineCount: document.getElementById('onlineCount'),
    charCount: document.getElementById('charCount'),
    connectionStatus: document.getElementById('connectionStatus'),
    statusText: document.getElementById('statusText'),
    soundToggle: document.getElementById('soundToggle'),
    themeToggle: document.getElementById('themeToggle'),
    notificationSound: document.getElementById('notificationSound')
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initChat();
    setupEventListeners();
    loadUserPreferences();
    
    // Simular conexão com servidor
    setTimeout(() => {
        updateConnectionStatus(true);
        simulateUserJoin();
    }, 1500);
});

// Inicializar chat
function initChat() {
    // Carregar mensagens salvas localmente
    const savedMessages = localStorage.getItem('frutiChatMessages');
    if (savedMessages) {
        try {
            chatState.messages = JSON.parse(savedMessages);
            renderMessages();
        } catch (e) {
            console.error('Erro ao carregar mensagens:', e);
        }
    }
    
    // Configurar nome de usuário se existir
    if (chatState.userName) {
        elements.userName.value = chatState.userName;
    }
    
    // Atualizar contador de caracteres
    elements.messageInput.addEventListener('input', updateCharCount);
    updateCharCount();
}

// Configurar listeners de eventos
function setupEventListeners() {
    // Enviar mensagem ao clicar no botão
    elements.sendBtn.addEventListener('click', sendMessage);
    
    // Enviar mensagem com Enter (Shift+Enter para nova linha)
    elements.messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Salvar nome de usuário quando alterado
    elements.userName.addEventListener('change', function() {
        chatState.userName = elements.userName.value.trim();
        localStorage.setItem('frutiChatUserName', chatState.userName);
    });
    
    // Toggle de som
    elements.soundToggle.addEventListener('change', function() {
        CHAT_CONFIG.soundEnabled = elements.soundToggle.checked;
        localStorage.setItem('frutiChatSound', CHAT_CONFIG.soundEnabled);
    });
    
    // Toggle de tema escuro
    elements.themeToggle.addEventListener('change', function() {
        if (elements.themeToggle.checked) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        localStorage.setItem('frutiChatDarkTheme', elements.themeToggle.checked);
    });
}

// Carregar preferências do usuário
function loadUserPreferences() {
    // Configuração de som
    const savedSound = localStorage.getItem('frutiChatSound');
    if (savedSound !== null) {
        CHAT_CONFIG.soundEnabled = savedSound === 'true';
        elements.soundToggle.checked = CHAT_CONFIG.soundEnabled;
    }
    
    // Configuração de tema
    const savedTheme = localStorage.getItem('frutiChatDarkTheme');
    if (savedTheme !== null) {
        const isDarkTheme = savedTheme === 'true';
        elements.themeToggle.checked = isDarkTheme;
        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
        }
    }
}

// Enviar mensagem
function sendMessage() {
    const messageText = elements.messageInput.value.trim();
    
    if (!messageText) {
        return;
    }
    
    // Verificar se tem nome de usuário
    let userName = chatState.userName || 'Anônimo';
    if (!userName.trim()) {
        userName = 'Anônimo';
    }
    
    // Criar objeto de mensagem
    const message = {
        id: Date.now(),
        sender: userName,
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        type: 'sent'
    };
    
    // Adicionar mensagem ao estado
    chatState.messages.push(message);
    
    // Limitar número de mensagens
    if (chatState.messages.length > CHAT_CONFIG.maxMessages) {
        chatState.messages = chatState.messages.slice(-CHAT_CONFIG.maxMessages);
    }
    
    // Salvar mensagens localmente
    saveMessages();
    
    // Renderizar mensagem
    renderMessage(message);
    
    // Limpar campo de entrada
    elements.messageInput.value = '';
    updateCharCount();
    
    // Simular resposta automática (apenas para demonstração)
    setTimeout(() => {
        simulateResponse(messageText);
    }, 1000 + Math.random() * 2000);
    
    // Scroll automático
    if (CHAT_CONFIG.autoScroll) {
        scrollToBottom();
    }
}

// Renderizar todas as mensagens
function renderMessages() {
    // Limpar container
    elements.chatMessages.innerHTML = '';
    
    // Adicionar mensagem de sistema inicial
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.innerHTML = '<i class="fas fa-info-circle"></i> Bem-vindo ao Fruti Aero Chat! Digite uma mensagem para começar.';
    elements.chatMessages.appendChild(systemMsg);
    
    // Renderizar cada mensagem
    chatState.messages.forEach(message => {
        renderMessage(message);
    });
    
    // Scroll automático
    if (CHAT_CONFIG.autoScroll) {
        scrollToBottom();
    }
}

// Renderizar uma mensagem individual
function renderMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    messageElement.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${escapeHtml(message.sender)}</span>
            <span class="message-time">${message.time}</span>
        </div>
        <div class="message-text">${formatMessageText(message.text)}</div>
    `;
    
    elements.chatMessages.appendChild(messageElement);
}

// Atualizar contador de caracteres
function updateCharCount() {
    const length = elements.messageInput.value.length;
    elements.charCount.textContent = length;
    
    // Mudar cor se estiver perto do limite
    if (length > 450) {
        elements.charCount.style.color = 'var(--danger-color)';
    } else if (length > 400) {
        elements.charCount.style.color = 'var(--warning-color)';
    } else {
        elements.charCount.style.color = '';
    }
}

// Atualizar status da conexão
function updateConnectionStatus(connected) {
    chatState.isConnected = connected;
    
    if (connected) {
        elements.connectionStatus.className = 'fas fa-circle connected';
        elements.statusText.textContent = 'Conectado';
        
        // Atualizar contador de usuários online
        const newCount = Math.max(1, Math.floor(Math.random() * 10) + 1);
        chatState.usersOnline = newCount;
        elements.onlineCount.textContent = newCount;
    } else {
        elements.connectionStatus.className = 'fas fa-circle disconnected';
        elements.statusText.textContent = 'Desconectado';
    }
}

// Salvar mensagens localmente
function saveMessages() {
    try {
        localStorage.setItem('frutiChatMessages', JSON.stringify(chatState.messages));
    } catch (e) {
        console.error('Erro ao salvar mensagens:', e);
    }
}

// Simular entrada de usuário
function simulateUserJoin() {
    const users = ['Gabriel', 'Ana', 'Carlos', 'Mariana', 'Lucas', 'Julia', 'Pedro', 'Fernanda'];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    const joinMessage = {
        id: Date.now(),
        sender: 'Sistema',
        text: `${randomUser} entrou no chat`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        type: 'received'
    };
    
    chatState.messages.push(joinMessage);
    renderMessage(joinMessage);
    saveMessages();
    
    // Atualizar contador de usuários
    chatState.usersOnline++;
    elements.onlineCount.textContent = chatState.usersOnline;
    
    // Tocar som de notificação
    playNotificationSound();
}

// Simular resposta automática
function simulateResponse(userMessage) {
    const responses = [
        "Interessante! O que mais você pensa sobre isso?",
        "Legal! Alguém mais tem algo a acrescentar?",
        "Obrigado por compartilhar!",
        "Isso me lembra uma experiência similar que tive.",
        "Alguém já tentou fazer algo parecido?",
        "Vou pesquisar mais sobre isso depois!",
        "Essa é uma perspectiva interessante.",
        "Alguém tem alguma dica relacionada a isso?"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const botName = "Bot do Chat";
    
    const responseMessage = {
        id: Date.now(),
        sender: botName,
        text: randomResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        type: 'received'
    };
    
    chatState.messages.push(responseMessage);
    renderMessage(responseMessage);
    saveMessages();
    
    // Tocar som de notificação
    playNotificationSound();
}

// Tocar som de notificação
function playNotificationSound() {
    if (CHAT_CONFIG.soundEnabled && elements.notificationSound) {
        elements.notificationSound.currentTime = 0;
        elements.notificationSound.play().catch(e => console.log("Autoplay bloqueado:", e));
    }
}

// Scroll para o final do chat
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Formatar texto da mensagem (suporte a emojis simples e links)
function formatMessageText(text) {
    // Converter quebras de linha
    let formattedText = escapeHtml(text).replace(/\n/g, '<br>');
    
    // Detectar e formatar links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formattedText = formattedText.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    
    return formattedText;
}

// Escapar HTML para segurança
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
