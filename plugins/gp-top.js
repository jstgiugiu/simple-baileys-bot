// Groups Leaderboard

export const command = ['topgp'];

export async function exec(conn, msg, { jid, db }) {
    // Filtra solo i gruppi (@g.us)
    let topG = Object.entries(db.groups)
        .filter(([id]) => id.endsWith('@g.us')) 
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10);

    let txt = "🏢 *TOP GRUPPI*\n\n";
    for (let i = 0; i < topG.length; i++) {
        let groupName;
        try {
            const meta = await conn.groupMetadata(topG[i][0]);
            groupName = meta.subject;
        } catch {
            groupName = "Gruppo Sconosciuto";
        }
        txt += `${i + 1}. ${groupName}\n╰┈➤ ${topG[i][1].count} messaggi\n`;
    }
    
    await conn.sendMessage(jid, { text: txt }, { quoted: msg });
}