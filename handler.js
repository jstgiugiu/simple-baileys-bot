import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import './config.js';
import printMessage from './lib/print.js';
import getLang from './lib/language.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = './database.json';
const adminCache = new Map();

export default async function handler(conn, m) {
    try {
        if (!m.messages || !m.messages[0]) return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const decodeJid = (jid) => {
            if (!jid) return jid;
            return jid.split(':')[0].split('@')[0] + '@s.whatsapp.net';
        };

        const jid = decodeJid(msg.key.remoteJid);
        const isGroup = jid.endsWith('@g.us');
        const sender = decodeJid(msg.key.participant || jid);
        const botJid = decodeJid(conn.user.id);

        const result = await printMessage(conn, msg);

        let body = result?.body || msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || "";

        const prefix = global.prefix || "?";
        if (!body.startsWith(prefix)) return;
        
        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const pluginDir = path.join(__dirname, 'plugins');
        const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
                const isCommand = Array.isArray(plugin.command) ? plugin.command.includes(cmdName) : plugin.command === cmdName;

                if (isCommand) {
                    const isOwner = global.owner?.some(num => 
                        decodeJid(num.replace(/[^0-9]/g, '') + '@s.whatsapp.net') === sender
                    );
                    
                    let isBotAdmin = false;
                    let isAdmin = false;

                    if (isGroup) {
                        let cache = adminCache.get(jid);
                        if (!cache || (Date.now() - cache.time > 30000)) {
                            const metadata = await conn.groupMetadata(jid);
                            cache = { 
                                admins: metadata.participants.filter(p => p.admin || p.isAdmin || p.isSuperAdmin).map(p => decodeJid(p.id)),
                                time: Date.now() 
                            };
                            adminCache.set(jid, cache);
                        }
                        isBotAdmin = cache.admins.includes(botJid);
                        isAdmin = cache.admins.includes(sender);
                    }

                    const dfail = async (type) => {
                        await conn.sendPresenceUpdate('composing', jid);
                        const list = {
                            owner: '❌ *`ꪶ͢questo comando è solo per l\'owner.ꫂ`*',
                            admin: '🛠️ *`ꪶ͢solo gli admin possono usare questo comando.ꫂ`*',
                            group: '👥 *`ꪶ͢comando disponibile solo nei gruppi.ꫂ`*',
                            private: '📩 *`ꪶ͢funzione disponibile solo in privato.ꫂ`*',
                            botAdmin: '🤖 *`ꪶ͢devo essere admin per eseguire questo comando.ꫂ`*'
                        };
                        return await conn.sendMessage(jid, { text: list[type] }, { quoted: msg });
                    };

                    if (plugin.owner && !isOwner) return await dfail('owner');
                    if (plugin.group && !isGroup) return await dfail('group');
                    if (plugin.private && isGroup) return await dfail('private');
                    if (plugin.admin && !isAdmin && !isOwner) return await dfail('admin');
                    if (plugin.isAdmin && !isBotAdmin) return await dfail('botAdmin');

                    await plugin.exec(conn, msg, { jid, args, body, sender, isGroup, isAdmin, isBotAdmin, isOwner });
                    break; 
                }
            } catch (err) { 
                console.error(chalk.red(`[err plugin ${file}]`), err); 
            }
        }
    } catch (globalErr) {
        console.error(chalk.bgRed.white(" critical handler error "), globalErr);
    }
}
