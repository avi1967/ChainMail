use candid::{CandidType, Deserialize};
use ic_cdk::api::{self, time};
use ic_cdk_macros::*;
use std::cell::RefCell;
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq, Eq)]
pub enum Mood {
    NeedInspiration,
    WantToVent,
    LookingForMotivation,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Geo {
    pub country: String,
    pub city: Option<String>,
    pub lat: f64,
    pub lng: f64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Reply {
    pub message: String,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Letter {
    pub id: u64,
    pub content: String,
    pub mood: Mood,
    pub geo: Geo,
    pub created_at: u64,
    pub unlock_time: u64,
    pub replies: Vec<Reply>,
    pub dm_session_id: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct LetterPublic {
    pub id: u64,
    pub content: String,
    pub mood: Mood,
    pub geo: Geo,
    pub created_at: u64,
    pub unlock_time: u64,
    pub replies: Vec<Reply>,
    pub has_dm: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DmMessage {
    pub message: String,
    pub created_at: u64,
    pub author_tag: String,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DmSession {
    pub id: u64,
    pub letter_id: u64,
    pub created_at: u64,
    pub messages: Vec<DmMessage>,
}

#[derive(CandidType, Deserialize)]
struct StableState {
    letters: Vec<Letter>,
    dms: HashMap<u64, DmSession>,
    next_letter_id: u64,
    next_dm_id: u64,
}

thread_local! {
    static STATE: RefCell<StableState> = RefCell::new(StableState{
        letters: vec![],
        dms: HashMap::new(),
        next_letter_id: 0,
        next_dm_id: 0,
    });
}

fn now_sec() -> u64 { time() / 1_000_000_000 }

/// Random u64 using raw_rand (falls back to hash of time+caller)
async fn ic_rand_u64() -> u64 {
    use ic_cdk::api::management_canister::main::raw_rand;
    if let Ok((bytes,)) = raw_rand().await {
        let mut out = 0u64;
        for (i, b) in bytes.0.iter().take(8).enumerate() {
            out |= (*b as u64) << (i * 8);
        }
        out
    } else {
        let mut h = 0xcbf29ce484222325u64;
        for b in format!("{}-{}", time(), api::caller().to_text()).bytes() {
            h ^= b as u64; h = h.wrapping_mul(0x100000001b3);
        }
        h
    }
}

#[update]
pub async fn send_letter(content: String, unlock_time: u64, mood: Mood, geo: Geo) -> u64 {
    let id = STATE.with(|s| { let mut st = s.borrow_mut(); let id = st.next_letter_id; st.next_letter_id += 1; id });
    let letter = Letter {
        id, content, mood, geo,
        created_at: now_sec(),
        unlock_time,
        replies: vec![],
        dm_session_id: None,
    };
    STATE.with(|s| s.borrow_mut().letters.push(letter));
    id
}

#[query]
pub fn get_unlocked_letters(offset: u64, limit: u64) -> Vec<LetterPublic> {
    let now = now_sec();
    let mut out: Vec<LetterPublic> = STATE.with(|s| {
        s.borrow().letters.iter()
            .filter(|l| l.unlock_time <= now)
            .skip(offset as usize).take(limit as usize)
            .map(|l| LetterPublic {
                id: l.id,
                content: l.content.clone(),
                mood: l.mood.clone(),
                geo: l.geo.clone(),
                created_at: l.created_at,
                unlock_time: l.unlock_time,
                replies: l.replies.clone(),
                has_dm: l.dm_session_id.is_some(),
            }).collect()
    });
    out.sort_by_key(|l| std::cmp::Reverse(l.created_at));
    out
}

/// Mood-based randomized matching (ensures fairness)
#[update]
pub async fn match_letters(mood: Mood, limit: u32) -> Vec<LetterPublic> {
    let now = now_sec();
    let mut pool: Vec<LetterPublic> = STATE.with(|s| {
        s.borrow().letters.iter()
         .filter(|l| l.mood == mood && l.unlock_time <= now)
         .map(|l| LetterPublic {
            id: l.id, content: l.content.clone(), mood: l.mood.clone(),
            geo: l.geo.clone(), created_at: l.created_at, unlock_time: l.unlock_time,
            replies: l.replies.clone(), has_dm: l.dm_session_id.is_some(),
         }).collect()
    });

    // Fisher–Yates shuffle using random seed
    let r = ic_rand_u64().await;
    let mut i = pool.len();
    while i > 1 {
        i -= 1;
        let j = (r as usize ^ i) % (i + 1);
        pool.swap(i, j);
    }
    pool.into_iter().take(limit as usize).collect()
}

#[update]
pub fn reply_to_letter(letter_id: u64, reply: String) -> bool {
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        if let Some(l) = st.letters.iter_mut().find(|l| l.id == letter_id) {
            l.replies.push(Reply { message: reply, created_at: now_sec() });
            true
        } else { false }
    })
}

#[update]
pub fn start_dm(letter_id: u64) -> Option<u64> {
    let now = now_sec();
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        if let Some(l) = st.letters.iter_mut().find(|l| l.id == letter_id) {
            if let Some(id) = l.dm_session_id { return Some(id); }
            let id = st.next_dm_id; st.next_dm_id += 1;
            st.dms.insert(id, DmSession { id, letter_id, created_at: now, messages: vec![] });
            l.dm_session_id = Some(id);
            Some(id)
        } else { None }
    })
}

fn anon_author_tag() -> String {
    // Short, anonymous fingerprint of caller Principal — not stored with letters
    let text = api::caller().to_text();
    let bytes = ic_cdk::api::hash::hash_bytes(text.as_bytes());
    let hex = bytes.iter().take(4).map(|b| format!("{:02x}", b)).collect::<String>();
    format!("anon-{}", hex)
}

#[update]
pub fn send_dm(dm_id: u64, message: String) -> bool {
    let tag = anon_author_tag();
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        if let Some(sess) = st.dms.get_mut(&dm_id) {
            sess.messages.push(DmMessage { message, created_at: now_sec(), author_tag: tag });
            true
        } else { false }
    })
}

#[query]
pub fn get_dm(dm_id: u64) -> Option<DmSession> {
    STATE.with(|s| s.borrow().dms.get(&dm_id).cloned())
}

#[query]
pub fn health() -> String { "ok".into() }

#[derive(CandidType, Deserialize, Clone)]
struct Snap(StableState);

#[pre_upgrade]
fn pre_upgrade() {
    STATE.with(|s| {
        let st = s.borrow();
        ic_cdk::storage::stable_save((Snap(StableState {
            letters: st.letters.clone(),
            dms: st.dms.clone(),
            next_letter_id: st.next_letter_id,
            next_dm_id: st.next_dm_id,
        }),)).expect("stable_save");
    });
}

#[post_upgrade]
fn post_upgrade() {
    if let Ok((Snap(restored),)) = ic_cdk::storage::stable_restore::<(Snap,)>() {
        STATE.with(|s| {
            let mut st = s.borrow_mut();
            st.letters = restored.letters;
            st.dms = restored.dms;
            st.next_letter_id = restored.next_letter_id;
            st.next_dm_id = restored.next_dm_id;
        });
    }
}

// Candid export for dfx
#[query(name="__get_candid_interface_tmp_hack")]
fn export_candid() -> String {
    candid::export_service!();
    __export_service()
}
