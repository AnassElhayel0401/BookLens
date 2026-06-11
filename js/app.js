/* ============================================================
   app.js — Logique de la page index.html (recherche + grille)
   ============================================================ */

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchType = document.getElementById("search-type");
const resultsGrid = document.getElementById("results");
const statusBox = document.getElementById("status");
const resultsCount = document.getElementById("results-count");

/** Affiche un message d'état (chargement, erreur, vide). */
function showStatus(message, type = "info") {
    statusBox.hidden = false;
    statusBox.className = `status status-${type}`;
    statusBox.innerHTML = type === "loading"
        ? `<span class="spinner"></span> ${message}`
        : message;
}

function hideStatus() {
    statusBox.hidden = true;
}

/** Crée la carte HTML d'un livre de la grille de résultats. */
function createBookCard(doc) {
    const workId = doc.key.replace("/works/", "");
    const coverUrl = getCoverUrl(doc.cover_i, "M");
    const author = doc.author_name ? doc.author_name.join(", ") : "Auteur inconnu";
    const year = doc.first_publish_year || "—";

    const card = document.createElement("a");
    card.className = "book-card";
    card.href = `book.html?id=${workId}`;

    const cover = coverUrl
        ? `<img src="${coverUrl}" alt="Couverture de ${escapeHtml(doc.title)}" loading="lazy">`
        : `<div class="cover-placeholder"><span>📚</span><p>${escapeHtml(doc.title)}</p></div>`;

    card.innerHTML = `
        <div class="book-cover">${cover}</div>
        <div class="book-info">
            <h3 class="book-title">${escapeHtml(doc.title)}</h3>
            <p class="book-author">${escapeHtml(author)}</p>
            <p class="book-year">${year}</p>
        </div>`;

    // On mémorise les infos du résultat pour enrichir la page détail
    card.addEventListener("click", () => {
        sessionStorage.setItem("booklens_doc_" + workId, JSON.stringify({
            title: doc.title,
            author: author,
            year: doc.first_publish_year || null,
            cover: doc.cover_i || null,
            rating: doc.ratings_average || null,
            pages: doc.number_of_pages_median || null
        }));
    });

    return card;
}

/** Échappe les caractères HTML pour éviter toute injection. */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

/** Lance la recherche et affiche les résultats dans la grille. */
async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsGrid.innerHTML = "";
    resultsCount.hidden = true;
    showStatus("Recherche en cours…", "loading");

    try {
        const docs = await searchBooks(query, searchType.value, 20);
        hideStatus();

        if (docs.length === 0) {
            showStatus(`Aucun résultat pour « ${escapeHtml(query)} ». Essayez un autre terme.`, "empty");
            return;
        }

        resultsCount.hidden = false;
        resultsCount.textContent = `${docs.length} résultat${docs.length > 1 ? "s" : ""} pour « ${query} »`;

        docs.forEach((doc) => resultsGrid.appendChild(createBookCard(doc)));
    } catch (error) {
        showStatus(`Une erreur est survenue : ${escapeHtml(error.message)}. Vérifiez votre connexion.`, "error");
    }
}

/** Met à jour le compteur de favoris dans la barre de navigation. */
function updateFavCount() {
    const badge = document.getElementById("fav-count");
    if (!badge) return;
    const count = getFavorites().length;
    badge.textContent = count > 0 ? count : "";
}

searchForm.addEventListener("submit", handleSearch);
updateFavCount();
