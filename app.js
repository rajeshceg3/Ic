// --- GLOBAL STATE ---
let map;
let globalPOIs = [];
let activeTab = 'discover'; // 'discover' or 'logbook'

// --- AUDIO MANAGER ---
const AudioManager = {
    audioEnabled: false,
    currentAudio: null,
    sounds: {
        waterfall: new Audio('https://cdn.freesound.org/previews/515/515822_10823338-lq.mp3'),
        geothermal: new Audio('https://cdn.freesound.org/previews/173/173934_321967-lq.mp3'),
        wind: new Audio('https://cdn.freesound.org/previews/387/387538_7477543-lq.mp3'),
        waves: new Audio('https://cdn.freesound.org/previews/400/400508_4397472-lq.mp3')
    },
    init: function() {
        Object.values(this.sounds).forEach(audio => {
            audio.loop = true;
            audio.volume = 0;
        });
    },
    toggleMute: function() {
        this.audioEnabled = !this.audioEnabled;
        if (!this.audioEnabled && this.currentAudio) {
            this.fadeOut(this.currentAudio);
        } else if (this.audioEnabled && this.currentAudio) {
            this.fadeIn(this.currentAudio);
        }
        return this.audioEnabled;
    },
    playCategory: function(category) {
        let soundKey = 'wind'; // Default ambient
        if (category === 'waterfall') soundKey = 'waterfall';
        else if (category === 'geothermal') soundKey = 'geothermal';
        else if (category === 'landmark' || category === 'beach') soundKey = 'waves';

        const newAudio = this.sounds[soundKey];
        if (this.currentAudio === newAudio) return;

        if (this.currentAudio) {
            this.fadeOut(this.currentAudio);
        }

        this.currentAudio = newAudio;
        if (this.audioEnabled) {
            this.fadeIn(this.currentAudio);
        }
    },
    fadeIn: function(audio) {
        audio.play().catch(e => console.log('Audio play failed:', e));
        let vol = 0;
        audio.volume = 0;
        const fadeInterval = setInterval(() => {
            if (vol < 0.4) {
                vol += 0.05;
                audio.volume = vol;
            } else {
                clearInterval(fadeInterval);
            }
        }, 100);
    },
    fadeOut: function(audio) {
        let vol = audio.volume;
        const fadeInterval = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.05;
                audio.volume = vol;
            } else {
                audio.volume = 0;
                audio.pause();
                clearInterval(fadeInterval);
            }
        }, 100);
    }
};
AudioManager.init();
let favorites = new Set();
let activeCategory = 'All';
let searchTerm = '';

// --- CINEMATIC TOUR STATE ---
let tourInterval = null;
let tourIndex = 0;
let isTourRunning = false;
let currentUtterance = null;

// --- CINEMATIC TOUR LOGIC ---
function startCinematicTour() {
    if (globalPOIs.length === 0) return;
    isTourRunning = true;
    tourIndex = 0;

    // UI feedback
    const tourBtn = document.getElementById('tour-btn');
    if (tourBtn) {
        tourBtn.innerHTML = '<i class="fas fa-stop-circle mr-2"></i> Stop Tour';
        tourBtn.classList.replace('bg-brand-deep', 'bg-brand-lava');
        tourBtn.onclick = stopCinematicTour;
    }

    playNextTourStop();
}

function playNextTourStop() {
    if (!isTourRunning || tourIndex >= globalPOIs.length) {
        stopCinematicTour();
        return;
    }

    if (tourInterval) {
        clearTimeout(tourInterval);
        tourInterval = null;
    }

    const poi = globalPOIs[tourIndex];
    navigateToPOI(poi);

    // TTS narration
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const textToRead = poi.folklore || poi.description;
        currentUtterance = new SpeechSynthesisUtterance(textToRead);

        // Setup timer to go to next stop after speech, or a minimum/maximum duration
        let durationFallback = setTimeout(() => {
            if (isTourRunning) {
                tourIndex++;
                playNextTourStop();
            }
        }, Math.max(8000, textToRead.length * 50)); // Fallback in case onend fails

        currentUtterance.onend = () => {
            clearTimeout(durationFallback);
            if (isTourRunning) {
                tourInterval = setTimeout(() => {
                    tourIndex++;
                    playNextTourStop();
                }, 2000); // Wait 2s after speech finishes
            }
        };

        window.speechSynthesis.speak(currentUtterance);
    } else {
        // Fallback if no TTS
        tourInterval = setTimeout(() => {
            tourIndex++;
            playNextTourStop();
        }, 8000);
    }
}

