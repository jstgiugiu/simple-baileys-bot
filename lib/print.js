import chalk from 'chalk';
import pkg from '@realvare/based';
const { getContentType } = pkg;

export default async function printMessage(conn, m) {
    const msg = m.messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith('@g.us');
    const type = getContentType(msg.message);
    
    // Info Mittente e Chat
    const sender = isGroup ? msg.key.participant : jid;
    const pushName = msg.pushName || 'Sconosciuto';
    const groupName = isGroup ? (await conn.groupMetadata(jid)).subject : 'Privata';
    const groupMembers = isGroup ? (await conn.groupMetadata(jid)).participants.length : 1;

    // Gestione Orario
    const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Gestione Contenuto e Risposta
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || type;
    const isQuoted = type === 'extendedTextMessage' && msg.message.extendedTextMessage.contextInfo?.quotedMessage;
    const quotedSender = isQuoted ? msg.message.extendedTextMessage.contextInfo.participant.split('@')[0] : null;

    // Calcolo Dimensione Approssimativa
    const size = Buffer.byteLength(JSON.stringify(msg.message), 'utf8');

    console.log(chalk.cyan(`╔════════════『 VARE ✧ BOT 』════════════╗`));
    console.log(chalk.cyan(`║ `) + chalk.white(`📱 Bot: +${conn.user.id.split(':')[0]}`));
    console.log(chalk.cyan(`║ `) + chalk.white(`⏰ Ora: ${time} • Live`));
    console.log(chalk.cyan(`║ `) + chalk.white(`👤 Da: +${sender.split('@')[0]} ~${pushName}`));
    console.log(chalk.cyan(`║ `) + chalk.white(`💬 Chat: ${groupName} (${isGroup ? 'Gruppo' : 'User'})`));
    console.log(chalk.cyan(`║ `) + chalk.white(`📨 Tipo: ${type}${isQuoted ? ' • In risposta' : ''}`));
    console.log(chalk.cyan(`║ `) + chalk.white(`📦 Dimensione: ${size} B`));
    console.log(chalk.cyan(`║ `) + chalk.white(`👥 Membri: ${groupMembers}`));
    if (isQuoted) {
        console.log(chalk.cyan(`║ `) + chalk.yellow(`↪️  Risposta a: +${quotedSender}`));
    }
    console.log(chalk.cyan(`╚════════════════════════════════════════╝`));
    console.log(chalk.bold.white(body) + "\n");
}