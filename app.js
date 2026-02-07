// --- GLOBAL STATE ---
let map;
let globalPOIs = [];

// --- MAP INITIALIZATION ---
function initMap() {
    map = L.map('map').setView([64.9631, -19.0208], 6);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=c8301630-e7df-4a9e-84d5-bf5e7453c864', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 16
    }).addTo(map);

    return map;
}

function createInitialSidebarContent() {
    const poiContent = document.getElementById('poi-content');
    poiContent.innerHTML = ''; // Clear existing content

    const heading = document.createElement('h2');
    heading.className = 'text-3xl font-bold mb-4 text-brand-dark';
    heading.textContent = 'The Journey Begins';

    const p = document.createElement('p');
    p.className = 'text-brand-dark mb-6 leading-relaxed';
    p.textContent = 'You stand at the edge of adventure. Before you lies the Ring Road, a ribbon of asphalt looping through landscapes of myth and fire. Each marker on this map is a whisper of wonder, a story waiting to be captured through your lens. Click below to begin your odyssey.';

    poiContent.appendChild(heading);
    poiContent.appendChild(p);

    // Stats Section
    const statsDiv = document.createElement('div');
    statsDiv.className = 'mt-6 border-t border-gray-200 pt-6 mb-6';

    const subHeading = document.createElement('h3');
    subHeading.className = 'text-xl font-semibold text-brand-dark mb-3';
    subHeading.textContent = 'Route Information';

    const ul = document.createElement('ul');
    ul.className = 'mt-2 text-brand-dark space-y-2 text-sm';

    const items = [
        { label: 'Total Length:', value: '~1,332 km (828 miles)' },
        { label: 'Est. Driving Time:', value: '~16-17 hours' },
        { label: 'Direction:', value: 'Counter-clockwise' }
    ];

    const listItems = items.map(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong class="font-semibold">${item.label}</strong> ${item.value}`;
        return li;
    });
    ul.append(...listItems);

    statsDiv.appendChild(subHeading);
    statsDiv.appendChild(ul);
    poiContent.appendChild(statsDiv);

    // Itinerary Section
    if (globalPOIs && globalPOIs.length > 0) {
        const itineraryDiv = document.createElement('div');
        const listHeader = document.createElement('h3');
        listHeader.className = 'text-xl font-semibold text-brand-dark mb-4';
        listHeader.textContent = 'Itinerary';
        itineraryDiv.appendChild(listHeader);

        const poiList = document.createElement('ul');
        poiList.className = 'space-y-2';
        globalPOIs.forEach((poi, index) => {
            const item = document.createElement('li');
            item.className = 'flex items-center p-3 rounded-lg hover:bg-brand-blue cursor-pointer transition-colors group border border-transparent hover:border-brand-blue/50';
            item.innerHTML = `
                <span class="w-8 h-8 flex-shrink-0 rounded-full bg-brand-moss/10 text-brand-moss flex items-center justify-center mr-3 group-hover:bg-brand-moss group-hover:text-white transition-colors text-xs font-bold font-sans">${index + 1}</span>
                <span class="text-brand-dark font-medium group-hover:text-brand-dark transition-colors text-sm">${poi.name}</span>
            `;
            item.addEventListener('click', () => navigateToPOI(poi));
            poiList.appendChild(item);
        });
        itineraryDiv.appendChild(poiList);
        poiContent.appendChild(itineraryDiv);
    }
}

function resetSidebar() {
    createInitialSidebarContent();
}

// --- UI ---
function updateSidebar(poi) {
    const poiContent = document.getElementById('poi-content');
    const DURATION = 200; //ms
    poiContent.style.transition = `opacity ${DURATION}ms ease-in-out`;
    poiContent.style.opacity = '0';

    setTimeout(() => {
        // Clear existing content
        poiContent.innerHTML = '';

        const homeButton = document.createElement('button');
        homeButton.id = 'home-button';
        homeButton.className = 'absolute top-4 left-4 text-brand-slate hover:text-brand-cyan';
        homeButton.setAttribute('aria-label', 'Back to home');
        const homeIcon = document.createElement('i');
        homeIcon.className = 'fas fa-arrow-left fa-lg';
        homeButton.appendChild(homeIcon);

        // Create and append the new elements
        const heading = document.createElement('h2');
        heading.className = "text-2xl font-bold mb-3 text-brand-slate";
        heading.textContent = poi.name;

        const image = document.createElement('img');
        image.src = poi.image;
        image.alt = poi.name;
        image.className = "w-full h-40 object-cover rounded-lg shadow-md mb-4";
        image.onerror = function() {
            this.onerror=null;
            this.src='https://placehold.co/400x300/cccccc/ffffff?text=Image+Not+Found';
        };

        const description = document.createElement('p');
        description.className = "text-brand-slate mb-4 text-sm";
        description.textContent = poi.description;

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

        const index = globalPOIs.findIndex(p => p.name === poi.name);

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

        poiContent.append(homeButton, heading, image, description, link, navDiv);

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
    const map = initMap();
    setupUIEventListeners(map);
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
