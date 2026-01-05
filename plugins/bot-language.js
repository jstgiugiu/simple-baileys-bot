import fs from 'fs';

export const command = ['lang', 'lingua', 'setlang'];

export async function exec(conn, msg, { jid, L, db, sender, args, device }) {
    const prefix = global.prefix || "?";
    const name = msg.pushName || "Utente";
    const userNumber = sender.split('@')[0];
    const newLang = args[0]?.toLowerCase();

    // Cambio lingua immediato
    if (['it', 'en', 'es'].includes(newLang)) {
        db.settings.lang = newLang;
        fs.writeFileSync('./database.json', JSON.stringify(db, null, 2));

        const confirm = {
            it: "✅ Lingua impostata: Italiano",
            en: "✅ Language set: English",
            es: "✅ Idioma configurado: Español"
        };
        return conn.sendMessage(jid, { text: confirm[newLang] }, { quoted: msg });
    }

    let buttons = [];

    if (device === 'ios' || device === 'web') {
        // Bottoni diretti per iPhone
        buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🇮🇹 IT", id: `${prefix}lang it` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🇺🇸 EN", id: `${prefix}lang en` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🇪🇸 ES", id: `${prefix}lang es` }) }
        ];
    } else {
        // Lista per Android
        const sections = [{
            title: "🌐 LANGUAGE",
            rows: [
                { title: "🇮🇹 Italiano", id: `${prefix}lang it` },
                { title: "🇺🇸 English", id: `${prefix}lang en` },
                { title: "🇪🇸 Español", id: `${prefix}lang es` }
            ]
        }];
        buttons = [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({
                title: "Select Language",
                sections: sections
            })
        }];
    }

    const listMessage = {
        interactiveMessage: {
            body: { text: "Select language / Seleziona lingua" },
            header: { title: "SET LANGUAGE", hasVideoMessage: false },
            nativeFlowMessage: { buttons: buttons },
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