import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Importazioni librerie interne
import './config.js'; // Inizializza global.owners e global.defaultLang
import printMessage from './lib/print.js';
import checkEvents from './lib/event.js';
import getLang from './lib/language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = './database.json';

export default async function handler(conn, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    // --- 1. RILEVAMENTO BOTTONI ---
    const selectedButtonId = 
        msg.message?.buttonsResponseMessage?.selectedButtonId || 
        msg.message?.templateButtonReplyMessage?.selectedId || 
        msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;

    // Se l'ID del bottone è un JSON (per alcuni interactive messages), estraiamo l'id
    let cleanButtonId = selectedButtonId;
    if (selectedButtonId && selectedButtonId.startsWith('{')) {
        try { cleanButtonId = JSON.parse(selectedButtonId).id; } catch { cleanButtonId = selectedButtonId; }
    }

    let body = msg.message.conversation || 
               msg.message.extendedTextMessage?.text || 
               msg.message.imageMessage?.caption || 
               cleanButtonId || "";

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const sender = (isGroup ? msg.key.participant : jid) || jid;
    const prefix = "/";

    // --- 2. DATABASE ---
    let db = { groups: {}, users: {}, settings: { lang: global.defaultLang || 'en' } };
    if (fs.existsSync(dbPath)) {
        try {
            db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        } catch (e) {
            console.warn(chalk.red("[DB ERR] Corruzione file JSON"));
        }
    }
    
    // Check-in Utente e Gruppo
    if (!db.users[sender]) db.users[sender] = { count: 0 };
    db.users[sender].count++;
    if (isGroup) {
        if (!db.groups[jid]) db.groups[jid] = { count: 0 };
        db.groups[jid].count++;
    }
    // Salvataggio atomico
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // --- 3. LINGUA (L) ---
    const L = getLang(db);

    // --- 4. LOG E EVENTI ---
    try { await printMessage(conn, m); } catch (e) { console.warn(chalk.red("[PRINT ERR]"), e.message); }
    try { await checkEvents(conn, msg, { jid, sender, db, L }); } catch (e) { console.warn(chalk.red("[EVENT ERR]"), e.message); }

    // --- 5. PLUGIN DINAMICI ---
    if (!body.startsWith(prefix)) return;
    
    const args = body.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const pluginDir = path.join(__dirname, 'plugins');
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        try {
            // Import con cache busting per Hot Reload
            const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
            
            if (plugin.command && plugin.command.includes(cmdName)) {
                // Passiamo tutto l'oggetto necessario al plugin, inclusa la lingua L
                await plugin.exec(conn, msg, { jid, args, body, sender, db, L });
                break; 
            }
        } catch (err) { 
            console.error(chalk.red(`[ERR PLUGIN ${file}]`), err.message); 
        }
    }
}