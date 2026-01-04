import chalk from 'chalk';
import pkg from '@realvare/based';
const { getContentType } = pkg;

export default async function printMessage(conn, m) {
    try {
        const msg = m.messages[0];
        const jid = msg.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const type = getContentType(msg.message);
        const sender = (isGroup ? msg.key.participant : jid) || '0@s.whatsapp.net';
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "[Media]";

        console.log(chalk.cyan(`╔════════════『 17LB ✧ BOT 』════════════╗`));
        console.log(chalk.cyan(`║ `) + `📱 Bot: +${conn.user.id.split(':')[0]}`);
        console.log(chalk.cyan(`║ `) + `👤 Da: +${sender.split('@')[0]} ~${msg.pushName || 'User'}`);
        console.log(chalk.cyan(`║ `) + `💬 Chat: ${isGroup ? 'Gruppo' : 'Privata'}`);
        console.log(chalk.cyan(`║ `) + `📨 Tipo: ${type}`);
        console.log(chalk.cyan(`╚════════════════════════════════════════╝`));
        console.log(chalk.white(body) + "\n");
    } catch (e) { /* Silenzioso */ }
}