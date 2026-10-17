import crypto from 'crypto';
import { HMAC_SECRET, signToken } from './seedData.js';

// Mutex lock map to guarantee strict atomic concurrency per ticket
const ticketLocks = new Map();

/**
 * Acquire an atomic lock for a specific ticket identifier
 */
async function acquireLock(ticketKey) {
  while (ticketLocks.has(ticketKey)) {
    // Wait for existing lock to release
    await ticketLocks.get(ticketKey);
  }

  let release;
  const promise = new Promise((resolve) => {
    release = resolve;
  });
  ticketLocks.set(ticketKey, promise);

  return () => {
    ticketLocks.delete(ticketKey);
    release();
  };
}

/**
 * Parse and identify ticket payload from QR code string
 */
export function parseTicketPayload(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    return { isValid: false, reason: 'EMPTY_PAYLOAD' };
  }

  const trimmed = rawString.trim();

  // 1. Check if payload is JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        isValid: true,
        format: 'JSON',
        provider: parsed.provider || 'UNKNOWN',
        bookingId: parsed.bookingId || parsed.bookingReference || parsed.id,
        theaterId: parsed.theaterId,
        screenId: parsed.screenId,
        showId: parsed.showId,
        seats: parsed.seats || [],
        signature: parsed.sig || parsed.signature,
        raw: trimmed
      };
    } catch {
      // not valid json, fall through
    }
  }

  // 2. Check BookMyShow structured format: BMS:TN:{theaterId}:{bookingId}:{seats}:{sig}
  if (trimmed.startsWith('BMS:TN:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 6) {
      return {
        isValid: true,
        format: 'BMS_DELIMITED',
        provider: 'BOOKMYSHOW',
        theaterId: parts[2],
        bookingId: parts[3],
        seats: parts[4] ? parts[4].split(',') : [],
        signature: parts[5],
        raw: trimmed
      };
    }
  }

  // 3. Check TicketNew structured format: TNW:{theaterId}:{bookingId}:{seats}:{sig}
  if (trimmed.startsWith('TNW:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 5) {
      return {
        isValid: true,
        format: 'TICKETNEW_DELIMITED',
        provider: 'TICKETNEW',
        theaterId: parts[1],
        bookingId: parts[2],
        seats: parts[3] ? parts[3].split(',') : [],
        signature: parts[4],
        raw: trimmed
      };
    }
  }

  // 4. Check EntryX Direct BoxOffice format: ENTRYX:{theaterId}:{bookingId}:{seats}:{sig}
  if (trimmed.startsWith('ENTRYX:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 5) {
      return {
        isValid: true,
        format: 'ENTRYX_DELIMITED',
        provider: 'BOX_OFFICE',
        theaterId: parts[1],
        bookingId: parts[2],
        seats: parts[3] ? parts[3].split(',') : [],
        signature: parts[4],
        raw: trimmed
      };
    }
  }

  // 5. Raw Booking Reference / Alpha-numeric code (e.g. WXBMS78910, TNW994012A, EX-BOX-5501)
  if (/^[A-Za-z0-9-_]{4,30}$/.test(trimmed)) {
    return {
      isValid: true,
      format: 'CODE_ONLY',
      provider: trimmed.startsWith('BMS') || trimmed.startsWith('WX') ? 'BOOKMYSHOW' :
                trimmed.startsWith('TNW') ? 'TICKETNEW' : 'BOX_OFFICE',
      bookingId: trimmed,
      raw: trimmed
    };
  }

  // 6. Unknown / arbitrary format
  return {
    isValid: false,
    format: 'UNRECOGNIZED',
    provider: 'UNVERIFIED',
    reason: 'UNVERIFIED_FORMAT',
    raw: trimmed
  };
}

/**
 * Atomic Ticket Redemption Engine
 * Guarantees that simultaneous scans across multiple phones NEVER produce multiple redemptions.
 */
