export const command = ['usr-info', 'profilo', 'profile'];

export async function exec(conn, msg, { jid, sender, db }) {
    const user = db.users[sender];
    const name = msg.pushName || "Utente";
    const count = user ? user.count : 0;
    const userNumber = sender.split('@')[0];

    // --- Calcolo Posizione ---
    const sortedUsers = Object.entries(db.users)
        .filter(([id]) => id.endsWith('@s.whatsapp.net'))
        .sort((a, b) => b[1].count - a[1].count)
        .map(u => u[0]);
    const rank = sortedUsers.indexOf(sender) + 1;

    // --- Recupero Foto Profilo ---
    let ppUrl;
    try {
        ppUrl = await conn.profilePictureUrl(sender, 'image');
    } catch {
        ppUrl = 'https://ui-avatars.com/api/?name=' + name;
    }

    // --- fkontak DINAMICO (Prende i dati di chi scrive) ---
    const fkontak = {
        key: {
            participant: sender, // L'utente che esegue
            remoteJid: "status@broadcast",
            fromMe: false,
            id: "17lb-System"
        },
        message: {
            contactMessage: {
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${userNumber}:${userNumber}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
            }
        },
        participant: sender
    };

    // --- Bottoni ---
    const buttons = [
        { buttonId: '/17', buttonText: { displayText: '📂 MENU' }, type: 1 },
        { buttonId: '/topusr', buttonText: { displayText: '🏆 TOP UTENTI' }, type: 1 }
    ];

    // --- Messaggio Finale ---
    const buttonMessage = {
        text: `👤 *INFO UTENTE*\n\n` +
              `• *Nome:* ${name}\n` +
              `• *Messaggi:* ${count}\n` +
              `• *Posizione:* #${rank} / ${sortedUsers.length}`,
        footer: '17lb bot',
        buttons: buttons,
        headerType: 1,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            mentions: [sender],
            quotedMessage: {
                imageMessage: {
                    url: ppUrl,
                    caption: `Profilo di ${name}`,
                    jpegThumbnail: (await (await fetch(ppUrl)).arrayBuffer())
                }
            },
            remoteJid: 'status@broadcast',
            participant: sender
        }
    };

    await conn.sendMessage(jid, buttonMessage, { quoted: fkontak });
}