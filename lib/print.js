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
        
        // --- DEVICE RECOGNITION ---
        const device = global.devicegssr(msg.key.id);

        // --- ESTRAZIONE BODY (FIX BOTTONI) ---
        const interactiveData = msg.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        const oldButtonId = msg.message?.buttonsResponseMessage?.selectedButtonId || msg.message?.templateButtonReplyMessage?.selectedId;
        
        let body = msg.message.conversation || 
                   msg.message[type]?.text || 
                   msg.message[type]?.caption || 
                   msg.message.extendedTextMessage?.text || "";

        if (interactiveData) {
            try { body = JSON.parse(interactiveData).id || body; } catch (e) { }
        } else if (oldButtonId) {
            body = oldButtonId;
        }

        // --- LOG ESTETICO ---
        console.log(chalk.cyan(`╔════════════『 17LB ✧ BOT 』════════════╗`));
        console.log(chalk.cyan(`║ `) + `📱 Device: ` + chalk.yellow(device.toUpperCase()));
        console.log(chalk.cyan(`║ `) + `👤 Da: +${sender.split('@')[0]} ~${msg.pushName || 'User'}`);
        console.log(chalk.cyan(`║ `) + `💬 Chat: ${isGroup ? 'Gruppo' : 'Privata'}`);
        console.log(chalk.cyan(`║ `) + `📨 Tipo: ${type}`);
        console.log(chalk.cyan(`╚════════════════════════════════════════╝`));
        if (body) console.log(chalk.white(`${body}\n\n`));

        return { device, body }; // Ritorniamo i dati puliti all'handler
    } catch (e) { 
        return { device: 'unknown', body: '' };
    }
}