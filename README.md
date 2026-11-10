# Samvad AI (సంవాద్ AI)
### Autonomous Multilingual Outbound Cold-Call AI Agent for Indian Small Businesses

> **Built for the Gnani AI Great Indian AI Internship Challenge**  
> **Powered by:** [Gnani Prisma v3.0](https://gnani.ai) (Speech-to-Text) · [Gnani Timbre v3.0](https://gnani.ai) (Text-to-Speech) · Gemini 2.5 Flash · Firebase Realtime DB

📄 **[Read the 1-Page Solution Pitch Document (SOLUTION_PITCH.md)](./SOLUTION_PITCH.md)**

---

## 1. Executive Summary

Over 63 million Indian small businesses (dental clinics, coaching academies, real estate agencies, retail boutiques, auto dealers) lose high-value prospects the moment a phone call ends. They struggle to scale cold calling due to language barriers and high telecaller costs.

**Samvad AI** solves this with an end-to-end voice AI sales agent:
1. **Excel Cold-Call Upload & Autonomous Dialing:** Upload contact lists (.xlsx/.csv) or click *Dial Next Lead*. The AI agent dials leads using your **verified forwarding number (caller ID)** and conducts natural outbound sales conversations in the prospect's native dialect.
2. **10 Indian Language Modes:** Full native and code-mixed fluency across **Telugu+English (High-English)**, **Pure Telugu**, **Hindi+English (Hinglish)**, **Pure Hindi**, **Indian English**, **Tamil**, **Marathi**, **Kannada**, **Bengali**, and **Gujarati**.
3. **Live Dashboard Operational Metrics:** Instant real-time tracking of:
   * **Calls Ongoing** (Live speaking agent indicator)
   * **Calls Answered** (Successfully connected calls)
   * **Calls Closed** (Completed sales pitches)
   * **Calls Rejected** (Customer declines / hang-ups)
   * **Leads Won** (High-intent prospects with confirmed bookings/proposals)
   * **Leads Lost** (Declined opportunities)
4. **Prisma STT Transcription & LLM Lead Cards:** Accurately transcribes conversations using **Gnani Prisma v3.0** and extracts structured lead cards with customer intent, budget, objections, and verbatim quotes.
5. **Spoken Evening Brief (< 60 words):** Before closing for the day, business owners receive a spoken voice brief synthesized by **Gnani Timbre v3.0** summarizing confirmed leads and priority callbacks.

---

## 2. Verified Gnani Models & Endpoints Used

| Capability | Model | Endpoint | Parameters & Architecture |
| :--- | :--- | :--- | :--- |
| **Speech-to-Text (STT)** | `prisma-v3.0` | `POST https://api.vachana.ai/stt/v3` | Header: `X-API-Key-ID`<br>Multipart: `audio_file`, `language_code: "te-IN"`, `format: "codemix"`.<br>Audio longer than 30s is segmented by `ffmpeg` and stitched seamlessly. |
| **Text-to-Speech (TTS)** | `timbre-v3.0` & `timbre-v2.5` | `POST https://api.vachana.ai/api/v1/tts/inference` | Header: `X-API-Key-ID`<br>JSON: `voice`, `model`, `language` (e.g. `te-IN`, `hi-en`, `hi-IN`, `ta-IN`, `mr-IN`, `kn-IN`, `bn-IN`, `gu-IN`, `en-IN`), `audio_config: { encoding: "linear_pcm", container: "wav", sample_rate: 24000 }`. |
| **Lead & Script Architect** | `gemini-2.5-flash` | REST API | Dynamically authors industry-specific sales pitches, objection handling scripts, and realistic synthetic prospects. |
| **Realtime Cloud State** | Firebase Realtime DB | REST / SDK | Real-time bi-directional synchronization of campaign metrics, leads, and agent profile settings. |

---

## 3. Supported Languages & Timbre Voice Library

The platform supports 16+ verified Gnani Timbre voice personas categorized by region and tone:

- **Telugu (`te-IN` / `te-en`)**: Shivani (Warm/Empathetic), Lakshmi (Expressive), Avinash (Professional/Firm), Shubham (Dynamic).
- **Hindi (`hi-IN`)**: Kalpana (Empathetic/Composed), Deepak (Corporate), Suhana (Gentle/Friendly).
- **Hinglish (`hi-en`)**: Devansh (Modern Conversational), Poorvi (Natural Bilingual).
- **Indian English (`en-IN`)**: Riyaa (Sharp/Sales), Harshad (Authoritative), Kaveri (Polished).
- **Tamil (`ta-IN`)**: Asmita (Refined/Clear), Prakash (Deep/Trustworthy).
- **Marathi (`mr-IN`)**: Varuni (Authentic/Warm).
- **Kannada (`kn-IN`)**: Vasudha (Soft/Respectful), Lavanya (Crisp).
- **Bengali (`bn-IN`)**: Lehara (Melodic/Engaging).
- **Gujarati (`gu-IN`)**: Chetana (Energetic/Welcoming).

---

## 4. Key Engineering Highlights

1. **Clean Pronunciation (Zero Dual-Parenthesis Repetition):** Names and services are sanitized to single strings (e.g. `Rahul Varma`, `Digital Marketing`) eliminating repetitive TTS pronunciation bugs.
2. **Complete Uncut Call Audio:** Uses multi-turn speech extraction (`extractFullCallSpeechText`) so every lead plays the full sales dialogue (30–45 seconds) from greeting to proposal closing, never cutting off mid-sentence.
3. **Double-Layer Data Architecture:** High-speed local SQLite database (`vaani.db`) with WAL mode for zero-latency local operations, coupled with Firebase Realtime Database for live cross-device sync.
4. **Credit Caching Guarantee:** SHA-256 content hashes prevent duplicate billing for identical audio or recaps.
5. **Mobile-First Responsive Interface:** Full responsive layouts with horizontal-scroll voice filters and touch-friendly controls.

---

## 5. Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node v20 & v24)
- npm package manager

### Setup & Run
```bash
# 1. Clone the repository
git clone https://github.com/vanapalligowtham890-lab/samdav-ai-.git
cd samdav-ai-

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Open .env.local and add your GNANI_API_KEY and GEMINI_API_KEY

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Project Structure

```
├── app/
│   ├── (app)/
│   │   ├── today/           # Live Cold-Call Dashboard (Ongoing, Answered, Closed, Won, Lost)
│   │   ├── calls/           # Recorded Calls & Prisma STT Transcripts
│   │   ├── settings/        # 10-Language Mode & Timbre Voice Library
│   │   └── layout.tsx       # Authenticated layout with caller ID indicator
│   ├── api/
│   │   ├── campaign/        # Outbound dial engine & Excel file parser (.xlsx)
│   │   ├── call-audio/      # Full-length on-demand Timbre TTS synthesis
│   │   ├── recap/           # Evening spoken recap generator (<60 words)
│   │   ├── settings/        # Sector profile configuration & Gemini lead seeder
│   │   └── transcribe/      # Gnani Prisma v3.0 STT integration
│   ├── login/               # Authentication portal
│   ├── signup/              # User registration
│   ├── setup/               # Onboarding: Sector, Caller ID & Voice persona
│   └── page.tsx             # Public landing page with voice audition player
├── lib/
│   ├── gnani.ts             # Gnani Prisma STT & Timbre TTS REST client
│   ├── languages.ts         # 10 Indian language definitions & prompt guides
│   ├── voice-catalog.ts     # 16+ verified Gnani Timbre voice catalog
│   ├── llm-campaign.ts      # Gemini 2.5 Flash campaign & script generator
│   ├── sector-campaigns.ts  # Sector definitions & full-speech extractors
│   ├── firebase.ts          # Firebase Authentication & Realtime DB client
│   └── db.ts                # SQLite local cache database
├── SOLUTION_PITCH.md        # Official 1-page solution pitch for challenge submission
└── README.md
```

---

## 7. Submission Checklist & Video Demo Script

| Time | Screen | Demo Action |
| :--- | :--- | :--- |
| **0:00 - 0:30** | `/` & `/setup` | Show landing page, log in, configure company, verified forwarding caller ID, and select voice persona. |
| **0:30 - 1:15** | `/today` | Demonstrate Excel upload, show the 6 metrics (Ongoing, Answered, Closed, Rejected, Won, Lost), and click *Dial Next Lead*. |
| **1:15 - 1:50** | `/today` (Calls) | Click *Play* on a lead card; show full 35-40s natural Indian voice conversation synthesized with Gnani Timbre without truncation. |
| **1:50 - 2:20** | `/today` (Recap) | Play the Spoken Evening Brief (< 60 words) highlighting today's won deals. |
| **2:20 - 2:30** | `/settings` | Switch language mode to Hinglish/Marathi/Tamil and show instant script & lead regeneration. |

---

## 8. License & Attribution

MIT License · Built with **Gnani Prisma STT** and **Gnani Timbre TTS** for the Gnani AI Great Indian AI Internship Challenge.
