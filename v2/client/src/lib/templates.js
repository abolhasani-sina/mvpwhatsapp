// ══════════════════════════════════════════════════
// Business Templates — loadable into the V2 builder
// ══════════════════════════════════════════════════
//
// ID ranges:  1000+ per template (Beauty Salon = 1000–1999)
// Each template returns { welcomeMessage, buttons }

// ── Beauty Salon: Glow Studio ──

function beautySalon() {
  let id = 1000;
  const n = () => id++;

  // ── Base flow: shared steps for ALL services ──
  const baseFlow = [
    {
      id: n(), question: 'What service would you like to book?',
      type: 'select_from_menu', key: 'step_service', label: 'Selected service',
      menuRoot: 1001, // → "Our Services" root button
      options: [],
    },
    {
      id: n(), question: 'Great choice! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you been to us before?',
      type: 'choice', key: 'step_returning', label: 'Returning client',
      options: [
        { id: n(), label: 'Yes I\'ve been before' },
        { id: n(), label: 'No it\'s my first time' },
      ],
    },
    {
      id: n(), question: 'When would you like to come in?',
      type: 'choice_with_manual', key: 'step_date', label: 'Preferred date',
      manualPlaceholder: 'Enter your preferred date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This Saturday' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'What time works best for you?',
      type: 'choice', key: 'step_time', label: 'Preferred time',
      options: [
        { id: n(), label: 'Morning (9–12)' },
        { id: n(), label: 'Afternoon (12–5)' },
        { id: n(), label: 'Evening (5–8)' },
      ],
    },
  ];

  // ── Extra steps per service category ──
  const nailExtras = [
    {
      id: n(), question: 'Do you need any existing gel or polish removed first?',
      type: 'choice', key: 'step_removal', label: 'Removal needed',
      options: [
        { id: n(), label: 'Yes remove first' },
        { id: n(), label: 'No I\'m good' },
        { id: n(), label: 'Not sure' },
      ],
    },
  ];

  const pedicureExtras = [
    {
      id: n(), question: 'Do you need any existing gel or polish removed first?',
      type: 'choice', key: 'step_removal', label: 'Removal needed',
      options: [
        { id: n(), label: 'Yes remove first' },
        { id: n(), label: 'No I\'m good' },
        { id: n(), label: 'Not sure' },
      ],
    },
    {
      id: n(), question: 'Do you have any allergies or sensitive skin we should be aware of?',
      type: 'text', key: 'step_allergies', label: 'Allergies / notes',
      options: [],
    },
  ];

  const hairExtras = [
    {
      id: n(), question: 'What\'s your current hair length?',
      type: 'choice', key: 'step_hair_length', label: 'Hair length',
      options: [
        { id: n(), label: 'Short' },
        { id: n(), label: 'Medium' },
        { id: n(), label: 'Long' },
      ],
    },
  ];

  const lashExtras = [
    {
      id: n(), question: 'Do you wear contact lenses?',
      type: 'choice', key: 'step_contacts', label: 'Contact lenses',
      options: [
        { id: n(), label: 'Yes' },
        { id: n(), label: 'No' },
      ],
    },
  ];

  const skinExtras = [
    {
      id: n(), question: 'What\'s your main skin concern right now?',
      type: 'choice', key: 'step_skin_concern', label: 'Skin concern',
      options: [
        { id: n(), label: 'Acne / breakouts' },
        { id: n(), label: 'Dryness' },
        { id: n(), label: 'Anti-aging' },
        { id: n(), label: 'General maintenance' },
      ],
    },
    {
      id: n(), question: 'Do you have any allergies or sensitive skin we should be aware of?',
      type: 'text', key: 'step_allergies', label: 'Allergies / notes',
      options: [],
    },
  ];

  const waxExtras = [
    {
      id: n(), question: 'Have you waxed the area before?',
      type: 'choice', key: 'step_wax_history', label: 'Previous waxing',
      options: [
        { id: n(), label: 'Yes regularly' },
        { id: n(), label: 'Yes but it\'s been a while' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'Do you have any allergies or sensitive skin we should be aware of?',
      type: 'text', key: 'step_allergies', label: 'Allergies / notes',
      options: [],
    },
  ];

  // For the generic "Book Appointment" button (no extras, no prefill)
  const bookingFlow = baseFlow;

  // ── Helper: create info leaf node ──
  // extraSteps lives on the infoPage itself so the admin can edit it per service
  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book this', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  // ── Menu tree ──
  const buttons = [
    // ─── Our Services ───
    {
      id: 1001, label: '📋 Our Services', behavior: 'menu', children: [
        // Hair
        {
          id: n(), label: '💇 Hair', behavior: 'menu', children: [
            info('Women\'s Haircut', '✂️ Women\'s Haircut', 'Professional cut and style. Includes wash, cut, and blow dry. Our stylists will help you find the perfect look.', 45, 'USD', '45 min', 'clean', hairExtras),
            info('Men\'s Haircut', '✂️ Men\'s Haircut', 'Sharp, clean cut with attention to detail. Includes wash and style. Beard trim available on request.', 25, 'USD', '30 min', 'clean', hairExtras),
            info('Blow Dry & Styling', '💨 Blow Dry & Styling', 'Gorgeous blow-out and styling for any occasion. Straight, wavy, or curly — your choice.', 30, 'USD', '30 min', 'friendly', hairExtras),
            info('Hair Coloring', '🎨 Hair Coloring', 'Full head color with premium products. Covers grays beautifully or transforms your look entirely.', 80, 'USD', '90 min', 'friendly', hairExtras),
            info('Highlights & Balayage', '✨ Highlights & Balayage', 'Hand-painted highlights for a natural, sun-kissed look. Customized placement for your face shape.', 120, 'USD', '120 min', 'premium', hairExtras),
            info('Keratin Treatment', '💎 Keratin Treatment', 'Smooth, frizz-free hair for up to 3 months. Repairs damage and adds incredible shine.', 150, 'USD', '150 min', 'premium', hairExtras),
          ],
        },
        // Nails
        {
          id: n(), label: '💅 Nails', behavior: 'menu', children: [
            info('Classic Manicure', '💅 Classic Manicure', 'Shape, buff, cuticle care, and polish. A clean, polished look every time.', 20, 'USD', '30 min', 'clean', nailExtras),
            info('Gel Manicure', '💅 Gel Manicure', 'Long-lasting gel polish that stays perfect for 2-3 weeks. Chip-free and glossy.', 35, 'USD', '45 min', 'clean', nailExtras),
            info('Classic Pedicure', '🦶 Classic Pedicure', 'Soak, exfoliate, shape, and polish. Includes a relaxing foot massage.', 30, 'USD', '40 min', 'friendly', pedicureExtras),
            info('Gel Pedicure', '🦶 Gel Pedicure', 'Full pedicure with durable gel polish. Your feet will look amazing for weeks.', 45, 'USD', '50 min', 'friendly', pedicureExtras),
            info('Nail Art', '🎨 Nail Art', 'Custom designs, gems, or patterns. From simple accents to full artistic sets. Price per nail.', 5, 'USD', '15 min/nail', 'premium', nailExtras),
          ],
        },
        // Lashes & Brows
        {
          id: n(), label: '👁 Lashes & Brows', behavior: 'menu', children: [
            info('Classic Lash Extensions', '👁 Classic Lash Extensions', 'One extension per natural lash for a subtle, elegant look. Natural-looking length and curl.', 80, 'USD', '90 min', 'clean', lashExtras),
            info('Volume Lash Extensions', '👁 Volume Lash Extensions', 'Multiple lightweight fans per lash for dramatic, full volume. Perfect for special occasions or everyday glam.', 120, 'USD', '120 min', 'premium', lashExtras),
            info('Lash Lift & Tint', '✨ Lash Lift & Tint', 'Lifts and curls your natural lashes, then tints them darker. Lasts 6-8 weeks. No extensions needed.', 55, 'USD', '60 min', 'friendly', lashExtras),
            info('Brow Shaping', '✏️ Brow Shaping', 'Wax or thread to perfectly shape your brows. Includes trim and clean-up.', 15, 'USD', '15 min', 'clean'),
            info('Brow Lamination', '✏️ Brow Lamination', 'Sleek, brushed-up brows that stay in place for weeks. Includes shaping and tint.', 45, 'USD', '45 min', 'friendly'),
          ],
        },
        // Skincare
        {
          id: n(), label: '🧖 Skincare', behavior: 'menu', children: [
            info('Classic Facial', '🧖 Classic Facial', 'Deep cleanse, exfoliation, mask, and moisturizer. Leaves your skin refreshed and glowing.', 50, 'USD', '45 min', 'clean', skinExtras),
            info('Deep Cleansing Facial', '🧖 Deep Cleansing', 'Extractions, steam, and purifying mask. Ideal for oily or congested skin. Clears pores and reduces breakouts.', 65, 'USD', '60 min', 'clean', skinExtras),
            info('Anti-Aging Facial', '💎 Anti-Aging Facial', 'Collagen-boosting treatment with firming serum and LED therapy. Reduces fine lines and restores elasticity.', 90, 'USD', '75 min', 'premium', skinExtras),
            info('Chemical Peel', '⚗️ Chemical Peel', 'Controlled exfoliation to reveal fresh skin. Reduces dark spots, acne scars, and uneven texture.', 75, 'USD', '45 min', 'friendly', skinExtras),
          ],
        },
        // Waxing
        {
          id: n(), label: '🌿 Waxing', behavior: 'menu', children: [
            info('Full Legs', '🌿 Full Legs Waxing', 'Smooth from ankle to hip. Uses gentle wax suitable for sensitive skin.', 40, 'USD', '30 min', 'clean', waxExtras),
            info('Half Legs', '🌿 Half Legs Waxing', 'Lower legs — knee to ankle. Quick and effective.', 25, 'USD', '20 min', 'clean', waxExtras),
            info('Bikini Line', '🌿 Bikini Line Waxing', 'Clean bikini line shaping. Discreet and professional service.', 30, 'USD', '20 min', 'clean', waxExtras),
            info('Underarms', '🌿 Underarm Waxing', 'Quick underarm wax for silky smooth results.', 15, 'USD', '10 min', 'clean', waxExtras),
            info('Full Body', '🌿 Full Body Waxing', 'Complete body waxing package — legs, arms, underarms, and bikini. Save compared to individual services.', 120, 'USD', '90 min', 'friendly', waxExtras),
          ],
        },
      ],
    },

    // ─── Book Appointment ───
    {
      id: n(), label: '📅 Book Appointment', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book an Appointment',
        description: 'Ready to look amazing? Choose a time that works for you and we\'ll take care of the rest!',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    // ─── Call Us ───
    {
      id: n(), label: '📞 Call Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Call Us',
        description: 'We\'d love to hear from you! Give us a call and our team will be happy to help.\n\n📱 +1 555-0100\n🕐 Mon–Sat, 9 AM – 8 PM',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    // ─── Location ───
    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Us',
        description: 'Come visit us! We\'re easy to find.\n\n📍 123 Beauty Lane, Suite 4\nDowntown, New York\n\n🅿️ Free parking available\n🚇 2 min walk from Central Station',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey there! ✨ Welcome to Glow Studio. Tap below to browse our services or book an appointment.',
    buttons,
  };
}

// ── Medical Clinic: CarePoint Medical Center ──

function medicalClinic() {
  let id = 2000;
  const n = () => id++;

  // ── Base flow: shared steps for ALL departments ──
  const baseFlow = [
    {
      id: n(), question: 'Which department are you looking for?',
      type: 'select_from_menu', key: 'step_service', label: 'Department',
      menuRoot: 2001,
      options: [],
    },
    {
      id: n(), question: 'Got it. Can I have your full name?',
      type: 'text', key: 'step_name', label: 'Patient name',
      options: [],
    },
    {
      id: n(), question: 'Have you visited our clinic before?',
      type: 'choice', key: 'step_returning', label: 'Existing patient',
      options: [
        { id: n(), label: 'Yes I\'m a patient here' },
        { id: n(), label: 'No it\'s my first visit' },
      ],
    },
    {
      id: n(), question: 'When would you like your appointment?',
      type: 'choice_with_manual', key: 'step_date', label: 'Preferred date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
        { id: n(), label: 'As soon as possible' },
      ],
    },
    {
      id: n(), question: 'What time works for you?',
      type: 'choice', key: 'step_time', label: 'Preferred time',
      options: [
        { id: n(), label: 'Morning (8–12)' },
        { id: n(), label: 'Afternoon (12–4)' },
        { id: n(), label: 'Late afternoon (4–7)' },
      ],
    },
  ];

  // ── Extra steps per department ──

  const generalExtras = [
    {
      id: n(), question: 'Can you briefly describe your symptoms?',
      type: 'text', key: 'step_symptoms', label: 'Symptoms',
      options: [],
    },
    {
      id: n(), question: 'How urgent is this?',
      type: 'choice', key: 'step_urgency', label: 'Urgency',
      options: [
        { id: n(), label: 'Routine check-up' },
        { id: n(), label: 'Been feeling off for a while' },
        { id: n(), label: 'Quite urgent' },
      ],
    },
    {
      id: n(), question: 'Do you have health insurance?',
      type: 'choice', key: 'step_insurance', label: 'Insurance',
      options: [
        { id: n(), label: 'Yes private insurance' },
        { id: n(), label: 'Yes public / government' },
        { id: n(), label: 'No insurance' },
        { id: n(), label: 'I\'ll check and bring it' },
      ],
    },
  ];

  const pediatricExtras = [
    {
      id: n(), question: 'What\'s the child\'s age group?',
      type: 'choice', key: 'step_child_age', label: 'Child age',
      options: [
        { id: n(), label: 'Newborn – 2 years' },
        { id: n(), label: '3 – 5 years' },
        { id: n(), label: '6 – 12 years' },
        { id: n(), label: '13+ teenager' },
      ],
    },
    {
      id: n(), question: 'What\'s going on with the little one?',
      type: 'text', key: 'step_symptoms', label: 'Symptoms',
      options: [],
    },
    {
      id: n(), question: 'Is the vaccination booklet up to date?',
      type: 'choice', key: 'step_vaccination', label: 'Vaccinations',
      options: [
        { id: n(), label: 'Yes all up to date' },
        { id: n(), label: 'Not sure' },
        { id: n(), label: 'No needs catch-up' },
      ],
    },
  ];

  const dentistryExtras = [
    {
      id: n(), question: 'What\'s your main concern?',
      type: 'choice', key: 'step_dental_concern', label: 'Dental concern',
      options: [
        { id: n(), label: 'Toothache or pain' },
        { id: n(), label: 'Cosmetic (whitening, alignment)' },
        { id: n(), label: 'Routine cleaning' },
        { id: n(), label: 'Gum issues' },
      ],
    },
    {
      id: n(), question: 'When was your last dental visit?',
      type: 'choice', key: 'step_last_visit', label: 'Last visit',
      options: [
        { id: n(), label: 'Less than 6 months ago' },
        { id: n(), label: '6–12 months ago' },
        { id: n(), label: 'Over a year ago' },
        { id: n(), label: 'Can\'t remember' },
      ],
    },
  ];

  const dermatologyExtras = [
    {
      id: n(), question: 'Where is the area of concern?',
      type: 'choice', key: 'step_concern_area', label: 'Area of concern',
      options: [
        { id: n(), label: 'Face' },
        { id: n(), label: 'Body / torso' },
        { id: n(), label: 'Scalp' },
        { id: n(), label: 'Hands or feet' },
      ],
    },
    {
      id: n(), question: 'How long has this been going on?',
      type: 'choice', key: 'step_duration', label: 'Duration',
      options: [
        { id: n(), label: 'Just started recently' },
        { id: n(), label: 'A few weeks' },
        { id: n(), label: 'Several months' },
        { id: n(), label: 'It\'s been chronic' },
      ],
    },
  ];

  const orthopedicsExtras = [
    {
      id: n(), question: 'Where\'s the pain or discomfort?',
      type: 'choice', key: 'step_pain_area', label: 'Pain area',
      options: [
        { id: n(), label: 'Knee' },
        { id: n(), label: 'Back / spine' },
        { id: n(), label: 'Shoulder' },
        { id: n(), label: 'Hip' },
        { id: n(), label: 'Wrist / hand' },
      ],
    },
    {
      id: n(), question: 'How would you rate the pain?',
      type: 'choice', key: 'step_pain_level', label: 'Pain level',
      options: [
        { id: n(), label: 'Mild — can manage' },
        { id: n(), label: 'Moderate — affecting daily life' },
        { id: n(), label: 'Severe — hard to move' },
      ],
    },
    {
      id: n(), question: 'Do you have any recent X-rays or MRI scans?',
      type: 'choice', key: 'step_imaging', label: 'Imaging available',
      options: [
        { id: n(), label: 'Yes I\'ll bring them' },
        { id: n(), label: 'No' },
      ],
    },
  ];

  const eyeExtras = [
    {
      id: n(), question: 'What\'s the main issue?',
      type: 'choice', key: 'step_eye_issue', label: 'Eye issue',
      options: [
        { id: n(), label: 'Blurry vision' },
        { id: n(), label: 'Eye pain or irritation' },
        { id: n(), label: 'Dryness' },
        { id: n(), label: 'Routine eye exam' },
      ],
    },
    {
      id: n(), question: 'Do you currently wear glasses or contacts?',
      type: 'choice', key: 'step_corrective', label: 'Glasses / contacts',
      options: [
        { id: n(), label: 'Glasses' },
        { id: n(), label: 'Contact lenses' },
        { id: n(), label: 'Both' },
        { id: n(), label: 'Neither' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  // ── Helper: create info leaf node ──
  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book appointment', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  // ── Menu tree ──
  const buttons = [
    // ─── Departments ───
    {
      id: 2001, label: '🏥 Departments', behavior: 'menu', children: [
        // General Medicine
        {
          id: n(), label: '🩺 General Medicine', behavior: 'menu', children: [
            info('General Check-up', '🩺 General Check-up', 'Full health assessment including vitals, blood work review, and doctor consultation. Great for staying on top of your health.', 80, 'USD', '30 min', 'clean', generalExtras),
            info('Flu & Cold Consultation', '🤒 Flu & Cold', 'Feeling under the weather? Our doctor will assess your symptoms and prescribe the right treatment to get you back on your feet.', 60, 'USD', '20 min', 'friendly', generalExtras),
            info('Blood Pressure Screening', '❤️ Blood Pressure Check', 'Quick screening with a nurse. Includes reading, lifestyle tips, and follow-up recommendations if needed.', 40, 'USD', '15 min', 'clean', generalExtras),
            info('Allergy Testing', '🌿 Allergy Testing', 'Comprehensive panel to identify triggers — food, pollen, dust, and more. Results discussed with a specialist.', 120, 'USD', '45 min', 'premium', generalExtras),
          ],
        },
        // Pediatrics
        {
          id: n(), label: '👶 Pediatrics', behavior: 'menu', children: [
            info('Well-Child Visit', '👶 Well-Child Visit', 'Routine developmental check-up for your little one. Includes growth tracking, milestones, and any concerns you might have.', 90, 'USD', '30 min', 'friendly', pediatricExtras),
            info('Sick Visit', '🤕 Sick Visit', 'Your child not feeling well? Our pediatrician will assess symptoms and get them the right care quickly.', 70, 'USD', '20 min', 'clean', pediatricExtras),
            info('Vaccination', '💉 Vaccination', 'Catch-up or scheduled vaccinations. We follow CDC guidelines and make it as comfortable as possible for your child.', 50, 'USD', '15 min', 'clean', pediatricExtras),
            info('Growth Assessment', '📏 Growth Assessment', 'Comprehensive growth and development evaluation. Tracks height, weight, and BMI against age-appropriate benchmarks.', 60, 'USD', '25 min', 'friendly', pediatricExtras),
          ],
        },
        // Dentistry
        {
          id: n(), label: '🦷 Dentistry', behavior: 'menu', children: [
            info('Dental Cleaning', '🦷 Dental Cleaning', 'Professional cleaning and polishing by our dental hygienist. Removes plaque and tartar for healthier gums.', 85, 'USD', '45 min', 'clean', dentistryExtras),
            info('Cavity Filling', '🪥 Cavity Filling', 'Tooth-colored composite filling. We use numbing gel so you barely feel a thing.', 130, 'USD', '30 min', 'clean', dentistryExtras),
            info('Teeth Whitening', '✨ Teeth Whitening', 'Professional-grade whitening for noticeably brighter teeth in one visit. Safe and long-lasting results.', 200, 'USD', '60 min', 'premium', dentistryExtras),
            info('Dental Check-up', '🔍 Dental Check-up', 'Full oral examination with X-ray if needed. Early detection is key to avoiding bigger problems.', 60, 'USD', '20 min', 'friendly', dentistryExtras),
          ],
        },
        // Dermatology
        {
          id: n(), label: '🧴 Dermatology', behavior: 'menu', children: [
            info('Skin Check-up', '🧴 Skin Check-up', 'Full skin examination to catch any concerns early. Includes mole mapping and texture assessment.', 90, 'USD', '30 min', 'clean', dermatologyExtras),
            info('Acne Treatment', '💊 Acne Treatment', 'Customized treatment plan tailored to your skin type. May include topicals, lifestyle tips, or referrals.', 110, 'USD', '40 min', 'friendly', dermatologyExtras),
            info('Mole Screening', '🔎 Mole Screening', 'Detailed examination of moles and spots using a dermatoscope. Peace of mind in 20 minutes.', 70, 'USD', '20 min', 'clean', dermatologyExtras),
            info('Eczema Consultation', '🩹 Eczema Consultation', 'Specialized assessment for eczema and dry skin conditions. Includes a personalized care plan.', 85, 'USD', '25 min', 'friendly', dermatologyExtras),
          ],
        },
        // Orthopedics
        {
          id: n(), label: '🦴 Orthopedics', behavior: 'menu', children: [
            info('Joint Pain Assessment', '🦴 Joint Pain', 'Thorough evaluation of joint pain with range-of-motion testing. May include imaging referral.', 120, 'USD', '30 min', 'clean', orthopedicsExtras),
            info('Sports Injury Consultation', '⚽ Sports Injury', 'Got hurt playing sports? Our specialist will assess the injury and build a recovery plan.', 100, 'USD', '30 min', 'friendly', orthopedicsExtras),
            info('Back Pain Evaluation', '🔙 Back Pain', 'Comprehensive spinal assessment for chronic or acute back pain. Posture analysis included.', 110, 'USD', '30 min', 'clean', orthopedicsExtras),
            info('Post-Surgery Follow-up', '✅ Post-Surgery Check', 'Recovery check after orthopedic surgery. Wound check, mobility assessment, and next steps.', 80, 'USD', '20 min', 'friendly', orthopedicsExtras),
          ],
        },
        // Eye Care
        {
          id: n(), label: '👁 Eye Care', behavior: 'menu', children: [
            info('Vision Test', '👁 Vision Test', 'Standard vision screening to check sharpness and clarity. Quick and painless — great for annual check-ups.', 70, 'USD', '30 min', 'clean', eyeExtras),
            info('Comprehensive Eye Exam', '🔬 Full Eye Exam', 'In-depth examination including pressure test, retina check, and prescription update.', 90, 'USD', '40 min', 'premium', eyeExtras),
            info('Contact Lens Fitting', '👓 Contact Lens Fitting', 'Find the perfect fit and brand for your eyes. Trial lenses included in the visit.', 60, 'USD', '20 min', 'friendly', eyeExtras),
            info('Dry Eye Treatment', '💧 Dry Eye Treatment', 'Assessment and treatment for chronic dry eyes. Includes tear film analysis and relief options.', 80, 'USD', '25 min', 'clean', eyeExtras),
          ],
        },
      ],
    },

    // ─── Book Appointment ───
    {
      id: n(), label: '📅 Book Appointment', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book an Appointment',
        description: 'Need to see a doctor? Pick a department and time that works — we\'ll handle the rest.',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    // ─── Emergency Line ───
    {
      id: n(), label: '🚨 Emergency Line', behavior: 'info', children: [],
      infoPage: {
        title: '🚨 Emergency Contact',
        description: 'For medical emergencies, please call immediately.\n\n📱 +1 555-0911\n🏥 ER open 24/7\n\n⚠️ If it\'s life-threatening, call 911 first.',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    // ─── Location ───
    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Us',
        description: 'We\'re centrally located and easy to reach.\n\n📍 450 Health Blvd, 2nd Floor\nMidtown Medical District\n\n🅿️ Validated parking in Garage B\n🚇 5 min walk from Metro Central\n\n🕐 Mon–Fri 8 AM – 7 PM\n🕐 Sat 9 AM – 2 PM',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hi there 👋 Welcome to CarePoint Medical Center. How can we help you today?',
    buttons,
  };
}

// ── Restaurant / Cafe: Bella Tavola ──

function restaurant() {
  let id = 3000;
  const n = () => id++;

  // ── Base flow: shared steps for ALL menu items ──
  const baseFlow = [
    {
      id: n(), question: 'What are you in the mood for?',
      type: 'select_from_menu', key: 'step_service', label: 'Menu choice',
      menuRoot: 3001,
      options: [],
    },
    {
      id: n(), question: 'Lovely! Name for the reservation?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you dined with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning guest',
      options: [
        { id: n(), label: 'Yep love this place' },
        { id: n(), label: 'Nope first time!' },
      ],
    },
    {
      id: n(), question: 'When are you coming in?',
      type: 'choice_with_manual', key: 'step_date', label: 'Date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This weekend' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'What time works?',
      type: 'choice', key: 'step_time', label: 'Time',
      options: [
        { id: n(), label: 'Lunch (12–3)' },
        { id: n(), label: 'Early dinner (5–7)' },
        { id: n(), label: 'Dinner (7–10)' },
      ],
    },
  ];

  // ── Extra steps per menu section ──

  const breakfastExtras = [
    {
      id: n(), question: 'How many people are joining?',
      type: 'choice', key: 'step_guests', label: 'Guests',
      options: [
        { id: n(), label: 'Just me' },
        { id: n(), label: '2 people' },
        { id: n(), label: '3–4 people' },
        { id: n(), label: '5+' },
      ],
    },
    {
      id: n(), question: 'Any dietary needs we should know about?',
      type: 'choice', key: 'step_dietary', label: 'Dietary needs',
      options: [
        { id: n(), label: 'None' },
        { id: n(), label: 'Vegetarian' },
        { id: n(), label: 'Gluten-free' },
        { id: n(), label: 'Vegan' },
      ],
    },
  ];

  const starterExtras = [
    {
      id: n(), question: 'Dine-in or takeaway?',
      type: 'choice', key: 'step_order_type', label: 'Order type',
      options: [
        { id: n(), label: 'Dine-in' },
        { id: n(), label: 'Takeaway' },
      ],
    },
    {
      id: n(), question: 'How\'s your spice tolerance? 🌶️',
      type: 'choice', key: 'step_spice', label: 'Spice level',
      options: [
        { id: n(), label: 'Keep it mild' },
        { id: n(), label: 'Medium is fine' },
        { id: n(), label: 'Bring the heat 🔥' },
      ],
    },
  ];

  const mainExtras = [
    {
      id: n(), question: 'Dine-in or takeaway?',
      type: 'choice', key: 'step_order_type', label: 'Order type',
      options: [
        { id: n(), label: 'Eating here' },
        { id: n(), label: 'Takeaway' },
      ],
    },
    {
      id: n(), question: 'Where would you like to sit?',
      type: 'choice', key: 'step_seating', label: 'Seating',
      options: [
        { id: n(), label: 'Indoor' },
        { id: n(), label: 'Outdoor terrace' },
        { id: n(), label: 'Bar area' },
      ],
    },
    {
      id: n(), question: 'Any cooking preference for your dish?',
      type: 'choice', key: 'step_cooking', label: 'Cooking preference',
      options: [
        { id: n(), label: 'Medium-rare' },
        { id: n(), label: 'Medium' },
        { id: n(), label: 'Well-done' },
        { id: n(), label: 'No preference' },
      ],
    },
    {
      id: n(), question: 'Anything else? Allergies, special requests...',
      type: 'text', key: 'step_requests', label: 'Special requests',
      options: [],
    },
  ];

  const pastaExtras = [
    {
      id: n(), question: 'Dine-in or takeaway?',
      type: 'choice', key: 'step_order_type', label: 'Order type',
      options: [
        { id: n(), label: 'Eating here' },
        { id: n(), label: 'Takeaway' },
      ],
    },
    {
      id: n(), question: 'Any dietary needs?',
      type: 'choice', key: 'step_dietary', label: 'Dietary needs',
      options: [
        { id: n(), label: 'All good' },
        { id: n(), label: 'Gluten-free please' },
        { id: n(), label: 'Dairy-free' },
        { id: n(), label: 'Nut allergy' },
      ],
    },
  ];

  const dessertExtras = [
    {
      id: n(), question: 'Having it here or to go?',
      type: 'choice', key: 'step_to_go', label: 'Dine or take away',
      options: [
        { id: n(), label: 'Having it here 🍽️' },
        { id: n(), label: 'To go please' },
      ],
    },
    {
      id: n(), question: 'Any allergy concerns?',
      type: 'choice', key: 'step_allergy', label: 'Allergies',
      options: [
        { id: n(), label: 'Nut allergy' },
        { id: n(), label: 'Dairy allergy' },
        { id: n(), label: 'Gluten intolerance' },
        { id: n(), label: 'None at all' },
      ],
    },
  ];

  const drinkExtras = [
    {
      id: n(), question: 'What size?',
      type: 'choice', key: 'step_size', label: 'Size',
      options: [
        { id: n(), label: 'Regular' },
        { id: n(), label: 'Large' },
      ],
    },
  ];

  // Reservation-level extras (used by the root "Reserve a Table" button)
  const reservationExtras = [
    {
      id: n(), question: 'How many guests?',
      type: 'choice', key: 'step_guests', label: 'Guests',
      options: [
        { id: n(), label: 'Just me' },
        { id: n(), label: '2 people' },
        { id: n(), label: '3–4 people' },
        { id: n(), label: '5+ people' },
      ],
    },
    {
      id: n(), question: 'Indoor or outdoor?',
      type: 'choice', key: 'step_seating', label: 'Seating',
      options: [
        { id: n(), label: 'Indoor' },
        { id: n(), label: 'Outdoor terrace' },
        { id: n(), label: 'No preference' },
      ],
    },
    {
      id: n(), question: 'Any dietary needs or special requests?',
      type: 'text', key: 'step_requests', label: 'Special requests',
      options: [],
    },
  ];

  const bookingFlow = baseFlow;

  // ── Helper: create info leaf node ──
  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Order this', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  // ── Menu tree ──
  const buttons = [
    // ─── Our Menu ───
    {
      id: 3001, label: '🍽️ Our Menu', behavior: 'menu', children: [
        // Breakfast
        {
          id: n(), label: '🍳 Breakfast', behavior: 'menu', children: [
            info('Eggs Benedict', '🍳 Eggs Benedict', 'Perfectly poached eggs on toasted English muffin with silky hollandaise. Served with crispy hash browns.', 14, 'USD', '20 min', 'friendly', breakfastExtras),
            info('Avocado Toast', '🥑 Avocado Toast', 'Smashed avocado on sourdough with cherry tomatoes, microgreens, and a poached egg on top.', 12, 'USD', '15 min', 'clean', breakfastExtras),
            info('Pancake Stack', '🥞 Pancake Stack', 'Fluffy buttermilk pancakes with maple syrup, fresh berries, and a dusting of powdered sugar.', 11, 'USD', '15 min', 'friendly', breakfastExtras),
            info('Full English', '🍳 Full English', 'The classic — eggs, bacon, sausage, beans, toast, grilled tomato, and mushrooms. Go big or go home.', 16, 'USD', '25 min', 'clean', breakfastExtras),
          ],
        },
        // Starters
        {
          id: n(), label: '🥗 Starters', behavior: 'menu', children: [
            info('Bruschetta', '🍅 Bruschetta', 'Crispy ciabatta topped with fresh tomato, basil, garlic, and a drizzle of extra virgin olive oil.', 9, 'USD', '10 min', 'clean', starterExtras),
            info('Caesar Salad', '🥗 Caesar Salad', 'Romaine, parmesan, croutons, and our house-made Caesar dressing. Add grilled chicken for $4.', 11, 'USD', '12 min', 'friendly', starterExtras),
            info('Soup of the Day', '🍲 Soup of the Day', 'Fresh made daily. Ask your server for today\'s selection — always served with warm crusty bread.', 8, 'USD', '10 min', 'clean', starterExtras),
            info('Crispy Calamari', '🦑 Crispy Calamari', 'Lightly battered and fried to golden perfection. Served with garlic aioli and a lemon wedge.', 13, 'USD', '15 min', 'friendly', starterExtras),
          ],
        },
        // Main Courses
        {
          id: n(), label: '🥩 Main Courses', behavior: 'menu', children: [
            info('Grilled Salmon', '🐟 Grilled Salmon', 'Atlantic salmon fillet grilled with herbs, served with seasonal veggies and lemon butter sauce.', 24, 'USD', '25 min', 'premium', mainExtras),
            info('Ribeye Steak', '🥩 Ribeye Steak', '10oz prime ribeye cooked to your liking. Comes with garlic mashed potatoes and grilled asparagus.', 28, 'USD', '30 min', 'premium', mainExtras),
            info('Chicken Parmesan', '🍗 Chicken Parmesan', 'Breaded chicken breast with marinara and melted mozzarella. Served over spaghetti.', 19, 'USD', '20 min', 'friendly', mainExtras),
            info('Mushroom Risotto', '🍄 Mushroom Risotto', 'Creamy arborio rice with wild mushrooms, parmesan, and truffle oil. Pure comfort food.', 17, 'USD', '25 min', 'friendly', mainExtras),
          ],
        },
        // Pasta
        {
          id: n(), label: '🍝 Pasta', behavior: 'menu', children: [
            info('Spaghetti Carbonara', '🍝 Carbonara', 'Classic Roman style — egg, pecorino, guanciale, black pepper. No cream. The real deal.', 16, 'USD', '15 min', 'clean', pastaExtras),
            info('Penne Arrabbiata', '🌶️ Penne Arrabbiata', 'Spicy tomato sauce with garlic and chili flakes. Simple, bold, and satisfying.', 14, 'USD', '15 min', 'clean', pastaExtras),
            info('Truffle Tagliatelle', '🍄 Truffle Tagliatelle', 'Fresh egg pasta with black truffle cream sauce and shaved parmesan. A real showstopper.', 22, 'USD', '20 min', 'premium', pastaExtras),
            info('Seafood Linguine', '🦐 Seafood Linguine', 'Linguine tossed with shrimp, mussels, clams, and cherry tomatoes in white wine sauce.', 20, 'USD', '20 min', 'premium', pastaExtras),
          ],
        },
        // Desserts
        {
          id: n(), label: '🍰 Desserts', behavior: 'menu', children: [
            info('Tiramisu', '☕ Tiramisu', 'Our signature house recipe — layers of espresso-soaked ladyfingers and mascarpone. Made fresh daily.', 10, 'USD', '5 min', 'friendly', dessertExtras),
            info('Panna Cotta', '🍮 Panna Cotta', 'Silky vanilla bean panna cotta with a drizzle of berry compote. Light and heavenly.', 9, 'USD', '5 min', 'clean', dessertExtras),
            info('Chocolate Lava Cake', '🍫 Chocolate Lava Cake', 'Warm dark chocolate cake with a molten center. Served with vanilla gelato — trust us on this one.', 12, 'USD', '15 min', 'premium', dessertExtras),
            info('Gelato', '🍨 Gelato', 'Two scoops of Italian-style gelato. Ask for today\'s flavors — we rotate them weekly.', 8, 'USD', '5 min', 'clean', dessertExtras),
          ],
        },
        // Drinks
        {
          id: n(), label: '🍷 Drinks', behavior: 'menu', children: [
            info('House Wine', '🍷 House Wine', 'Glass of our curated house red or white. Both Italian, both excellent.', 9, 'USD', '2 min', 'clean', drinkExtras),
            info('Craft Beer', '🍺 Craft Beer', 'Local craft beer on tap. Rotating selection — ask your server what\'s pouring today.', 8, 'USD', '2 min', 'friendly', drinkExtras),
            info('Fresh Juice', '🧃 Fresh Juice', 'Freshly squeezed — orange, apple, or our signature tropical blend.', 6, 'USD', '5 min', 'clean', drinkExtras),
            info('Espresso', '☕ Espresso', 'Rich, bold espresso pulled from our Italian machine. Single or double shot.', 4, 'USD', '2 min', 'clean', drinkExtras),
            info('Cocktail of the Day', '🍸 Cocktail of the Day', 'Our bartender\'s daily creation. Always something fun — ask what\'s mixing today.', 13, 'USD', '5 min', 'premium', drinkExtras),
          ],
        },
      ],
    },

    // ─── Reserve a Table ───
    {
      id: n(), label: '📅 Reserve a Table', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Reserve a Table',
        description: 'Want to book a spot? Pick your date and time — we\'ll save you the best table 😊',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: reservationExtras,
        actionButtons: [
          { id: n(), label: 'Reserve now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    // ─── Call Us ───
    {
      id: n(), label: '📞 Call Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Call Us',
        description: 'Questions about the menu, large parties, or private events? Give us a ring!\n\n📱 +1 555-0340\n🕐 Tue–Sun, 11 AM – 11 PM\n\n(Closed Mondays)',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    // ─── Location ───
    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Us',
        description: 'We\'re right in the heart of the city.\n\n📍 78 Market Street\nOld Town, San Francisco\n\n🅿️ Street parking + public lot on 3rd Ave\n🚇 1 block from Powell St. Station\n\n🍽️ Walk-ins welcome — reservations recommended on weekends',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Ciao! 🍝 Welcome to Bella Tavola. Check out our menu or reserve a table — we\'d love to have you!',
    buttons,
  };
}

// ── Real Estate: Skyline Realty ──

function realEstate() {
  let id = 4000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which property caught your eye?',
      type: 'select_from_menu', key: 'step_service', label: 'Property interest',
      menuRoot: 4001,
      options: [],
    },
    {
      id: n(), question: 'Nice pick! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you worked with us before?',
      type: 'choice', key: 'step_returning', label: 'Existing client',
      options: [
        { id: n(), label: 'Yes we\'ve been in touch' },
        { id: n(), label: 'No I\'m new here' },
      ],
    },
    {
      id: n(), question: 'When would you like to schedule a viewing?',
      type: 'choice_with_manual', key: 'step_date', label: 'Viewing date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'Today if possible' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This weekend' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'What time works for the tour?',
      type: 'choice', key: 'step_time', label: 'Viewing time',
      options: [
        { id: n(), label: 'Morning (9–12)' },
        { id: n(), label: 'Afternoon (12–4)' },
        { id: n(), label: 'Evening (4–7)' },
      ],
    },
  ];

  // ── Extra steps per property type ──

  const apartmentExtras = [
    {
      id: n(), question: 'What\'s your budget range?',
      type: 'choice', key: 'step_budget', label: 'Budget',
      options: [
        { id: n(), label: 'Up to $200K' },
        { id: n(), label: '$200K – $400K' },
        { id: n(), label: '$400K – $700K' },
        { id: n(), label: '$700K+' },
      ],
    },
    {
      id: n(), question: 'Are you buying or renting?',
      type: 'choice', key: 'step_purpose', label: 'Buy or rent',
      options: [
        { id: n(), label: 'Buying' },
        { id: n(), label: 'Renting' },
        { id: n(), label: 'Just exploring' },
      ],
    },
    {
      id: n(), question: 'How soon do you need to move in?',
      type: 'choice', key: 'step_timeline', label: 'Move-in timeline',
      options: [
        { id: n(), label: 'ASAP' },
        { id: n(), label: 'Within a month' },
        { id: n(), label: '1–3 months' },
        { id: n(), label: 'No rush — just looking' },
      ],
    },
  ];

  const houseExtras = [
    {
      id: n(), question: 'What\'s your budget range?',
      type: 'choice', key: 'step_budget', label: 'Budget',
      options: [
        { id: n(), label: 'Up to $400K' },
        { id: n(), label: '$400K – $700K' },
        { id: n(), label: '$700K – $1M' },
        { id: n(), label: '$1M+' },
      ],
    },
    {
      id: n(), question: 'Do you need financing?',
      type: 'choice', key: 'step_financing', label: 'Financing',
      options: [
        { id: n(), label: 'Yes need a mortgage' },
        { id: n(), label: 'Pre-approved already' },
        { id: n(), label: 'Cash buyer' },
        { id: n(), label: 'Not sure yet' },
      ],
    },
    {
      id: n(), question: 'How many bedrooms minimum?',
      type: 'choice', key: 'step_bedrooms', label: 'Bedrooms',
      options: [
        { id: n(), label: '2 bedrooms' },
        { id: n(), label: '3 bedrooms' },
        { id: n(), label: '4+ bedrooms' },
      ],
    },
  ];

  const condoExtras = [
    {
      id: n(), question: 'What\'s your budget range?',
      type: 'choice', key: 'step_budget', label: 'Budget',
      options: [
        { id: n(), label: 'Up to $300K' },
        { id: n(), label: '$300K – $500K' },
        { id: n(), label: '$500K – $800K' },
        { id: n(), label: '$800K+' },
      ],
    },
    {
      id: n(), question: 'Any must-have amenities?',
      type: 'choice', key: 'step_amenities', label: 'Amenities',
      options: [
        { id: n(), label: 'Pool + gym' },
        { id: n(), label: 'Doorman / concierge' },
        { id: n(), label: 'Parking included' },
        { id: n(), label: 'No strong preference' },
      ],
    },
  ];

  const commercialExtras = [
    {
      id: n(), question: 'What\'s the intended use?',
      type: 'choice', key: 'step_usage', label: 'Intended use',
      options: [
        { id: n(), label: 'Office space' },
        { id: n(), label: 'Retail / storefront' },
        { id: n(), label: 'Warehouse / storage' },
        { id: n(), label: 'Mixed use' },
      ],
    },
    {
      id: n(), question: 'What\'s the square footage you need?',
      type: 'choice', key: 'step_sqft', label: 'Square footage',
      options: [
        { id: n(), label: 'Under 1,000 sq ft' },
        { id: n(), label: '1,000 – 3,000 sq ft' },
        { id: n(), label: '3,000 – 5,000 sq ft' },
        { id: n(), label: '5,000+ sq ft' },
      ],
    },
    {
      id: n(), question: 'Buy or lease?',
      type: 'choice', key: 'step_lease', label: 'Buy or lease',
      options: [
        { id: n(), label: 'Buy' },
        { id: n(), label: 'Lease' },
      ],
    },
  ];

  const landExtras = [
    {
      id: n(), question: 'What do you plan to build?',
      type: 'choice', key: 'step_build_plan', label: 'Build plan',
      options: [
        { id: n(), label: 'Residential home' },
        { id: n(), label: 'Commercial building' },
        { id: n(), label: 'Agricultural / farm' },
        { id: n(), label: 'Investment — hold for now' },
      ],
    },
    {
      id: n(), question: 'What size lot are you looking for?',
      type: 'choice', key: 'step_lot_size', label: 'Lot size',
      options: [
        { id: n(), label: 'Under 0.5 acres' },
        { id: n(), label: '0.5 – 2 acres' },
        { id: n(), label: '2 – 10 acres' },
        { id: n(), label: '10+ acres' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Schedule viewing', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 4001, label: '🏠 Properties', behavior: 'menu', children: [
        {
          id: n(), label: '🏢 Apartments', behavior: 'menu', children: [
            info('Downtown Studio', '🏢 Downtown Studio', 'Cozy 450 sq ft studio in the heart of downtown. Floor-to-ceiling windows, modern kitchen, rooftop access.', '185,000', 'USD', '450 sq ft', 'clean', apartmentExtras),
            info('1-Bed Midtown', '🏢 1-Bed Midtown', 'Sunny one-bedroom with in-unit laundry and balcony. Walking distance to parks and shopping.', '275,000', 'USD', '650 sq ft', 'friendly', apartmentExtras),
            info('2-Bed River View', '🏢 2-Bed River View', 'Spacious two-bedroom with panoramic river views. Updated appliances, hardwood floors throughout.', '420,000', 'USD', '950 sq ft', 'premium', apartmentExtras),
            info('Luxury Penthouse', '🏢 Luxury Penthouse', 'Top-floor 3-bed with private terrace. Concierge, gym, pool. The pinnacle of city living.', '1,200,000', 'USD', '2,100 sq ft', 'premium', apartmentExtras),
          ],
        },
        {
          id: n(), label: '🏡 Houses', behavior: 'menu', children: [
            info('Starter Home — Oak St', '🏡 Starter Home', '3-bed ranch in a quiet neighborhood. Fenced yard, attached garage, new roof. Perfect for families.', '340,000', 'USD', '1,400 sq ft', 'friendly', houseExtras),
            info('Colonial — Maple Ave', '🏡 Colonial Home', 'Classic 4-bed colonial with wrap-around porch. Updated kitchen, hardwood floors, mature trees.', '520,000', 'USD', '2,200 sq ft', 'clean', houseExtras),
            info('Modern New Build', '🏡 Modern New Build', 'Brand new 4-bed with open floor plan. Smart home features, energy-efficient, 2-car garage.', '680,000', 'USD', '2,800 sq ft', 'premium', houseExtras),
            info('Lakefront Estate', '🏡 Lakefront Estate', '5-bed luxury estate on 2 acres. Private dock, chef\'s kitchen, guest house. Breathtaking lake views.', '1,450,000', 'USD', '4,500 sq ft', 'premium', houseExtras),
          ],
        },
        {
          id: n(), label: '🏙️ Condos', behavior: 'menu', children: [
            info('Urban 1-Bed Condo', '🏙️ Urban 1-Bed', 'Sleek one-bedroom in a full-service building. Gym, rooftop pool, 24/7 doorman. HOA $450/mo.', '310,000', 'USD', '720 sq ft', 'clean', condoExtras),
            info('Corner 2-Bed Condo', '🏙️ Corner 2-Bed', 'Corner unit with tons of natural light. Two full baths, in-unit laundry, storage locker included.', '485,000', 'USD', '1,050 sq ft', 'friendly', condoExtras),
            info('Penthouse Condo', '🏙️ Penthouse Condo', 'Top-floor three-bedroom with double-height ceilings. Private elevator access and outdoor space.', '890,000', 'USD', '1,800 sq ft', 'premium', condoExtras),
          ],
        },
        {
          id: n(), label: '🏪 Commercial', behavior: 'menu', children: [
            info('Retail Space — Main St', '🏪 Retail Space', 'High-traffic corner retail space. Large storefront windows, ADA accessible, turnkey ready.', '2,500/mo', 'USD', '1,200 sq ft', 'clean', commercialExtras),
            info('Office Suite — Tower B', '🏢 Office Suite', 'Professional 8th-floor office suite. Conference room, kitchenette, fiber internet included.', '3,800/mo', 'USD', '2,000 sq ft', 'clean', commercialExtras),
            info('Warehouse — Industrial Park', '🏭 Warehouse', 'Climate-controlled warehouse with loading dock. 20-ft ceilings, 3-phase power, security system.', '4,200/mo', 'USD', '5,000 sq ft', 'friendly', commercialExtras),
          ],
        },
        {
          id: n(), label: '🌲 Land', behavior: 'menu', children: [
            info('Building Lot — Pine Ridge', '🌲 Building Lot', 'Ready-to-build 0.75 acre lot in Pine Ridge subdivision. Utilities at the street, approved site plan.', '95,000', 'USD', '0.75 acres', 'clean', landExtras),
            info('Farmland — County Rd 12', '🌾 Farmland Parcel', '15-acre parcel with rich soil and creek access. Currently zoned agricultural. Barn included.', '180,000', 'USD', '15 acres', 'friendly', landExtras),
            info('Wooded Lot — Lake Rd', '🌲 Wooded Lakefront Lot', '2.5 acres of wooded privacy near the lake. Ideal for a custom dream home.', '145,000', 'USD', '2.5 acres', 'premium', landExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Schedule Viewing', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Schedule a Viewing',
        description: 'Interested in a property? Let\'s set up a time for you to see it in person. Our agents are available 7 days a week.',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Schedule now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Call an Agent', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Speak with an Agent',
        description: 'Have questions about a listing? Our agents know every property inside and out.\n\n📱 +1 555-0220\n🕐 Mon–Sun, 9 AM – 7 PM\n\n💬 Or just reply here — we usually respond within minutes.',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Our Office', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Our Office',
        description: 'Come visit us for a chat about your property goals.\n\n📍 210 Commerce Ave, Suite 300\nDowntown Financial District\n\n🅿️ Free visitor parking\n☕ Complimentary coffee while we talk\n\n🕐 Mon–Fri 9 AM – 6 PM\n🕐 Sat–Sun 10 AM – 4 PM',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey! 🏠 Welcome to Skyline Realty. Looking to buy, rent, or sell? Browse our listings or schedule a tour.',
    buttons,
  };
}

// ── Car Rental: DriveEasy Rentals ──

function carRental() {
  let id = 5000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which vehicle are you interested in?',
      type: 'select_from_menu', key: 'step_service', label: 'Vehicle choice',
      menuRoot: 5001,
      options: [],
    },
    {
      id: n(), question: 'Cool! Can I get your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Rented with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning customer',
      options: [
        { id: n(), label: 'Yep been here before' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'When do you need the car?',
      type: 'choice_with_manual', key: 'step_date', label: 'Pickup date',
      manualPlaceholder: 'Type your pickup date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This weekend' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'Pickup time?',
      type: 'choice', key: 'step_time', label: 'Pickup time',
      options: [
        { id: n(), label: 'Morning (8–11)' },
        { id: n(), label: 'Midday (11–2)' },
        { id: n(), label: 'Afternoon (2–6)' },
      ],
    },
  ];

  // ── Extra steps per vehicle category ──

  const economyExtras = [
    {
      id: n(), question: 'How many days do you need it?',
      type: 'choice', key: 'step_rental_days', label: 'Rental period',
      options: [
        { id: n(), label: '1 day' },
        { id: n(), label: '2–3 days' },
        { id: n(), label: '4–7 days' },
        { id: n(), label: 'Over a week' },
      ],
    },
    {
      id: n(), question: 'Need insurance coverage?',
      type: 'choice', key: 'step_insurance', label: 'Insurance',
      options: [
        { id: n(), label: 'Yes full coverage' },
        { id: n(), label: 'Basic coverage is fine' },
        { id: n(), label: 'I have my own insurance' },
      ],
    },
  ];

  const suvExtras = [
    {
      id: n(), question: 'How many days?',
      type: 'choice', key: 'step_rental_days', label: 'Rental period',
      options: [
        { id: n(), label: '1–2 days' },
        { id: n(), label: '3–5 days' },
        { id: n(), label: 'A full week' },
        { id: n(), label: '2+ weeks' },
      ],
    },
    {
      id: n(), question: 'Will you be going off-road?',
      type: 'choice', key: 'step_offroad', label: 'Off-road use',
      options: [
        { id: n(), label: 'Yes dirt roads likely' },
        { id: n(), label: 'No just city and highway' },
      ],
    },
    {
      id: n(), question: 'Need any extras?',
      type: 'choice', key: 'step_extras', label: 'Add-ons',
      options: [
        { id: n(), label: 'Roof rack / cargo box' },
        { id: n(), label: 'Child seat' },
        { id: n(), label: 'GPS navigation' },
        { id: n(), label: 'Nothing extra' },
      ],
    },
  ];

  const luxuryExtras = [
    {
      id: n(), question: 'How many days?',
      type: 'choice', key: 'step_rental_days', label: 'Rental period',
      options: [
        { id: n(), label: '1 day (special occasion)' },
        { id: n(), label: '2–3 days' },
        { id: n(), label: 'Full week' },
      ],
    },
    {
      id: n(), question: 'What\'s the occasion?',
      type: 'choice', key: 'step_occasion', label: 'Occasion',
      options: [
        { id: n(), label: 'Business trip' },
        { id: n(), label: 'Wedding / event' },
        { id: n(), label: 'Weekend getaway' },
        { id: n(), label: 'Just treating myself 😎' },
      ],
    },
    {
      id: n(), question: 'Want a driver or self-drive?',
      type: 'choice', key: 'step_driver', label: 'Driver option',
      options: [
        { id: n(), label: 'Self-drive' },
        { id: n(), label: 'With a chauffeur' },
      ],
    },
  ];

  const vanExtras = [
    {
      id: n(), question: 'How many days?',
      type: 'choice', key: 'step_rental_days', label: 'Rental period',
      options: [
        { id: n(), label: '1 day' },
        { id: n(), label: '2–3 days' },
        { id: n(), label: '4–7 days' },
        { id: n(), label: 'Over a week' },
      ],
    },
    {
      id: n(), question: 'What are you using the van for?',
      type: 'choice', key: 'step_van_use', label: 'Van use',
      options: [
        { id: n(), label: 'Moving / hauling' },
        { id: n(), label: 'Group travel' },
        { id: n(), label: 'Road trip' },
        { id: n(), label: 'Delivery / business' },
      ],
    },
    {
      id: n(), question: 'How many passengers (including driver)?',
      type: 'choice', key: 'step_passengers', label: 'Passengers',
      options: [
        { id: n(), label: '1–2 people' },
        { id: n(), label: '3–5 people' },
        { id: n(), label: '6–8 people' },
        { id: n(), label: '9+ people' },
      ],
    },
  ];

  const convertibleExtras = [
    {
      id: n(), question: 'How many days?',
      type: 'choice', key: 'step_rental_days', label: 'Rental period',
      options: [
        { id: n(), label: 'Just today' },
        { id: n(), label: '2–3 days' },
        { id: n(), label: 'Full week' },
      ],
    },
    {
      id: n(), question: 'Need insurance coverage?',
      type: 'choice', key: 'step_insurance', label: 'Insurance',
      options: [
        { id: n(), label: 'Yes full coverage' },
        { id: n(), label: 'Basic is fine' },
        { id: n(), label: 'I\'ll use my own' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Reserve this', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 5001, label: '🚗 Our Fleet', behavior: 'menu', children: [
        {
          id: n(), label: '🚙 Economy', behavior: 'menu', children: [
            info('Toyota Corolla', '🚙 Toyota Corolla', 'Reliable and fuel-efficient. Automatic, A/C, Bluetooth. Perfect for city driving and errands.', 35, 'USD', 'per day', 'clean', economyExtras),
            info('Honda Civic', '🚙 Honda Civic', 'Smooth ride with great gas mileage. Apple CarPlay, backup camera, cruise control.', 38, 'USD', 'per day', 'clean', economyExtras),
            info('Hyundai Elantra', '🚙 Hyundai Elantra', 'Compact but roomy inside. Fuel saver with modern safety features. Great value.', 32, 'USD', 'per day', 'friendly', economyExtras),
          ],
        },
        {
          id: n(), label: '🚙 SUV', behavior: 'menu', children: [
            info('Toyota RAV4', '🚙 Toyota RAV4', 'Versatile mid-size SUV. AWD available, spacious cargo area, great for road trips with family.', 65, 'USD', 'per day', 'friendly', suvExtras),
            info('Jeep Grand Cherokee', '🚙 Jeep Grand Cherokee', 'Go anywhere in style. 4x4, leather seats, premium audio. Handles highways and trails alike.', 75, 'USD', 'per day', 'premium', suvExtras),
            info('Ford Explorer', '🚙 Ford Explorer', 'Full-size SUV for the whole crew. Three rows, Apple CarPlay, 360° camera. Comfort meets utility.', 80, 'USD', 'per day', 'friendly', suvExtras),
          ],
        },
        {
          id: n(), label: '✨ Luxury', behavior: 'menu', children: [
            info('BMW 5 Series', '✨ BMW 5 Series', 'Executive sedan with all the trimmings. Leather, sunroof, premium sound, driver assist. Arrive in style.', 120, 'USD', 'per day', 'premium', luxuryExtras),
            info('Mercedes E-Class', '✨ Mercedes E-Class', 'Refined luxury and cutting-edge tech. Ambient lighting, massage seats, MBUX infotainment.', 135, 'USD', 'per day', 'premium', luxuryExtras),
            info('Porsche Cayenne', '✨ Porsche Cayenne', 'Performance SUV that turns heads. Sport Chrono, adaptive suspension, panoramic roof.', 180, 'USD', 'per day', 'premium', luxuryExtras),
          ],
        },
        {
          id: n(), label: '🚐 Vans', behavior: 'menu', children: [
            info('Dodge Grand Caravan', '🚐 Dodge Grand Caravan', 'Family-friendly minivan. Stow-and-go seating, tons of cargo space, easy to drive.', 55, 'USD', 'per day', 'friendly', vanExtras),
            info('Ford Transit Cargo', '🚐 Ford Transit Cargo', 'Need to haul stuff? High-roof cargo van with 400+ cu ft of space. Loading ramp included.', 70, 'USD', 'per day', 'clean', vanExtras),
            info('Mercedes Sprinter', '🚐 Mercedes Sprinter', 'Premium 12-passenger van. Perfect for group travel, corporate events, or airport transfers.', 95, 'USD', 'per day', 'premium', vanExtras),
          ],
        },
        {
          id: n(), label: '🏎️ Convertibles', behavior: 'menu', children: [
            info('Ford Mustang Convertible', '🏎️ Ford Mustang', 'Drop the top and enjoy the ride. V8 power, leather, premium audio. The American classic.', 95, 'USD', 'per day', 'premium', convertibleExtras),
            info('Mazda MX-5 Miata', '🏎️ Mazda MX-5 Miata', 'Lightweight, nimble, and pure fun. Manual available. Built for driving enjoyment.', 75, 'USD', 'per day', 'friendly', convertibleExtras),
            info('BMW 4 Series Convertible', '🏎️ BMW 4 Series', 'Open-air luxury at its finest. Retractable hardtop, heated seats, sport mode.', 140, 'USD', 'per day', 'premium', convertibleExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book a Rental', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Rental',
        description: 'Ready to hit the road? Pick your car and dates — we\'ll have it clean and ready for you.',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Start booking', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Call Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Call Us',
        description: 'Need help choosing? Our team knows every car in the lot.\n\n📱 +1 555-0480\n🕐 Mon–Sun, 7 AM – 9 PM\n\n🚗 24/7 roadside assistance: +1 555-0481',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Pickup Locations', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Pickup Locations',
        description: 'Pick up or drop off at any of our locations:\n\n📍 Airport Terminal 2 — Open 24/7\n📍 Downtown — 55 Main St (7 AM – 9 PM)\n📍 Northside Mall — Level P2 (8 AM – 8 PM)\n\n🔑 After-hours key drop available at all locations',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey! 🚗 Welcome to DriveEasy Rentals. Need a car? Browse our fleet or book your ride below.',
    buttons,
  };
}

// ── Fitness / Gym: IronCore Fitness ──

function fitnessGym() {
  let id = 6000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which class or service interests you?',
      type: 'select_from_menu', key: 'step_service', label: 'Class / service',
      menuRoot: 6001,
      options: [],
    },
    {
      id: n(), question: 'Awesome! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Are you already a member?',
      type: 'choice', key: 'step_returning', label: 'Membership',
      options: [
        { id: n(), label: 'Yes I\'m a member' },
        { id: n(), label: 'No not yet' },
      ],
    },
    {
      id: n(), question: 'When do you want to start?',
      type: 'choice_with_manual', key: 'step_date', label: 'Start date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next Monday' },
      ],
    },
    {
      id: n(), question: 'Preferred time?',
      type: 'choice', key: 'step_time', label: 'Preferred time',
      options: [
        { id: n(), label: 'Early bird (6–9)' },
        { id: n(), label: 'Midday (11–2)' },
        { id: n(), label: 'After work (5–8)' },
        { id: n(), label: 'Late evening (8–10)' },
      ],
    },
  ];

  // ── Extra steps per category ──

  const strengthExtras = [
    {
      id: n(), question: 'What\'s your experience level?',
      type: 'choice', key: 'step_level', label: 'Experience level',
      options: [
        { id: n(), label: 'Beginner — just starting' },
        { id: n(), label: 'Intermediate — know my way around' },
        { id: n(), label: 'Advanced — lifting regularly' },
      ],
    },
    {
      id: n(), question: 'Any injuries or limitations we should know about?',
      type: 'text', key: 'step_injuries', label: 'Injuries / notes',
      options: [],
    },
  ];

  const cardioExtras = [
    {
      id: n(), question: 'What\'s your current fitness level?',
      type: 'choice', key: 'step_fitness_level', label: 'Fitness level',
      options: [
        { id: n(), label: 'Getting back into it' },
        { id: n(), label: 'Moderately active' },
        { id: n(), label: 'Pretty fit already' },
      ],
    },
    {
      id: n(), question: 'Do you have a heart rate monitor?',
      type: 'choice', key: 'step_hrmonitor', label: 'HR monitor',
      options: [
        { id: n(), label: 'Yes I\'ll bring it' },
        { id: n(), label: 'No' },
      ],
    },
  ];

  const yogaExtras = [
    {
      id: n(), question: 'Have you done yoga before?',
      type: 'choice', key: 'step_yoga_exp', label: 'Yoga experience',
      options: [
        { id: n(), label: 'Total beginner' },
        { id: n(), label: 'Done a few classes' },
        { id: n(), label: 'Regular practitioner' },
      ],
    },
    {
      id: n(), question: 'Do you have your own mat?',
      type: 'choice', key: 'step_mat', label: 'Yoga mat',
      options: [
        { id: n(), label: 'Yes bringing my own' },
        { id: n(), label: 'No need to borrow one' },
      ],
    },
  ];

  const ptExtras = [
    {
      id: n(), question: 'What\'s your main goal?',
      type: 'choice', key: 'step_goal', label: 'Fitness goal',
      options: [
        { id: n(), label: 'Lose weight' },
        { id: n(), label: 'Build muscle' },
        { id: n(), label: 'Improve endurance' },
        { id: n(), label: 'General health' },
        { id: n(), label: 'Rehab / recovery' },
      ],
    },
    {
      id: n(), question: 'How often can you train per week?',
      type: 'choice', key: 'step_frequency', label: 'Training frequency',
      options: [
        { id: n(), label: '1–2 times' },
        { id: n(), label: '3–4 times' },
        { id: n(), label: '5+ times' },
      ],
    },
    {
      id: n(), question: 'Anything else the trainer should know?',
      type: 'text', key: 'step_notes', label: 'Notes for trainer',
      options: [],
    },
  ];

  const martialExtras = [
    {
      id: n(), question: 'Any martial arts experience?',
      type: 'choice', key: 'step_ma_exp', label: 'Experience',
      options: [
        { id: n(), label: 'None — complete beginner' },
        { id: n(), label: 'Some — trained casually' },
        { id: n(), label: 'Yes — trained competitively' },
      ],
    },
    {
      id: n(), question: 'Will you need gloves and gear?',
      type: 'choice', key: 'step_gear', label: 'Gear needed',
      options: [
        { id: n(), label: 'Yes please' },
        { id: n(), label: 'No I have my own' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Sign up', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 6001, label: '💪 Classes & Training', behavior: 'menu', children: [
        {
          id: n(), label: '🏋️ Strength', behavior: 'menu', children: [
            info('Power Lifting', '🏋️ Power Lifting', 'Squat, bench, deadlift. Focused strength class with coaching on form. All levels welcome but expect to work hard.', 20, 'USD', '60 min', 'clean', strengthExtras),
            info('Functional Strength', '💪 Functional Strength', 'Real-world movements — push, pull, carry, squat. Build strength that actually helps in daily life.', 18, 'USD', '45 min', 'friendly', strengthExtras),
            info('Kettlebell Training', '🔔 Kettlebell', 'Full-body kettlebell workout. Explosive movements, core strength, and serious calorie burn.', 18, 'USD', '45 min', 'friendly', strengthExtras),
          ],
        },
        {
          id: n(), label: '🏃 Cardio', behavior: 'menu', children: [
            info('HIIT Class', '🔥 HIIT', 'High-intensity interval training. 30 seconds on, 15 off. Quick, effective, and absolutely sweat-soaked.', 15, 'USD', '30 min', 'friendly', cardioExtras),
            info('Spin Class', '🚴 Spin', 'Indoor cycling with pumping music and coached resistance intervals. Burn 400–600 calories per session.', 18, 'USD', '45 min', 'clean', cardioExtras),
            info('Treadmill Intervals', '🏃 Treadmill Intervals', 'Guided speed and incline intervals on the treadmill. Great for runners and beginners alike.', 12, 'USD', '30 min', 'clean', cardioExtras),
          ],
        },
        {
          id: n(), label: '🧘 Yoga & Flexibility', behavior: 'menu', children: [
            info('Vinyasa Flow', '🧘 Vinyasa Flow', 'Dynamic, breath-linked movement. Builds flexibility, balance, and calm. Moderate pace.', 16, 'USD', '60 min', 'friendly', yogaExtras),
            info('Hot Yoga', '🔥 Hot Yoga', 'Yoga in a heated room (95°F). Deep stretching and serious detox. Bring a towel and water.', 20, 'USD', '75 min', 'premium', yogaExtras),
            info('Stretch & Recover', '🙆 Stretch & Recover', 'Gentle guided stretching session. Perfect after a hard workout or a long day at a desk.', 12, 'USD', '30 min', 'clean', yogaExtras),
          ],
        },
        {
          id: n(), label: '🥊 Martial Arts', behavior: 'menu', children: [
            info('Boxing Fundamentals', '🥊 Boxing', 'Learn jabs, crosses, hooks. Great cardio and stress relief. Bags and gloves provided.', 22, 'USD', '60 min', 'friendly', martialExtras),
            info('Kickboxing', '🦵 Kickboxing', 'Punches and kicks in a high-energy class. Full-body workout with a martial arts twist.', 22, 'USD', '60 min', 'clean', martialExtras),
            info('Brazilian Jiu-Jitsu', '🥋 BJJ', 'Ground-based grappling art. Learn submissions, escapes, and positional control. Gi provided for beginners.', 25, 'USD', '75 min', 'premium', martialExtras),
          ],
        },
        {
          id: n(), label: '🎯 Personal Training', behavior: 'menu', children: [
            info('1-on-1 Session', '🎯 1-on-1 Training', 'One hour with a dedicated trainer. Customized workout, form coaching, and accountability. Results guaranteed.', 60, 'USD', '60 min', 'premium', ptExtras),
            info('Buddy Session (2 people)', '👥 Buddy Session', 'Train with a friend! Same personal attention, shared motivation, lower cost per person.', 45, 'USD', '60 min (per person)', 'friendly', ptExtras),
            info('Nutrition Consultation', '🥗 Nutrition Consult', 'Sit down with our certified nutritionist. Custom meal plan, macro targets, and grocery list.', 50, 'USD', '45 min', 'clean', ptExtras),
            info('Fitness Assessment', '📊 Fitness Assessment', 'Full baseline test — body comp, strength, cardio capacity, flexibility. Know where you stand.', 35, 'USD', '30 min', 'clean', ptExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book a Class', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Class',
        description: 'Pick a class and lock in your spot. Classes fill up fast — especially evenings and weekends!',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Contact Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Get in Touch',
        description: 'Questions about memberships, classes, or personal training?\n\n📱 +1 555-0610\n🕐 Mon–Fri 6 AM – 10 PM\n🕐 Sat–Sun 7 AM – 8 PM\n\n💬 Or message us right here — we reply fast.',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Us',
        description: 'Come sweat with us!\n\n📍 88 Fitness Blvd, 2nd Floor\nEast Side District\n\n🅿️ Free parking in back lot\n🚇 3 min from Metro Station\n\n🚿 Showers, lockers, and towels available\n💧 Water refill stations on every floor',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'What\'s up! 💪 Welcome to IronCore Fitness. Ready to train? Check out our classes or book a session.',
    buttons,
  };
}

// ── Hotel: The Grand Meridian ──

function hotel() {
  let id = 7000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which room type are you interested in?',
      type: 'select_from_menu', key: 'step_service', label: 'Room type',
      menuRoot: 7001,
      options: [],
    },
    {
      id: n(), question: 'Wonderful! Name for the reservation?',
      type: 'text', key: 'step_name', label: 'Guest name',
      options: [],
    },
    {
      id: n(), question: 'Have you stayed with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning guest',
      options: [
        { id: n(), label: 'Yes I\'ve stayed before' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'When are you checking in?',
      type: 'choice_with_manual', key: 'step_date', label: 'Check-in date',
      manualPlaceholder: 'Type your check-in date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This weekend' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'Approximate arrival time?',
      type: 'choice', key: 'step_time', label: 'Arrival time',
      options: [
        { id: n(), label: 'Before noon' },
        { id: n(), label: 'Afternoon (2–5)' },
        { id: n(), label: 'Evening (5–9)' },
        { id: n(), label: 'Late night (after 9)' },
      ],
    },
  ];

  // ── Extra steps per room category ──

  const standardExtras = [
    {
      id: n(), question: 'How many nights?',
      type: 'choice', key: 'step_nights', label: 'Nights',
      options: [
        { id: n(), label: '1 night' },
        { id: n(), label: '2–3 nights' },
        { id: n(), label: '4–6 nights' },
        { id: n(), label: 'Week or more' },
      ],
    },
    {
      id: n(), question: 'Bed preference?',
      type: 'choice', key: 'step_bed', label: 'Bed type',
      options: [
        { id: n(), label: 'King bed' },
        { id: n(), label: 'Two doubles' },
        { id: n(), label: 'No preference' },
      ],
    },
  ];

  const suiteExtras = [
    {
      id: n(), question: 'How many nights?',
      type: 'choice', key: 'step_nights', label: 'Nights',
      options: [
        { id: n(), label: '1–2 nights' },
        { id: n(), label: '3–5 nights' },
        { id: n(), label: '6+ nights' },
      ],
    },
    {
      id: n(), question: 'Is this a special occasion?',
      type: 'choice', key: 'step_occasion', label: 'Occasion',
      options: [
        { id: n(), label: 'Anniversary 💕' },
        { id: n(), label: 'Birthday 🎂' },
        { id: n(), label: 'Honeymoon 🥂' },
        { id: n(), label: 'Business trip' },
        { id: n(), label: 'Just a getaway' },
      ],
    },
    {
      id: n(), question: 'Any special requests?',
      type: 'text', key: 'step_requests', label: 'Special requests',
      options: [],
    },
  ];

  const familyExtras = [
    {
      id: n(), question: 'How many nights?',
      type: 'choice', key: 'step_nights', label: 'Nights',
      options: [
        { id: n(), label: '1–2 nights' },
        { id: n(), label: '3–5 nights' },
        { id: n(), label: 'Full week' },
      ],
    },
    {
      id: n(), question: 'How many kids?',
      type: 'choice', key: 'step_kids', label: 'Children',
      options: [
        { id: n(), label: '1 child' },
        { id: n(), label: '2 children' },
        { id: n(), label: '3+' },
      ],
    },
    {
      id: n(), question: 'Need a crib or extra bed?',
      type: 'choice', key: 'step_extra_bed', label: 'Extra bed/crib',
      options: [
        { id: n(), label: 'Crib please' },
        { id: n(), label: 'Extra rollaway bed' },
        { id: n(), label: 'Both' },
        { id: n(), label: 'Not needed' },
      ],
    },
  ];

  const spaRoomExtras = [
    {
      id: n(), question: 'How many nights?',
      type: 'choice', key: 'step_nights', label: 'Nights',
      options: [
        { id: n(), label: '1–2 nights' },
        { id: n(), label: '3–4 nights' },
        { id: n(), label: '5+ nights' },
      ],
    },
    {
      id: n(), question: 'Would you like a spa treatment added?',
      type: 'choice', key: 'step_spa', label: 'Spa add-on',
      options: [
        { id: n(), label: 'Yes — massage' },
        { id: n(), label: 'Yes — facial' },
        { id: n(), label: 'Yes — full spa day' },
        { id: n(), label: 'No thanks' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book room', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 7001, label: '🛏️ Rooms & Suites', behavior: 'menu', children: [
        {
          id: n(), label: '🛏️ Standard Rooms', behavior: 'menu', children: [
            info('Classic Room', '🛏️ Classic Room', 'Clean and comfortable. Queen bed, workspace, 42" TV, free Wi-Fi. Everything you need for a great stay.', 120, 'USD', 'per night', 'clean', standardExtras),
            info('Superior Room', '🛏️ Superior Room', 'A step up — king bed, city view, mini fridge, Nespresso machine. More space to relax.', 160, 'USD', 'per night', 'friendly', standardExtras),
            info('Deluxe Room', '🛏️ Deluxe Room', 'Spacious with a sitting area. King bed, rain shower, premium toiletries, bathrobes.', 200, 'USD', 'per night', 'premium', standardExtras),
          ],
        },
        {
          id: n(), label: '👑 Suites', behavior: 'menu', children: [
            info('Junior Suite', '👑 Junior Suite', 'Open-plan suite with separate lounge area. King bed, soaking tub, complimentary minibar.', 280, 'USD', 'per night', 'premium', suiteExtras),
            info('Executive Suite', '👑 Executive Suite', 'Full living room, dining area, and bedroom. Panoramic views, butler service, welcome champagne.', 420, 'USD', 'per night', 'premium', suiteExtras),
            info('Presidential Suite', '👑 Presidential Suite', 'Our finest. Two bedrooms, private terrace, grand piano, personal concierge. The ultimate experience.', 750, 'USD', 'per night', 'premium', suiteExtras),
          ],
        },
        {
          id: n(), label: '👨‍👩‍👧 Family Rooms', behavior: 'menu', children: [
            info('Family Standard', '👨‍👩‍👧 Family Standard', 'Two double beds, mini fridge, kid-friendly channel package. Close to the pool and play area.', 180, 'USD', 'per night', 'friendly', familyExtras),
            info('Family Suite', '👨‍👩‍👧 Family Suite', 'Separate bedroom for the kids, bunk beds, game console, and snack basket. Parents get their own space.', 260, 'USD', 'per night', 'friendly', familyExtras),
            info('Connecting Rooms', '👨‍👩‍👧 Connecting Rooms', 'Two rooms with an interior door. Perfect for larger families who want privacy but stay connected.', 220, 'USD', 'per night', 'clean', familyExtras),
          ],
        },
        {
          id: n(), label: '🧖 Spa & Wellness Rooms', behavior: 'menu', children: [
            info('Wellness Room', '🧖 Wellness Room', 'Aromatherapy diffuser, yoga mat, blackout curtains, herbal tea selection. Designed for total relaxation.', 190, 'USD', 'per night', 'friendly', spaRoomExtras),
            info('Spa Retreat Suite', '🧖 Spa Retreat Suite', 'In-room jacuzzi, steam shower, and direct access to the spa level. Robe and slippers included.', 340, 'USD', 'per night', 'premium', spaRoomExtras),
            info('Couple\'s Spa Package', '💑 Couple\'s Spa Package', 'Two-night stay with daily couple\'s massage, candlelit dinner, and late checkout. Romance redefined.', 600, 'USD', '2 nights', 'premium', spaRoomExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book a Room', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Room',
        description: 'Ready to plan your stay? Pick a room and your dates — we\'ll make sure everything is perfect.',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Front Desk', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Front Desk',
        description: 'Our front desk team is here around the clock.\n\n📱 +1 555-0700\n🕐 Open 24/7\n\n✉️ reservations@grandmeridian.com\n💬 Or just message us here!',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 The Grand Meridian',
        description: 'Located in the heart of the city.\n\n📍 1 Meridian Plaza\nWaterfront District\n\n✈️ 25 min from International Airport\n🚇 Adjacent to Central Station\n🅿️ Valet parking available ($30/night)\n\n🏊 Pool, spa, restaurant, and rooftop bar on-site',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Welcome to The Grand Meridian 🏨 Your stay starts here. Browse our rooms or book directly below.',
    buttons,
  };
}

// ── Pet Care: Paws & Whiskers Veterinary ──

function petCare() {
  let id = 8000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which service does your pet need?',
      type: 'select_from_menu', key: 'step_service', label: 'Service needed',
      menuRoot: 8001,
      options: [],
    },
    {
      id: n(), question: 'Got it! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Pet parent name',
      options: [],
    },
    {
      id: n(), question: 'Have you brought your pet to us before?',
      type: 'choice', key: 'step_returning', label: 'Existing client',
      options: [
        { id: n(), label: 'Yes we\'re regulars' },
        { id: n(), label: 'No first visit' },
      ],
    },
    {
      id: n(), question: 'When would you like to come in?',
      type: 'choice_with_manual', key: 'step_date', label: 'Appointment date',
      manualPlaceholder: 'Type a preferred date',
      options: [
        { id: n(), label: 'Today if available' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'Preferred time?',
      type: 'choice', key: 'step_time', label: 'Preferred time',
      options: [
        { id: n(), label: 'Morning (8–11)' },
        { id: n(), label: 'Afternoon (11–3)' },
        { id: n(), label: 'Late afternoon (3–6)' },
      ],
    },
  ];

  // ── Extra steps per service type ──

  const vetCheckExtras = [
    {
      id: n(), question: 'What kind of pet?',
      type: 'choice', key: 'step_pet_type', label: 'Pet type',
      options: [
        { id: n(), label: '🐕 Dog' },
        { id: n(), label: '🐈 Cat' },
        { id: n(), label: '🐰 Rabbit / small animal' },
        { id: n(), label: '🐦 Bird' },
      ],
    },
    {
      id: n(), question: 'What\'s your pet\'s name and approximate age?',
      type: 'text', key: 'step_pet_info', label: 'Pet name & age',
      options: [],
    },
    {
      id: n(), question: 'Is this a routine check or something specific?',
      type: 'choice', key: 'step_reason', label: 'Visit reason',
      options: [
        { id: n(), label: 'Annual check-up' },
        { id: n(), label: 'Something seems off' },
        { id: n(), label: 'Follow-up visit' },
        { id: n(), label: 'Behavioral concern' },
      ],
    },
  ];

  const vaccinationExtras = [
    {
      id: n(), question: 'What kind of pet?',
      type: 'choice', key: 'step_pet_type', label: 'Pet type',
      options: [
        { id: n(), label: '🐕 Dog' },
        { id: n(), label: '🐈 Cat' },
        { id: n(), label: '🐰 Other' },
      ],
    },
    {
      id: n(), question: 'Do you have their vaccination records?',
      type: 'choice', key: 'step_records', label: 'Vaccination records',
      options: [
        { id: n(), label: 'Yes I\'ll bring them' },
        { id: n(), label: 'No — need to check' },
        { id: n(), label: 'It\'s a first vaccination' },
      ],
    },
  ];

  const groomingExtras = [
    {
      id: n(), question: 'What kind of pet?',
      type: 'choice', key: 'step_pet_type', label: 'Pet type',
      options: [
        { id: n(), label: '🐕 Dog' },
        { id: n(), label: '🐈 Cat' },
      ],
    },
    {
      id: n(), question: 'What\'s the breed and size?',
      type: 'choice', key: 'step_size', label: 'Pet size',
      options: [
        { id: n(), label: 'Small (under 20 lbs)' },
        { id: n(), label: 'Medium (20–50 lbs)' },
        { id: n(), label: 'Large (50+ lbs)' },
      ],
    },
    {
      id: n(), question: 'Any matting, tangles, or skin issues?',
      type: 'choice', key: 'step_coat', label: 'Coat condition',
      options: [
        { id: n(), label: 'Coat is in good shape' },
        { id: n(), label: 'Some mats or tangles' },
        { id: n(), label: 'Skin irritation present' },
      ],
    },
  ];

  const dentalExtras = [
    {
      id: n(), question: 'What kind of pet?',
      type: 'choice', key: 'step_pet_type', label: 'Pet type',
      options: [
        { id: n(), label: '🐕 Dog' },
        { id: n(), label: '🐈 Cat' },
      ],
    },
    {
      id: n(), question: 'Have you noticed any symptoms?',
      type: 'choice', key: 'step_symptoms', label: 'Symptoms',
      options: [
        { id: n(), label: 'Bad breath' },
        { id: n(), label: 'Difficulty eating' },
        { id: n(), label: 'Bleeding gums' },
        { id: n(), label: 'Just overdue for a cleaning' },
      ],
    },
  ];

  const surgeryExtras = [
    {
      id: n(), question: 'What kind of pet?',
      type: 'choice', key: 'step_pet_type', label: 'Pet type',
      options: [
        { id: n(), label: '🐕 Dog' },
        { id: n(), label: '🐈 Cat' },
        { id: n(), label: '🐰 Other' },
      ],
    },
    {
      id: n(), question: 'What\'s the procedure for?',
      type: 'choice', key: 'step_procedure', label: 'Procedure type',
      options: [
        { id: n(), label: 'Spay / neuter' },
        { id: n(), label: 'Lump removal' },
        { id: n(), label: 'Dental extraction' },
        { id: n(), label: 'Orthopedic / injury' },
        { id: n(), label: 'Vet will advise' },
      ],
    },
    {
      id: n(), question: 'Any pre-existing conditions or medications?',
      type: 'text', key: 'step_conditions', label: 'Health notes',
      options: [],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book appointment', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 8001, label: '🐾 Services', behavior: 'menu', children: [
        {
          id: n(), label: '🩺 Vet Check-ups', behavior: 'menu', children: [
            info('Wellness Exam', '🩺 Wellness Exam', 'Full head-to-tail physical. Weight, temp, heart, lungs, joints, eyes, ears. Keep your buddy healthy.', 65, 'USD', '30 min', 'clean', vetCheckExtras),
            info('Sick Pet Visit', '🤒 Sick Pet Visit', 'Not acting like themselves? Our vet will examine symptoms and figure out what\'s going on.', 80, 'USD', '30 min', 'friendly', vetCheckExtras),
            info('Senior Pet Check-up', '🐾 Senior Pet Check-up', 'Comprehensive exam for older pets (7+). Includes bloodwork screening and joint assessment.', 110, 'USD', '45 min', 'premium', vetCheckExtras),
            info('New Pet First Visit', '🐶 New Pet Visit', 'Just brought home a new pet? Full check-up, parasite screening, and care plan to start things right.', 75, 'USD', '40 min', 'friendly', vetCheckExtras),
          ],
        },
        {
          id: n(), label: '💉 Vaccinations', behavior: 'menu', children: [
            info('Core Vaccines – Dog', '💉 Core Vaccines (Dog)', 'Distemper, parvo, rabies, adenovirus. Essential protection that every dog should have.', 45, 'USD', '15 min', 'clean', vaccinationExtras),
            info('Core Vaccines – Cat', '💉 Core Vaccines (Cat)', 'FVRCP and rabies. Keeps indoor and outdoor cats protected from serious diseases.', 40, 'USD', '15 min', 'clean', vaccinationExtras),
            info('Bordetella (Kennel Cough)', '💉 Bordetella', 'Required for boarding and dog parks. Quick nasal or injected vaccine — barely a fuss.', 25, 'USD', '10 min', 'friendly', vaccinationExtras),
            info('Flea & Tick Prevention', '🛡️ Flea & Tick', 'Monthly prevention plan. We\'ll prescribe the right product based on your pet\'s size and lifestyle.', 35, 'USD', '10 min', 'friendly', vaccinationExtras),
          ],
        },
        {
          id: n(), label: '✂️ Grooming', behavior: 'menu', children: [
            info('Bath & Brush', '🛁 Bath & Brush', 'Warm bath, gentle shampoo, blow dry, and thorough brushing. Your pet will smell amazing.', 40, 'USD', '45 min', 'friendly', groomingExtras),
            info('Full Grooming Package', '✂️ Full Groom', 'Bath, haircut, nail trim, ear cleaning, and gland expression. The complete spa day for your pet.', 70, 'USD', '90 min', 'premium', groomingExtras),
            info('Nail Trim', '💅 Nail Trim', 'Quick and safe nail clipping. We go slow for nervous pets. Treat included.', 15, 'USD', '10 min', 'clean', groomingExtras),
            info('De-shedding Treatment', '🐕 De-shedding', 'Special shampoo and tools to remove loose undercoat. Dramatically reduces shedding at home.', 55, 'USD', '60 min', 'friendly', groomingExtras),
          ],
        },
        {
          id: n(), label: '🦷 Dental Care', behavior: 'menu', children: [
            info('Dental Cleaning', '🦷 Dental Cleaning', 'Professional teeth cleaning under light sedation. Removes tartar, polishes teeth, checks for issues.', 180, 'USD', '60 min', 'clean', dentalExtras),
            info('Dental Check-up', '🔍 Dental Check-up', 'Visual exam and assessment without sedation. Great for catching problems early.', 50, 'USD', '20 min', 'friendly', dentalExtras),
          ],
        },
        {
          id: n(), label: '🏥 Surgery', behavior: 'menu', children: [
            info('Spay / Neuter', '🏥 Spay / Neuter', 'Routine procedure with full anesthesia, monitoring, and pain management. Includes follow-up visit.', 250, 'USD', 'half day', 'clean', surgeryExtras),
            info('Lump Removal', '🏥 Lump Removal', 'Biopsy and surgical removal of skin lumps. Sent to lab for analysis. Peace of mind.', 350, 'USD', 'half day', 'premium', surgeryExtras),
            info('Surgical Consultation', '🏥 Surgical Consult', 'Pre-surgery assessment and planning. Vet will explain the procedure, risks, and recovery plan.', 80, 'USD', '30 min', 'clean', surgeryExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book Appointment', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book an Appointment',
        description: 'Your furry friend deserves the best care. Pick a service and we\'ll find the perfect time for you both 🐾',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '🚨 Emergency', behavior: 'info', children: [],
      infoPage: {
        title: '🚨 Emergency Line',
        description: 'If your pet needs urgent care, don\'t wait.\n\n📱 Emergency: +1 555-0850\n🕐 Emergency line open 24/7\n\n⚠️ Signs to watch for:\n• Difficulty breathing\n• Severe bleeding\n• Seizures\n• Ingested something toxic\n\nCall first — we\'ll prepare for your arrival.',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Us',
        description: 'Bring your pet by — we\'d love to meet them!\n\n📍 34 Oak Park Drive\nGreenfield Village\n\n🅿️ Free parking with easy pet access\n🐕 Separate dog and cat waiting areas\n\n🕐 Mon–Fri 8 AM – 6 PM\n🕐 Sat 9 AM – 3 PM\n🕐 Sun — Emergencies only',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hi there! 🐾 Welcome to Paws & Whiskers. Your pet\'s health and happiness is our priority. How can we help?',
    buttons,
  };
}

// ── Education / Tutoring: BrightPath Academy ──

function education() {
  let id = 9000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which subject or program are you interested in?',
      type: 'select_from_menu', key: 'step_service', label: 'Subject',
      menuRoot: 9001,
      options: [],
    },
    {
      id: n(), question: 'What\'s your name (or the student\'s name)?',
      type: 'text', key: 'step_name', label: 'Student name',
      options: [],
    },
    {
      id: n(), question: 'Have you studied with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning student',
      options: [
        { id: n(), label: 'Yes I\'m a current student' },
        { id: n(), label: 'No this is new' },
      ],
    },
    {
      id: n(), question: 'When would you like to start?',
      type: 'choice_with_manual', key: 'step_date', label: 'Start date',
      manualPlaceholder: 'Type a preferred start date',
      options: [
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
        { id: n(), label: 'Next month' },
        { id: n(), label: 'Just exploring for now' },
      ],
    },
    {
      id: n(), question: 'Preferred class time?',
      type: 'choice', key: 'step_time', label: 'Preferred time',
      options: [
        { id: n(), label: 'Morning (9–12)' },
        { id: n(), label: 'Afternoon (2–5)' },
        { id: n(), label: 'Evening (6–9)' },
        { id: n(), label: 'Weekends only' },
      ],
    },
  ];

  const mathExtras = [
    {
      id: n(), question: 'What grade or level?',
      type: 'choice', key: 'step_level', label: 'Level',
      options: [
        { id: n(), label: 'Elementary (1–5)' },
        { id: n(), label: 'Middle school (6–8)' },
        { id: n(), label: 'High school (9–12)' },
        { id: n(), label: 'College / university' },
      ],
    },
    {
      id: n(), question: 'What topic do you need help with?',
      type: 'choice', key: 'step_topic', label: 'Math topic',
      options: [
        { id: n(), label: 'Algebra' },
        { id: n(), label: 'Geometry' },
        { id: n(), label: 'Calculus' },
        { id: n(), label: 'Statistics' },
        { id: n(), label: 'General math help' },
      ],
    },
  ];

  const languageExtras = [
    {
      id: n(), question: 'What\'s your current skill level?',
      type: 'choice', key: 'step_proficiency', label: 'Current level',
      options: [
        { id: n(), label: 'Complete beginner' },
        { id: n(), label: 'Basic / elementary' },
        { id: n(), label: 'Intermediate' },
        { id: n(), label: 'Advanced — want to polish' },
      ],
    },
    {
      id: n(), question: 'Why are you learning?',
      type: 'choice', key: 'step_goal', label: 'Learning goal',
      options: [
        { id: n(), label: 'Work / business' },
        { id: n(), label: 'Travel' },
        { id: n(), label: 'School exam' },
        { id: n(), label: 'Personal interest' },
      ],
    },
  ];

  const scienceExtras = [
    {
      id: n(), question: 'What grade or level?',
      type: 'choice', key: 'step_level', label: 'Level',
      options: [
        { id: n(), label: 'Middle school' },
        { id: n(), label: 'High school' },
        { id: n(), label: 'AP / IB level' },
        { id: n(), label: 'College' },
      ],
    },
    {
      id: n(), question: 'Is this for exam prep or general understanding?',
      type: 'choice', key: 'step_purpose', label: 'Purpose',
      options: [
        { id: n(), label: 'Exam coming up soon' },
        { id: n(), label: 'Struggling with concepts' },
        { id: n(), label: 'Want to get ahead' },
      ],
    },
  ];

  const testPrepExtras = [
    {
      id: n(), question: 'Which test?',
      type: 'choice', key: 'step_test', label: 'Test type',
      options: [
        { id: n(), label: 'SAT' },
        { id: n(), label: 'ACT' },
        { id: n(), label: 'GRE' },
        { id: n(), label: 'GMAT' },
        { id: n(), label: 'TOEFL / IELTS' },
      ],
    },
    {
      id: n(), question: 'When is the test date?',
      type: 'choice', key: 'step_test_date', label: 'Test timeline',
      options: [
        { id: n(), label: 'Less than a month' },
        { id: n(), label: '1–3 months' },
        { id: n(), label: '3–6 months' },
        { id: n(), label: 'Haven\'t registered yet' },
      ],
    },
  ];

  const musicExtras = [
    {
      id: n(), question: 'Any prior experience?',
      type: 'choice', key: 'step_experience', label: 'Experience',
      options: [
        { id: n(), label: 'Total beginner' },
        { id: n(), label: 'Played a little before' },
        { id: n(), label: 'Intermediate — want to improve' },
        { id: n(), label: 'Advanced — performance level' },
      ],
    },
    {
      id: n(), question: 'Do you have your own instrument?',
      type: 'choice', key: 'step_instrument', label: 'Own instrument',
      options: [
        { id: n(), label: 'Yes' },
        { id: n(), label: 'No need to borrow / rent' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Enroll now', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 9001, label: '📚 Programs', behavior: 'menu', children: [
        {
          id: n(), label: '🔢 Math', behavior: 'menu', children: [
            info('Algebra Fundamentals', '🔢 Algebra Fundamentals', '1-on-1 tutoring to master equations, inequalities, and functions. We build confidence step by step.', 45, 'USD', '60 min', 'clean', mathExtras),
            info('Geometry & Trigonometry', '📐 Geometry & Trig', 'Proofs, shapes, angles, and trig ratios. Visual approach makes it click. Homework help included.', 45, 'USD', '60 min', 'clean', mathExtras),
            info('Calculus Coaching', '📈 Calculus', 'Limits, derivatives, integrals. Whether it\'s AP Calc or college-level, we\'ll get you through it.', 55, 'USD', '60 min', 'premium', mathExtras),
            info('Statistics Help', '📊 Statistics', 'Probability, distributions, hypothesis testing. Real-world examples that make stats actually interesting.', 50, 'USD', '60 min', 'friendly', mathExtras),
          ],
        },
        {
          id: n(), label: '🌍 Languages', behavior: 'menu', children: [
            info('English (ESL)', '🇺🇸 English (ESL)', 'Conversational English, grammar, writing, and pronunciation. All levels welcome. Native-speaking tutor.', 40, 'USD', '60 min', 'friendly', languageExtras),
            info('Spanish', '🇪🇸 Spanish', 'From hola to fluency. Grammar, vocab, and real conversation practice. Immersive and fun.', 40, 'USD', '60 min', 'friendly', languageExtras),
            info('French', '🇫🇷 French', 'Bonjour! Master pronunciation, grammar, and culture. Great for travel, school, or career.', 40, 'USD', '60 min', 'clean', languageExtras),
            info('Mandarin Chinese', '🇨🇳 Mandarin', 'Pinyin, characters, tones, and conversation. Patient instruction for all levels.', 50, 'USD', '60 min', 'premium', languageExtras),
          ],
        },
        {
          id: n(), label: '🔬 Science', behavior: 'menu', children: [
            info('Biology', '🧬 Biology', 'Cells, genetics, ecology, anatomy. Clear explanations with diagrams and practice problems.', 45, 'USD', '60 min', 'clean', scienceExtras),
            info('Chemistry', '⚗️ Chemistry', 'Reactions, stoichiometry, organic chem. We break down complex concepts into simple steps.', 50, 'USD', '60 min', 'clean', scienceExtras),
            info('Physics', '⚡ Physics', 'Mechanics, electricity, waves, thermodynamics. Problem-solving focused with real examples.', 50, 'USD', '60 min', 'friendly', scienceExtras),
          ],
        },
        {
          id: n(), label: '📝 Test Prep', behavior: 'menu', children: [
            info('SAT Prep', '📝 SAT Prep', 'Targeted strategies for both Math and Verbal. Practice tests, score analysis, and time management.', 65, 'USD', '90 min', 'premium', testPrepExtras),
            info('ACT Prep', '📝 ACT Prep', 'Full coverage — English, Math, Reading, Science. Timed drills and test-day strategies.', 65, 'USD', '90 min', 'premium', testPrepExtras),
            info('GRE / GMAT Prep', '📝 GRE / GMAT', 'Verbal reasoning, quantitative, and analytical writing. Score improvement guarantee.', 75, 'USD', '90 min', 'premium', testPrepExtras),
          ],
        },
        {
          id: n(), label: '🎵 Music', behavior: 'menu', children: [
            info('Piano Lessons', '🎹 Piano', 'Classical or contemporary. Sight-reading, technique, and musicality. All ages and levels.', 50, 'USD', '45 min', 'friendly', musicExtras),
            info('Guitar Lessons', '🎸 Guitar', 'Acoustic or electric. Chords, fingerpicking, strumming, and songs. You\'ll be playing in weeks.', 45, 'USD', '45 min', 'friendly', musicExtras),
            info('Vocal Coaching', '🎤 Vocal Coaching', 'Breath control, range, tone, and performance confidence. Pop, classical, or musical theater.', 55, 'USD', '45 min', 'premium', musicExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book a Session', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Session',
        description: 'Ready to learn? Pick your subject and schedule a session. First lesson includes a free assessment!',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Contact Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Reach Us',
        description: 'Questions about programs, schedules, or pricing?\n\n📱 +1 555-0920\n✉️ hello@brightpathacademy.com\n🕐 Mon–Fri 8 AM – 8 PM\n🕐 Sat 9 AM – 5 PM',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Us',
        description: 'Learn in a calm, focused environment.\n\n📍 55 Scholar Lane, Suite 200\nUniversity District\n\n🅿️ Free parking in rear lot\n🚇 Near Campus Station\n\n💻 Online sessions also available via Zoom',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey! 📚 Welcome to BrightPath Academy. We make learning easier. What subject can we help with?',
    buttons,
  };
}

// ── Auto Repair / Mechanic: TrustWrench Auto ──

function autoRepair() {
  let id = 10000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'What service does your car need?',
      type: 'select_from_menu', key: 'step_service', label: 'Service needed',
      menuRoot: 10001,
      options: [],
    },
    {
      id: n(), question: 'Thanks! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you been to our shop before?',
      type: 'choice', key: 'step_returning', label: 'Returning customer',
      options: [
        { id: n(), label: 'Yes been here before' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'When do you want to bring it in?',
      type: 'choice_with_manual', key: 'step_date', label: 'Drop-off date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'Preferred drop-off time?',
      type: 'choice', key: 'step_time', label: 'Drop-off time',
      options: [
        { id: n(), label: 'Early morning (7–9)' },
        { id: n(), label: 'Morning (9–12)' },
        { id: n(), label: 'Afternoon (12–5)' },
      ],
    },
  ];

  const oilExtras = [
    {
      id: n(), question: 'What vehicle do you drive? (make, model, year)',
      type: 'text', key: 'step_vehicle', label: 'Vehicle info',
      options: [],
    },
    {
      id: n(), question: 'Oil preference?',
      type: 'choice', key: 'step_oil_type', label: 'Oil type',
      options: [
        { id: n(), label: 'Conventional' },
        { id: n(), label: 'Synthetic blend' },
        { id: n(), label: 'Full synthetic' },
        { id: n(), label: 'Not sure — recommend for me' },
      ],
    },
  ];

  const brakeExtras = [
    {
      id: n(), question: 'What vehicle? (make, model, year)',
      type: 'text', key: 'step_vehicle', label: 'Vehicle info',
      options: [],
    },
    {
      id: n(), question: 'What are you experiencing?',
      type: 'choice', key: 'step_symptoms', label: 'Brake symptoms',
      options: [
        { id: n(), label: 'Squeaking or grinding' },
        { id: n(), label: 'Soft brake pedal' },
        { id: n(), label: 'Pulling to one side' },
        { id: n(), label: 'Routine check / replacement' },
      ],
    },
  ];

  const tireExtras = [
    {
      id: n(), question: 'What vehicle? (make, model, year)',
      type: 'text', key: 'step_vehicle', label: 'Vehicle info',
      options: [],
    },
    {
      id: n(), question: 'What do you need?',
      type: 'choice', key: 'step_tire_need', label: 'Tire service',
      options: [
        { id: n(), label: 'New tires (all 4)' },
        { id: n(), label: 'Replace 1 or 2 tires' },
        { id: n(), label: 'Rotation only' },
        { id: n(), label: 'Flat repair' },
      ],
    },
  ];

  const engineExtras = [
    {
      id: n(), question: 'What vehicle? (make, model, year)',
      type: 'text', key: 'step_vehicle', label: 'Vehicle info',
      options: [],
    },
    {
      id: n(), question: 'Is the check engine light on?',
      type: 'choice', key: 'step_check_light', label: 'Check engine light',
      options: [
        { id: n(), label: 'Yes solid' },
        { id: n(), label: 'Yes flashing' },
        { id: n(), label: 'No' },
      ],
    },
    {
      id: n(), question: 'Describe what\'s happening (noises, behavior, etc.)',
      type: 'text', key: 'step_description', label: 'Issue description',
      options: [],
    },
  ];

  const acExtras = [
    {
      id: n(), question: 'What vehicle? (make, model, year)',
      type: 'text', key: 'step_vehicle', label: 'Vehicle info',
      options: [],
    },
    {
      id: n(), question: 'What\'s the issue?',
      type: 'choice', key: 'step_ac_issue', label: 'A/C issue',
      options: [
        { id: n(), label: 'Not blowing cold' },
        { id: n(), label: 'Weak airflow' },
        { id: n(), label: 'Strange smell' },
        { id: n(), label: 'Routine recharge' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book service', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 10001, label: '🔧 Services', behavior: 'menu', children: [
        {
          id: n(), label: '🛢️ Oil & Fluids', behavior: 'menu', children: [
            info('Oil Change', '🛢️ Oil Change', 'Full oil change with new filter. We check all fluid levels and top off as needed.', 45, 'USD', '30 min', 'clean', oilExtras),
            info('Transmission Fluid', '🛢️ Transmission Fluid', 'Flush and replace old transmission fluid. Keeps your shifts smooth and extends transmission life.', 120, 'USD', '60 min', 'friendly', oilExtras),
            info('Coolant Flush', '❄️ Coolant Flush', 'Drain, flush, and refill cooling system. Prevents overheating and protects against corrosion.', 80, 'USD', '45 min', 'clean', oilExtras),
          ],
        },
        {
          id: n(), label: '🛑 Brakes', behavior: 'menu', children: [
            info('Brake Inspection', '🛑 Brake Inspection', 'Full brake system check — pads, rotors, calipers, fluid. Know exactly where you stand.', 35, 'USD', '30 min', 'clean', brakeExtras),
            info('Brake Pad Replacement', '🛑 Brake Pads', 'Front or rear pad replacement with premium pads. Includes rotor inspection.', 150, 'USD', '90 min', 'friendly', brakeExtras),
            info('Brake Rotor Service', '🛑 Rotor Service', 'Resurface or replace worn rotors. Eliminates vibration and restores stopping power.', 220, 'USD', '120 min', 'premium', brakeExtras),
          ],
        },
        {
          id: n(), label: '🔄 Tires', behavior: 'menu', children: [
            info('Tire Rotation', '🔄 Tire Rotation', 'Rotate all four tires for even wear. Extends tire life and improves handling.', 30, 'USD', '20 min', 'clean', tireExtras),
            info('New Tires', '🔄 New Tires', 'Quality tires from top brands. Price per tire — includes mounting, balancing, and alignment check.', 120, 'USD', 'per tire', 'friendly', tireExtras),
            info('Flat Tire Repair', '🔄 Flat Repair', 'Patch and plug for repairable punctures. Back on the road in no time.', 25, 'USD', '20 min', 'clean', tireExtras),
            info('Wheel Alignment', '🔄 Alignment', 'Precision 4-wheel alignment. Stops uneven tire wear and pulling.', 80, 'USD', '45 min', 'friendly', tireExtras),
          ],
        },
        {
          id: n(), label: '🔧 Engine & Diagnostics', behavior: 'menu', children: [
            info('Engine Diagnostic', '🔧 Engine Diagnostic', 'Full computer scan plus hands-on inspection. We\'ll find out exactly what\'s wrong.', 75, 'USD', '45 min', 'clean', engineExtras),
            info('Tune-Up', '🔧 Tune-Up', 'Spark plugs, air filter, fuel filter, and system check. Restore power and fuel economy.', 180, 'USD', '90 min', 'friendly', engineExtras),
            info('Belt Replacement', '🔧 Belt Service', 'Serpentine or timing belt replacement. Don\'t wait for it to snap — preventive is cheaper.', 200, 'USD', '120 min', 'clean', engineExtras),
          ],
        },
        {
          id: n(), label: '❄️ A/C & Heating', behavior: 'menu', children: [
            info('A/C Recharge', '❄️ A/C Recharge', 'Evacuate and refill refrigerant. Leak check included. Get cold air blowing again.', 90, 'USD', '45 min', 'friendly', acExtras),
            info('A/C Diagnostic', '❄️ A/C Diagnostic', 'Full system test — compressor, condenser, evaporator, lines. Pinpoint the problem.', 60, 'USD', '30 min', 'clean', acExtras),
            info('Heater Core Service', '🌡️ Heater Core', 'Flush or replace heater core. Fix that cold cabin in winter.', 180, 'USD', '120 min', 'clean', acExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book Service', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Service',
        description: 'Bring your car in — no appointment needed for small jobs, but booking guarantees your spot for bigger work.',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Call the Shop', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Call Us',
        description: 'Weird noise? Dashboard light? Just ask — we\'re happy to help over the phone.\n\n📱 +1 555-1020\n🕐 Mon–Fri 7 AM – 6 PM\n🕐 Sat 8 AM – 3 PM\n\n🚗 Free towing within 10 miles for major repairs',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Location', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Find Our Shop',
        description: 'Easy to find, hard to beat.\n\n📍 740 Motor Ave\nIndustrial District\n\n🅿️ Drive right in — 6 service bays\n☕ Free coffee in the waiting area\n📺 Wi-Fi and TV while you wait\n\n🕐 Mon–Fri 7 AM – 6 PM\n🕐 Sat 8 AM – 3 PM',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey! 🔧 Welcome to TrustWrench Auto. Car trouble? Or just time for maintenance? We\'ve got you covered.',
    buttons,
  };
}

// ── Photography Studio: FrameLight Studios ──

function photography() {
  let id = 11000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'What type of shoot are you interested in?',
      type: 'select_from_menu', key: 'step_service', label: 'Shoot type',
      menuRoot: 11001,
      options: [],
    },
    {
      id: n(), question: 'Love it! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Worked with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning client',
      options: [
        { id: n(), label: 'Yes love your work' },
        { id: n(), label: 'No it\'s my first time' },
      ],
    },
    {
      id: n(), question: 'When\'s the shoot date?',
      type: 'choice_with_manual', key: 'step_date', label: 'Shoot date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
        { id: n(), label: 'This month' },
        { id: n(), label: '2+ months out' },
      ],
    },
    {
      id: n(), question: 'Preferred time?',
      type: 'choice', key: 'step_time', label: 'Shoot time',
      options: [
        { id: n(), label: 'Morning (golden hour)' },
        { id: n(), label: 'Midday (studio)' },
        { id: n(), label: 'Afternoon' },
        { id: n(), label: 'Sunset (golden hour)' },
      ],
    },
  ];

  const portraitExtras = [
    {
      id: n(), question: 'How many people in the shoot?',
      type: 'choice', key: 'step_people', label: 'People count',
      options: [
        { id: n(), label: 'Just me' },
        { id: n(), label: 'Couple (2)' },
        { id: n(), label: 'Small group (3–5)' },
        { id: n(), label: 'Large group (6+)' },
      ],
    },
    {
      id: n(), question: 'Studio or outdoor?',
      type: 'choice', key: 'step_location', label: 'Shoot location',
      options: [
        { id: n(), label: 'In our studio' },
        { id: n(), label: 'Outdoor on location' },
        { id: n(), label: 'Not sure yet' },
      ],
    },
  ];

  const weddingExtras = [
    {
      id: n(), question: 'How many hours of coverage?',
      type: 'choice', key: 'step_hours', label: 'Coverage hours',
      options: [
        { id: n(), label: '4 hours (ceremony)' },
        { id: n(), label: '6 hours (ceremony + reception)' },
        { id: n(), label: '8+ hours (full day)' },
      ],
    },
    {
      id: n(), question: 'Do you also need video?',
      type: 'choice', key: 'step_video', label: 'Video needed',
      options: [
        { id: n(), label: 'Yes photo + video package' },
        { id: n(), label: 'No just photos' },
      ],
    },
    {
      id: n(), question: 'Any must-have shots or styles?',
      type: 'text', key: 'step_style_notes', label: 'Style preferences',
      options: [],
    },
  ];

  const productExtras = [
    {
      id: n(), question: 'How many products to shoot?',
      type: 'choice', key: 'step_product_count', label: 'Product count',
      options: [
        { id: n(), label: '1–5 products' },
        { id: n(), label: '6–15 products' },
        { id: n(), label: '16–30 products' },
        { id: n(), label: '30+' },
      ],
    },
    {
      id: n(), question: 'What are the for?',
      type: 'choice', key: 'step_usage', label: 'Photo usage',
      options: [
        { id: n(), label: 'E-commerce / website' },
        { id: n(), label: 'Social media' },
        { id: n(), label: 'Print catalog' },
        { id: n(), label: 'Amazon / marketplace listing' },
      ],
    },
  ];

  const eventExtras = [
    {
      id: n(), question: 'What kind of event?',
      type: 'choice', key: 'step_event_type', label: 'Event type',
      options: [
        { id: n(), label: 'Corporate event' },
        { id: n(), label: 'Birthday party' },
        { id: n(), label: 'Conference / seminar' },
        { id: n(), label: 'Other celebration' },
      ],
    },
    {
      id: n(), question: 'Expected number of guests?',
      type: 'choice', key: 'step_guests', label: 'Guest count',
      options: [
        { id: n(), label: 'Under 50' },
        { id: n(), label: '50–100' },
        { id: n(), label: '100–200' },
        { id: n(), label: '200+' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book shoot', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 11001, label: '📸 Our Packages', behavior: 'menu', children: [
        {
          id: n(), label: '🧑 Portraits', behavior: 'menu', children: [
            info('Headshot Session', '🧑 Headshot', 'Professional headshot for LinkedIn, business, or casting. Includes retouching on 3 best shots.', 150, 'USD', '30 min', 'clean', portraitExtras),
            info('Personal Portrait', '🧑 Personal Portrait', 'Relaxed portrait session — capture your personality. Indoor or outdoor. 10 edited images delivered.', 200, 'USD', '60 min', 'friendly', portraitExtras),
            info('Family Portrait', '👨‍👩‍👧 Family Portrait', 'Fun and natural family photos. We work with kids of all ages. 15 edited images.', 280, 'USD', '90 min', 'friendly', portraitExtras),
          ],
        },
        {
          id: n(), label: '💒 Weddings', behavior: 'menu', children: [
            info('Engagement Shoot', '💍 Engagement Shoot', 'Celebrate your love story. 1-hour session at a location of your choice. 25 edited images.', 350, 'USD', '60 min', 'premium', weddingExtras),
            info('Wedding Half-Day', '💒 Wedding Half-Day', 'Ceremony coverage + couple portraits. Two photographers, 200+ edited images, online gallery.', 1500, 'USD', '4 hours', 'premium', weddingExtras),
            info('Wedding Full-Day', '💒 Wedding Full-Day', 'Getting ready through last dance. Two photographers + assistant. 400+ images, highlight video.', 3000, 'USD', '8+ hours', 'premium', weddingExtras),
          ],
        },
        {
          id: n(), label: '📦 Product Photography', behavior: 'menu', children: [
            info('Basic Product Shots', '📦 Basic Product', 'Clean white-background shots. Perfect for e-commerce. Up to 5 products, 3 angles each.', 200, 'USD', '60 min', 'clean', productExtras),
            info('Lifestyle Product Shots', '📦 Lifestyle Product', 'Styled shots with props and context. Makes your product pop on social media.', 350, 'USD', '90 min', 'friendly', productExtras),
            info('Flat Lay Collection', '📦 Flat Lay', 'Top-down styled arrangement. Great for fashion, cosmetics, food. Up to 10 setups.', 300, 'USD', '90 min', 'friendly', productExtras),
          ],
        },
        {
          id: n(), label: '🎉 Events', behavior: 'menu', children: [
            info('Corporate Event', '🎉 Corporate Event', 'Professional coverage of your company event. Headshots, candids, group photos. Delivered in 48 hours.', 500, 'USD', '3 hours', 'clean', eventExtras),
            info('Birthday / Party', '🎂 Birthday / Party', 'Capture all the fun moments. Candid and posed shots. 100+ edited images.', 350, 'USD', '2 hours', 'friendly', eventExtras),
            info('Conference Coverage', '🎤 Conference', 'Speakers, panels, networking, branding — full visual documentation. Two photographers.', 800, 'USD', 'full day', 'premium', eventExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book a Shoot', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Shoot',
        description: 'Let\'s create something beautiful together. Pick your package and date — we\'ll handle the rest 📷',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Contact', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Get in Touch',
        description: 'Want to discuss your vision? We love creative briefs.\n\n📱 +1 555-1100\n✉️ hello@framelightstudios.com\n📸 Instagram: @framelightstudios\n\n🕐 Mon–Sat 9 AM – 7 PM',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Studio', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Our Studio',
        description: 'A creative space designed for great shots.\n\n📍 12 Shutter Lane, Loft 3B\nArts District\n\n🏠 2,000 sq ft studio with 3 backdrops\n💡 Professional lighting setups\n👗 Changing room available\n🅿️ Free street parking',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hi! 📸 Welcome to FrameLight Studios. Ready to capture some amazing moments? Check out our packages below.',
    buttons,
  };
}

// ── Law Firm: Sterling & Associates ──

function lawFirm() {
  let id = 12000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which area of law do you need help with?',
      type: 'select_from_menu', key: 'step_service', label: 'Legal area',
      menuRoot: 12001,
      options: [],
    },
    {
      id: n(), question: 'Got it. What\'s your full name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you consulted with us before?',
      type: 'choice', key: 'step_returning', label: 'Existing client',
      options: [
        { id: n(), label: 'Yes I\'m a client' },
        { id: n(), label: 'No this is my first time' },
      ],
    },
    {
      id: n(), question: 'When would you like to meet?',
      type: 'choice_with_manual', key: 'step_date', label: 'Meeting date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'As soon as possible' },
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
        { id: n(), label: 'I\'m flexible' },
      ],
    },
    {
      id: n(), question: 'Preferred meeting time?',
      type: 'choice', key: 'step_time', label: 'Meeting time',
      options: [
        { id: n(), label: 'Morning (9–12)' },
        { id: n(), label: 'Afternoon (1–4)' },
        { id: n(), label: 'Late afternoon (4–6)' },
      ],
    },
  ];

  const familyExtras = [
    {
      id: n(), question: 'What\'s the specific matter?',
      type: 'choice', key: 'step_matter', label: 'Family matter',
      options: [
        { id: n(), label: 'Divorce' },
        { id: n(), label: 'Child custody' },
        { id: n(), label: 'Prenuptial agreement' },
        { id: n(), label: 'Adoption' },
        { id: n(), label: 'Other family matter' },
      ],
    },
    {
      id: n(), question: 'How urgent is this?',
      type: 'choice', key: 'step_urgency', label: 'Urgency',
      options: [
        { id: n(), label: 'Urgent — active situation' },
        { id: n(), label: 'Planning ahead' },
        { id: n(), label: 'Just exploring my options' },
      ],
    },
  ];

  const businessExtras = [
    {
      id: n(), question: 'What do you need help with?',
      type: 'choice', key: 'step_biz_matter', label: 'Business matter',
      options: [
        { id: n(), label: 'Starting a business / LLC' },
        { id: n(), label: 'Contract review or drafting' },
        { id: n(), label: 'Partnership dispute' },
        { id: n(), label: 'Employment issue' },
        { id: n(), label: 'Intellectual property' },
      ],
    },
    {
      id: n(), question: 'Brief description of the situation?',
      type: 'text', key: 'step_description', label: 'Situation details',
      options: [],
    },
  ];

  const realEstateExtras = [
    {
      id: n(), question: 'What\'s the transaction?',
      type: 'choice', key: 'step_transaction', label: 'Transaction type',
      options: [
        { id: n(), label: 'Buying property' },
        { id: n(), label: 'Selling property' },
        { id: n(), label: 'Lease negotiation' },
        { id: n(), label: 'Dispute / litigation' },
      ],
    },
  ];

  const personalInjuryExtras = [
    {
      id: n(), question: 'What happened?',
      type: 'choice', key: 'step_incident', label: 'Incident type',
      options: [
        { id: n(), label: 'Car accident' },
        { id: n(), label: 'Workplace injury' },
        { id: n(), label: 'Slip and fall' },
        { id: n(), label: 'Medical malpractice' },
        { id: n(), label: 'Other' },
      ],
    },
    {
      id: n(), question: 'When did this happen?',
      type: 'choice', key: 'step_when', label: 'When it happened',
      options: [
        { id: n(), label: 'Within the last week' },
        { id: n(), label: '1–4 weeks ago' },
        { id: n(), label: '1–6 months ago' },
        { id: n(), label: 'Over 6 months ago' },
      ],
    },
    {
      id: n(), question: 'Have you already filed a claim?',
      type: 'choice', key: 'step_claim', label: 'Claim filed',
      options: [
        { id: n(), label: 'Yes with insurance' },
        { id: n(), label: 'Yes a police report' },
        { id: n(), label: 'No not yet' },
      ],
    },
  ];

  const immigrationExtras = [
    {
      id: n(), question: 'What do you need help with?',
      type: 'choice', key: 'step_imm_matter', label: 'Immigration matter',
      options: [
        { id: n(), label: 'Work visa (H-1B, L-1, etc.)' },
        { id: n(), label: 'Green card application' },
        { id: n(), label: 'Family sponsorship' },
        { id: n(), label: 'Citizenship / naturalization' },
        { id: n(), label: 'Asylum' },
      ],
    },
    {
      id: n(), question: 'Do you have any pending deadlines?',
      type: 'choice', key: 'step_deadline', label: 'Deadline',
      options: [
        { id: n(), label: 'Yes within 30 days' },
        { id: n(), label: 'Yes within 90 days' },
        { id: n(), label: 'No immediate deadline' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book consultation', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 12001, label: '⚖️ Practice Areas', behavior: 'menu', children: [
        {
          id: n(), label: '👨‍👩‍👧 Family Law', behavior: 'menu', children: [
            info('Divorce Consultation', '⚖️ Divorce Consultation', 'Confidential session to discuss your situation, rights, options, and next steps. No judgment, just guidance.', 200, 'USD', '60 min', 'clean', familyExtras),
            info('Child Custody Consultation', '👧 Custody Consultation', 'Understand custody laws, visitation rights, and what\'s best for your child. We fight for families.', 200, 'USD', '60 min', 'clean', familyExtras),
            info('Prenuptial Agreement', '📝 Prenup', 'Custom prenuptial agreement drafted by our team. Protects both parties. Reviewed and signed in one meeting.', 500, 'USD', '90 min', 'premium', familyExtras),
          ],
        },
        {
          id: n(), label: '🏢 Business Law', behavior: 'menu', children: [
            info('Business Formation', '🏢 Business Formation', 'LLC, corporation, partnership — we\'ll set up your entity properly. Includes filing and operating agreement.', 350, 'USD', '60 min', 'clean', businessExtras),
            info('Contract Review', '📋 Contract Review', 'Have our attorney review and mark up any contract before you sign. Protects you from hidden clauses.', 250, 'USD', '45 min', 'friendly', businessExtras),
            info('Employment Law Consultation', '👔 Employment Law', 'Wrongful termination, discrimination, non-competes. Know your rights as an employer or employee.', 200, 'USD', '60 min', 'clean', businessExtras),
          ],
        },
        {
          id: n(), label: '🏠 Real Estate Law', behavior: 'menu', children: [
            info('Property Closing', '🏠 Property Closing', 'Full legal support for buying or selling real estate. Title review, document prep, and closing attendance.', 400, 'USD', '90 min', 'clean', realEstateExtras),
            info('Lease Review', '📋 Lease Review', 'Commercial or residential — we\'ll ensure the lease terms protect your interests.', 200, 'USD', '45 min', 'friendly', realEstateExtras),
            info('Property Dispute', '⚖️ Property Dispute', 'Boundary issues, landlord-tenant conflict, HOA disputes. We\'ll represent your case.', 250, 'USD', '60 min', 'clean', realEstateExtras),
          ],
        },
        {
          id: n(), label: '🩹 Personal Injury', behavior: 'menu', children: [
            info('Free Case Evaluation', '🩹 Free Case Evaluation', 'No fee unless we win. Tell us what happened and we\'ll assess your case. Most cases settled out of court.', 0, 'USD', '30 min', 'friendly', personalInjuryExtras),
            info('Car Accident Claim', '🚗 Car Accident', 'We handle everything — insurance, medical bills, lost wages. You focus on healing, we focus on justice.', 0, 'USD', '45 min consultation', 'friendly', personalInjuryExtras),
            info('Workplace Injury', '🏗️ Workplace Injury', 'Workers\' comp claims and employer liability. We ensure you get full compensation.', 0, 'USD', '45 min consultation', 'clean', personalInjuryExtras),
          ],
        },
        {
          id: n(), label: '🌍 Immigration', behavior: 'menu', children: [
            info('Visa Consultation', '🌍 Visa Consultation', 'H-1B, O-1, L-1, EB visas — we navigate the process and paperwork so you don\'t have to.', 250, 'USD', '60 min', 'clean', immigrationExtras),
            info('Green Card Application', '🟢 Green Card', 'Family or employment-based permanent residency. We guide you from petition to approval.', 300, 'USD', '60 min', 'premium', immigrationExtras),
            info('Citizenship / Naturalization', '🇺🇸 Citizenship', 'Ready to become a US citizen? We\'ll prepare your application and prep you for the interview.', 280, 'USD', '60 min', 'friendly', immigrationExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book Consultation', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Consultation',
        description: 'Schedule a private consultation with one of our attorneys. Everything discussed is strictly confidential.',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Call Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Speak with Our Team',
        description: 'Need to talk? Our intake team can help.\n\n📱 +1 555-1200\n🕐 Mon–Fri 8 AM – 6 PM\n\n🔒 All calls are confidential\n⚖️ Free initial phone screening',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Office', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Our Office',
        description: 'Discreet and professional environment.\n\n📍 900 Justice Blvd, 15th Floor\nFinancial Tower, Downtown\n\n🅿️ Validated parking in garage\n♿ Fully accessible\n\n🕐 Mon–Fri 8 AM – 6 PM\n📨 After-hours inquiries: intake@sterlinglaw.com',
        amount: '', currency: 'USD', duration: '', style: 'clean',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hello 👋 Welcome to Sterling & Associates. Whatever legal matter you\'re facing, we\'re here to help. Confidential and professional.',
    buttons,
  };
}

// ── Cleaning Services: SparkleHome Cleaning ──

function cleaningServices() {
  let id = 13000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'Which cleaning service do you need?',
      type: 'select_from_menu', key: 'step_service', label: 'Service type',
      menuRoot: 13001,
      options: [],
    },
    {
      id: n(), question: 'Great! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Used our service before?',
      type: 'choice', key: 'step_returning', label: 'Returning client',
      options: [
        { id: n(), label: 'Yes — love you guys' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'When do you need us?',
      type: 'choice_with_manual', key: 'step_date', label: 'Cleaning date',
      manualPlaceholder: 'Type a specific date',
      options: [
        { id: n(), label: 'Today' },
        { id: n(), label: 'Tomorrow' },
        { id: n(), label: 'This week' },
        { id: n(), label: 'Next week' },
      ],
    },
    {
      id: n(), question: 'What time works?',
      type: 'choice', key: 'step_time', label: 'Preferred time',
      options: [
        { id: n(), label: 'Morning (8–11)' },
        { id: n(), label: 'Midday (11–2)' },
        { id: n(), label: 'Afternoon (2–5)' },
      ],
    },
  ];

  const homeExtras = [
    {
      id: n(), question: 'How big is the space?',
      type: 'choice', key: 'step_size', label: 'Home size',
      options: [
        { id: n(), label: 'Studio / 1 bed' },
        { id: n(), label: '2 bedrooms' },
        { id: n(), label: '3 bedrooms' },
        { id: n(), label: '4+ bedrooms' },
      ],
    },
    {
      id: n(), question: 'Any pets in the home?',
      type: 'choice', key: 'step_pets', label: 'Pets',
      options: [
        { id: n(), label: 'Yes dogs' },
        { id: n(), label: 'Yes cats' },
        { id: n(), label: 'Other pets' },
        { id: n(), label: 'No pets' },
      ],
    },
  ];

  const deepExtras = [
    {
      id: n(), question: 'How big is the space?',
      type: 'choice', key: 'step_size', label: 'Home size',
      options: [
        { id: n(), label: 'Studio / 1 bed' },
        { id: n(), label: '2 bedrooms' },
        { id: n(), label: '3 bedrooms' },
        { id: n(), label: '4+ bedrooms' },
      ],
    },
    {
      id: n(), question: 'When was the last deep clean?',
      type: 'choice', key: 'step_last_clean', label: 'Last deep clean',
      options: [
        { id: n(), label: 'Recently (within a month)' },
        { id: n(), label: 'A few months ago' },
        { id: n(), label: 'Over a year' },
        { id: n(), label: 'First time ever' },
      ],
    },
    {
      id: n(), question: 'Any areas that need extra attention?',
      type: 'text', key: 'step_focus_areas', label: 'Focus areas',
      options: [],
    },
  ];

  const moveExtras = [
    {
      id: n(), question: 'Moving in or moving out?',
      type: 'choice', key: 'step_move_type', label: 'Move type',
      options: [
        { id: n(), label: 'Moving in (before I settle)' },
        { id: n(), label: 'Moving out (security deposit clean)' },
      ],
    },
    {
      id: n(), question: 'How many rooms?',
      type: 'choice', key: 'step_rooms', label: 'Room count',
      options: [
        { id: n(), label: '1–2 rooms' },
        { id: n(), label: '3–4 rooms' },
        { id: n(), label: '5+ rooms' },
      ],
    },
    {
      id: n(), question: 'Is the space currently furnished or empty?',
      type: 'choice', key: 'step_furnished', label: 'Furnished',
      options: [
        { id: n(), label: 'Empty / mostly empty' },
        { id: n(), label: 'Still furnished' },
      ],
    },
  ];

  const officeExtras = [
    {
      id: n(), question: 'What size office?',
      type: 'choice', key: 'step_office_size', label: 'Office size',
      options: [
        { id: n(), label: 'Small (under 1,000 sq ft)' },
        { id: n(), label: 'Medium (1,000–3,000 sq ft)' },
        { id: n(), label: 'Large (3,000+ sq ft)' },
      ],
    },
    {
      id: n(), question: 'How often do you need cleaning?',
      type: 'choice', key: 'step_frequency', label: 'Frequency',
      options: [
        { id: n(), label: 'One-time' },
        { id: n(), label: 'Weekly' },
        { id: n(), label: '2x per week' },
        { id: n(), label: 'Daily' },
      ],
    },
  ];

  const specialtyExtras = [
    {
      id: n(), question: 'How many windows / carpets / areas?',
      type: 'choice', key: 'step_scope', label: 'Scope',
      options: [
        { id: n(), label: 'Small job (1–2 rooms)' },
        { id: n(), label: 'Medium (3–5 rooms)' },
        { id: n(), label: 'Whole home / property' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Book cleaning', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 13001, label: '🧹 Services', behavior: 'menu', children: [
        {
          id: n(), label: '🏠 Regular Home Cleaning', behavior: 'menu', children: [
            info('Standard Clean', '🏠 Standard Clean', 'Kitchen, bathrooms, floors, dusting, and tidying. Your go-to weekly or bi-weekly clean.', 120, 'USD', '2–3 hours', 'clean', homeExtras),
            info('Express Clean', '⚡ Express Clean', 'Quick and focused — kitchen, bathrooms, and vacuuming. Perfect when you\'re short on time.', 80, 'USD', '1.5 hours', 'friendly', homeExtras),
            info('Eco-Friendly Clean', '🌿 Eco Clean', 'Same thorough clean using all-natural, non-toxic products. Safe for kids and pets.', 140, 'USD', '2–3 hours', 'friendly', homeExtras),
          ],
        },
        {
          id: n(), label: '✨ Deep Cleaning', behavior: 'menu', children: [
            info('Full Deep Clean', '✨ Full Deep Clean', 'Every surface scrubbed — inside cabinets, behind appliances, baseboards, light fixtures. The works.', 250, 'USD', '4–6 hours', 'premium', deepExtras),
            info('Kitchen Deep Clean', '🍳 Kitchen Deep', 'Oven, fridge interior, range hood, grout, cabinet faces. Your kitchen will look brand new.', 120, 'USD', '2 hours', 'clean', deepExtras),
            info('Bathroom Deep Clean', '🚿 Bathroom Deep', 'Tile scrub, grout cleaning, mold removal, mirror polish. Sparkling clean, guaranteed.', 90, 'USD', '1.5 hours', 'clean', deepExtras),
          ],
        },
        {
          id: n(), label: '📦 Move-In/Out Cleaning', behavior: 'menu', children: [
            info('Move-Out Clean', '📦 Move-Out Clean', 'Get your deposit back. We clean every inch — walls, fixtures, appliances, floors. Landlord-ready.', 280, 'USD', '4–6 hours', 'clean', moveExtras),
            info('Move-In Clean', '🏡 Move-In Clean', 'Start fresh. Full sanitization before you unpack. Includes inside closets and cabinets.', 250, 'USD', '4–5 hours', 'friendly', moveExtras),
          ],
        },
        {
          id: n(), label: '🏢 Office Cleaning', behavior: 'menu', children: [
            info('Regular Office Clean', '🏢 Office Clean', 'Desks, floors, bathrooms, kitchen area, trash removal. Keeps your workspace professional.', 150, 'USD', '2 hours', 'clean', officeExtras),
            info('Post-Construction Clean', '🏗️ Post-Construction', 'Dust removal, debris cleanup, window wipe, surface polish. Transition from construction to move-in ready.', 400, 'USD', 'full day', 'premium', officeExtras),
          ],
        },
        {
          id: n(), label: '🪟 Specialty Services', behavior: 'menu', children: [
            info('Window Cleaning', '🪟 Window Cleaning', 'Interior and exterior window washing. Streak-free shine. Includes screens and sills.', 80, 'USD', '1–2 hours', 'clean', specialtyExtras),
            info('Carpet Cleaning', '🧼 Carpet Cleaning', 'Hot water extraction deep clean. Removes stains, odors, and allergens. Price per room.', 60, 'USD', 'per room', 'friendly', specialtyExtras),
            info('Pressure Washing', '💦 Pressure Washing', 'Driveways, patios, siding, and decks. Removes years of grime in one session.', 180, 'USD', '2–3 hours', 'friendly', specialtyExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Book a Cleaning', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Book a Cleaning',
        description: 'Let us take care of the mess — you deserve a spotless space without lifting a finger 🧹',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book now', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Call Us', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Get a Quote',
        description: 'Need a custom quote or have special requests? Just call!\n\n📱 +1 555-1330\n🕐 Mon–Sat 7 AM – 7 PM\n\n💬 Or describe your place here and we\'ll reply with a quote.',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Service Area', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Our Service Area',
        description: 'We come to you! Service area covers:\n\n📍 Downtown + surrounding 20-mile radius\n📍 All neighborhoods, suburbs, and nearby towns\n\n🚗 No travel fee within service area\n🕐 Mon–Sat, 7 AM – 7 PM\n\n⭐ 1,000+ 5-star reviews\n✅ Bonded and insured',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey there! ✨ Welcome to SparkleHome. We make homes and offices shine. What can we clean for you?',
    buttons,
  };
}

// ── Event Planning / Wedding: Dreamscape Events ──

function eventPlanning() {
  let id = 14000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'What type of event are you planning?',
      type: 'select_from_menu', key: 'step_service', label: 'Event type',
      menuRoot: 14001,
      options: [],
    },
    {
      id: n(), question: 'Amazing! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you worked with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning client',
      options: [
        { id: n(), label: 'Yes loved the last event' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'When is the event?',
      type: 'choice_with_manual', key: 'step_date', label: 'Event date',
      manualPlaceholder: 'Type the event date',
      options: [
        { id: n(), label: 'Within a month' },
        { id: n(), label: '1–3 months from now' },
        { id: n(), label: '3–6 months' },
        { id: n(), label: '6+ months out' },
      ],
    },
    {
      id: n(), question: 'Preferred consultation time?',
      type: 'choice', key: 'step_time', label: 'Consultation time',
      options: [
        { id: n(), label: 'Morning (10–12)' },
        { id: n(), label: 'Afternoon (1–4)' },
        { id: n(), label: 'Evening (5–7)' },
      ],
    },
  ];

  const weddingExtras = [
    {
      id: n(), question: 'How many guests are you expecting?',
      type: 'choice', key: 'step_guests', label: 'Guest count',
      options: [
        { id: n(), label: 'Intimate (under 50)' },
        { id: n(), label: 'Medium (50–100)' },
        { id: n(), label: 'Large (100–200)' },
        { id: n(), label: 'Grand (200+)' },
      ],
    },
    {
      id: n(), question: 'Indoor or outdoor?',
      type: 'choice', key: 'step_venue_type', label: 'Venue preference',
      options: [
        { id: n(), label: 'Indoor venue' },
        { id: n(), label: 'Outdoor garden / beach' },
        { id: n(), label: 'Both (ceremony + reception)' },
        { id: n(), label: 'Need venue suggestions' },
      ],
    },
    {
      id: n(), question: 'What\'s the approximate budget?',
      type: 'choice', key: 'step_budget', label: 'Budget range',
      options: [
        { id: n(), label: 'Under $10,000' },
        { id: n(), label: '$10,000 – $25,000' },
        { id: n(), label: '$25,000 – $50,000' },
        { id: n(), label: '$50,000+' },
      ],
    },
  ];

  const corporateExtras = [
    {
      id: n(), question: 'How many attendees?',
      type: 'choice', key: 'step_attendees', label: 'Attendees',
      options: [
        { id: n(), label: 'Under 30' },
        { id: n(), label: '30–100' },
        { id: n(), label: '100–300' },
        { id: n(), label: '300+' },
      ],
    },
    {
      id: n(), question: 'Do you need AV and tech setup?',
      type: 'choice', key: 'step_av', label: 'AV / tech',
      options: [
        { id: n(), label: 'Yes full AV setup' },
        { id: n(), label: 'Just a mic and projector' },
        { id: n(), label: 'No tech needed' },
      ],
    },
    {
      id: n(), question: 'Catering needed?',
      type: 'choice', key: 'step_catering', label: 'Catering',
      options: [
        { id: n(), label: 'Yes full catering' },
        { id: n(), label: 'Just snacks and drinks' },
        { id: n(), label: 'No — we\'ll handle food' },
      ],
    },
  ];

  const partyExtras = [
    {
      id: n(), question: 'What\'s the occasion?',
      type: 'choice', key: 'step_occasion', label: 'Occasion',
      options: [
        { id: n(), label: 'Birthday' },
        { id: n(), label: 'Anniversary' },
        { id: n(), label: 'Graduation' },
        { id: n(), label: 'Baby shower' },
        { id: n(), label: 'Other celebration' },
      ],
    },
    {
      id: n(), question: 'How many guests?',
      type: 'choice', key: 'step_guests', label: 'Guest count',
      options: [
        { id: n(), label: 'Under 20' },
        { id: n(), label: '20–50' },
        { id: n(), label: '50–100' },
        { id: n(), label: '100+' },
      ],
    },
    {
      id: n(), question: 'Any theme or vibe in mind?',
      type: 'text', key: 'step_theme', label: 'Theme / vibe',
      options: [],
    },
  ];

  const concertExtras = [
    {
      id: n(), question: 'Expected audience size?',
      type: 'choice', key: 'step_audience', label: 'Audience size',
      options: [
        { id: n(), label: 'Under 100' },
        { id: n(), label: '100–500' },
        { id: n(), label: '500–2000' },
        { id: n(), label: '2000+' },
      ],
    },
    {
      id: n(), question: 'Indoor or outdoor?',
      type: 'choice', key: 'step_venue', label: 'Venue type',
      options: [
        { id: n(), label: 'Indoor venue' },
        { id: n(), label: 'Outdoor stage' },
        { id: n(), label: 'Need venue help' },
      ],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Get started', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 14001, label: '🎉 Event Types', behavior: 'menu', children: [
        {
          id: n(), label: '💒 Weddings', behavior: 'menu', children: [
            info('Full Wedding Planning', '💒 Full Wedding Planning', 'From first idea to last dance. Venue, catering, decor, entertainment, timeline — we handle absolutely everything.', 5000, 'USD', '3–12 months', 'premium', weddingExtras),
            info('Day-Of Coordination', '💒 Day-Of Coordination', 'You plan it, we execute it. Timeline management, vendor coordination, setup, and teardown on the big day.', 1500, 'USD', 'full day', 'friendly', weddingExtras),
            info('Partial Wedding Planning', '💒 Partial Planning', 'We fill in the gaps. Pick the services you need — venue search, vendor management, or design only.', 2500, 'USD', '1–6 months', 'clean', weddingExtras),
          ],
        },
        {
          id: n(), label: '🏢 Corporate Events', behavior: 'menu', children: [
            info('Conference Planning', '🏢 Conference', 'Full event production — venue, staging, speakers, registration, catering. Professional and seamless.', 3000, 'USD', 'custom', 'premium', corporateExtras),
            info('Team Building Event', '🤝 Team Building', 'Fun activities, team challenges, and bonding. Indoor or outdoor. We customize for your company culture.', 1500, 'USD', 'half day', 'friendly', corporateExtras),
            info('Product Launch', '🚀 Product Launch', 'Make a splash. Venue, media setup, branding, catering, and guest management for your big reveal.', 4000, 'USD', 'custom', 'premium', corporateExtras),
            info('Company Holiday Party', '🎄 Holiday Party', 'End the year right. Themed decor, DJ, photo booth, catering, and a night your team won\'t forget.', 2000, 'USD', 'full evening', 'friendly', corporateExtras),
          ],
        },
        {
          id: n(), label: '🎂 Private Parties', behavior: 'menu', children: [
            info('Birthday Party', '🎂 Birthday Party', 'Make it a party to remember. Decor, entertainment, cake, and catering — stress-free for you.', 800, 'USD', 'half day', 'friendly', partyExtras),
            info('Anniversary Celebration', '💕 Anniversary', 'Romantic and memorable. Custom decor, dinner, music — tailored to your love story.', 1200, 'USD', 'full evening', 'premium', partyExtras),
            info('Baby Shower', '🍼 Baby Shower', 'Sweet and stylish shower planning. Theme, games, decor, food, and party favors.', 700, 'USD', '3–4 hours', 'friendly', partyExtras),
            info('Graduation Party', '🎓 Graduation', 'Celebrate the achievement! Themed decor, catering, photo area, and a celebration they deserve.', 900, 'USD', 'half day', 'clean', partyExtras),
          ],
        },
        {
          id: n(), label: '🎵 Concerts & Festivals', behavior: 'menu', children: [
            info('Small Concert', '🎵 Small Concert', 'Intimate venue, sound system, lighting, artist coordination. Perfect for local bands and private shows.', 2000, 'USD', 'full evening', 'friendly', concertExtras),
            info('Festival Production', '🎪 Festival', 'Multi-stage event production. Vendors, artists, security, permits — the whole nine yards.', 10000, 'USD', 'multi-day', 'premium', concertExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Free Consultation', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Free Consultation',
        description: 'Let\'s talk about your dream event! First consultation is free — no obligations, just good ideas.',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Book consultation', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Contact', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Let\'s Talk',
        description: 'Have a vision? We\'d love to hear it.\n\n📱 +1 555-1400\n✉️ hello@dreamscapeevents.com\n📸 @dreamscapeevents\n\n🕐 Mon–Sat 10 AM – 8 PM\n💬 We respond to messages within an hour',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Office & Showroom', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Our Space',
        description: 'Visit our office and inspiration showroom.\n\n📍 22 Celebration Ave, Suite 100\nMidtown Creative District\n\n🪞 Showroom with decor samples\n📋 By appointment or walk-in\n🅿️ Free parking\n\n🕐 Mon–Sat 10 AM – 6 PM',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey! 🎉 Welcome to Dreamscape Events. Planning something special? We bring ideas to life. Let\'s make it unforgettable!',
    buttons,
  };
}

// ── Travel Agency: Wanderlust Travel Co. ──

function travelAgency() {
  let id = 15000;
  const n = () => id++;

  const baseFlow = [
    {
      id: n(), question: 'What type of trip are you interested in?',
      type: 'select_from_menu', key: 'step_service', label: 'Trip type',
      menuRoot: 15001,
      options: [],
    },
    {
      id: n(), question: 'Exciting! What\'s your name?',
      type: 'text', key: 'step_name', label: 'Your name',
      options: [],
    },
    {
      id: n(), question: 'Have you traveled with us before?',
      type: 'choice', key: 'step_returning', label: 'Returning traveler',
      options: [
        { id: n(), label: 'Yes — always a great trip' },
        { id: n(), label: 'No first time' },
      ],
    },
    {
      id: n(), question: 'When are you looking to travel?',
      type: 'choice_with_manual', key: 'step_date', label: 'Travel dates',
      manualPlaceholder: 'Type specific travel dates',
      options: [
        { id: n(), label: 'This month' },
        { id: n(), label: 'Next month' },
        { id: n(), label: '2–3 months from now' },
        { id: n(), label: '6+ months — planning ahead' },
      ],
    },
    {
      id: n(), question: 'Preferred consultation time?',
      type: 'choice', key: 'step_time', label: 'Consult time',
      options: [
        { id: n(), label: 'Morning (10–12)' },
        { id: n(), label: 'Afternoon (1–4)' },
        { id: n(), label: 'Evening (5–7)' },
      ],
    },
  ];

  const beachExtras = [
    {
      id: n(), question: 'How many travelers?',
      type: 'choice', key: 'step_travelers', label: 'Travelers',
      options: [
        { id: n(), label: 'Solo trip' },
        { id: n(), label: 'Couple' },
        { id: n(), label: 'Family (3–5)' },
        { id: n(), label: 'Group (6+)' },
      ],
    },
    {
      id: n(), question: 'Budget per person?',
      type: 'choice', key: 'step_budget', label: 'Budget',
      options: [
        { id: n(), label: 'Budget-friendly (under $1,500)' },
        { id: n(), label: 'Mid-range ($1,500–$3,000)' },
        { id: n(), label: 'Luxury ($3,000+)' },
      ],
    },
    {
      id: n(), question: 'All-inclusive or flexible?',
      type: 'choice', key: 'step_package', label: 'Package type',
      options: [
        { id: n(), label: 'All-inclusive resort' },
        { id: n(), label: 'Hotel + explore on my own' },
        { id: n(), label: 'Airbnb / villa rental' },
      ],
    },
  ];

  const adventureExtras = [
    {
      id: n(), question: 'How many travelers?',
      type: 'choice', key: 'step_travelers', label: 'Travelers',
      options: [
        { id: n(), label: 'Solo' },
        { id: n(), label: '2 people' },
        { id: n(), label: 'Small group (3–6)' },
        { id: n(), label: 'Large group (7+)' },
      ],
    },
    {
      id: n(), question: 'Fitness level?',
      type: 'choice', key: 'step_fitness', label: 'Fitness level',
      options: [
        { id: n(), label: 'Easy — light activities' },
        { id: n(), label: 'Moderate — some hiking' },
        { id: n(), label: 'Challenging — I\'m fit' },
      ],
    },
  ];

  const cityExtras = [
    {
      id: n(), question: 'How many travelers?',
      type: 'choice', key: 'step_travelers', label: 'Travelers',
      options: [
        { id: n(), label: 'Solo' },
        { id: n(), label: 'Couple' },
        { id: n(), label: 'Family' },
        { id: n(), label: 'Friends group' },
      ],
    },
    {
      id: n(), question: 'What\'s most important to you?',
      type: 'choice', key: 'step_priority', label: 'Travel priority',
      options: [
        { id: n(), label: 'Food & dining' },
        { id: n(), label: 'History & culture' },
        { id: n(), label: 'Shopping & nightlife' },
        { id: n(), label: 'A bit of everything' },
      ],
    },
  ];

  const cruiseExtras = [
    {
      id: n(), question: 'How many travelers?',
      type: 'choice', key: 'step_travelers', label: 'Travelers',
      options: [
        { id: n(), label: 'Solo' },
        { id: n(), label: 'Couple' },
        { id: n(), label: 'Family with kids' },
        { id: n(), label: 'Group / friends' },
      ],
    },
    {
      id: n(), question: 'Cabin preference?',
      type: 'choice', key: 'step_cabin', label: 'Cabin type',
      options: [
        { id: n(), label: 'Interior (budget)' },
        { id: n(), label: 'Ocean view' },
        { id: n(), label: 'Balcony' },
        { id: n(), label: 'Suite (splurge!)' },
      ],
    },
  ];

  const honeyExtras = [
    {
      id: n(), question: 'Budget for the trip?',
      type: 'choice', key: 'step_budget', label: 'Budget',
      options: [
        { id: n(), label: 'Under $5,000' },
        { id: n(), label: '$5,000 – $10,000' },
        { id: n(), label: '$10,000 – $20,000' },
        { id: n(), label: 'Sky\'s the limit ✨' },
      ],
    },
    {
      id: n(), question: 'What vibe are you going for?',
      type: 'choice', key: 'step_vibe', label: 'Trip vibe',
      options: [
        { id: n(), label: 'Relaxing beach' },
        { id: n(), label: 'Cultural exploration' },
        { id: n(), label: 'Adventure + romance' },
        { id: n(), label: 'Luxury resort' },
      ],
    },
    {
      id: n(), question: 'Any dream destinations in mind?',
      type: 'text', key: 'step_destination', label: 'Destination ideas',
      options: [],
    },
  ];

  const bookingFlow = baseFlow;

  function info(label, title, description, amount, currency, duration, style, extraSteps) {
    return {
      id: n(), label, behavior: 'info', children: [],
      infoPage: {
        title, description, amount: String(amount), currency: currency || 'USD',
        duration: duration || '', style: style || 'clean',
        showPrice: true, showDuration: true,
        extraSteps: extraSteps || [],
        actionButtons: [
          { id: n(), label: 'Plan my trip', behavior: 'start_flow', flowSteps: baseFlow, prefillService: title },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    };
  }

  const buttons = [
    {
      id: 15001, label: '✈️ Trip Types', behavior: 'menu', children: [
        {
          id: n(), label: '🏖️ Beach & Resort', behavior: 'menu', children: [
            info('Caribbean Getaway', '🏖️ Caribbean Getaway', 'Crystal waters, white sand, island vibes. Includes flights, resort stay, and airport transfers. Pure relaxation.', 2200, 'USD', '5 nights', 'friendly', beachExtras),
            info('Bali Paradise', '🌴 Bali Paradise', 'Temples, rice terraces, and stunning beaches. Private villa, cultural tours, and spa credits included.', 2800, 'USD', '7 nights', 'premium', beachExtras),
            info('Maldives Escape', '🏝️ Maldives', 'Overwater bungalow, private beach, snorkeling. The ultimate luxury island getaway.', 4500, 'USD', '5 nights', 'premium', beachExtras),
          ],
        },
        {
          id: n(), label: '🏔️ Adventure', behavior: 'menu', children: [
            info('Costa Rica Adventure', '🏔️ Costa Rica', 'Zip-lining, volcano hikes, wildlife tours, and river rafting. Packed with thrills.', 1800, 'USD', '6 nights', 'friendly', adventureExtras),
            info('Iceland Explorer', '🧊 Iceland', 'Northern lights, glaciers, hot springs, and whale watching. Otherworldly landscape.', 2500, 'USD', '5 nights', 'premium', adventureExtras),
            info('African Safari', '🦁 African Safari', 'Witness the Big Five in their natural habitat. Guided game drives, lodge accommodation, and sunrise breakfasts.', 4000, 'USD', '7 nights', 'premium', adventureExtras),
          ],
        },
        {
          id: n(), label: '🏙️ City Breaks', behavior: 'menu', children: [
            info('Paris Weekend', '🗼 Paris', 'The city of light. Boutique hotel, guided Louvre tour, Seine river cruise, and café hopping map.', 1500, 'USD', '3 nights', 'premium', cityExtras),
            info('Tokyo Discovery', '🗾 Tokyo', 'Neon lights, temples, sushi bars, and cherry blossoms. Rail pass and guided food tour included.', 2200, 'USD', '5 nights', 'friendly', cityExtras),
            info('New York Getaway', '🗽 New York', 'Broadway, Central Park, food, and culture. Hotel in Midtown, city pass, and airport transfers.', 1200, 'USD', '3 nights', 'clean', cityExtras),
            info('Barcelona Explorer', '🇪🇸 Barcelona', 'Gaudí, tapas, beaches, and nightlife. Boutique hotel in Gothic Quarter, guided tours included.', 1400, 'USD', '4 nights', 'friendly', cityExtras),
          ],
        },
        {
          id: n(), label: '🚢 Cruises', behavior: 'menu', children: [
            info('Mediterranean Cruise', '🚢 Mediterranean', '7-night cruise through Italy, Greece, and Croatia. All meals, entertainment, and port excursions.', 1800, 'USD', '7 nights', 'premium', cruiseExtras),
            info('Alaska Cruise', '🏔️ Alaska Cruise', 'Glaciers, whales, and frontier towns. Inside passage route with all meals and onboard activities.', 1500, 'USD', '7 nights', 'friendly', cruiseExtras),
            info('Caribbean Cruise', '🏖️ Caribbean Cruise', 'Island-hopping from Miami. Beach ports, water sports, and endless buffets. Fun for all ages.', 1200, 'USD', '5 nights', 'friendly', cruiseExtras),
          ],
        },
        {
          id: n(), label: '💑 Honeymoons', behavior: 'menu', children: [
            info('Santorini Romance', '💑 Santorini', 'Sunsets over the caldera, wine tasting, couples\' spa, and a private dinner on the cliffside.', 3500, 'USD', '5 nights', 'premium', honeyExtras),
            info('Thailand Honeymoon', '💑 Thailand', 'Bangkok temples, Chiang Mai elephants, and Koh Samui beaches. Romance meets adventure.', 2800, 'USD', '8 nights', 'premium', honeyExtras),
            info('Fiji Honeymoon', '💑 Fiji', 'Private island resort, couples\' massage, sunset dinner cruise. Pure paradise for two.', 5000, 'USD', '6 nights', 'premium', honeyExtras),
          ],
        },
      ],
    },

    {
      id: n(), label: '📅 Plan a Trip', behavior: 'info', children: [],
      infoPage: {
        title: '📅 Start Planning',
        description: 'Ready for an adventure? Tell us where you want to go and we\'ll build the perfect trip for you ✈️',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Start planning', behavior: 'start_flow', flowSteps: bookingFlow },
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📞 Talk to an Agent', behavior: 'info', children: [],
      infoPage: {
        title: '📞 Speak with a Travel Expert',
        description: 'Not sure where to go? Our agents have been everywhere.\n\n📱 +1 555-1500\n✉️ trips@wanderlusttravel.com\n🕐 Mon–Fri 9 AM – 7 PM\n🕐 Sat 10 AM – 4 PM\n\n🌍 We\'ve helped plan 10,000+ trips worldwide',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },

    {
      id: n(), label: '📍 Visit Us', behavior: 'info', children: [],
      infoPage: {
        title: '📍 Our Office',
        description: 'Come browse our travel wall and plan in person!\n\n📍 100 Horizon Blvd, Suite 5\nTravel District, Downtown\n\n🗺️ Travel lounge with destination guides\n☕ Coffee while you dream\n🅿️ Free parking\n\n🕐 Mon–Fri 9 AM – 6 PM\n🕐 Sat 10 AM – 3 PM',
        amount: '', currency: 'USD', duration: '', style: 'friendly',
        showPrice: false, showDuration: false,
        extraSteps: [],
        actionButtons: [
          { id: n(), label: 'Back', behavior: 'go_back' },
        ],
      },
    },
  ];

  return {
    welcomeMessage: 'Hey there! ✈️ Welcome to Wanderlust Travel. Where do you want to go? Let\'s plan your dream trip!',
    buttons,
  };
}

// ── Template registry ──

export const TEMPLATES = [
  {
    key: 'beauty_salon',
    name: 'Beauty Salon',
    description: 'Glow Studio — hair, nails, lashes, skincare, waxing',
    emoji: '💇',
    load: beautySalon,
  },
  {
    key: 'medical_clinic',
    name: 'Medical Clinic',
    description: 'CarePoint Medical — general, pediatrics, dentistry, dermatology, orthopedics, eye care',
    emoji: '🏥',
    load: medicalClinic,
  },
  {
    key: 'restaurant',
    name: 'Restaurant / Cafe',
    description: 'Bella Tavola — breakfast, starters, mains, pasta, desserts, drinks',
    emoji: '🍝',
    load: restaurant,
  },
  {
    key: 'real_estate',
    name: 'Real Estate',
    description: 'Skyline Realty — apartments, houses, condos, commercial, land',
    emoji: '🏠',
    load: realEstate,
  },
  {
    key: 'car_rental',
    name: 'Car Rental',
    description: 'DriveEasy Rentals — economy, SUV, luxury, vans, convertibles',
    emoji: '🚗',
    load: carRental,
  },
  {
    key: 'fitness_gym',
    name: 'Fitness / Gym',
    description: 'IronCore Fitness — strength, cardio, yoga, martial arts, personal training',
    emoji: '💪',
    load: fitnessGym,
  },
  {
    key: 'hotel',
    name: 'Hotel',
    description: 'The Grand Meridian — standard, suites, family, spa & wellness',
    emoji: '🏨',
    load: hotel,
  },
  {
    key: 'pet_care',
    name: 'Pet Care / Veterinary',
    description: 'Paws & Whiskers — check-ups, vaccines, grooming, dental, surgery',
    emoji: '🐾',
    load: petCare,
  },
  {
    key: 'education',
    name: 'Education / Tutoring',
    description: 'BrightPath Academy — math, languages, science, test prep, music',
    emoji: '📚',
    load: education,
  },
  {
    key: 'auto_repair',
    name: 'Auto Repair / Mechanic',
    description: 'TrustWrench Auto — oil, brakes, tires, engine, A/C',
    emoji: '🔧',
    load: autoRepair,
  },
  {
    key: 'photography',
    name: 'Photography Studio',
    description: 'FrameLight Studios — portraits, weddings, product, events',
    emoji: '📸',
    load: photography,
  },
  {
    key: 'law_firm',
    name: 'Law Firm / Legal',
    description: 'Sterling & Associates — family, business, real estate, injury, immigration',
    emoji: '⚖️',
    load: lawFirm,
  },
  {
    key: 'cleaning',
    name: 'Cleaning Services',
    description: 'SparkleHome — regular, deep, move-in/out, office, specialty',
    emoji: '🧹',
    load: cleaningServices,
  },
  {
    key: 'event_planning',
    name: 'Event Planning / Wedding',
    description: 'Dreamscape Events — weddings, corporate, parties, concerts',
    emoji: '🎉',
    load: eventPlanning,
  },
  {
    key: 'travel_agency',
    name: 'Travel Agency',
    description: 'Wanderlust Travel — beach, adventure, city breaks, cruises, honeymoons',
    emoji: '✈️',
    load: travelAgency,
  },
];
