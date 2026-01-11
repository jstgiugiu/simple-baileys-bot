import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import './config.js';
import printMessage from './lib/print.js';
import getLang from './lib/language.js';
import pkg from '@realvare/based';
const { getContentType } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = './database.json';
const adminCache = new Map();

// Carica o inizializza il database
if (!global.db) {
    if (fs.existsSync(dbPath)) {
        global.db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } else {
        global.db = { users: {}, groups: {}, settings: {} };
        fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
    }
}

// Salva il database ogni 30 secondi
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

        // Salva il database a ogni messaggio
        const saveDB = () => {
            fs.writeFileSync(dbPath, JSON.stringify(global.db, null, 2));
        };

        const extractPhoneNumber = (participant, participantPn) => {
            if (participantPn) {
                return participantPn.split('@')[0].replace(/[^0-9]/g, '');
            }
            if (participant) {
                return participant.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            }
            return '';
        };

        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        
        let senderNumber;
        if (isGroup) {
            senderNumber = extractPhoneNumber(msg.key.participant, msg.key.participant_pn);
        } else {
            senderNumber = extractPhoneNumber(jid, null);
        }
        
        const senderJid = senderNumber + '@s.whatsapp.net';
        const botNumber = conn.user.id.split(':')[0].replace(/[^0-9]/g, '');

        // Inizializza user nel database se non esiste
        if (!global.db.users[senderJid]) {
            global.db.users[senderJid] = {
                name: msg.pushName || 'User',
                number: senderNumber,
                registered: Date.now(),
                count: 0
            };
            saveDB();
        }
        
        // Aggiorna il conteggio messaggi
        global.db.users[senderJid].count = (global.db.users[senderJid].count || 0) + 1;
        
        // Aggiorna il nome se è cambiato
        if (msg.pushName && global.db.users[senderJid].name !== msg.pushName) {
            global.db.users[senderJid].name = msg.pushName;
        }
        
        // Inizializza group nel database se è un gruppo e non esiste
        if (isGroup && !global.db.groups[jid]) {
            global.db.groups[jid] = {
                name: 'Unknown Group',
                registered: Date.now()
            };
            saveDB();
        }

        const type = getContentType(msg.message);
        let body = msg.message.conversation || 
                   msg.message[type]?.text || 
                   msg.message[type]?.caption || 
                   msg.message.extendedTextMessage?.text || 
                   msg.message.templateButtonReplyMessage?.selectedId ||
                   msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || 
                   "";

        // Se è una risposta interattiva, estrai l'ID del pulsante
        if (msg.message.interactiveResponseMessage) {
            try {
                const response = msg.message.interactiveResponseMessage.nativeFlowResponseMessage;
                if (response && response.paramsJson) {
                    const params = JSON.parse(response.paramsJson);
                    body = params.id || "";
                }
            } catch (e) {
                console.error(chalk.red('[Interactive Parse Error]'), e);
            }
        }
        
        // Se è un list reply
        if (msg.message.listResponseMessage) {
            body = msg.message.listResponseMessage.singleSelectReply?.selectedRowId || "";
        }

        if (!body || body.trim() === "") return;

        const prefix = global.prefix || "?";
        if (!body.startsWith(prefix)) return;
        
        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const pluginDir = path.join(__dirname, 'plugins');
        if (!fs.existsSync(pluginDir)) return;
        
        const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const plugin = await import(`./plugins/${file}?upd=${Date.now()}`);
                
                const isCommand = Array.isArray(plugin.command) 
                    ? plugin.command.includes(cmdName) 
                    : plugin.command === cmdName;

                if (isCommand) {
                    const isOwner = global.owner?.some(ownerNum => {
                        const cleanOwner = ownerNum.replace(/[^0-9]/g, '');
                        return cleanOwner === senderNumber;
                    }) || false;
                    
                    let isBotAdmin = false;
                    let isAdmin = false;

                    if (isGroup) {
                        let cache = adminCache.get(jid);
                        
                        if (!cache || (Date.now() - cache.time > 30000)) {
                            try {
                                const metadata = await conn.groupMetadata(jid);
                                const adminNumbers = metadata.participants
                                    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                                    .map(p => p.id.split('@')[0].split(':')[0].replace(/[^0-9]/g, ''));
                                
                                cache = { adminNumbers, time: Date.now() };
                                adminCache.set(jid, cache);
                            } catch (err) {
                                cache = { adminNumbers: [], time: Date.now() };
                            }
                        }
                        
                        isBotAdmin = cache.adminNumbers.includes(botNumber);
                        isAdmin = cache.adminNumbers.includes(senderNumber);
                    }

                    // Inizializza user e group nel database se non esistono (per sicurezza)
                    if (!global.db.users[senderJid]) {
                        global.db.users[senderJid] = {
                            name: msg.pushName || 'User',
                            number: senderNumber,
                            registered: Date.now(),
                            count: 0
                        };
                    }
                    
                    if (isGroup && !global.db.groups[jid]) {
                        global.db.groups[jid] = {
                            name: 'Unknown Group',
                            registered: Date.now()
                        };
                    }

                    const dfail = async (type) => {
                        const list = {
                            owner: '❌ *`ꪶ͢questo comando è solo per l\'owner.ꫂ`*',
                            admin: '🛠️ *`ꪶ͢solo gli admin possono usare questo comando.ꫂ`*',
                            group: '👥 *`ꪶ͢comando disponibile solo nei gruppi.ꫂ`*',
                            private: '📩 *`ꪶ͢funzione disponibile solo in privato.ꫂ`*',
                            botAdmin: '🤖 *`ꪶ͢devo essere admin per eseguire questo comando.ꫂ`*'
                        };
                        await conn.sendPresenceUpdate('composing', jid);
                        return await conn.sendMessage(jid, { text: list[type] }, { quoted: msg });
                    };

                    if (plugin.owner && !isOwner) return await dfail('owner');
                    if (plugin.group && !isGroup) return await dfail('group');
                    if (plugin.private && isGroup) return await dfail('private');
                    if (plugin.admin && !isAdmin && !isOwner) return await dfail('admin');
                    if (plugin.botAdmin && !isBotAdmin) return await dfail('botAdmin');

                    await conn.sendPresenceUpdate('composing', jid);
                    
                    // Ottieni la lingua dell'utente
                    const L = await getLang(senderJid);
                    
                    // Determina il device dell'utente
                    const device = global.devicegssr ? global.devicegssr(msg.key.id) : 'unknown';
                    
                    await plugin.exec(conn, msg, { 
                        jid, 
                        args, 
                        body, 
                        sender: senderJid,
                        senderNumber,
                        isGroup, 
                        isAdmin, 
                        isBotAdmin, 
                        isOwner,
                        db: global.db,
                        L: L,
                        device: device
                    });
                    
                    // Salva il database dopo l'esecuzione del comando
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