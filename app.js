// --- MAP INITIALIZATION ---
function initMap() {
    const map = L.map('map').setView([64.9631, -19.0208], 6);

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
    heading.className = 'text-3xl font-bold mb-4 text-brand-slate';
    heading.textContent = 'The Journey Begins';

    const p = document.createElement('p');
    p.className = 'text-brand-slate mb-6';
    p.textContent = 'You stand at the edge of adventure. Before you lies the Ring Road, a ribbon of asphalt looping through landscapes of myth and fire. Each marker on this map is a whisper of wonder, a story waiting to be captured through your lens. Click, and let the odyssey unfold. What will you discover?';

    const div = document.createElement('div');
    div.className = 'mt-6 border-t border-gray-300 pt-6';

    const subHeading = document.createElement('h3');
    subHeading.className = 'text-xl font-semibold text-brand-slate mb-3';
    subHeading.textContent = 'Route Information';

    const ul = document.createElement('ul');
    ul.className = 'mt-2 text-brand-slate space-y-2';

    const items = [
        { label: 'Total Length:', value: '~1,332 km (828 miles)' },
        { label: 'Estimated Driving Time:', value: '~16-17 hours (non-stop)' },
        { label: 'Suggested Direction:', value: 'Counter-clockwise (South coast first)' }
    ];

    const listItems = items.map(item => {
        const li = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = item.label;
        li.appendChild(strong);
        li.appendChild(document.createTextNode(` ${item.value}`));
        return li;
    });
    ul.append(...listItems);

    div.appendChild(subHeading);
    div.appendChild(ul);

    poiContent.appendChild(heading);
    poiContent.appendChild(p);
    poiContent.appendChild(div);
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
        link.className = "block w-full bg-brand-blue text-white font-semibold text-center py-2 rounded-lg hover:bg-brand-cyan transition-colors hover-effect text-sm";

        const linkText = document.createTextNode("Learn More ");
        const icon = document.createElement('i');
        icon.className = "fas fa-external-link-alt ml-1";
        link.appendChild(linkText);
        link.appendChild(icon);

        poiContent.append(homeButton, heading, image, description, link);

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
        sidebar.classList.toggle('-translate-x-full');
    });

    closeSidebarButton.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
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

// --- MARKERS ---
function createIcon(iconName, color) {
    const iconHtml = `<div role="button" tabindex="0" class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center" style="background-color: ${color};"><i class="fas fa-${iconName} text-white text-lg"></i></div>`;
    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
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
            map.flyTo([poi.lat, poi.lng], 13, {
                animate: true,
                duration: 1.5
            });
            updateSidebar(poi);
            if (window.innerWidth < 768) {
                document.getElementById('poi-sidebar').classList.remove('-translate-x-full');
            }
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
            const { pointsOfInterest, ringRoadCoords } = data;
            const ringRoad = L.polyline(ringRoadCoords, { color: '#d35555', weight: 5, opacity: 0.8 });
            ringRoad.addTo(map);
            map.fitBounds(ringRoad.getBounds().pad(0.2));

            // Animate the Ring Road path
            setTimeout(() => {
                ringRoad.snakeIn();
            }, 1000); // Delay to ensure map tiles are loaded

            addMarkersToMap(map, pointsOfInterest);
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