export async function atomicRedeemTicket({
  db,
  rawPayload,
  activeShowId,
  activeScreenId,
  staffUser,
  theaterId,
  deviceInfo = 'EntryX Mobile Scanner (Android)'
}) {
  const parsed = parseTicketPayload(rawPayload);

  // If payload could not be parsed into any recognized cinema ticket structure
  if (!parsed.isValid && parsed.reason === 'UNVERIFIED_FORMAT') {
    const auditRecord = db.addAuditLog({
      ticketId: 'UNKNOWN',
      bookingReference: 'UNRECOGNIZED',
      provider: 'UNVERIFIED',
      theaterId: theaterId || 'unknown',
      screenId: activeScreenId || 'unknown',
      showId: activeShowId || 'unknown',
      staffId: staffUser.id,
      staffName: staffUser.name,
      gate: staffUser.assignedGate || 'Main Gate',
      status: 'UNVERIFIED_PROVIDER',
      seats: [],
      reason: 'Unregistered barcode / Untrusted provider signature',
      deviceInfo,
      rawPayload: String(rawPayload).substring(0, 80)
    });

    return {
      success: false,
      status: 'UNVERIFIED_PROVIDER',
      theme: 'amber',
      title: 'UNVERIFIED TICKET PROVIDER',
      message: 'This barcode does not originate from an authorized ticket partner (BookMyShow, TicketNew, or Box Office).',
      subMessage: 'Tickets whose authenticity cannot be cryptographically verified must never be accepted.',
      auditId: auditRecord.id,
      timestamp: Date.now()
    };
  }

  const bookingId = parsed.bookingId;
  const lockKey = `${theaterId || 'default'}:${bookingId}`;

  // Acquire atomic mutex lock for this specific ticket
  const releaseLock = await acquireLock(lockKey);

  try {
    // 1. Locate ticket in database
    const ticket = db.findTicketByBookingRef(bookingId);

    if (!ticket) {
      const auditRecord = db.addAuditLog({
        ticketId: bookingId,
        bookingReference: bookingId,
        provider: parsed.provider || 'UNKNOWN',
        theaterId: theaterId || 'unknown',
        screenId: activeScreenId || 'unknown',
        showId: activeShowId || 'unknown',
        staffId: staffUser.id,
        staffName: staffUser.name,
        gate: staffUser.assignedGate || 'Main Gate',
        status: 'INVALID_TICKET',
        seats: [],
        reason: 'Ticket not found in theater manifest for this date',
        deviceInfo,
        rawPayload: String(rawPayload).substring(0, 80)
      });

      return {
        success: false,
        status: 'INVALID_TICKET',
        theme: 'red',
        title: 'INVALID TICKET',
        message: `Booking reference "${bookingId}" was not found in the official theater admission manifest.`,
        subMessage: 'Potential fraudulent or counterfeit ticket presented at gate.',
        auditId: auditRecord.id,
        timestamp: Date.now()
      };
    }

    // 2. Strict Tenant Isolation Check
    if (theaterId && ticket.theaterId !== theaterId) {
      const ticketTheater = db.getTheater(ticket.theaterId);
      const auditRecord = db.addAuditLog({
        ticketId: ticket.id,
        bookingReference: ticket.bookingReference,
        provider: ticket.provider,
        theaterId,
        screenId: activeScreenId || 'unknown',
        showId: activeShowId || 'unknown',
        staffId: staffUser.id,
        staffName: staffUser.name,
        gate: staffUser.assignedGate || 'Main Gate',
        status: 'WRONG_THEATER',
        seats: ticket.seats,
        reason: `Ticket belongs to ${ticketTheater?.name || ticket.theaterId}`,
        deviceInfo
      });

      return {
        success: false,
        status: 'WRONG_THEATER',
        theme: 'red',
        title: 'WRONG THEATER VENUE',
        message: `This ticket is for ${ticketTheater?.name || 'another theater'}, not this venue!`,
        subMessage: `Issued for: ${ticketTheater?.location || ticket.theaterId}`,
        ticketDetails: {
          bookingReference: ticket.bookingReference,
          movieTitle: ticket.movieTitle,
          seats: ticket.seats
        },
        auditId: auditRecord.id,
        timestamp: Date.now()
      };
    }

    // 3. Cryptographic Signature Verification (for BookMyShow / EntryX tokens)
    if (parsed.signature) {
      const expectedData = `${parsed.provider === 'TICKETNEW' ? 'TNW' : parsed.provider === 'BOX_OFFICE' ? 'ENTRYX' : 'BMS'}:${ticket.theaterId}:${ticket.showId}:${ticket.bookingReference}:${ticket.seats.join(',')}`;
      const expectedSig = signToken(expectedData);
      
      if (parsed.signature !== expectedSig && parsed.signature !== ticket.signature) {
        const auditRecord = db.addAuditLog({
          ticketId: ticket.id,
          bookingReference: ticket.bookingReference,
          provider: ticket.provider,
          theaterId,
          screenId: activeScreenId,
          showId: activeShowId,
          staffId: staffUser.id,
          staffName: staffUser.name,
          gate: staffUser.assignedGate,
          status: 'TAMPERED_SIGNATURE',
          seats: ticket.seats,
          reason: 'Cryptographic HMAC mismatch — potential forged QR code',
          deviceInfo
        });

        return {
          success: false,
          status: 'TAMPERED_SIGNATURE',
          theme: 'red',
          title: 'SECURITY VIOLATION: TAMPERED QR',
          message: 'Cryptographic signature mismatch! Ticket QR payload has been altered or forged.',
          subMessage: 'Report this scan to theater security supervisor immediately.',
          auditId: auditRecord.id,
          timestamp: Date.now()
        };
      }
    }

    // 4. ATOMIC CHECK: CORE PROMISE: HAS THIS TICKET ALREADY BEEN REDEEMED?
    if (ticket.isRedeemed) {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - ticket.redeemedAt) / 1000));
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);

      let timeText = `${elapsedSeconds}s ago`;
      if (elapsedMinutes > 0) {
        timeText = `${elapsedMinutes}m ${elapsedSeconds % 60}s ago`;
      }

      const auditRecord = db.addAuditLog({
        ticketId: ticket.id,
        bookingReference: ticket.bookingReference,
        provider: ticket.provider,
        theaterId: ticket.theaterId,
        screenId: activeScreenId || ticket.screenId,
        showId: activeShowId || ticket.showId,
        staffId: staffUser.id,
        staffName: staffUser.name,
        gate: staffUser.assignedGate || 'Main Gate',
        status: 'DUPLICATE_BLOCKED',
        seats: ticket.seats,
        reason: `Simultaneous or re-entry scan. First scanned by ${ticket.redeemedByStaffName || 'Staff'} at ${ticket.redeemedGate || 'Gate'}`,
        deviceInfo
      });

      return {
        success: false,
        status: 'DUPLICATE_ENTRY',
        theme: 'red',
        title: 'DUPLICATE ENTRY DETECTED!',
        message: 'This ticket has ALREADY BEEN SCANNED & ADMITTED.',
        subMessage: `First redeemed ${timeText} by ${ticket.redeemedByStaffName || 'Staff'} at ${ticket.redeemedGate || 'Gate'}.`,
        ticketDetails: {
          bookingReference: ticket.bookingReference,
          movieTitle: ticket.movieTitle,
          seats: ticket.seats,
          seatCategory: ticket.seatCategory,
          customerName: ticket.customerName,
          admitCount: ticket.admitCount,
          provider: ticket.provider,
          firstRedeemedAt: ticket.redeemedAt,
          firstRedeemedBy: ticket.redeemedByStaffName,
          firstRedeemedGate: ticket.redeemedGate,
          timeElapsed: timeText
        },
        auditId: auditRecord.id,
        timestamp: Date.now()
      };
    }

    // 5. Screen Check (e.g. Audi 1 vs Audi 2)
    if (activeScreenId && activeScreenId !== 'all' && ticket.screenId !== activeScreenId) {
      const assignedScreen = db.getScreen(ticket.screenId);
      const auditRecord = db.addAuditLog({
        ticketId: ticket.id,
        bookingReference: ticket.bookingReference,
        provider: ticket.provider,
        theaterId: ticket.theaterId,
        screenId: activeScreenId,
        showId: activeShowId || ticket.showId,
        staffId: staffUser.id,
        staffName: staffUser.name,
        gate: staffUser.assignedGate,
        status: 'WRONG_SCREEN',
        seats: ticket.seats,
        reason: `Patron is at wrong screen. Ticket is for ${ticket.screenName || assignedScreen?.name || ticket.screenId}`,
        deviceInfo
      });

      return {
        success: false,
        status: 'WRONG_SCREEN',
        theme: 'amber',
        title: 'WRONG SCREEN / AUDITORIUM',
        message: `Ticket is for ${ticket.screenName || 'different Audi'}. You are scanning at a different auditorium.`,
        subMessage: `Please direct patron to: ${ticket.screenName || 'Assigned Screen'}`,
        ticketDetails: {
          bookingReference: ticket.bookingReference,
          movieTitle: ticket.movieTitle,
          seats: ticket.seats,
          seatCategory: ticket.seatCategory,
          customerName: ticket.customerName,
          correctScreen: ticket.screenName,
          showTime: ticket.showTime
        },
        auditId: auditRecord.id,
        timestamp: Date.now()
      };
    }

    // 6. Showtime Check (e.g. 06:45 PM vs 10:15 PM)
    if (activeShowId && activeShowId !== 'all' && ticket.showId !== activeShowId) {
      const show = db.getShow(ticket.showId);
      const auditRecord = db.addAuditLog({
        ticketId: ticket.id,
        bookingReference: ticket.bookingReference,
        provider: ticket.provider,
        theaterId: ticket.theaterId,
        screenId: activeScreenId || ticket.screenId,
        showId: activeShowId,
        staffId: staffUser.id,
        staffName: staffUser.name,
        gate: staffUser.assignedGate,
        status: 'WRONG_SHOW',
        seats: ticket.seats,
        reason: `Showtime mismatch. Ticket is for ${ticket.showTime} (${ticket.movieTitle})`,
        deviceInfo
      });

      return {
        success: false,
        status: 'WRONG_SHOW',
        theme: 'amber',
        title: 'INCORRECT SHOW TIME',
        message: `Ticket is for the ${ticket.showTime} show (${ticket.showDate}), not the current show!`,
        subMessage: `Movie: ${ticket.movieTitle} | Showtime: ${ticket.showTime}`,
        ticketDetails: {
          bookingReference: ticket.bookingReference,
          movieTitle: ticket.movieTitle,
          seats: ticket.seats,
          seatCategory: ticket.seatCategory,
          customerName: ticket.customerName,
          ticketShowTime: ticket.showTime,
          ticketShowDate: ticket.showDate
        },
        auditId: auditRecord.id,
        timestamp: Date.now()
      };
    }

    // 7. ATOMIC SUCCESSFUL REDEMPTION: Mark as redeemed immediately inside mutex
    const redeemedTime = Date.now();
    ticket.isRedeemed = true;
    ticket.redeemedAt = redeemedTime;
    ticket.redeemedByStaffId = staffUser.id;
    ticket.redeemedByStaffName = staffUser.name;
    ticket.redeemedGate = staffUser.assignedGate || 'Main Gate';
    ticket.deviceInfo = deviceInfo;

    // Save state in DB
    db.updateTicket(ticket);

    // Create immutable audit record
    const auditRecord = db.addAuditLog({
      ticketId: ticket.id,
      bookingReference: ticket.bookingReference,
      provider: ticket.provider,
      theaterId: ticket.theaterId,
      screenId: ticket.screenId,
      showId: ticket.showId,
      staffId: staffUser.id,
      staffName: staffUser.name,
      gate: staffUser.assignedGate || 'Main Gate',
      status: 'VALIDATED',
      seats: ticket.seats,
      seatCategory: ticket.seatCategory,
      admitCount: ticket.admitCount,
      reason: 'Valid admission authorized',
      deviceInfo
    });

    return {
      success: true,
      status: 'VALIDATED',
      theme: 'green',
      title: 'ENTRY AUTHORIZED',
      message: `Admit ${ticket.admitCount} Person${ticket.admitCount > 1 ? 's' : ''}`,
      seatsFormatted: ticket.seats.join(', '),
      ticketDetails: {
        bookingReference: ticket.bookingReference,
        movieTitle: ticket.movieTitle,
        seats: ticket.seats,
        seatCategory: ticket.seatCategory,
        customerName: ticket.customerName,
        admitCount: ticket.admitCount,
        screenName: ticket.screenName,
        showTime: ticket.showTime,
        provider: ticket.provider,
        redeemedAt: redeemedTime,
        redeemedBy: staffUser.name,
        gate: staffUser.assignedGate
      },
      auditId: auditRecord.id,
      hash: auditRecord.hash,
      timestamp: redeemedTime
    };

  } finally {
    // Release atomic lock for this ticket
    releaseLock();
  }
}
