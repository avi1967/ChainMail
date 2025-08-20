import { Button } from "../ui/button";
export default function Navbar(){
  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-black/30 border-b border-white/10">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <div className="text-xl font-bold">ChainMail</div>
        <div className="text-xs opacity-70">Anonymous, time‑locked letters across the world</div>
        <Button onClick={()=>window.scrollTo({top:document.body.scrollHeight, behavior:"smooth"})}>Write a Letter</Button>
      </div>
    </div>
  );
}