function stopCinematicTour() {
    isTourRunning = false;
    if (tourInterval) {
        clearTimeout(tourInterval);
        tourInterval = null;
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    // UI feedback reset
    const tourBtn = document.getElementById('tour-btn');
    if (tourBtn) {
        tourBtn.innerHTML = '<i class="fas fa-play-circle mr-2"></i> Start Cinematic Tour';
        tourBtn.classList.replace('bg-brand-lava', 'bg-brand-deep');
        tourBtn.onclick = startCinematicTour;
    }
}

// --- LOGIC & HELPERS ---
function loadFavorites() {
    try {
        const stored = localStorage.getItem('iceland_favorites');
        if (stored) {
            favorites = new Set(JSON.parse(stored));
        }
    } catch (e) {
        console.error("Failed to load favorites", e);
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('iceland_favorites', JSON.stringify([...favorites]));
    } catch (e) {
        console.error("Failed to save favorites", e);
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2F5233', '#0EA5E9', '#C0392B']
        });
    }
}

function toggleFavorite(id) {
    let justAdded = false;
    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
        justAdded = true;
    }
    saveFavorites();

    if (justAdded && (favorites.size === 3 || favorites.size === 7)) {
        triggerConfetti();
    }
}

function filterPOIs() {
    let filtered = globalPOIs;

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(poi =>
            poi.name.toLowerCase().includes(searchTerm) ||
            poi.description.toLowerCase().includes(searchTerm) ||
            (poi.tags && poi.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    // Filter by category
    if (activeCategory !== 'All') {
        filtered = filtered.filter(poi =>
            (poi.tags && poi.tags.includes(activeCategory)) ||
            poi.category === activeCategory.toLowerCase()
        );
    }

    return filtered;
}

function getUniqueTags() {
    const tags = new Set(['All']);
    globalPOIs.forEach(poi => {
        if (poi.tags) {
            poi.tags.forEach(tag => tags.add(tag));
        }
    });
    // Custom sort to keep 'All' first
    return Array.from(tags).sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a.localeCompare(b);
    });
}

// --- MAP INITIALIZATION ---
function initMap() {
    map = L.map('map').setView([64.9631, -19.0208], 6);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=c8301630-e7df-4a9e-84d5-bf5e7453c864', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 16
    }).addTo(map);

    return map;
}

// --- SIDEBAR UI ---
function renderSidebarTabs() {
    const container = document.getElementById('sidebar-tabs');
    if (!container) return;

    container.innerHTML = '';
    container.classList.remove('hidden');

    // Tab Header (Segmented Control Style)
    const tabHeader = document.createElement('div');
    tabHeader.className = 'flex items-center justify-center p-1 bg-gray-100 rounded-xl mb-6 shadow-inner mx-1';

    const createTab = (id, label, icon) => {
        const btn = document.createElement('button');
        const isActive = activeTab === id;
        btn.className = `flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none flex items-center justify-center ${isActive ? 'bg-white text-brand-deep shadow-sm ring-1 ring-black/5' : 'text-brand-stone hover:text-brand-deep hover:bg-gray-200/50'}`;
        btn.innerHTML = `<i class="fas fa-${icon} mr-2 ${isActive ? 'text-brand-blue' : 'opacity-70'}"></i>${label}`;
        btn.onclick = () => {
            activeTab = id;
            renderSidebarTabs(); // Re-render tabs
            createInitialSidebarContent(); // Re-render content
        };
        return btn;
    };

    tabHeader.appendChild(createTab('discover', 'Discover', 'compass'));
    tabHeader.appendChild(createTab('logbook', 'My Logbook', 'book-open'));
    container.appendChild(tabHeader);

    // Filter Chips (Only on Discover tab)
    if (activeTab === 'discover') {
        // Search Input
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'mb-3 relative';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'search-input';
        searchInput.placeholder = 'Search locations...';
        searchInput.className = 'w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-moss focus:ring-1 focus:ring-brand-moss transition-colors';
        searchInput.value = searchTerm;

        const searchIcon = document.createElement('i');
        searchIcon.className = 'fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs';

        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(searchInput);
        container.appendChild(searchWrapper);

        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            createInitialSidebarContent();
        });

        const filterContainer = document.createElement('div');
        filterContainer.className = 'flex space-x-2 overflow-x-auto pb-2 scrollbar-hide';

        // Hide scrollbar style
        const style = document.createElement('style');
        style.textContent = '.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }';
        container.appendChild(style);

        const tags = getUniqueTags();
        tags.forEach(tag => {
            const chip = document.createElement('button');
            const isActive = activeCategory === tag;
            chip.className = `whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors border focus:outline-none ${isActive ? 'bg-brand-moss text-white border-brand-moss' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-moss hover:text-brand-moss'}`;
            chip.textContent = tag;
            chip.onclick = () => {
                activeCategory = tag;
                renderSidebarTabs(); // Re-render chips
                createInitialSidebarContent(); // Re-render list
            };
            filterContainer.appendChild(chip);
        });
        container.appendChild(filterContainer);
    }
}

