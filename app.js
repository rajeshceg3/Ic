// --- DATA ---
const pointsOfInterest = [
    {
        name: "Þingvellir National Park",
        category: "park",
        description: "A site of historical, cultural, and geological significance, located in a rift valley that marks the crest of the Mid-Atlantic Ridge.",
        lat: 64.2558,
        lng: -21.1301,
        image: "https://placehold.co/400x300/6366f1/ffffff?text=Þingvellir",
        link: "https://en.wikipedia.org/wiki/Þingvellir"
    },
    {
        name: "Gullfoss",
        category: "waterfall",
        description: "An iconic waterfall located in the canyon of the Hvítá river in southwest Iceland. The water plummets down in two stages.",
        lat: 64.3271,
        lng: -20.1199,
        image: "https://placehold.co/400x300/34d399/ffffff?text=Gullfoss",
        link: "https://en.wikipedia.org/wiki/Gullfoss"
    },
    {
        name: "Geysir Geothermal Area",
        category: "geothermal",
        description: "Home to the highly active Strokkur geyser, which erupts every 5-10 minutes, and the eponymous, but largely dormant, Geysir.",
        lat: 64.3142,
        lng: -20.3006,
        image: "https://placehold.co/400x300/f59e0b/ffffff?text=Geysir",
        link: "https://en.wikipedia.org/wiki/Geysir"
    },
    {
        name: "Seljalandsfoss",
        category: "waterfall",
        description: "A breathtaking waterfall that you can walk behind, offering a unique perspective. It drops 60 meters over the cliffs of the former coastline.",
        lat: 63.6156,
        lng: -19.9886,
        image: "https://placehold.co/400x300/3b82f6/ffffff?text=Seljalandsfoss",
        link: "https://en.wikipedia.org/wiki/Seljalandsfoss"
    },
    {
        name: "Skógafoss",
        category: "waterfall",
        description: "One of the biggest waterfalls in the country with a width of 25 meters and a drop of 60 meters. A staircase leads to an observation platform.",
        lat: 63.5321,
        lng: -19.5114,
        image: "https://placehold.co/400x300/14b8a6/ffffff?text=Skógafoss",
        link: "https://en.wikipedia.org/wiki/Skógafoss"
    },
    {
        name: "Reynisfjara Black Sand Beach",
        category: "landmark",
        description: "World-famous black-sand beach found on the South Coast of Iceland, with its stunning basalt columns and powerful Atlantic waves.",
        lat: 63.4043,
        lng: -19.0436,
        image: "https://placehold.co/400x300/1f2937/ffffff?text=Reynisfjara",
        link: "https://en.wikipedia.org/wiki/Reynisfjara"
    },
    {
        name: "Vík í Mýrdal",
        category: "town",
        description: "A remote seafront village in south Iceland. It sits in the shadow of the Mýrdalsjökull glacier, which covers the Katla volcano.",
        lat: 63.4194,
        lng: -19.0064,
        image: "https://placehold.co/400x300/ef4444/ffffff?text=Vík",
        link: "https://en.wikipedia.org/wiki/Vík_í_Mýrdal"
    },
    {
        name: "Jökulsárlón Glacier Lagoon",
        category: "landmark",
        description: "A large glacial lake in southeast Iceland, on the edge of Vatnajökull National Park. It's filled with icebergs calving from the Breiðamerkurjökull glacier.",
        lat: 64.0484,
        lng: -16.1795,
        image: "https://placehold.co/400x300/0ea5e9/ffffff?text=Jökulsárlón",
        link: "https://en.wikipedia.org/wiki/Jökulsárlón"
    },
    {
        name: "Egilsstaðir",
        category: "town",
        description: "A town in east Iceland on the banks of the Lagarfljót river. It is the largest settlement of the Eastfjords.",
        lat: 65.2669,
        lng: -14.3948,
        image: "https://placehold.co/400x300/8b5cf6/ffffff?text=Egilsstaðir",
        link: "https://en.wikipedia.org/wiki/Egilsstaðir"
    },
     {
        name: "Mývatn",
        category: "geothermal",
        description: "A shallow lake situated in an area of active volcanism in the north of Iceland, known for its rich fauna of waterbirds.",
        lat: 65.6425,
        lng: -16.9929,
        image: "https://placehold.co/400x300/f97316/ffffff?text=Mývatn",
        link: "https://en.wikipedia.org/wiki/Mývatn"
    },
    {
        name: "Goðafoss",
        category: "waterfall",
        description: "The 'Waterfall of the Gods,' located in the Bárðardalur district of North-Central Iceland at the beginning of the Sprengisandur highland road.",
        lat: 65.6828,
        lng: -17.5503,
        image: "https://placehold.co/400x300/06b6d4/ffffff?text=Goðafoss",
        link: "https://en.wikipedia.org/wiki/Goðafoss"
    },
    {
        name: "Akureyri",
        category: "town",
        description: "Iceland's 'Capital of the North,' it is an important port and fishing centre. The town is located on the west side of the fjord Eyjafjörður.",
        lat: 65.6825,
        lng: -18.0908,
        image: "https://placehold.co/400x300/d946ef/ffffff?text=Akureyri",
        link: "https://en.wikipedia.org/wiki/Akureyri"
    },
    {
        name: "Reykjavík",
        category: "town",
        description: "The capital and largest city of Iceland. It is located in southwestern Iceland, on the southern shore of Faxaflói bay.",
        lat: 64.1466,
        lng: -21.9426,
        image: "https://placehold.co/400x300/ec4899/ffffff?text=Reykjavík",
        link: "https://en.wikipedia.org/wiki/Reykjavík"
    }
];

