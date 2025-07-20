use ic_cdk_macros::*;
use ic_cdk::api::time;
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    BTreeMap as StableBTreeMap, DefaultMemoryImpl,
    storable::{Storable, Bound}
};
use std::borrow::Cow;
use std::cell::RefCell;
use serde::{Serialize, Deserialize};
use candid::{CandidType, encode_one, decode_one};

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
struct Letter {
    content: String,
    unlock_time: u64,
    sent_time: u64,
    is_unlocked: bool,
}

impl Storable for Letter {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(encode_one(self).expect("failed to encode"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        decode_one(&bytes).expect("failed to decode")
    }

    const BOUND: Bound = Bound::Unbounded;
}

type Memory = DefaultMemoryImpl;
thread_local! {
    static MEMORY_MANAGER: MemoryManager<Memory> = MemoryManager::init(DefaultMemoryImpl::default());
    // Corrected: Use VirtualMemory<Memory> as the memory type for StableBTreeMap
    static LETTERS: RefCell<StableBTreeMap<u64, Letter, VirtualMemory<Memory>>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.get(MemoryId::new(0))))
    );
}



#[update]
fn send_letter(content: String, unlock_time: u64) -> String {
    let now = time() / 1_000_000;
    let letter = Letter {
        content,
        unlock_time,
        sent_time: now,
        is_unlocked: false,
    };

    LETTERS.with(|map| {
        map.borrow_mut().insert(now, letter);
    });

    format!("Letter scheduled to unlock at {}", unlock_time)
}

#[query]
fn get_unlocked_letters() -> Vec<Letter> {
    let now = time() / 1_000_000;
    LETTERS.with(|map| {
        map.borrow()
            .iter()
            .filter_map(|(_, letter)| {
                if letter.unlock_time <= now {
                    Some(letter.clone())
                } else {
                    None
                }
            })
            .collect()
    })
}