function createInitialSidebarContent() {
    const poiContent = document.getElementById('poi-content');
    poiContent.innerHTML = ''; // Clear existing content

    // Ensure tabs are visible
    const tabsContainer = document.getElementById('sidebar-tabs');
    if (tabsContainer) tabsContainer.classList.remove('hidden');

    if (activeTab === 'discover') {
        const heading = document.createElement('h2');
        heading.className = 'text-3xl font-bold mb-4 text-brand-deep';
        heading.textContent = 'The Journey Begins';

        const p = document.createElement('p');
        p.className = 'text-brand-deep mb-6 leading-relaxed text-sm';
        p.textContent = 'Explore the Ring Road. Select a category above or choose a location below.';

        poiContent.appendChild(heading);
        poiContent.appendChild(p);

        // Cinematic Tour Button
        const tourBtnContainer = document.createElement('div');
        tourBtnContainer.className = 'mb-8';
        const tourBtn = document.createElement('button');
        tourBtn.id = 'tour-btn';
        tourBtn.className = 'w-full bg-brand-deep text-white font-bold text-center py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center';

        if (isTourRunning) {
            tourBtn.innerHTML = '<i class="fas fa-stop-circle mr-2"></i> Stop Tour';
            tourBtn.classList.replace('bg-brand-deep', 'bg-brand-lava');
            tourBtn.onclick = stopCinematicTour;
        } else {
            tourBtn.innerHTML = '<i class="fas fa-play-circle mr-2"></i> Start Cinematic Tour';
            tourBtn.onclick = startCinematicTour;
        }

        tourBtnContainer.appendChild(tourBtn);
        poiContent.appendChild(tourBtnContainer);

        // Filtered List
        const filteredPOIs = filterPOIs();
        if (filteredPOIs.length === 0) {
            poiContent.innerHTML += '<div class="text-center text-gray-500 mt-10 p-4 border border-dashed rounded-lg">No locations found for this category.</div>';
            return;
        }

        const listDiv = document.createElement('div');
        const listHeader = document.createElement('h3');
        listHeader.className = 'text-xl font-semibold text-brand-deep mb-4 font-serif';
        listHeader.textContent = activeCategory === 'All' ? 'Itinerary' : `${activeCategory} Locations`;
        listDiv.appendChild(listHeader);

        const poiList = document.createElement('ul');
        poiList.className = 'space-y-4 pb-20 md:pb-0 px-1';

        filteredPOIs.forEach((poi, loopIndex) => {
            const index = globalPOIs.findIndex(p => p.id === poi.id);
            const item = document.createElement('li');
            item.className = 'flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-brand-mist hover:shadow-xl hover:border-brand-blue/30 cursor-pointer transition-all duration-300 group overflow-hidden hover:-translate-y-1';
            item.style.opacity = '0';
            item.style.animation = `fadeInUp 0.5s ease-out forwards ${loopIndex * 0.05}s`;

            const imgUrl = poi.image ? poi.image : 'https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';

            item.innerHTML = `
                <div class="relative w-full md:w-32 h-32 md:h-auto shrink-0 md:m-0">
                    <img src="${imgUrl}" alt="${poi.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';">
                    <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">${index + 1}</div>
                    ${favorites.has(poi.id) ? '<div class="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm"><i class="fas fa-heart text-brand-lava text-xs"></i></div>' : ''}
                </div>
                <div class="flex-1 p-4 flex flex-col justify-center min-w-0">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-bold text-brand-deep text-base font-serif leading-tight group-hover:text-brand-blue transition-colors line-clamp-1">${poi.name}</h4>
                    </div>
                    <div class="flex items-center mb-2">
                         <span class="text-[10px] font-bold tracking-wider uppercase text-brand-stone bg-brand-mist/50 px-2 py-0.5 rounded-full border border-brand-mist">${poi.category}</span>
                    </div>
                    <p class="text-xs text-brand-stone line-clamp-2 leading-relaxed mb-3">${poi.description}</p>
                    <div class="flex items-center text-xs text-brand-blue font-medium mt-auto group-hover:translate-x-1 transition-transform">
                        Explore Location <i class="fas fa-arrow-right ml-1"></i>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => navigateToPOI(poi));
            poiList.appendChild(item);
        });
        listDiv.appendChild(poiList);
        poiContent.appendChild(listDiv);

    } else if (activeTab === 'logbook') {
        const heading = document.createElement('h2');
        heading.className = 'text-3xl font-bold mb-4 text-brand-deep font-serif';
        heading.textContent = 'My Logbook';
        poiContent.appendChild(heading);

        // Explorer Level Logic
        const favCount = favorites.size;
        let level = "Novice Explorer";
        let levelIcon = "map";
        let levelColor = "text-brand-stone";
        let nextLevelMsg = "Save 3 locations to level up!";

        if (favCount >= 7) {
            level = "Viking Legend";
            levelIcon = "khanda";
            levelColor = "text-brand-lava";
            nextLevelMsg = "You have conquered the Ring Road!";
        } else if (favCount >= 3) {
            level = "Seasoned Adventurer";
            levelIcon = "hiking";
            levelColor = "text-brand-moss";
            nextLevelMsg = `Save ${7 - favCount} more to become a Viking Legend!`;
        } else {
            nextLevelMsg = `Save ${3 - favCount} more to level up!`;
        }

        const levelBadge = document.createElement('div');
        levelBadge.className = 'bg-white rounded-xl p-5 mb-6 shadow-sm border border-brand-mist flex items-center transform transition-all hover:shadow-md';
        levelBadge.innerHTML = `
            <div class="w-14 h-14 rounded-full bg-brand-ice flex items-center justify-center mr-4 ${levelColor} shadow-inner">
                <i class="fas fa-${levelIcon} fa-xl"></i>
            </div>
            <div>
                <h3 class="font-bold text-brand-deep text-xs uppercase tracking-wide opacity-60">Current Status</h3>
                <p class="text-xl font-serif font-bold ${levelColor} mb-1">${level}</p>
                <div class="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                    <div class="bg-current h-1.5 rounded-full opacity-50 ${levelColor}" style="width: ${Math.min((favCount / 7) * 100, 100)}%"></div>
                </div>
                <p class="text-[10px] text-brand-stone">${nextLevelMsg}</p>
            </div>
        `;
        poiContent.appendChild(levelBadge);

        if (favorites.size === 0) {
             poiContent.innerHTML += `
                <div class="flex flex-col items-center justify-center mt-10 text-brand-stone/50 py-10 border-2 border-dashed border-brand-mist rounded-xl">
                    <i class="far fa-heart fa-3x mb-4 opacity-50"></i>
                    <p class="font-medium text-brand-deep">Your logbook is empty.</p>
                    <p class="text-xs mt-1">Heart locations to save them here.</p>
                </div>
             `;
        } else {
             const favList = globalPOIs.filter(p => favorites.has(p.id));
             const poiList = document.createElement('ul');
             poiList.className = 'space-y-3 pb-20 md:pb-0';

             favList.forEach((poi, loopIndex) => {
                const item = document.createElement('li');
                item.className = 'flex items-center bg-white p-2 rounded-xl shadow-sm border border-brand-mist hover:shadow-md cursor-pointer transition-all duration-300 group hover:-translate-y-0.5';
                item.style.opacity = '0';
                item.style.animation = `fadeInUp 0.5s ease-out forwards ${loopIndex * 0.05}s`;

                item.innerHTML = `
                    <div class="w-16 h-16 shrink-0 rounded-lg overflow-hidden relative mr-3 bg-gray-100">
                         <img src="${poi.image}" class="w-full h-full object-cover">
                         <div class="absolute inset-0 bg-black/10"></div>
                         <div class="absolute inset-0 flex items-center justify-center text-white"><i class="fas fa-heart text-sm drop-shadow-md"></i></div>
                    </div>
                    <div>
                        <span class="block text-brand-deep font-bold text-sm group-hover:text-brand-moss transition-colors line-clamp-1">${poi.name}</span>
                        <span class="text-xs text-brand-stone capitalize">${poi.category}</span>
                    </div>
                    <div class="ml-auto pr-2 text-brand-stone/30 group-hover:text-brand-moss/50">
                        <i class="fas fa-chevron-right text-sm"></i>
                    </div>
                `;
                item.addEventListener('click', () => navigateToPOI(poi));
                poiList.appendChild(item);
             });
             poiContent.appendChild(poiList);
        }
    }
}

function resetSidebar() {
    createInitialSidebarContent();
}

// --- UI ---
// Bottom Sheet State Management
let sheetState = 'hidden'; // 'hidden', 'peek', 'full'

function setSheetState(state) {
    const sidebar = document.getElementById('poi-sidebar');
    if (!sidebar) return;

    // Remove legacy classes if any
    sidebar.classList.remove('translate-y-full');

    // Remove all sheet classes
    sidebar.classList.remove('sheet-hidden', 'sheet-peek', 'sheet-half', 'sheet-full');

    // Add new state class
    sidebar.classList.add(`sheet-${state}`);
    sheetState = state;
}

function updateSidebar(poi) {
    const poiContent = document.getElementById('poi-content');
    const tabsContainer = document.getElementById('sidebar-tabs');
    const sidebar = document.getElementById('poi-sidebar');

    // Scroll to top
    sidebar.scrollTop = 0;

    // Hide tabs
    if (tabsContainer) tabsContainer.classList.add('hidden');

    const DURATION = 200; //ms
    poiContent.style.transition = `opacity ${DURATION}ms ease-in-out`;
    poiContent.style.opacity = '0';

    setTimeout(() => {
        // Clear existing content
        poiContent.innerHTML = '';

        // --- Hero Section ---
        const heroWrapper = document.createElement('div');
        heroWrapper.className = "relative w-[calc(100%+3rem)] -ml-6 -mt-2 md:-mt-6 shrink-0 z-10 mb-8";

        const heroImageContainer = document.createElement('div');
        heroImageContainer.className = "relative h-80 w-full overflow-hidden rounded-b-3xl md:rounded-b-2xl shadow-md group";

        const image = document.createElement('img');
        image.src = poi.image;
        image.alt = poi.name;
        image.className = "w-full h-full object-cover ken-burns-image";
        image.onerror = function() {
            this.onerror=null;
            this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';
        };

        const gradient = document.createElement('div');
        gradient.className = "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none";

        // Back Button
        const homeButton = document.createElement('button');
        homeButton.id = 'home-button'; // Keep ID for event delegation
        homeButton.className = 'absolute top-4 left-4 z-20 text-white hover:text-brand-blue transition-all p-2 bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center border border-white/20';
        homeButton.setAttribute('aria-label', 'Back to home');
        homeButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        homeButton.onclick = resetSidebar;

        heroImageContainer.append(image, gradient, homeButton);

        // Heart FAB (Outside overflow-hidden container)
        const isFav = favorites.has(poi.id);
        const heartBtn = document.createElement('button');
        heartBtn.className = `absolute -bottom-6 right-8 z-30 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isFav ? 'bg-brand-lava text-white' : 'bg-white text-brand-stone hover:text-brand-lava'}`;
        heartBtn.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart fa-xl ${isFav ? 'animate-bounce' : ''}"></i>`;
        heartBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(poi.id);
            const newIsFav = favorites.has(poi.id);
            heartBtn.className = `absolute -bottom-6 right-8 z-30 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${newIsFav ? 'bg-brand-lava text-white' : 'bg-white text-brand-stone hover:text-brand-lava'}`;
            heartBtn.innerHTML = `<i class="${newIsFav ? 'fas' : 'far'} fa-heart fa-xl ${newIsFav ? 'animate-bounce' : ''}"></i>`;
        };

        heroWrapper.append(heroImageContainer, heartBtn);

        // --- Content Section ---
        const contentDiv = document.createElement('div');
        contentDiv.className = "pt-12 pb-24 px-1";

        // Title & Tags
        const titleDiv = document.createElement('div');
        titleDiv.className = "mb-8";
        titleDiv.innerHTML = `
            <h2 class="text-4xl font-bold text-brand-deep font-serif mb-4 leading-none tracking-tight">${poi.name}</h2>
            <div class="flex flex-wrap gap-2">
                ${poi.tags ? poi.tags.map(tag => `<span class="px-3 py-1 bg-brand-ice text-brand-deep rounded-full text-xs font-bold tracking-wide uppercase border border-brand-mist shadow-sm">${tag}</span>`).join('') : ''}
            </div>
        `;

        // Meta Grid
        const metaGrid = document.createElement('div');
        metaGrid.className = 'grid grid-cols-2 gap-4 mb-8';

        const createMeta = (icon, label, value) => `
            <div class="bg-brand-ice p-4 rounded-2xl border border-brand-mist/50 hover:border-brand-blue/30 transition-colors shadow-sm">
                <div class="flex items-center text-brand-blue mb-1.5">
                    <i class="${icon} text-base mr-2 opacity-80"></i>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-brand-stone">${label}</span>
                </div>
                <div class="text-sm font-semibold text-brand-deep leading-tight">${value}</div>
            </div>
        `;

        if (poi.duration) metaGrid.innerHTML += createMeta('fas fa-hourglass-half', 'Duration', poi.duration);
        if (poi.bestTime) metaGrid.innerHTML += createMeta('far fa-clock', 'Best Time', poi.bestTime);
        if (poi.accessibility) metaGrid.innerHTML += createMeta('fas fa-universal-access', 'Access', poi.accessibility);

        // Description
        const desc = document.createElement('div');
        desc.className = "prose prose-slate prose-sm text-brand-stone mb-10 leading-7 font-normal text-base max-w-none";
        desc.textContent = poi.description;

        // Rich Content: Tips & Folklore
        const extras = document.createElement('div');
        extras.className = "space-y-6 mb-10";

        if (poi.tips) {
            extras.innerHTML += `
                <div class="bg-amber-50 p-6 rounded-2xl border border-amber-100 relative overflow-hidden shadow-sm">
                    <div class="absolute top-0 right-0 -mt-2 -mr-2 text-amber-200 opacity-40"><i class="far fa-lightbulb fa-5x"></i></div>
                    <h4 class="font-bold text-amber-800 text-sm mb-2 relative z-10 flex items-center uppercase tracking-wide"><i class="fas fa-lightbulb mr-2"></i> Explorer's Tip</h4>
                    <p class="text-sm text-amber-900/90 italic relative z-10 font-medium">"${poi.tips}"</p>
                </div>
            `;
        }
        if (poi.folklore) {
            extras.innerHTML += `
                <div class="bg-brand-deep p-6 rounded-2xl relative overflow-hidden group shadow-lg text-white">
                     <div class="absolute top-0 right-0 -mt-2 -mr-2 text-white/5 text-7xl transition-transform group-hover:scale-110 duration-700"><i class="fas fa-book-open"></i></div>
                    <h4 class="font-bold text-brand-blue text-sm mb-3 relative z-10 flex items-center uppercase tracking-wide"><i class="fas fa-book-open mr-2"></i> Legend & Lore</h4>
                    <p class="text-sm text-gray-300 relative z-10 font-serif italic leading-relaxed text-lg">"${poi.folklore}"</p>
                </div>
            `;
        }

        // Link Button
        const linkBtn = document.createElement('a');
        linkBtn.href = poi.link;
        linkBtn.target = "_blank";
        linkBtn.className = "block w-full bg-brand-deep text-white font-bold text-center py-4 rounded-xl shadow-lg hover:shadow-xl hover:bg-brand-moss transition-all transform hover:-translate-y-1 mb-8 flex items-center justify-center";
        linkBtn.innerHTML = `Read Full Guide <i class="fas fa-external-link-alt ml-2 text-xs opacity-70"></i>`;

        contentDiv.append(titleDiv, metaGrid, desc, extras, linkBtn);

        // Navigation Controls
        const navDiv = document.createElement('div');
        navDiv.className = 'flex justify-between items-center pt-6 border-t border-brand-mist';

        const index = globalPOIs.findIndex(p => p.id === poi.id);

        if (index > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'text-brand-moss hover:text-brand-deep font-medium flex items-center text-sm transition-colors px-4 py-3 rounded-xl hover:bg-brand-ice';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left mr-2"></i> Previous';
            prevBtn.onclick = () => navigateToPOI(globalPOIs[index - 1]);
            navDiv.appendChild(prevBtn);
        } else {
            navDiv.appendChild(document.createElement('div'));
        }

        if (index < globalPOIs.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'text-brand-moss hover:text-brand-deep font-medium flex items-center text-sm transition-colors px-4 py-3 rounded-xl hover:bg-brand-ice';
            nextBtn.innerHTML = 'Next Stop <i class="fas fa-chevron-right ml-2"></i>';
            nextBtn.onclick = () => navigateToPOI(globalPOIs[index + 1]);
            navDiv.appendChild(nextBtn);
        }

        contentDiv.appendChild(navDiv);

        poiContent.append(heroWrapper, contentDiv);
        poiContent.style.opacity = '1';
    }, DURATION);
}

