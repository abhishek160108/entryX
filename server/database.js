import crypto from 'crypto';
import { THEATERS, STAFF_USERS, SHOWS, generateSeedTickets } from './seedData.js';

class EntryXDatabase {
  constructor() {
    this.theaters = [...THEATERS];
    this.staffUsers = [...STAFF_USERS];
    this.shows = [...SHOWS];
    this.tickets = generateSeedTickets();
    this.auditLogs = [];
    this.lastLedgerHash = '0000000000000000000000000000000000000000000000000000000000000000';

    // Seed initial audit log for pre-redeemed ticket
    const redeemedTicket = this.tickets.find(t => t.isRedeemed);
    if (redeemedTicket) {
      this.addAuditLog({
        ticketId: redeemedTicket.id,
        bookingReference: redeemedTicket.bookingReference,
        provider: redeemedTicket.provider,
        theaterId: redeemedTicket.theaterId,
        screenId: redeemedTicket.screenId,
        showId: redeemedTicket.showId,
        staffId: redeemedTicket.redeemedByStaffId,
        staffName: redeemedTicket.redeemedByStaffName,
        gate: redeemedTicket.redeemedGate,
        status: 'VALIDATED',
        seats: redeemedTicket.seats,
        seatCategory: redeemedTicket.seatCategory,
        admitCount: redeemedTicket.admitCount,
        reason: 'Initial admission verified',
        deviceInfo: redeemedTicket.deviceInfo,
        timestamp: redeemedTicket.redeemedAt
      });
    }
  }

