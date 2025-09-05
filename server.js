import express from 'express';
import qrcode from 'qrcode';
import { RemoteAuth } from 'whatsapp-web.js';
import { createClient } from 'redis';
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


class RedisSessionStore {
    constructor(redisClient) {
        this.client = redisClient;
        this.prefix = 'whatsapp-session:';
    }

    async get(id) {
        const data = await this.client.get(this.prefix + id);
        return data ? JSON.parse(data) : null;
    }

    async set(id, value) {
        await this.client.set(this.prefix + id, JSON.stringify(value));
    }

    async delete(id) {
        await this.client.del(this.prefix + id);
    }
}

// --- Configuração do WhatsApp Client ---
const redisClient = createClient({
  url: process.env.REDIS_URL,
    socket: {
    tls: true,
    rejectUnauthorized: false, // necessário para Upstash
  }
});

await redisClient.connect();

const store = new RedisSessionStore(redisClient);

const client = new Client({
    authStrategy: new RemoteAuth({
        store: store,
        backupSyncIntervalMs: 300000 // opcional
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let latestQR = null;

client.on('qr', (qr) => {
    latestQR = qr;
    console.log('QR RECEIVED');
});

app.get('/qrcode', async (req, res) => {
    if (!latestQR) {
        return res.send('Nenhum QR gerado ainda.');
    }
    try {
        const qrImage = await qrcode.toDataURL(latestQR);
        const html = `<img src="${qrImage}" />`;
        res.send(html);
    } catch (err) {
        res.status(500).send('Erro ao gerar QR');
    }
});

client.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
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

client.on('change_state', (state) => {
    console.log('📶 Estado atual do cliente:', state);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Cliente desconectado:', reason);
});

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