function setupUIEventListeners(map) {
    const sidebar = document.getElementById('poi-sidebar');
    const menuButton = document.getElementById('menu-button');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const userLocationButton = document.getElementById('user-location-button');
    const audioToggleButton = document.getElementById('audio-toggle-button');
    const audioToggleIcon = document.getElementById('audio-toggle-icon');
    const poiContent = document.getElementById('poi-content');
    const handle = document.getElementById('sheet-handle');
    let userMarker;
    let userAccuracyCircle;

    if (audioToggleButton) {
        audioToggleButton.addEventListener('click', () => {
            const isEnabled = AudioManager.toggleMute();
            if (isEnabled) {
                audioToggleIcon.classList.remove('fa-volume-mute');
                audioToggleIcon.classList.add('fa-volume-up');
                audioToggleIcon.classList.remove('text-brand-stone');
                audioToggleIcon.classList.add('text-brand-moss');
            } else {
                audioToggleIcon.classList.remove('fa-volume-up');
                audioToggleIcon.classList.add('fa-volume-mute');
                audioToggleIcon.classList.remove('text-brand-moss');
                audioToggleIcon.classList.add('text-brand-stone');
            }
        });
    }

    poiContent.addEventListener('click', (e) => {
        if (e.target.closest('#home-button')) {
            resetSidebar();
        }
    });

    menuButton.addEventListener('click', () => {
        // Toggle between full and hidden/peek/half
        if (sheetState === 'hidden' || sheetState === 'peek') {
            setSheetState('half');
        } else if (sheetState === 'half') {
            setSheetState('full');
        } else {
            setSheetState('peek');
        }
    });

    closeSidebarButton.addEventListener('click', () => {
        setSheetState('peek');
    });

    // Bottom Sheet Interactions
    if (handle) {
        let startY, isDragging = false, hasDragged = false;
        const PEEK_HEIGHT = 70;

        // Toggle on click (for both mouse and touch tap)
        handle.addEventListener('click', (e) => {
             // If we just dragged, don't toggle
             if (hasDragged) {
                 e.preventDefault();
                 e.stopPropagation();
                 return;
             }
             if (sheetState === 'full') setSheetState('peek');
             else if (sheetState === 'peek') setSheetState('half');
             else setSheetState('full');
        });

        // Unified Start Handler
        const onDragStart = (y) => {
            isDragging = true;
            hasDragged = false;
            sidebar.style.transition = 'none';

            // Get current transform
            const style = window.getComputedStyle(sidebar);
            const matrix = new WebKitCSSMatrix(style.transform);

            // Assign startY based on current offset
            startY = y - matrix.m42;
        };

        // Unified Move Handler
        const onDragMove = (y) => {
            if (!isDragging) return;
            const deltaY = y - startY;

            if (Math.abs(deltaY) > 5) hasDragged = true;

            let newOffset = y - startY;

            // Resistance when pulling past top
            if (newOffset < 0) newOffset = newOffset * 0.3;

            sidebar.style.transform = `translateY(${newOffset}px)`;
        };

        // Unified End Handler
        const onDragEnd = (y) => {
             if (!isDragging) return;
            isDragging = false;
            // Restore smooth physics-based transition
            sidebar.style.transition = 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)';
            sidebar.style.transform = '';

            const finalOffset = y - startY;
            const h = window.innerHeight;

            // Logic to snap based on threshold
            if (finalOffset < h * 0.25) {
                setSheetState('full');
            } else if (finalOffset > h * 0.75) {
                setSheetState('peek');
            } else {
                setSheetState('half');
            }
        };

        // Touch Events
        handle.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientY), {passive: true});
        handle.addEventListener('touchmove', (e) => onDragMove(e.touches[0].clientY), {passive: true});
        handle.addEventListener('touchend', (e) => onDragEnd(e.changedTouches[0].clientY));

        // Mouse Events
        handle.addEventListener('mousedown', (e) => {
            onDragStart(e.clientY);
            // Attach move/up to window to handle dragging outside the handle
            const moveHandler = (ev) => onDragMove(ev.clientY);
            const upHandler = (ev) => {
                onDragEnd(ev.clientY);
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };
            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        });
    }

    userLocationButton.addEventListener('click', () => {
        map.locate({setView: true, maxZoom: 13, watch: false});
    });

    map.on('locationfound', function(e) {
        const radius = e.accuracy / 2;

        if (userMarker) {
            map.removeLayer(userMarker);
            map.removeLayer(userAccuracyCircle);
        }

        const userIcon = L.divIcon({
            html: '<div class="user-location-pulse"></div>',
            className: '', // important to clear default styling
            iconSize: [24, 24],
        });

        userMarker = L.marker(e.latlng, { icon: userIcon }).addTo(map)
            .bindPopup(`You are within ${radius.toFixed(0)} meters from this point`).openPopup();

        userAccuracyCircle = L.circle(e.latlng, {
            radius: radius,
            color: '#268BD2',
            fillColor: '#268BD2',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(map);
    });

    map.on('locationerror', function(e) {
        showSidebarError(e.message);
    });
}

function showSidebarError(message) {
    const poiContent = document.getElementById('poi-content');
    poiContent.innerHTML = ''; // Clear existing content

    const errorDiv = document.createElement('div');
    errorDiv.className = 'p-4 bg-brand-red text-white rounded-lg';

    const heading = document.createElement('h3');
    heading.className = 'font-bold';
    heading.textContent = 'Error';

    const paragraph = document.createElement('p');
    paragraph.textContent = message;

    errorDiv.appendChild(heading);
    errorDiv.appendChild(paragraph);
    poiContent.appendChild(errorDiv);
}

// --- NAVIGATION ---
function navigateToPOI(poi) {
    // Prevent occlusion by manually offsetting the coordinate
    const lngOffset = window.innerWidth >= 768 ? -0.1 : 0;
    const latOffset = window.innerWidth < 768 ? -0.05 : 0;

    map.flyTo([poi.lat + latOffset, poi.lng + lngOffset], 13, {
        animate: true,
        duration: 1.5
    });

    // Play ambient sound
    AudioManager.playCategory(poi.category);

    updateSidebar(poi);
    setActiveMarker(poi.id);
    // On mobile, show the bottom sheet as half to reveal map
    if (window.innerWidth < 768) {
        setSheetState('half');
    }
}

// --- MARKERS ---
let markers = {}; // Map POI ID to Leaflet Marker
let activeMarkerId = null;

function setActiveMarker(id) {
    // Reset previous marker
    if (activeMarkerId && markers[activeMarkerId]) {
        const prevMarker = markers[activeMarkerId];
        const prevIcon = prevMarker.getIcon();
        prevIcon.options.className = prevIcon.options.className.replace(' active-marker', '');
        prevMarker.setIcon(prevIcon);
        prevMarker.setZIndexOffset(0);
    }

    // Set new active marker
    if (markers[id]) {
        const marker = markers[id];
        const icon = marker.getIcon();
        if (!icon.options.className.includes('active-marker')) {
            icon.options.className += ' active-marker';
        }
        marker.setIcon(icon);
        marker.setZIndexOffset(1000);
        activeMarkerId = id;
    }
}

function createIcon(iconName, color) {
    // Refined marker with better shadow and opacity pulse
    const iconHtml = `
        <span class="absolute inset-0 rounded-full animate-[pulse-ring_2.5s_cubic-bezier(0.2,0,0,1)_infinite]" style="background-color: ${color}; opacity: 0.4; z-index: -1;"></span>
        <div role="button" tabindex="0" class="w-10 h-10 rounded-full flex items-center justify-center border-[3px] border-white shadow-lg z-10 transition-transform duration-300" style="background-color: ${color};">
            <i class="fas fa-${iconName} text-white text-base drop-shadow-md"></i>
        </div>
    `;
    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon flex items-center justify-center',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -28]
    });
}

