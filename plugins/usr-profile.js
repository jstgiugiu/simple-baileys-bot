export const command = ['profilo', 'profile'];

export async function exec(conn, msg, { jid, sender, db }) {
    const user = db.users[sender];
    const name = msg.pushName || "Utente";
    const count = user ? user.count : 0;

    // --- Calcolo Posizione in Classifica ---
    const sortedUsers = Object.entries(db.users)
        .sort((a, b) => b[1].count - a[1].count)
        .map(u => u[0]);
    const rank = sortedUsers.indexOf(sender) + 1;

    // --- Recupero Foto Profilo ---
    let ppUrl;
    try {
        ppUrl = await conn.profilePictureUrl(sender, 'image');
    } catch {
        ppUrl = 'https://ui-avatars.com/api/?name=' + name; // Fallback se non ha la foto
    }

    const buttons = [
        { buttonId: '/17', buttonText: { displayText: '📂 MENU' }, type: 1 },
        { buttonId: '/topusr', buttonText: { displayText: '🏆 TOP UTENTI' }, type: 1 }
    ];

    const buttonMessage = {
        text: `👤 *PROFILO UTENTE*\n\n📊 *Messaggi:* ${count}\n🏆 *Posizione:* #${rank} su ${sortedUsers.length}\n\n_Usa i bottoni per navigare_`,
        footer: '17lb System',
        buttons: buttons,
        headerType: 4, // Cambiato a 4 per supportare immagine nell'header se necessario
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            quotedMessage: {
                imageMessage: { // Usiamo imageMessage per simulare lo stato con la sua foto
                    url: ppUrl,
                    caption: `Stato di ${name}`,
                    jpegThumbnail: (await (await fetch(ppUrl)).arrayBuffer()) // Buffer reale della PP
                }
            },
            remoteJid: 'status@broadcast',
            participant: sender
        }
    };

    await conn.sendMessage(jid, buttonMessage, { quoted: msg });
}