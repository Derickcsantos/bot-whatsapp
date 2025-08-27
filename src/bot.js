import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { askAI } from "./ai.js";
import { getBotActive } from "./state.js";

const { Client, LocalAuth } = pkg;


export function createWppClient() {
const client = new Client({
authStrategy: new LocalAuth({
dataPath: "./sessions"
}),
puppeteer: {
headless: true,
args: [
"--no-sandbox",
"--disable-setuid-sandbox",
"--disable-dev-shm-usage",
"--disable-accelerated-2d-canvas",
"--no-first-run",
"--no-zygote",
"--single-process",
"--disable-gpu"
]
}
});


client.on("qr", (qr) => {
console.log("\n[WPP] Escaneie o QR code abaixo com o número da loja:\n");
qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => console.log("[WPP] Autenticado."));
client.on("ready", () => console.log("[WPP] Pronto para receber mensagens."));
client.on("disconnected", (reason) => console.log("[WPP] Desconectado:", reason));


// Handler principal de mensagens
client.on("message", async (msg) => {
try {
// Ignora mensagens de grupos por padrão (remova se quiser atender grupos)
const chat = await msg.getChat();
if (chat.isGroup) return;


// Se o bot estiver desativado, não responde (funcionário assume)
if (!getBotActive()) return;


const from = msg.from; // 55XXXXXXXXXXX@c.us
const body = (msg.body || "").trim();
if (!body) return;


// Nome do contato (melhora contexto, opcional)
let customerName = "";
try {
const contact = await msg.getContact();
customerName = contact?.pushname || contact?.name || "";
} catch {}


const aiText = await askAI(body, { customerName });
await client.sendMessage(from, aiText);
} catch (err) {
console.error("[WPP] erro em message handler:", err?.message || err);
}
});


client.initialize();
return client;
}