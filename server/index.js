import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database.js';
import { atomicRedeemTicket, parseTicketPayload } from './ticketEngine.js';
import { signToken } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  if (!req.url.startsWith('/api/analytics')) {
    console.log(`[EntryX API] ${req.method} ${req.url}`);
  }
  next();
});

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'EntryX',
    tagline: 'One Ticket. One Entry.',
    timestamp: Date.now()
  });
});

// 2. Theaters & Screens (Multi-tenant)
app.get('/api/theaters', (req, res) => {
  const theaters = db.getTheaters();
  res.json({ success: true, theaters });
});

// 3. Shows
app.get('/api/shows', (req, res) => {
  const { theaterId } = req.query;
  const shows = db.getShows(theaterId);
  res.json({ success: true, shows });
});

// 4. Staff Accounts
app.get('/api/staff', (req, res) => {
  const { theaterId } = req.query;
  const staff = db.getStaffUsers(theaterId);
  res.json({ success: true, staff });
});

// 5. Staff PIN Authentication
app.post('/api/auth/login', (req, res) => {
  const { pin, theaterId } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, message: 'PIN is required' });
  }

  const staff = db.authenticateStaff(pin, theaterId);
  if (!staff) {
    return res.status(401).json({ success: false, message: 'Invalid Staff PIN' });
  }

  res.json({
    success: true,
    staff: {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      theaterId: staff.theaterId,
      assignedGate: staff.assignedGate,
      assignedScreenId: staff.assignedScreenId,
      phone: staff.phone
    }
  });
});

// 6. Pre-validation / Inspect Ticket (Does not redeem)
app.post('/api/tickets/inspect', (req, res) => {
  const { rawPayload } = req.body;
  const parsed = parseTicketPayload(rawPayload);

  if (!parsed.isValid) {
    return res.json({
      success: false,
      status: 'UNVERIFIED',
      message: 'Unrecognized ticket format or signature',
      parsed
    });
  }

  const ticket = db.findTicketByBookingRef(parsed.bookingId);
  if (!ticket) {
    return res.json({
      success: false,
      status: 'NOT_FOUND',
      message: 'Ticket not found in manifest',
      parsed
    });
  }

  res.json({
    success: true,
    ticket: {
      bookingReference: ticket.bookingReference,
      movieTitle: ticket.movieTitle,
      seats: ticket.seats,
      seatCategory: ticket.seatCategory,
      screenName: ticket.screenName,
      showTime: ticket.showTime,
      isRedeemed: ticket.isRedeemed,
      redeemedAt: ticket.redeemedAt,
      provider: ticket.provider
    }
  });
});

// 7. Core ATOMIC Ticket Redemption
app.post('/api/tickets/redeem', async (req, res) => {
  try {
    const {
      rawPayload,
      activeShowId,
      activeScreenId,
      staffUser,
      theaterId,
      deviceInfo
    } = req.body;

    if (!rawPayload) {
      return res.status(400).json({
        success: false,
        status: 'EMPTY_CODE',
        title: 'NO CODE PROVIDED',
        message: 'Barcode or QR scan data was empty.'
      });
    }

    const effectiveStaff = staffUser || {
      id: 'staff-default',
      name: 'Gate Usher (Mobile)',
      assignedGate: 'Gate 1',
      theaterId: theaterId || 'theater-sathyam-chennai'
    };

    const result = await atomicRedeemTicket({
      db,
      rawPayload,
      activeShowId,
      activeScreenId,
      staffUser: effectiveStaff,
      theaterId,
      deviceInfo: deviceInfo || 'EntryX Scanner Mobile PWA (Android)'
    });

    res.json(result);
  } catch (err) {
    console.error('Redeem error:', err);
    res.status(500).json({
      success: false,
      status: 'SYSTEM_ERROR',
      title: 'SYSTEM ERROR',
      message: 'Failed to process ticket redemption: ' + err.message
    });
  }
});

