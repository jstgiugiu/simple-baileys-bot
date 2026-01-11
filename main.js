import pkg from "@realvare/based";
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, delay } = pkg;
import pino from "pino";
import chalk from "chalk";
import chokidar from "chokidar";
import readline from "readline";
import qrcode from "qrcode-terminal";
import fs from "fs";
import handler from "./handler.js";
import print from "./lib/print.js";

const logo = `
 ██╗███████╗██║     ██████╗     ██████╗  ██████╗ ████████╗
███║╚════██║██║     ██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
╚██║    ██╔╝██║     ██████╔╝    ██████╔╝██║   ██║   ██║   
 ██║   ██╔╝ ██║     ██╔══██╗    ██╔══██╗██║   ██║   ██║   
 ██║   ██║  ███████╗██████╔╝    ██████╔╝╚██████╔╝   ██║   
 ╚═╝   ╚═╝  ╚══════╝╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   `;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    if (!global.isStarted) {
        console.clear();
        console.log(chalk.blueBright(logo));
        console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
        console.log(chalk.bold.white(` 🚀 17lb ONLINE | Made by: github.com/jstgiugiu `));
        console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));
        global.isStarted = true;
    }

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sessionExists = fs.existsSync('./session/creds.json');
    let method = global.methodChoice;

    if (!sessionExists && !method) {
        console.log(chalk.yellow("Metodo di pairing:"));
        console.log(chalk.white("1) QR Code"));
        console.log(chalk.white("2) Pairing Code"));
        method = await question(chalk.cyan("\nScelta > "));
        global.methodChoice = method;
    }

    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ["17lb", "Chrome", "3.0.0"]
    });

    if (!sessionExists && method === '2' && !conn.authState.creds.registered) {
        let phoneNumber = await question(chalk.magenta("\nInserisci il numero (es. 39333xxx): "));
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        await delay(3000);
        try {
            const code = await conn.requestPairingCode(phoneNumber);
            console.log(chalk.bold.white(`\n[PAIRING] Codice: `) + chalk.bgWhite.black.bold(` ${code} `) + "\n");
        } catch (e) {
            console.error(chalk.red("[ERRORE PAIRING]"), e);
        }
    }

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && method === '1' && !sessionExists) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'connecting') {
            console.log(chalk.blue("[SERVER]") + " Connessione...");
        }

        if (connection === 'open') {
            console.log(chalk.green("[SUCCESS]") + " Sessione Online!");
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            
            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red("[FATAL]") + " Logout. Reset sessione...");
                fs.rmSync('./session', { recursive: true, force: true });
                process.exit();
            } else {
                const retryDelay = (reason === 428 || reason === 440) ? 5000 : 2000;
                console.log(chalk.yellow("[RETRY]") + ` Codice: ${reason}. Riavvio...`);
                
                conn.ev.removeAllListeners();
                await delay(retryDelay);
                startBot();
            }
        }
    });

    conn.ev.on('messages.upsert', async (m) => {
        if (!m.messages || m.type !== 'notify') return;
        const msg = m.messages[0];
        if (msg.key.remoteJid === 'status@broadcast') return;

        try { 
            print(conn, msg);
            await handler(conn, m); 
        } catch (e) { 
            console.error(chalk.red("[HANDLER ERROR]"), e); 
        }
    });

    if (!global.watcherStarted) {
        const watcher = chokidar.watch(['./plugins', './lib'], { ignored: /^\./, persistent: true, ignoreInitial: true });
        watcher.on('add', path => console.warn(chalk.green(`[🟢 NEW]: ${path}`)));
        watcher.on('change', path => console.warn(chalk.yellow(`[🔄 EDIT]: ${path}`)));
        global.watcherStarted = true;
    }
}

startBot().catch(err => {
    setTimeout(() => startBot(), 5000);
});