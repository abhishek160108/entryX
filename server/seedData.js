import crypto from 'crypto';

// Secret key for HMAC verification of authorized BookMyShow and EntryX tokens
export const HMAC_SECRET = 'entryx_tn_cinemas_secure_hmac_key_2026';

// Helper to sign a ticket token
export function signToken(dataString) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(dataString).digest('hex').substring(0, 16);
}

// 1. Theaters across Tamil Nadu
export const THEATERS = [
  {
    id: 'theater-sathyam-chennai',
    name: 'PVR INOX SPI Sathyam',
    city: 'Chennai',
    location: 'Royapettah, Chennai, Tamil Nadu',
    code: 'SATHYAM-01',
    screensCount: 6,
    screens: [
      { id: 'screen-sathyam-1', name: 'Audi 1 - Sathyam (RGB Laser 4K)', capacity: 540 },
      { id: 'screen-sathyam-2', name: 'Audi 2 - Santham (Dolby Atmos)', capacity: 320 },
      { id: 'screen-sathyam-3', name: 'Audi 3 - Subam', capacity: 280 }
    ]
  },
  {
    id: 'theater-rohini-chennai',
    name: 'Rohini Silver Screens',
    city: 'Chennai',
    location: 'Koyambedu, Chennai, Tamil Nadu',
    code: 'ROHINI-02',
    screensCount: 7,
    screens: [
      { id: 'screen-rohini-1', name: 'Screen 1 - Main Dolby Atmos', capacity: 780 },
      { id: 'screen-rohini-2', name: 'Screen 2 - Grand Screen', capacity: 420 }
    ]
  },
  {
    id: 'theater-broadway-cbe',
    name: 'Broadway Mega Multiplex',
    city: 'Coimbatore',
    location: 'Avinashi Road, Coimbatore, Tamil Nadu',
    code: 'BROADWAY-03',
    screensCount: 9,
    screens: [
      { id: 'screen-broadway-1', name: 'Screen 1 - EPIQ Giant Screen', capacity: 620 },
      { id: 'screen-broadway-2', name: 'Screen 2 - Atmos Gold Class', capacity: 250 }
    ]
  },
  {
    id: 'theater-vettri-chennai',
    name: 'Vettri Theatres',
    city: 'Chennai',
    location: 'Chromepet, Chennai, Tamil Nadu',
    code: 'VETTRI-04',
    screensCount: 2,
    screens: [
      { id: 'screen-vettri-1', name: 'Audi 1 - Vettri RGB Laser', capacity: 610 },
      { id: 'screen-vettri-2', name: 'Audi 2 - Rakesh 4K', capacity: 350 }
    ]
  }
];

// 2. Staff Accounts (with fast 4-digit PIN for Android mobile operation)
export const STAFF_USERS = [
  {
    id: 'staff-101',
    name: 'Karthik Raja',
    role: 'Gate Usher',
    theaterId: 'theater-sathyam-chennai',
    assignedGate: 'Gate 1 (Stalls / Premiere)',
    assignedScreenId: 'screen-sathyam-1',
    pin: '1234',
    phone: '+91 98401 23456'
  },
  {
    id: 'staff-102',
    name: 'Priya Natarajan',
    role: 'Gate Usher',
    theaterId: 'theater-sathyam-chennai',
    assignedGate: 'Gate 2 (Balcony / VIP)',
    assignedScreenId: 'screen-sathyam-1',
    pin: '5678',
    phone: '+91 98402 34567'
  },
  {
    id: 'staff-103',
    name: 'Saravanan Veerappan',
    role: 'Gate Supervisor',
    theaterId: 'theater-rohini-chennai',
    assignedGate: 'Main Foyer North Gate',
    assignedScreenId: 'screen-rohini-1',
    pin: '2468',
    phone: '+91 98403 45678'
  },
  {
    id: 'staff-admin',
    name: 'Muthukumar S (Admin)',
    role: 'Duty Manager / Admin',
    theaterId: 'theater-sathyam-chennai',
    assignedGate: 'All Gates / Control Central',
    assignedScreenId: 'all',
    pin: '9999',
    phone: '+91 98400 99999'
  }
];

