export const command = ['infogp', 'infogruppo'];
export async function exec(conn, msg, { jid, db }) {
    if (!jid.endsWith('@g.us')) return conn.sendMessage(jid, { text: "Solo per gruppi!" }, { quoted: msg });
    
    const metadata = await conn.groupMetadata(jid);
    const count = db.groups[jid]?.count || 0;

    const info = `📦 *INFO GRUPPO*\n\n` +
                 `• *Nome:* ${metadata.subject}\n` +
                 `• *ID:* ${jid}\n` +
                 `• *Membri:* ${metadata.participants.length}\n` +
                 `• *Messaggi:* ${count}`;
    
    await conn.sendMessage(jid, { text: info }, { quoted: msg });
}