const ringRoadCoords = [
    [64.1466, -21.9426], [63.973, -21.205], [63.6156, -19.9886], [63.4194, -19.0064],
    [63.965, -17.985], [64.0484, -16.1795], [64.258, -15.209], [65.2669, -14.3948],
    [65.6425, -16.9929], [65.6828, -17.5503], [65.6825, -18.0908], [65.08, -20.8],
    [64.896, -22.5], [64.1466, -21.9426]
];

// --- MAP INITIALIZATION ---
function initMap() {
    const map = L.map('map').setView([64.9631, -19.0208], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    return map;
}

// --- UI ---
function updateSidebar(poi) {
    const poiContent = document.getElementById('poi-content');
    poiContent.classList.remove('fade-in');

    setTimeout(() => {
        poiContent.innerHTML = `
            <div class="fade-in">
                <h2 class="text-2xl font-bold mb-3 text-pastel-dark-slate">${poi.name}</h2>
                <img src="${poi.image}" alt="${poi.name}" class="w-full h-40 object-cover rounded-lg shadow-md mb-4" onerror="this.onerror=null;this.src='https://placehold.co/400x300/cccccc/ffffff?text=Image+Not+Found';">
                <p class="text-pastel-light-slate mb-4 text-sm">${poi.description}</p>
                <a href="${poi.link}" target="_blank" rel="noopener noreferrer" class="block w-full bg-pastel-blue text-white font-semibold text-center py-2 rounded-lg hover:bg-pastel-cyan transition-colors hover-effect text-sm">
                    Learn More <i class="fas fa-external-link-alt ml-1"></i>
                </a>
            </div>
        `;
        poiContent.classList.add('fade-in');
    }, 200);
}

function setupUIEventListeners(map) {
    const sidebar = document.getElementById('poi-sidebar');
    const menuButton = document.getElementById('menu-button');
    const closeSidebarButton = document.getElementById('close-sidebar');
    const userLocationButton = document.getElementById('user-location-button');
    let userMarker;
    let userAccuracyCircle;

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

        userMarker = L.marker(e.latlng).addTo(map)
            .bindPopup(`You are within ${radius.toFixed(0)} meters from this point`).openPopup();

        userAccuracyCircle = L.circle(e.latlng, radius).addTo(map);
    });

    map.on('locationerror', function(e) {
        alert(e.message);
    });
}

// --- MARKERS ---
function createIcon(iconName, color) {
    const iconHtml = `<div class="w-8 h-8 rounded-full shadow-lg flex items-center justify-center" style="background-color: ${color};"><i class="fas fa-${iconName} text-white text-lg"></i></div>`;
    return L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

function addMarkersToMap(map) {
    const icons = {
        waterfall: createIcon('water', '#268BD2'),
        geothermal: createIcon('fire', '#D33682'),
        town: createIcon('city', '#859900'),
        landmark: createIcon('landmark', '#CB4B16'),
        park: createIcon('tree', '#2AA198')
    };

    pointsOfInterest.forEach(poi => {
        const marker = L.marker([poi.lat, poi.lng], { icon: icons[poi.category] || icons.landmark }).addTo(map);

        const popupContent = `
            <div class="p-2">
                <h3 class="text-lg font-bold text-pastel-dark-slate mb-1">${poi.name}</h3>
                <p class="text-sm text-pastel-light-slate">${poi.category.charAt(0).toUpperCase() + poi.category.slice(1)}</p>
            </div>
        `;
        marker.bindPopup(popupContent);

        marker.on('mouseover', function (e) {
            this.openPopup();
        });
        marker.on('mouseout', function (e) {
            this.closePopup();
        });

        marker.on('click', () => {
            updateSidebar(poi);
            if (window.innerWidth < 768) {
                document.getElementById('poi-sidebar').classList.remove('-translate-x-full');
            }
        });
    });
}

// --- MAIN APP ---
function main() {
    const map = initMap();
    const ringRoad = L.polyline(ringRoadCoords, { color: 'rgba(211, 85, 85, 0.8)', weight: 4 }).addTo(map);
    map.fitBounds(ringRoad.getBounds().pad(0.2));

    addMarkersToMap(map);
    setupUIEventListeners(map);

    window.addEventListener('load', () => {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    });
}

main();
