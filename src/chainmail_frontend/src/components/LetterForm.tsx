import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { makeActor } from "../lib/agent";
import type { Mood } from "../lib/types";

const moods: Mood[] = ["NeedInspiration","WantToVent","LookingForMotivation"];

export default function LetterForm({onSent}:{onSent?:()=>void}) {
  const [content,setContent]=useState("");
  const [duration,setDuration]=useState<number>(60); // seconds
  const [mood,setMood]=useState<Mood>("NeedInspiration");
  const [country,setCountry]=useState("");
  const [city,setCity]=useState("");
  const [coords,setCoords]=useState<{lat:number,lng:number}|null>(null);
  const [sending,setSending]=useState(false);

  // approximate geolocation: try Navigator + fallback
  const resolveApprox = async () => {
    // Do NOT gather exact GPS; ask for rough country/city by IP (out of scope offline).
    // We'll let user type country/city and (optionally) rough coordinates via HTML Geolocation rounded 1 decimal.
    if ("geolocation" in navigator) {
      return new Promise<{lat:number,lng:number}|null>((res)=> {
        navigator.geolocation.getCurrentPosition(p=>{
          const lat = Math.round(p.coords.latitude*10)/10;
          const lng = Math.round(p.coords.longitude*10)/10;
          res({lat,lng});
        }, ()=> res(null), { enableHighAccuracy:false, maximumAge:600000, timeout:2500 });
      });
    }
    return null;
  };

  const send = async () => {
    if(!content.trim() || !country.trim()) return;
    setSending(true);
    const approx = coords ?? await resolveApprox();
    const lat = approx?.lat ?? 0;
    const lng = approx?.lng ?? 0;
    const unlock_time = BigInt(Math.floor(Date.now()/1000) + duration);
    const actor:any = await makeActor();
    await actor.send_letter(content, unlock_time, { [mood]: null }, {
      country, city: city? [city] : [],
      lat, lng
    });
    setContent(""); setCity(""); setCountry(""); setCoords(null);
    setDuration(60); setMood("NeedInspiration"); setSending(false);
    onSent?.();
  };

  return (
    <div className="space-y-3">
      <Label>What’s on your mind?</Label>
      <Textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your anonymous letter… (avoid sharing PII)" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Unlock after (seconds)</Label>
          <Input type="number" min={10} value={duration} onChange={e=>setDuration(parseInt(e.target.value||"0"))}/>
        </div>
        <div>
          <Label>Mood / Vibe</Label>
          <select className="w-full bg-black/20 border border-white/10 rounded px-3 py-2" value={mood} onChange={e=>setMood(e.target.value as any)}>
            {moods.map(m => <option key={m} value={m}>{m.replaceAll(/([A-Z])/g," $1").trim()}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Country (approx.)</Label>
          <Input value={country} onChange={e=>setCountry(e.target.value)} placeholder="e.g., Germany"/>
        </div>
        <div>
          <Label>City (optional)</Label>
          <Input value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g., Berlin"/>
        </div>
      </div>

      <div className="text-xs text-white/60">
        We only use rough coordinates for the map. If you allow browser location, we round to 1 decimal (~11km).
      </div>

      <Button onClick={send} disabled={sending} className="w-full">{sending? "Sending…" : "Send Time‑Locked Letter"}</Button>
    </div>
  );
}
