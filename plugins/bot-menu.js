export const command = ['menu', 'help', '17'];

export async function exec(conn, msg, { jid, L, sender, isIphone }) {
    const prefix = global.prefix || "?";
    const name = msg.pushName || "Utente";
    const userNumber = sender.split('@')[0];

    const sections = [
        {
            title: `${L.cat_main}`,
            rows: [
                { title: `👤 ${L.name}`, id: `${prefix}profilo`, description: `${L.desc_profile}` },
                { title: `${L.top_btn}`, id: `${prefix}topusr`, description: `${L.desc_top}` }
            ]
        },
        {
            title: `${L.cat_sys}`,
            rows: [
                { title: `🌐 ${L.desc_lang}`, id: `${prefix}lang`, description: `${L.desc_lang}` }
            ]
        }
    ];

    let buttons = [];

    if (isIphone) {
        // --- FORMATO BOTTONI PER IPHONE ---
        buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `👤 ${L.name}`,
                    id: `${prefix}profilo`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `🏆 ${L.top_btn}`,
                    id: `${prefix}topusr`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: `🌐 ${L.desc_lang}`,
                    id: `${prefix}lang`
                })
            }
        ];
    } else {
        // --- FORMATO LISTA PER ANDROID ---
        buttons = [
            {
                name: "single_select",
                buttonParamsJson: JSON.stringify({
                    title: `${L.list_open}`,
                    sections: sections
                })
            }
        ];
    }

    const listMessage = {
        interactiveMessage: {
            body: { text: `${L.list_sel}` },
            header: { title: "17LB MENU", hasVideoMessage: false },
            nativeFlowMessage: {
                buttons: buttons
            },
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 1,
                isForwarded: true,
                quotedMessage: {
                    contactMessage: {
                        displayName: name,
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nitem1.TEL;waid=${userNumber}:${userNumber}\nEND:VCARD`
                    }
                },
                participant: sender,
                remoteJid: 'status@broadcast'
            }
        }
    };

    await conn.relayMessage(jid, { 
        viewOnceMessage: { 
            message: listMessage 
        } 
    }, {});
}