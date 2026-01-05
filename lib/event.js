
// every 350 messages the bot sends an allert!


export default async function checkEvents(conn, msg, { jid, sender, db }) {
    const count = db.users[sender]?.count || 0;
    if (count > 0 && count % 350 === 0) {
        await conn.sendMessage(jid, { 
            text: `🔥 @${sender.split('@')[0]} hai inviato 350 messaggi!\n> In totale ora hai  ${count} messaggi!`,
            mentions: [sender]
        }, { quoted: msg });
    }
}
