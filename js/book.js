/* ============================================================
   book.js — Logique de la page book.html (détail d'un livre)
   ============================================================ */

const statusBox = document.getElementById("status");
const detailArticle = document.getElementById("book-detail");

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

/** Génère les étoiles SVG à partir d'une note sur 5. */
function ratingStars(rating) {
    const full = Math.round(rating);
    let stars = "";
    for (let i = 1; i <= 5; i++) {
        stars += icon("star", 15, i <= full);
    }
    return stars;
}

/** Configure le bouton "Ajouter / Retirer de ma bibliothèque". */
function setupFavButton(book) {
    const btn = document.getElementById("fav-btn");

    function render() {
        if (isFavorite(book.id)) {
            btn.innerHTML = `${icon("check", 18)} Dans ma bibliothèque`;
            btn.classList.add("btn-saved");
        } else {
            btn.innerHTML = `${icon("heart", 18)} Ajouter à ma bibliothèque`;
            btn.classList.remove("btn-saved");
        }
    }

    btn.addEventListener("click", () => {
        if (isFavorite(book.id)) {
            removeFavorite(book.id);
        } else {
            addFavorite(book);
        }
        render();
        updateFavCount();
    });

    render();
}

/** Récupère les noms des auteurs depuis l'API (clé /authors/...). */
async function fetchAuthorNames(work) {
    if (!work.authors || work.authors.length === 0) return null;
    try {
        const names = await Promise.all(
            work.authors.slice(0, 4).map(async (entry) => {
                const key = entry.author ? entry.author.key : entry.key;
                const author = await getAuthor(key);
                return author.name;
            })
        );
        return names.filter(Boolean).join(", ");
    } catch (e) {
        return null;
    }
}

/** La description d'une œuvre peut être une chaîne ou un objet {value}. */
function extractDescription(work) {
    if (!work.description) return null;
    return typeof work.description === "string"
        ? work.description
        : work.description.value;
}

/** Charge et affiche le détail complet du livre. */
async function loadBook() {
    const params = new URLSearchParams(window.location.search);
    const workId = params.get("id");

    if (!workId) {
        showStatus("Aucun livre sélectionné. <a href='index.html'>Retour à la recherche</a>", "error");
        return;
    }

    showStatus("Chargement du livre…", "loading");

    // Infos déjà connues depuis la page de recherche (si on vient de là)
    let cached = null;
    try {
        cached = JSON.parse(sessionStorage.getItem("booklens_doc_" + workId));
    } catch (e) { /* ignore */ }

    try {
        const work = await getWorkDetails(workId);
        hideStatus();

        const title = work.title || (cached && cached.title) || "Titre inconnu";
        const coverId = (cached && cached.cover) ||
            (work.covers && work.covers.length > 0 ? work.covers[0] : null);

        document.title = `${title} — BookLens`;
        document.getElementById("detail-title").textContent = title;

        // Couverture HD
        const coverBox = document.getElementById("detail-cover-box");
        const coverUrl = getCoverUrl(coverId, "L");
        coverBox.innerHTML = coverUrl
            ? `<img src="${coverUrl}" alt="Couverture de ${escapeHtml(title)}">`
            : `<div class="cover-placeholder cover-placeholder-lg">${icon("bookOpen", 48)}<p>${escapeHtml(title)}</p></div>`;

        // Lien vers la fiche Open Library
        const olLink = document.getElementById("ol-link");
        olLink.href = `https://openlibrary.org/works/${workId}`;
        olLink.innerHTML = `${icon("external", 16)} Voir sur Open Library`;

        // Auteur(s) : cache de la recherche, sinon appel API
        let author = cached && cached.author ? cached.author : null;
        if (!author) {
            author = await fetchAuthorNames(work);
        }
        document.getElementById("detail-author").textContent =
            author ? `par ${author}` : "Auteur inconnu";

        // Métadonnées : année, note, pages
        const rating = (cached && cached.rating) || (await getWorkRating(workId));
        const metaItems = [];
        if (cached && cached.year) {
            metaItems.push(`<span class="meta-item">${icon("calendar", 15)} Première publication : ${cached.year}</span>`);
        }
        if (rating) {
            metaItems.push(`<span class="meta-item meta-rating">${ratingStars(rating)} ${rating.toFixed(2)} / 5</span>`);
        }
        if (cached && cached.pages) {
            metaItems.push(`<span class="meta-item">${icon("pages", 15)} ${cached.pages} pages (médiane)</span>`);
        }
        document.getElementById("detail-meta").innerHTML = metaItems.join("");

        // Description
        const description = extractDescription(work);
        document.getElementById("detail-description").textContent =
            description || "Aucune description disponible pour ce livre.";

        // Sujets / genres — chaque tag relance une recherche sur le sujet
        const subjectsBox = document.getElementById("detail-subjects");
        if (work.subjects && work.subjects.length > 0) {
            subjectsBox.innerHTML = work.subjects
                .slice(0, 15)
                .map((s) => `<a class="tag" href="index.html?q=${encodeURIComponent(s)}">${icon("tag", 13)} ${escapeHtml(s)}</a>`)
                .join("");
        } else {
            subjectsBox.innerHTML = "<p class='muted'>Aucun sujet renseigné.</p>";
        }

        // Bouton favoris
        setupFavButton({
            id: workId,
            title: title,
            author: author || "Auteur inconnu",
            year: cached ? cached.year : null,
            cover: coverId
        });

        detailArticle.hidden = false;
    } catch (error) {
        showStatus(`Impossible de charger ce livre : ${escapeHtml(error.message)}`, "error");
    }
}

document.getElementById("back-link").innerHTML = `${icon("arrowLeft", 16)} Retour à la recherche`;
initTheme();
updateFavCount();
loadBook();
