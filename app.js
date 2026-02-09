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
    // Disable default zoom control to add a custom one later
    map = L.map('map', { zoomControl: false }).setView([64.9631, -19.0208], 6);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=c8301630-e7df-4a9e-84d5-bf5e7453c864', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 16
    }).addTo(map);

    // Custom Zoom Control at Bottom Right
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Add custom class to the zoom control container for styling
    const zoomControlContainer = document.querySelector('.leaflet-control-zoom');
    if (zoomControlContainer) {
        zoomControlContainer.classList.add('custom-zoom-control');
    }

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
        heading.className = 'text-3xl font-bold mb-2 text-brand-deep font-serif';
        heading.textContent = 'The Journey Begins';

        const p = document.createElement('p');
        p.className = 'text-brand-stone mb-8 leading-relaxed text-sm';
        p.textContent = 'Explore the Ring Road. Select a category above or choose a location below.';

        poiContent.appendChild(heading);
        poiContent.appendChild(p);

        // Filtered List
        const filteredPOIs = filterPOIs();
        if (filteredPOIs.length === 0) {
            poiContent.innerHTML += `
                <div class="flex flex-col items-center justify-center mt-10 text-brand-stone/50 py-12 border border-dashed border-brand-mist rounded-2xl bg-white/50">
                    <i class="far fa-compass fa-3x mb-4 opacity-50"></i>
                    <p class="font-medium text-brand-deep">No locations found.</p>
                    <p class="text-xs mt-1">Try adjusting your filters.</p>
                </div>`;
            return;
        }

        const listDiv = document.createElement('div');
        const listHeader = document.createElement('h3');
        listHeader.className = 'text-lg font-bold text-brand-deep mb-4 font-serif flex items-center';
        listHeader.innerHTML = `<span class="bg-brand-moss w-1.5 h-1.5 rounded-full mr-2.5"></span>${activeCategory === 'All' ? 'Full Itinerary' : `${activeCategory} Locations`}`;
        listDiv.appendChild(listHeader);

        const poiList = document.createElement('ul');
        poiList.className = 'space-y-4 pb-24 md:pb-4'; // Add padding for bottom sheet safe area

        filteredPOIs.forEach((poi, loopIndex) => {
            const index = globalPOIs.findIndex(p => p.id === poi.id);
            const item = document.createElement('li');

            // Card Styles
            item.className = 'group flex bg-white rounded-2xl shadow-sm hover:shadow-lg hover:shadow-brand-moss/5 border border-brand-mist/60 hover:border-brand-moss/30 cursor-pointer transition-all duration-300 ease-out transform hover:-translate-y-1 overflow-hidden opacity-0';

            // Staggered Animation
            item.style.animation = `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
            item.style.animationDelay = `${loopIndex * 0.08}s`;

            const imgUrl = poi.image ? poi.image : 'https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';

            item.innerHTML = `
                <div class="w-32 h-32 shrink-0 relative overflow-hidden">
                    <img src="${imgUrl}" alt="${poi.name}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';">
                    <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-brand-deep text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-white/50">#${index + 1}</div>
                </div>

                <div class="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                        <div class="flex justify-between items-start mb-1">
                            <h4 class="font-bold text-brand-deep text-sm leading-snug group-hover:text-brand-moss transition-colors line-clamp-2 pr-2">${poi.name}</h4>
                            ${favorites.has(poi.id) ? '<i class="fas fa-heart text-brand-lava text-xs mt-1 animate-pulse drop-shadow-sm"></i>' : ''}
                        </div>
                        <span class="inline-block text-[10px] font-bold tracking-wider uppercase text-brand-moss bg-brand-moss/5 px-2 py-0.5 rounded-full mb-2 border border-brand-moss/10">${poi.category}</span>
                        <p class="text-xs text-brand-stone line-clamp-2 font-light leading-relaxed">${poi.description}</p>
                    </div>
                </div>

                <div class="w-8 flex items-center justify-center border-l border-brand-mist/50 text-brand-stone/30 group-hover:text-brand-moss/50 transition-colors bg-brand-ice/30">
                    <i class="fas fa-chevron-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
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
        levelBadge.className = 'bg-white rounded-2xl p-6 mb-8 shadow-glass border border-brand-mist/60 flex items-center transform transition-all hover:scale-[1.02]';
        levelBadge.innerHTML = `
            <div class="w-16 h-16 shrink-0 rounded-full bg-brand-ice flex items-center justify-center mr-5 ${levelColor} shadow-inner border border-white">
                <i class="fas fa-${levelIcon} fa-2x"></i>
            </div>
            <div class="flex-1">
                <h3 class="font-bold text-brand-deep text-xs uppercase tracking-widest opacity-50 mb-1">Current Rank</h3>
                <p class="text-xl font-serif font-bold ${levelColor} mb-2">${level}</p>
                <div class="w-full bg-brand-mist rounded-full h-2 mb-2 overflow-hidden">
                    <div class="bg-current h-full rounded-full opacity-80 ${levelColor} transition-all duration-1000" style="width: ${Math.min((favCount / 7) * 100, 100)}%"></div>
                </div>
                <p class="text-[11px] text-brand-stone font-medium"><i class="fas fa-info-circle mr-1"></i>${nextLevelMsg}</p>
            </div>
        `;
        poiContent.appendChild(levelBadge);

        if (favorites.size === 0) {
             poiContent.innerHTML += `
                <div class="flex flex-col items-center justify-center mt-4 text-brand-stone/50 py-16 border-2 border-dashed border-brand-mist rounded-2xl bg-white/30">
                    <i class="far fa-heart fa-3x mb-4 opacity-50"></i>
                    <p class="font-medium text-brand-deep text-lg">Your logbook is empty.</p>
                    <p class="text-sm mt-1">Heart locations to save them here.</p>
                </div>
             `;
        } else {
             const favList = globalPOIs.filter(p => favorites.has(p.id));
             const poiList = document.createElement('ul');
             poiList.className = 'space-y-4 pb-24 md:pb-4';

             favList.forEach((poi, loopIndex) => {
                const item = document.createElement('li');
                item.className = 'group flex items-center bg-white p-3 rounded-2xl shadow-sm border border-brand-mist/60 hover:shadow-md hover:border-brand-moss/30 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 opacity-0';

                item.style.animation = `fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
                item.style.animationDelay = `${loopIndex * 0.05}s`;

                item.innerHTML = `
                    <div class="w-20 h-20 shrink-0 rounded-xl overflow-hidden relative mr-4 shadow-sm">
                         <img src="${poi.image}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                         <div class="absolute inset-0 bg-black/10"></div>
                         <div class="absolute inset-0 flex items-center justify-center text-white"><i class="fas fa-heart text-sm drop-shadow-md"></i></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <span class="block text-brand-deep font-bold text-sm group-hover:text-brand-moss transition-colors line-clamp-1 mb-1">${poi.name}</span>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-brand-stone bg-brand-ice px-2 py-0.5 rounded-full border border-brand-mist">${poi.category}</span>
                    </div>
                    <div class="ml-auto pr-2 text-brand-stone/30 group-hover:text-brand-moss/50 transition-colors">
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
let sheetState = 'peek'; // 'hidden', 'peek', 'half', 'full'

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

    // Manage background map interactions based on sheet state
    if (window.innerWidth < 768) {
        if (state === 'full') {
            map.dragging.disable();
            map.scrollWheelZoom.disable();
        } else {
            map.dragging.enable();
            map.scrollWheelZoom.enable();
        }
    }
}

function updateSidebar(poi) {
    const poiContent = document.getElementById('poi-content');
    const tabsContainer = document.getElementById('sidebar-tabs');
    const sidebar = document.getElementById('poi-sidebar');
    const closeButton = document.getElementById('close-sidebar');

    // Scroll to top
    sidebar.scrollTop = 0;

    // Hide tabs, show close button
    if (tabsContainer) tabsContainer.classList.add('hidden');
    if (closeButton) {
        closeButton.classList.remove('opacity-0', 'pointer-events-none');
    }

    const DURATION = 300; //ms
    poiContent.style.transition = `opacity ${DURATION}ms ease-out`;
    poiContent.style.opacity = '0';

    setTimeout(() => {
        // Clear existing content
        poiContent.innerHTML = '';

        // --- Hero Section ---
        const heroContainer = document.createElement('div');
        heroContainer.className = "relative w-[calc(100%+3rem)] -ml-6 -mt-2 md:-mt-6 h-80 shrink-0 group overflow-hidden";

        const image = document.createElement('img');
        image.src = poi.image;
        image.alt = poi.name;
        image.className = "w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105";
        image.onerror = function() {
            this.onerror=null;
            this.src='https://placehold.co/400x300/e2e8f0/64748b?text=Iceland';
        };

        const gradient = document.createElement('div');
        gradient.className = "absolute inset-0 bg-gradient-to-t from-brand-deep/80 via-transparent to-black/20 pointer-events-none";

        // Back Button
        const homeButton = document.createElement('button');
        homeButton.id = 'home-button'; // Keep ID for event delegation
        homeButton.className = 'absolute top-4 left-4 z-20 text-white hover:text-brand-blue transition-all p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg';
        homeButton.setAttribute('aria-label', 'Back to home');
        homeButton.innerHTML = '<i class="fas fa-arrow-left"></i>';
        homeButton.onclick = resetSidebar;

        // Heart FAB
        const isFav = favorites.has(poi.id);
        const heartBtn = document.createElement('button');
        const updateHeartBtnClass = (fav) => `absolute -bottom-7 right-8 z-30 w-16 h-16 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-white ${fav ? 'bg-brand-lava text-white' : 'bg-white text-brand-stone hover:text-brand-lava'}`;

        heartBtn.className = updateHeartBtnClass(isFav);
        heartBtn.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart fa-2x ${isFav ? 'animate-bounce' : ''}"></i>`;

        heartBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(poi.id);
            const newIsFav = favorites.has(poi.id);
            heartBtn.className = updateHeartBtnClass(newIsFav);
            heartBtn.innerHTML = `<i class="${newIsFav ? 'fas' : 'far'} fa-heart fa-2x ${newIsFav ? 'animate-bounce' : ''}"></i>`;
        };

        heroContainer.append(image, gradient, homeButton, heartBtn);

        // --- Content Section ---
        const contentDiv = document.createElement('div');
        contentDiv.className = "pt-12 pb-24 md:pb-12";

        // Title & Tags
        const titleDiv = document.createElement('div');
        titleDiv.className = "mb-8 animate-fade-up";
        titleDiv.style.animationDelay = "0.1s";
        titleDiv.innerHTML = `
            <h2 class="text-4xl font-bold text-brand-deep font-serif mb-4 leading-none tracking-tight">${poi.name}</h2>
            <div class="flex flex-wrap gap-2">
                <span class="px-3 py-1 bg-brand-moss text-white rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm shadow-brand-moss/20">${poi.category}</span>
                ${poi.tags ? poi.tags.map(tag => `<span class="px-3 py-1 bg-brand-mist/50 text-brand-deep rounded-full text-[10px] font-bold tracking-widest uppercase border border-brand-mist">${tag}</span>`).join('') : ''}
            </div>
        `;

        // Meta Grid
        const metaGrid = document.createElement('div');
        metaGrid.className = 'grid grid-cols-2 gap-4 mb-10 animate-fade-up';
        metaGrid.style.animationDelay = "0.2s";

        const createMeta = (icon, label, value) => `
            <div class="bg-white p-4 rounded-2xl border border-brand-mist shadow-sm hover:shadow-md transition-shadow group/meta">
                <div class="flex items-center text-brand-moss mb-2">
                    <i class="${icon} text-lg mr-3 opacity-70 group-hover/meta:opacity-100 transition-opacity"></i>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-brand-stone">${label}</span>
                </div>
                <div class="text-sm font-semibold text-brand-deep leading-tight">${value}</div>
            </div>
        `;

        if (poi.duration) metaGrid.innerHTML += createMeta('fas fa-hourglass-half', 'Duration', poi.duration);
        if (poi.bestTime) metaGrid.innerHTML += createMeta('far fa-clock', 'Best Time', poi.bestTime);
        if (poi.accessibility) metaGrid.innerHTML += createMeta('fas fa-universal-access', 'Access', poi.accessibility);

        // Description
        const desc = document.createElement('div');
        desc.className = "prose prose-stone prose-lg mb-10 leading-loose font-light animate-fade-up text-brand-deep/80";
        desc.style.animationDelay = "0.3s";
        desc.textContent = poi.description;

        // Rich Content: Tips & Folklore
        const extras = document.createElement('div');
        extras.className = "space-y-6 mb-10 animate-fade-up";
        extras.style.animationDelay = "0.4s";

        if (poi.tips) {
            extras.innerHTML += `
                <div class="bg-amber-50 p-6 rounded-2xl border border-amber-100 relative overflow-hidden shadow-sm">
                    <div class="absolute -top-4 -right-4 text-amber-500/10"><i class="far fa-lightbulb fa-6x"></i></div>
                    <div class="flex items-start relative z-10">
                        <div class="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-4">
                            <i class="fas fa-lightbulb"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-amber-900 text-sm mb-1 uppercase tracking-wide">Explorer's Tip</h4>
                            <p class="text-sm text-amber-800/90 italic leading-relaxed">"${poi.tips}"</p>
                        </div>
                    </div>
                </div>
            `;
        }
        if (poi.folklore) {
            extras.innerHTML += `
                <div class="bg-brand-deep text-brand-ice p-6 rounded-2xl relative overflow-hidden group shadow-lg">
                    <div class="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                    <div class="absolute -bottom-6 -right-6 text-white/5 rotate-12 transition-transform duration-1000 group-hover:rotate-0"><i class="fas fa-book-open fa-8x"></i></div>

                    <div class="relative z-10">
                         <div class="flex items-center mb-3 text-brand-lava">
                            <i class="fas fa-dragon mr-2"></i>
                            <span class="text-xs font-bold uppercase tracking-widest">Legend & Lore</span>
                        </div>
                        <p class="text-lg font-serif italic leading-relaxed text-brand-ice/90">"${poi.folklore}"</p>
                    </div>
                </div>
            `;
        }

        // Link Button
        const linkBtn = document.createElement('a');
        linkBtn.href = poi.link;
        linkBtn.target = "_blank";
        linkBtn.className = "animate-fade-up block w-full bg-brand-deep text-white font-bold text-center py-5 rounded-2xl shadow-lg hover:shadow-2xl hover:bg-brand-moss transition-all transform hover:-translate-y-1 mb-10 flex items-center justify-center group";
        linkBtn.style.animationDelay = "0.5s";
        linkBtn.innerHTML = `Read Full Guide <i class="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>`;

        contentDiv.append(titleDiv, metaGrid, desc, extras, linkBtn);

        // Navigation Controls
        const navDiv = document.createElement('div');
        navDiv.className = 'flex justify-between items-center pt-8 border-t border-brand-mist/50 animate-fade-up';
        navDiv.style.animationDelay = "0.6s";

        const index = globalPOIs.findIndex(p => p.id === poi.id);

        if (index > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'group flex items-center text-left transition-all hover:-translate-x-1';
            prevBtn.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-white border border-brand-mist flex items-center justify-center text-brand-moss shadow-sm group-hover:shadow-md group-hover:border-brand-moss transition-all mr-3">
                    <i class="fas fa-chevron-left"></i>
                </div>
                <div>
                    <span class="block text-[10px] uppercase tracking-widest text-brand-stone font-bold">Previous</span>
                    <span class="text-sm font-bold text-brand-deep group-hover:text-brand-moss transition-colors">Stop #${index}</span>
                </div>
            `;
            prevBtn.onclick = () => navigateToPOI(globalPOIs[index - 1]);
            navDiv.appendChild(prevBtn);
        } else {
            navDiv.appendChild(document.createElement('div'));
        }

        if (index < globalPOIs.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'group flex items-center text-right transition-all hover:translate-x-1';
            nextBtn.innerHTML = `
                <div>
                    <span class="block text-[10px] uppercase tracking-widest text-brand-stone font-bold">Next</span>
                    <span class="text-sm font-bold text-brand-deep group-hover:text-brand-moss transition-colors">Stop #${index + 2}</span>
                </div>
                <div class="w-10 h-10 rounded-full bg-white border border-brand-mist flex items-center justify-center text-brand-moss shadow-sm group-hover:shadow-md group-hover:border-brand-moss transition-all ml-3">
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
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
        if (sheetState === 'hidden' || sheetState === 'peek' || sheetState === 'half') {
            setSheetState('full');
        } else {
            setSheetState('peek');
        }
    });

    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', () => {
            setSheetState('peek');
        });
    }

    // Bottom Sheet Interactions
    if (handle) {
        let startY, initialTranslateY, isDragging = false, hasDragged = false;

        const getTranslateY = (element) => {
            const style = window.getComputedStyle(element);
            const transform = style.transform || style.webkitTransform || style.mozTransform;
            if (!transform || transform === 'none') return 0;
            const matrix = transform.match(/^matrix\((.+)\)$/);
            if (matrix) return parseFloat(matrix[1].split(', ')[5]);
            return 0;
        };

        // Unified Start Handler
        const onDragStart = (y) => {
            startY = y;
            isDragging = true;
            hasDragged = false;

            // Get current visual position from computed style (which reflects the class state)
            initialTranslateY = getTranslateY(sidebar);

            sidebar.style.transition = 'none';
        };

        // Unified Move Handler
        const onDragMove = (y) => {
            if (!isDragging) return;
            const deltaY = y - startY;

            if (Math.abs(deltaY) > 5) hasDragged = true;

            // Calculate new position relative to the initial state
            // Logic: The visual position is initialTranslateY + drag distance
            let newTranslateY = initialTranslateY + deltaY;

            // Resistance when dragging beyond top (negative translateY)
            // Note: full state is translateY(0). Dragging up makes it negative.
            if (newTranslateY < 0) {
                 // Apply resistance (logarithmic or linear damping)
                 newTranslateY = newTranslateY * 0.3;
            }

            sidebar.style.transform = `translateY(${newTranslateY}px)`;
        };

        // Unified End Handler
        const onDragEnd = (y) => {
            if (!isDragging) return;
            isDragging = false;

            // Re-enable transitions
            sidebar.style.transition = '';
            sidebar.style.transform = ''; // Clear inline style to let CSS class take over

            const diff = y - startY;
            const threshold = window.innerHeight * 0.15; // 15% screen height threshold

            // Determine next state based on drag direction and magnitude
            if (!hasDragged) {
                // Tap on handle
                if (sheetState === 'peek') setSheetState('half');
                else if (sheetState === 'half') setSheetState('full');
                else if (sheetState === 'full') setSheetState('half');
                return;
            }

            // Drag Logic
            if (diff < -threshold) {
                // Dragged Up significantly
                if (sheetState === 'peek') setSheetState('half');
                else if (sheetState === 'half') setSheetState('full');
                else setSheetState('full'); // Stay full
            } else if (diff > threshold) {
                // Dragged Down significantly
                if (sheetState === 'full') setSheetState('half');
                else if (sheetState === 'half') setSheetState('peek');
                else setSheetState('peek'); // Stay peek
            } else {
                // Snap back to current state if threshold not met
                setSheetState(sheetState);
            }
        };

        // Touch Events
        handle.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientY), {passive: true});
        handle.addEventListener('touchmove', (e) => onDragMove(e.touches[0].clientY), {passive: true});
        handle.addEventListener('touchend', (e) => onDragEnd(e.changedTouches[0].clientY));

        // Mouse Events
        handle.addEventListener('mousedown', (e) => {
            onDragStart(e.clientY);
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
    // Determine padding based on device to prevent UI overlap
    let paddingOptions = {};
    if (window.innerWidth >= 768) {
        // Desktop: Sidebar is on the left (450px)
        paddingOptions = {
            paddingTopLeft: [450, 0]
        };
    } else {
        // Mobile: Bottom sheet is at the bottom.
        // When navigating, we want the POI to be visible above the 'peek' or 'half' sheet.
        // Assuming peek is ~90px and we want it centered in the remaining space.
        paddingOptions = {
            paddingBottomRight: [0, 100]
        };
    }

    map.flyTo([poi.lat, poi.lng], 13, {
        animate: true,
        duration: 1.5,
        ...paddingOptions
    });

    updateSidebar(poi);
    setActiveMarker(poi.id); // Highlight marker on map

    // On mobile, ensure sheet is in a state that allows map viewing
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
        if (prevIcon.options.className.includes('active-marker')) {
            prevIcon.options.className = prevIcon.options.className.replace(' active-marker', '');
            prevMarker.setIcon(prevIcon);
            prevMarker.setZIndexOffset(0);
        }
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
    // New "Pin" style structure
    // .marker-pin is the teardrop shape
    // i is the icon inside
    const iconHtml = `
        <div class="pulse-ring" style="background-color: ${color};"></div>
        <div class="marker-pin">
            <i class="fas fa-${iconName}" style="color: ${color}"></i>
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon', // Base class
        iconSize: [40, 42],
        iconAnchor: [20, 42],
        popupAnchor: [0, -38]
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
