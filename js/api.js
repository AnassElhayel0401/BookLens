/* ============================================================
   api.js — Toutes les fonctions d'appel à l'API Open Library
   API : https://openlibrary.org (gratuite, sans clé)
   ============================================================ */

const OL_BASE = "https://openlibrary.org";
const OL_COVERS = "https://covers.openlibrary.org/b/id";

/**
 * Recherche de livres (générale, par titre ou par auteur).
 * @param {string} query - texte recherché
 * @param {string} type  - "q" (général) | "title" | "author"
 * @param {number} limit - nombre max de résultats
 * @returns {Promise<Array>} tableau de documents (docs)
 */
async function searchBooks(query, type = "q", limit = 20) {
    const param = ["title", "author"].includes(type) ? type : "q";
    const url = `${OL_BASE}/search.json?${param}=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur API Open Library (${response.status})`);
    }
    const data = await response.json();
    return data.docs || [];
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

/** Ajoute un livre (objet {id, title, author, year, cover}) s'il n'y est pas déjà. */
function addFavorite(book) {
    const favorites = getFavorites();
    if (!favorites.some((b) => b.id === book.id)) {
        favorites.push(book);
        saveFavorites(favorites);
    }
}

/** Retire un livre des favoris par son identifiant. */
function removeFavorite(workId) {
    saveFavorites(getFavorites().filter((book) => book.id !== workId));
}
