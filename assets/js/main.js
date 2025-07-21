const hamburger = document.getElementById('hamburger');
        const navLinks = document.querySelector('.nav-links');

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

        let allGames = [];
        let visibleGamesCount = 8;

        async function loadGames() {
            try {
                document.getElementById('searchLoading').style.display = 'block';
                const response = await fetch('assets/games.json', { priority: 'high' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allGames = await response.json();
                document.getElementById('searchLoading').style.display = 'none';
                renderHomepageGames();
                setupIntersectionObserver();
                setupLiveSearch();
            } catch (error) {
                console.error('Error loading games:', error);
                document.getElementById('searchLoading').style.display = 'none';
                const gameGrid = document.getElementById('zon_games');
                gameGrid.innerHTML = '<p style="color: #f8fafc; text-align: center;">Failed to load games. Please try again later.</p>';
            }
        }

        function getFavorites() {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        }

        function getUserRatings() {
            return JSON.parse(localStorage.getItem('userRatings') || '{}');
        }

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

        function renderHomepageGames() {
            const gameGrid = document.getElementById('zon_games');
            const sectionTitle = document.getElementById('sectionTitle');
            gameGrid.innerHTML = '';
            const fragment = document.createDocumentFragment();
            let gamesToShow = allGames;

            if (window.location.pathname.includes('favorites.html')) {
                const favorites = getFavorites();
                gamesToShow = allGames.filter(game => favorites.includes(game.id));
                sectionTitle.textContent = 'Favorite Games';
            } else {
                sectionTitle.textContent = 'All Games';
                gamesToShow = allGames.filter(game => game.onHomepage !== false);
                gamesToShow = gamesToShow.slice(0, visibleGamesCount);
            }

            if (gamesToShow.length === 0) {
                const noGames = document.createElement('p');
                noGames.textContent = window.location.pathname.includes('favorites.html') ? 'No favorite games yet.' : 'No games available.';
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

            document.getElementById('loadMore').style.display =
                window.location.pathname.includes('favorites.html') ||
                gamesToShow.length >= allGames.filter(g => g.onHomepage !== false).length
                    ? 'none'
                    : 'block';
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
                        game.name.toLowerCase().includes(query) ||
                        game.category.toLowerCase().includes(query) ||
                        game.description.toLowerCase().includes(query)
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

        const loadMoreBtn = document.getElementById('loadMore');
        loadMoreBtn.addEventListener('click', () => {
            visibleGamesCount += 8;
            renderHomepageGames();
        });

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

        window.addEventListener('load', () => {
            loadGames();
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(() => console.log('Service Worker registered'))
                .catch(error => console.error('Service Worker registration failed:', error));
        }