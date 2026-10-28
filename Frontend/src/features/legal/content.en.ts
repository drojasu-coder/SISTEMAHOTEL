import type { LegalDocuments } from './types';

/** English version of the legal content. It must stay equivalent to content.es.ts. */
export const legalEn: LegalDocuments = {
  terminos: {
    title: 'Terms and conditions',
    description:
      'Terms of use of the HOTEL HUNAHPÚ platform: accounts, reservations, prices, payments and service limits.',
    sections: [
      {
        id: 'naturaleza',
        title: 'Nature of this site',
        blocks: [
          { p: 'HOTEL HUNAHPÚ is a university hotel-management project. The site demonstrates how a reservation, payment and administration system works for a hotel with locations in Guatemala.' },
          { p: 'HOTEL HUNAHPÚ is not a registered company and not a lodging establishment registered with the Guatemalan Tourism Institute (INGUAT). The reservations, services and amounts shown are for academic purposes and are not a real commercial offer of lodging, dining or other services.' },
        ],
      },
      {
        id: 'alcance',
        title: 'Scope of these terms',
        blocks: [
          { p: 'These terms describe how the platform works and what is expected of the people who use it. They complement the Privacy policy, the Reservation, cancellation and refund policy and the Browser storage policy.' },
          { p: 'The system does not record an explicit acceptance of these terms: there is no acceptance checkbox and no record of when they were read. Nothing here limits the rights that Decree 6-2003 of the Congress of Guatemala (Consumer and User Protection Law) grants to consumers and users.' },
        ],
      },
      {
        id: 'cuentas',
        title: 'Registration, sign-in and credentials',
        blocks: [
          { p: 'To make a reservation you need a customer account with your name, email address and password; a phone number is optional.' },
          { list: [
            'The password must be 8 to 72 characters long and include at least one uppercase letter, one lowercase letter and one number.',
            'The system does not verify ownership of the email address during registration.',
            'A session lasts at most one hour. It is kept while the tab is open and shared with other tabs of the same site open in the browser; signing out in one of them signs out in all of them.',
            'After several failed attempts, the server temporarily limits new sign-in attempts.',
          ] },
          { p: 'You are responsible for keeping your password confidential and for signing out on shared devices. If you suspect unauthorized use of your account, report it through the contact details published on the site.' },
        ],
      },
      {
        id: 'uso',
        title: 'Permitted use',
        blocks: [
          { p: 'The platform must be used to browse the catalogs and manage your own reservations. You may not:' },
          { list: [
            'Access or try to access other people’s accounts, reservations or payments.',
            'Enter false third-party data or impersonate another person.',
            'Send automated requests that disrupt the service or bypass access controls.',
            'Use administrative functions without the authorization of your role.',
          ] },
          { p: 'Hotel staff only access the functions of their role and, where applicable, only the information of the locations assigned to them.' },
        ],
      },
      {
        id: 'reservas',
        title: 'Booking requirements and confirmations',
        blocks: [
          { list: [
            'Rooms: you choose the location, arrival and departure dates and number of guests, within the capacity of the room type. Checking availability does not hold the room; availability is checked again when the reservation is created. The reservation is created as “pending” and becomes “confirmed” when approved payments cover its total, or when staff confirm it.',
            'Restaurant, activities, wellness and amenities: the reservation is recorded as “confirmed” when the system validates the time, capacity and service rules. That status is operational: on its own it does not prove that a payment exists.',
            'Events: the request is recorded as a “quotation”. It does not hold the venue or create an immediate charge. Administrative staff confirm it.',
          ] },
          { p: 'Dates and times are interpreted in Guatemala time.' },
        ],
      },
      {
        id: 'precios-pagos',
        title: 'Prices and payments',
        blocks: [
          { list: [
            'Prices are stated in quetzales (GTQ) and include applicable taxes. Accommodation also carries the INGUAT tourism tax; other services carry VAT only.',
            'The US dollar (USD) amount is a reference calculated at Q7.80 per US$1.00. Payments are always processed in quetzales.',
            'The total of a room reservation is calculated with the rate in force when it is created or when its dates or room change. If the catalog rate changes later, the recorded amount is not recalculated.',
            'For events, a deposit of 30% of the quotation total (venue base rate plus additional services) is calculated. The balance can only be paid after the deposit is covered.',
            'Online payments are made by card through Stripe. The platform runs Stripe in test mode: no real charges are made and Stripe’s test data must be used.',
            'A bank transfer stays pending until authorized staff approve it. Cash payments can only be recorded by staff.',
            'A shopping cart expires after 15 minutes. If it expires before payment, a new cart must be started.',
          ] },
          { p: 'The system creates internal invoice records. They are not electronic tax documents certified by Guatemala’s Tax Administration (SAT).' },
        ],
      },
      {
        id: 'cancelaciones',
        title: 'Cancellations and changes',
        blocks: [
          { p: 'The rules for each service are detailed in the Reservation, cancellation and refund policy. In short, only event quotations and reservations can be cancelled directly from the customer account; all other reservations are changed or cancelled by hotel staff. No refund is automatic.' },
        ],
      },
      {
        id: 'limitaciones',
        title: 'Service limitations',
        blocks: [
          { list: [
            'Information about locations, rooms, menus, activities, services and venues is for demonstration and may change without notice.',
            'The system does not send email or text-message confirmations: the status of each reservation is shown under “My reservations”.',
            'The site may be unavailable during maintenance or technical failures.',
          ] },
        ],
      },
      {
        id: 'ley-aplicable',
        title: 'Reference regulations and complaints',
        blocks: [
          { p: 'The laws of the Republic of Guatemala are used as a reference, in particular Decree 6-2003 of the Congress (Consumer and User Protection Law) and Government Agreement 1144-83 (INGUAT Regulation for Lodging Establishments).' },
          { p: 'A real establishment must make an authorized complaints book available to the public (article 17 of Decree 6-2003 and article 103 of Government Agreement 1144-83). This project does not have an authorized complaints book; questions and complaints are handled through the contact details published on the site.' },
        ],
      },
      {
        id: 'cambios',
        title: 'Changes to these terms',
        blocks: [
          { p: 'These terms may be updated when the platform changes. The date of the last update is shown at the top of this page.' },
        ],
      },
    ],
  },

  privacidad: {
    title: 'Privacy policy',
    description:
      'Which personal data the platform collects, what it is used for, where it is processed and who can see it.',
    sections: [
      {
        id: 'responsable',
        title: 'Controller and legal framework',
        blocks: [
          { p: 'The platform is a university hotel-management project and is not operated by a registered legal entity. Questions about this policy are handled through the contact details published on the site.' },
          { p: 'Guatemala does not yet have a comprehensive personal data protection law applicable to the private sector; the bills submitted to Congress have not been passed. This policy does not claim compliance with foreign regulations such as the European Union’s General Data Protection Regulation.' },
        ],
      },
      {
        id: 'datos',
        title: 'Data that is stored',
        blocks: [
          { list: [
            'Account: name, email address, phone number (optional), role, active or inactive status and creation and update dates. The password is not stored in readable form: its cryptographic hash (bcrypt) is stored.',
            'Room reservations: location and room, arrival and departure dates, number of guests, status and total amount.',
            'Restaurant: table, date, time, number of diners and status.',
            'Activities: resource, instructor (if chosen), date, time slot, participants, equipment, status and amount.',
            'Wellness: service, therapist, date, time slot and appointment status.',
            'Amenities: amenity, date, time slot, requested furniture, QR code and status.',
            'Events: venue, event type, date, time slot, number of guests, additional services, total, deposit and status.',
            'Cart and payments: cart items, amount, currency, method, payment type (full, deposit or balance), status, date, Stripe payment attempt identifier, idempotency key and, if any, error code and message. Refunds record amount, reason, status and external identifier.',
            'Invoices: tax ID (NIT), tax name and address, and the breakdown of amounts and taxes.',
            'Hotel staff: in addition to the account, main location, additional authorized locations, department and hiring date.',
          ] },
          { p: 'The platform does not store the full card number, expiry date or security code. These are entered in Stripe’s payment form and do not pass through the project’s servers.' },
        ],
      },
      {
        id: 'finalidades',
        title: 'What it is used for',
        blocks: [
          { list: [
            'Authenticating each person and applying the permissions of their role.',
            'Creating, viewing and managing reservations, quotations and payments.',
            'Calculating amounts, deposits and balances, and recording internal invoices and refunds.',
            'Allowing authorized staff to handle the reservations of their assigned locations.',
            'Diagnosing errors and protecting the service against misuse.',
          ] },
          { p: 'The data is not used for advertising, commercial profiling or automated decision-making, and it is not sold to third parties.' },
        ],
      },
      {
        id: 'proveedores',
        title: 'Where it is processed',
        blocks: [
          { list: [
            'PostgreSQL: the database that stores accounts, reservations, payments and invoices.',
            'Stripe: processes card payments in test mode. The platform sends it the amount, currency and internal references (payment, cart or reservation identifiers and payment type); it does not send your name or email.',
            'Amazon Web Services (S3): stores catalog images (locations, rooms, menus and services). Customers do not upload images.',
            'Google Fonts: the site loads its typefaces from Google servers, so your browser sends them technical connection data such as your IP address.',
          ] },
        ],
      },
      {
        id: 'acceso',
        title: 'Who can see the information',
        blocks: [
          { list: [
            'Each customer can only see their own reservations, payments and invoices.',
            'Staff access depends on their role: the general administrator sees all locations; reception and managers only see administrative information for their assigned locations.',
            'Refunds and transfer approvals are reserved for authorized administrative roles.',
          ] },
        ],
      },
      {
        id: 'seguridad',
        title: 'Security measures',
        blocks: [
          { list: [
            'Passwords stored as a cryptographic hash (bcrypt).',
            'Sessions use an access token that expires after one hour and is kept in the tab’s storage, not in cookies.',
            'Permissions checked on the server for every request, by role and by location.',
            'Limited sign-in attempts.',
            'Server technical logs record the path, method, result and duration of each request, and leave out passwords, tokens and card data.',
          ] },
          { p: 'No measure removes risk completely. The platform does not claim any security certification.' },
        ],
      },
      {
        id: 'conservacion',
        title: 'Retention',
        blocks: [
          { p: 'There are no automatic deletion periods. Cancelled reservations are kept as history and records are kept while the project is active.' },
        ],
      },
      {
        id: 'derechos',
        title: 'Questions and requests',
        blocks: [
          { p: 'You can review your account details under “My account” and your reservations under “My reservations”. The platform does not yet offer self-service correction or deletion of the account. Correction or deletion requests are sent through the published contact details and handled manually, with no guaranteed response time.' },
        ],
      },
      {
        id: 'cambios',
        title: 'Changes to this policy',
        blocks: [
          { p: 'This policy will be updated if the data processed or the providers used change. The date of the last update is shown at the top of this page.' },
        ],
      },
    ],
  },

  reservas: {
    title: 'Reservations, cancellations and refunds',
    description:
      'How reservation statuses work, who can cancel and how a refund is handled, service by service.',
    sections: [
      {
        id: 'principios',
        title: 'General principles',
        blocks: [
          { list: [
            'Pending: the reservation exists but is not yet confirmed (rooms).',
            'Confirmed: the reservation is valid for the stated date. For restaurant, activities, wellness and amenities it is an operational status that does not prove payment.',
            'Quotation: an event request that does not yet hold the venue.',
            'Cancelled: the reservation is no longer in force but is kept as history.',
          ] },
          { p: 'Cancelling a reservation and refunding a payment are different operations. Cancelling changes the reservation status; a refund only exists when authorized staff record it on an approved payment. No refund is created automatically when cancelling.' },
          { p: 'The system does not apply deadlines, penalties or charges for late cancellation or no-shows.' },
        ],
      },
      {
        id: 'habitaciones',
        title: 'Rooms',
        blocks: [
          { list: [
            'The reservation is created as “pending” and becomes “confirmed” when its approved payments cover the total, or when staff confirm it.',
            'Customers cannot cancel it themselves on the platform. To cancel or change it, contact the hotel; authorized staff at the location cancel or change it.',
            'A reservation cannot be cancelled or changed while one of its payments is processing, and its total cannot be reduced below what has already been paid.',
            'Cancelling does not create an automatic refund. The refund is handled separately, as described below.',
          ] },
          { p: 'Regulatory reference (INGUAT): Government Agreement 1144-83 allows an establishment to require earnest money (a deposit) to formalize a reservation (article 96). If the guest cancels, the establishment must return it and may keep 30% when cancelling more than 30 days in advance, 50% when more than 7 days in advance, and the full deposit when 7 days or less (article 98). If the establishment fails to honor the reservation, it must return the deposit plus an equal amount (article 97). The system does not calculate these amounts or require a deposit for rooms: it charges the full total. How to apply them is an open decision (see “Open issues”).' },
          { p: 'Unless INGUAT approves otherwise, the right to occupy the room starts at 13:00 on one day and ends at 13:00 the next day (article 89). The platform records arrival and departure dates, but not check-in and check-out times.' },
        ],
      },
      {
        id: 'restaurante',
        title: 'Restaurant',
        blocks: [
          { list: [
            'A table reservation is recorded as “confirmed” and does not require an online payment.',
            'Customers cannot cancel it on the platform; administrative staff cancel or reactivate it. Reactivation checks again that the table is free and in service.',
          ] },
        ],
      },
      {
        id: 'actividades',
        title: 'Activities and experiences',
        blocks: [
          { list: [
            'The amount is calculated from the resource’s hourly rate and, if chosen, the instructor’s, multiplied by the duration (between 30 minutes and 2 hours).',
            'Equipment with a charge is not offered online because it has no defined billing unit; free equipment can be requested.',
            'Customers cannot cancel on the platform; administrative staff set the status to cancelled or completed.',
          ] },
        ],
      },
      {
        id: 'bienestar',
        title: 'Wellness',
        blocks: [
          { list: [
            'The appointment is recorded as “confirmed” with an available therapist and time slot. That status does not prove payment; payment is handled in the cart and checkout.',
            'Customers cannot cancel on the platform; administrative staff set the status to cancelled or completed.',
          ] },
        ],
      },
      {
        id: 'amenidades',
        title: 'Amenities',
        blocks: [
          { list: [
            'An amenity reservation is recorded for a date and time slot and generates a QR code. Amenities have no configured rate, so they are not charged online.',
            'Customers cannot cancel it on the platform; administrative staff mark it as used or cancelled.',
          ] },
        ],
      },
      {
        id: 'eventos',
        title: 'Events and quotations',
        blocks: [
          { list: [
            'The request is recorded as a “quotation”, without holding the venue or creating charges. The total adds the venue base rate and additional services; the required deposit is 30% of the total.',
            'Administrative staff confirm, cancel or complete the event.',
            'Customers can cancel their own quotation or reservation from “My reservations” as long as it has no approved or processing payments. An expired reservation cannot be cancelled.',
            'If an approved payment already exists, the cancellation and any refund must be requested from the hotel.',
          ] },
        ],
      },
      {
        id: 'reembolsos',
        title: 'How a refund is handled',
        blocks: [
          { list: [
            'Request: the customer submits it through the published contact details. The platform has no refund request form.',
            'Review: only authorized administrative roles can record a refund. It can be full or partial and never higher than the approved amount available.',
            'Processing: for card payments the refund is sent to Stripe, and its status (pending, approved or rejected) depends on Stripe’s response. In test mode no real money is returned. For manually recorded payments, the refund is recorded in the system, but the money is returned outside the platform.',
            'Result: the payment is marked as “refunded” or “partially refunded”.',
          ] },
          { p: 'The platform does not guarantee a refund or a crediting time. Timing depends on the card issuer and payment method.' },
        ],
      },
      {
        id: 'retracto',
        title: 'Right of withdrawal',
        blocks: [
          { p: 'Article 51 of Decree 6-2003 gives consumers the right to withdraw within no more than five business days when the contract is concluded outside the business premises, with a refund of the amounts paid provided the service has not been used. The platform has no automated process for this: it must be requested through the contact details and staff handle it manually.' },
        ],
      },
      {
        id: 'pendientes',
        title: 'Open issues',
        blocks: [
          { p: 'Before the platform could operate with real customers, these points would need a commercial decision or legal review:' },
          { list: [
            'How to apply the deposit regime and the article 98 amounts of Government Agreement 1144-83 to rooms, given that the system charges the full total and does not calculate them.',
            'Deadlines and a formal channel for cancellation, refund and withdrawal requests.',
            'Check-in and check-out times and room rates approved by INGUAT.',
            'Registration of the standard-form contract with the Consumer Assistance Directorate (article 52 of Decree 6-2003) and an authorized complaints book.',
            'Issuing SAT-certified electronic invoices.',
          ] },
        ],
      },
    ],
  },

  almacenamiento: {
    title: 'Cookies and browser storage',
    description:
      'What the site stores in your browser, what it is for and why no cookie consent banner is shown.',
    sections: [
      {
        id: 'resumen',
        title: 'Summary',
        blocks: [
          { p: 'The site does not set its own cookies and does not use analytics, advertising or tracking tools. It uses browser storage (sessionStorage and localStorage) only for essential functions and preferences you choose. That is why no cookie consent banner is shown.' },
        ],
      },
      {
        id: 'session',
        title: 'Tab storage (sessionStorage)',
        blocks: [
          { p: 'It is cleared when the tab is closed. It contains:' },
          { list: [
            'The session access token (it expires after one hour and is removed when signing out).',
            'Search and booking drafts (stay criteria, room selection and service details in progress), so they are not lost while signing in.',
            'Technical data of the payment attempt in progress, to avoid duplicate charges if you reload the page.',
            'For staff, the location selected in the admin panel. This preference does not grant permissions: the server checks permissions.',
          ] },
        ],
      },
      {
        id: 'local',
        title: 'Site preferences (localStorage)',
        blocks: [
          { p: 'They are kept until you change them or clear the site data in your browser:' },
          { list: [
            'Language (Spanish or English).',
            'Display currency (GTQ or the USD reference).',
            'Location selected to browse the public catalog.',
          ] },
        ],
      },
      {
        id: 'pestanas',
        title: 'Communication between tabs',
        blocks: [
          { p: 'The site uses BroadcastChannel, a browser feature that connects tabs of the same site in the same browser. It lets a new tab receive an existing session and signs out all tabs at once. This information does not leave your browser through this channel, and the server always validates the session received.' },
        ],
      },
      {
        id: 'terceros',
        title: 'Third-party services',
        blocks: [
          { list: [
            'Stripe: the payment form is loaded from Stripe only at checkout. Stripe may use its own cookies and similar technologies, for example to prevent fraud. Those technologies are controlled by Stripe and governed by its privacy policy, not by this page.',
            'Google Fonts: typefaces are downloaded from Google servers, which receive technical connection data.',
            'Amazon Web Services: catalog images are served through temporary Amazon S3 links.',
          ] },
        ],
      },
      {
        id: 'control',
        title: 'How to control it',
        blocks: [
          { p: 'You can clear the site’s storage in your browser settings. Doing so signs you out and removes drafts and preferences, but does not change reservations or payments stored on the server.' },
        ],
      },
    ],
  },

  preguntas: {
    title: 'Frequently asked questions',
    description: 'Short answers about accounts, reservations, payments and cancellations at HOTEL HUNAHPÚ.',
    sections: [
      { id: 'real', title: 'Is this a real hotel?', blocks: [{ p: 'No. It is a university project that demonstrates a hotel-management system. Reservations and payments are for academic purposes and Stripe runs in test mode, without real charges.' }] },
      { id: 'cuenta', title: 'Do I need an account to book?', blocks: [{ p: 'Yes. You can browse the catalogs without signing in, but you need a customer account to book. The system keeps your search while you sign in or register.' }] },
      { id: 'disponibilidad', title: 'Does checking availability hold the room?', blocks: [{ p: 'No. Availability is checked again when the reservation is created. If someone else books first, the system will tell you.' }] },
      { id: 'confirmada', title: 'When is my room reservation confirmed?', blocks: [{ p: 'When approved payments cover the total, or when hotel staff confirm it. Until then it shows as “pending”.' }] },
      { id: 'estado-confirmado', title: 'My wellness appointment says “confirmed”. Is it paid?', blocks: [{ p: 'Not necessarily. For restaurant, activities, wellness and amenities, “confirmed” is an operational status. Payment status is shown in the cart and checkout.' }] },
      { id: 'moneda', title: 'Which currency do I pay in?', blocks: [{ p: 'In quetzales (GTQ). The dollar amount is a reference calculated at Q7.80 per US$1.00.' }] },
      { id: 'tarjeta', title: 'Do you store my card details?', blocks: [{ p: 'No. Card details are entered in Stripe’s form and do not pass through the project’s servers. Only the payment result and reference are stored.' }] },
      { id: 'cancelar', title: 'How do I cancel a reservation?', blocks: [{ p: 'Event quotations and reservations with no approved or processing payments can be cancelled from “My reservations”. For other reservations, ask the hotel to cancel them; authorized staff do it.' }] },
      { id: 'reembolso', title: 'Do I get an automatic refund if I cancel?', blocks: [{ p: 'No. Cancelling does not create a refund. Authorized staff review and record refunds, never above the amount paid. See the Reservation, cancellation and refund policy.' }] },
      { id: 'carrito', title: 'Why did my cart expire?', blocks: [{ p: 'The cart expires after 15 minutes. If it expires before payment is completed, start a new one and add your reservations again.' }] },
      { id: 'tarifa', title: 'Why does my reservation total differ from the current rate?', blocks: [{ p: 'The total is calculated with the rate in force when the reservation was created or when its dates or room changed. If the catalog rate changes later, the recorded amount is not recalculated.' }] },
      { id: 'pestanas', title: 'Why was I signed out in another tab?', blocks: [{ p: 'The session is shared between open tabs of the site in the same browser. Signing out in one signs out in all of them. The session also expires after one hour.' }] },
      { id: 'cuenta-datos', title: 'Can I change or delete my account?', blocks: [{ p: 'The platform does not offer these functions yet. You can request it through the contact details published on the site; requests are handled manually.' }] },
    ],
  },
};
