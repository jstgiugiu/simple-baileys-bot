const translations = {
    en: {
        u_info: "👤 *USER INFO*",
        name: "Name",
        msgs: "Messages",
        rank: "Rank",
        footer: "17lb bot",
        archived: "✅ All chats have been archived.",
        only_owner: "❌ This command is for Owners only.",
        menu_btn: "📂 MENU",
        top_btn: "🏆 TOP USERS"
    },
    it: {
        u_info: "👤 *INFO UTENTE*",
        name: "Nome",
        msgs: "Messaggi",
        rank: "Posizione",
        footer: "17lb bot",
        archived: "✅ Tutte le chat sono state archiviate.",
        only_owner: "❌ Comando riservato agli Owner.",
        menu_btn: "📂 MENU",
        top_btn: "🏆 TOP UTENTI"
    }
};

export default function lang(db) {
    const currentLang = db.settings?.lang || 'en';
    return translations[currentLang] || translations['en'];
}