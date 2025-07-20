import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory as chainmail_idl, canisterId as chainmail_id } from "declarations/chainmail_backend";

const agent = new HttpAgent();
const chainmail = Actor.createActor(chainmail_idl, {
  agent,
  canisterId: chainmail_id,
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const content = document.querySelector("#letter").value.trim();
    const lockOption = document.querySelector("#lockTime").value;
    const lockSeconds = lockOption === "1year" ? 31536000 : 2592000;

    if (content.length < 10) {
      document.querySelector(".error-message").style.display = "block";
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    try {
      await chainmail.submit_letter(content, lockSeconds);
      alert("Letter submitted successfully!");
      form.reset();
    } catch (err) {
      console.error("Submission error:", err);
      alert("There was an error submitting your letter.");
    }
  });
});
