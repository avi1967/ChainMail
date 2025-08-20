import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardDescription, CardTitle } from "../ui/card";
import { makeActor } from "../lib/agent";
import type { LetterPublic, Mood } from "../lib/types";

const MoodChip = ({m}:{m:Mood}) => (
  <span className="text-xs bg-white/10 rounded px-2 py-1">{m}</span>
);

export default function LetterList(){
  const [letters,setLetters]=useState<LetterPublic[]>([]);
  const [mood, setMood] = useState<Mood | "All">("All");
  const [loading,setLoading]=useState(true);

  const load = async () => {
    setLoading(true);
    const actor:any = await makeActor();
    if (mood === "All") {
      const v = await actor.get_unlocked_letters(BigInt(0), BigInt(100));
      setLetters(v);
    } else {
      const v = await actor.match_letters({ [mood]: null }, 100);
      setLetters(v);
    }
    setLoading(false);
  };

  useEffect(()=>{load();},[mood]);

  const reply = async (id: bigint) => {
    const msg = prompt("Write a short reply:");
    if(!msg) return;
    const actor:any = await makeActor();
    await actor.reply_to_letter(id, msg);
    load();
  };

  const dm = async (id: bigint) => {
    const actor:any = await makeActor();
    const res = await actor.start_dm(id);
    if (Array.isArray(res) && res.length) {
      alert(`DM session started: ${res[0].toString()}`);
    } else {
      alert("DM already exists or failed.");
    }
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <span className="text-sm opacity-70">Filter by vibe:</span>
        {["All","NeedInspiration","WantToVent","LookingForMotivation"].map((m)=>(
          <Button key={m} onClick={()=>setMood(m as any)} className={mood===m? "": "bg-white/10"}>
            {m==="All" ? "All" : (m as string).replaceAll(/([A-Z])/g," $1").trim()}
          </Button>
        ))}
        <Button className="ml-auto" onClick={load}>Refresh</Button>
      </div>

      {loading && <div className="text-white/60">Loading letters…</div>}

      <div className="grid md:grid-cols-2 gap-3">
        {letters.map(l=>(
          <Card key={l.id.toString()}>
            <CardTitle className="mb-1">{l.geo.city?.[0] || l.geo.country}</CardTitle>
            <CardDescription className="mb-2">
              <MoodChip m={l.mood}/>
              <span className="ml-2 text-xs">Unlocked {new Date(Number(l.unlock_time)*1000).toLocaleString()}</span>
            </CardDescription>
            <p className="whitespace-pre-wrap mb-3">{l.content}</p>
            <div className="flex gap-2">
              <Button onClick={()=>reply(l.id)}>Reply</Button>
              <Button onClick={()=>dm(l.id)} className="bg-white/10">{l.has_dm? "Open DM" : "Start DM"}</Button>
            </div>
            {!!l.replies.length && (
              <div className="mt-3 border-t border-white/10 pt-2 space-y-1">
                {l.replies.map((r,i)=>(
                  <div key={i} className="text-sm opacity-80">
                    <span className="opacity-60">{new Date(Number(r.created_at)*1000).toLocaleString()} — </span>
                    {r.message}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