// 8. Race Condition / Simultaneous Scan Stress Simulator
// Launches concurrent parallel requests for the same ticket payload to prove atomic single-entry enforcement
app.post('/api/tickets/simulate-race', async (req, res) => {
  try {
    const {
      rawPayload,
      activeShowId,
      activeScreenId,
      theaterId,
      scannersCount = 3
    } = req.body;

    const count = Math.min(Math.max(2, scannersCount), 6);

    const dummyStaff = [
      { id: 'staff-phone-1', name: 'Scanner #1 (Gate 1 South)', assignedGate: 'Gate 1' },
      { id: 'staff-phone-2', name: 'Scanner #2 (Gate 2 North)', assignedGate: 'Gate 2' },
      { id: 'staff-phone-3', name: 'Scanner #3 (VIP Turnstile)', assignedGate: 'VIP Gate' },
      { id: 'staff-phone-4', name: 'Scanner #4 (East Usher)', assignedGate: 'East Gate' },
      { id: 'staff-phone-5', name: 'Scanner #5 (Foyer Staff)', assignedGate: 'Foyer Gate' }
    ];

    console.log(`[RACE LAB] Simulating ${count} simultaneous scans for payload: ${rawPayload}`);

    // Fire all requests concurrently with Promise.all at the exact same millisecond
    const racePromises = Array.from({ length: count }).map((_, idx) => {
      const staff = dummyStaff[idx % dummyStaff.length];
      const startMicro = Date.now();
      return atomicRedeemTicket({
        db,
        rawPayload,
        activeShowId,
        activeScreenId,
        staffUser: staff,
        theaterId,
        deviceInfo: `Android Phone Device #${idx + 1}`
      }).then(res => ({
        scannerIndex: idx + 1,
        scannerStaff: staff.name,
        gate: staff.assignedGate,
        durationMs: Date.now() - startMicro,
        result: res
      }));
    });

    const raceResults = await Promise.all(racePromises);

    const successCount = raceResults.filter(r => r.result.success).length;
    const duplicateBlockedCount = raceResults.filter(r => r.result.status === 'DUPLICATE_ENTRY').length;

    res.json({
      success: true,
      scannersCount: count,
      atomicIntegrityMaintained: successCount <= 1,
      successfulRedemptions: successCount,
      duplicatesBlocked: duplicateBlockedCount,
      summary: successCount === 1 
        ? `1 SCAN SUCCEEDED, ${duplicateBlockedCount} DUPLICATE ATTEMPTS INSTANTLY BLOCKED AT THE MILLISECOND LEVEL.`
        : `Ticket was already redeemed or invalid. All ${count} attempts were safely intercepted.`,
      raceResults
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Ticket Manifest & Inventory
app.get('/api/tickets', (req, res) => {
  const { showId, theaterId } = req.query;
  let tickets = db.tickets;
  if (theaterId && theaterId !== 'all') {
    tickets = tickets.filter(t => t.theaterId === theaterId);
  }
  if (showId && showId !== 'all') {
    tickets = tickets.filter(t => t.showId === showId);
  }
  res.json({ success: true, count: tickets.length, tickets });
});

// 10. Generate / Create a new ticket (BookMyShow, TicketNew, BoxOffice)
app.post('/api/tickets/create', (req, res) => {
  try {
    const {
      provider = 'BOOKMYSHOW',
      theaterId,
      showId,
      customerName = 'Cinema Patron',
      seats = ['D10'],
      category = 'PREMIERE'
    } = req.body;

    const show = db.getShow(showId) || db.shows[0];
    const prefix = provider === 'BOOKMYSHOW' ? 'WXBMS' : provider === 'TICKETNEW' ? 'TNW' : 'EX-BOX';
    const bookingId = `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;

    const rawData = `${provider === 'TICKETNEW' ? 'TNW' : provider === 'BOX_OFFICE' ? 'ENTRYX' : 'BMS'}:${show.theaterId}:${show.id}:${bookingId}:${seats.join(',')}`;
    const sig = signToken(rawData);
    
    let qrString = '';
    if (provider === 'BOOKMYSHOW') {
      qrString = `BMS:TN:${show.theaterId}:${bookingId}:${seats.join(',')}:${sig}`;
    } else if (provider === 'TICKETNEW') {
      qrString = `TNW:${show.theaterId}:${bookingId}:${seats.join(',')}:${sig}`;
    } else {
      qrString = `ENTRYX:${show.theaterId}:${bookingId}:${seats.join(',')}:${sig}`;
    }

    const newTicket = {
      id: `tkt-${bookingId}`,
      bookingReference: bookingId,
      provider,
      theaterId: show.theaterId,
      screenId: show.screenId,
      screenName: show.screenName,
      showId: show.id,
      movieTitle: show.movieTitle,
      showTime: show.showTime,
      showDate: show.showDate,
      customerName,
      seats,
      seatCategory: category,
      admitCount: seats.length,
      qrPayload: qrString,
      qrJson: JSON.stringify({
        provider,
        bookingId,
        theaterId: show.theaterId,
        screenId: show.screenId,
        showId: show.id,
        seats,
        sig
      }),
      signature: sig,
      isRedeemed: false,
      redeemedAt: null,
      redeemedByStaffId: null,
      redeemedByStaffName: null,
      redeemedGate: null,
      deviceInfo: null
    };

    db.addTicket(newTicket);
    res.json({ success: true, ticket: newTicket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Reset Show Tickets (For test reset)
app.post('/api/tickets/reset-show', (req, res) => {
  const { showId } = req.body;
  const count = db.resetShowTickets(showId);
  res.json({ success: true, resetCount: count, message: `Reset ${count} tickets to unredeemed state.` });
});

// 12. Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const { theaterId, showId, status, limit } = req.query;
  const logs = db.getAuditLogs({
    theaterId,
    showId,
    status,
    limit: limit ? parseInt(limit) : 100
  });
  res.json({ success: true, count: logs.length, logs });
});

// 13. Audit Ledger Cryptographic Verification
app.get('/api/audit-logs/verify', (req, res) => {
  const integrity = db.verifyLedgerIntegrity();
  res.json({ success: true, integrity });
});

// 14. Real-time Analytics
app.get('/api/analytics', (req, res) => {
  const { theaterId, showId } = req.query;
  const stats = db.getAnalytics(theaterId, showId);
  res.json({ success: true, analytics: stats });
});

app.use(express.static(distPath));

// Fallback to index.html for SPA routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🎬 EntryX Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`🛡️  "One Ticket. One Entry."`);
  console.log(`🏢 Theaters: ${db.theaters.length} | Active Tickets: ${db.tickets.length}`);
  console.log(`=======================================================`);
});
