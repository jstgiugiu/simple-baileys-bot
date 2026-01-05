// main menu

export const command = ['menu', 'help', '17'];

export async function exec(conn, msg, { jid, L, sender, device, args }) {
    const prefix = global.prefix;
    const forceIos = args[0] === 'ios';
    const useButtons = forceIos || (device !== 'android');

    let buttons = [];

    if (useButtons) {
        buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: L.name, id: `${prefix}profilo` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: L.top_btn, id: `${prefix}topusr` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: L.desc_lang, id: `${prefix}lang` }) }
        ];
    } else {
        const sections = [{
            title: L.cat_main,
            rows: [
                { title: L.name, id: `${prefix}profilo`, description: L.desc_profile },
                { title: L.top_btn, id: `${prefix}topusr`, description: L.desc_top }
            ]
        }];
        buttons = [{
            name: "single_select",
            buttonParamsJson: JSON.stringify({ title: L.list_open, sections })
        }];
    }

    await conn.relayMessage(jid, {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: L.list_sel },
                    header: { title: "17LB MENU", hasVideoMessage: false },
                    nativeFlowMessage: { buttons },
                    contextInfo: { mentionedJid: [sender] }
                }
            }
        }
    }, {});
}