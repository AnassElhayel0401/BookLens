/* ============================================================
   bookshelf.js — Logique de la page bookshelf.html (favoris)
   ============================================================ */

const shelfGrid = document.getElementById("shelf");
const emptyBox = document.getElementById("empty-shelf");
const subtitle = document.getElementById("shelf-subtitle");

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}

function updateFavCount() {
    const badge = document.getElementById("fav-count");
    if (!badge) return;
    const count = getFavorites().length;
    badge.textContent = count > 0 ? count : "";
}

/** Crée la carte d'un livre favori, avec bouton de suppression. */
function createShelfCard(book) {
    const card = document.createElement("div");
    card.className = "book-card shelf-card";

    const coverUrl = getCoverUrl(book.cover, "M");
    const cover = coverUrl
        ? `<img src="${coverUrl}" alt="Couverture de ${escapeHtml(book.title)}" loading="lazy">`
        : `<div class="cover-placeholder"><span>📚</span><p>${escapeHtml(book.title)}</p></div>`;

    card.innerHTML = `
        <a href="book.html?id=${encodeURIComponent(book.id)}" class="card-link">
            <div class="book-cover">${cover}</div>
            <div class="book-info">
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author || "Auteur inconnu")}</p>
                <p class="book-year">${book.year || "—"}</p>
            </div>
        </a>
        <button class="btn btn-remove" title="Retirer de ma bibliothèque">✕ Retirer</button>`;

    card.querySelector(".btn-remove").addEventListener("click", () => {
        removeFavorite(book.id);
        renderShelf();
    });

    return card;
}

/** Affiche tous les livres sauvegardés (ou l'état vide). */
function renderShelf() {
    const favorites = getFavorites();
    shelfGrid.innerHTML = "";
    updateFavCount();

    if (favorites.length === 0) {
        emptyBox.hidden = false;
        subtitle.textContent = "Aucun livre sauvegardé";
        return;
    }

    emptyBox.hidden = true;
    subtitle.textContent = `${favorites.length} livre${favorites.length > 1 ? "s" : ""} sauvegardé${favorites.length > 1 ? "s" : ""}`;
    favorites.forEach((book) => shelfGrid.appendChild(createShelfCard(book)));
}

renderShelf();
