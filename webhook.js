// Webhook para registrar informações do usuário
const WEBHOOK_URL = "https://discord.com/api/webhooks/1429236562134302781/9aDDtdDEO18AtU_Z7s08oRx9vjwhaez9shQWO6P3Ycf0ljNPM5iEitEd1f_8p8Opj-o2";

// Registrar informações do usuário quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Esperar um pouco para garantir que a página está completamente carregada
    setTimeout(sendUserInfoToWebhook, 2000);
});

// Função para coletar informações do usuário
async function collectUserInfo() {
    const userInfo = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenWidth: screen.width,
        screenHeight: screen.height,
        referrer: document.referrer || 'Direct',
        pageTitle: document.title,
        hostname: window.location.hostname
    };
    
    // Tentar obter IP via serviço externo (apenas para demonstração)
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userInfo.ip = ipData.ip;
    } catch (error) {
        userInfo.ip = 'Não disponível';
        console.log("Não foi possível obter o IP:", error);
    }
    
    // Detectar dispositivo
    userInfo.deviceType = detectDeviceType();
    userInfo.browser = detectBrowser();
    
    return userInfo;
}

// Detectar tipo de dispositivo
function detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipad|ipod/.test(userAgent)) {
        return 'Mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
        return 'Tablet';
    } else {
        return 'Desktop';
    }
}

// Detectar navegador
function detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Firefox')) {
        return 'Firefox';
    } else if (userAgent.includes('Chrome')) {
        return 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        return 'Safari';
    } else if (userAgent.includes('Edge')) {
        return 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        return 'Opera';
    } else {
        return 'Outro';
    }
}

// Enviar informações para o webhook
async function sendUserInfoToWebhook() {
    try {
        const userInfo = await collectUserInfo();
        
        // Formatar mensagem para o Discord
        const discordMessage = {
            username: "Fruti Aero Chat Logger",
            avatar_url: "https://cdn-icons-png.flaticon.com/512/2111/2111370.png",
            embeds: [{
                title: "Novo Usuário no Fruti Aero Chat",
                color: 0x6c5ce7,
                fields: [
                    {
                        name: "📅 Data/Hora",
                        value: new Date().toLocaleString('pt-BR'),
                        inline: true
                    },
                    {
                        name: "🖥️ Dispositivo",
                        value: userInfo.deviceType,
                        inline: true
                    },
                    {
                        name: "🌐 Navegador",
                        value: userInfo.browser,
                        inline: true
                    },
                    {
                        name: "📱 Sistema",
                        value: userInfo.platform,
                        inline: true
                    },
                    {
                        name: "🔤 Idioma",
                        value: userInfo.language,
                        inline: true
                    },
                    {
                        name: "📏 Resolução",
                        value: `${userInfo.screenWidth}x${userInfo.screenHeight}`,
                        inline: true
                    },
                    {
                        name: "🔗 Referência",
                        value: userInfo.referrer.length > 30 ? 
                               userInfo.referrer.substring(0, 30) + '...' : 
                               userInfo.referrer,
                        inline: true
                    }
                ],
                footer: {
                    text: `Fruti Aero Chat • Desenvolvido por Erik e Gabriel`
                },
                timestamp: new Date().toISOString()
            }]
        };
        
        // Enviar para o webhook do Discord
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(discordMessage)
        });
        
        if (response.ok) {
            console.log('Informações do usuário enviadas com sucesso para o webhook');
            
            // Mostrar mensagem de sistema (opcional)
            addSystemMessage('Sistema: Seu acesso foi registrado com sucesso. Bem-vindo ao chat!');
        } else {
            console.error('Erro ao enviar informações para o webhook:', response.status);
        }
    } catch (error) {
        console.error('Erro ao coletar/enviar informações do usuário:', error);
    }
}

// Adicionar mensagem de sistema ao chat
function addSystemMessage(text) {
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
    
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.appendChild(systemMsg);
        
        // Scroll para a mensagem
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// Função para testar o webhook manualmente (para desenvolvimento)
window.testWebhook = function() {
    sendUserInfoToWebhook();
    alert('Teste do webhook iniciado. Verifique o console para detalhes.');
};
