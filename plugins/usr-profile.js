export const command = ['profilo', 'profile'];
export async function exec(conn, msg, { jid, sender, db }) {
    const user = db.users[sender];
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${msg.pushName}\nTEL;type=CELL;type=VOICE;waid=${sender.split('@')[0]}:+${sender.split('@')[0]}\nEND:VCARD`;
    await conn.sendMessage(jid, {
        contacts: { displayName: msg.pushName, contacts: [{ vcard }] },
        contextInfo: {
            externalAdReply: {
                title: `Messaggi: ${user.count}`,
                body: "Livello: " + Math.floor(user.count / 10),
                mediaType: 1,
                thumbnailUrl: "https://github.com/jstgiugiu.png"
            }
        }
    }, { quoted: msg });
}