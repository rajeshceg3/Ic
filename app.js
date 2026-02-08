// --- GLOBAL STATE ---
let map;
let globalPOIs = [];
let activeTab = 'discover'; // 'discover' or 'logbook'
let favorites = new Set();
let activeCategory = 'All';
let searchTerm = '';

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

function toggleFavorite(id) {
    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
    }
    saveFavorites();
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

    // Tab Header
    const tabHeader = document.createElement('div');
    tabHeader.className = 'flex border-b border-gray-200 mb-4';

    const createTab = (id, label, icon) => {
        const btn = document.createElement('button');
        const isActive = activeTab === id;
        btn.className = `flex-1 py-2 text-sm font-medium transition-colors border-b-2 focus:outline-none ${isActive ? 'border-brand-moss text-brand-moss' : 'border-transparent text-gray-500 hover:text-brand-dark'}`;
        btn.innerHTML = `<i class="fas fa-${icon} mr-2"></i>${label}`;
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
        heading.className = 'text-3xl font-bold mb-4 text-brand-dark';
        heading.textContent = 'The Journey Begins';

        const p = document.createElement('p');
        p.className = 'text-brand-dark mb-6 leading-relaxed text-sm';
        p.textContent = 'Explore the Ring Road. Select a category above or choose a location below.';

        poiContent.appendChild(heading);
        poiContent.appendChild(p);

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
        poiList.className = 'space-y-3 pb-20 md:pb-0'; // Add padding for bottom sheet safe area

        filteredPOIs.forEach((poi, loopIndex) => {
            const index = globalPOIs.findIndex(p => p.id === poi.id);
            const item = document.createElement('li');
            item.className = 'flex items-start bg-white rounded-xl shadow-sm border border-brand-mist hover:shadow-md hover:border-brand-moss/30 cursor-pointer transition-all duration-300 group overflow-hidden hover:-translate-y-0.5';
            item.style.opacity = '0';
            item.style.animation = `fadeInUp 0.5s ease-out forwards ${loopIndex * 0.05}s`;

            const imgUrl = poi.image ? poi.image : 'https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';

            item.innerHTML = `
                <div class="relative w-24 h-24 shrink-0 m-2">
                    <img src="${imgUrl}" alt="${poi.name}" class="w-full h-full object-cover rounded-lg bg-gray-100" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';">
                    <div class="absolute top-1 left-1 bg-brand-deep/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm shadow-sm">${index + 1}</div>
                </div>
                <div class="flex-1 p-3 pl-1 min-w-0 flex flex-col justify-center h-28">
                    <div class="flex justify-between items-start mb-1">
                        <h4 class="font-bold text-brand-deep text-sm leading-tight group-hover:text-brand-moss transition-colors line-clamp-2">${poi.name}</h4>
                        ${favorites.has(poi.id) ? '<i class="fas fa-heart text-brand-lava text-xs ml-2 mt-0.5 animate-pulse"></i>' : ''}
                    </div>
                    <div class="flex items-center mb-1">
                         <span class="text-[10px] font-bold tracking-wider uppercase text-brand-moss bg-brand-moss/10 px-2 py-0.5 rounded-full">${poi.category}</span>
                    </div>
                    <p class="text-xs text-brand-stone line-clamp-2 leading-relaxed">${poi.description}</p>
                </div>
                <div class="flex items-center justify-center h-28 w-8 text-brand-stone/30 group-hover:text-brand-moss/50 transition-colors">
                    <i class="fas fa-chevron-right text-sm"></i>
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
    sidebar.classList.remove('sheet-hidden', 'sheet-peek', 'sheet-full');

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
        const heroContainer = document.createElement('div');
        heroContainer.className = "relative w-[calc(100%+3rem)] -ml-6 -mt-2 md:-mt-6 h-72 shrink-0 group overflow-hidden";

        const image = document.createElement('img');
        image.src = poi.image;
        image.alt = poi.name;
        image.className = "w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105";
        image.onerror = function() {
            this.onerror=null;
            this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';
        };

        const gradient = document.createElement('div');
        gradient.className = "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none";

        // Back Button
        const homeButton = document.createElement('button');
        homeButton.id = 'home-button'; // Keep ID for event delegation
        homeButton.className = 'absolute top-4 left-4 z-20 text-white hover:text-brand-blue transition-colors p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center';
        homeButton.setAttribute('aria-label', 'Back to home');
        homeButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        homeButton.onclick = resetSidebar;

        // Heart FAB
        const isFav = favorites.has(poi.id);
        const heartBtn = document.createElement('button');
        heartBtn.className = `absolute -bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${isFav ? 'bg-brand-lava text-white' : 'bg-white text-brand-stone hover:text-brand-lava'}`;
        heartBtn.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart fa-xl ${isFav ? 'animate-bounce' : ''}"></i>`;
        heartBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(poi.id);
            const newIsFav = favorites.has(poi.id);
            heartBtn.className = `absolute -bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${newIsFav ? 'bg-brand-lava text-white' : 'bg-white text-brand-stone hover:text-brand-lava'}`;
            heartBtn.innerHTML = `<i class="${newIsFav ? 'fas' : 'far'} fa-heart fa-xl ${newIsFav ? 'animate-bounce' : ''}"></i>`;
        };

        heroContainer.append(image, gradient, homeButton, heartBtn);

        // --- Content Section ---
        const contentDiv = document.createElement('div');
        contentDiv.className = "pt-10 pb-20";

        // Title & Tags
        const titleDiv = document.createElement('div');
        titleDiv.className = "mb-6";
        titleDiv.innerHTML = `
            <h2 class="text-3xl font-bold text-brand-deep font-serif mb-3 leading-tight">${poi.name}</h2>
            <div class="flex flex-wrap gap-2">
                ${poi.tags ? poi.tags.map(tag => `<span class="px-3 py-1 bg-brand-mist/50 text-brand-deep rounded-full text-xs font-semibold tracking-wide uppercase border border-brand-mist">${tag}</span>`).join('') : ''}
            </div>
        `;

        // Meta Grid
        const metaGrid = document.createElement('div');
        metaGrid.className = 'grid grid-cols-2 gap-3 mb-8';

        const createMeta = (icon, label, value) => `
            <div class="bg-brand-ice p-3 rounded-xl border border-brand-mist/50 hover:border-brand-moss/30 transition-colors">
                <div class="flex items-center text-brand-moss mb-1">
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
        desc.className = "prose prose-sm text-brand-stone mb-8 leading-relaxed font-light text-base max-w-none";
        desc.textContent = poi.description;

        // Rich Content: Tips & Folklore
        const extras = document.createElement('div');
        extras.className = "space-y-4 mb-8";

        if (poi.tips) {
            extras.innerHTML += `
                <div class="bg-yellow-50 p-5 rounded-xl border-l-4 border-yellow-400 relative overflow-hidden">
                    <div class="absolute top-0 right-0 -mt-2 -mr-2 text-yellow-200 opacity-50"><i class="far fa-lightbulb fa-4x"></i></div>
                    <h4 class="font-bold text-yellow-800 text-sm mb-2 relative z-10">Explorer's Tip</h4>
                    <p class="text-sm text-yellow-900/80 italic relative z-10">"${poi.tips}"</p>
                </div>
            `;
        }
        if (poi.folklore) {
            extras.innerHTML += `
                <div class="bg-brand-deep/5 p-5 rounded-xl relative overflow-hidden group border border-brand-mist/50">
                     <div class="absolute top-0 right-0 -mt-2 -mr-2 text-brand-deep/10 text-6xl transition-transform group-hover:scale-110 duration-700"><i class="fas fa-book-open"></i></div>
                    <h4 class="font-bold text-brand-deep text-sm mb-2 relative z-10 flex items-center"><i class="fas fa-book-open mr-2 text-brand-lava"></i>Legend & Lore</h4>
                    <p class="text-sm text-brand-stone relative z-10 font-serif italic leading-relaxed">"${poi.folklore}"</p>
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

        poiContent.append(heroContainer, contentDiv);
        poiContent.style.opacity = '1';
    }, DURATION);
}

