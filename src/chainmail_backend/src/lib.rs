use ic_cdk::update;
use ic_cdk_macros::query;
use std::collections::BTreeMap;
use ic_cdk::storage;
use ic_cdk_macros::*;


#[derive(Clone, Debug, serde::Serialize, serde::Deserialize)]
struct Letter {
    content: String,
    unlock_time: u64,
    sent_time: u64,
    is_unlocked: bool,
}

type LetterStore = BTreeMap<u64, Letter>; // using timestamp as ID

#[update]
fn send_letter(content: String, unlock_time: u64) -> String {
    let now = ic_cdk::api::time() / 1_000_000; // current time in seconds
    let letter = Letter {
        content,
        unlock_time,
        sent_time: now,
        is_unlocked: false,
    };
    storage::stable_btree_map_mut::<u64, Letter>().insert(now, letter);
    format!("Letter scheduled to unlock at {}", unlock_time)
}

#[query]
fn get_unlocked_letters() -> Vec<Letter> {
    let now = ic_cdk::api::time() / 1_000_000;
    storage::stable_btree_map::<u64, Letter>()
        .values()
        .filter(|l| l.unlock_time <= now)
        .cloned()
        .collect()
}
