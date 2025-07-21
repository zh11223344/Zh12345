const hamburger = document.getElementById('hamburger');
const navLinks = document.querySelector('.nav-links');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const favoriteBtn = document.getElementById('favoriteBtn');
const userRating = document.getElementById('userRating');
const gameRating = document.getElementById('gameRating');
const averageRatingSpan = document.getElementById('averageRating');

let allGames = [];
let visibleGamesCount = 8;

hamburger.setAttribute('tabindex', '0');
hamburger.addEventListener('click', () => {
    const expanded = hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', expanded);
});

hamburger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        hamburger.click();
    }
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        navLinks.querySelectorAll('a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

async function loadGameData() {
    try {
        document.getElementById('searchLoading').style.display = 'block';
        const response = await fetch('assets/games.json', { priority: 'high' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allGames = await response.json();
        const game = allGames.find(g => g.id === gameId);
        if (game) {
            document.getElementById('pageTitle').textContent = `${game.name} - Zontal Arcade`;
            document.getElementById('gameName').textContent = game.name;
            document.getElementById('gameCategory').innerHTML = `Category: ${game.category} | Rating: <span id="averageRating">${game.averageRating}</span>/5`;
            document.getElementById('gameImage').src = game.image;
            document.getElementById('gameImage').alt = game.name;
            document.getElementById('gameDescription').textContent = game.description;
            document.getElementById('gameIframe').src = game.game_url;
            document.getElementById('gameIframe').title = `${game.name} Game`;
            updateAverageRating(game.averageRating);
        } else {
            document.querySelector('.game-container').innerHTML = '<p style="color: #f8fafc; text-align: center;">Game not found.</p>';
        }
        document.getElementById('searchLoading').style.display = 'none';
        renderMoreGames();
        setupIntersectionObserver();
        setupLiveSearch();
    } catch (error) {
        console.error('Error loading game data:', error);
        document.getElementById('searchLoading').style.display = 'none';
        document.querySelector('.game-container').innerHTML = '<p style="color: #f8fafc; text-align: center;">Failed to load game data. Please try again later.</p>';
    }
}
async function preloadGameURLs() {
    try {
        const response = await fetch('/games.json', { priority: 'high' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const games = await response.json();
        const head = document.head;
        games.forEach(game => {
            if (game.game_url) {
                const preloadLink = document.createElement('link');
                preloadLink.rel = 'preload';
                preloadLink.href = game.game_url;
                preloadLink.as = 'document';
                preloadLink.crossOrigin = 'anonymous';
                head.appendChild(preloadLink);
            }
        });
    } catch (error) {
        console.error('Error preloading game URLs:', error);
    }
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function setFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function updateFavoriteButton() {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(gameId);
    favoriteBtn.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    favoriteBtn.classList.toggle('active', isFavorite);
}

favoriteBtn.addEventListener('click', () => {
    const favorites = getFavorites();
    if (favorites.includes(gameId)) {
        setFavorites(favorites.filter(id => id !== gameId));
    } else {
        favorites.push(gameId);
        setFavorites(favorites);
    }
    updateFavoriteButton();
});

function getUserRatings() {
    return JSON.parse(localStorage.getItem('userRatings') || '{}');
}

function setUserRating(rating) {
    const ratings = getUserRatings();
    ratings[gameId] = rating;
    localStorage.setItem('userRatings', JSON.stringify(ratings));
    updateAverageRating();
}

function updateAverageRating(defaultRating = null) {
    const ratings = getUserRatings();
    const userRating = ratings[gameId] || 0;
    const averageRating = userRating || defaultRating || 0;
    averageRatingSpan.textContent = averageRating;
    const stars = gameRating.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.classList.toggle('filled', index < averageRating);
    });
    userRatingStars.forEach((star, index) => {
        star.classList.toggle('filled', index < userRating);
    });
}

const userRatingStars = userRating.querySelectorAll('.star');
userRatingStars.forEach(star => {
    star.addEventListener('click', () => {
        const rating = parseInt(star.dataset.value);
        setUserRating(rating);
    });
    star.addEventListener('mouseover', () => {
        userRatingStars.forEach((s, index) => {
            s.classList.toggle('filled', index < star.dataset.value);
        });
    });
    star.addEventListener('mouseout', () => {
        const currentRating = getUserRatings()[gameId] || 0;
        userRatingStars.forEach((s, index) => {
            s.classList.toggle('filled', index < currentRating);
        });
    });
});

fullscreenBtn.addEventListener('click', () => {
    const iframeContainer = document.querySelector('.game-iframe-container');
    if (!document.fullscreenElement) {
        iframeContainer.requestFullscreen().then(() => {
            fullscreenBtn.textContent = 'Exit Fullscreen';
            fullscreenBtn.classList.add('active');
        }).catch(err => console.error('Fullscreen error:', err));
    } else {
        document.exitFullscreen().then(() => {
            fullscreenBtn.textContent = 'Enter Fullscreen';
            fullscreenBtn.classList.remove('active');
        }).catch(err => console.error('Exit fullscreen error:', err));
    }
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fullscreenBtn.textContent = 'Enter Fullscreen';
        fullscreenBtn.classList.remove('active');
    } else {
        fullscreenBtn.textContent = 'Exit Fullscreen';
        fullscreenBtn.classList.add('active');
    }
});

function createGameCard(game) {
    const card = document.createElement('a');
    card.href = game.url;
    card.className = 'game-card';
    card.dataset.name = game.name.toLowerCase();
    card.dataset.category = game.category;
    if (game.featured) card.dataset.featured = 'true';
    if (game.isPopular) card.dataset.popular = 'true';

    const img = document.createElement('img');
    img.src = game.image;
    img.alt = `${game.name} ${game.category}`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = game.featured || game.isPopular ? 'high' : 'low';
    img.width = game.featured ? 300 : (game.isPopular ? 200 : 150);
    img.height = game.featured ? 300 : (game.isPopular ? 200 : 150);
    img.style.aspectRatio = '1/1';

    const title = document.createElement('h3');
    title.textContent = game.name;

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'rating';
    const userRatings = getUserRatings();
    const rating = userRatings[game.id] || game.averageRating;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = `star ${i <= rating ? 'filled' : ''}`;
        star.textContent = '★';
        ratingDiv.appendChild(star);
    }

    const statusDiv = document.createElement('div');
    statusDiv.className = 'game-status';
    if (game.featured) {
        const featuredIcon = document.createElement('span');
        featuredIcon.className = 'icon featured';
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '★';
        featuredIcon.appendChild(iconSpan);
        statusDiv.appendChild(featuredIcon);
    }
    if (game.isPopular) {
        const popularIcon = document.createElement('span');
        popularIcon.className = 'icon popular';
        const iconSpan = document.createElement('span');
        iconSpan.textContent = '🔥';
        popularIcon.appendChild(iconSpan);
        statusDiv.appendChild(popularIcon);
    }

    card.appendChild(statusDiv);
    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(ratingDiv);
    return card;
}

function renderMoreGames() {
    const gameGrid = document.getElementById('moreGames');
    gameGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const gamesToShow = allGames
        .filter(game => game.id !== gameId)
        .slice(0, visibleGamesCount);

    if (gamesToShow.length === 0) {
        const noGames = document.createElement('p');
        noGames.textContent = 'No more games found';
        noGames.style.color = '#f8fafc';
        noGames.style.textAlign = 'center';
        gameGrid.appendChild(noGames);
    } else {
        gamesToShow.forEach(game => {
            const card = createGameCard(game);
            fragment.appendChild(card);
        });
        gameGrid.appendChild(fragment);
    }
    document.getElementById('loadMore').style.display = gamesToShow.length >= allGames.length - 1 ? 'none' : 'block';
}

function setupLiveSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchGrid = document.getElementById('searchGrid');

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        searchGrid.innerHTML = '';
        searchResults.classList.toggle('active', query.length > 0);

        if (query.length > 0) {
            const filteredGames = allGames.filter(game =>
                game.id !== gameId &&
                (game.name.toLowerCase().includes(query) ||
                    game.category.toLowerCase().includes(query) ||
                    game.description.toLowerCase().includes(query))
            );

            if (filteredGames.length > 0) {
                const fragment = document.createDocumentFragment();
                filteredGames.forEach(game => {
                    const card = createGameCard(game);
                    fragment.appendChild(card);
                });
                searchGrid.appendChild(fragment);
            } else {
                const noResults = document.createElement('p');
                noResults.textContent = 'No results found';
                noResults.style.color = '#f8fafc';
                noResults.style.textAlign = 'center';
                searchGrid.appendChild(noResults);
            }
        }
    });
}

function setupIntersectionObserver() {
    if (window.innerWidth > 767) return;
    const observer = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.intersectionRatio >= 0.5) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.remove('visible');
                }
            });
        },
        { threshold: 0.5 }
    );

    const cards = document.querySelectorAll('.game-card');
    cards.forEach(card => observer.observe(card));
}

const loadMoreBtn = document.getElementById('loadMore');
loadMoreBtn.addEventListener('click', () => {
    visibleGamesCount += 8;
    renderMoreGames();
});

window.addEventListener('load', () => {
    preloadGameURLs();
    loadGameData();
    updateFavoriteButton();
    updateAverageRating();
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(error => console.error('Service Worker registration failed:', error));
}