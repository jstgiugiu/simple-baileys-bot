
export default async function checkEvents(conn, msg, { jid, sender, db }) {
    const count = db.users[sender]?.count || 0;
    if (count > 0 && count % 350 === 0) {
        await conn.sendMessage(jid, { 
            text: `🔥 @${sender.split('@')[0]} hai inviato ${count} messaggi!`,
            mentions: [sender]
        }, { quoted: msg });
    }
}
