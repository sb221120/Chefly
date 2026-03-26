# CHEFLY - Premium AI Sommelier & Concierge

## Product Overview
CHEFLY is a premium mobile app that serves as an AI Sommelier and Concierge. It helps users choose alcoholic beverages through AI-powered shelf scanning (Gemini 2.5 Flash Vision) with budget consideration. Features a continuous chat with an elite sommelier persona and voice-to-voice interaction.

## Design System
- **Theme**: Premium, luxury, minimalism
- **Background**: Black (#000000)
- **Accent**: Gold (#C5A059)
- **Typography**: Serif fonts (Georgia)
- **Images**: Premium wine and cocktail lifestyle photography

## Features

### Completed
- [x] Splash Screen with wine cellar background imagery
- [x] Onboarding flow with hero wine images, currency/budget/language selection
- [x] Home screen with feature tiles and quick actions
- [x] AI Sommelier Chat with Voice-to-Voice orchestrator (STT → Gemini → TTS)
- [x] Shelf Scanner (camera/gallery → Gemini Vision analysis)
- [x] Scan Results screen with AI recommendations
- [x] Chat History with wine thumbnails
- [x] Profile management with gold-bordered avatar
- [x] Premium Paywall screen with plan selection
- [x] Premium wine imagery across all screens (matching reference design)
- [x] TTS with fallback (Google Cloud TTS → expo-speech)

### Blocked
- [ ] Google Cloud TTS Wavenet/Neural2 voices (API returns 403 — needs user to enable "Cloud Text-to-Speech API" in GCP Console)

### Upcoming
- [ ] Firebase Auth (currently using device_id)
- [ ] RevenueCat Premium Paywall integration
- [ ] Mic pulse animation during recording

## Tech Stack
- **Frontend**: Expo (React Native), expo-router, Zustand, expo-av, expo-speech
- **Backend**: FastAPI, Motor (Async MongoDB), emergentintegrations (Gemini 2.5 Flash)
- **Database**: MongoDB
- **AI**: Gemini 2.5 Flash (text + vision) via Emergent LLM Key
- **TTS**: Google Cloud TTS (blocked) → expo-speech fallback

## API Endpoints
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `POST /api/chat` - AI chat
- `GET /api/chat/sessions/:userId` - Get sessions
- `POST /api/scan/bottle` - Shelf scan
- `POST /api/tts/synthesize` - TTS (currently blocked)
