# Samvad AI — 1-Page Solution Pitch

> **Challenge:** Gnani AI Great Indian AI Internship Challenge  
> **Solution:** Autonomous Multilingual AI Cold-Calling & Lead Briefing Agent for Indian SMBs  
> **Core Tech:** Gnani Prisma v3.0 (STT) · Gnani Timbre v3.0 (TTS) · Gemini 2.5 Flash · Firebase Realtime DB  

---

### The Problem
Over 63 million Indian small businesses (clinics, coaching institutes, real estate consultants, retail stores, local agencies) lose high-value customers the moment phone calls end. Small business owners cannot afford dedicated telecalling teams, struggle with language barriers across regional dialects, and lose crucial lead details buried in raw audio recordings. Traditional CRMs are complex, English-centric, and manual.

---

### The Solution: Samvad AI
**Samvad AI** is an autonomous, multilingual voice AI sales engine designed specifically for Indian small businesses. It handles end-to-end phone outreach and conversion in three seamless steps:

1. **Autonomous Dialing & Outreach with Verified Caller ID:**
   - Business owners upload their prospect list via an Excel sheet or CSV.
   - The AI agent initiates outbound calls routing through the owner's **verified forwarding phone number** (caller ID), ensuring trust and immediate callbacks.
   - Conversations are spoken naturally across **10 Indian language modes** (Telugu, High-English Telugu, Pure Hindi, Hinglish, Tamil, Marathi, Kannada, Bengali, Gujarati, and Indian Corporate English) using **Gnani Timbre v3.0**.

2. **Real-Time Speech Transcription & Lead Extraction:**
   - Live calls are transcribed with high phonetic precision using **Gnani Prisma v3.0** (with code-mix capability for Indian accents).
   - In-flight transcripts are instantly parsed into structured lead cards: **Customer Intent**, **Need/Service**, **Budget**, **Customer Objections**, **Follow-up Date**, and verbatim **Key Intent Quotes**.

3. **Spoken Evening Brief (Under 60 Words):**
   - At the close of business, owners don't read dense spreadsheets. The AI agent synthesizes a concise, spoken evening brief using **Gnani Timbre TTS** in the owner's chosen voice persona, summarizing won leads and urgent callbacks in under 60 words.

---

### Key Differentiators & Technical Architecture
* **Native Voice Personas (Gnani Timbre v3.0):** Over 16 authentic Indian voice personas (Shivani, Lakshmi, Devansh, Kalpana, Varuni, Asmita, etc.) matching regional tones.
* **Dual-Language Code-Mixing:** Handles natural conversational mixing (Telugu+English, Hindi+English Hinglish) without robotic stutter or parenthetical repetition.
* **Live Operational Dashboard:** Real-time visibility into **Calls Ongoing**, **Calls Answered**, **Calls Closed**, **Calls Rejected**, **Leads Won**, and **Leads Lost**.
* **Zero-Redundancy Credit Caching:** SQLite SHA-256 hash caching guarantees that identical audio chunks or scripts are never billed twice, conserving API quota.
* **Synchronized Cloud Infrastructure:** Dual-layer architecture combining low-latency local SQLite with Firebase Realtime Database for live cross-device state updates.

---

### Business Impact
* **10x Lead Outreach:** Automates 100+ daily qualified dials per SMB without hiring human telecallers.
* **Zero Lost Opportunities:** Every customer objection and callback commitment is captured verbatim.
* **100% Native Dialects:** Enables hyperlocal commerce across regional Indian languages with authentic accents.

---
*Built with ❤️ for Indian Small Businesses using Gnani AI Voice Stack.*

