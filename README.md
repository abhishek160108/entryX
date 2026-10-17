# EntryX — Cinema Ticket Validation Platform

> **"One Ticket. One Entry."**

**EntryX** is a secure, high-performance cinema ticket-scanning PWA and control platform designed to prevent duplicate entry across theaters throughout Tamil Nadu (Chennai, Coimbatore, Madurai, Salem, Trichy).

---

## 🎟️ Official Product Branding

- **Product Name:** `EntryX`
- **Staff Scanner App:** `EntryX Scanner`
- **Management Dashboard:** `EntryX Control`
- **Tagline:** `"One Ticket. One Entry."`
- **Identity & Aesthetics:** Dark charcoal/deep navy theme (`#080C14`), electric green (`#00E676`) for valid entries, crimson red (`#EF4444`) for duplicate/tampered tickets, amber (`#F59E0B`) for auditorium/time warnings.

---

## 🚀 Key Features

### 1. EntryX Scanner (Staff Mobile PWA)
- **Android Phone Optimized:** Touch-first interface, zero-latency feedback, full-screen result cards.
- **Continuous Camera Scanning:** Fast QR and barcode reading with rear/front camera switching and flashlight toggle.
- **Audio & Haptic Feedback:** Web Audio API sound synthesizer (pleasant chime for success, harsh alert buzzer for duplicate, haptic vibration via `navigator.vibrate`).
- **Show & Screen Locking:** Ensures ushers scan only for their assigned auditorium (e.g. Audi 1) and current show.
- **Instant Scenario Test Bar:** 1-tap testing for Valid BookMyShow, Duplicate Scan, TicketNew, Wrong Audi, Wrong Time, and Unverified barcodes.

### 2. EntryX Control (Management Dashboard)
- **Multi-Tenant Isolation:** Seamless switching across theaters (Sathyam Chennai, Rohini Chennai, Broadway Coimbatore, Vettri Chromepet).
- **Live Gate Monitoring Stream:** Real-time visibility into every scan across all gates with timestamp, gate, usher name, and status.
- **Occupancy & Velocity Metrics:** Live attendance percentage, duplicate interception counter, scans per minute.
- **One-Click Demo Reset:** Easily reset show tickets to unredeemed state for staff training and demonstrations.

### 3. Core Promise: Atomic Concurrency & Zero Double-Spend
- **Atomic Mutex Locks:** In-process serializing mutex keyed by ticket identifier.
- **Simultaneous Scan Proof:** Even if multiple staff at different turnstiles scan the exact same barcode at the exact same microsecond, **strictly only one scan is authorized**, while all subsequent scans are immediately rejected with `DUPLICATE_ENTRY`.
- **Interactive Race Simulator Lab:** Built-in multi-device race simulator firing concurrent requests in parallel to prove atomic locking live.

### 4. Provider Authenticity & Cryptographic Verification
- **BookMyShow (BMS):** Supports BMS M-Ticket structured strings and QR JSON payloads with HMAC-SHA256 signature verification.
- **TicketNew:** Structured ticket token parser verified against theater manifests.
- **Direct Box Office / EntryX Tokens:** Cryptographically signed admission codes.
- **Strict Untrusted Provider Block:** Any ticket whose authenticity cannot be cryptographically verified is marked `UNVERIFIED_PROVIDER` or `TAMPERED_SIGNATURE`.

### 5. Immutable Security Audit Ledger
- **SHA-256 Hash Chaining:** Every single gate scan attempt creates an immutable ledger block linked to the previous block's hash.
- **Cryptographic Verification:** One-click automated chain validation from Genesis to the latest block.
- **CSV Export:** Complete audit trail download for theater management and film distributors.

---

## 🛠️ Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Build frontend
npm run build

# 3. Start unified server (Backend API + PWA Frontend)
npm start
```

Access the application in your browser or Android device:
- **Web App / PWA:** `http://localhost:5000`
- **Staff Scanner:** `http://localhost:5000` (select Scanner tab)
- **Management Control:** `http://localhost:5000` (select Control tab)
- **Health Check API:** `http://localhost:5000/api/health`

### Development Mode (Concurrent Vite + Server)
```bash
npm run dev
```

---

## 👥 Demo Staff Accounts (4-digit PINs)
- **Karthik Raja** (Gate 1 Usher, Sathyam Chennai): PIN `1234`
- **Priya Natarajan** (Gate 2 Usher, Sathyam Chennai): PIN `5678`
- **Saravanan V** (Gate Supervisor, Rohini Chennai): PIN `2468`
- **Muthukumar S** (Duty Manager / Admin): PIN `9999`

---

## 📄 License
ISC License © EntryX Technologies
