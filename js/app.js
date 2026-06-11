/* ============================================================
   app.js — Logique de la page index.html
   Recherche, tri, pagination, tendances, favoris rapides
   ============================================================ */

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchType = document.getElementById("search-type");
const searchBtn = document.getElementById("search-btn");
const sortSelect = document.getElementById("sort-select");
const toolbar = document.getElementById("toolbar");
const sectionTitle = document.getElementById("section-title");
const resultsGrid = document.getElementById("results");
const statusBox = document.getElementById("status");
const resultsCount = document.getElementById("results-count");
const loadMoreBtn = document.getElementById("load-more");

const PAGE_SIZE = 20;

// État de la recherche courante (pour le tri et la pagination)
const state = {
    query: "",
    type: "q",
    sort: "",
    page: 1,
    numFound: 0
};

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

/** Mémorise les infos d'un résultat pour enrichir la page détail. */
function cacheDoc(workId, doc, author) {
    sessionStorage.setItem("booklens_doc_" + workId, JSON.stringify({
        title: doc.title,
        author: author,
        year: doc.first_publish_year || null,
        cover: doc.cover_i || null,
        rating: doc.ratings_average || null,
        pages: doc.number_of_pages_median || null
    }));
}

/** Crée la carte HTML d'un livre, avec bouton favori sur la couverture. */
function createBookCard(doc) {
    const workId = doc.key.replace("/works/", "");
    const coverUrl = getCoverUrl(doc.cover_i, "M");
    const author = doc.author_name ? doc.author_name.join(", ") : "Auteur inconnu";
    const year = doc.first_publish_year || "—";
    const rating = doc.ratings_average
        ? `<span class="card-rating">${icon("star", 13, true)} ${doc.ratings_average.toFixed(1)}</span>`
        : "";

    const card = document.createElement("div");
    card.className = "book-card";

    const cover = coverUrl
        ? `<img src="${coverUrl}" alt="Couverture de ${escapeHtml(doc.title)}" loading="lazy">`
        : `<div class="cover-placeholder">${icon("bookOpen", 36)}<p>${escapeHtml(doc.title)}</p></div>`;

    card.innerHTML = `
        <a href="book.html?id=${workId}" class="card-link">
            <div class="book-cover">${cover}</div>
            <div class="book-info">
                <h3 class="book-title">${escapeHtml(doc.title)}</h3>
                <p class="book-author">${escapeHtml(author)}</p>
                <p class="book-year">${icon("calendar", 13)} ${year} ${rating}</p>
            </div>
        </a>
        <button class="fav-toggle" title="Ajouter à ma bibliothèque" aria-label="Ajouter à ma bibliothèque"></button>`;

    card.querySelector(".card-link").addEventListener("click", () => {
        cacheDoc(workId, doc, author);
    });

    // Bouton cœur : ajout / retrait direct depuis la grille
    const favBtn = card.querySelector(".fav-toggle");

    function renderFav() {
        const saved = isFavorite(workId);
        favBtn.innerHTML = icon("heart", 17, saved);
        favBtn.classList.toggle("is-saved", saved);
        favBtn.title = saved ? "Retirer de ma bibliothèque" : "Ajouter à ma bibliothèque";
    }

    favBtn.addEventListener("click", (event) => {
        event.preventDefault();
        if (isFavorite(workId)) {
            removeFavorite(workId);
        } else {
            addFavorite({
                id: workId,
                title: doc.title,
                author: author,
                year: doc.first_publish_year || null,
                cover: doc.cover_i || null
            });
        }
        renderFav();
        updateFavCount();
    });

    renderFav();
    return card;
}

/** Lance une recherche (page 1) ou charge la page suivante (append=true). */
async function runSearch(append = false) {
    if (!append) {
        state.page = 1;
        resultsGrid.innerHTML = "";
        toolbar.hidden = true;
        sectionTitle.hidden = true;
        loadMoreBtn.hidden = true;
        showStatus("Recherche en cours…", "loading");
    } else {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = "Chargement…";
    }

    try {
        const { docs, numFound } = await searchBooks(
            state.query, state.type, PAGE_SIZE, state.page, state.sort
        );
        hideStatus();
        state.numFound = numFound;

        if (!append && docs.length === 0) {
            showStatus(`Aucun résultat pour « ${escapeHtml(state.query)} ». Essayez un autre terme.`, "empty");
            return;
        }

        toolbar.hidden = false;
        resultsCount.textContent =
            `${numFound.toLocaleString("fr-FR")} résultat${numFound > 1 ? "s" : ""} pour « ${state.query} »`;

        docs.forEach((doc) => resultsGrid.appendChild(createBookCard(doc)));

        // Bouton "Charger plus" si d'autres pages existent
        const shown = state.page * PAGE_SIZE;
        loadMoreBtn.hidden = shown >= numFound;
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Charger plus de résultats";
    } catch (error) {
        showStatus(`Une erreur est survenue : ${escapeHtml(error.message)}. Vérifiez votre connexion.`, "error");
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = "Charger plus de résultats";
    }
}

/** Affiche les livres tendances du jour (page d'accueil). */
async function loadTrending() {
    sectionTitle.hidden = false;
    sectionTitle.innerHTML = `${icon("trending", 20)} Tendances du jour`;
    showStatus("Chargement des tendances…", "loading");

    try {
        const works = await getTrendingBooks(12);
        hideStatus();
        works.forEach((doc) => resultsGrid.appendChild(createBookCard(doc)));
    } catch (error) {
        showStatus("Impossible de charger les tendances. Lancez une recherche ci-dessus.", "empty");
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    state.query = query;
    state.type = searchType.value;
    runSearch();
});

sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    if (state.query) runSearch();
});

loadMoreBtn.addEventListener("click", () => {
    state.page += 1;
    runSearch(true);
});

/* ---------- Initialisation ---------- */

searchBtn.innerHTML = `${icon("search", 18)} Rechercher`;
initTheme();
updateFavCount();

// Recherche directe via l'URL (ex: index.html?q=fantasy — utilisé par les tags)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("q")) {
    state.query = urlParams.get("q");
    state.type = ["title", "author"].includes(urlParams.get("type")) ? urlParams.get("type") : "q";
    searchInput.value = state.query;
    searchType.value = state.type;
    runSearch();
} else {
    loadTrending();
}
