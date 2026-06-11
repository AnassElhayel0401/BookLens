/* ============================================================
   api.js — Appels à l'API Open Library + utilitaires partagés
   API : https://openlibrary.org (gratuite, sans clé)
   ============================================================ */

const OL_BASE = "https://openlibrary.org";
const OL_COVERS = "https://covers.openlibrary.org/b/id";

/* ============================================================
   Icônes SVG (style Lucide) — partagées par les 3 pages
   ============================================================ */

const ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pages: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'
};

/**
 * Génère une icône SVG inline.
 * @param {string} name   - clé de ICON_PATHS
 * @param {number} size   - taille en px
 * @param {boolean} filled - icône remplie (cœur/étoile actifs)
 * @returns {string} balise <svg>
 */
function icon(name, size = 18, filled = false) {
    const fill = filled ? "currentColor" : "none";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon" aria-hidden="true">${ICON_PATHS[name] || ""}</svg>`;
}

/* ============================================================
   Appels API
   ============================================================ */

/**
 * Recherche de livres (générale, par titre ou par auteur).
 * @param {string} query - texte recherché
 * @param {string} type  - "q" (général) | "title" | "author"
 * @param {number} limit - nombre de résultats par page
 * @param {number} page  - numéro de page (pagination)
 * @param {string} sort  - "" (pertinence) | "new" | "old" | "rating"
 * @returns {Promise<{docs: Array, numFound: number}>}
 */
async function searchBooks(query, type = "q", limit = 20, page = 1, sort = "") {
    const param = ["title", "author"].includes(type) ? type : "q";
    let url = `${OL_BASE}/search.json?${param}=${encodeURIComponent(query)}&limit=${limit}&page=${page}`;
    if (sort) url += `&sort=${sort}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur API Open Library (${response.status})`);
    }
    const data = await response.json();
    return { docs: data.docs || [], numFound: data.numFound || 0 };
}

/**
 * Livres tendances du jour sur Open Library.
 * @param {number} limit - nombre de livres
 * @returns {Promise<Array>}
 */
async function getTrendingBooks(limit = 12) {
    const response = await fetch(`${OL_BASE}/trending/daily.json?limit=${limit}`);
    if (!response.ok) {
        throw new Error(`Erreur API Open Library (${response.status})`);
    }
    const data = await response.json();
    return (data.works || []).slice(0, limit);
}

/**
 * Détail d'une œuvre (description, sujets, couvertures...).
 * @param {string} workId - identifiant, ex: "OL45804W"
 * @returns {Promise<Object>}
 */
async function getWorkDetails(workId) {
    const response = await fetch(`${OL_BASE}/works/${workId}.json`);
    if (!response.ok) {
        throw new Error(`Livre introuvable (${response.status})`);
    }
    return response.json();
}

/**
 * Note moyenne d'une œuvre.
 * @param {string} workId - identifiant, ex: "OL45804W"
 * @returns {Promise<number|null>} note moyenne sur 5, ou null
 */
async function getWorkRating(workId) {
    try {
        const response = await fetch(`${OL_BASE}/works/${workId}/ratings.json`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.summary && data.summary.average ? data.summary.average : null;
    } catch (e) {
        return null;
    }
}

/**
 * Détail d'un auteur.
 * @param {string} authorKey - ex: "/authors/OL23919A" ou "OL23919A"
 * @returns {Promise<Object>}
 */
async function getAuthor(authorKey) {
    const id = authorKey.replace("/authors/", "");
    const response = await fetch(`${OL_BASE}/authors/${id}.json`);
    if (!response.ok) {
        throw new Error(`Auteur introuvable (${response.status})`);
    }
    return response.json();
}

/**
 * URL d'une couverture de livre.
 * @param {number} coverId - champ cover_i de la recherche
 * @param {string} size    - "S", "M" ou "L"
 * @returns {string|null}
 */
function getCoverUrl(coverId, size = "M") {
    if (!coverId) return null;
    return `${OL_COVERS}/${coverId}-${size}.jpg`;
}

/* ============================================================
   Favoris — stockage en localStorage (partagé par les 3 pages)
   Chaque favori : {id, title, author, year, cover, status, addedAt}
   status : "toread" | "reading" | "read"
   ============================================================ */

const FAVORITES_KEY = "booklens_favorites";

/** @returns {Array} liste des livres favoris */
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
    } catch (e) {
        return [];
    }
}

/** @param {Array} favorites */
function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/** @param {string} workId @returns {boolean} */
function isFavorite(workId) {
    return getFavorites().some((book) => book.id === workId);
}

/** Ajoute un livre s'il n'y est pas déjà. */
function addFavorite(book) {
    const favorites = getFavorites();
    if (!favorites.some((b) => b.id === book.id)) {
        favorites.push({ status: "toread", addedAt: Date.now(), ...book });
        saveFavorites(favorites);
    }
}

/** Retire un livre des favoris par son identifiant. */
function removeFavorite(workId) {
    saveFavorites(getFavorites().filter((book) => book.id !== workId));
}

/** Change le statut de lecture d'un favori. */
function setFavoriteStatus(workId, status) {
    const favorites = getFavorites();
    const book = favorites.find((b) => b.id === workId);
    if (book) {
        book.status = status;
        saveFavorites(favorites);
    }
}

/* ============================================================
   Utilitaires partagés
   ============================================================ */

/** Échappe les caractères HTML pour éviter toute injection. */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

/** Met à jour le compteur de favoris dans la barre de navigation. */
function updateFavCount() {
    const badge = document.getElementById("fav-count");
    if (!badge) return;
    const count = getFavorites().length;
    badge.textContent = count > 0 ? count : "";
}

/** Mode sombre : initialise le thème et le bouton de bascule. */
function initTheme() {
    const root = document.documentElement;
    root.dataset.theme = localStorage.getItem("booklens_theme") || "light";

    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    function render() {
        const dark = root.dataset.theme === "dark";
        btn.innerHTML = icon(dark ? "sun" : "moon", 20);
        btn.title = dark ? "Passer en mode clair" : "Passer en mode sombre";
    }

    btn.addEventListener("click", () => {
        root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
        localStorage.setItem("booklens_theme", root.dataset.theme);
        render();
    });

    render();
}
