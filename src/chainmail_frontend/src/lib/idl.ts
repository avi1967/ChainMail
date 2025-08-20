import { IDL } from "@dfinity/candid";

export const idlFactory = ({ IDL }: { IDL: typeof import("@dfinity/candid").IDL }) => {
  const Mood = IDL.Variant({
    NeedInspiration: IDL.Null,
    WantToVent: IDL.Null,
    LookingForMotivation: IDL.Null
  });
  const Geo = IDL.Record({
    country: IDL.Text,
    city: IDL.Opt(IDL.Text),
    lat: IDL.Float64,
    lng: IDL.Float64
  });
  const Reply = IDL.Record({ message: IDL.Text, created_at: IDL.Nat64 });
  const LetterPublic = IDL.Record({
    id: IDL.Nat64, content: IDL.Text, mood: Mood, geo: Geo,
    created_at: IDL.Nat64, unlock_time: IDL.Nat64,
    replies: IDL.Vec(Reply), has_dm: IDL.Bool
  });
  const DmMessage = IDL.Record({
    message: IDL.Text, created_at: IDL.Nat64, author_tag: IDL.Text
  });
  const DmSession = IDL.Record({
    id: IDL.Nat64, letter_id: IDL.Nat64, created_at: IDL.Nat64,
    messages: IDL.Vec(DmMessage)
  });
  return IDL.Service({
    health: IDL.Func([], [IDL.Text], ["query"]),
    send_letter: IDL.Func([IDL.Text, IDL.Nat64, Mood, Geo], [IDL.Nat64], []),
    get_unlocked_letters: IDL.Func([IDL.Nat64, IDL.Nat64], [IDL.Vec(LetterPublic)], ["query"]),
    match_letters: IDL.Func([Mood, IDL.Nat32], [IDL.Vec(LetterPublic)], []),
    reply_to_letter: IDL.Func([IDL.Nat64, IDL.Text], [IDL.Bool], []),
    start_dm: IDL.Func([IDL.Nat64], [IDL.Opt(IDL.Nat64)], []),
    send_dm: IDL.Func([IDL.Nat64, IDL.Text], [IDL.Bool], []),
    get_dm: IDL.Func([IDL.Nat64], [IDL.Opt(DmSession)], ["query"])
  });
};
