import pkg from "@realvare/based";
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = pkg;
import pino from "pino";
import gradient from "gradient-string";
import chalk from "chalk";
import chokidar from "chokidar";
import handler from "./handler.js";

const logo = `
 ██╗███████╗██║     ██████╗     ██████╗  ██████╗ ████████╗
███║╚════██║██║     ██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝
╚██║    ██╔╝██║     ██████╔╝    ██████╔╝██║   ██║   ██║   
 ██║   ██╔╝ ██║     ██╔══██╗    ██╔══██╗██║   ██║   ██║   
 ██║   ██║  ███████╗██████╔╝    ██████╔╝╚██████╔╝   ██║   
 ╚═╝   ╚═╝  ╚══════╝╚═════╝     ╚═════╝  ╚═════╝    ╚═╝   `;

async function startBot() {
    console.clear();
    console.log(gradient(["#00FFFF", "#0080FF", "#0040FF"])(logo));
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.bold.white(` 🚀 17lb ONLINE | Creatore: github.com/jstgiugiu `));
    console.log(chalk.cyan("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"));

    const watcher = chokidar.watch(['./plugins', './lib'], { ignored: /^\./, persistent: true, ignoreInitial: true });
    watcher.on('add', path => console.warn(chalk.yellow(`[WATCHER] 🟢 Nuovo: ${path}`)));
    watcher.on('change', path => console.warn(chalk.cyan(`[WATCHER] 🔄 Modificato: ${path}`)));
    watcher.on('unlink', path => console.warn(chalk.red(`[WATCHER] 🗑️  Rimosso: ${path}`)));

    const { state, saveCreds } = await useMultiFileAuthState('session');
    const conn = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true,
        browser: ["17lb", "Safari", "3.0.0"]
    });

    conn.ev.on('creds.update', saveCreds);
    conn.ev.on('messages.upsert', async (m) => {
        if (!m.messages || m.type !== 'notify') return;
        try { await handler(conn, m); } catch (e) { console.error(chalk.red("[HANDLER ERROR]"), e); }
    });

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) console.log(chalk.magenta("[QR]") + " Scansiona ora.");
        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') {
            console.log(chalk.green("[SUCCESS]") + " Connesso come: " + conn.user.id.split(':')[0]);
        }
    });
}
startBot().catch(err => console.error(err));