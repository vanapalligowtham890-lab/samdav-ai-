# Vaani Recap — Workspace Rules & Ground Rules

1. **Synthetic Data Only**: No real phone numbers, names, Aadhaar, PAN, or real recorded calls in the app or the public demo.
2. **Honest Attribution**:
   - The app must visibly use Gnani Prisma (Speech-to-Text) and Gnani Timbre (Text-to-Speech).
   - Name them honestly in the submission and UI. Note: Evon is not on the API, so do not claim it.
   - Any LLM used for extraction (Gemini / Claude) must be named honestly.
3. **Verified Gnani Endpoints Only**:
   - Never guess endpoints, parameters, language codes, or voice names.
   - STT REST: `POST https://api.vachana.ai/stt/v3` (multipart/form-data with `audio_file`, `language_code: "te-IN"`, header `X-API-Key-ID`). Duration <= 30s per chunk.
   - STT Batch: `POST https://api.vachana.ai/stt/v3/batch/jobs` + `/start`
   - TTS REST: `POST https://api.vachana.ai/api/v1/tts/inference` (`text`, `voice`, `model: "timbre-v3.0"` or `"timbre-v2.5"`, `language: "te-IN"`, `audio_config`, header `X-API-Key-ID`). Returns binary audio (wav).
   - Confirmed Telugu Language Code: `te-IN`.
   - Confirmed Telugu Voices: Timbre v3.0 (supports all 10 languages: Shivani, Lakshmi, Kalpana, Chetana, Vasudha, Riyaa, Tarika, Avinash, Shubham, Prakash, Devansh, Yashraj, Harshad) and Timbre v2.5 (Suhana, Lehara, Lavanya, Yukti, Varuni).
4. **Security & Secrets**:
   - Keep `GNANI_API_KEY` and `LLM_API_KEY` in `.env.local`.
   - Call Gnani APIs only from server route handlers, never from the client browser.
5. **Efficiency & Credits**:
   - Cache every transcript and audio file in SQLite so the same audio/recap is never re-billed.
6. **Delivery Priority**:
   - Ship a working demo first, polish second.

