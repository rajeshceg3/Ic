// --- DATA ---
const pointsOfInterest = [
    {
        name: "Þingvellir: Where Worlds Divide",
        category: "park",
        description: "Stand at the precipice of two continents, where the earth splits to reveal its raw, tectonic soul. This is Þingvellir, a valley echoing with the footfalls of Viking chieftains and the deep groan of shifting worlds. Feel the ancient energy in the air, a place of profound decisions and geological marvel.",
        lat: 64.2558,
        lng: -21.1301,
image: "https://images.unsplash.com/photo-1553528431-57359b7b23a3?q=80&w=800&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Þingvellir"
    },
    {
        name: "Gullfoss: The Golden Cascade",
        category: "waterfall",
        description: "Listen to the thunder of the 'Golden Falls' as the Hvítá river vanishes into a colossal, two-tiered chasm. On a sunny day, rainbows dance in its mist, a spectacle of raw power and ethereal light. You're not just seeing a waterfall; you're witnessing the earth swallow a river whole.",
        lat: 64.3271,
        lng: -20.1199,
        image: "https://images.unsplash.com/photo-1547735395-9b6b373435a7?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Gullfoss"
    },
    {
        name: "Geysir: The Earth's Pulse",
        category: "geothermal",
        description: "Tread lightly on ground that breathes and bubbles. Here, the earth's fiery heart is laid bare. Wait for Strokkur, the ever-faithful geyser, to erupt in a scalding tower of water and steam. It’s a visceral reminder of the untamed energy churning just beneath your feet.",
        lat: 64.3142,
        lng: -20.3006,
        image: "https://images.unsplash.com/photo-1601447296369-a1637d750623?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Geysir"
    },
    {
        name: "Seljalandsfoss: The Watery Veil",
        category: "waterfall",
        description: "This is not a waterfall you simply observe. Seljalandsfoss invites you to step behind its cascading curtain of water. From within its watery cave, the world is transformed into a shimmering, dreamlike panorama. It’s a moment of pure, unadulterated magic.",
        lat: 63.6156,
        lng: -19.9886,
        image: "https://images.unsplash.com/photo-1535332372995-05d04031d23b?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Seljalandsfoss"
    },
    {
        name: "Skógafoss: The River's End",
        category: "waterfall",
        description: "A perfect, roaring rectangle of water, Skógafoss is the final, dramatic flourish of the Skógá River. Climb the steep staircase to its summit and gaze down at the sheer, unbridled power. Legend whispers of a Viking's treasure hidden in the cave behind the falls—what will you find?",
        lat: 63.5321,
        lng: -19.5114,
        image: "https://images.unsplash.com/photo-1574496424165-4f738914b1c7?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Skógafoss"
    },
    {
        name: "Reynisfjara: The Obsidian Shore",
        category: "landmark",
        description: "Step onto a beach of polished black sand, where the Atlantic roars against colossal basalt columns that rise like a church organ. These are the Reynisdrangar sea stacks, said to be petrified trolls caught by the dawn. A place of stark, dramatic beauty, it’s where the ocean shows its teeth.",
        lat: 63.4043,
        lng: -19.0436,
        image: "https://images.unsplash.com/photo-1563807395249-7fb6186b5832?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Reynisfjara"
    },
    {
        name: "Vík í Mýrdal: The Coastal Sentinel",
        category: "town",
        description: "The southernmost village in Iceland, Vík is a sanctuary nestled between the black sand beaches and the looming presence of the Mýrdalsjökull glacier. Its iconic red-roofed church stands as a lonely guardian against the elements, a beacon of warmth in a wild landscape.",
        lat: 63.4194,
        lng: -19.0064,
        image: "https://images.unsplash.com/photo-1596706692342-93d8b4e72350?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Vík_í_Mýrdal"
    },
    {
        name: "Jökulsárlón: The Diamond Lagoon",
        category: "landmark",
        description: "Witness a slow, silent ballet of ancient ice. Here, colossal icebergs calve from a glacier and drift serenely in a turquoise lagoon before washing ashore on Diamond Beach. The air crackles with the sound of shifting ice, a symphony of impermanence and breathtaking beauty.",
        lat: 64.0484,
        lng: -16.1795,
        image: "https://images.unsplash.com/photo-1517799538318-1986c5a89b4a?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Jökulsárlón"
    },
    {
        name: "Egilsstaðir: The Eastern Crossroads",
        category: "town",
        description: "After the winding fjords, Egilsstaðir appears as a calm haven on the banks of the Lagarfljót river. It’s the heart of the East, a place to rest and regroup, surrounded by forests and legends of a mythical lake worm. A perfect pause in your epic journey.",
        lat: 65.2669,
        lng: -14.3948,
        image: "https://images.unsplash.com/photo-1622325350919-8e4a9a0e6b3a?q=80&w=1932&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Egilsstaðir"
    },
     {
        name: "Mývatn: The Cauldron of Creation",
        category: "geothermal",
        description: "Enter a landscape forged in fire. Mývatn is a geothermal wonderland of bubbling mud pots, volcanic craters, and steam vents hissing from the earth. The air is thick with the smell of sulfur and the hum of creation, a testament to Iceland's volcanic soul.",
        lat: 65.6425,
        lng: -16.9929,
        image: "https://images.unsplash.com/photo-1593532910110-8912918838b4?q=80&w=2065&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Mývatn"
    },
    {
        name: "Goðafoss: The Waterfall of Gods",
        category: "waterfall",
        description: "A crescent-shaped cascade of immense power and historical weight. It was here, a millennium ago, that Iceland's law-speaker cast idols of the old Norse gods into the churning water, embracing Christianity. You can feel the echoes of that decision in the roar of the falls.",
        lat: 65.6828,
        lng: -17.5503,
        image: "https://images.unsplash.com/photo-1606906173797-19274358d116?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Goðafoss"
    },
    {
        name: "Akureyri: The Northern Heart",
        category: "town",
        description: "Nestled at the head of Iceland's longest fjord, Akureyri is a vibrant splash of culture and color against a backdrop of snow-capped peaks. It’s a city that beats with a warm, welcoming heart, offering a cozy respite before your final push back to the capital.",
        lat: 65.6825,
        lng: -18.0908,
        image: "https://images.unsplash.com/photo-1590322969192-0b8b1a8a2a5f?q=80&w=2070&auto=format&fit=crop",
        link: "https://en.wikipedia.org/wiki/Akureyri"
    },
    {
        name: "Reykjavík: The Journey's End & Beginning",
        category: "town",
        description: "You've come full circle. The world's northernmost capital, Reykjavík is a city of vibrant art, innovative cuisine, and quirky charm, all powered by the geothermal energy you've witnessed. It's the perfect place to reflect on your journey and, perhaps, plan the next one.",
        lat: 64.1466,
        lng: -21.9426,
        image: "https://images.unsplash.com/photo-1551493793-5479427d1a29?q=80&w=2070&auto=format&fit=crop",
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
    const DURATION = 200; //ms
    poiContent.style.transition = `opacity ${DURATION}ms ease-in-out`;
    poiContent.style.opacity = '0';


    setTimeout(() => {
        poiContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-3 text-pastel-dark-slate">${poi.name}</h2>
            <img src="${poi.image}" alt="${poi.name}" class="w-full h-40 object-cover rounded-lg shadow-md mb-4" onerror="this.onerror=null;this.src='https://placehold.co/400x300/cccccc/ffffff?text=Image+Not+Found';">
            <p class="text-pastel-light-slate mb-4 text-sm">${poi.description}</p>
            <a href="${poi.link}" target="_blank" rel="noopener noreferrer" class="block w-full bg-pastel-blue text-white font-semibold text-center py-2 rounded-lg hover:bg-pastel-cyan transition-colors hover-effect text-sm">
                Learn More <i class="fas fa-external-link-alt ml-1"></i>
            </a>
        `;
        poiContent.style.opacity = '1';
    }, DURATION);
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
        loadingOverlay.addEventListener('transitionend', () => {
            loadingOverlay.style.display = 'none';
        }, { once: true });
    });
}

main();
