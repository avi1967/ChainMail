import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from "./idl";

const CANISTER_ID = import.meta.env.VITE_CANISTER_ID_CHAINMAIL as string;
const HOST = import.meta.env.VITE_DFX_HOST || "http://127.0.0.1:4943";

export const makeActor = async () => {
  const agent = new HttpAgent({ host: HOST });

  if (HOST.includes("127.0.0.1") || HOST.includes("localhost")) {
    await agent.fetchRootKey();
  }

  return Actor.createActor(idlFactory as any, {
    agent,
    canisterId: CANISTER_ID,
  });
};
