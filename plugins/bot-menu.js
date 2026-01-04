export const command = ['17', 'menu'];
export async function exec(conn, msg, { jid }) {
    await conn.sendMessage(jid, {
        text: "📂 *MENU 17lb*\n\n• /profilo\n• /topusr\n• /topgp\n• /infogp",
        contextInfo: {
            externalAdReply: {
                title: "17lb bot",
                body: "github.com/jstgiugiu",
                thumbnailUrl: "https://github.com/jstgiugiu.png",
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: msg });
}