// 3. Current Live Shows
export const SHOWS = [
  {
    id: 'show-coolie-1845',
    theaterId: 'theater-sathyam-chennai',
    screenId: 'screen-sathyam-1',
    screenName: 'Audi 1 - Sathyam (RGB Laser 4K)',
    movieTitle: 'Coolie',
    language: 'Tamil (2D)',
    rating: 'UA',
    showDate: '2026-10-18',
    showTime: '06:45 PM',
    showTimeRaw: '18:45',
    totalSeats: 540,
    isActive: true
  },
  {
    id: 'show-coolie-2215',
    theaterId: 'theater-sathyam-chennai',
    screenId: 'screen-sathyam-1',
    screenName: 'Audi 1 - Sathyam (RGB Laser 4K)',
    movieTitle: 'Coolie',
    language: 'Tamil (2D)',
    rating: 'UA',
    showDate: '2026-10-18',
    showTime: '10:15 PM',
    showTimeRaw: '22:15',
    totalSeats: 540,
    isActive: false
  },
  {
    id: 'show-goat-1900',
    theaterId: 'theater-sathyam-chennai',
    screenId: 'screen-sathyam-2',
    screenName: 'Audi 2 - Santham (Dolby Atmos)',
    movieTitle: 'The Greatest of All Time',
    language: 'Tamil (Dolby Atmos)',
    rating: 'UA',
    showDate: '2026-10-18',
    showTime: '07:00 PM',
    showTimeRaw: '19:00',
    totalSeats: 320,
    isActive: true
  },
  {
    id: 'show-rohini-coolie-1915',
    theaterId: 'theater-rohini-chennai',
    screenId: 'screen-rohini-1',
    screenName: 'Screen 1 - Main Dolby Atmos',
    movieTitle: 'Coolie',
    language: 'Tamil (Fans Special)',
    rating: 'UA',
    showDate: '2026-10-18',
    showTime: '07:15 PM',
    showTimeRaw: '19:15',
    totalSeats: 780,
    isActive: true
  },
  {
    id: 'show-broadway-amaran-1830',
    theaterId: 'theater-broadway-cbe',
    screenId: 'screen-broadway-1',
    screenName: 'Screen 1 - EPIQ Giant Screen',
    movieTitle: 'Amaran',
    language: 'Tamil (4K Laser)',
    rating: 'UA',
    showDate: '2026-10-18',
    showTime: '06:30 PM',
    showTimeRaw: '18:30',
    totalSeats: 620,
    isActive: true
  }
];

