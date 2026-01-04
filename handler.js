import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import printMessage from './lib/print.js';
import checkEvents from './lib/event.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = './database.json';

export default async function handler(conn, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // --- LOGICA RILEVAMENTO BOTTONI ---
    // Recupera l'ID del bottone cliccato da diversi formati possibili
    const selectedButtonId = 
        msg.message?.buttonsResponseMessage?.selectedButtonId || 
        msg.message?.templateButtonReplyMessage?.selectedId || 
        msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

    // Se l'utente ha cliccato un bottone, l'ID diventa il corpo del messaggio
    let body = msg.message.conversation || 
               msg.message.extendedTextMessage?.text || 
               msg.message.imageMessage?.caption || 
               selectedButtonId || "";

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const sender = (isGroup ? msg.key.participant : jid) || jid;
    const prefix = "/";

    // 1. Database
    let db = { groups: {}, users: {} };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        } catch (e) {
            console.warn(chalk.red("[DB ERR] Corruzione file JSON, inizializzo nuovo DB"));
        }
    }
    
    if (!db.users[sender]) db.users[sender] = { count: 0 };
    db.users[sender].count++;
    if (isGroup) {
        if (!db.groups[jid]) db.groups[jid] = { count: 0 };
        db.groups[jid].count++;
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // 2. Log e Eventi (Protetti)
    try { await printMessage(conn, m); } catch (e) { console.warn(chalk.red("[PRINT ERR]"), e.message); }
    try { await checkEvents(conn, msg, { jid, sender, db }); } catch (e) { console.warn(chalk.red("[EVENT ERR]"), e.message); }

    // 3. Plugin Dinamici
    if (!body.startsWith(prefix)) return;
    
    const args = body.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const pluginDir = path.join(__dirname, 'plugins');
    if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);

    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            // Hot Reload: carichiamo il plugin con un timestamp per ignorare la cache di Node
            const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
            
            if (plugin.command && plugin.command.includes(cmdName)) {
                await plugin.exec(conn, msg, { jid, args, body, sender, db });
                break; // Comando eseguito, interrompe la scansione
            }
        } catch (err) { 
            console.error(chalk.red(`[ERR PLUGIN ${file}]`), err.message); 
        }
    }
}