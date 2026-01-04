
export default async function checkEvents(conn, msg, { jid, sender, db }) {
    const count = db.users[sender]?.count || 0;
    if (count > 0 && count % 15 === 0) {
        await conn.sendMessage(jid, { 
            text: `🔥 @${sender.split('@')[0]} ha inviato ${count} messaggi!`,
            mentions: [sender]
        }, { quoted: msg });
    }
}
