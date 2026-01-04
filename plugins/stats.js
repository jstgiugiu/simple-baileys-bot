import fs from 'fs';

export const command = ['topgruppi', 'toputenti', 'profilo', 'infogruppo'];

export async function exec(conn, msg, { jid, body, sender }) {
    const db = JSON.parse(fs.readFileSync('./database.json', 'utf-8'));
    const cmd = body.split(' ')[0].slice(1).toLowerCase();

    // --- LOGICA CLASSIFICA UTENTI ---
    if (cmd === 'toputenti') {
        let top = Object.entries(db.users)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);
        
        let txt = "🏆 *TOP UTENTI PER MESSAGGI*\n\n";
        top.forEach((u, i) => {
            txt += `${i + 1}. @${u[0].split('@')[0]} — ${u[1].count} messaggi\n`;
        });
        return await conn.sendMessage(jid, { text: txt, mentions: top.map(u => u[0]) });
    }

    // --- LOGICA CLASSIFICA GRUPPI ---
    if (cmd === 'topgruppi') {
        let topG = Object.entries(db.groups)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);

        let txt = "🏢 *TOP GRUPPI PER MESSAGGI*\n\n";
        for (let i = 0; i < topG.length; i++) {
            let groupName;
            try {
                const meta = await conn.groupMetadata(topG[i][0]);
                groupName = meta.subject;
            } catch {
                groupName = "Gruppo non trovato";
            }
            txt += `${i + 1}. ${groupName} — ${topG[i][1].count} messaggi\n`;
        }
        return await conn.sendMessage(jid, { text: txt });
    }

    // --- LOGICA PROFILO PERSONALE ---
    if (cmd === 'profilo') {
        const user = db.users[sender];
        const pushName = msg.pushName || "Utente";
        const msgCount = user ? user.count : 0;
        
        const bio = `👤 *PROFILO UTENTE*\n\n` +
                    `• *Nome:* ${pushName}\n` +
                    `• *Messaggi inviati:* ${msgCount}\n` +
                    `• *Grado:* ${msgCount > 500 ? 'Elite' : msgCount > 100 ? 'Veterano' : 'Novizio'}`;
        
        return await conn.sendMessage(jid, { text: bio }, { quoted: msg });
    }

    // --- LOGICA INFO GRUPPO ---
    if (cmd === 'infogruppo') {
        if (!jid.endsWith('@g.us')) return conn.sendMessage(jid, { text: "Usa questo comando all'interno di un gruppo!" });
        
        const groupData = db.groups[jid];
        const metadata = await conn.groupMetadata(jid);
        const msgCount = groupData ? groupData.count : 0;

        const info = `📦 *INFO GRUPPO*\n\n` +
                     `• *Nome:* ${metadata.subject}\n` +
                     `• *Membri:* ${metadata.participants.length}\n` +
                     `• *Messaggi totali:* ${msgCount}\n` +
                     `• *Creato il:* ${new Date(metadata.creation * 1000).toLocaleDateString('it-IT')}`;
        
        return await conn.sendMessage(jid, { text: info }, { quoted: msg });
    }
}