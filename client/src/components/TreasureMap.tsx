import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

export type MapTreasure = {
  id: number;
  name: string;
  islandName: string;
  latitude: number;
  longitude: number;
  value: number;
  status: "Found" | "Lost" | "Stolen";
  terrain?: string | null;
  burialDepth?: number | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const statusColor: Record<MapTreasure["status"], string> = {
  Found: "#4bd68b",
  Lost: "#ff6861",
  Stolen: "#f5bb42",
};

const HAVEN_PORTS = [
  { name: "Port Royal Haven (Caribbean Base)", latitude: 17.93, longitude: -76.84, symbol: "⚓", region: "Caribbean" },
  { name: "Kochi Pirate Port (Malabar Coast, India)", latitude: 9.96, longitude: 76.24, symbol: "🔱", region: "India" },
  { name: "Galle Fort Haven (Sri Lanka)", latitude: 6.03, longitude: 80.21, symbol: "💎", region: "Sri Lanka" },
];

const DANGER_ZONES = [
  // Caribbean Region
  {
    id: "enemy-patrol-caribbean-north",
    name: "☠️ Royal Navy Battleship Patrol",
    type: "Enemy Patrol Zone",
    color: "#ff3b30",
    fillColor: "#ff3b30",
    fillOpacity: 0.22,
    center: [18.2, -73.5] as [number, number],
    radius: 120000,
    description: "High Risk Enemy Zone! Royal Navy frigates heavily patrol this sector. High chance of naval ambush.",
  },
  {
    id: "storm-surge-caribbean",
    name: "🌊 Hurricane & Ocean Flood Surge Trench",
    type: "Flood & Storm Zone",
    color: "#00b0ff",
    fillColor: "#00b0ff",
    fillOpacity: 0.25,
    center: [14.5, -76.8] as [number, number],
    radius: 150000,
    description: "Extreme Weather Hazard! Violent sea surge, sudden tidal flooding, and rogue waves.",
  },
  {
    id: "smuggler-caribbean-south",
    name: "🏴‍匪 Spanish Galleon Privateer Blockade",
    type: "Enemy Territory",
    color: "#ff9100",
    fillColor: "#ff9100",
    fillOpacity: 0.22,
    center: [12.2, -70.5] as [number, number],
    radius: 110000,
    description: "Hostile Marauder Territory! Spanish war frigates enforce strict contraband blockades.",
  },
  {
    id: "kraken-caribbean-reef",
    name: "🦑 Serpent Reef & Shallow Shoals",
    type: "Monster & Reef Hazard",
    color: "#a855f7",
    fillColor: "#9333ea",
    fillOpacity: 0.24,
    center: [16.8, -78.2] as [number, number],
    radius: 95000,
    description: "Treacherous jagged reefs! Uncharted coral heads ready to rip open ship hulls.",
  },

  // India / Malabar / Sri Lanka Region
  {
    id: "kraken-reef-india",
    name: "🦑 Kraken Reef & Whirlpool Abyss",
    type: "Monster & Reef Hazard",
    color: "#a855f7",
    fillColor: "#9333ea",
    fillOpacity: 0.24,
    center: [9.8, 76.2] as [number, number],
    radius: 130000,
    description: "Abyssal Trench & Jagged Reefs! Leviathan whirlpools and treacherous shallow reefs.",
  },
  {
    id: "smuggler-enemy-asia",
    name: "🏴‍匪 East India Co. War Fleet Sector",
    type: "Enemy Patrol Zone",
    color: "#ff3b30",
    fillColor: "#ff3b30",
    fillOpacity: 0.22,
    center: [12.5, 74.8] as [number, number],
    radius: 115000,
    description: "Heavy Armed Blockade! East India Company warships targeting pirate vessels.",
  },
  {
    id: "cyclone-flood-asia",
    name: "🌊 Malabar Monsoon Surge",
    type: "Flood & Storm Zone",
    color: "#00b0ff",
    fillColor: "#00b0ff",
    fillOpacity: 0.25,
    center: [6.8, 79.5] as [number, number],
    radius: 125000,
    description: "Severe Monsoon Danger! High flooding risk, zero visibility rainstorms, and tidal swells.",
  },
  {
    id: "corsair-ambush-sri-lanka",
    name: "🗡️ Corsair Pirate Ambush Trench",
    type: "Enemy Territory",
    color: "#ff9100",
    fillColor: "#ff9100",
    fillOpacity: 0.22,
    center: [5.2, 81.8] as [number, number],
    radius: 100000,
    description: "Rival Corsair Fleet! Heavily armed pirate interceptors waiting in cove passes.",
  },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function calculateDistanceNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): { degrees: number; compass: string } {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;

  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(brng / 45) % 8;
  return { degrees: Math.round(brng), compass: points[index] };
}

function markerIcon(status: MapTreasure["status"], isSelected: boolean = false) {
  const color = statusColor[status];
  const symbol = status === "Found" ? "✦" : status === "Lost" ? "×" : "!";
  const activeClass = isSelected ? " selected-pin" : "";
  return L.divIcon({
    className: "treasure-marker-wrap",
    html: `<span class="treasure-marker${activeClass}" style="--marker-color:${color}"><b>${symbol}</b></span>`,
    iconSize: [34, 46],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40],
  });
}

