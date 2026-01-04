import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import printMessage from './lib/print.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databasePath = './database.json';
const pluginPath = path.join(__dirname, 'plugins');

export default async function handler(conn, m) {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const sender = isGroup ? msg.key.participant : jid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
    const prefix = "/";

    // --- 1. Gestione Database Semplificata ---
    let db = { groups: {}, users: {} };
    if (fs.existsSync(databasePath)) {
        try {
            db = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
        } catch (e) {
            console.log(chalk.red("[ERRORE DB]") + " Resetting database...");
        }
    }

    if (!db.users[sender]) db.users[sender] = { count: 0 };
    db.users[sender].count += 1;

    if (isGroup) {
        if (!db.groups[jid]) db.groups[jid] = { count: 0 };
        db.groups[jid].count += 1;
    }
    fs.writeFileSync(databasePath, JSON.stringify(db, null, 2));

    // --- 2. Print del Messaggio in Console ---
    await printMessage(conn, m);

    // --- 3. Esecuzione Comandi con Caricamento Dinamico ---
    if (!body.startsWith(prefix)) return;

    const args = body.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Legge la cartella plugins dinamicamente ad ogni comando
    const files = fs.readdirSync(pluginPath).filter(f => f.endsWith('.js'));
    let executed = false;

    for (const file of files) {
        try {
            // Aggiungiamo un timestamp per forzare il ricaricamento del file in memoria (Hot Reload)
            const plugin = await import(`./plugins/${file}?update=${Date.now()}`);
            
            if (plugin.command && plugin.command.includes(commandName)) {
                await plugin.exec(conn, msg, { jid, args, body, sender, db });
                executed = true;
                break; // Esci dal loop una volta trovato e eseguito il comando
            }
        } catch (err) {
            console.log(chalk.red(`[WARN] Errore nel plugin ${file}:`), err.message);
        }
    }

    if (!executed) {
        console.log(chalk.yellow(`[INFO] Comando non trovato: ${commandName}`));
    }
}