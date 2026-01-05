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
        top_btn: "🏆 TOP USERS",
        list_open: "Open List 📂",
        list_sel: "Select a command:",
        cat_main: "📂 MAIN CATEGORIES",
        cat_sys: "⚙️ SYSTEM",
        desc_profile: "View your statistics",
        desc_top: "Most active users rank",
        desc_lang: "Change bot language"
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
        top_btn: "🏆 TOP UTENTI",
        list_open: "Apri Lista 📂",
        list_sel: "Seleziona un comando:",
        cat_main: "📂 CATEGORIE PRINCIPALI",
        cat_sys: "⚙️ SISTEMA",
        desc_profile: "Visualizza le tue statistiche",
        desc_top: "Classifica utenti più attivi",
        desc_lang: "Cambia lingua del bot"
    },
    es: {
        u_info: "👤 *INFO DE USUARIO*",
        name: "Nombre",
        msgs: "Mensajes",
        rank: "Rango",
        footer: "17lb bot",
        archived: "✅ Todos los chats han sido archivados.",
        only_owner: "❌ Este comando es solo para Owners.",
        menu_btn: "📂 MENÚ",
        top_btn: "🏆 TOP USUARIOS",
        list_open: "Abrir Lista 📂",
        list_sel: "Selecciona un comando:",
        cat_main: "📂 CATEGORÍAS PRINCIPALES",
        cat_sys: "⚙️ SISTEMA",
        desc_profile: "Ver tus estadísticas",
        desc_top: "Ranking de usuarios activos",
        desc_lang: "Cambiar idioma del bot"
    }
};

export default function lang(db) {
    const currentLang = db?.settings?.lang || 'en';
    return translations[currentLang] || translations['en'];
}