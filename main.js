import pkg from "@realvare/based";
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;
import pino from "pino";
import gradient from "gradient-string";
import chalk from "chalk";
import handler from "./handler.js";

const logo = `
 ██╗███████╗██║     ██████╗     ██████╗  ██████╗ ████████╗
███║╚════██║██║     ██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
╚██║    ██╔╝██║     ██████╔╝    ██████╔╝██║   ██║   ██║   
 ██║   ██╔╝ ██║     ██╔══██╗    ██╔══██╗██║   ██║   ██║   
 ██║   ██║  ███████╗██████╔╝    ██████╔╝╚██████╔╝   ██║   
 ╚═╝   ╚═╝  ╚══════╝╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   
`;

async function startBot() {
    // 1. Log Iniziale e Logo
    console.clear();
    console.log(gradient(["#00FFFF", "#0080FF", "#0040FF"])(logo));
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.bold.white(` 🚀 Avvio Bot... | Creatore: github.com/jstgiugiu `));
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    console.log(chalk.yellow("[LOG]") + " Caricamento sessione...");
    const { state, saveCreds } = await useMultiFileAuthState('session');

    console.log(chalk.yellow("[LOG]") + " Inizializzazione connessione @realvare/based...");
    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true,
        browser: ["17lb", "Chrome", "3.0.0"]
    });

    // Salvataggio credenziali
    conn.ev.on('creds.update', () => {
        saveCreds();
    });

    // Gestione Messaggi
    conn.ev.on('messages.upsert', async (m) => {
        if (!m.messages || m.type !== 'notify') return;
        await handler(conn, m);
    });

    // Log degli stati di connessione
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(chalk.magenta("[QR]") + " Scansiona il codice QR per connetterti.");
        }

        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode;
            console.log(chalk.red("[LOG]") + ` Connessione chiusa. Motivo: ${reason}`);
            
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.green("[LOG]") + " Riconnessione in corso...");
                startBot();
            } else {
                console.log(chalk.red("[LOG]") + " Sessione terminata. Elimina la cartella 'session' e riavvia.");
            }
        } else if (connection === 'open') {
            console.log(chalk.green("\n[SUCCESS]") + chalk.bold(" Connessione stabilita con successo!"));
            console.log(chalk.cyan("[INFO]") + ` Connesso come: ${conn.user.name || conn.user.id.split(':')[0]}`);
            console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
        }
    });

    return conn;
}

// Avvio con gestione errori globale
startBot().catch(err => {
    console.error(chalk.red("[CRITICAL ERROR]"), err);
});