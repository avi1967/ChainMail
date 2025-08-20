import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { makeActor } from "../lib/agent";

export default function MapView(){
  useEffect(()=> {
    const map = L.map("map", { zoomControl: false, attributionControl: false }).setView([20,0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 6 }).addTo(map);

    const addGlowing = (lat:number,lng:number)=>{
      const divIcon = L.divIcon({ className: "glow-blob", iconSize: [32,32] });
      L.marker([lat,lng], { icon: divIcon }).addTo(map);
    };

    const load = async () => {
      const actor:any = await makeActor();
      const letters = await actor.get_unlocked_letters(BigInt(0), BigInt(300));
      letters.forEach((l:any)=> addGlowing(l.geo.lat, l.geo.lng));
    };
    load();

    return () => { map.remove(); };
  }, []);

  return (
    <div id="map" className="w-full h-[380px] rounded-lg border border-white/10 shadow-glow" />
  );
}