function setupUIEventListeners(map) {
    const sidebar = document.getElementById('poi-sidebar');
    const menuButton = document.getElementById('menu-button');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const userLocationButton = document.getElementById('user-location-button');
    const poiContent = document.getElementById('poi-content');
    const handle = document.getElementById('sheet-handle');
    let userMarker;
    let userAccuracyCircle;

    poiContent.addEventListener('click', (e) => {
        if (e.target.closest('#home-button')) {
            resetSidebar();
        }
    });

    menuButton.addEventListener('click', () => {
        // Toggle between full and hidden/peek
        if (sheetState === 'hidden' || sheetState === 'peek') {
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
             else setSheetState('full');
        });

        // Unified Start Handler
        const onDragStart = (y) => {
            startY = y;
            isDragging = true;
            hasDragged = false;
            sidebar.style.transition = 'none';
        };

        // Unified Move Handler
        const onDragMove = (y) => {
            if (!isDragging) return;
            const deltaY = y - startY;

            if (Math.abs(deltaY) > 5) hasDragged = true;

            const initialOffset = sheetState === 'full' ? 0 : (window.innerHeight - PEEK_HEIGHT);
            let newOffset = initialOffset + deltaY;

            if (newOffset < 0) newOffset = 0;
            sidebar.style.transform = `translateY(${newOffset}px)`;
        };

        // Unified End Handler
        const onDragEnd = (y) => {
             if (!isDragging) return;
            isDragging = false;
            sidebar.style.transition = '';
            sidebar.style.transform = '';

            const diff = y - startY;
            const THRESHOLD = 80;

             // If drag was very small, treat as click/tap (optional, but click handler usually covers this)
             // However, for drag logic:
            if (sheetState === 'full') {
                if (diff > THRESHOLD) {
                    setSheetState('peek');
                } else {
                    setSheetState('full');
                }
            } else { // peek
                if (diff < -THRESHOLD) {
                    setSheetState('full');
                } else {
                    setSheetState('peek');
                }
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
    map.flyTo([poi.lat, poi.lng], 13, {
        animate: true,
        duration: 1.5
    });
    updateSidebar(poi);
    // On mobile, show the bottom sheet as peek to reveal map
    if (window.innerWidth < 768) {
        setSheetState('peek');
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
    // Using span for the pulse to avoid colliding with .custom-div-icon div CSS selector
    const iconHtml = `
        <span class="absolute inset-0 rounded-full animate-[pulse-ring_2.5s_cubic-bezier(0.2,0,0,1)_infinite]" style="background-color: ${color}; opacity: 0.6; z-index: -1;"></span>
        <div role="button" tabindex="0" class="w-10 h-10 rounded-full flex items-center justify-center border-[3px] border-white z-10" style="background-color: ${color};">
            <i class="fas fa-${iconName} text-white text-base drop-shadow-sm"></i>
        </div>
    `;
    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon flex items-center justify-center',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24]
    });
}

function addMarkersToMap(map, pointsOfInterest) {
    const icons = {
        waterfall: createIcon('water', '#268BD2'),
        geothermal: createIcon('fire', '#D33682'),
        town: createIcon('city', '#859900'),
        landmark: createIcon('landmark', '#CB4B16'),
        park: createIcon('tree', '#2AA198')
    };

    pointsOfInterest.forEach(poi => {
        const marker = L.marker([poi.lat, poi.lng], { icon: icons[poi.category] || icons.landmark }).addTo(map);
        markers[poi.id] = marker; // Store marker reference

        const popupElement = document.createElement('div');
        popupElement.className = 'p-2';

        const heading = document.createElement('h3');
        heading.className = 'text-lg font-bold text-brand-slate mb-1';
        heading.textContent = poi.name;

        const category = document.createElement('p');
        category.className = 'text-sm text-brand-slate';
        category.textContent = poi.category.charAt(0).toUpperCase() + poi.category.slice(1);

        popupElement.appendChild(heading);
        popupElement.appendChild(category);

        marker.bindPopup(popupElement);

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