function havenMarkerIcon(symbol: string) {
  return L.divIcon({
    className: "haven-marker-wrap",
    html: `<span class="haven-marker"><b>${symbol}</b></span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function shipMarkerIcon() {
  return L.divIcon({
    className: "ship-voyage-marker",
    html: `<div class="live-ship-emblem">⛵</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

function userLocationMarkerIcon() {
  return L.divIcon({
    className: "user-location-marker",
    html: `<div class="user-ship-emblem">🧭</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19],
  });
}

type LaneStatus = "safe" | "danger" | "storm" | "leviathan";

const statusLineStyles: Record<LaneStatus, { color: string; dashArray?: string; label: string }> = {
  safe: { color: "#4bd68b", label: "🟢 Safe Passage" },
  danger: { color: "#ff4d4d", dashArray: "6, 6", label: "🔴 Enemy Blockade" },
  storm: { color: "#f5bb42", dashArray: "8, 8", label: "🟡 Storm Surge" },
  leviathan: { color: "#a855f7", dashArray: "4, 10", label: "🟣 Leviathan Risk" },
};

export default function TreasureMap({
  treasures,
  selectedTreasure,
  onSelect,
  onPick,
  onEdit,
}: {
  treasures: MapTreasure[];
  selectedTreasure?: MapTreasure | null;
  onSelect?: (treasure: MapTreasure | null) => void;
  onPick?: (lat: number, lng: number) => void;
  onEdit?: (treasure: any) => void;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const routesRef = useRef<L.LayerGroup | null>(null);
  const dangerRef = useRef<L.LayerGroup | null>(null);
  const seaLanesRef = useRef<L.LayerGroup | null>(null);

  const [showRoutes, setShowRoutes] = useState(true);
  const [showDangerZones, setShowDangerZones] = useState(true);
  const [showSeaLanes, setShowSeaLanes] = useState(true);
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [showFogOfWar, setShowFogOfWar] = useState(false);
  const [showRadarSweep, setShowRadarSweep] = useState(false);
  const [routeMode, setRouteMode] = useState<"voyage" | "hub" | "selected">("voyage");

  // Dynamic Interactive Sea Lane Statuses
  const [laneStatuses, setLaneStatuses] = useState<Record<string, LaneStatus>>({});

  // Plotting mode - only open add treasure when explicitly enabled
  const [isPlottingMode, setIsPlottingMode] = useState(false);
  const isPlottingModeRef = useRef(isPlottingMode);
  useEffect(() => {
    isPlottingModeRef.current = isPlottingMode;
  }, [isPlottingMode]);

  // Live Voyage Simulator States
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const shipMarkerRef = useRef<L.Marker | null>(null);
  const userLocationMarkerRef = useRef<L.Marker | null>(null);

  // Captain's Flagship Vessel Location
  const [shipLocation, setShipLocation] = useState<{ lat: number; lng: number; name: string }>({
    lat: 17.93,
    lng: -76.84,
    name: "Port Royal Fleet Base",
  });

  const sailFlagshipTo = useCallback((lat: number, lng: number, name: string) => {
    setShipLocation({ lat, lng, name });
    toast.success(`Flagship "The Black Pearl" sailed to ${name}! Connected sea lanes updated.`);
  }, []);

  // Combine Flagship Node with all Treasures for full mesh connectivity
  const allNodes = useMemo(() => {
    const flagshipNode: MapTreasure = {
      id: -999,
      name: `⛵ Flagship "The Black Pearl" (${shipLocation.name})`,
      islandName: "Command Ship",
      latitude: shipLocation.lat,
      longitude: shipLocation.lng,
      value: 0,
      status: "Found",
    };
    return [flagshipNode, ...treasures];
  }, [shipLocation, treasures]);

  // Generate Sea Lanes connecting all nodes (Flagship + Treasures)
  const generatedLanes = useMemo(() => {
    if (allNodes.length < 2) return [];

    const laneMap = new Map<string, { key: string; t1: MapTreasure; t2: MapTreasure; distanceNM: number }>();

    allNodes.forEach((t1) => {
      const distances = allNodes
        .filter((t2) => t2.id !== t1.id)
        .map((t2) => ({
          t2,
          dist: calculateDistanceNM(t1.latitude, t1.longitude, t2.latitude, t2.longitude),
        }))
        .sort((a, b) => a.dist - b.dist);

      // Connect each node to its 3 nearest neighbors
      const neighbors = distances.slice(0, Math.min(3, distances.length));
      neighbors.forEach(({ t2, dist }) => {
        const id1 = Math.min(t1.id, t2.id);
        const id2 = Math.max(t1.id, t2.id);
        const key = `${id1}-${id2}`;
        if (!laneMap.has(key)) {
          laneMap.set(key, { key, t1: t1.id === id1 ? t1 : t2, t2: t1.id === id1 ? t2 : t1, distanceNM: dist });
        }
      });
    });

    return Array.from(laneMap.values());
  }, [allNodes]);

  // Compute local blockade status for each individual treasure node
  const perNodeBlockade = useMemo(() => {
    const statusMap = new Map<number, { totalLanes: number; dangerLanes: number; isBlocked: boolean }>();

    allNodes.forEach((node) => {
      const nodeLanes = generatedLanes.filter((l) => l.t1.id === node.id || l.t2.id === node.id);
      const dangerCount = nodeLanes.filter((l) => (laneStatuses[l.key] || "safe") === "danger").length;
      const isBlocked = nodeLanes.length > 0 && dangerCount === nodeLanes.length;
      statusMap.set(node.id, { totalLanes: nodeLanes.length, dangerLanes: dangerCount, isBlocked });
    });

    return statusMap;
  }, [allNodes, generatedLanes, laneStatuses]);

  // Compute overall network lane statistics for threat monitoring
  const laneStats = useMemo(() => {
    if (generatedLanes.length === 0) return { total: 0, safe: 0, danger: 0, storm: 0, leviathan: 0, is100PercentBlocked: false };

    let safe = 0;
    let danger = 0;
    let storm = 0;
    let leviathan = 0;

    generatedLanes.forEach(({ key }) => {
      const st = laneStatuses[key] || "safe";
      if (st === "safe") safe++;
      else if (st === "danger") danger++;
      else if (st === "storm") storm++;
      else if (st === "leviathan") leviathan++;
    });

    const is100PercentBlocked = generatedLanes.length > 0 && danger === generatedLanes.length;
    return { total: generatedLanes.length, safe, danger, storm, leviathan, is100PercentBlocked };
  }, [generatedLanes, laneStatuses]);

  const setLaneStatus = useCallback((laneKey: string, status: LaneStatus) => {
    setLaneStatuses((prev) => ({ ...prev, [laneKey]: status }));
    const label = statusLineStyles[status].label;
    toast.success(`Sea Lane updated: ${label}`);
  }, []);

  const resetAllLanesToSafe = useCallback(() => {
    setLaneStatuses({});
    toast.success("All Sea Lanes cleared! Safe navigation restored.");
  }, []);

  const markAllLanesAsDanger = useCallback(() => {
    const updated: Record<string, LaneStatus> = {};
    generatedLanes.forEach((l) => {
      updated[l.key] = "danger";
    });
    setLaneStatuses(updated);
    toast.error("ALL SEA LANES MARKED AS DANGER BLOCKADES!");
  }, [generatedLanes]);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const map = L.map(elementRef.current, { zoomControl: false, minZoom: 2, maxZoom: 12, worldCopyJump: true }).setView([12, 10], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", className: "nautical-tiles" }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const routesGroup = L.layerGroup().addTo(map);
    const dangerGroup = L.layerGroup().addTo(map);
    const seaLanesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    map.on("click", (event) => {
      if (isPlottingModeRef.current) {
        onPick?.(event.latlng.lat, event.latlng.lng);
        setIsPlottingMode(false);
      }
    });

    mapRef.current = map;
    markersRef.current = markersGroup;
    routesRef.current = routesGroup;
    dangerRef.current = dangerGroup;
    seaLanesRef.current = seaLanesGroup;

    setTimeout(() => map.invalidateSize(), 120);
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      routesRef.current = null;
      dangerRef.current = null;
      seaLanesRef.current = null;
    };
  }, [onPick]);

  // Render Connected Sea Lanes
  useEffect(() => {
    if (!seaLanesRef.current) return;
    seaLanesRef.current.clearLayers();

    if (showSeaLanes) {
      generatedLanes.forEach(({ key, t1, t2, distanceNM }) => {
        const currentStatus: LaneStatus = laneStatuses[key] || "safe";
        const style = statusLineStyles[currentStatus];

        const polyline = L.polyline(
          [
            [t1.latitude, t1.longitude],
            [t2.latitude, t2.longitude],
          ],
          {
            color: style.color,
            weight: currentStatus === "danger" ? 4.5 : 3,
            opacity: 0.88,
            dashArray: style.dashArray,
          }
        );

        const popupDiv = document.createElement("div");
        popupDiv.className = "map-popup lane-control-popup";
        popupDiv.style.minWidth = "180px";
        popupDiv.innerHTML = `
          <strong>⚓ Connected Sea Lane</strong>
          <span><b>${t1.name}</b> ↔ <b>${t2.name}</b></span>
          <small style="color:#f3c66b;display:block;margin:3px 0;">Distance: ${distanceNM} NM (${Math.round(distanceNM / 3)} Leagues)</small>
          <div style="font-size:10px;margin-bottom:6px;">Current Status: <b style="color:${style.color}">${style.label}</b></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            <button class="lane-set-btn safe" style="padding:5px 6px;background:rgba(75,214,139,0.2);color:#4bd68b;border:1px solid #4bd68b;border-radius:4px;font-size:9px;font-weight:bold;cursor:pointer;">🟢 Safe</button>
            <button class="lane-set-btn danger" style="padding:5px 6px;background:rgba(255,77,77,0.2);color:#ff4d4d;border:1px solid #ff4d4d;border-radius:4px;font-size:9px;font-weight:bold;cursor:pointer;">🔴 Danger</button>
            <button class="lane-set-btn storm" style="padding:5px 6px;background:rgba(245,187,66,0.2);color:#f5bb42;border:1px solid #f5bb42;border-radius:4px;font-size:9px;font-weight:bold;cursor:pointer;">🟡 Storm</button>
            <button class="lane-set-btn leviathan" style="padding:5px 6px;background:rgba(168,85,247,0.2);color:#a855f7;border:1px solid #a855f7;border-radius:4px;font-size:9px;font-weight:bold;cursor:pointer;">🟣 Leviathan</button>
          </div>
        `;

        popupDiv.querySelector(".lane-set-btn.safe")?.addEventListener("click", () => setLaneStatus(key, "safe"));
        popupDiv.querySelector(".lane-set-btn.danger")?.addEventListener("click", () => setLaneStatus(key, "danger"));
        popupDiv.querySelector(".lane-set-btn.storm")?.addEventListener("click", () => setLaneStatus(key, "storm"));
        popupDiv.querySelector(".lane-set-btn.leviathan")?.addEventListener("click", () => setLaneStatus(key, "leviathan"));

        polyline.bindPopup(popupDiv);
        polyline.bindTooltip(`<b>Sea Lane: ${t1.name} ↔ ${t2.name}</b><br/>Status: ${style.label}`, { sticky: true });
        polyline.addTo(seaLanesRef.current!);
      });
    }
  }, [generatedLanes, laneStatuses, showSeaLanes, setLaneStatus]);

  // Active navigation route target (closest haven to selected treasure)
  const activeNavInfo = useMemo(() => {
    if (!selectedTreasure) return null;
    let closestHaven = HAVEN_PORTS[0];
    let minDistance = Infinity;
    HAVEN_PORTS.forEach((h) => {
      const d = calculateDistanceNM(h.latitude, h.longitude, selectedTreasure.latitude, selectedTreasure.longitude);
      if (d < minDistance) {
        minDistance = d;
        closestHaven = h;
      }
    });

    const bearing = calculateBearing(closestHaven.latitude, closestHaven.longitude, selectedTreasure.latitude, selectedTreasure.longitude);
    const estHours = Math.round(minDistance / 8); // 8 knots sailing speed
    const estDays = (estHours / 24).toFixed(1);

    return {
      origin: closestHaven,
      destination: selectedTreasure,
      distanceNM: minDistance,
      leagues: Math.round(minDistance / 3),
      bearing,
      estDays,
      estHours,
    };
  }, [selectedTreasure]);

  // Pan & fit bounds to selected treasure and origin haven if provided
  useEffect(() => {
    if (selectedTreasure && mapRef.current) {
      if (activeNavInfo) {
        const bounds = L.latLngBounds(
          [activeNavInfo.origin.latitude, activeNavInfo.origin.longitude],
          [selectedTreasure.latitude, selectedTreasure.longitude]
        );
        mapRef.current.flyToBounds(bounds.pad(0.35), { duration: 1.3, maxZoom: 8 });
      } else {
        mapRef.current.flyTo([selectedTreasure.latitude, selectedTreasure.longitude], 6, { duration: 1.2 });
      }
    }
  }, [selectedTreasure, activeNavInfo]);

  // Total route statistics
  const totalStats = useMemo(() => {
    let totalNM = 0;
    if (treasures.length === 0) return { totalNM: 0, leagues: 0, legs: 0 };

    const westTreasures = treasures.filter((t) => t.longitude < 0);
    const eastTreasures = treasures.filter((t) => t.longitude >= 0);

    const calcLegs = (items: MapTreasure[], haven: (typeof HAVEN_PORTS)[0]) => {
      let prevLat = haven.latitude;
      let prevLng = haven.longitude;
      items.forEach((item) => {
        totalNM += calculateDistanceNM(prevLat, prevLng, item.latitude, item.longitude);
        prevLat = item.latitude;
        prevLng = item.longitude;
      });
    };

    if (westTreasures.length) calcLegs(westTreasures, HAVEN_PORTS[0]);
    if (eastTreasures.length) calcLegs(eastTreasures, HAVEN_PORTS[1]);

    return { totalNM, leagues: Math.round(totalNM / 3), legs: treasures.length };
  }, [treasures]);

  // Draw Danger Zones
  useEffect(() => {
    if (!dangerRef.current) return;
    dangerRef.current.clearLayers();

    if (showDangerZones) {
      DANGER_ZONES.forEach((zone) => {
        const circle = L.circle(zone.center, {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.fillColor,
          fillOpacity: zone.fillOpacity,
          weight: 2.5,
          dashArray: "6, 8",
        });
        circle.bindTooltip(`<b>${zone.name}</b><br/><i>Category: ${zone.type}</i>`, { sticky: true });
        circle.bindPopup(`
          <div class="map-popup danger-popup">
            <strong style="color:${zone.color};">${zone.name}</strong>
            <span style="font-weight:bold;color:#fce4ad;">Hazard Type: ${zone.type}</span>
            <em style="color:#d5e5e5;line-height:1.4;">${zone.description}</em>
          </div>
        `);
        circle.addTo(dangerRef.current!);
      });
    }
  }, [showDangerZones]);

  useEffect(() => {
    if (!markersRef.current || !routesRef.current) return;

    markersRef.current.clearLayers();
    routesRef.current.clearLayers();

    // 1. Draw Captain Flagship Vessel Marker
    const flagshipMarker = L.marker([shipLocation.lat, shipLocation.lng], { icon: shipMarkerIcon() });
    flagshipMarker.bindPopup(`
      <div class="map-popup">
        <strong style="color:#27b6ae;">⛵ Captain's Flagship "The Black Pearl"</strong>
        <span>Anchorage: <b>${shipLocation.name}</b></span>
        <em>Command Vessel · Hub of Fleet Sea Lanes</em>
        <small style="display:block;margin-top:4px;color:#819698;">Lat: ${shipLocation.lat.toFixed(2)}° · Lng: ${shipLocation.lng.toFixed(2)}°</small>
      </div>
    `);
    flagshipMarker.addTo(markersRef.current!);

    // 2. Draw Haven Ports
    HAVEN_PORTS.forEach((haven) => {
      const havenMarker = L.marker([haven.latitude, haven.longitude], { icon: havenMarkerIcon(haven.symbol) });
      const havenPopup = document.createElement("div");
      havenPopup.className = "map-popup";
      havenPopup.innerHTML = `
        <strong>${haven.symbol} ${haven.name}</strong>
        <span>Pirate Safe Haven & Base Harbor</span>
        <em>Full Shipyard · Restock Supplies & Rum</em>
        <button class="map-sail-flagship-btn" style="margin-top:8px;width:100%;padding:5px 8px;background:rgba(39,182,174,0.25);color:#27b6ae;border:1px solid #27b6ae;border-radius:5px;font-weight:bold;font-size:10px;cursor:pointer;">
          ⛵ Sail Flagship to this Haven
        </button>
      `;
      havenPopup.querySelector(".map-sail-flagship-btn")?.addEventListener("click", () => {
        sailFlagshipTo(haven.latitude, haven.longitude, haven.name);
      });
      havenMarker.bindPopup(havenPopup);
      havenMarker.addTo(markersRef.current!);
    });

    // 3. Draw Treasure Markers
    treasures.forEach((treasure) => {
      const isSelected = selectedTreasure?.id === treasure.id;
      const blockadeInfo = perNodeBlockade.get(treasure.id);
      const isBlocked = blockadeInfo?.isBlocked;

      const marker = L.marker([treasure.latitude, treasure.longitude], { icon: markerIcon(treasure.status, isSelected) });

      const popupContainer = document.createElement("div");
      popupContainer.className = "map-popup";
      popupContainer.innerHTML = `
        <strong>${treasure.name}</strong>
        <span>${treasure.islandName}</span>
        <em>${treasure.status} · ${new Intl.NumberFormat("en-US").format(treasure.value)} doubloons</em>
        <small style="display:block;margin-top:4px;color:#d79334;">Lat: ${treasure.latitude.toFixed(2)}° · Lng: ${treasure.longitude.toFixed(2)}°</small>
        ${
          isBlocked
            ? `<div style="background:rgba(239,68,68,0.25);border:1px solid #f87171;color:#ff4d4d;padding:5px 8px;border-radius:4px;font-size:10px;font-weight:bold;margin:6px 0;text-align:center;">
                ⚠️ 100% SEA LANES BLOCKED! (0 Safe Routes)
              </div>`
            : ""
        }
        <div style="display:flex;flex-direction:column;gap:5px;margin-top:8px;">
          <div style="display:flex;gap:6px;">
            <button class="map-track-btn" style="flex:1.2;padding:5px 8px;background:#e7aa4e;color:#102832;border:0;border-radius:5px;font-weight:bold;font-size:10px;cursor:pointer;">
              ⚓ Track Route
            </button>
            <button class="map-edit-btn" style="flex:0.8;padding:5px 8px;background:rgba(12,37,46,0.9);color:#f3c66b;border:1px solid rgba(243,198,107,0.5);border-radius:5px;font-weight:bold;font-size:10px;cursor:pointer;">
              ✏️ Edit
            </button>
          </div>
          <button class="map-sail-flagship-btn" style="width:100%;padding:5px 8px;background:rgba(39,182,174,0.2);color:#27b6ae;border:1px solid #27b6ae;border-radius:5px;font-weight:bold;font-size:10px;cursor:pointer;">
            ⛵ Sail Flagship Here
          </button>
        </div>
      `;

      popupContainer.querySelector(".map-track-btn")?.addEventListener("click", () => {
        onSelect?.(treasure);
        setShowRoutes(true);
        setRouteMode("selected");
      });

      popupContainer.querySelector(".map-edit-btn")?.addEventListener("click", () => {
        onEdit?.(treasure);
      });

      popupContainer.querySelector(".map-sail-flagship-btn")?.addEventListener("click", () => {
        sailFlagshipTo(treasure.latitude, treasure.longitude, treasure.name);
      });

      marker.bindPopup(popupContainer);
      if (onSelect) {
        marker.on("click", () => {
          onSelect(treasure);
          setShowRoutes(true);
          setRouteMode("selected");
        });
      }
      marker.addTo(markersRef.current!);
    });

    // 3. Draw Routes if enabled
    if (showRoutes && treasures.length > 0) {
      const westTreasures = treasures.filter((t) => t.longitude < 0).sort((a, b) => b.latitude - a.latitude);
      const eastTreasures = treasures.filter((t) => t.longitude >= 0).sort((a, b) => a.longitude - b.longitude);

      const drawRoutePath = (haven: (typeof HAVEN_PORTS)[0], group: MapTreasure[], strokeColor: string) => {
        if (group.length === 0) return;

        if (routeMode === "voyage") {
          const latLngs: [number, number][] = [[haven.latitude, haven.longitude]];
          group.forEach((t) => latLngs.push([t.latitude, t.longitude]));
          latLngs.push([haven.latitude, haven.longitude]);

          const glowPolyline = L.polyline(latLngs, {
            color: strokeColor,
            weight: 6,
            opacity: 0.35,
          });
          glowPolyline.addTo(routesRef.current!);

          const polyline = L.polyline(latLngs, {
            color: strokeColor,
            weight: 3.5,
            opacity: 0.9,
            dashArray: "8, 12",
            className: "nautical-animated-path",
          });

          polyline.bindTooltip(`<b>⚓ Safe Voyage Loop (${haven.region})</b><br/>${group.length} Sea Legs`, { sticky: true });
          polyline.addTo(routesRef.current!);

          for (let i = 0; i < latLngs.length - 1; i++) {
            const p1 = latLngs[i];
            const p2 = latLngs[i + 1];
            const dist = calculateDistanceNM(p1[0], p1[1], p2[0], p2[1]);
            const midLat = (p1[0] + p2[0]) / 2;
            const midLng = (p1[1] + p2[1]) / 2;

            L.circleMarker([midLat, midLng], {
              radius: 4,
              color: strokeColor,
              fillColor: "#061118",
              fillOpacity: 0.95,
            })
              .bindTooltip(`<b>${dist} NM</b> (${Math.round(dist / 3)} Leagues)<br/><i>🟢 Safe Passage</i>`, { direction: "top" })
              .addTo(routesRef.current!);
          }
        } else if (routeMode === "hub") {
          group.forEach((t) => {
            const dist = calculateDistanceNM(haven.latitude, haven.longitude, t.latitude, t.longitude);
            const line = L.polyline(
              [
                [haven.latitude, haven.longitude],
                [t.latitude, t.longitude],
              ],
              { color: strokeColor, weight: 2.5, opacity: 0.8, dashArray: "5, 8" }
            );
            line.bindTooltip(`<b>${haven.name} ➔ ${t.name}</b><br/>Direct Leg: ${dist} NM (${Math.round(dist / 3)} Leagues)`);
            line.addTo(routesRef.current!);
          });
        }
      };

      drawRoutePath(HAVEN_PORTS[0], westTreasures, "#f3c66b");
      drawRoutePath(HAVEN_PORTS[1], eastTreasures, "#4bd68b");

      // Draw active selected route target if in selected mode
      if (selectedTreasure) {
        let closestHaven = HAVEN_PORTS[0];
        let minD = Infinity;
        HAVEN_PORTS.forEach((h) => {
          const d = calculateDistanceNM(h.latitude, h.longitude, selectedTreasure.latitude, selectedTreasure.longitude);
          if (d < minD) {
            minD = d;
            closestHaven = h;
          }
        });

        const target = selectedTreasure;
        const highlightLine = L.polyline(
          [
            [closestHaven.latitude, closestHaven.longitude],
            [target.latitude, target.longitude],
          ],
          { color: "#ff6861", weight: 4.5, opacity: 0.95, dashArray: "10, 10", className: "nautical-animated-path" }
        );
        highlightLine.bindTooltip(`<b>🔥 TARGET VOYAGE: ${closestHaven.name} ➔ ${target.name}</b><br/>Distance: ${minD} NM (${Math.round(minD / 3)} Leagues)`, { permanent: true, direction: "center" });
        highlightLine.addTo(routesRef.current!);
      }
    }
  }, [treasures, showRoutes, routeMode, selectedTreasure, onSelect, onEdit]);

  // Live Voyage Simulator Effect
  useEffect(() => {
    if (!isSimulating || !mapRef.current) return;

    const target = selectedTreasure || treasures[0];
    if (!target) return;

    let closestHaven = HAVEN_PORTS[0];
    let minD = Infinity;
    HAVEN_PORTS.forEach((h) => {
      const d = calculateDistanceNM(h.latitude, h.longitude, target.latitude, target.longitude);
      if (d < minD) {
        minD = d;
        closestHaven = h;
      }
    });

    const startLat = closestHaven.latitude;
    const startLng = closestHaven.longitude;
    const endLat = target.latitude;
    const endLng = target.longitude;

    if (!shipMarkerRef.current) {
      shipMarkerRef.current = L.marker([startLat, startLng], { icon: shipMarkerIcon() }).addTo(mapRef.current);
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.015;
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
        setIsSimulating(false);
        toast.success(`Arrived safely at ${target.name}!`);
      }

      const currLat = startLat + (endLat - startLat) * progress;
      const currLng = startLng + (endLng - startLng) * progress;

      shipMarkerRef.current?.setLatLng([currLat, currLng]);
      mapRef.current?.panTo([currLat, currLng], { animate: true });
      setSimProgress(Math.round(progress * 100));
    }, 50);

    return () => {
      clearInterval(interval);
      if (shipMarkerRef.current) {
        shipMarkerRef.current.remove();
        shipMarkerRef.current = null;
      }
    };
  }, [isSimulating, selectedTreasure, treasures]);

  const jumpToRegion = (region: "caribbean" | "asia") => {
    if (!mapRef.current) return;
    if (region === "caribbean") {
      mapRef.current.flyTo([15, -73], 5, { duration: 1.5 });
    } else {
      mapRef.current.flyTo([10, 80], 5, { duration: 1.5 });
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation || !mapRef.current) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast("Acquiring your current nautical position...", { icon: "🧭" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (!userLocationMarkerRef.current) {
          userLocationMarkerRef.current = L.marker([lat, lng], {
            icon: userLocationMarkerIcon(),
          }).addTo(mapRef.current!);
        } else {
          userLocationMarkerRef.current.setLatLng([lat, lng]);
        }
        userLocationMarkerRef.current
          .bindPopup(`
            <div class="map-popup">
              <strong>🧭 Your Current Ship Position</strong>
              <span>Lat: ${lat.toFixed(4)}° · Lng: ${lng.toFixed(4)}°</span>
            </div>
          `)
          .openPopup();
        mapRef.current?.flyTo([lat, lng], 8, { duration: 1.4 });
        toast.success("Redirected map to your location");
      },
      () => {
        toast.error("Could not fetch location. Defaulting to Port Royal Haven");
        mapRef.current?.flyTo([17.93, -76.84], 7, { duration: 1.2 });
      }
    );
  };

  return (
    <div className="treasure-map" ref={elementRef} aria-label="Interactive treasure map">
      {/* Floating Route Control Overlay */}
      <div
        className="map-route-controls"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={`map-route-toggle ${showRoutes ? "active" : ""}`}
          onClick={() => setShowRoutes((v) => !v)}
          title="Toggle Safe Nautical Shipping Routes"
        >
          ⚓ Safe Routes {showRoutes ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          className={`map-route-toggle ${showSeaLanes ? "active" : ""}`}
          onClick={() => setShowSeaLanes((v) => !v)}
          title="Toggle Inter-Treasure Connected Sea Lanes Mesh"
          style={{
            background: showSeaLanes
              ? "linear-gradient(180deg, rgba(75, 214, 139, 0.35), rgba(43, 179, 104, 0.55))"
              : undefined,
            borderColor: showSeaLanes ? "#4bd68b" : undefined,
          }}
        >
          🌐 Sea Lanes {showSeaLanes ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          className={`map-route-toggle ${showDangerZones ? "active-danger" : ""}`}
          onClick={() => setShowDangerZones((v) => !v)}
          title="Toggle Enemy Patrol & Storm Danger Zones"
          style={{
            background: showDangerZones
              ? "linear-gradient(180deg, rgba(239, 68, 68, 0.4), rgba(185, 28, 28, 0.6))"
              : undefined,
            borderColor: showDangerZones ? "#f87171" : undefined,
          }}
        >
          ☠️ Danger Zones {showDangerZones ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          className={`map-route-toggle ${showWindVectors ? "active" : ""}`}
          onClick={() => {
            setShowWindVectors((v) => !v);
            toast.info(`Wind Vector Overlay: ${!showWindVectors ? "ENABLED (18 Knots ENE)" : "DISABLED"}`);
          }}
          title="Toggle Animated Nautical Wind Vector Overlay"
        >
          🌬️ Wind Vectors {showWindVectors ? "ON" : "OFF"}
        </button>

        <button
          type="button"
          className={`map-route-toggle ${showRadarSweep ? "active" : ""}`}
          onClick={() => {
            setShowRadarSweep((v) => !v);
            toast.info(`Tactical Proximity Radar: ${!showRadarSweep ? "ACTIVE SCANNING" : "OFF"}`);
          }}
          title="Toggle Circular Radar Proximity Scanner Overlay"
        >
          🧭 Tactical Radar {showRadarSweep ? "ON" : "OFF"}
        </button>

        {showRoutes && (
          <>
            <button
              type="button"
              className={`map-route-mode-btn ${routeMode === "voyage" ? "active" : ""}`}
              onClick={() => setRouteMode("voyage")}
            >
              Voyage Loop
            </button>
            <button
              type="button"
              className={`map-route-mode-btn ${routeMode === "hub" ? "active" : ""}`}
              onClick={() => setRouteMode("hub")}
            >
              Haven Sea Lanes
            </button>
            <button
              type="button"
              className={`map-route-mode-btn ${isSimulating ? "active" : ""}`}
              onClick={() => setIsSimulating((v) => !v)}
            >
              {isSimulating ? `⛵ Simulating (${simProgress}%)` : "▶ Simulate Voyage"}
            </button>
          </>
        )}

        <button
          type="button"
          className={`map-route-mode-btn ${isPlottingMode ? "active-plot" : ""}`}
          onClick={() => {
            setIsPlottingMode((v) => {
              const next = !v;
              if (next) toast("Click anywhere on the map to plot pin coordinates", { icon: "📍" });
              return next;
            });
          }}
          title="Click map to place a new treasure cache"
        >
          {isPlottingMode ? "📍 Plotting: CLICK MAP" : "➕ Plot New Cache"}
        </button>

        <button
          type="button"
          className="map-route-mode-btn"
          onClick={locateUser}
          title="Pan & Redirect Map to Your Current GPS Location"
        >
          🎯 My Location
        </button>

        <button type="button" className="map-route-mode-btn" onClick={() => jumpToRegion("caribbean")}>
          📍 Caribbean
        </button>
        <button type="button" className="map-route-mode-btn" onClick={() => jumpToRegion("asia")}>
          📍 India & Sri Lanka
        </button>
      </div>

      {/* Live Tracked Route HUD Panel */}
      {selectedTreasure && activeNavInfo && (
        <div
          className="map-active-nav-panel"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="nav-panel-head">
            <div>
              <span className="eyebrow">LIVE NAVIGATION HUD</span>
              <strong>⚓ Route to: {activeNavInfo.destination.name}</strong>
            </div>
            <button onClick={() => onSelect?.(null)}>✕</button>
          </div>
          <div className="nav-panel-grid">
            <div>
              <span>ORIGIN HAVEN</span>
              <b>{activeNavInfo.origin.name}</b>
            </div>
            <div>
              <span>BEARING</span>
              <b>{activeNavInfo.bearing.degrees}° {activeNavInfo.bearing.compass}</b>
            </div>
            <div>
              <span>DISTANCE</span>
              <b>{activeNavInfo.distanceNM} NM ({activeNavInfo.leagues} Leagues)</b>
            </div>
            <div>
              <span>SAILING TIME</span>
              <b>~{activeNavInfo.estDays} Days (@ 8 Knots)</b>
            </div>
          </div>
          <div className="nav-panel-actions">
            <button
              className="button gold"
              onClick={() => setIsSimulating(true)}
              disabled={isSimulating}
            >
              {isSimulating ? `⛵ Sailing... (${simProgress}%)` : "▶ Start Live Voyage Simulation"}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Sea Lanes Threat Monitor HUD */}
      {showSeaLanes && (
        <div
          className="map-route-hud"
          style={{ bottom: "14px", left: "14px", display: "flex", gap: "10px", alignItems: "center" }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span>Sea Lanes: <b>{laneStats.total}</b></span>
          <span>🟢 Safe: <b style={{ color: "#4bd68b" }}>{laneStats.safe}</b></span>
          <span>🔴 Danger: <b style={{ color: "#ff4d4d" }}>{laneStats.danger}</b></span>
          <span>🟡 Storm: <b style={{ color: "#f5bb42" }}>{laneStats.storm}</b></span>
          <span>🟣 Reef: <b style={{ color: "#a855f7" }}>{laneStats.leviathan}</b></span>
          <button
            type="button"
            style={{ padding: "3px 8px", background: "rgba(255, 77, 77, 0.2)", color: "#ff4d4d", border: "1px solid #ff4d4d", borderRadius: "4px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
            onClick={markAllLanesAsDanger}
            title="Simulate 100% Enemy Blockade"
          >
            ⚠️ Block All
          </button>
          <button
            type="button"
            style={{ padding: "3px 8px", background: "rgba(75, 214, 139, 0.2)", color: "#4bd68b", border: "1px solid #4bd68b", borderRadius: "4px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}
            onClick={resetAllLanesToSafe}
            title="Clear all blockades"
          >
            🔓 Reset Lanes
          </button>
        </div>
      )}

      {/* 100% Blockade High Priority Warning Modal */}
      {laneStats.is100PercentBlocked && (
        <div className="modal-backdrop" style={{ zIndex: 10000, background: "rgba(18, 2, 2, 0.92)", backdropFilter: "blur(8px)" }}>
          <div className="treasure-modal" style={{ width: "min(520px, 92vw)", border: "2px solid #ff4d4d", textAlign: "center", boxShadow: "0 0 40px rgba(255, 77, 77, 0.6)" }}>
            <div style={{ color: "#ff4d4d", fontSize: "44px", animation: "pulse-user-ship 1.2s infinite alternate" }}>⚠️☠️⚠️</div>
            <h2 style={{ color: "#ff4d4d", fontFamily: "Georgia, serif", fontSize: "22px", margin: "8px 0" }}>100% SEA LANES COMPROMISED & BLOCKED!</h2>
            <p style={{ color: "#fca5a5", fontSize: "12px", lineHeight: "1.6", margin: "8px 0" }}>
              CRITICAL FLEET ALERT, CAPTAIN! Every single sea passage connecting your charted treasure caches has been designated as <b>🔴 DANGER / ENEMY BLOCKADE</b>. You currently have <b>NO SAFE ESCAPE LANES</b> remaining!
            </p>
            <div style={{ background: "rgba(255, 77, 77, 0.15)", border: "1px dashed #ff4d4d", padding: "12px", borderRadius: "8px", margin: "16px 0", color: "#fecaca", fontSize: "11px", textAlign: "left" }}>
              <b>• Total Compromised Passages:</b> {laneStats.danger} / {laneStats.total} Lanes<br />
              <b>• Threat Status:</b> Spanish Navy & Corsair Warships Enforcing Full Maritime Siege<br />
              <b>• Action Required:</b> Re-evaluate navigation risk or clear enemy blockades immediately!
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "16px" }}>
              <button
                className="button gold"
                style={{ background: "linear-gradient(180deg, #ff4d4d, #b91c1c)", color: "white", borderColor: "#f87171" }}
                onClick={resetAllLanesToSafe}
              >
                🔓 Clear All Enemy Blockades & Restore Safe Lanes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
