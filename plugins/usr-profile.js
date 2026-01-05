export const command = ['usr-info', 'profilo', 'profile'];

export async function exec(conn, msg, { jid, sender, db, L }) {
    const user = db.users[sender];
    const name = msg.pushName || "Utente";
    const count = user ? user.count : 0;
    const userNumber = sender.split('@')[0];
    const prefix = global.prefix

    const sortedUsers = Object.entries(db.users)
        .filter(([id]) => id.endsWith('@s.whatsapp.net'))
        .sort((a, b) => b[1].count - a[1].count)
        .map(u => u[0]);
    const rank = sortedUsers.indexOf(sender) + 1;

    let ppUrl;
    try {
        ppUrl = await conn.profilePictureUrl(sender, 'image');
    } catch {
        ppUrl = 'https://ui-avatars.com/api/?name=' + name;
    }

    const fkontak = {
        key: { participant: sender, remoteJid: "status@broadcast", fromMe: false, id: "17lb" },
        message: { contactMessage: { vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${userNumber}:${userNumber}\nEND:VCARD` } },
        participant: sender
    };

    const buttons = [
        { buttonId: `${prefix}17`, buttonText: { displayText: L.menu_btn }, type: 1 },
        { buttonId: `${prefix}topusr`, buttonText: { displayText: L.top_btn }, type: 1 }
    ];

    const buttonMessage = {
        text: `${L.u_info}\n\n` +
              `• *${L.name}:* ${name}\n` +
              `• *${L.msgs}:* ${count}\n` +
              `• *${L.rank}:* #${rank} / ${sortedUsers.length}`,
        footer: L.footer,
        buttons: buttons,
        headerType: 1,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            mentions: [sender],
            quotedMessage: {
                imageMessage: {
                    url: ppUrl,
                    caption: `Status: ${name}`,
                    jpegThumbnail: (await (await fetch(ppUrl)).arrayBuffer())
                }
            },
            remoteJid: 'status@broadcast',
            participant: sender
        }
    };

    await conn.sendMessage(jid, buttonMessage, { quoted: fkontak });
}