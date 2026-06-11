/* ============================================================
   bookshelf.js — Logique de la page bookshelf.html
   Favoris : filtres par statut de lecture, recherche, suppression
   ============================================================ */

const shelfGrid = document.getElementById("shelf");
const emptyBox = document.getElementById("empty-shelf");
const subtitle = document.getElementById("shelf-subtitle");
const filterTabs = document.getElementById("filter-tabs");
const shelfSearch = document.getElementById("shelf-search");

const STATUS_LABELS = {
    toread: "À lire",
    reading: "En cours",
    read: "Lu"
};

// Filtres courants
let activeStatus = "all";
let searchTerm = "";

/** Crée la carte d'un livre favori : statut de lecture + suppression. */
function createShelfCard(book) {
    const card = document.createElement("div");
    card.className = "book-card shelf-card";

    const coverUrl = getCoverUrl(book.cover, "M");
    const cover = coverUrl
        ? `<img src="${coverUrl}" alt="Couverture de ${escapeHtml(book.title)}" loading="lazy">`
        : `<div class="cover-placeholder">${icon("bookOpen", 36)}<p>${escapeHtml(book.title)}</p></div>`;

    const status = book.status || "toread";
    const options = Object.entries(STATUS_LABELS)
        .map(([value, label]) =>
            `<option value="${value}" ${value === status ? "selected" : ""}>${label}</option>`)
        .join("");

    card.innerHTML = `
        <a href="book.html?id=${encodeURIComponent(book.id)}" class="card-link">
            <div class="book-cover">
                ${cover}
                <span class="status-chip status-${status}">${STATUS_LABELS[status]}</span>
            </div>
            <div class="book-info">
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author">${escapeHtml(book.author || "Auteur inconnu")}</p>
                <p class="book-year">${icon("calendar", 13)} ${book.year || "—"}</p>
            </div>
        </a>
        <div class="shelf-actions">
            <select class="status-select" aria-label="Statut de lecture">${options}</select>
            <button class="btn-remove" title="Retirer de ma bibliothèque">${icon("trash", 15)}</button>
        </div>`;

    card.querySelector(".status-select").addEventListener("change", (event) => {
        setFavoriteStatus(book.id, event.target.value);
        renderShelf();
    });

    card.querySelector(".btn-remove").addEventListener("click", () => {
        removeFavorite(book.id);
        renderShelf();
    });

    return card;
}

/** Applique les filtres courants à la liste des favoris. */
function filterFavorites(favorites) {
    return favorites.filter((book) => {
        const status = book.status || "toread";
        if (activeStatus !== "all" && status !== activeStatus) return false;
        if (searchTerm) {
            const haystack = `${book.title} ${book.author || ""}`.toLowerCase();
            if (!haystack.includes(searchTerm)) return false;
        }
        return true;
    });
}

/** Affiche les livres sauvegardés selon les filtres (ou l'état vide). */
function renderShelf() {
    const favorites = getFavorites();
    const visible = filterFavorites(favorites);
    shelfGrid.innerHTML = "";
    updateFavCount();

    subtitle.textContent = favorites.length === 0
        ? "Aucun livre sauvegardé"
        : `${favorites.length} livre${favorites.length > 1 ? "s" : ""} dans votre bibliothèque`;

    if (favorites.length === 0) {
        emptyBox.hidden = false;
        emptyBox.innerHTML = `Votre bibliothèque est vide pour le moment.<br>
            <a href="index.html" class="btn btn-primary empty-cta">${icon("search", 16)} Découvrir des livres</a>`;
        return;
    }

    if (visible.length === 0) {
        emptyBox.hidden = false;
        emptyBox.innerHTML = "Aucun livre ne correspond à ce filtre.";
        return;
    }

    emptyBox.hidden = true;
    visible.forEach((book) => shelfGrid.appendChild(createShelfCard(book)));
}

filterTabs.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if (!tab) return;
    activeStatus = tab.dataset.status;
    filterTabs.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    renderShelf();
});

shelfSearch.addEventListener("input", () => {
    searchTerm = shelfSearch.value.trim().toLowerCase();
    renderShelf();
});

initTheme();
renderShelf();
