export const command = ['setmod', 'delmod'];
export const group = true;
export const admin = true;

export async function exec(conn, m, { jid, args, db, body }) {
    const cmd = body.slice(1).trim().split(' ')[0].toLowerCase();
    let target = m.message.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    if (!target) return conn.sendMessage(jid, { text: '⚠️ Rispondi a un messaggio o tagga qualcuno' }, { quoted: m });
    if (!db.groups[jid].mods) db.groups[jid].mods = [];

    if (cmd === 'setmod') {
        if (db.groups[jid].mods.includes(target)) return conn.sendMessage(jid, { text: '✨ Utente già moderatore' }, { quoted: m });
        db.groups[jid].mods.push(target);
        await conn.sendMessage(jid, { text: `⚙️ @${target.split('@')[0]} è ora moderatore`, mentions: [target] }, { quoted: m });
    } else {
        db.groups[jid].mods = db.groups[jid].mods.filter(m => m !== target);
        await conn.sendMessage(jid, { text: `🗑️ @${target.split('@')[0]} rimosso dai moderatori`, mentions: [target] }, { quoted: m });
    }
}