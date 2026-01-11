export const command = ['warn', 'unwarn', 'warns'];
export const group = true;
export const admin = true;
export const botAdmin = true;

export async function exec(conn, m, { jid, args, db, body }) {
    const cmd = body.slice(1).trim().split(' ')[0].toLowerCase();
    let target = m.message.extendedTextMessage?.contextInfo?.participant || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

    if (!target) return conn.sendMessage(jid, { text: '⚠️ Devi menzionare qualcuno o rispondere al suo messaggio' }, { quoted: m });
    
    if (!db.users[target]) db.users[target] = { warns: 0 };
    if (typeof db.users[target].warns !== 'number') db.users[target].warns = 0;

    if (cmd === 'warn') {
        db.users[target].warns += 1;
        let count = db.users[target].warns;

        if (count >= 5) {
            db.users[target].warns = 0;
            await conn.sendMessage(jid, { text: `🚫 @${target.split('@')[0]} rimosso: raggiunto limite warn (5/5)`, mentions: [target] }, { quoted: m });
            await conn.groupParticipantsUpdate(jid, [target], 'remove');
        } else {
            const btn = [{
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "Rimuovi Warn 🔄",
                    id: `.unwarn @${target.split('@')[0]}`
                })
            }];

            await conn.sendMessage(jid, {
                text: `⚠️ @${target.split('@')[0]} avvertito\nWarn attuali: ${count}/5`,
                mentions: [target],
                footer: "17LB ✧ BOT",
                buttons: btn,
                headerType: 1
            }, { quoted: m });
        }
    } else if (cmd === 'unwarn') {
        db.users[target].warns = Math.max(0, db.users[target].warns - 1);
        await conn.sendMessage(jid, { text: `✅ Warn rimosso a @${target.split('@')[0]}\nTotale: ${db.users[target].warns}/5`, mentions: [target] }, { quoted: m });
    } else {
        await conn.sendMessage(jid, { text: `📊 L'utente @${target.split('@')[0]} ha ${db.users[target].warns} warn`, mentions: [target] }, { quoted: m });
    }
}