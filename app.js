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
        listHeader.className = 'text-xl font-semibold text-brand-dark mb-4';
        listHeader.textContent = activeCategory === 'All' ? 'Itinerary' : `${activeCategory} Locations`;
        listDiv.appendChild(listHeader);

        const poiList = document.createElement('ul');
        poiList.className = 'space-y-2';

        filteredPOIs.forEach((poi) => {
            const index = globalPOIs.findIndex(p => p.id === poi.id);
            const item = document.createElement('li');
            item.className = 'flex items-center p-3 rounded-lg hover:bg-brand-blue cursor-pointer transition-colors group border border-transparent hover:border-brand-blue/50';
            item.innerHTML = `
                <span class="w-8 h-8 flex-shrink-0 rounded-full bg-brand-moss/10 text-brand-moss flex items-center justify-center mr-3 group-hover:bg-brand-moss group-hover:text-white transition-colors text-xs font-bold font-sans">${index + 1}</span>
                <span class="text-brand-dark font-medium group-hover:text-brand-dark transition-colors text-sm">${poi.name}</span>
                ${favorites.has(poi.id) ? '<i class="fas fa-heart text-brand-lava ml-auto text-xs"></i>' : ''}
            `;
            item.addEventListener('click', () => navigateToPOI(poi));
            poiList.appendChild(item);
        });
        listDiv.appendChild(poiList);
        poiContent.appendChild(listDiv);

    } else if (activeTab === 'logbook') {
        const heading = document.createElement('h2');
        heading.className = 'text-3xl font-bold mb-4 text-brand-dark';
        heading.textContent = 'My Logbook';
        poiContent.appendChild(heading);

        // Explorer Level Logic
        const favCount = favorites.size;
        let level = "Novice Explorer";
        let levelIcon = "map";
        let levelColor = "text-gray-500";
        let nextLevelMsg = "Save 3 locations to level up!";

        if (favCount >= 7) {
            level = "Viking Legend";
            levelIcon = "khanda"; // or crown
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
        levelBadge.className = 'bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-100 flex items-center';
        levelBadge.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mr-4 ${levelColor}">
                <i class="fas fa-${levelIcon} fa-lg"></i>
            </div>
            <div>
                <h3 class="font-bold text-brand-dark text-sm uppercase tracking-wide">Current Status</h3>
                <p class="text-lg font-playfair font-bold ${levelColor}">${level}</p>
                <p class="text-xs text-gray-500 mt-1">${nextLevelMsg}</p>
            </div>
        `;
        poiContent.appendChild(levelBadge);

        if (favorites.size === 0) {
             poiContent.innerHTML += `
                <div class="text-center mt-10 text-gray-400">
                    <i class="far fa-heart fa-3x mb-3 text-gray-300"></i>
                    <p class="font-medium">Your logbook is empty.</p>
                    <p class="text-xs mt-2">Heart locations to save them here.</p>
                </div>
             `;
        } else {
             const favList = globalPOIs.filter(p => favorites.has(p.id));
             const poiList = document.createElement('ul');
             poiList.className = 'space-y-2 mt-4';

             favList.forEach((poi) => {
                const item = document.createElement('li');
                item.className = 'flex items-center p-3 rounded-lg hover:bg-brand-blue cursor-pointer transition-colors group border border-transparent hover:border-brand-blue/50';
                item.innerHTML = `
                    <span class="w-8 h-8 flex-shrink-0 rounded-full bg-brand-lava/10 text-brand-lava flex items-center justify-center mr-3 group-hover:bg-brand-lava group-hover:text-white transition-colors text-xs font-bold font-sans"><i class="fas fa-heart"></i></span>
                    <span class="text-brand-dark font-medium group-hover:text-brand-dark transition-colors text-sm">${poi.name}</span>
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
function updateSidebar(poi) {
    const poiContent = document.getElementById('poi-content');
    const tabsContainer = document.getElementById('sidebar-tabs');

    // Hide tabs
    if (tabsContainer) tabsContainer.classList.add('hidden');

    const DURATION = 200; //ms
    poiContent.style.transition = `opacity ${DURATION}ms ease-in-out`;
    poiContent.style.opacity = '0';

    setTimeout(() => {
        // Clear existing content
        poiContent.innerHTML = '';

        const homeButton = document.createElement('button');
        homeButton.id = 'home-button';
        homeButton.className = 'absolute top-4 left-4 text-brand-slate hover:text-brand-moss transition-colors z-10';
        homeButton.setAttribute('aria-label', 'Back to home');
        const homeIcon = document.createElement('i');
        homeIcon.className = 'fas fa-arrow-left fa-lg';
        homeButton.appendChild(homeIcon);

        // Heart Button
        const heartBtn = document.createElement('button');
        const isFav = favorites.has(poi.id);
        heartBtn.className = `absolute top-4 right-4 w-10 h-10 rounded-full glass-panel flex items-center justify-center transition-all z-10 hover:shadow-lg ${isFav ? 'text-brand-lava' : 'text-gray-400 hover:text-brand-lava'}`;
        heartBtn.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart fa-lg"></i>`;
        heartBtn.onclick = (e) => {
            e.stopPropagation();
            toggleFavorite(poi.id);
            const newIsFav = favorites.has(poi.id);
            heartBtn.innerHTML = `<i class="${newIsFav ? 'fas' : 'far'} fa-heart fa-lg"></i>`;
            heartBtn.className = `absolute top-4 right-4 w-10 h-10 rounded-full glass-panel flex items-center justify-center transition-all z-10 hover:shadow-lg ${newIsFav ? 'text-brand-lava' : 'text-gray-400 hover:text-brand-lava'}`;
        };

        // ... Content creation ...
        const heading = document.createElement('h2');
        heading.className = "text-2xl font-bold mb-3 text-brand-slate mt-10"; // Added margin top for buttons
        heading.textContent = poi.name;

        // Tags
        const tagsDiv = document.createElement('div');
        tagsDiv.className = 'flex flex-wrap gap-2 mb-4';
        if (poi.tags) {
            poi.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium';
                tagSpan.textContent = tag;
                tagsDiv.appendChild(tagSpan);
            });
        }

        const image = document.createElement('img');
        image.src = poi.image;
        image.alt = poi.name;
        image.className = "w-full h-48 object-cover rounded-lg shadow-md mb-4"; // Taller image
        image.onerror = function() {
            this.onerror=null;
            this.src='https://placehold.co/400x300/cccccc/ffffff?text=Image+Not+Found';
        };

        const description = document.createElement('p');
        description.className = "text-brand-slate mb-4 text-sm leading-relaxed";
        description.textContent = poi.description;

        // Enrich content: Tips & Best Time
        const extrasDiv = document.createElement('div');
        extrasDiv.className = 'bg-brand-blue/20 rounded-lg p-4 mb-4 text-sm space-y-2';

        if (poi.duration) {
             const durationP = document.createElement('p');
             durationP.innerHTML = `<strong class="text-brand-dark"><i class="fas fa-hourglass-half mr-1 text-brand-moss"></i> Duration:</strong> ${poi.duration}`;
             extrasDiv.appendChild(durationP);
        }

        if (poi.bestTime) {
            const timeP = document.createElement('p');
            timeP.innerHTML = `<strong class="text-brand-dark"><i class="far fa-clock mr-1 text-brand-moss"></i> Best Time:</strong> ${poi.bestTime}`;
            extrasDiv.appendChild(timeP);
        }

        if (poi.accessibility) {
            const accessP = document.createElement('p');
            accessP.innerHTML = `<strong class="text-brand-dark"><i class="fas fa-universal-access mr-1 text-brand-moss"></i> Accessibility:</strong> ${poi.accessibility}`;
            extrasDiv.appendChild(accessP);
        }

        if (poi.tips) {
            const tipP = document.createElement('p');
            tipP.innerHTML = `<strong class="text-brand-dark"><i class="far fa-lightbulb mr-1 text-brand-moss"></i> Pro Tip:</strong> ${poi.tips}`;
            extrasDiv.appendChild(tipP);
        }

        if (poi.folklore) {
            const folkloreDiv = document.createElement('div');
            folkloreDiv.className = 'mt-3 pt-3 border-t border-brand-blue/30';
            folkloreDiv.innerHTML = `<p class="italic text-brand-slate"><strong class="text-brand-dark not-italic"><i class="fas fa-book-open mr-1 text-brand-lava"></i> Local Lore:</strong> "${poi.folklore}"</p>`;
            extrasDiv.appendChild(folkloreDiv);
        }

        const link = document.createElement('a');
        link.href = poi.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "block w-full bg-brand-moss text-white font-semibold text-center py-3 rounded-lg hover:bg-brand-dark transition-all hover:shadow-md text-sm mb-6";

        const linkText = document.createTextNode("Read Full Guide ");
        const icon = document.createElement('i');
        icon.className = "fas fa-external-link-alt ml-1";
        link.appendChild(linkText);
        link.appendChild(icon);

        // Navigation Controls
        const navDiv = document.createElement('div');
        navDiv.className = 'flex justify-between items-center pt-4 border-t border-gray-200';

        const index = globalPOIs.findIndex(p => p.id === poi.id);

        if (index > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'text-brand-moss hover:text-brand-dark font-medium flex items-center text-sm transition-colors px-3 py-2 rounded-lg hover:bg-gray-50';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left mr-2"></i> Previous';
            prevBtn.onclick = () => navigateToPOI(globalPOIs[index - 1]);
            navDiv.appendChild(prevBtn);
        } else {
            navDiv.appendChild(document.createElement('div')); // Spacer
        }

        if (index < globalPOIs.length - 1) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'text-brand-moss hover:text-brand-dark font-medium flex items-center text-sm transition-colors px-3 py-2 rounded-lg hover:bg-gray-50';
            nextBtn.innerHTML = 'Next Stop <i class="fas fa-chevron-right ml-2"></i>';
            nextBtn.onclick = () => navigateToPOI(globalPOIs[index + 1]);
            navDiv.appendChild(nextBtn);
        }

        poiContent.append(homeButton, heartBtn, heading, tagsDiv, image, description, extrasDiv, link, navDiv);

        poiContent.style.opacity = '1';
    }, DURATION);
}

function setupUIEventListeners(map) {
    const sidebar = document.getElementById('poi-sidebar');
    const menuButton = document.getElementById('menu-button');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const userLocationButton = document.getElementById('user-location-button');
    const poiContent = document.getElementById('poi-content');
    let userMarker;
    let userAccuracyCircle;

    poiContent.addEventListener('click', (e) => {
        if (e.target.closest('#home-button')) {
            resetSidebar();
        }
    });

    menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('translate-y-full');
    });

    closeSidebarButton.addEventListener('click', () => {
        sidebar.classList.add('translate-y-full');
    });

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
    // On mobile, show the bottom sheet
    if (window.innerWidth < 768) {
        document.getElementById('poi-sidebar').classList.remove('translate-y-full');
    }
}

// --- MARKERS ---
function createIcon(iconName, color) {
    const iconHtml = `<div role="button" tabindex="0" class="w-10 h-10 rounded-full shadow-xl flex items-center justify-center border-2 border-white transform transition-transform hover:scale-110" style="background-color: ${color};"><i class="fas fa-${iconName} text-white text-lg"></i></div>`;
    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
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
