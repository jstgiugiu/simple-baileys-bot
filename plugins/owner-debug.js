export const command = ['debug', 'whoami'];

export async function exec(conn, m, { jid, isGroup, isAdmin, isBotAdmin, isOwner, isMod, senderNumber, botNumber, db, sender, body }) {
    const args = body.split(' ');
    const cmd = args[0].slice(1).toLowerCase();

    if (cmd === 'debug') {
        let text = `◦ *Bot Number:* ${botNumber}\n`;
        text += `◦ *User Number:* ${senderNumber}\n`;
        text += `◦ *Is Group:* ${isGroup ? '✅' : '❌'}\n`;
        text += `◦ *Bot Admin:* ${isBotAdmin ? '✅' : '❌'}\n`;
        text += `◦ *User Admin:* ${isAdmin ? '✅' : '❌'}\n`;
        text += `◦ *Owner:* ${isOwner ? '✅' : '❌'}\n`;
        text += `◦ *Moderator:* ${isMod ? '✅' : '❌'}`;
        
        return await conn.sendMessage(jid, { text }, { quoted: m });
    } 
    
    if (cmd === 'whoami') {
        // Gerarchia visiva corretta
        let role = 'UTENTE';
        if (isOwner) role = 'OWNER';
        else if (isAdmin) role = 'AMMINISTRATORE';
        else if (isMod) role = 'MODERATORE';

        const user = db.users[sender] || { count: 0, warns: 0 };
        const text = `👤 *USER INFO*\n\n◦ *Nome:* ${m.pushName}\n◦ *Ruolo:* ${role}\n◦ *Messaggi:* ${user.count}\n◦ *Warns:* ${user.warns}/5`;
        
        return await conn.sendMessage(jid, { text }, { quoted: m });
    }
}