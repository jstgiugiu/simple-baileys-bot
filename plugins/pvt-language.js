import fs from 'fs';

export const command = ['lang', 'lingua', 'setlang'];

export async function exec(conn, msg, { jid, L, db, sender, args }) {
    const prefix = global.prefix || "?";
    const name = msg.pushName || "Utente";
    const userNumber = sender.split('@')[0];
    const newLang = args[0]?.toLowerCase();

    if (['it', 'en', 'es'].includes(newLang)) {
        db.settings.lang = newLang;
        // Forza scrittura immediata
        fs.writeFileSync('./database.json', JSON.stringify(db, null, 2));

        const confirm = {
            it: "✅ Lingua impostata: Italiano",
            en: "✅ Language set: English",
            es: "✅ Idioma configurado: Español"
        };
        return conn.sendMessage(jid, { text: confirm[newLang] }, { quoted: msg });
    }

    const sections = [{
        title: "🌐 LANGUAGE",
        rows: [
            { title: "🇮🇹 Italiano", id: `${prefix}lang it` },
            { title: "🇺🇸 English", id: `${prefix}lang en` },
            { title: "🇪🇸 Español", id: `${prefix}lang es` }
        ]
    }];

    const listMessage = {
        interactiveMessage: {
            body: { text: "Select language / Seleziona lingua" },
            header: { title: "SET LANGUAGE", hasVideoMessage: false },
            nativeFlowMessage: {
                buttons: [{
                    name: "single_select",
                    buttonParamsJson: JSON.stringify({
                        title: "Select Language",
                        sections: sections
                    })
                }]
            },
            contextInfo: {
                quotedMessage: {
                    contactMessage: {
                        displayName: name,
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${userNumber}:${userNumber}\nEND:VCARD`
                    }
                },
                participant: sender
            }
        }
    };

    await conn.relayMessage(jid, { viewOnceMessage: { message: listMessage } }, {});
}