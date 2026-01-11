import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import './config.js';
import printMessage from './lib/print.js';
import getLang from './lib/language.js';
import pkg from '@realvare/based';
const { getContentType, toJid } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = './database.json';
const adminCache = new Map();

if (!global.db) {
    if (fs.existsSync(dbPath)) {
        global.db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } else {
        global.db = { users: {}, groups: {}, settings: {} };
        fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
    }
}

if (!global.dbInterval) {
    global.dbInterval = setInterval(() => {
        fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
    }, 30000);
}

export default async function handler(conn, m) {
    try {
        if (!m.messages || !m.messages[0]) return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const saveDB = () => {
            fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
        };

        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        const senderJid = conn.decodeJid(msg.key.participant || msg.key.remoteJid);
        const senderNumber = senderJid.replace(/[^0-9]/g, '');
        const botJid = conn.decodeJid(conn.user.id);
        const botNumber = botJid.replace(/[^0-9]/g, '');

        if (!global.db.users[senderJid]) {
            global.db.users[senderJid] = {
                name: msg.pushName || 'User',
                number: senderNumber,
                registered: Date.now(),
                count: 0,
                warns: 0
            };
            saveDB();
        }
        
        global.db.users[senderJid].count = (global.db.users[senderJid].count || 0) + 1;
        
        if (msg.pushName && global.db.users[senderJid].name !== msg.pushName) {
            global.db.users[senderJid].name = msg.pushName;
        }
        
        if (isGroup && !global.db.groups[jid]) {
            global.db.groups[jid] = {
                name: 'Unknown Group',
                registered: Date.now(),
                mods: []
            };
            saveDB();
        }

        const type = getContentType(msg.message);
        let body = msg.message.conversation || 
                   msg.message[type]?.text || 
                   msg.message[type]?.caption || 
                   msg.message.extendedTextMessage?.text || 
                   msg.message.templateButtonReplyMessage?.selectedId || "";

        if (msg.message.interactiveResponseMessage) {
            try {
                const response = msg.message.interactiveResponseMessage.nativeFlowResponseMessage;
                if (response && response.paramsJson) {
                    const params = JSON.parse(response.paramsJson);
                    body = params.id || "";
                }
            } catch (e) {}
        }
        
        if (msg.message.listResponseMessage) {
            body = msg.message.listResponseMessage.singleSelectReply?.selectedRowId || "";
        }

        if (!body || body.trim() === "") return;

        const prefix = global.prefix || ".";
        if (!body.startsWith(prefix)) return;
        
        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const pluginDir = path.join(__dirname, 'plugins');
        if (!fs.existsSync(pluginDir)) return;
        
        const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
                const isCommand = Array.isArray(plugin.command) ? plugin.command.includes(cmdName) : plugin.command === cmdName;

                if (isCommand) {
                    const isOwner = global.owner?.some(ownerNum => ownerNum.replace(/[^0-9]/g, '') === senderNumber) || false;
                    
                    let isBotAdmin = false;
                    let isAdmin = false;

                    if (isGroup) {
                        let cache = adminCache.get(jid);
                        
                        // ✅ FIX: Ricarica cache se vuota o scaduta
                        if (!cache || cache.adminIds.length === 0 || (Date.now() - cache.time > 15000)) {
                            try {
                                const metadata = await conn.groupMetadata(jid);
                                
                                // ✅ FIX: Usa conn.decodeJid per convertire LID → JID
                                const adminIds = metadata.participants
                                    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                                    .map(p => {
                                        const originalId = p.id;
                                        const decodedId = conn.decodeJid(originalId);
                                        console.log(chalk.gray(`  [DECODE] ${originalId} → ${decodedId}`));
                                        return decodedId;
                                    });
                                
                                console.log(chalk.cyan(`[ADMIN CHECK] ${adminIds.length} admin trovati`));
                                console.log(chalk.gray(`Admin IDs: ${adminIds.join(', ')}`));
                                
                                cache = { adminIds, time: Date.now() };
                                adminCache.set(jid, cache);
                            } catch (err) {
                                console.error(chalk.red(`[ERRORE METADATA] ${err.message}`));
                                
                                // ✅ FIX: Non sovrascrivere cache esistente in caso di errore
                                if (!cache) {
                                    cache = { adminIds: [], time: Date.now() };
                                }
                            }
                        }
                        
                        // ✅ senderJid e botJid sono già decodificati all'inizio dell'handler
                        isBotAdmin = cache.adminIds.includes(botJid);
                        isAdmin = cache.adminIds.includes(senderJid);
                        
                        // ✅ DEBUG: Log dettagliati
                        console.log(chalk.magenta(`[CHECK] Bot: ${botJid} | Sender: ${senderJid}`));
                        console.log(chalk.yellow(`[PERMS] Bot: ${isBotAdmin ? '✅' : '❌'} | User: ${isAdmin ? '✅' : '❌'}`));
                    }

                    const isMod = isOwner || isAdmin || (global.db.groups[jid]?.mods?.some(m => conn.decodeJid(m) === senderJid)) || false;

                    const dfail = async (type) => {
                        const list = {
                            owner: '❌ Questo comando è solo per l\'owner',
                            mod: '⚙️ Questo comando è per i moderatori o admin',
                            admin: '🛠️ Solo gli admin possono usare questo comando',
                            group: '👥 Comando disponibile solo nei gruppi',
                            botAdmin: '🤖 Devo essere admin per eseguire questo comando'
                        };

                        let ppBot;
                        try {
                            ppBot = await conn.profilePictureUrl(conn.user.id, 'image');
                        } catch {
                            ppBot = 'https://ui-avatars.com/api/?name=17LB';
                        }

                        return await conn.sendMessage(jid, {
                            text: list[type],
                            contextInfo: {
                                externalAdReply: {
                                    title: "ERROR",
                                    body: "17LB ✧ BOT",
                                    thumbnailUrl: ppBot,
                                    mediaType: 1,
                                    renderLargerThumbnail: false
                                }
                            }
                        }, { quoted: msg });
                    };

                    if (plugin.owner && !isOwner) return await dfail('owner');
                    if (plugin.mod && !isMod) return await dfail('mod');
                    if (plugin.admin && !isAdmin && !isOwner) return await dfail('admin');
                    if (plugin.group && !isGroup) return await dfail('group');
                    if (plugin.botAdmin && !isBotAdmin) return await dfail('botAdmin');

                    await conn.sendPresenceUpdate('composing', jid);
                    const L = await getLang(senderJid);
                    const device = global.devicegssr ? global.devicegssr(msg.key.id) : 'unknown';

                    await plugin.exec(conn, msg, { 
                        jid, args, body, sender: senderJid, senderNumber,
                        isGroup, isAdmin, isBotAdmin, isOwner, isMod,
                        db: global.db, L, device, botNumber, toJid
                    });
                    
                    saveDB();
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