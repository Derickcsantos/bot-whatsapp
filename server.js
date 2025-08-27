import express from 'express';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import cors from 'cors';
import dotenv from 'dotenv';
// import { OpenAI } from 'openai'; // Descomente se for usar o OpenAI

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- Estado do Bot ---
let botEnabled = true; // O bot começa ativado por padrão 

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir arquivos estáticos da pasta 'public'

// --- Configuração do WhatsApp Client ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('WhatsApp Client is ready!');
});

client.on('message', async (message) => {
    // A verificação principal! Se o bot não estiver ativado, ele não faz nada.
    if (!botEnabled) {
        console.log(`Bot desativado. Mensagem de ${message.from} ignorada.`);
        return; // <-- Ponto crucial: a função para aqui.
    }

    // Ignora mensagens de grupos para focar no atendimento individual
    if (message.from.endsWith('@g.us')) {
        return;
    }

    // Lógica do bot (ex: chamar OpenAI)
    try {
        console.log(`Bot ativado. Processando mensagem de ${message.from}: "${message.body}"`);
        // Aqui iria a sua lógica para interagir com a OpenAI
        // Exemplo simplificado:
        if (message.body.toLowerCase() === 'oi') {
            await message.reply('Olá! Eu sou a IA. Como posso ajudar?');
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
});

client.initialize();

// --- API Endpoints ---
app.get('/api/status', (req, res) => {
    res.json({ enabled: botEnabled });
});

app.post('/api/toggle', (req, res) => {
    botEnabled = !botEnabled;
    console.log(`Estado do bot alterado para: ${botEnabled ? 'ATIVADO' : 'DESATIVADO'}`);
    res.json({
        enabled: botEnabled,
        message: `Bot foi ${botEnabled ? 'ativado' : 'desativado'} com sucesso.`,
    });
});

// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Painel de controle disponível em http://localhost:${port}/index.html`);
});