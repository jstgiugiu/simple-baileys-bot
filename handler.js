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

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const sender = (isGroup ? msg.key.participant : jid) || jid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
    const prefix = "/";

    // 1. Database
    let db = { groups: {}, users: {} };
    if (fs.existsSync(dbPath)) db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    if (!db.users[sender]) db.users[sender] = { count: 0 };
    db.users[sender].count++;
    if (isGroup) {
        if (!db.groups[jid]) db.groups[jid] = { count: 0 };
        db.groups[jid].count++;
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // 2. Log e Eventi (Protetti)
    try { await printMessage(conn, m); } catch (e) { console.warn(chalk.red("[PRINT ERR]")); }
    try { await checkEvents(conn, msg, { jid, sender, db }); } catch (e) { console.warn(chalk.red("[EVENT ERR]")); }

    // 3. Plugin Dinamici
    if (!body.startsWith(prefix)) return;
    const args = body.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const files = fs.readdirSync(path.join(__dirname, 'plugins')).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
            if (plugin.command.includes(cmdName)) {
                await plugin.exec(conn, msg, { jid, args, body, sender, db });
                break;
            }
        } catch (err) { console.error(chalk.red(`[ERR ${file}]`), err.message); }
    }
}