  // Calculate cryptographic SHA-256 hash for ledger chaining
  computeBlockHash(prevHash, index, timestamp, ticketId, status, staffId, theaterId) {
    const raw = `${prevHash}|${index}|${timestamp}|${ticketId}|${status}|${staffId}|${theaterId}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  // Add immutable record to cryptographic audit ledger
  addAuditLog(entry) {
    const index = this.auditLogs.length + 1;
    const timestamp = entry.timestamp || Date.now();
    const prevHash = this.lastLedgerHash;
    const hash = this.computeBlockHash(
      prevHash,
      index,
      timestamp,
      entry.ticketId,
      entry.status,
      entry.staffId,
      entry.theaterId
    );

    const logRecord = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      index,
      timestamp,
      previousHash: prevHash,
      hash,
      ticketId: entry.ticketId,
      bookingReference: entry.bookingReference,
      provider: entry.provider || 'UNKNOWN',
      theaterId: entry.theaterId,
      screenId: entry.screenId,
      showId: entry.showId,
      staffId: entry.staffId,
      staffName: entry.staffName,
      gate: entry.gate || 'Main Gate',
      status: entry.status,
      seats: entry.seats || [],
      seatCategory: entry.seatCategory || '',
      admitCount: entry.admitCount || 1,
      reason: entry.reason || '',
      deviceInfo: entry.deviceInfo || 'EntryX Android Scanner PWA',
      rawPayload: entry.rawPayload || ''
    };

    this.auditLogs.unshift(logRecord); // newest first for display
    this.lastLedgerHash = hash;
    return logRecord;
  }

  // Verify full ledger cryptographic integrity
  verifyLedgerIntegrity() {
    // Reverse to check in chronological order (from index 1 upwards)
    const chronological = [...this.auditLogs].sort((a, b) => a.index - b.index);
    let currentPrev = '0000000000000000000000000000000000000000000000000000000000000000';

    for (const record of chronological) {
      if (record.previousHash !== currentPrev) {
        return {
          tampered: true,
          failedAtIndex: record.index,
          expectedPrev: currentPrev,
          foundPrev: record.previousHash
        };
      }
      const expectedHash = this.computeBlockHash(
        record.previousHash,
        record.index,
        record.timestamp,
        record.ticketId,
        record.status,
        record.staffId,
        record.theaterId
      );
      if (record.hash !== expectedHash) {
        return {
          tampered: true,
          failedAtIndex: record.index,
          expectedHash,
          foundHash: record.hash
        };
      }
      currentPrev = record.hash;
    }

    return {
      tampered: false,
      totalVerifiedBlocks: chronological.length,
      latestHash: currentPrev
    };
  }

  // Lookup methods
  getTheaters() {
    return this.theaters;
  }

  getTheater(theaterId) {
    return this.theaters.find(t => t.id === theaterId);
  }

  getScreens(theaterId) {
    const theater = this.getTheater(theaterId);
    return theater ? theater.screens : [];
  }

  getScreen(screenId) {
    for (const t of this.theaters) {
      const found = t.screens.find(s => s.id === screenId);
      if (found) return found;
    }
    return null;
  }

  getShows(theaterId) {
    if (!theaterId || theaterId === 'all') return this.shows;
    return this.shows.filter(s => s.theaterId === theaterId);
  }

  getShow(showId) {
    return this.shows.find(s => s.id === showId);
  }

  getStaffUsers(theaterId) {
    if (!theaterId || theaterId === 'all') return this.staffUsers;
    return this.staffUsers.filter(u => u.theaterId === theaterId || u.role.includes('Admin'));
  }

  authenticateStaff(pin, theaterId) {
    return this.staffUsers.find(u => {
      const pinMatches = u.pin === pin;
      if (!pinMatches) return false;
      if (!theaterId) return true;
      return u.theaterId === theaterId || u.role.includes('Admin');
    });
  }

  findTicketByBookingRef(ref) {
    if (!ref) return null;
    const clean = ref.trim().toUpperCase();
    return this.tickets.find(t => t.bookingReference.toUpperCase() === clean || t.id === ref);
  }

  findTicketById(id) {
    return this.tickets.find(t => t.id === id);
  }

  getTicketsForShow(showId) {
    if (!showId || showId === 'all') return this.tickets;
    return this.tickets.filter(t => t.showId === showId);
  }

  getTicketsForTheater(theaterId) {
    if (!theaterId || theaterId === 'all') return this.tickets;
    return this.tickets.filter(t => t.theaterId === theaterId);
  }

  updateTicket(ticket) {
    const idx = this.tickets.findIndex(t => t.id === ticket.id);
    if (idx !== -1) {
      this.tickets[idx] = { ...ticket };
    }
  }

  addTicket(ticket) {
    this.tickets.unshift(ticket);
    return ticket;
  }

  resetShowTickets(showId) {
    let count = 0;
    this.tickets = this.tickets.map(t => {
      if (!showId || showId === 'all' || t.showId === showId) {
        count++;
        return {
          ...t,
          isRedeemed: false,
          redeemedAt: null,
          redeemedByStaffId: null,
          redeemedByStaffName: null,
          redeemedGate: null,
          deviceInfo: null
        };
      }
      return t;
    });
    return count;
  }

  getAuditLogs({ theaterId, showId, status, limit = 100 }) {
    let logs = this.auditLogs;
    if (theaterId && theaterId !== 'all') {
      logs = logs.filter(l => l.theaterId === theaterId);
    }
    if (showId && showId !== 'all') {
      logs = logs.filter(l => l.showId === showId);
    }
    if (status && status !== 'ALL') {
      logs = logs.filter(l => l.status === status);
    }
    return logs.slice(0, limit);
  }

  getAnalytics(theaterId, showId) {
    const tickets = (theaterId && theaterId !== 'all') 
      ? this.tickets.filter(t => t.theaterId === theaterId && (!showId || showId === 'all' || t.showId === showId))
      : (showId && showId !== 'all') ? this.tickets.filter(t => t.showId === showId) : this.tickets;

    const totalTickets = tickets.length;
    const redeemedTickets = tickets.filter(t => t.isRedeemed).length;
    const pendingTickets = totalTickets - redeemedTickets;

    const relevantLogs = (theaterId && theaterId !== 'all')
      ? this.auditLogs.filter(l => l.theaterId === theaterId)
      : this.auditLogs;

    const duplicateAttemptsBlocked = relevantLogs.filter(l => l.status === 'DUPLICATE_BLOCKED').length;
    const unverifiedBlocked = relevantLogs.filter(l => l.status === 'UNVERIFIED_PROVIDER' || l.status === 'INVALID_TICKET' || l.status === 'TAMPERED_SIGNATURE').length;
    const wrongShowBlocked = relevantLogs.filter(l => l.status === 'WRONG_SHOW' || l.status === 'WRONG_SCREEN').length;

    // Scans in last 60 minutes
    const oneHourAgo = Date.now() - 3600000;
    const recentScans = relevantLogs.filter(l => l.timestamp > oneHourAgo).length;

    return {
      totalTickets,
      redeemedTickets,
      pendingTickets,
      turnoutPercentage: totalTickets > 0 ? Math.round((redeemedTickets / totalTickets) * 100) : 0,
      duplicateAttemptsBlocked,
      unverifiedBlocked,
      wrongShowBlocked,
      totalScansAttempted: relevantLogs.length,
      scansLastHour: recentScans,
      securityScore: 100 // 100% atomic enforcement
    };
  }
}

export const db = new EntryXDatabase();
