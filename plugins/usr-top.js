// users leaderboard

export const command = ['topusr', 'toputenti'];

export async function exec(conn, msg, { jid, db }) {
    let top = Object.entries(db.users)
        .filter(([id]) => id.endsWith('@s.whatsapp.net'))
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 15);
    
    let txt = "🏆 *TOP UTENTI*\n\n";
    top.forEach((u, i) => {
        txt += `${i + 1}. @${u[0].split('@')[0]} — ${u[1].count} messaggi\n`;
    });

    await conn.sendMessage(jid, { 
        text: txt, 
        mentions: top.map(u => u[0]) 
    }, { quoted: msg });
}