function addMarkersToMap(map, pointsOfInterest) {
    const icons = {
        waterfall: createIcon('water', '#0EA5E9'), // Sky 500
        geothermal: createIcon('fire', '#E11D48'), // Rose 600
        town: createIcon('city', '#64748B'), // Slate 500
        landmark: createIcon('landmark', '#F59E0B'), // Amber 500
        park: createIcon('tree', '#2F5233') // Brand Moss
    };

    pointsOfInterest.forEach(poi => {
        const marker = L.marker([poi.lat, poi.lng], { icon: icons[poi.category] || icons.landmark }).addTo(map);
        markers[poi.id] = marker; // Store marker reference

        // Polished Popup Content
        const popupHtml = `
            <div class="px-1 py-2 min-w-[180px]">
                <h3 class="text-lg font-bold text-brand-deep font-serif leading-tight mb-1">${poi.name}</h3>
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-brand-stone bg-brand-mist/50 px-2 py-0.5 rounded-full">${poi.category}</span>
                    <span class="text-brand-blue text-xs font-medium group-hover:translate-x-1 transition-transform"><i class="fas fa-chevron-right"></i></span>
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml, {
            closeButton: false,
            offset: [0, -4]
        });

        marker.on('mouseover', function (e) {
            this.openPopup();
        });
        marker.on('mouseout', function (e) {
            this.closePopup();
        });

        const handleMarkerInteraction = () => {
            navigateToPOI(poi);
        };

        marker.on('click', handleMarkerInteraction);
        marker.on('keydown', (e) => {
            if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
                handleMarkerInteraction();
            }
        });
    });
}

// --- MAIN APP ---
function main() {
    loadFavorites();
    const map = initMap();
    setupUIEventListeners(map);
    renderSidebarTabs();
    createInitialSidebarContent();

    // Initial State for Mobile
    if (window.innerWidth < 768) {
        setSheetState('peek');
    }

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            globalPOIs = data.pointsOfInterest;
            const { pointsOfInterest, ringRoadCoords } = data;
            const ringRoad = L.polyline(ringRoadCoords, { color: '#d35555', weight: 5, opacity: 0.8 });
            ringRoad.addTo(map);
            map.fitBounds(ringRoad.getBounds().pad(0.2));

            // Animate the Ring Road path
            setTimeout(() => {
                ringRoad.snakeIn();
            }, 1000); // Delay to ensure map tiles are loaded

            addMarkersToMap(map, pointsOfInterest);

            // Re-render UI with data
            renderSidebarTabs();
            createInitialSidebarContent();
        })
        .catch(error => {
            console.error('Error loading map data:', error);
            showSidebarError('Could not load map data. Please try refreshing the page.');
        });

    window.addEventListener('load', () => {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.opacity = '0';
        loadingOverlay.addEventListener('transitionend', () => {
            loadingOverlay.style.display = 'none';
        }, { once: true });
    });
}

main();
