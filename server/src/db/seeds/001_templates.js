/**
 * Seed: 001_templates
 * Creates 9 industry templates with hierarchical Business Catalog,
 * menus, and forms. Each template works immediately after apply.
 *
 * Services are now organized as a TREE:
 *   Category → Subcategory (optional) → Leaf Service
 *
 * Leaf services have price, duration, and configurable buttons.
 * Menu includes a `catalog_entry` node that links to the catalog root.
 */

const DEFAULT_BOOKING_BUTTON = { label: '📝 Book Now', type: 'booking', config: {} };
const DEFAULT_BACK_BUTTON = { label: '⬅️ Back', type: 'back', config: {} };
const DEFAULT_BUTTONS = [DEFAULT_BOOKING_BUTTON, DEFAULT_BACK_BUTTON];

exports.seed = async function (knex) {
  await knex('template_data').del();
  await knex('templates').del();

  // ═══════════════════════════════════════════════════
  // 1. BEAUTY SALON
  // ═══════════════════════════════════════════════════
  const [salon] = await knex('templates')
    .insert({
      industry_type: 'beauty_salon',
      name: 'Beauty Salon',
      description: 'Hair styling, coloring, nails, and beauty treatments. Includes booking, inquiry, and pricing flows.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: salon.id,
    data: JSON.stringify({
      services: [
        // Categories
        { id: 'cat-s-hair', name: 'Hair Services', description: 'Cuts, coloring, and styling', parent_id: null, sort_order: 0 },
        { id: 'cat-s-nails', name: 'Nail Services', description: 'Manicure, pedicure, and extensions', parent_id: null, sort_order: 1 },
        { id: 'cat-s-other', name: 'Other Services', description: 'Beauty treatments and packages', parent_id: null, sort_order: 2 },
        // Leaf services
        { id: 'svc-s1', name: 'Haircut - Women', description: 'Wash, cut, and blow-dry for women', price: 35, duration: '45 min', parent_id: 'cat-s-hair', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s2', name: 'Haircut - Men', description: "Classic men's cut and styling", price: 20, duration: '30 min', parent_id: 'cat-s-hair', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s3', name: 'Hair Coloring - Full', description: 'Full head single-process color', price: 80, duration: '120 min', parent_id: 'cat-s-hair', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s4', name: 'Highlights / Balayage', description: 'Partial or full highlights', price: 120, duration: '150 min', parent_id: 'cat-s-hair', sort_order: 3, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s5', name: 'Gel Nail Extension', description: 'Full set gel nail extensions', price: 45, duration: '60 min', parent_id: 'cat-s-nails', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s6', name: 'Manicure', description: 'Nail shaping, cuticle care, and polish', price: 20, duration: '30 min', parent_id: 'cat-s-nails', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s7', name: 'Pedicure', description: 'Foot soak, exfoliation, and polish', price: 25, duration: '40 min', parent_id: 'cat-s-nails', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s8', name: 'Eyebrow Shaping', description: 'Wax or thread eyebrow shaping', price: 12, duration: '15 min', parent_id: 'cat-s-other', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-s9', name: 'Bridal Package', description: 'Hair, makeup, nails for bride', price: 250, duration: '180 min', parent_id: 'cat-s-other', sort_order: 1, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-s1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-s2', parent_id: 'n-s1', node_type: 'flow_entry', label: 'Book Appointment', sort_order: 0, flow_id: 'f-s1' },
        { id: 'n-s3', parent_id: 'n-s1', node_type: 'catalog_entry', label: 'Our Services & Prices', sort_order: 1, catalog_node_id: null },
        { id: 'n-s12', parent_id: 'n-s1', node_type: 'flow_entry', label: 'Ask a Question', sort_order: 2, flow_id: 'f-s2' },
        { id: 'n-s13', parent_id: 'n-s1', node_type: 'action', label: 'Contact Us', sort_order: 3, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-s1',
          name: 'Booking Form',
          description: 'Book an appointment at the salon',
          steps: [
            { step_order: 1, type: 'select_service', label: 'Which service would you like?' },
            { step_order: 2, type: 'text_input', label: 'Your full name' },
            { step_order: 3, type: 'text_input', label: 'Phone number' },
            { step_order: 4, type: 'select_date', label: 'Preferred date' },
            { step_order: 5, type: 'select_time', label: 'Preferred time' },
            { step_order: 6, type: 'summary', label: 'Review your booking' },
            { step_order: 7, type: 'confirm', label: 'Confirm booking' },
          ],
        },
        {
          id: 'f-s2',
          name: 'Inquiry Form',
          description: 'General question or custom request',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'What would you like to know?' },
            { step_order: 3, type: 'confirm', label: 'Send inquiry' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 2. CLINIC
  // ═══════════════════════════════════════════════════
  const [clinic] = await knex('templates')
    .insert({
      industry_type: 'clinic',
      name: 'Medical Clinic',
      description: 'General practice and specialist clinics. Appointment booking, lab tests, and patient inquiries.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: clinic.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-c-consult', name: 'Consultations', description: 'Doctor visits and follow-ups', parent_id: null, sort_order: 0 },
        { id: 'cat-c-tests', name: 'Tests & Procedures', description: 'Lab tests and vaccinations', parent_id: null, sort_order: 1 },
        { id: 'svc-c1', name: 'General Consultation', description: 'Initial doctor visit and diagnosis', price: 50, duration: '30 min', parent_id: 'cat-c-consult', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-c2', name: 'Follow-up Visit', description: 'Follow-up after treatment or test results', price: 30, duration: '20 min', parent_id: 'cat-c-consult', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-c6', name: 'Annual Check-up', description: 'Full physical exam with lab work', price: 120, duration: '60 min', parent_id: 'cat-c-consult', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-c5', name: 'Specialist Referral', description: 'Referral letter and coordination with specialist', price: 40, duration: '20 min', parent_id: 'cat-c-consult', sort_order: 3, buttons: DEFAULT_BUTTONS },
        { id: 'svc-c7', name: 'Prescription Renewal', description: 'Renew existing medication prescription', price: 20, duration: '10 min', parent_id: 'cat-c-consult', sort_order: 4, buttons: DEFAULT_BUTTONS },
        { id: 'svc-c3', name: 'Blood Test Panel', description: 'Complete blood count and basic metabolic panel', price: 45, duration: '15 min', parent_id: 'cat-c-tests', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-c4', name: 'Vaccination', description: 'Standard adult or child vaccination', price: 25, duration: '10 min', parent_id: 'cat-c-tests', sort_order: 1, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-c1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-c2', parent_id: 'n-c1', node_type: 'flow_entry', label: 'Book Appointment', sort_order: 0, flow_id: 'f-c1' },
        { id: 'n-c3', parent_id: 'n-c1', node_type: 'catalog_entry', label: 'Our Services', sort_order: 1, catalog_node_id: null },
        { id: 'n-c10', parent_id: 'n-c1', node_type: 'flow_entry', label: 'Request Lab Results', sort_order: 2, flow_id: 'f-c2' },
        { id: 'n-c11', parent_id: 'n-c1', node_type: 'flow_entry', label: 'Ask a Question', sort_order: 3, flow_id: 'f-c3' },
        { id: 'n-c12', parent_id: 'n-c1', node_type: 'action', label: 'Contact Clinic', sort_order: 4, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-c1', name: 'Appointment Booking', description: 'Schedule a clinic appointment',
          steps: [
            { step_order: 1, type: 'select_service', label: 'Type of visit' },
            { step_order: 2, type: 'text_input', label: 'Patient full name' },
            { step_order: 3, type: 'number_input', label: 'Patient age' },
            { step_order: 4, type: 'select_date', label: 'Preferred date' },
            { step_order: 5, type: 'select_time', label: 'Preferred time' },
            { step_order: 6, type: 'summary', label: 'Review appointment' },
            { step_order: 7, type: 'confirm', label: 'Confirm appointment' },
          ],
        },
        {
          id: 'f-c2', name: 'Lab Results Request', description: 'Request lab test results',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Patient full name' },
            { step_order: 2, type: 'text_input', label: 'Date of birth' },
            { step_order: 3, type: 'text_input', label: 'Which test results do you need?' },
            { step_order: 4, type: 'confirm', label: 'Submit request' },
          ],
        },
        {
          id: 'f-c3', name: 'Patient Inquiry', description: 'General medical question',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'Describe your question or concern' },
            { step_order: 3, type: 'confirm', label: 'Send inquiry' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 3. SPA
  // ═══════════════════════════════════════════════════
  const [spa] = await knex('templates')
    .insert({
      industry_type: 'spa',
      name: 'Spa & Wellness',
      description: 'Massage, facials, body treatments, and wellness packages. Booking, pricing, and special requests.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: spa.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-sp-massage', name: 'Massage Therapy', description: 'Relaxation and therapeutic massage', parent_id: null, sort_order: 0 },
        { id: 'cat-sp-face', name: 'Facial Treatments', description: 'Skincare and anti-aging treatments', parent_id: null, sort_order: 1 },
        { id: 'cat-sp-body', name: 'Body & Packages', description: 'Body treatments and spa packages', parent_id: null, sort_order: 2 },
        { id: 'svc-sp1', name: 'Swedish Massage (60 min)', description: 'Full-body relaxation massage', price: 80, duration: '60 min', parent_id: 'cat-sp-massage', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp2', name: 'Deep Tissue Massage (60 min)', description: 'Focused pressure on tension areas', price: 95, duration: '60 min', parent_id: 'cat-sp-massage', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp3', name: 'Hot Stone Massage', description: 'Heated stones for deep muscle relief', price: 110, duration: '75 min', parent_id: 'cat-sp-massage', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp7', name: 'Couples Massage', description: 'Side-by-side relaxation for two', price: 160, duration: '60 min', parent_id: 'cat-sp-massage', sort_order: 3, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp4', name: 'Classic Facial', description: 'Cleansing, exfoliation, and hydration', price: 65, duration: '50 min', parent_id: 'cat-sp-face', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp5', name: 'Anti-Aging Facial', description: 'Collagen boost with premium serums', price: 90, duration: '60 min', parent_id: 'cat-sp-face', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp6', name: 'Body Scrub & Wrap', description: 'Full body exfoliation and detox wrap', price: 100, duration: '75 min', parent_id: 'cat-sp-body', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sp8', name: 'Half-Day Retreat', description: 'Massage + facial + light meal', price: 200, duration: '180 min', parent_id: 'cat-sp-body', sort_order: 1, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-sp1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-sp2', parent_id: 'n-sp1', node_type: 'flow_entry', label: 'Book a Session', sort_order: 0, flow_id: 'f-sp1' },
        { id: 'n-sp3', parent_id: 'n-sp1', node_type: 'catalog_entry', label: 'Treatments & Prices', sort_order: 1, catalog_node_id: null },
        { id: 'n-sp12', parent_id: 'n-sp1', node_type: 'flow_entry', label: 'Special Request', sort_order: 2, flow_id: 'f-sp2' },
        { id: 'n-sp13', parent_id: 'n-sp1', node_type: 'action', label: 'Contact Us', sort_order: 3, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-sp1', name: 'Session Booking', description: 'Book a spa treatment',
          steps: [
            { step_order: 1, type: 'select_service', label: 'Which treatment?' },
            { step_order: 2, type: 'text_input', label: 'Your full name' },
            { step_order: 3, type: 'text_input', label: 'Phone number' },
            { step_order: 4, type: 'select_date', label: 'Preferred date' },
            { step_order: 5, type: 'select_time', label: 'Preferred time' },
            { step_order: 6, type: 'summary', label: 'Review booking' },
            { step_order: 7, type: 'confirm', label: 'Confirm booking' },
          ],
        },
        {
          id: 'f-sp2', name: 'Special Request', description: 'Custom treatment or group inquiry',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'number_input', label: 'Number of guests' },
            { step_order: 3, type: 'text_input', label: 'Describe your request' },
            { step_order: 4, type: 'confirm', label: 'Send request' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 4. RESTAURANT
  // ═══════════════════════════════════════════════════
  const [restaurant] = await knex('templates')
    .insert({
      industry_type: 'restaurant',
      name: 'Restaurant & Cafe',
      description: 'Table reservations, catering orders, and private events. Includes reservation and event inquiry forms.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: restaurant.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-r-dine', name: 'Dine-In', description: 'Table reservations and private dining', parent_id: null, sort_order: 0 },
        { id: 'cat-r-events', name: 'Events & Catering', description: 'Private events and catering services', parent_id: null, sort_order: 1 },
        { id: 'svc-r1', name: 'Table Reservation (1-4)', description: 'Standard table for up to 4 guests', price: null, duration: null, parent_id: 'cat-r-dine', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-r2', name: 'Table Reservation (5-8)', description: 'Large table for 5-8 guests', price: null, duration: null, parent_id: 'cat-r-dine', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-r3', name: 'Private Dining Room', description: 'Exclusive room for up to 20 guests', price: 200, duration: null, parent_id: 'cat-r-dine', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-r4', name: 'Catering - Small (10-25 ppl)', description: 'Catering service for small events', price: 300, duration: null, parent_id: 'cat-r-events', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-r5', name: 'Catering - Large (25-50 ppl)', description: 'Full catering for medium events', price: 600, duration: null, parent_id: 'cat-r-events', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-r6', name: 'Birthday Package', description: 'Cake, decorations, and reserved area', price: 150, duration: null, parent_id: 'cat-r-events', sort_order: 2, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-r1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-r2', parent_id: 'n-r1', node_type: 'flow_entry', label: 'Reserve a Table', sort_order: 0, flow_id: 'f-r1' },
        { id: 'n-r3', parent_id: 'n-r1', node_type: 'catalog_entry', label: 'Our Offerings', sort_order: 1, catalog_node_id: null },
        { id: 'n-r7', parent_id: 'n-r1', node_type: 'flow_entry', label: 'Plan an Event', sort_order: 2, flow_id: 'f-r2' },
        { id: 'n-r8', parent_id: 'n-r1', node_type: 'flow_entry', label: 'Ask a Question', sort_order: 3, flow_id: 'f-r3' },
        { id: 'n-r9', parent_id: 'n-r1', node_type: 'action', label: 'Call Us / Directions', sort_order: 4, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-r1', name: 'Table Reservation', description: 'Reserve a table at the restaurant',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Name for reservation' },
            { step_order: 2, type: 'number_input', label: 'Number of guests' },
            { step_order: 3, type: 'select_date', label: 'Date' },
            { step_order: 4, type: 'select_time', label: 'Time' },
            { step_order: 5, type: 'text_input', label: 'Special requests (allergies, seating preference)' },
            { step_order: 6, type: 'summary', label: 'Review reservation' },
            { step_order: 7, type: 'confirm', label: 'Confirm reservation' },
          ],
        },
        {
          id: 'f-r2', name: 'Event Inquiry', description: 'Plan a private event or catering',
          steps: [
            { step_order: 1, type: 'select_service', label: 'Type of event' },
            { step_order: 2, type: 'text_input', label: 'Contact name' },
            { step_order: 3, type: 'number_input', label: 'Expected number of guests' },
            { step_order: 4, type: 'select_date', label: 'Event date' },
            { step_order: 5, type: 'text_input', label: 'Additional details' },
            { step_order: 6, type: 'confirm', label: 'Submit inquiry' },
          ],
        },
        {
          id: 'f-r3', name: 'General Inquiry', description: 'Ask about menu, hours, or anything else',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'Your question' },
            { step_order: 3, type: 'confirm', label: 'Send' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 5. SPORT SALON / FITNESS
  // ═══════════════════════════════════════════════════
  const [sport] = await knex('templates')
    .insert({
      industry_type: 'sport_salon',
      name: 'Sport & Fitness',
      description: 'Gym memberships, personal training, group classes, and wellness sessions. Booking and trial class forms.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: sport.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-sf-training', name: 'Personal Training', description: 'One-on-one training sessions', parent_id: null, sort_order: 0 },
        { id: 'cat-sf-classes', name: 'Group Classes', description: 'Yoga, HIIT, spinning and more', parent_id: null, sort_order: 1 },
        { id: 'cat-sf-membership', name: 'Memberships & Other', description: 'Gym access and assessments', parent_id: null, sort_order: 2 },
        { id: 'svc-sf1', name: 'Personal Training (1 session)', description: 'One-on-one session with a trainer', price: 60, duration: '60 min', parent_id: 'cat-sf-training', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf2', name: 'Personal Training (10 pack)', description: '10-session package with trainer', price: 500, duration: '60 min each', parent_id: 'cat-sf-training', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf3', name: 'Group Class - Yoga', description: 'Group yoga session (max 15)', price: 15, duration: '60 min', parent_id: 'cat-sf-classes', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf4', name: 'Group Class - HIIT', description: 'High-intensity interval training', price: 15, duration: '45 min', parent_id: 'cat-sf-classes', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf5', name: 'Group Class - Spinning', description: 'Indoor cycling class', price: 15, duration: '45 min', parent_id: 'cat-sf-classes', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf6', name: 'Monthly Membership', description: 'Full gym access for one month', price: 50, duration: '30 days', parent_id: 'cat-sf-membership', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf7', name: 'Free Trial Class', description: 'Try any group class for free', price: null, duration: '60 min', parent_id: 'cat-sf-membership', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-sf8', name: 'Body Composition Analysis', description: 'InBody scan and consultation', price: 25, duration: '20 min', parent_id: 'cat-sf-membership', sort_order: 2, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-sf1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-sf2', parent_id: 'n-sf1', node_type: 'flow_entry', label: 'Book a Session', sort_order: 0, flow_id: 'f-sf1' },
        { id: 'n-sf3', parent_id: 'n-sf1', node_type: 'catalog_entry', label: 'Classes & Pricing', sort_order: 1, catalog_node_id: null },
        { id: 'n-sf8', parent_id: 'n-sf1', node_type: 'flow_entry', label: 'Book Free Trial', sort_order: 2, flow_id: 'f-sf2' },
        { id: 'n-sf9', parent_id: 'n-sf1', node_type: 'flow_entry', label: 'Ask a Question', sort_order: 3, flow_id: 'f-sf3' },
        { id: 'n-sf10', parent_id: 'n-sf1', node_type: 'action', label: 'Contact Us', sort_order: 4, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-sf1', name: 'Session Booking', description: 'Book a training session or class',
          steps: [
            { step_order: 1, type: 'select_service', label: 'What would you like to book?' },
            { step_order: 2, type: 'text_input', label: 'Your full name' },
            { step_order: 3, type: 'text_input', label: 'Phone number' },
            { step_order: 4, type: 'select_date', label: 'Preferred date' },
            { step_order: 5, type: 'select_time', label: 'Preferred time' },
            { step_order: 6, type: 'summary', label: 'Review booking' },
            { step_order: 7, type: 'confirm', label: 'Confirm booking' },
          ],
        },
        {
          id: 'f-sf2', name: 'Free Trial Signup', description: 'Sign up for a free trial class',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your full name' },
            { step_order: 2, type: 'text_input', label: 'Phone number' },
            { step_order: 3, type: 'select_option', label: 'Which class? (Yoga / HIIT / Spinning)', config: '{"options":["Yoga","HIIT","Spinning"]}' },
            { step_order: 4, type: 'select_date', label: 'Preferred date' },
            { step_order: 5, type: 'confirm', label: 'Sign up' },
          ],
        },
        {
          id: 'f-sf3', name: 'General Inquiry', description: 'Ask about memberships, schedules, etc.',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'Your question' },
            { step_order: 3, type: 'confirm', label: 'Send' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 6. REAL ESTATE
  // ═══════════════════════════════════════════════════
  const [realestate] = await knex('templates')
    .insert({
      industry_type: 'real_estate',
      name: 'Real Estate Agency',
      description: 'Property viewings, appraisals, and tenant inquiries. Viewing request and property inquiry forms.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: realestate.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-re-buy', name: 'Buying & Renting', description: 'Property viewings and applications', parent_id: null, sort_order: 0 },
        { id: 'cat-re-sell', name: 'Selling & Leasing', description: 'List and manage your property', parent_id: null, sort_order: 1 },
        { id: 'svc-re1', name: 'Property Viewing', description: 'Tour a listed property in person', price: null, duration: '30 min', parent_id: 'cat-re-buy', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-re3', name: 'Rental Application', description: 'Submit a rental application', price: null, duration: null, parent_id: 'cat-re-buy', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-re6', name: 'Consultation', description: 'General real estate advice', price: null, duration: '30 min', parent_id: 'cat-re-buy', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-re2', name: 'Free Market Appraisal', description: 'Get your property valued by an expert', price: null, duration: '45 min', parent_id: 'cat-re-sell', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-re4', name: 'Sell My Property', description: 'List your property for sale with us', price: null, duration: null, parent_id: 'cat-re-sell', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-re5', name: 'Property Management', description: 'Ongoing management for landlords', price: null, duration: null, parent_id: 'cat-re-sell', sort_order: 2, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-re1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-re2', parent_id: 'n-re1', node_type: 'flow_entry', label: 'Request a Viewing', sort_order: 0, flow_id: 'f-re1' },
        { id: 'n-re3', parent_id: 'n-re1', node_type: 'catalog_entry', label: 'Our Services', sort_order: 1, catalog_node_id: null },
        { id: 'n-re6', parent_id: 'n-re1', node_type: 'flow_entry', label: 'Request Free Appraisal', sort_order: 2, flow_id: 'f-re3' },
        { id: 'n-re4', parent_id: 'n-re1', node_type: 'flow_entry', label: 'Property Inquiry', sort_order: 3, flow_id: 'f-re2' },
        { id: 'n-re11', parent_id: 'n-re1', node_type: 'action', label: 'Contact Agent', sort_order: 4, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-re1', name: 'Viewing Request', description: 'Schedule a property viewing',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your full name' },
            { step_order: 2, type: 'text_input', label: 'Phone number' },
            { step_order: 3, type: 'text_input', label: 'Which property or area are you interested in?' },
            { step_order: 4, type: 'select_option', label: 'Budget range', config: '{"options":["Under $200K","$200K-$400K","$400K-$700K","$700K+"]}' },
            { step_order: 5, type: 'select_date', label: 'Preferred viewing date' },
            { step_order: 6, type: 'select_time', label: 'Preferred time' },
            { step_order: 7, type: 'confirm', label: 'Request viewing' },
          ],
        },
        {
          id: 'f-re2', name: 'Property Inquiry', description: 'Ask about a specific property',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'Property address or listing reference' },
            { step_order: 3, type: 'text_input', label: 'Your question' },
            { step_order: 4, type: 'confirm', label: 'Send inquiry' },
          ],
        },
        {
          id: 'f-re3', name: 'Free Appraisal Request', description: 'Get your property valued',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Owner full name' },
            { step_order: 2, type: 'text_input', label: 'Property address' },
            { step_order: 3, type: 'select_option', label: 'Property type', config: '{"options":["House","Apartment","Townhouse","Land","Commercial"]}' },
            { step_order: 4, type: 'text_input', label: 'Phone number' },
            { step_order: 5, type: 'select_date', label: 'Preferred appraisal date' },
            { step_order: 6, type: 'confirm', label: 'Request appraisal' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 7. CAR RENTAL
  // ═══════════════════════════════════════════════════
  const [carrental] = await knex('templates')
    .insert({
      industry_type: 'car_rental',
      name: 'Car Rental',
      description: 'Vehicle rentals by category, airport pickup, and long-term leases. Booking and quote request forms.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: carrental.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-cr-daily', name: 'Daily Rentals', description: 'Rent a car by the day', parent_id: null, sort_order: 0 },
        { id: 'cat-cr-weekly', name: 'Weekly & Add-ons', description: 'Weekly rates and extras', parent_id: null, sort_order: 1 },
        { id: 'svc-cr1', name: 'Economy Car', description: 'Compact car for city driving', price: 35, duration: '1 day', parent_id: 'cat-cr-daily', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr2', name: 'Sedan', description: 'Mid-size sedan for comfort', price: 50, duration: '1 day', parent_id: 'cat-cr-daily', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr3', name: 'SUV', description: 'Spacious SUV for families or trips', price: 75, duration: '1 day', parent_id: 'cat-cr-daily', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr4', name: 'Luxury Car', description: 'Premium vehicle for special occasions', price: 120, duration: '1 day', parent_id: 'cat-cr-daily', sort_order: 3, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr5', name: 'Van / Minibus', description: '7-12 seater for groups', price: 90, duration: '1 day', parent_id: 'cat-cr-daily', sort_order: 4, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr6', name: 'Weekly Rate - Economy', description: 'Economy car for 7 days', price: 200, duration: '7 days', parent_id: 'cat-cr-weekly', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr7', name: 'Weekly Rate - SUV', description: 'SUV for 7 days', price: 420, duration: '7 days', parent_id: 'cat-cr-weekly', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-cr8', name: 'Airport Pickup Add-on', description: 'Vehicle delivered to airport terminal', price: 25, duration: null, parent_id: 'cat-cr-weekly', sort_order: 2, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-cr1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-cr2', parent_id: 'n-cr1', node_type: 'flow_entry', label: 'Rent a Car', sort_order: 0, flow_id: 'f-cr1' },
        { id: 'n-cr3', parent_id: 'n-cr1', node_type: 'catalog_entry', label: 'Vehicles & Rates', sort_order: 1, catalog_node_id: null },
        { id: 'n-cr10', parent_id: 'n-cr1', node_type: 'flow_entry', label: 'Get a Quote', sort_order: 2, flow_id: 'f-cr2' },
        { id: 'n-cr11', parent_id: 'n-cr1', node_type: 'action', label: 'Contact Us', sort_order: 3, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-cr1', name: 'Car Reservation', description: 'Book a rental vehicle',
          steps: [
            { step_order: 1, type: 'select_service', label: 'Vehicle type' },
            { step_order: 2, type: 'text_input', label: 'Full name (as on license)' },
            { step_order: 3, type: 'text_input', label: 'Phone number' },
            { step_order: 4, type: 'select_date', label: 'Pick-up date' },
            { step_order: 5, type: 'select_date', label: 'Return date' },
            { step_order: 6, type: 'select_option', label: 'Pick-up location', config: '{"options":["Main Office","Airport Terminal","Hotel Delivery"]}' },
            { step_order: 7, type: 'summary', label: 'Review reservation' },
            { step_order: 8, type: 'confirm', label: 'Confirm reservation' },
          ],
        },
        {
          id: 'f-cr2', name: 'Quote Request', description: 'Get a custom quote for longer rentals',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'What vehicle type and duration?' },
            { step_order: 3, type: 'text_input', label: 'Any special requirements?' },
            { step_order: 4, type: 'confirm', label: 'Request quote' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 8. DRIVING SCHOOL
  // ═══════════════════════════════════════════════════
  const [driving] = await knex('templates')
    .insert({
      industry_type: 'driving_school',
      name: 'Driving School',
      description: 'Driving lessons, theory classes, license test prep, and packages. Enrollment and lesson booking forms.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: driving.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-d-lessons', name: 'Driving Lessons', description: 'Individual and packaged lessons', parent_id: null, sort_order: 0 },
        { id: 'cat-d-courses', name: 'Courses & Tests', description: 'Theory, mock tests, and refreshers', parent_id: null, sort_order: 1 },
        { id: 'svc-d1', name: 'Single Driving Lesson', description: 'One 60-minute practical lesson', price: 45, duration: '60 min', parent_id: 'cat-d-lessons', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-d2', name: '10-Lesson Package', description: '10 practical lessons (save 10%)', price: 400, duration: '60 min each', parent_id: 'cat-d-lessons', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-d3', name: '20-Lesson Package', description: '20 practical lessons (save 15%)', price: 750, duration: '60 min each', parent_id: 'cat-d-lessons', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-d7', name: 'Highway Driving Add-on', description: 'Highway and motorway practice', price: 55, duration: '60 min', parent_id: 'cat-d-lessons', sort_order: 3, buttons: DEFAULT_BUTTONS },
        { id: 'svc-d4', name: 'Theory Course', description: '8-hour theory preparation course', price: 120, duration: '8 hrs (2 days)', parent_id: 'cat-d-courses', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-d5', name: 'Mock Driving Test', description: 'Full simulation of the driving test', price: 60, duration: '60 min', parent_id: 'cat-d-courses', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-d6', name: 'Refresher Course (3 lessons)', description: 'For licensed drivers who need practice', price: 120, duration: '60 min each', parent_id: 'cat-d-courses', sort_order: 2, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-d1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-d2', parent_id: 'n-d1', node_type: 'flow_entry', label: 'Enroll / Book Lessons', sort_order: 0, flow_id: 'f-d1' },
        { id: 'n-d3', parent_id: 'n-d1', node_type: 'catalog_entry', label: 'Courses & Pricing', sort_order: 1, catalog_node_id: null },
        { id: 'n-d9', parent_id: 'n-d1', node_type: 'flow_entry', label: 'Ask a Question', sort_order: 2, flow_id: 'f-d2' },
        { id: 'n-d10', parent_id: 'n-d1', node_type: 'action', label: 'Contact Us', sort_order: 3, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-d1', name: 'Enrollment Form', description: 'Sign up for driving lessons or a package',
          steps: [
            { step_order: 1, type: 'select_service', label: 'What would you like?' },
            { step_order: 2, type: 'text_input', label: 'Student full name' },
            { step_order: 3, type: 'number_input', label: 'Age' },
            { step_order: 4, type: 'text_input', label: 'Phone number' },
            { step_order: 5, type: 'select_option', label: 'Do you have a learner permit?', config: '{"options":["Yes","No, I need one"]}' },
            { step_order: 6, type: 'select_date', label: 'Preferred start date' },
            { step_order: 7, type: 'select_time', label: 'Preferred time slot' },
            { step_order: 8, type: 'summary', label: 'Review enrollment' },
            { step_order: 9, type: 'confirm', label: 'Submit enrollment' },
          ],
        },
        {
          id: 'f-d2', name: 'General Inquiry', description: 'Questions about courses, availability, or requirements',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'Your question' },
            { step_order: 3, type: 'confirm', label: 'Send' },
          ],
        },
      ],
    }),
  });

  // ═══════════════════════════════════════════════════
  // 9. CONSULTING OFFICE
  // ═══════════════════════════════════════════════════
  const [consulting] = await knex('templates')
    .insert({
      industry_type: 'consulting',
      name: 'Consulting Office',
      description: 'Professional consulting services — legal, financial, or business. Appointment booking and document request forms.',
    })
    .returning('*');

  await knex('template_data').insert({
    template_id: consulting.id,
    data: JSON.stringify({
      services: [
        { id: 'cat-co-consult', name: 'Consultations', description: 'Meetings and advisory sessions', parent_id: null, sort_order: 0 },
        { id: 'cat-co-docs', name: 'Documents & Filing', description: 'Reviews, registrations, and tax support', parent_id: null, sort_order: 1 },
        { id: 'svc-co1', name: 'Initial Consultation (30 min)', description: 'First meeting to assess your needs', price: 75, duration: '30 min', parent_id: 'cat-co-consult', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-co2', name: 'Full Consultation (60 min)', description: 'In-depth advisory session', price: 150, duration: '60 min', parent_id: 'cat-co-consult', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-co3', name: 'Follow-up Session', description: 'Review progress and next steps', price: 100, duration: '45 min', parent_id: 'cat-co-consult', sort_order: 2, buttons: DEFAULT_BUTTONS },
        { id: 'svc-co7', name: 'Notarization', description: 'Notary public service for documents', price: 25, duration: '15 min', parent_id: 'cat-co-consult', sort_order: 3, buttons: DEFAULT_BUTTONS },
        { id: 'svc-co4', name: 'Document Review', description: 'Review contracts, proposals, or filings', price: 120, duration: null, parent_id: 'cat-co-docs', sort_order: 0, buttons: DEFAULT_BUTTONS },
        { id: 'svc-co5', name: 'Business Registration Assist', description: 'Help with company or LLC formation', price: 300, duration: null, parent_id: 'cat-co-docs', sort_order: 1, buttons: DEFAULT_BUTTONS },
        { id: 'svc-co6', name: 'Tax Filing Support', description: 'Personal or business tax preparation', price: 200, duration: null, parent_id: 'cat-co-docs', sort_order: 2, buttons: DEFAULT_BUTTONS },
      ],
      menu_nodes: [
        { id: 'n-co1', parent_id: null, node_type: 'menu', label: 'Welcome Menu', sort_order: 0 },
        { id: 'n-co2', parent_id: 'n-co1', node_type: 'flow_entry', label: 'Book a Consultation', sort_order: 0, flow_id: 'f-co1' },
        { id: 'n-co3', parent_id: 'n-co1', node_type: 'catalog_entry', label: 'Services & Fees', sort_order: 1, catalog_node_id: null },
        { id: 'n-co10', parent_id: 'n-co1', node_type: 'flow_entry', label: 'Request a Document', sort_order: 2, flow_id: 'f-co2' },
        { id: 'n-co11', parent_id: 'n-co1', node_type: 'flow_entry', label: 'Ask a Question', sort_order: 3, flow_id: 'f-co3' },
        { id: 'n-co12', parent_id: 'n-co1', node_type: 'action', label: 'Contact Office', sort_order: 4, action_type: 'show_phone' },
      ],
      flows: [
        {
          id: 'f-co1', name: 'Consultation Booking', description: 'Schedule a meeting with a consultant',
          steps: [
            { step_order: 1, type: 'select_service', label: 'Type of consultation' },
            { step_order: 2, type: 'text_input', label: 'Your full name' },
            { step_order: 3, type: 'text_input', label: 'Phone number' },
            { step_order: 4, type: 'text_input', label: 'Brief description of your case' },
            { step_order: 5, type: 'select_date', label: 'Preferred date' },
            { step_order: 6, type: 'select_time', label: 'Preferred time' },
            { step_order: 7, type: 'summary', label: 'Review appointment' },
            { step_order: 8, type: 'confirm', label: 'Confirm booking' },
          ],
        },
        {
          id: 'f-co2', name: 'Document Request', description: 'Request preparation or review of documents',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your full name' },
            { step_order: 2, type: 'text_input', label: 'What document do you need?' },
            { step_order: 3, type: 'text_input', label: 'Any relevant details or deadlines' },
            { step_order: 4, type: 'confirm', label: 'Submit request' },
          ],
        },
        {
          id: 'f-co3', name: 'General Inquiry', description: 'Ask about services, availability, or pricing',
          steps: [
            { step_order: 1, type: 'text_input', label: 'Your name' },
            { step_order: 2, type: 'text_input', label: 'Your question' },
            { step_order: 3, type: 'confirm', label: 'Send' },
          ],
        },
      ],
    }),
  });
};
