/**
 * Flow Template Library
 * ─────────────────────
 * Single source of truth for all flow templates.
 * Each template has: name, category, description, steps[].
 * Steps use the same format as ConversationBuilder local state.
 *
 * Step input_type values:
 *   text_input | number_input | select_option | select_service
 */

export const TEMPLATE_CATEGORIES = [
  { key: 'booking', label: 'Booking', icon: '📅' },
  { key: 'sales', label: 'Sales / Lead', icon: '💰' },
  { key: 'support', label: 'Support', icon: '🛟' },
  { key: 'realestate', label: 'Real Estate', icon: '🏠' },
  { key: 'advanced', label: 'Advanced', icon: '⚙️' },
];

export const FLOW_TEMPLATES = [
  // ═══════════════════════════════════════════════════════════
  //  BOOKING
  // ═══════════════════════════════════════════════════════════
  {
    key: 'basic_appointment',
    category: 'booking',
    name: 'Basic Appointment Booking',
    description: 'Collect name, phone, date and time for a simple appointment.',
    steps: [
      { question_text: 'What is your full name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Preferred date?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week', 'Next Week'] },
      { question_text: 'Preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },
  {
    key: 'appointment_service',
    category: 'booking',
    name: 'Appointment with Service Selection',
    description: 'Customer picks a service first, then books date and time.',
    steps: [
      { question_text: 'Which service would you like?', input_type: 'select_service' },
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Preferred date?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week', 'Next Week'] },
      { question_text: 'Preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },
  {
    key: 'urgent_booking',
    category: 'booking',
    name: 'Urgent Booking',
    description: 'Fast booking for same-day or next-day appointments.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Which service do you need urgently?', input_type: 'select_service' },
      { question_text: 'When do you need it?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'ASAP'] },
      { question_text: 'Any preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening', 'Any Time'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  SALES / LEAD
  // ═══════════════════════════════════════════════════════════
  {
    key: 'lead_capture',
    category: 'sales',
    name: 'Lead Capture',
    description: 'Quick form to capture a lead — name and phone number.',
    steps: [
      { question_text: 'What is your full name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'What are you interested in?', input_type: 'text_input' },
    ],
  },
  {
    key: 'consultation_request',
    category: 'sales',
    name: 'Consultation Request',
    description: 'Customer requests a consultation with date preference.',
    steps: [
      { question_text: 'What is your full name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'What do you need a consultation about?', input_type: 'text_input' },
      { question_text: 'Preferred date for consultation?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week', 'Next Week'] },
      { question_text: 'Preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },
  {
    key: 'quote_request',
    category: 'sales',
    name: 'Quote Request',
    description: 'Customer describes what they need and requests a price quote.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Which service are you interested in?', input_type: 'select_service' },
      { question_text: 'Please describe what you need:', input_type: 'text_input' },
      { question_text: 'What is your budget range?', input_type: 'select_option', options: ['Under $100', '$100 – $500', '$500 – $1,000', '$1,000+'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  SUPPORT
  // ═══════════════════════════════════════════════════════════
  {
    key: 'contact_support',
    category: 'support',
    name: 'Contact Support',
    description: 'Customer sends a message to your support team.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'How can we help you?', input_type: 'text_input' },
    ],
  },
  {
    key: 'report_issue',
    category: 'support',
    name: 'Report Issue',
    description: 'Customer reports a problem or complaint.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone or email?', input_type: 'text_input' },
      { question_text: 'What type of issue?', input_type: 'select_option', options: ['Product Defect', 'Wrong Order', 'Late Delivery', 'Billing Issue', 'Other'] },
      { question_text: 'Please describe the issue:', input_type: 'text_input' },
    ],
  },
  {
    key: 'request_callback',
    category: 'support',
    name: 'Request Callback',
    description: 'Customer requests a callback at a preferred time.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'What is this about?', input_type: 'text_input' },
      { question_text: 'When should we call you?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week'] },
      { question_text: 'Preferred time for callback?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  REAL ESTATE
  // ═══════════════════════════════════════════════════════════
  {
    key: 'property_viewing',
    category: 'realestate',
    name: 'Property Viewing Request',
    description: 'Collect viewing request with property interest and date.',
    steps: [
      { question_text: 'What is your full name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Which property or area interests you?', input_type: 'text_input' },
      { question_text: 'Preferred viewing date?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week', 'Next Week'] },
      { question_text: 'Preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },
  {
    key: 'property_inquiry',
    category: 'realestate',
    name: 'Property Inquiry (Buy/Rent)',
    description: 'Customer inquires about buying or renting a property.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Are you looking to buy or rent?', input_type: 'select_option', options: ['Buy', 'Rent'] },
      { question_text: 'What type of property?', input_type: 'select_option', options: ['Apartment', 'House', 'Villa', 'Commercial', 'Land'] },
      { question_text: 'Preferred area or location?', input_type: 'text_input' },
      { question_text: 'Your budget range?', input_type: 'select_option', options: ['Under $200K', '$200K – $400K', '$400K – $700K', '$700K+'] },
    ],
  },
  {
    key: 'budget_date_flow',
    category: 'realestate',
    name: 'Budget + Date Flow',
    description: 'Collect budget, preferred date, and contact info for property viewings.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'What is your budget?', input_type: 'select_option', options: ['Under $200K', '$200K – $400K', '$400K – $700K', '$700K – $1M', '$1M+'] },
      { question_text: 'When would you like to visit?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week', 'Next Week'] },
      { question_text: 'Preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
      { question_text: 'Any specific requirements?', input_type: 'text_input' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  ADVANCED
  // ═══════════════════════════════════════════════════════════
  {
    key: 'multi_step_conditional',
    category: 'advanced',
    name: 'Multi-step Conditional Flow',
    description: 'Collects info step by step with choices that guide the conversation.',
    steps: [
      { question_text: 'What is your name?', input_type: 'text_input' },
      { question_text: 'What do you need help with?', input_type: 'select_option', options: ['New Order', 'Existing Order', 'General Inquiry'] },
      { question_text: 'Please describe your request:', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'Which service are you interested in?', input_type: 'select_service' },
      { question_text: 'When would you like to proceed?', input_type: 'select_option', options: ['ASAP', 'This Week', 'Next Week', 'No Rush'] },
    ],
  },
  {
    key: 'funnel_flow',
    category: 'advanced',
    name: 'Funnel Flow (Lead → Qualification → Booking)',
    description: 'Full sales funnel — capture lead, qualify interest, then book.',
    steps: [
      { question_text: 'What is your full name?', input_type: 'text_input' },
      { question_text: 'Your phone number?', input_type: 'text_input' },
      { question_text: 'What are you looking for?', input_type: 'select_option', options: ['Product', 'Service', 'Partnership', 'Other'] },
      { question_text: 'How did you hear about us?', input_type: 'select_option', options: ['Google', 'Social Media', 'Friend / Referral', 'Advertisement', 'Other'] },
      { question_text: 'What is your budget range?', input_type: 'select_option', options: ['Under $500', '$500 – $2,000', '$2,000 – $5,000', '$5,000+'] },
      { question_text: 'Would you like to book a meeting?', input_type: 'select_option', options: ['Yes, book now', 'No, just inquiring'] },
      { question_text: 'Preferred date?', input_type: 'select_option', options: ['Today', 'Tomorrow', 'This Week', 'Next Week'] },
      { question_text: 'Preferred time?', input_type: 'select_option', options: ['Morning', 'Afternoon', 'Evening'] },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  BLANK (always last)
  // ═══════════════════════════════════════════════════════════
  {
    key: 'empty',
    category: null,
    name: 'Start from Scratch',
    description: 'Empty flow — add your own questions.',
    steps: [],
  },
];
