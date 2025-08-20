import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import type { DmSession } from "../lib/types";
import { makeActor } from "../lib/agent";

export default function DMPanel(){
  const [sessionId,setSessionId]=useState<string>("");
  const [session,setSession]=useState<DmSession|null>(null);
  const [message,setMessage]=useState("");

  const load = async () => {
    if(!sessionId) return;
    const actor:any = await makeActor();
    const res = await actor.get_dm(BigInt(sessionId));
    if(Array.isArray(res) && res.length) setSession(res[0]);
    else setSession(null);
  };

  const send = async () => {
    if(!sessionId || !message.trim()) return;
    const actor:any = await makeActor();
    await actor.send_dm(BigInt(sessionId), message);
    setMessage("");
    load();
  };

  useEffect(()=>{ load(); }, [sessionId]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input placeholder="Enter DM session id…" value={sessionId} onChange={e=>setSessionId(e.target.value)}/>
        <Button onClick={load}>Open</Button>
      </div>
      {session ? (
        <div className="border border-white/10 rounded p-3 space-y-2">
          <div className="text-sm opacity-70">DM #{session.id.toString()} • letter {session.letter_id.toString()}</div>
          <div className="max-h-56 overflow-auto space-y-2">
            {session.messages.map((m,i)=>(
              <div key={i} className="text-sm">
                <span className="opacity-60">{m.author_tag} — {new Date(Number(m.created_at)*1000).toLocaleTimeString()}: </span>
                {m.message}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type a message…" value={message} onChange={e=>setMessage(e.target.value)}/>
            <Button onClick={send}>Send</Button>
          </div>
        </div>
      ) : (
        <div className="text-white/60 text-sm">No session open.</div>
      )}
    </div>
  );
}