// 4. Generate Pre-seeded Tickets with Valid BookMyShow, TicketNew and BoxOffice structures
export function generateSeedTickets() {
  const tickets = [];

  // Show 1: Sathyam Coolie 06:45 PM
  const show1 = SHOWS[0];

  // BookMyShow Tickets
  const bmsBookings = [
    { bookingId: 'WXBMS78910', customer: 'Vigneshwaran K', seats: ['E12', 'E13'], category: 'PREMIERE', count: 2 },
    { bookingId: 'WXBMS78911', customer: 'Ananya S', seats: ['F05', 'F06', 'F07'], category: 'PREMIERE', count: 3 },
    { bookingId: 'WXBMS78912', customer: 'Dinesh Karthik', seats: ['A01', 'A02'], category: 'VIP BALCONY', count: 2 },
    { bookingId: 'WXBMS78913', customer: 'Meenakshi Sundaram', seats: ['K14', 'K15', 'K16', 'K17'], category: 'EXECUTIVE', count: 4 },
    { bookingId: 'WXBMS78914', customer: 'Sujith Kumar', seats: ['C08'], category: 'PREMIERE', count: 1 }
  ];

  bmsBookings.forEach((b, idx) => {
    const rawData = `BMS:${show1.theaterId}:${show1.id}:${b.bookingId}:${b.seats.join(',')}`;
    const sig = signToken(rawData);
    
    // QR payload can be the structured QR string or JSON string
    const qrString = `BMS:TN:${show1.theaterId}:${b.bookingId}:${b.seats.join(',')}:${sig}`;
    
    tickets.push({
      id: `tkt-${b.bookingId}`,
      bookingReference: b.bookingId,
      provider: 'BOOKMYSHOW',
      theaterId: show1.theaterId,
      screenId: show1.screenId,
      screenName: show1.screenName,
      showId: show1.id,
      movieTitle: show1.movieTitle,
      showTime: show1.showTime,
      showDate: show1.showDate,
      customerName: b.customer,
      seats: b.seats,
      seatCategory: b.category,
      admitCount: b.count,
      qrPayload: qrString,
      qrJson: JSON.stringify({
        provider: 'BOOKMYSHOW',
        bookingId: b.bookingId,
        theaterId: show1.theaterId,
        screenId: show1.screenId,
        showId: show1.id,
        seats: b.seats,
        sig: sig
      }),
      signature: sig,
      isRedeemed: idx === 0, // Mark first one as ALREADY redeemed so we can immediately test DUPLICATE detection!
      redeemedAt: idx === 0 ? Date.now() - 1000 * 60 * 18 : null, // 18 mins ago
      redeemedByStaffId: idx === 0 ? 'staff-101' : null,
      redeemedByStaffName: idx === 0 ? 'Karthik Raja' : null,
      redeemedGate: idx === 0 ? 'Gate 1 (Stalls / Premiere)' : null,
      deviceInfo: idx === 0 ? 'Samsung Galaxy M34 (Android 14)' : null
    });
  });

  // TicketNew Tickets
  const ticketNewBookings = [
    { bookingId: 'TNW994012A', customer: 'Gopinath R', seats: ['G10', 'G11'], category: 'PREMIERE', count: 2 },
    { bookingId: 'TNW994013B', customer: 'Deepika Raman', seats: ['B04', 'B05'], category: 'VIP BALCONY', count: 2 },
    { bookingId: 'TNW994014C', customer: 'Bala Chandran', seats: ['H15'], category: 'EXECUTIVE', count: 1 }
  ];

  ticketNewBookings.forEach((b) => {
    const rawData = `TNW:${show1.theaterId}:${show1.id}:${b.bookingId}:${b.seats.join(',')}`;
    const sig = signToken(rawData);
    const qrString = `TNW:${show1.theaterId}:${b.bookingId}:${b.seats.join(',')}:${sig}`;

    tickets.push({
      id: `tkt-${b.bookingId}`,
      bookingReference: b.bookingId,
      provider: 'TICKETNEW',
      theaterId: show1.theaterId,
      screenId: show1.screenId,
      screenName: show1.screenName,
      showId: show1.id,
      movieTitle: show1.movieTitle,
      showTime: show1.showTime,
      showDate: show1.showDate,
      customerName: b.customer,
      seats: b.seats,
      seatCategory: b.category,
      admitCount: b.count,
      qrPayload: qrString,
      qrJson: JSON.stringify({
        provider: 'TICKETNEW',
        bookingId: b.bookingId,
        theaterId: show1.theaterId,
        screenId: show1.screenId,
        showId: show1.id,
        seats: b.seats,
        sig: sig
      }),
      signature: sig,
      isRedeemed: false,
      redeemedAt: null,
      redeemedByStaffId: null,
      redeemedByStaffName: null,
      redeemedGate: null,
      deviceInfo: null
    });
  });

  // Box Office / EntryX Direct Tickets
  const boxOfficeBookings = [
    { bookingId: 'EX-BOX-5501', customer: 'Ramesh Babu (Counter 1)', seats: ['J01', 'J02', 'J03'], category: 'EXECUTIVE', count: 3 },
    { bookingId: 'EX-BOX-5502', customer: 'Selvamani (Counter 2)', seats: ['C12'], category: 'PREMIERE', count: 1 }
  ];

  boxOfficeBookings.forEach((b) => {
    const rawData = `ENTRYX:${show1.theaterId}:${show1.id}:${b.bookingId}:${b.seats.join(',')}`;
    const sig = signToken(rawData);
    const qrString = `ENTRYX:${show1.theaterId}:${b.bookingId}:${b.seats.join(',')}:${sig}`;

    tickets.push({
      id: `tkt-${b.bookingId}`,
      bookingReference: b.bookingId,
      provider: 'BOX_OFFICE',
      theaterId: show1.theaterId,
      screenId: show1.screenId,
      screenName: show1.screenName,
      showId: show1.id,
      movieTitle: show1.movieTitle,
      showTime: show1.showTime,
      showDate: show1.showDate,
      customerName: b.customer,
      seats: b.seats,
      seatCategory: b.category,
      admitCount: b.count,
      qrPayload: qrString,
      qrJson: JSON.stringify({
        provider: 'BOX_OFFICE',
        bookingId: b.bookingId,
        theaterId: show1.theaterId,
        screenId: show1.screenId,
        showId: show1.id,
        seats: b.seats,
        sig: sig
      }),
      signature: sig,
      isRedeemed: false,
      redeemedAt: null,
      redeemedByStaffId: null,
      redeemedByStaffName: null,
      redeemedGate: null,
      deviceInfo: null
    });
  });

  // Cross-show ticket to test "WRONG SHOW" or "WRONG SCREEN" validation
  // Ticket for Sathyam Audi 2 (The Greatest of All Time)
  const show2 = SHOWS[2];
  const wrongScreenBooking = {
    bookingId: 'WXBMS-WRONG-AUDI',
    customer: 'Ashwin Kumar',
    seats: ['F14', 'F15'],
    category: 'PREMIERE',
    count: 2
  };
  const rawData2 = `BMS:${show2.theaterId}:${show2.id}:${wrongScreenBooking.bookingId}:${wrongScreenBooking.seats.join(',')}`;
  const sig2 = signToken(rawData2);
  tickets.push({
    id: `tkt-${wrongScreenBooking.bookingId}`,
    bookingReference: wrongScreenBooking.bookingId,
    provider: 'BOOKMYSHOW',
    theaterId: show2.theaterId,
    screenId: show2.screenId,
    screenName: show2.screenName,
    showId: show2.id,
    movieTitle: show2.movieTitle,
    showTime: show2.showTime,
    showDate: show2.showDate,
    customerName: wrongScreenBooking.customer,
    seats: wrongScreenBooking.seats,
    seatCategory: wrongScreenBooking.category,
    admitCount: wrongScreenBooking.count,
    qrPayload: `BMS:TN:${show2.theaterId}:${wrongScreenBooking.bookingId}:${wrongScreenBooking.seats.join(',')}:${sig2}`,
    qrJson: JSON.stringify({
      provider: 'BOOKMYSHOW',
      bookingId: wrongScreenBooking.bookingId,
      theaterId: show2.theaterId,
      screenId: show2.screenId,
      showId: show2.id,
      seats: wrongScreenBooking.seats,
      sig: sig2
    }),
    signature: sig2,
    isRedeemed: false,
    redeemedAt: null,
    redeemedByStaffId: null,
    redeemedByStaffName: null,
    redeemedGate: null,
    deviceInfo: null
  });

  // Ticket for Late Night Show (10:15 PM) to test "WRONG SHOW TIME"
  const showLate = SHOWS[1];
  const wrongTimeBooking = {
    bookingId: 'WXBMS-LATE-NIGHT',
    customer: 'Kavitha S',
    seats: ['D08', 'D09'],
    category: 'PREMIERE',
    count: 2
  };
  const rawDataLate = `BMS:${showLate.theaterId}:${showLate.id}:${wrongTimeBooking.bookingId}:${wrongTimeBooking.seats.join(',')}`;
  const sigLate = signToken(rawDataLate);
  tickets.push({
    id: `tkt-${wrongTimeBooking.bookingId}`,
    bookingReference: wrongTimeBooking.bookingId,
    provider: 'BOOKMYSHOW',
    theaterId: showLate.theaterId,
    screenId: showLate.screenId,
    screenName: showLate.screenName,
    showId: showLate.id,
    movieTitle: showLate.movieTitle,
    showTime: showLate.showTime,
    showDate: showLate.showDate,
    customerName: wrongTimeBooking.customer,
    seats: wrongTimeBooking.seats,
    seatCategory: wrongTimeBooking.category,
    admitCount: wrongTimeBooking.count,
    qrPayload: `BMS:TN:${showLate.theaterId}:${wrongTimeBooking.bookingId}:${wrongTimeBooking.seats.join(',')}:${sigLate}`,
    qrJson: JSON.stringify({
      provider: 'BOOKMYSHOW',
      bookingId: wrongTimeBooking.bookingId,
      theaterId: showLate.theaterId,
      screenId: showLate.screenId,
      showId: showLate.id,
      seats: wrongTimeBooking.seats,
      sig: sigLate
    }),
    signature: sigLate,
    isRedeemed: false,
    redeemedAt: null,
    redeemedByStaffId: null,
    redeemedByStaffName: null,
    redeemedGate: null,
    deviceInfo: null
  });

  return tickets;
}
