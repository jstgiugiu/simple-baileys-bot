export const command = ['language', 'lingua', 'lang'];

export async function exec(conn, msg, { jid, sender, args, db }) {
    const isOwner = global.owners.includes(sender.split('@')[0]);
    
    if (!isOwner) {
        return conn.sendMessage(jid, { text: "❌ Access Denied." }, { quoted: msg });
    }

    const newLang = args[0]?.toLowerCase();
    if (newLang === 'it' || newLang === 'en') {
        if (!db.settings) db.settings = {};
        db.settings.lang = newLang;
        
        // Risposta dinamica in base alla nuova lingua
        const text = newLang === 'it' ? "✅ Lingua impostata su: Italiano" : "✅ Language set to: English";
        await conn.sendMessage(jid, { text }, { quoted: msg });
    } else {
        await conn.sendMessage(jid, { text: "❓ Usage: /lang it OR /lang en" }, { quoted: msg });
    }
}