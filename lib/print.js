import chalk from 'chalk';
import pkg from '@realvare/based';
const { getContentType } = pkg;

export default async function printMessage(conn, m) {
    try {
        // Accetta sia l'evento intero che il singolo messaggio
        const msg = m.messages ? m.messages[0] : m;
        if (!msg || !msg.message) return { body: "" };

        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const type = getContentType(msg.message);
        
        const decodeJid = (id) => id.split(':')[0].split('@')[0] + '@s.whatsapp.net';
        const sender = decodeJid(isGroup ? (msg.key.participant || jid) : jid);
        
        let body = msg.message.conversation || 
                   msg.message[type]?.text || 
                   msg.message[type]?.caption || 
                   msg.message.extendedTextMessage?.text || "";

        console.log(chalk.cyan(`╔════════════『 17LB ✧ BOT 』════════════╗`));
        console.log(chalk.cyan(`║ `) + `👤 from: +${sender.split('@')[0]} ~${msg.pushName || 'user'}`);
        console.log(chalk.cyan(`║ `) + `💬 chat: ${isGroup ? 'group' : 'private chat'}`);
        console.log(chalk.cyan(`║ `) + `📨 type: ${type}`);
        console.log(chalk.cyan(`╚════════════════════════════════════════╝`));
        if (body) console.log(chalk.white(`> ${body}\n`));

        return { body };
    } catch (e) {
        return { body: "" };
    }
}
