// Tiny i18n. Detects the UI language from the OS; falls back to English.
// Add a language by adding its object below — every string flows through t().
(function () {
  const EN = {
    // launcher
    chooseTitle: "Which spaces do you want to open?",
    chooseSub: "Each space groups your accounts in its own window. Open them and spread them across your desktops.",
    open: "Open", openAll: "Open all spaces", newWs: "New space",
    rename: "Rename", del: "Delete", cancel: "Cancel", create: "Create", accept: "OK",
    options: "Options", minimize: "Minimize", close: "Close",
    accounts: (n) => n + (n === 1 ? " account" : " accounts"),
    emptyWs: "No accounts yet — open it to add some",
    changeLogo: "Change logo", removeLogo: "Remove logo", pin: "Create shortcut / pin", language: "Language", spaces: "Spaces",
    newWsTitle: "New space", renameWsTitle: "Rename space", wsNamePh: "Client A, Personal…",
    deleteWsTitle: "Delete space",
    deleteWsMsg: (name, n) => `"${name}" will be deleted. ${n ? `Its ${n} account${n === 1 ? "" : "s"} will move back to Main (not deleted).` : "It has no accounts."}`,
    // shell
    searchPh: "Go to a service, message or command…",
    addTitle: "Add service", addSub: "Any web app or AI chat runs in its own isolated container.",
    catAI: "AI chats", catWork: "Messaging & work",
    moveToSpaceMenu: "Move to space…", popoutNew: "Send to a new space",
    select: "Select", deselect: "Remove from selection", mute: "Mute", unmute: "Unmute",
    newGroup: "New group…", groupTo: (g) => "Group: " + g, ungroupItem: "Remove from group",
    reloadItem: "Reload", removeItem: "Delete", moveToLabel: (n) => "Move to: " + n,
    zoomIn: "Zoom in", zoomOut: "Zoom out", zoomReset: (p) => "Reset zoom (" + p + "%)",
    openGroupWins: "Open group in windows", collapse: "Collapse group", expand: "Expand group",
    renameGroup: "Rename group…", ungroup: "Ungroup", goHome: "Go to start",
    notif: "Notifications", recent: "Recent", noNotif: "No notifications",
    dndBanner: "Do Not Disturb is on — alerts are paused.", dndDisable: "Turn off",
    dnd: "Do Not Disturb", themeDark: "Dark theme", themeLight: "Light theme", themeBlack: "Black theme (AMOLED)", expandedBar: "Expanded sidebar",
    selected: (n) => n + (n === 1 ? " selected" : " selected"), moveToSpace: "Move to space", newAccountOf: (n) => "New " + n + " account",
    emptyStage: "Add a service to get started", accountNamePh: "Work, Personal…", nameLabel: "Account name:",
  };
  const ES = {
    chooseTitle: "¿Qué espacios quieres abrir?",
    chooseSub: "Cada espacio agrupa tus cuentas en su propia ventana. Ábrelos y repártelos en tus escritorios.",
    open: "Abrir", openAll: "Abrir todos los espacios", newWs: "Nuevo espacio",
    rename: "Renombrar", del: "Eliminar", cancel: "Cancelar", create: "Crear", accept: "Aceptar",
    options: "Opciones", minimize: "Minimizar", close: "Cerrar",
    accounts: (n) => n + (n === 1 ? " cuenta" : " cuentas"),
    emptyWs: "Sin cuentas — ábrelo para añadir",
    changeLogo: "Cambiar logo", removeLogo: "Quitar logo", pin: "Crear acceso directo", language: "Idioma", spaces: "Espacios",
    newWsTitle: "Nuevo espacio", renameWsTitle: "Renombrar espacio", wsNamePh: "Cliente A, Personal…",
    deleteWsTitle: "Eliminar espacio",
    deleteWsMsg: (name, n) => `Se eliminará "${name}". ${n ? `Sus ${n} cuenta${n === 1 ? "" : "s"} volverán a Principal (no se borran).` : "No tiene cuentas."}`,
    searchPh: "Ir a servicio, mensaje o comando…",
    addTitle: "Añadir servicio", addSub: "Cualquier app web o chat de IA se ejecuta en su propio contenedor aislado.",
    catAI: "Chats de IA", catWork: "Mensajería y trabajo",
    moveToSpaceMenu: "Mover a espacio…", popoutNew: "Sacar a espacio nuevo",
    select: "Seleccionar", deselect: "Quitar de selección", mute: "Silenciar", unmute: "Reactivar sonido",
    newGroup: "Nuevo grupo…", groupTo: (g) => "Grupo: " + g, ungroupItem: "Quitar de grupo",
    reloadItem: "Recargar", removeItem: "Eliminar", moveToLabel: (n) => "Mover a: " + n,
    zoomIn: "Acercar", zoomOut: "Alejar", zoomReset: (p) => "Restablecer zoom (" + p + "%)",
    openGroupWins: "Abrir grupo en ventanas", collapse: "Colapsar grupo", expand: "Expandir grupo",
    renameGroup: "Renombrar grupo…", ungroup: "Deshacer grupo", goHome: "Ir al inicio",
    notif: "Notificaciones", recent: "Recientes", noNotif: "Sin notificaciones",
    dndBanner: "No molestar activo — las alertas están en pausa.", dndDisable: "Desactivar",
    dnd: "No molestar", themeDark: "Tema oscuro", themeLight: "Tema claro", themeBlack: "Tema negro (AMOLED)", expandedBar: "Barra expandida",
    selected: (n) => n + (n === 1 ? " seleccionado" : " seleccionados"), moveToSpace: "Mover a espacio", newAccountOf: (n) => "Nueva cuenta de " + n,
    emptyStage: "Añade un servicio para empezar", accountNamePh: "Trabajo, Personal…", nameLabel: "Nombre de la cuenta:",
  };
  const PT = {
    chooseTitle: "Que espaços você quer abrir?",
    chooseSub: "Cada espaço agrupa suas contas na própria janela. Abra-os e distribua pelos seus desktops.",
    open: "Abrir", openAll: "Abrir todos os espaços", newWs: "Novo espaço",
    rename: "Renomear", del: "Excluir", cancel: "Cancelar", create: "Criar", accept: "OK",
    options: "Opções", minimize: "Minimizar", close: "Fechar",
    accounts: (n) => n + (n === 1 ? " conta" : " contas"),
    emptyWs: "Sem contas — abra para adicionar",
    changeLogo: "Alterar logo", removeLogo: "Remover logo", pin: "Criar atalho", language: "Idioma", spaces: "Espaços",
    newWsTitle: "Novo espaço", renameWsTitle: "Renomear espaço", wsNamePh: "Cliente A, Pessoal…",
    deleteWsTitle: "Excluir espaço",
    deleteWsMsg: (name, n) => `"${name}" será excluído. ${n ? `Suas ${n} conta${n === 1 ? "" : "s"} voltarão para Principal (não são apagadas).` : "Não tem contas."}`,
    searchPh: "Ir para um serviço, mensagem ou comando…",
    addTitle: "Adicionar serviço", addSub: "Qualquer app web ou chat de IA roda no seu próprio contêiner isolado.",
    catAI: "Chats de IA", catWork: "Mensagens e trabalho",
    moveToSpaceMenu: "Mover para espaço…", popoutNew: "Enviar para novo espaço",
    select: "Selecionar", deselect: "Remover da seleção", mute: "Silenciar", unmute: "Reativar som",
    newGroup: "Novo grupo…", groupTo: (g) => "Grupo: " + g, ungroupItem: "Remover do grupo",
    reloadItem: "Recarregar", removeItem: "Excluir", moveToLabel: (n) => "Mover para: " + n,
    zoomIn: "Aproximar", zoomOut: "Afastar", zoomReset: (p) => "Redefinir zoom (" + p + "%)",
    openGroupWins: "Abrir grupo em janelas", collapse: "Recolher grupo", expand: "Expandir grupo",
    renameGroup: "Renomear grupo…", ungroup: "Desagrupar", goHome: "Ir ao início",
    notif: "Notificações", recent: "Recentes", noNotif: "Sem notificações",
    dndBanner: "Não perturbe ativo — os alertas estão pausados.", dndDisable: "Desativar",
    dnd: "Não perturbe", themeDark: "Tema escuro", themeLight: "Tema claro", themeBlack: "Tema preto (AMOLED)", expandedBar: "Barra expandida",
    selected: (n) => n + (n === 1 ? " selecionado" : " selecionados"), moveToSpace: "Mover para espaço", newAccountOf: (n) => "Nova conta de " + n,
    emptyStage: "Adicione um serviço para começar", accountNamePh: "Trabalho, Pessoal…", nameLabel: "Nome da conta:",
  };
  const FR = {
    chooseTitle: "Quels espaces veux-tu ouvrir ?",
    chooseSub: "Chaque espace regroupe tes comptes dans sa propre fenêtre. Ouvre-les et répartis-les sur tes bureaux.",
    open: "Ouvrir", openAll: "Ouvrir tous les espaces", newWs: "Nouvel espace",
    rename: "Renommer", del: "Supprimer", cancel: "Annuler", create: "Créer", accept: "OK",
    options: "Options", minimize: "Réduire", close: "Fermer",
    accounts: (n) => n + (n === 1 ? " compte" : " comptes"),
    emptyWs: "Aucun compte — ouvre pour en ajouter",
    changeLogo: "Changer le logo", removeLogo: "Retirer le logo", pin: "Créer un raccourci", language: "Langue", spaces: "Espaces",
    newWsTitle: "Nouvel espace", renameWsTitle: "Renommer l'espace", wsNamePh: "Client A, Perso…",
    deleteWsTitle: "Supprimer l'espace",
    deleteWsMsg: (name, n) => `"${name}" sera supprimé. ${n ? `Ses ${n} compte${n === 1 ? "" : "s"} reviendront à Principal (non supprimés).` : "Aucun compte."}`,
    searchPh: "Aller à un service, un message ou une commande…",
    addTitle: "Ajouter un service", addSub: "Toute app web ou chat IA s'exécute dans son propre conteneur isolé.",
    catAI: "Chats IA", catWork: "Messagerie et travail",
    moveToSpaceMenu: "Déplacer vers un espace…", popoutNew: "Envoyer vers un nouvel espace",
    select: "Sélectionner", deselect: "Retirer de la sélection", mute: "Couper le son", unmute: "Réactiver le son",
    newGroup: "Nouveau groupe…", groupTo: (g) => "Groupe : " + g, ungroupItem: "Retirer du groupe",
    reloadItem: "Recharger", removeItem: "Supprimer", moveToLabel: (n) => "Déplacer vers : " + n,
    zoomIn: "Zoom avant", zoomOut: "Zoom arrière", zoomReset: (p) => "Réinitialiser le zoom (" + p + " %)",
    openGroupWins: "Ouvrir le groupe en fenêtres", collapse: "Réduire le groupe", expand: "Développer le groupe",
    renameGroup: "Renommer le groupe…", ungroup: "Dégrouper", goHome: "Aller à l'accueil",
    notif: "Notifications", recent: "Récentes", noNotif: "Aucune notification",
    dndBanner: "Ne pas déranger activé — les alertes sont en pause.", dndDisable: "Désactiver",
    dnd: "Ne pas déranger", themeDark: "Thème sombre", themeLight: "Thème clair", themeBlack: "Thème noir (AMOLED)", expandedBar: "Barre étendue",
    selected: (n) => n + (n === 1 ? " sélectionné" : " sélectionnés"), moveToSpace: "Déplacer vers un espace", newAccountOf: (n) => "Nouveau compte " + n,
    emptyStage: "Ajoute un service pour commencer", accountNamePh: "Travail, Perso…", nameLabel: "Nom du compte :",
  };
  const DE = {
    chooseTitle: "Welche Bereiche möchtest du öffnen?",
    chooseSub: "Jeder Bereich bündelt deine Konten in einem eigenen Fenster. Öffne sie und verteile sie auf deine Desktops.",
    open: "Öffnen", openAll: "Alle Bereiche öffnen", newWs: "Neuer Bereich",
    rename: "Umbenennen", del: "Löschen", cancel: "Abbrechen", create: "Erstellen", accept: "OK",
    options: "Optionen", minimize: "Minimieren", close: "Schließen",
    accounts: (n) => n + (n === 1 ? " Konto" : " Konten"),
    emptyWs: "Keine Konten — öffnen zum Hinzufügen",
    changeLogo: "Logo ändern", removeLogo: "Logo entfernen", pin: "Verknüpfung erstellen", language: "Sprache", spaces: "Bereiche",
    newWsTitle: "Neuer Bereich", renameWsTitle: "Bereich umbenennen", wsNamePh: "Kunde A, Privat…",
    deleteWsTitle: "Bereich löschen",
    deleteWsMsg: (name, n) => `"${name}" wird gelöscht. ${n ? `Seine ${n} Konten kehren zu Haupt zurück (nicht gelöscht).` : "Keine Konten."}`,
    searchPh: "Zu Dienst, Nachricht oder Befehl springen…",
    addTitle: "Dienst hinzufügen", addSub: "Jede Web-App oder KI-Chat läuft in einem eigenen isolierten Container.",
    catAI: "KI-Chats", catWork: "Messaging & Arbeit",
    moveToSpaceMenu: "In Bereich verschieben…", popoutNew: "In neuen Bereich senden",
    select: "Auswählen", deselect: "Aus Auswahl entfernen", mute: "Stummschalten", unmute: "Ton aktivieren",
    newGroup: "Neue Gruppe…", groupTo: (g) => "Gruppe: " + g, ungroupItem: "Aus Gruppe entfernen",
    reloadItem: "Neu laden", removeItem: "Löschen", moveToLabel: (n) => "Verschieben nach: " + n,
    zoomIn: "Vergrößern", zoomOut: "Verkleinern", zoomReset: (p) => "Zoom zurücksetzen (" + p + "%)",
    openGroupWins: "Gruppe in Fenstern öffnen", collapse: "Gruppe einklappen", expand: "Gruppe ausklappen",
    renameGroup: "Gruppe umbenennen…", ungroup: "Gruppierung aufheben", goHome: "Zum Start",
    notif: "Benachrichtigungen", recent: "Neueste", noNotif: "Keine Benachrichtigungen",
    dndBanner: "Nicht stören aktiv — Hinweise pausiert.", dndDisable: "Deaktivieren",
    dnd: "Nicht stören", themeDark: "Dunkles Thema", themeLight: "Helles Thema", themeBlack: "Schwarzes Thema (AMOLED)", expandedBar: "Erweiterte Leiste",
    selected: (n) => n + " ausgewählt", moveToSpace: "In Bereich verschieben", newAccountOf: (n) => "Neues " + n + "-Konto",
    emptyStage: "Füge einen Dienst hinzu, um zu starten", accountNamePh: "Arbeit, Privat…", nameLabel: "Kontoname:",
  };
  const LANGS = { en: EN, es: ES, pt: PT, fr: FR, de: DE };
  const NAMES = { en: "English", es: "Español", pt: "Português", fr: "Français", de: "Deutsch" };
  const saved = (() => { try { return localStorage.getItem("perseo.lang"); } catch { return null; } })();
  const lang = LANGS[saved] ? saved : (() => {
    const l = ((navigator.language || navigator.userLanguage || "en").slice(0, 2)).toLowerCase();
    return LANGS[l] ? l : "en";
  })();
  const D = LANGS[lang];
  window.tLang = lang;
  window.tLangs = NAMES;
  window.setLang = function (l) { try { localStorage.setItem("perseo.lang", l); } catch {} location.reload(); };
  window.t = function (key, ...args) {
    let v = D[key] !== undefined ? D[key] : EN[key];
    if (v === undefined) return key;
    return typeof v === "function" ? v(...args) : v;
  };
})();
