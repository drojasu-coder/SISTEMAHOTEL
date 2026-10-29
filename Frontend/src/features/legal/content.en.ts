import type { LegalDocuments } from './types';

/** Información pública basada en los servicios disponibles; decisiones internas en docs/pendientes-backend.md. */
export const legalEn: LegalDocuments = {
  "terminos": {
    "title": "Terms and conditions",
    "description": "Information about our services, your account and reservations with HOTEL HUNAHPÚ.",
    "sections": [
      {
        "id": "naturaleza",
        "title": "Welcome to HOTEL HUNAHPÚ",
        "blocks": [
          {
            "p": "At HOTEL HUNAHPÚ you can explore accommodation and services at our Antigua, Atitlán, Xela and Capital locations. Review the location, dates, times, capacity and amount before confirming a request."
          }
        ]
      },
      {
        "id": "alcance",
        "title": "Scope of these terms",
        "blocks": [
          {
            "p": "These terms complement our privacy, reservations, cancellations and refunds, and cookies and storage policies. They describe the options available on the website and do not limit your rights under applicable law."
          }
        ]
      },
      {
        "id": "cuentas",
        "title": "Your account and security",
        "blocks": [
          {
            "p": "You can browse our catalogues without signing in. To manage reservations, you need a customer account with your name and email address. Register with a password or use Google sign-in when available. A phone number is optional."
          },
          {
            "p": "Keep your contact details up to date through our support channels and do not share your credentials. Your session may expire for security reasons. Signing out also signs you out of other open website tabs in the same browser."
          }
        ]
      },
      {
        "id": "uso",
        "title": "Using the service",
        "blocks": [
          {
            "p": "Use your account to manage your own requests. Impersonation, accessing another person’s information, bypassing security controls and disrupting the website are not permitted."
          }
        ]
      },
      {
        "id": "reservas",
        "title": "Reservations and confirmations",
        "blocks": [
          {
            "list": [
              "Checking availability does not hold a room. Availability and capacity are checked when the reservation is created.",
              "Room reservations start as pending. An approved payment covering the full amount allows confirmation; authorised staff can also manage confirmation.",
              "For rooms, dining, activities, wellness and amenities, confirmation describes the reservation status; it does not itself prove that the reservation is paid. Also check the payment status and approved amount.",
              "Event requests are recorded as quotations and require hotel confirmation. A quotation does not hold the venue.",
              "Dates and times use Guatemala time."
            ]
          }
        ]
      },
      {
        "id": "precios-pagos",
        "title": "Prices, payments and receipts",
        "blocks": [
          {
            "list": [
              "Published prices are final and include applicable taxes. VAT and, for accommodation, INGUAT are already included and are not added to the amount again. The total for your selection is shown before you continue to payment.",
              "Payment amounts are in Guatemalan quetzales (GTQ). US dollar (USD) amounts are indicative, at Q7.80 per US$1.00; they do not change the transaction currency.",
              "Room reservations and carts containing rooms require full payment. Event deposits and balances are those shown in the quotation.",
              "Card payments are handled through Stripe.",
              "A recorded bank transfer remains pending until authorised staff approve it. Cash payments are recorded by staff.",
              "Do not repeat a payment that is processing or awaiting verification. Check its status before attempting another transaction.",
              "Downloadable receipts are internal payment records; they do not replace an FEL electronic tax invoice."
            ]
          },
          {
            "p": "A pending or processing payment does not yet prove that a reservation has been paid. An approved payment covers the recorded amount; it must cover the required total for your selection to be considered paid. If a payment appears declined or cancelled, check its current status and use only the available options, without repeating a transaction whose outcome remains unverified."
          }
        ]
      },
      {
        "id": "cancelaciones",
        "title": "Changes and cancellations",
        "blocks": [
          {
            "p": "“My reservations” shows the actions available for each service. The option to cancel a pending room reservation is offered when the reservation meets the cancellation conditions. It is unavailable if there are approved payments, payments awaiting verification or other associated payments requiring review. Confirmed reservations or those with associated payments may require hotel assistance. See the reservations policy for service-specific information."
          },
          {
            "p": "Cancelling a reservation does not automatically issue a refund. Contact the hotel with your reservation and payment reference to enquire about the conditions applicable to your request."
          }
        ]
      },
      {
        "id": "responsabilidades",
        "title": "Guest responsibilities",
        "blocks": [
          {
            "p": "Provide accurate information and review the location, dates, times and number of guests or participants before booking. Observe the capacity and published usage conditions for each room or service. Keep your reservation reference and contact the hotel about any changes you need; requesting a change does not guarantee availability."
          }
        ]
      },
      {
        "id": "atencion",
        "title": "Guest assistance",
        "blocks": [
          {
            "p": "For assistance, use the contact details published on your location’s page. Include the reservation or payment reference and the reason for your enquiry. Never send passwords or full card details. Check the status of your requests in your account; do not rely on an automatic confirmation email or message."
          }
        ]
      },
      {
        "id": "cambios",
        "title": "Updates and website availability",
        "blocks": [
          {
            "p": "The website may be interrupted by maintenance or technical issues. If a transaction does not show a clear result, check its status before repeating it. The date at the top of this page identifies the latest revision of these terms."
          }
        ]
      }
    ]
  },
  "privacidad": {
    "title": "Privacy policy",
    "description": "How the information you share with HOTEL HUNAHPÚ is used and protected.",
    "sections": [
      {
        "id": "responsable",
        "title": "Enquiries about your information",
        "blocks": [
          {
            "p": "For enquiries about your personal information, use the contact details on your HOTEL HUNAHPÚ location’s page. Explain what information you want to review or correct, without sending passwords or full card details."
          }
        ]
      },
      {
        "id": "datos",
        "title": "Information we retain",
        "blocks": [
          {
            "list": [
              "Account: name, email address, phone number if provided, sign-in method, account status, and registration and update dates. Passwords are stored using a cryptographic transformation, not as readable text.",
              "Reservations and services: location, selected room or resource, dates and times, guests or participants, selected options, status and applicable amounts. Amenity reservations may include a QR code.",
              "Payments: amount, currency, method, status, transaction reference and information needed to verify the transaction and prevent duplicates. Refund records retain the amount, reason and outcome.",
              "Billing: name, tax identification number (NIT) and billing address when included in a billing record.",
              "Staff: account, role, department, location, assignments and employment details needed to manage hotel operations."
            ]
          },
          {
            "p": "HOTEL HUNAHPÚ does not store full card numbers, expiry dates or security codes. Card fields are provided by Stripe’s payment form."
          }
        ]
      },
      {
        "id": "finalidades",
        "title": "How we use information",
        "blocks": [
          {
            "p": "We use information to provide account access, manage reservations and quotations, check payments, handle enquiries, retain transaction history and protect the service. The website does not include advertising or commercial tracking tools."
          }
        ]
      },
      {
        "id": "proveedores",
        "title": "Service providers",
        "blocks": [
          {
            "list": [
              "Stripe receives the amount, currency and transaction references needed to process card payments and return their status.",
              "Amazon Web Services provides catalogue image storage and delivery.",
              "Google Fonts provides website fonts and receives technical connection information when your browser downloads them.",
              "When enabled, Google sign-in loads its library on the sign-in and registration pages. Google receives technical connection information even before you select the button. If you use this option, we receive your Google identifier, name and verified email address to create or recognise your account. We do not request access to contacts or files, or your Google password; we do not retain your photograph. Linking an existing account requires your hotel password."
            ]
          }
        ]
      },
      {
        "id": "acceso",
        "title": "Access and protection",
        "blocks": [
          {
            "p": "Customers access their own information. Authorised staff have access according to their role and, where applicable, their location. The service checks permissions, limits sign-in attempts and uses expiring sessions. These measures reduce risks but cannot eliminate every possibility of an incident."
          }
        ]
      },
      {
        "id": "conservacion",
        "title": "Record retention",
        "blocks": [
          {
            "p": "Signing out or cancelling a reservation does not delete your account or history. Accounts, reservations and payments are not currently deleted automatically. Requests to review, correct or delete information must be assessed by the hotel, considering related records and applicable obligations; immediate deletion of all information is not guaranteed."
          },
          {
            "p": "Google sign-in credentials are temporarily verified; the Google token is not retained in the database or browser storage. The link between your account and your Google identifier is retained."
          }
        ]
      },
      {
        "id": "derechos",
        "title": "Managing your account",
        "blocks": [
          {
            "p": "You can view your information in “My account” and your bookings in “My reservations”. Contact the hotel to correct information, request account deletion or resolve access difficulties. The website does not currently offer self-service account editing or deletion, password recovery or Google unlinking. Signing out here does not sign you out of Google."
          }
        ]
      },
      {
        "id": "cambios",
        "title": "Policy updates",
        "blocks": [
          {
            "p": "The revision date is shown at the top of this page. See our cookies and storage policy for information retained in your browser."
          }
        ]
      }
    ]
  },
  "reservas": {
    "title": "Reservations, cancellations and refunds",
    "description": "Information about managing accommodation, service and event reservations.",
    "sections": [
      {
        "id": "principios",
        "title": "Reservation statuses",
        "blocks": [
          {
            "list": [
              "Pending: a room reservation has been recorded and awaits confirmation.",
              "Confirmed: describes the reservation status, including rooms; it does not itself prove payment. Check the payment status and approved amount separately.",
              "Quotation: an event request that does not yet hold the venue.",
              "Cancelled or expired: the reservation is no longer active and must not be paid. Its history is retained."
            ]
          }
        ]
      },
      {
        "id": "habitaciones",
        "title": "Rooms",
        "blocks": [
          {
            "p": "Choose a location, dates and guest count within the stated capacity. Availability is checked again when creating the reservation. The recorded amount is calculated using the rate applicable to your selection; later catalogue changes do not by themselves change that amount."
          },
          {
            "p": "You can request cancellation of a pending room reservation from your account when the option is available. The request requires checking that there are no approved payments, payments awaiting verification or other associated payments requiring review. A confirmed, paid reservation does not offer another payment or direct cancellation. Contact the hotel to request date or room changes, or cancellation of a confirmed reservation."
          },
          {
            "p": "If a payment is processing, its result is uncertain or it cannot yet be verified, the reservation remains protected. Select “Check status” and do not start a second payment. Where continuation is available, the existing attempt is reused. Completed stays cannot be paid online from the reservation details."
          }
        ]
      },
      {
        "id": "plazos",
        "title": "Reservation and cart deadlines",
        "blocks": [
          {
            "p": "The cart has an expiry time shown on screen. Opening it or reloading the page does not renew that time. If a reservation has an assigned payment deadline, that deadline remains in place when it moves to another cart. Cart expiry does not prove that a reservation was cancelled or that a payment failed."
          },
          {
            "p": "After expiry, check the reservation and any payment status. Continue only when the option is available and there is no payment awaiting verification. A reservation past its payment deadline cannot be paid; contact the hotel if you need assistance."
          }
        ]
      },
      {
        "id": "restaurante",
        "title": "Dining",
        "blocks": [
          {
            "p": "Choose a location, table, date, time and party size. The reservation is confirmed when table availability and capacity are validated. Booking a table does not initiate an online payment or mean that food and drinks are included."
          },
          {
            "p": "You can cancel your confirmed table reservation from your account before its scheduled date and time. Contact the hotel for other changes or if the scheduled time has arrived."
          }
        ]
      },
      {
        "id": "actividades",
        "title": "Activities and experiences",
        "blocks": [
          {
            "p": "Select an available resource, time and number of participants. The amount reflects the duration and selected services with a stated price. An instructor is offered only when options are available. Review the summary before booking; contact the hotel for changes or cancellations."
          }
        ]
      },
      {
        "id": "bienestar",
        "title": "Wellness",
        "blocks": [
          {
            "p": "Choose a service, therapist and appointment time at your selected location. Appointments depend on availability and service duration. “Confirmed” describes the appointment, not its payment. Where online payment applies, review the amount and payment status in your account. Contact the hotel for changes or cancellations."
          }
        ]
      },
      {
        "id": "amenidades",
        "title": "Amenities",
        "blocks": [
          {
            "p": "The reservation identifies the amenity, date, time slot and available options; it may include a QR code for managing access. The code does not prove payment. Review the usage information on the listing and contact the hotel for changes or cancellations."
          }
        ]
      },
      {
        "id": "eventos",
        "title": "Events and quotations",
        "blocks": [
          {
            "p": "An event request creates a quotation with the selected venue, time, guest count and services. It does not hold the venue or initiate an immediate charge. The hotel manages confirmation. Review the total, required deposit and quotation balance before paying."
          },
          {
            "p": "You can request cancellation from your account using the available option. The request is rejected when an associated payment prevents safe cancellation. If there are approved or processing payments, contact the hotel."
          }
        ]
      },
      {
        "id": "reembolsos",
        "title": "Refund requests",
        "blocks": [
          {
            "p": "Cancellation and refunding are separate operations. To request a refund, contact the location and provide the reservation and related payment reference. Authorised staff review requests; the website does not offer automatic refunds or establish a refund percentage or crediting deadline. This information does not limit your rights under applicable law."
          },
          {
            "p": "A recorded refund may be full or partial and cannot exceed the available approved amount. Check its result before considering the refund complete. Transactions in the current card form do not move real money; their records therefore do not represent an actual bank refund."
          }
        ]
      },
      {
        "id": "atencion",
        "title": "Reservation assistance",
        "blocks": [
          {
            "p": "Find the location’s contact details on its page and provide your reservation reference. Confirm with the hotel any arrival, departure or service conditions not shown in your selection. Do not share passwords or full card details."
          }
        ]
      }
    ]
  },
  "almacenamiento": {
    "title": "Cookies and browser storage",
    "description": "Information about preferences and the data needed to use the website.",
    "sections": [
      {
        "id": "resumen",
        "title": "How we use your browser",
        "blocks": [
          {
            "p": "The website does not set its own cookies or include analytics or advertising tools. It uses browser storage to maintain your session, retain requests in progress and remember your preferences. Some third-party services may use their own technologies."
          }
        ]
      },
      {
        "id": "session",
        "title": "Session and requests in progress",
        "blocks": [
          {
            "p": "Tab storage holds session information, search and reservation drafts, and payment attempt references. These help you continue after signing in or reloading and help prevent duplicate transactions. Staff location selections are also retained; those selections do not grant access permissions."
          },
          {
            "p": "These details are cleared when the tab closes or the corresponding function ends, as applicable. Your browser may restore a previous session; always sign out explicitly on shared devices."
          }
        ]
      },
      {
        "id": "local",
        "title": "Preferences",
        "blocks": [
          {
            "p": "Your language, display currency and selected location remain in your browser until you change them or clear website data. You can choose Spanish or English and view amounts in GTQ or indicative USD."
          }
        ]
      },
      {
        "id": "pestanas",
        "title": "Open tabs",
        "blocks": [
          {
            "p": "Website tabs can share your session within the same browser. Signing out in one tab signs you out in the others. Access to your information is always validated by the service."
          }
        ]
      },
      {
        "id": "terceros",
        "title": "Third-party services",
        "blocks": [
          {
            "list": [
              "Stripe loads the card form on the payment page and may use its own cookies or technologies for operation and fraud prevention.",
              "Google Fonts receives technical data when fonts are downloaded. If Google sign-in is enabled, sign-in pages load Google’s library and send technical connection data even before you select the button.",
              "Catalogue images are delivered through Amazon Web Services. Connections to providers transmit technical data needed to display content.",
              "Each provider’s technologies are subject to its own terms and privacy policies."
            ]
          }
        ]
      },
      {
        "id": "control",
        "title": "Managing browser data",
        "blocks": [
          {
            "p": "You can clear website data in your browser settings. Saved preferences and drafts will be lost, and you may need to sign in again. This does not cancel reservations, stop processing payments or delete hotel records. Check a transaction’s status in your account before repeating it."
          }
        ]
      }
    ]
  },
  "preguntas": {
    "title": "Frequently asked questions",
    "description": "Answers to help plan your stay and manage services with HOTEL HUNAHPÚ.",
    "sections": [
      {
        "id": "reservar-habitacion",
        "title": "How do I book a room?",
        "blocks": [
          {
            "p": "Search availability by location, dates and number of guests. Choose a room, review the stay and final price, and sign in with your customer account to complete the reservation. Then check its status in “My reservations” and review the available payment options."
          }
        ]
      },
      {
        "id": "disponibilidad",
        "title": "How do I check room availability?",
        "blocks": [
          {
            "p": "Under Rooms, choose a location, arrival and departure dates and the number of guests. View the available options for those criteria. Searching does not hold a room: availability is checked again when the reservation is created."
          }
        ]
      },
      {
        "id": "cuenta",
        "title": "Do I need an account to book?",
        "blocks": [
          {
            "p": "Yes. You can browse catalogues without signing in; managing reservations requires a customer account. Your search can be retained in the same tab while you sign in."
          }
        ]
      },
      {
        "id": "pagar",
        "title": "How can I pay?",
        "blocks": [
          {
            "p": "From the cart or the available options in your reservation details, review the total and continue to the payment screen. Rooms require full payment; events show the applicable deposit and balance. If a transaction remains in progress, check its status before continuing and do not create another payment for the same reservation."
          }
        ]
      },
      {
        "id": "mis-reservas",
        "title": "Where can I find my reservations?",
        "blocks": [
          {
            "p": "Sign in and open “My reservations”. Choose the relevant category and open a reservation to view its details, dates, status and available actions. You can check this information in your account without waiting for an automatic confirmation email."
          }
        ]
      },
      {
        "id": "cancelar",
        "title": "Can I cancel a reservation?",
        "blocks": [
          {
            "p": "In “My reservations”, open the details and check whether cancellation is available. It is permitted for eligible pending rooms without approved or uncertain payments or other payments requiring review; for confirmed tables before their scheduled time; and for events that meet the stated conditions. A payment awaiting verification may prevent cancellation. Contact the hotel for other cases."
          }
        ]
      },
      {
        "id": "servicios",
        "title": "How do I book activities?",
        "blocks": [
          {
            "p": "Open Activities, choose a location and experience, and select the date, time and number of participants. Complete the available options and review the summary and amount before booking. Contact the hotel to change or cancel an activity reservation."
          }
        ]
      },
      {
        "id": "bienestar",
        "title": "How do I book wellness services?",
        "blocks": [
          {
            "p": "Under Wellness, select a location, service, and an available therapist and time. Review the duration and summary before confirming your appointment. You can view it in the wellness section of “My reservations”. Contact the hotel for changes or cancellations."
          }
        ]
      },
      {
        "id": "mesa",
        "title": "How do I book a table?",
        "blocks": [
          {
            "p": "Under Dining, select a location, table, date, time and party size. Sign in and confirm when availability permits your group. Booking a table does not initiate an online payment or include food and drinks. View the details in the dining section of “My reservations”."
          }
        ]
      },
      {
        "id": "evento",
        "title": "How do I request an event?",
        "blocks": [
          {
            "p": "Under Events, choose a venue and enter the date, time, event type, guest count and any services you need from the available options. Review the amount and submit a quotation request. Follow its status in “My reservations”: a quotation does not hold the venue or initiate an immediate charge and requires hotel confirmation."
          }
        ]
      },
      {
        "id": "consultar-servicios",
        "title": "How do I view my booked services?",
        "blocks": [
          {
            "p": "In “My reservations”, browse the dining, activities, wellness, amenities and events categories. Open each record to view the service, location, dates and status. Available actions depend on the service and reservation status; contact the hotel if the change you need is not available."
          }
        ]
      },
      {
        "id": "atencion",
        "title": "How do I contact the hotel?",
        "blocks": [
          {
            "p": "On each location’s page. Include your reservation or payment reference to help with your enquiry. Ask the hotel directly about arrival and departure times or other conditions that are not stated."
          }
        ]
      },
      {
        "id": "confirmada",
        "title": "When is my room confirmed?",
        "blocks": [
          {
            "p": "A reservation starts as pending. It is confirmed when approved payments cover the full amount or authorised staff manage its confirmation. Check the status in “My reservations”."
          }
        ]
      },
      {
        "id": "estado-confirmado",
        "title": "My reservation says “confirmed”. Is it paid?",
        "blocks": [
          {
            "p": "Not necessarily. Authorised staff can confirm a room reservation, and for dining, activities, wellness and amenities, confirmation describes the service reservation. Check the payment status and approved amount separately; the reservation status does not replace proof of payment."
          }
        ]
      },
      {
        "id": "moneda",
        "title": "Do prices include taxes, and what currency is used?",
        "blocks": [
          {
            "p": "Published prices are final: they include VAT and, for accommodation, INGUAT, without adding these taxes to the amount again. Payments are in Guatemalan quetzales (GTQ); USD is an indicative display amount at Q7.80 per US$1.00."
          }
        ]
      },
      {
        "id": "tarjeta",
        "title": "How does the card form work?",
        "blocks": [
          {
            "p": "Stripe provides the card fields and HOTEL HUNAHPÚ retains the transaction reference and result, not full card details."
          }
        ]
      },
      {
        "id": "pago-incierto",
        "title": "What if my payment is still processing?",
        "blocks": [
          {
            "p": "Select “Check status”. Do not repeat the payment or create another transaction for the same reservation. If the result cannot be verified, the reservation remains protected and you can ask the hotel for help."
          }
        ]
      },
      {
        "id": "reembolso",
        "title": "Does cancellation automatically issue a refund?",
        "blocks": [
          {
            "p": "No. Ask the hotel to review your request and provide your reservation and payment reference. Cancellation alone does not establish a refund amount or deadline."
          }
        ]
      },
      {
        "id": "carrito",
        "title": "What happens if the cart expires?",
        "blocks": [
          {
            "p": "The expiry time is shown on screen and is not renewed by reloading. Check the reservation and payment status first. A reservation deadline, where assigned, is not extended by changing carts; do not repeat an uncertain payment."
          }
        ]
      },
      {
        "id": "cuenta-datos",
        "title": "How do I update my details or resolve an access problem?",
        "blocks": [
          {
            "p": "View “My account” and contact the hotel to request corrections or assistance. Self-service password recovery, account deletion and Google unlinking are not available. Never send your password when requesting support."
          }
        ]
      }
    ]
  }
};
