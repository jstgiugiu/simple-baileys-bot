import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import './config.js';
import printMessage from './lib/print.js';
import getLang from './lib/language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = './database.json';

export default async function handler(conn, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const { device, body } = await printMessage(conn, m);

    const jid = msg.key.remoteJid;
    const sender = (msg.key.participant || jid);
    const prefix = global.prefix || "?";

    let db = { users: {}, settings: { lang: global.defaultLang || 'en' } };
    if (fs.existsSync(dbPath)) {
        try { db = JSON.parse(fs.readFileSync(dbPath, 'utf-8')); } catch (e) { }
    }
    const L = getLang(db);

    if (!body.startsWith(prefix)) return;
    
    const args = body.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    const pluginDir = path.join(__dirname, 'plugins');
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        try {
            const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
            if (plugin.command && plugin.command.includes(cmdName)) {
                await plugin.exec(conn, msg, { jid, args, body, sender, db, L, device });
                
                db.users[sender] = db.users[sender] || { count: 0 };
                db.users[sender].count++;
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                break; 
            }
        } catch (err) { 
            console.error(chalk.red(`[ERR ${file}]`), err); 
        }
    }
}