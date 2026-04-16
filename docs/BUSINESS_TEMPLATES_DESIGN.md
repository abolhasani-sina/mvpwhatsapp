# Business Templates Design — WhatsApp SaaS Builder

15 ready-to-use templates. Each designed for real business owners.  
Admin only needs to edit names, prices, and small details.

---

## System Capabilities Reference

**Button behaviors:** `menu` (show sub-buttons), `info` (show info page), `action` (trigger action)  
**Action types:** `start_flow`, `call`, `link`, `navigate`, `go_back`  
**Info page fields:** title, description, amount, currency, duration, style (clean/friendly/premium)  
**Flow step types:** `text`, `choice`, `choice_with_manual`, `select_from_menu`  
**Currencies:** USD, EUR, TRY, AED

---

# ═══════════════════════════════════════════════
# 1. BEAUTY SALON
# ═══════════════════════════════════════════════

**Template Name:** Glow Studio  
**Welcome Message:** "Hey there! ✨ Welcome to Glow Studio. Tap below to browse our services or book an appointment."

---

### Menu Structure

```
📋 Our Services [behavior: menu]
├── 💇 Hair [menu]
│   ├── Women's Haircut [info]
│   ├── Men's Haircut [info]
│   ├── Blow Dry & Styling [info]
│   ├── Hair Coloring [info]
│   ├── Highlights & Balayage [info]
│   └── Keratin Treatment [info]
├── 💅 Nails [menu]
│   ├── Classic Manicure [info]
│   ├── Gel Manicure [info]
│   ├── Classic Pedicure [info]
│   ├── Gel Pedicure [info]
│   └── Nail Art [info]
├── 👁 Lashes & Brows [menu]
│   ├── Classic Eyelash Extensions [info]
│   ├── Volume Eyelash Extensions [info]
│   ├── Lash Lift & Tint [info]
│   ├── Brow Shaping [info]
│   └── Brow Lamination [info]
├── 🧖 Skincare [menu]
│   ├── Classic Facial [info]
│   ├── Deep Cleansing Facial [info]
│   ├── Anti-Aging Facial [info]
│   └── Chemical Peel [info]
└── 🌿 Waxing [menu]
    ├── Full Legs [info]
    ├── Half Legs [info]
    ├── Bikini Line [info]
    ├── Underarms [info]
    └── Full Body [info]

📅 Book Appointment [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-0100]
📍 Location [behavior: action → link → google maps URL]
```

---

### Info Pages

**Hair**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Women's Haircut | ✂️ Women's Haircut | Professional cut and style. Includes wash, cut, and blow dry. Our stylists will help you find the perfect look. | $45 | 45 min |
| Men's Haircut | ✂️ Men's Haircut | Sharp, clean cut with attention to detail. Includes wash and style. Beard trim available on request. | $25 | 30 min |
| Blow Dry & Styling | 💨 Blow Dry & Styling | Gorgeous blow-out and styling for any occasion. Straight, wavy, or curly — your choice. | $30 | 30 min |
| Hair Coloring | 🎨 Hair Coloring | Full head color with premium products. Covers grays beautifully or transforms your look entirely. | $80 | 90 min |
| Highlights & Balayage | ✨ Highlights & Balayage | Hand-painted highlights for a natural, sun-kissed look. Customized placement for your face shape. | $120 | 120 min |
| Keratin Treatment | 💎 Keratin Treatment | Smooth, frizz-free hair for up to 3 months. Repairs damage and adds incredible shine. | $150 | 150 min |

**Nails**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Classic Manicure | 💅 Classic Manicure | Shape, buff, cuticle care, and polish. A clean, polished look every time. | $20 | 30 min |
| Gel Manicure | 💅 Gel Manicure | Long-lasting gel polish that stays perfect for 2-3 weeks. Chip-free and glossy. | $35 | 45 min |
| Classic Pedicure | 🦶 Classic Pedicure | Soak, exfoliate, shape, and polish. Includes a relaxing foot massage. | $30 | 40 min |
| Gel Pedicure | 🦶 Gel Pedicure | Full pedicure with durable gel polish. Your feet will look amazing for weeks. | $45 | 50 min |
| Nail Art | 🎨 Nail Art | Custom designs, gems, or patterns. From simple accents to full artistic sets. Price per nail. | $5/nail | 15 min/nail |

**Lashes & Brows**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Classic Eyelash Extensions | 👁 Classic Lash Extensions | One extension per natural lash for a subtle, elegant look. Natural-looking length and curl. | $80 | 90 min |
| Volume Eyelash Extensions | 👁 Volume Lash Extensions | Multiple lightweight fans per lash for dramatic, full volume. Perfect for special occasions or everyday glam. | $120 | 120 min |
| Lash Lift & Tint | ✨ Lash Lift & Tint | Lifts and curls your natural lashes, then tints them darker. Lasts 6-8 weeks. No extensions needed. | $55 | 60 min |
| Brow Shaping | ✏️ Brow Shaping | Wax or thread to perfectly shape your brows. Includes trim and clean-up. | $15 | 15 min |
| Brow Lamination | ✏️ Brow Lamination | Sleek, brushed-up brows that stay in place for weeks. Includes shaping and tint. | $45 | 45 min |

**Skincare**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Classic Facial | 🧖 Classic Facial | Deep cleanse, exfoliation, mask, and moisturizer. Leaves your skin refreshed and glowing. | $50 | 45 min |
| Deep Cleansing Facial | 🧖 Deep Cleansing | Extractions, steam, and purifying mask. Ideal for oily or congested skin. Clears pores and reduces breakouts. | $65 | 60 min |
| Anti-Aging Facial | 💎 Anti-Aging Facial | Collagen-boosting treatment with firming serum and LED therapy. Reduces fine lines and restores elasticity. | $90 | 75 min |
| Chemical Peel | ⚗️ Chemical Peel | Controlled exfoliation to reveal fresh skin. Reduces dark spots, acne scars, and uneven texture. | $75 | 45 min |

**Waxing**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Full Legs | 🌿 Full Legs Waxing | Smooth from ankle to hip. Uses gentle wax suitable for sensitive skin. | $40 | 30 min |
| Half Legs | 🌿 Half Legs Waxing | Lower legs — knee to ankle. Quick and effective. | $25 | 20 min |
| Bikini Line | 🌿 Bikini Line Waxing | Clean bikini line shaping. Discreet and professional service. | $30 | 20 min |
| Underarms | 🌿 Underarm Waxing | Quick underarm wax for silky smooth results. | $15 | 10 min |
| Full Body | 🌿 Full Body Waxing | Complete body waxing package — legs, arms, underarms, and bikini. Save compared to individual services. | $120 | 90 min |

---

### Main Flow: Book Appointment

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | Hii! 😊 What are we doing for you today? | → Opens "Our Services" menu tree |
| 2 | text | Love that choice! What's your name babe? | — |
| 3 | choice | Have you been to us before? | Yep I've been before, Nope first time! |
| 4 | choice_with_manual | Ok so when were you thinking? | Today if possible, Tomorrow, This weekend, Next week, *or type a date* |
| 5 | choice | Morning or afternoon works better for you? | Morning (9-12), Afternoon (12-5), Evening (5-8) |
| 6 | choice | Quick q — do you need old gel/polish removed first? | Yes please remove first, No I'm good to go, Not sure |
| 7 | choice | Want to add anything else while you're here? We can do it back to back 💅 | Add brow shaping (+$15), Add lash tint (+$25), Add hand massage (+$10), Nope just the one service! |
| 8 | text | Last thing — any allergies or sensitive skin stuff we should know about? (totally fine if not, just checking ☺️) | — |

**Confirmation:**
```
Here's what I have 📋

• Service: Gel Manicure
• Name: Nina
• Returning client: First time!
• Date: Tomorrow
• Time: Afternoon (12-5)
• Removal: Yes please
• Add-on: Brow shaping (+$15)
• Notes: None

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** Hii! 😊 What are we doing for you today?  
> *(shows menu: Our Services → Nails → Gel Manicure)*  
> **User:** Gel Manicure  
>
> **Bot:** Love that choice! What's your name babe?  
> **User:** Nina  
>
> **Bot:** Have you been to us before?  
> **User:** Nope first time!  
>
> **Bot:** Ok so when were you thinking?  
> **User:** Tomorrow  
>
> **Bot:** Morning or afternoon works better for you?  
> **User:** Afternoon (12-5)  
>
> **Bot:** Quick q — do you need old gel/polish removed first?  
> **User:** Yes please remove first  
>
> **Bot:** Want to add anything else while you're here? We can do it back to back 💅  
> **User:** Add brow shaping (+$15)  
>
> **Bot:** Last thing — any allergies or sensitive skin stuff we should know about? (totally fine if not, just checking ☺️)  
> **User:** Nope all good!  
>
> **Bot:** Here's what I have 📋  
> • Service: Gel Manicure  
> • Name: Nina  
> • Returning: Nope first time!  
> • Date: Tomorrow  
> • Time: Afternoon (12-5)  
> • Removal: Yes please  
> • Add-on: Brow shaping (+$15)  
> • Notes: All good  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Yaaay you're all booked Nina! 💅✨ See you tomorrow afternoon. We'll send a reminder in the morning. If anything changes just msg us here. Can't wait! 💕


---
---

# ═══════════════════════════════════════════════
# 2. REAL ESTATE AGENCY
# ═══════════════════════════════════════════════

**Template Name:** Prime Realty  
**Welcome Message:** "Welcome to Prime Realty! 🏠 Whether you're looking to buy, rent, or need expert advice — we're here to help."

---

### Menu Structure

```
🏠 Buy Property [behavior: menu]
├── 🏢 Apartments [menu]
│   ├── Studio Apartment [info]
│   ├── 1-Bedroom Apartment [info]
│   ├── 2-Bedroom Apartment [info]
│   ├── 3+ Bedroom Apartment [info]
│   └── Penthouse [info]
├── 🏡 Houses [menu]
│   ├── Townhouse [info]
│   ├── Semi-Detached House [info]
│   ├── Detached House [info]
│   └── Villa [info]
└── 🏪 Commercial [menu]
    ├── Office Space [info]
    ├── Retail Shop [info]
    └── Warehouse [info]

🔑 Rent Property [behavior: menu]
├── 🏢 Apartments [menu]
│   ├── Studio [info]
│   ├── 1-Bedroom [info]
│   ├── 2-Bedroom [info]
│   └── 3+ Bedroom [info]
├── 🏡 Houses [menu]
│   ├── Townhouse [info]
│   └── Villa [info]
└── 🏪 Commercial [menu]
    ├── Office Space [info]
    └── Retail Shop [info]

📊 Our Services [behavior: menu]
├── Property Valuation [info]
├── Mortgage Consulting [info]
└── Investment Advisory [info]

📅 Schedule a Viewing [behavior: action → start_flow]
📞 Call an Agent [behavior: action → call → +1 555-0200]
```

---

### Info Pages

**Buy — Apartments**

| Property | Title | Description | Price | Size |
|----------|-------|-------------|-------|------|
| Studio Apartment | Studio Apartment | Compact modern studios in prime locations. Open-plan living, fitted kitchen. Ideal for singles or young professionals. | From $85,000 | 30–45 m² |
| 1-Bedroom Apartment | 1-Bedroom Apartment | Spacious one-bedroom with separate living. Modern finishes, building amenities included. Parking options available. | From $120,000 | 45–65 m² |
| 2-Bedroom Apartment | 2-Bedroom Apartment | Perfect for small families. Two bedrooms, open kitchen, balcony options. Close to schools and parks. | From $180,000 | 65–90 m² |
| 3+ Bedroom Apartment | 3+ Bedroom Apartment | Large family apartments with three or more bedrooms. Premium locations, underground parking included. | From $280,000 | 90–140 m² |
| Penthouse | Penthouse | Luxury living with panoramic views, private terrace, and premium finishes. Exclusive rooftop access and concierge service. | From $450,000 | 120–200 m² |

**Buy — Houses**

| Property | Title | Description | Price | Size |
|----------|-------|-------------|-------|------|
| Townhouse | Townhouse | Multi-level living with private entrance, garden, and garage. Perfect blend of house comfort and community living. | From $250,000 | 120–180 m² |
| Semi-Detached | Semi-Detached House | Family-friendly with garden, driveway, and 3-4 bedrooms. Quiet residential neighborhoods. | From $320,000 | 150–220 m² |
| Detached House | Detached House | Standalone family home with private garden, garage, generous space. Various architectural styles available. | From $400,000 | 180–300 m² |
| Villa | Villa | Premium villa with pool, landscaped gardens, luxury finishes. Gated community options available. | From $650,000 | 250–500 m² |

**Buy — Commercial**

| Property | Title | Description | Price | Size |
|----------|-------|-------------|-------|------|
| Office Space | Office Space | Modern offices in business districts. Open-plan or partitioned, fiber internet ready, meeting rooms. | From $150,000 | 50–300 m² |
| Retail Shop | Retail Shop | Street-level units with high foot traffic. Suitable for shops, showrooms, or food service. | From $200,000 | 40–150 m² |
| Warehouse | Warehouse | Industrial space with loading docks, high ceilings, highway access. Suitable for storage or light manufacturing. | From $300,000 | 200–1000 m² |

**Rent — Apartments**

| Property | Title | Description | Price | Lease |
|----------|-------|-------------|-------|-------|
| Studio | Studio Rental | Furnished or unfurnished studios in central locations. Utilities-ready, building amenities included. | From $600/mo | 12 months min |
| 1-Bedroom | 1-Bedroom Rental | Well-maintained one-bedroom apartments. Some include parking and balcony. Pet-friendly options. | From $850/mo | 12 months min |
| 2-Bedroom | 2-Bedroom Rental | Spacious for couples or small families. Near public transport and shopping. | From $1,200/mo | 12 months min |
| 3+ Bedroom | 3+ Bedroom Rental | Large apartments in family-friendly areas. Close to schools, parks, and healthcare. | From $1,800/mo | 12 months min |

**Rent — Houses**

| Property | Title | Description | Price | Lease |
|----------|-------|-------------|-------|-------|
| Townhouse | Townhouse Rental | Multi-level with garden. Quiet residential settings, parking included. | From $2,200/mo | 12 months min |
| Villa | Villa Rental | Luxury villas with pool and garden. Fully furnished options. Maintenance included. | From $3,500/mo | 12 months min |

**Rent — Commercial**

| Property | Title | Description | Price | Lease |
|----------|-------|-------------|-------|-------|
| Office Space | Office Rental | Flexible office rentals, single rooms to full floors. Co-working options available. | From $800/mo | 6 months min |
| Retail Shop | Retail Rental | Prime retail locations for lease. High-visibility storefronts in busy areas. | From $1,500/mo | 12 months min |

**Services**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Property Valuation | 📊 Property Valuation | Certified market valuation for selling, refinancing, or insurance. Detailed written report. | $200 | 2-3 business days |
| Mortgage Consulting | 🏦 Mortgage Consulting | Expert guidance on mortgage options, rates, and pre-approval. We compare multiple lenders. | Free consultation | 45 min |
| Investment Advisory | 📈 Investment Advisory | Strategic property investment advice with market analysis, ROI projections, and portfolio planning. | $150 | 60 min |

---

### Main Flow: Schedule a Viewing

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What type of property are you interested in? | → Opens full property menu (Buy/Rent) |
| 2 | text | What area or neighborhood do you prefer? | — |
| 3 | choice_with_manual | What's your budget range? | Under $150K, $150K–$300K, $300K–$500K, Over $500K, *or type your range* |
| 4 | choice | How soon are you looking to move? | Within 1 month, 1-3 months, 3-6 months, Just exploring |
| 5 | text | What's your full name? | — |
| 6 | text | Best phone number to reach you? | — |
| 7 | choice_with_manual | When would you like to schedule a viewing? | This week, Next week, This weekend, *or type a specific date* |

**Confirmation:**
```
Here's what I have 📋

• Property: 2-Bedroom Apartment (Buy)
• Area: Downtown
• Budget: $150K–$300K
• Timeline: 1-3 months
• Name: Sarah Johnson
• Phone: +1 555-0123
• Viewing: Next week

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What type of property are you interested in?  
> *(shows menu: Buy Property → Apartments → 2-Bedroom Apartment)*  
> **User:** 2-Bedroom Apartment  
>
> **Bot:** What area or neighborhood do you prefer?  
> **User:** Downtown or close to the metro  
>
> **Bot:** What's your budget range?  
> **User:** $150K–$300K  
>
> **Bot:** How soon are you looking to move?  
> **User:** 1-3 months  
>
> **Bot:** What's your full name?  
> **User:** Sarah Johnson  
>
> **Bot:** Best phone number to reach you?  
> **User:** +1 555-0123  
>
> **Bot:** When would you like to schedule a viewing?  
> **User:** Next week  
>
> **Bot:** Here's what I have 📋  
> • Property: 2-Bedroom Apartment (Buy)  
> • Area: Downtown or close to the metro  
> • Budget: $150K–$300K  
> • Timeline: 1-3 months  
> • Name: Sarah Johnson  
> • Phone: +1 555-0123  
> • Viewing: Next week  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Thank you, Sarah! 🏠 One of our agents will contact you shortly to arrange the viewing. We'll find you the perfect place!


---
---

# ═══════════════════════════════════════════════
# 3. MEDICAL CLINIC
# ═══════════════════════════════════════════════

**Template Name:** CarePoint Medical  
**Welcome Message:** "Welcome to CarePoint Medical 🏥 We're here for your health. Browse our departments or book an appointment below."

---

### Menu Structure

```
🏥 Our Departments [behavior: menu]
├── 🩺 General Medicine [menu]
│   ├── General Checkup [info]
│   ├── Blood Pressure & Heart Screen [info]
│   ├── Diabetes Management [info]
│   └── Allergy Testing [info]
├── 🦷 Dental [menu]
│   ├── Dental Cleaning [info]
│   ├── Teeth Whitening [info]
│   ├── Cavity Filling [info]
│   ├── Root Canal [info]
│   └── Dental Implant [info]
├── 🧴 Dermatology [menu]
│   ├── Skin Consultation [info]
│   ├── Acne Treatment [info]
│   ├── Mole & Lesion Check [info]
│   └── Laser Treatment [info]
├── 👶 Pediatrics [menu]
│   ├── Well-Child Visit [info]
│   ├── Vaccination [info]
│   └── Sick Visit [info]
├── 🦴 Orthopedics [menu]
│   ├── Joint Pain Consultation [info]
│   ├── Sports Injury Assessment [info]
│   ├── X-Ray & Imaging [info]
│   └── Physical Therapy Session [info]
└── 🔬 Lab & Diagnostics [menu]
    ├── Blood Work Panel [info]
    ├── Urine Analysis [info]
    ├── Full Body Checkup [info]
    └── COVID & Flu Test [info]

📅 Book Appointment [behavior: action → start_flow]
📞 Emergency Line [behavior: action → call → +1 555-0300]
📍 Find Us [behavior: action → link → google maps URL]
```

---

### Info Pages

**General Medicine**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| General Checkup | 🩺 General Checkup | Comprehensive health assessment with vital signs, medical history review, and physical exam. Includes basic blood work. | $75 | 30 min |
| Blood Pressure & Heart Screen | ❤️ Heart & BP Screen | Blood pressure, ECG, cholesterol check. Early detection of cardiovascular risks. Includes written report. | $90 | 45 min |
| Diabetes Management | 🩸 Diabetes Management | HbA1c testing, glucose monitoring review, and treatment plan adjustment. For existing or suspected diabetes. | $85 | 30 min |
| Allergy Testing | 🤧 Allergy Testing | Skin prick or blood test for common allergens — food, pollen, dust, pets. Results within 48 hours. | $120 | 45 min |

**Dental**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Dental Cleaning | 🦷 Dental Cleaning | Professional cleaning with scaling, polishing, and fluoride treatment. Removes plaque and tartar buildup. | $80 | 45 min |
| Teeth Whitening | ✨ Teeth Whitening | In-office professional whitening. Up to 8 shades whiter in one session. Safe for enamel. | $250 | 60 min |
| Cavity Filling | 🔧 Cavity Filling | Tooth-colored composite filling. Painless procedure with local anesthesia. Matches your natural teeth. | $120 | 30 min |
| Root Canal | 🔧 Root Canal | Saves an infected tooth by removing the nerve and sealing. Done under anesthesia, virtually painless. | $450 | 90 min |
| Dental Implant | 🦷 Dental Implant | Permanent tooth replacement. Titanium implant with porcelain crown. Looks and functions like a natural tooth. Consultation required first. | $1,500 | Consultation + surgery |

**Dermatology**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Skin Consultation | 🧴 Skin Consultation | Full skin evaluation with dermatologist. Personalized treatment plan for any skin concern. | $80 | 30 min |
| Acne Treatment | 🧴 Acne Treatment | Clinical acne assessment and treatment plan. May include topical therapy, medication, or extraction. | $100 | 30 min |
| Mole & Lesion Check | 🔎 Mole Check | Dermatoscopy exam of suspicious moles or skin lesions. Biopsy if needed. Early detection is key. | $90 | 20 min |
| Laser Treatment | ⚡ Laser Treatment | Skin resurfacing, scar reduction, or hair removal. Consultation determines the right laser type for you. | $200/session | 30-60 min |

**Pediatrics**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Well-Child Visit | 👶 Well-Child Visit | Growth and development checkup. Height, weight, milestones, and general health assessment. | $65 | 30 min |
| Vaccination | 💉 Vaccination | Scheduled immunizations per age guidelines. We carry all standard childhood and adolescent vaccines. | $40/vaccine | 15 min |
| Sick Visit | 🤒 Sick Visit | For fever, cold, ear infections, rashes, or any childhood illness. Same-day appointments available. | $70 | 20 min |

**Orthopedics**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Joint Pain Consultation | 🦴 Joint Pain Consultation | Assessment of chronic or acute joint pain — knee, shoulder, hip, wrist. Treatment options discussed. | $100 | 30 min |
| Sports Injury | ⚽ Sports Injury Assessment | Evaluation of sprains, strains, tears, and overuse injuries. Includes physical exam and treatment plan. | $110 | 30 min |
| X-Ray & Imaging | 📷 X-Ray & Imaging | Digital X-ray with same-day results. For fractures, joint problems, or pre-surgical planning. | $80 | 20 min |
| Physical Therapy | 🏋️ Physical Therapy Session | One-on-one guided therapy session. Stretching, strengthening, and mobility exercises. | $70/session | 45 min |

**Lab & Diagnostics**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Blood Work Panel | 🔬 Blood Work Panel | Complete blood count, metabolic panel, lipids, thyroid. Results within 24-48 hours. | $60 | 15 min (draw) |
| Urine Analysis | 🔬 Urine Analysis | Screens for UTIs, kidney issues, diabetes, and more. Quick in-clinic test. | $25 | 10 min |
| Full Body Checkup | 🏥 Full Body Checkup | Comprehensive wellness package — blood work, ECG, chest X-ray, BMI, vision, hearing. Complete health overview. | $250 | 90 min |
| COVID & Flu Test | 🦠 COVID & Flu Test | Rapid antigen or PCR testing. Results in 15 minutes (rapid) or 24 hours (PCR). | $35 | 15 min |

---

### Main Flow: Book Appointment

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What service do you need? | → Opens "Our Departments" menu |
| 2 | choice | Is this your first visit with us? | Yes, first time, No, I've been here before |
| 3 | text | What's your full name? | — |
| 4 | text | Date of birth? | — |
| 5 | text | Can you briefly describe your symptoms or reason for the visit? | — |
| 6 | choice_with_manual | When would you like to come? | Tomorrow, This week, Next week, *or type a specific date* |
| 7 | choice | Do you prefer morning or afternoon? | Morning (8-12), Afternoon (12-5) |
| 8 | text | Phone number for confirmation? | — |

**Confirmation:**
```
Here's what I have 📋

• Service: Dental Cleaning
• First visit: Yes
• Name: David Kim
• DOB: March 15, 1990
• Reason: Regular cleaning, some sensitivity
• Date: This week
• Time: Morning (8-12)
• Phone: +1 555-0456

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What service do you need?  
> *(shows menu: Our Departments → Dental → Dental Cleaning)*  
> **User:** Dental Cleaning  
>
> **Bot:** Is this your first visit with us?  
> **User:** Yes, first time  
>
> **Bot:** What's your full name?  
> **User:** David Kim  
>
> **Bot:** Date of birth?  
> **User:** March 15, 1990  
>
> **Bot:** Can you briefly describe your symptoms or reason for the visit?  
> **User:** Regular cleaning, I also have some tooth sensitivity on the left side  
>
> **Bot:** When would you like to come?  
> **User:** This week  
>
> **Bot:** Do you prefer morning or afternoon?  
> **User:** Morning (8-12)  
>
> **Bot:** Phone number for confirmation?  
> **User:** +1 555-0456  
>
> **Bot:** Here's what I have 📋  
> • Service: Dental Cleaning  
> • First visit: Yes  
> • Name: David Kim  
> • DOB: March 15, 1990  
> • Reason: Regular cleaning, some tooth sensitivity on the left side  
> • Date: This week  
> • Time: Morning (8-12)  
> • Phone: +1 555-0456  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Booked! 🏥 You'll receive a confirmation shortly, David. Please bring your ID and any medical records. See you soon!


---
---

# ═══════════════════════════════════════════════
# 4. CAR RENTAL
# ═══════════════════════════════════════════════

**Template Name:** DriveEasy Rentals  
**Welcome Message:** "Hey! 🚗 Welcome to DriveEasy Rentals. Browse our fleet or book your ride below."

---

### Menu Structure

```
🚗 Our Fleet [behavior: menu]
├── 🚙 Economy [menu]
│   ├── Toyota Yaris [info]
│   ├── Hyundai i20 [info]
│   └── Kia Picanto [info]
├── 🚘 Compact [menu]
│   ├── Volkswagen Golf [info]
│   ├── Toyota Corolla [info]
│   └── Honda Civic [info]
├── 🚐 SUV & Crossover [menu]
│   ├── Toyota RAV4 [info]
│   ├── Nissan Qashqai [info]
│   └── BMW X3 [info]
├── ✨ Luxury [menu]
│   ├── Mercedes E-Class [info]
│   ├── BMW 5 Series [info]
│   └── Audi A6 [info]
└── 🚐 Van & Minibus [menu]
    ├── Ford Transit (Cargo) [info]
    ├── Mercedes Vito (Passenger) [info]
    └── 9-Seater Minibus [info]

📅 Book a Car [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-0400]
📍 Pickup Locations [behavior: action → link → locations page URL]
```

---

### Info Pages

**Economy**

| Vehicle | Title | Description | Price | Specs |
|---------|-------|-------------|-------|-------|
| Toyota Yaris | 🚙 Toyota Yaris | Fuel-efficient and easy to park. Perfect for city driving. Automatic, A/C, Bluetooth. 5 seats. | $29/day | Manual/Auto, Petrol |
| Hyundai i20 | 🚙 Hyundai i20 | Compact hatchback with modern features. Great on fuel, comfortable for short trips. | $27/day | Auto, Petrol |
| Kia Picanto | 🚙 Kia Picanto | Our most affordable option. Small but mighty — ideal for solo travelers or couples. | $22/day | Manual, Petrol |

**Compact**

| Vehicle | Title | Description | Price | Specs |
|---------|-------|-------------|-------|-------|
| VW Golf | 🚘 Volkswagen Golf | The all-rounder. Comfortable, reliable, and fun to drive. Plenty of trunk space. | $39/day | Auto, Petrol/Diesel |
| Toyota Corolla | 🚘 Toyota Corolla | Smooth ride for longer distances. Excellent reliability and fuel economy. Sedan or hatchback. | $38/day | Auto, Hybrid |
| Honda Civic | 🚘 Honda Civic | Sporty design with premium interior. Perfect balance of comfort and performance. | $42/day | Auto, Petrol |

**SUV & Crossover**

| Vehicle | Title | Description | Price | Specs |
|---------|-------|-------------|-------|-------|
| Toyota RAV4 | 🚐 Toyota RAV4 | Spacious crossover with optional AWD. Ideal for families or road trips. Large trunk. | $55/day | Auto, Hybrid/AWD |
| Nissan Qashqai | 🚐 Nissan Qashqai | Compact SUV with elevated seating. Great visibility and comfortable ride. | $50/day | Auto, Petrol |
| BMW X3 | 🚐 BMW X3 | Premium compact SUV with luxury interior. AWD, heated seats, advanced nav. | $75/day | Auto, Diesel/AWD |

**Luxury**

| Vehicle | Title | Description | Price | Specs |
|---------|-------|-------------|-------|-------|
| Mercedes E-Class | ✨ Mercedes E-Class | Executive sedan with full leather, ambient lighting, premium sound. Arrive in style. | $95/day | Auto, Diesel |
| BMW 5 Series | ✨ BMW 5 Series | Performance luxury with adaptive cruise, 360° camera, massage seats. Business class on wheels. | $99/day | Auto, Diesel/Hybrid |
| Audi A6 | ✨ Audi A6 | Elegant and tech-packed. Quattro AWD, virtual cockpit, matrix LED lights. | $92/day | Auto, Quattro AWD |

**Van & Minibus**

| Vehicle | Title | Description | Price | Specs |
|---------|-------|-------------|-------|-------|
| Ford Transit | 🚐 Ford Transit (Cargo) | Large cargo capacity for moving or business. Rear doors, partition. Up to 13 m³. | $65/day | Manual/Auto, Diesel |
| Mercedes Vito | 🚐 Mercedes Vito (Passenger) | 8-seat passenger van. Perfect for airport groups or family trips. A/C throughout. | $75/day | Auto, Diesel |
| 9-Seater Minibus | 🚐 9-Seater Minibus | Full-size minibus for groups. Luggage space, A/C, comfortable seating. | $85/day | Auto, Diesel |

---

### Main Flow: Book a Car

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What kind of car would you like? | → Opens "Our Fleet" menu |
| 2 | choice_with_manual | When do you need to pick it up? | Tomorrow, This weekend, Next Monday, *or type a date* |
| 3 | choice_with_manual | When will you return it? | Same day, After 3 days, After a week, *or type a date* |
| 4 | choice | Where would you like to pick up? | Airport, City Center, Train Station |
| 5 | choice | Do you need any extras? | GPS navigation, Child seat, Additional driver, No extras |
| 6 | text | Full name (as on driving license)? | — |
| 7 | text | Phone number? | — |

**Confirmation:**
```
Here's what I have 📋

• Car: Toyota RAV4
• Pickup: This weekend
• Return: After a week
• Location: Airport
• Extras: GPS navigation
• Name: Mark Torres
• Phone: +1 555-0789

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What kind of car would you like?  
> *(shows menu: Our Fleet → SUV & Crossover → Toyota RAV4)*  
> **User:** Toyota RAV4  
>
> **Bot:** When do you need to pick it up?  
> **User:** This weekend  
>
> **Bot:** When will you return it?  
> **User:** After a week  
>
> **Bot:** Where would you like to pick up?  
> **User:** Airport  
>
> **Bot:** Do you need any extras?  
> **User:** GPS navigation  
>
> **Bot:** Full name (as on driving license)?  
> **User:** Mark Torres  
>
> **Bot:** Phone number?  
> **User:** +1 555-0789  
>
> **Bot:** Here's what I have 📋  
> • Car: Toyota RAV4  
> • Pickup: This weekend  
> • Return: After a week  
> • Location: Airport  
> • Extras: GPS navigation  
> • Name: Mark Torres  
> • Phone: +1 555-0789  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** You're all set, Mark! 🚗 Your RAV4 will be ready at the airport. Bring your driving license and a credit card. Safe travels!


---
---

# ═══════════════════════════════════════════════
# 5. FITNESS & GYM
# ═══════════════════════════════════════════════

**Template Name:** FitZone  
**Welcome Message:** "Welcome to FitZone! 💪 Whether you want to train, join a class, or get a membership — we've got you covered."

---

### Menu Structure

```
💳 Memberships [behavior: menu]
├── Basic (Gym Only) [info]
├── Standard (Gym + Classes) [info]
├── Premium (All Access) [info]
└── Student Membership [info]

🏋️ Group Classes [behavior: menu]
├── Yoga [info]
├── Spinning [info]
├── HIIT [info]
├── Boxing Fitness [info]
├── Pilates [info]
└── Zumba [info]

🎯 Personal Training [behavior: menu]
├── Single Session [info]
├── 5-Session Pack [info]
├── 10-Session Pack [info]
└── Online Coaching (monthly) [info]

📅 Sign Up / Book a Trial [behavior: action → start_flow]
📞 Call Front Desk [behavior: action → call → +1 555-0500]
📍 Our Location [behavior: action → link → google maps URL]
```

---

### Info Pages

**Memberships**

| Plan | Title | Description | Price | Details |
|------|-------|-------------|-------|---------|
| Basic | 💳 Basic Membership | Full gym floor access — cardio machines, free weights, and strength equipment. Come train whenever works for you. | $29/month | Gym floor only, no classes |
| Standard | 💳 Standard Membership | Gym floor plus unlimited group classes. Access lockers and showers. The most popular choice. | $49/month | Gym + all group classes |
| Premium | 💳 Premium All-Access | Everything included — gym, classes, sauna, pool, one PT session per month, towel service, and guest passes. | $79/month | Full facility access |
| Student | 💳 Student Membership | Valid student ID required. Gym floor and classes at a discounted rate. No contract. | $19/month | Gym + classes, valid ID needed |

**Group Classes**

| Class | Title | Description | Price | Duration |
|-------|-------|-------------|-------|----------|
| Yoga | 🧘 Yoga | Improve flexibility, balance, and mental clarity. Suitable for all levels from beginner to advanced. | Included w/ membership | 60 min |
| Spinning | 🚴 Spinning | High-energy indoor cycling. Great cardio, rhythm-based, with motivating music. Burn 400-600 calories per session. | Included w/ membership | 45 min |
| HIIT | ⚡ HIIT | High-intensity interval training. Short bursts of maximum effort with rest periods. Fast results, full body. | Included w/ membership | 30 min |
| Boxing Fitness | 🥊 Boxing Fitness | Cardio boxing with bag work, footwork, and combinations. No contact — all fitness, no fighting. | Included w/ membership | 45 min |
| Pilates | 🤸 Pilates | Core-focused strengthening and toning. Improves posture and body awareness. Mat-based with props. | Included w/ membership | 50 min |
| Zumba | 💃 Zumba | Dance-fitness party! Latin-inspired moves that are easy to follow. Fun workout that doesn't feel like work. | Included w/ membership | 50 min |

**Personal Training**

| Package | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Single Session | 🎯 Single PT Session | One-on-one session with a certified trainer. Custom workout, form correction, and fitness assessment. | $50 | 60 min |
| 5-Session Pack | 🎯 5-Session Pack | Commit to 5 sessions and save. Includes personalized workout plan and progress tracking. | $220 (save $30) | 60 min each |
| 10-Session Pack | 🎯 10-Session Pack | Best value for serious training. 10 sessions with ongoing plan adjustments and nutrition tips. | $400 (save $100) | 60 min each |
| Online Coaching | 🎯 Online Coaching | Monthly remote coaching — weekly workout plans, video check-ins, and unlimited chat support. Train from anywhere. | $120/month | Ongoing |

---

### Main Flow: Sign Up / Book a Trial

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What are you interested in? | → Opens full menu (Memberships / Classes / PT) |
| 2 | choice | What's your main fitness goal? | Lose weight, Build muscle, Improve flexibility, General fitness, Train for sport |
| 3 | choice | Have you trained at a gym before? | Yes regularly, Sometimes, I'm a complete beginner |
| 4 | text | What's your name? | — |
| 5 | text | Phone number? | — |
| 6 | choice_with_manual | When would you like to start or try a free session? | Tomorrow, This week, Next week, *or type a date* |

**Confirmation:**
```
Here's what I have 📋

• Interest: Standard Membership
• Goal: General fitness
• Experience: Sometimes
• Name: Alex Rivera
• Phone: +1 555-0321
• Start: This week

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What are you interested in?  
> *(shows menu: Memberships → Standard)*  
> **User:** Standard (Gym + Classes)  
>
> **Bot:** What's your main fitness goal?  
> **User:** General fitness  
>
> **Bot:** Have you trained at a gym before?  
> **User:** Sometimes  
>
> **Bot:** What's your name?  
> **User:** Alex Rivera  
>
> **Bot:** Phone number?  
> **User:** +1 555-0321  
>
> **Bot:** When would you like to start or try a free session?  
> **User:** This week  
>
> **Bot:** Here's what I have 📋  
> • Interest: Standard Membership  
> • Goal: General fitness  
> • Experience: Sometimes  
> • Name: Alex Rivera  
> • Phone: +1 555-0321  
> • Start: This week  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Welcome aboard, Alex! 💪 Our team will call you to arrange your free trial session. Bring workout clothes and water. Let's get started!


---
---

# ═══════════════════════════════════════════════
# 6. SPA & WELLNESS
# ═══════════════════════════════════════════════

**Template Name:** Serenity Spa  
**Welcome Message:** "Welcome to Serenity Spa 🌿 Your journey to relaxation starts here. Browse our treatments or book your session."

---

### Menu Structure

```
💆 Massage [behavior: menu]
├── Swedish Massage [info]
├── Deep Tissue Massage [info]
├── Hot Stone Massage [info]
├── Aromatherapy Massage [info]
└── Couples Massage [info]

🧖 Body Treatments [behavior: menu]
├── Body Scrub & Polish [info]
├── Detox Body Wrap [info]
├── Mud Therapy [info]
└── Salt Glow Treatment [info]

✨ Facial Treatments [behavior: menu]
├── Hydrating Facial [info]
├── Gold Facial [info]
├── Oxygen Facial [info]
└── LED Light Therapy [info]

🎁 Spa Packages [behavior: menu]
├── Half-Day Retreat [info]
├── Full-Day Escape [info]
├── Couples Retreat [info]
└── Bridal Bliss Package [info]

📅 Book a Session [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-0600]
🎁 Gift Cards [behavior: action → link → gift card page URL]
```

---

### Info Pages

**Massage**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Swedish Massage | 💆 Swedish Massage | Classic full-body massage with long, flowing strokes. Relieves tension and promotes deep relaxation. | $70 | 60 min |
| Deep Tissue | 💆 Deep Tissue Massage | Firm pressure targeting muscle knots and chronic tension. Ideal for back pain, neck stiffness, and recovery. | $85 | 60 min |
| Hot Stone | 💆 Hot Stone Massage | Heated basalt stones placed on key points while therapist works deep tension. Deeply soothing. | $95 | 75 min |
| Aromatherapy | 💆 Aromatherapy Massage | Essential oil-infused massage. Choose your blend — lavender (calm), eucalyptus (refresh), or citrus (energize). | $80 | 60 min |
| Couples Massage | 💑 Couples Massage | Side-by-side massage in our couples room. Two therapists, champagne, and candlelight. Perfect for date night. | $160 | 60 min |

**Body Treatments**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Body Scrub | ✨ Body Scrub & Polish | Exfoliates dead skin, smooths texture, and boosts circulation. Sea salt or sugar scrub with moisturizing finish. | $65 | 45 min |
| Detox Wrap | 🌿 Detox Body Wrap | Mineral-rich wrap that draws out toxins and reduces puffiness. Includes relaxation time while wrapped. | $80 | 60 min |
| Mud Therapy | 🌿 Mud Therapy | Therapeutic Dead Sea mud applied to full body. Draws out impurities, relieves joint pain, softens skin. | $90 | 75 min |
| Salt Glow | ✨ Salt Glow Treatment | Himalayan salt scrub followed by warm oil massage. Leaves skin silky and deeply nourished. | $75 | 50 min |

**Facial Treatments**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Hydrating Facial | 💧 Hydrating Facial | Intensive moisture boost with hyaluronic acid serum and cooling mask. Perfect for dry or stressed skin. | $65 | 45 min |
| Gold Facial | 💎 Gold Facial | 24K gold-infused mask with collagen. Firms skin, reduces fine lines, gives an instant glow. | $120 | 60 min |
| Oxygen Facial | 🌬 Oxygen Facial | Pressurized oxygen with botanical serums sprayed onto skin. Plumps, brightens, and hydrates instantly. | $95 | 50 min |
| LED Light Therapy | ⚡ LED Light Therapy | Non-invasive light therapy. Red for anti-aging, blue for acne, green for pigmentation. Zero downtime. | $70 | 30 min |

**Spa Packages**

| Package | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Half-Day Retreat | 🌿 Half-Day Retreat | Swedish massage + hydrating facial + body scrub. Access to sauna and relaxation lounge. | $180 (save $20) | 3 hours |
| Full-Day Escape | 🌿 Full-Day Escape | Hot stone massage + gold facial + body wrap + lunch + pool access. A day of complete renewal. | $320 (save $55) | 6 hours |
| Couples Retreat | 💑 Couples Retreat | Couples massage + facial for each + champagne + chocolate. Private suite experience. | $350 (save $40) | 3 hours |
| Bridal Bliss | 👰 Bridal Bliss Package | Facial + body polish + aromatherapy massage + manicure & pedicure. Walk down the aisle glowing. | $280 (save $35) | 4 hours |

---

### Main Flow: Book a Session

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | Which treatment interests you? | → Opens full menu |
| 2 | text | What's your name? | — |
| 3 | choice_with_manual | When would you like to come? | Tomorrow, This Saturday, Next week, *or type a date* |
| 4 | choice | Prefer morning or afternoon? | Morning (9-12), Afternoon (12-5), Evening (5-8) |
| 5 | choice | Do you have any health conditions we should know about? | Pregnancy, Heart condition, Skin allergies, None |
| 6 | text | Phone number for booking confirmation? | — |

**Confirmation:**
```
Here's what I have 📋

• Treatment: Hot Stone Massage
• Name: Jessica Liu
• Date: This Saturday
• Time: Afternoon (12-5)
• Health notes: None
• Phone: +1 555-0987

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** Which treatment interests you?  
> *(shows menu: Massage → Hot Stone Massage)*  
> **User:** Hot Stone Massage  
>
> **Bot:** What's your name?  
> **User:** Jessica Liu  
>
> **Bot:** When would you like to come?  
> **User:** This Saturday  
>
> **Bot:** Prefer morning or afternoon?  
> **User:** Afternoon (12-5)  
>
> **Bot:** Do you have any health conditions we should know about?  
> **User:** None  
>
> **Bot:** Phone number for booking confirmation?  
> **User:** +1 555-0987  
>
> **Bot:** Here's what I have 📋  
> • Treatment: Hot Stone Massage  
> • Name: Jessica Liu  
> • Date: This Saturday  
> • Time: Afternoon (12-5)  
> • Health notes: None  
> • Phone: +1 555-0987  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Wonderful, Jessica! 🌿 Your hot stone massage is booked for Saturday afternoon. Please arrive 15 minutes early. We look forward to pampering you!


---
---

# ═══════════════════════════════════════════════
# 7. RESTAURANT & CAFE
# ═══════════════════════════════════════════════

**Template Name:** The Garden Kitchen  
**Welcome Message:** "Welcome to The Garden Kitchen! 🍽 Browse our menu, make a reservation, or order for pickup."

---

### Menu Structure

```
🍽 Our Menu [behavior: menu]
├── 🥗 Starters [menu]
│   ├── Bruschetta [info]
│   ├── Caesar Salad [info]
│   ├── Soup of the Day [info]
│   └── Grilled Halloumi [info]
├── 🥩 Mains [menu]
│   ├── Grilled Salmon [info]
│   ├── Ribeye Steak [info]
│   ├── Chicken Alfredo Pasta [info]
│   ├── Mushroom Risotto [info]
│   └── Garden Veggie Burger [info]
├── 🍰 Desserts [menu]
│   ├── Tiramisu [info]
│   ├── Chocolate Lava Cake [info]
│   ├── Crème Brûlée [info]
│   └── Fresh Fruit Tart [info]
└── 🥤 Drinks [menu]
    ├── Fresh Juices [info]
    ├── Specialty Coffee [info]
    ├── Smoothies [info]
    ├── House Wine (Glass) [info]
    └── Craft Cocktails [info]

🎉 Private Dining [behavior: menu]
├── Birthday Package [info]
├── Business Dinner [info]
└── Custom Event [info]

📅 Reserve a Table [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-0700]
📍 Directions [behavior: action → link → google maps URL]
```

---

### Info Pages

**Starters**

| Item | Title | Description | Price | — |
|------|-------|-------------|-------|---|
| Bruschetta | 🍅 Bruschetta | Toasted ciabatta with fresh tomatoes, basil, garlic, and extra-virgin olive oil. Simple and delicious. | $8 | — |
| Caesar Salad | 🥗 Caesar Salad | Crisp romaine, shaved parmesan, house-made croutons, and our signature Caesar dressing. Add grilled chicken +$4. | $12 | — |
| Soup of the Day | 🍲 Soup of the Day | Chef's daily creation made from fresh, seasonal ingredients. Served with artisan bread. Ask us what's today! | $9 | — |
| Grilled Halloumi | 🧀 Grilled Halloumi | Golden grilled halloumi on mixed greens with cherry tomatoes, mint, and pomegranate dressing. | $11 | — |

**Mains**

| Item | Title | Description | Price | — |
|------|-------|-------------|-------|---|
| Grilled Salmon | 🐟 Grilled Salmon | Atlantic salmon fillet, crispy skin, served with asparagus and lemon butter sauce. | $22 | — |
| Ribeye Steak | 🥩 Ribeye Steak | 10oz prime ribeye, cooked to your preference. Served with roasted potatoes and seasonal vegetables. | $28 | — |
| Chicken Alfredo | 🍝 Chicken Alfredo Pasta | Creamy parmesan alfredo with grilled chicken breast over fettuccine. Rich, comforting, and generous. | $18 | — |
| Mushroom Risotto | 🍚 Mushroom Risotto | Arborio rice slowly cooked with porcini and wild mushrooms, finished with truffle oil and parmesan. Vegetarian. | $17 | — |
| Veggie Burger | 🌿 Garden Veggie Burger | House-made black bean and quinoa patty with avocado, pickled onion, and chipotle aioli. Vegan-friendly. | $15 | — |

**Desserts**

| Item | Title | Description | Price | — |
|------|-------|-------------|-------|---|
| Tiramisu | ☕ Tiramisu | Classic Italian layered dessert with espresso-soaked ladyfingers and mascarpone cream. Made fresh daily. | $10 | — |
| Chocolate Lava Cake | 🍫 Chocolate Lava Cake | Warm chocolate cake with a molten center, served with vanilla ice cream. Allow 12 minutes — worth the wait. | $12 | — |
| Crème Brûlée | 🍮 Crème Brûlée | Vanilla bean custard with a caramelized sugar top. Cracked tableside. Classic French elegance. | $10 | — |
| Fresh Fruit Tart | 🍓 Fresh Fruit Tart | Buttery pastry shell with pastry cream, topped with seasonal fresh fruits and apricot glaze. | $9 | — |

**Drinks**

| Item | Title | Description | Price | — |
|------|-------|-------------|-------|---|
| Fresh Juices | 🍊 Fresh Juices | Squeezed to order — orange, watermelon, carrot-ginger, or green detox. | $6 | — |
| Specialty Coffee | ☕ Specialty Coffee | Single-origin espresso, flat white, cortado, or pour-over. Barista-crafted with premium beans. | $5 | — |
| Smoothies | 🥤 Smoothies | Blended fresh — berry blast, tropical mango, green goodness, or peanut butter banana. | $8 | — |
| House Wine | 🍷 House Wine (Glass) | Red (Merlot) or white (Sauvignon Blanc). Selected from local vineyards. | $9 | — |
| Craft Cocktails | 🍸 Craft Cocktails | Signature cocktails — Garden Spritz, Smoky Old Fashioned, Citrus Margarita, Espresso Martini. | $14 | — |

**Private Dining**

| Package | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Birthday Package | 🎂 Birthday Package | Private section for up to 20 guests. Includes decorated table, prix fixe menu, and complimentary birthday cake. | $45/person | Min 8 guests |
| Business Dinner | 💼 Business Dinner | Private dining room with AV equipment. 3-course set menu with wine pairing. Professional service. | $65/person | Min 6 guests |
| Custom Event | 🎉 Custom Event | Fully customizable private event. Choose your menu, decor, and setup. Our events team will work with you. | From $500 | Flexible |

---

### Main Flow: Reserve a Table

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | choice | What kind of reservation? | Regular table, Private dining event |
| 2 | select_from_menu | Interested in any specific menu section or package? | → Opens menu (Our Menu sections / Private Dining) |
| 3 | choice_with_manual | How many guests? | 2, 3-4, 5-6, 7-10, *or type a number* |
| 4 | choice_with_manual | What date? | Today, Tomorrow, This Friday, This Saturday, *or type a date* |
| 5 | choice | What time? | 12:00 PM, 1:00 PM, 6:00 PM, 7:00 PM, 8:00 PM |
| 6 | choice | Any dietary requirements? | Vegetarian, Vegan, Gluten-free, Nut allergy, None |
| 7 | text | Name for the reservation? | — |
| 8 | text | Phone number? | — |

**Confirmation:**
```
Here's what I have 📋

• Type: Regular table
• Interest: Mains section
• Guests: 4
• Date: This Saturday
• Time: 7:00 PM
• Dietary: None
• Name: Rachel Green
• Phone: +1 555-0234

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What kind of reservation?  
> **User:** Regular table  
>
> **Bot:** Interested in any specific menu section or package?  
> *(shows menu: Our Menu → Mains)*  
> **User:** Mains  
>
> **Bot:** How many guests?  
> **User:** 4  
>
> **Bot:** What date?  
> **User:** This Saturday  
>
> **Bot:** What time?  
> **User:** 7:00 PM  
>
> **Bot:** Any dietary requirements?  
> **User:** None  
>
> **Bot:** Name for the reservation?  
> **User:** Rachel Green  
>
> **Bot:** Phone number?  
> **User:** +1 555-0234  
>
> **Bot:** Here's what I have 📋  
> • Type: Regular table  
> • Interest: Mains section  
> • Guests: 4  
> • Date: This Saturday  
> • Time: 7:00 PM  
> • Dietary: None  
> • Name: Rachel Green  
> • Phone: +1 555-0234  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Table for 4 is reserved, Rachel! 🍽 This Saturday at 7 PM. We'll send a reminder the day before. Bon appétit!


---
---

# ═══════════════════════════════════════════════
# 8. DRIVING SCHOOL
# ═══════════════════════════════════════════════

**Template Name:** SafeRoad Academy  
**Welcome Message:** "Welcome to SafeRoad Academy! 🚗 Ready to get on the road? Check out our programs or sign up for lessons."

---

### Menu Structure

```
🚗 Programs [behavior: menu]
├── 🚙 Car License (Class B) [menu]
│   ├── Beginner Package (30 hours) [info]
│   ├── Standard Package (20 hours) [info]
│   ├── Refresher Course (10 hours) [info]
│   └── Single Lesson [info]
├── 🏍 Motorcycle License (Class A) [menu]
│   ├── Full Course (20 hours) [info]
│   ├── Track Practice (5 hours) [info]
│   └── Single Lesson [info]
├── 🚛 Commercial License (CDL) [menu]
│   ├── CDL Class A (Tractor-Trailer) [info]
│   ├── CDL Class B (Bus/Large Truck) [info]
│   └── Hazmat Endorsement [info]
└── 📚 Theory & Exam Prep [menu]
    ├── Theory Course (Online) [info]
    ├── Practice Tests (Online) [info]
    └── Exam Day Preparation [info]

📅 Enroll Now [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-0800]
📍 Our School [behavior: action → link → google maps URL]
```

---

### Info Pages

**Car License**

| Package | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Beginner 30h | 🚗 Beginner Package | Complete training from zero. 30 hours of driving instruction, theory included, exam preparation, and one exam attempt. Perfect for first-time drivers. | $1,200 | 30 hours (over 6-8 weeks) |
| Standard 20h | 🚗 Standard Package | For those with some experience. 20 hours of practical driving, includes highway, parking, and exam prep. | $850 | 20 hours (over 4-5 weeks) |
| Refresher 10h | 🚗 Refresher Course | Haven't driven in a while? 10 hours to rebuild confidence. Focus areas based on your needs. | $450 | 10 hours (flexible) |
| Single Lesson | 🚗 Single Lesson | Individual 1-hour lesson. Great for specific practice — parking, highway, or pre-exam polish. | $50 | 60 min |

**Motorcycle License**

| Package | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Full Course | 🏍 Full Motorcycle Course | Complete motorcycle training from basics to road riding. Includes protective gear during lessons. | $800 | 20 hours (over 4 weeks) |
| Track Practice | 🏍 Track Practice | 5 hours of controlled-environment practice. Slow maneuvers, emergency braking, and cornering technique. | $250 | 5 hours |
| Single Lesson | 🏍 Motorcycle Single Lesson | One hour with instructor on our training track or road. Bike and gear provided. | $55 | 60 min |

**Commercial License**

| Package | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| CDL Class A | 🚛 CDL Class A | Tractor-trailer training. Classroom, yard maneuvers, and road training. Prepares for the CDL exam. | $3,500 | 160 hours (4 weeks) |
| CDL Class B | 🚛 CDL Class B | Bus and large truck training. Covers pre-trip inspection, urban driving, and backing maneuvers. | $2,800 | 120 hours (3 weeks) |
| Hazmat | ⚠️ Hazmat Endorsement | Additional training for hazardous materials transport. Covers safety regulations and handling procedures. | $500 | 20 hours |

**Theory & Exam Prep**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Theory Course | 📚 Theory Course (Online) | Full online theory course with video lessons, rules of the road, and road signs. Learn at your own pace. | $100 | Self-paced (avg. 2 weeks) |
| Practice Tests | 📝 Practice Tests | Unlimited access to 500+ practice questions mimicking the real exam. Track your progress. | $30 | Unlimited for 3 months |
| Exam Day Prep | 🎯 Exam Day Preparation | 2-hour session the day before your exam. Mock test, final review, and tips to calm your nerves. | $60 | 2 hours |

---

### Main Flow: Enroll Now

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What program are you interested in? | → Opens "Programs" menu |
| 2 | choice | Do you have any driving experience? | No, complete beginner, Some experience but no license, Licensed but need practice, Switching license type |
| 3 | text | How old are you? | — |
| 4 | choice_with_manual | When would you like to start? | Next week, In 2 weeks, Next month, *or type a date* |
| 5 | choice | Prefer morning or evening lessons? | Morning (8-12), Afternoon (12-4), Evening (4-8), Weekends only |
| 6 | text | Full name? | — |
| 7 | text | Phone number? | — |

**Confirmation:**
```
Here's what I have 📋

• Program: Beginner Package (30 hours)
• Experience: Complete beginner
• Age: 18
• Start: Next week
• Preferred time: Evening (4-8)
• Name: Tyler Mitchell
• Phone: +1 555-0567

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What program are you interested in?  
> *(shows menu: Programs → Car License → Beginner Package)*  
> **User:** Beginner Package (30 hours)  
>
> **Bot:** Do you have any driving experience?  
> **User:** No, complete beginner  
>
> **Bot:** How old are you?  
> **User:** 18  
>
> **Bot:** When would you like to start?  
> **User:** Next week  
>
> **Bot:** Prefer morning or evening lessons?  
> **User:** Evening (4-8)  
>
> **Bot:** Full name?  
> **User:** Tyler Mitchell  
>
> **Bot:** Phone number?  
> **User:** +1 555-0567  
>
> **Bot:** Here's what I have 📋  
> • Program: Beginner Package (30 hours)  
> • Experience: Complete beginner  
> • Age: 18  
> • Start: Next week  
> • Preferred time: Evening (4-8)  
> • Name: Tyler Mitchell  
> • Phone: +1 555-0567  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** You're enrolled, Tyler! 🚗 We'll call you to schedule your first lesson. Bring your ID and glasses (if needed). Welcome to SafeRoad!


---
---

# ═══════════════════════════════════════════════
# 9. CONSULTING SERVICES
# ═══════════════════════════════════════════════

**Template Name:** Vertex Consulting  
**Welcome Message:** "Welcome to Vertex Consulting 📊 We help businesses grow smarter. Explore our services or book a consultation."

---

### Menu Structure

```
📊 Our Services [behavior: menu]
├── 📈 Business Strategy [menu]
│   ├── Business Plan Development [info]
│   ├── Market Entry Strategy [info]
│   ├── Growth & Scaling [info]
│   └── Competitive Analysis [info]
├── 💰 Financial Consulting [menu]
│   ├── Financial Health Audit [info]
│   ├── Tax Planning & Optimization [info]
│   ├── Fundraising & Investor Prep [info]
│   └── Cash Flow Management [info]
├── ⚖️ Legal Advisory [menu]
│   ├── Business Formation [info]
│   ├── Contract Review [info]
│   ├── Compliance & Regulatory [info]
│   └── Intellectual Property [info]
├── 💻 IT & Digital [menu]
│   ├── Digital Transformation [info]
│   ├── Cybersecurity Assessment [info]
│   ├── Cloud Migration [info]
│   └── Software Selection [info]
└── 📣 Marketing & Branding [menu]
    ├── Brand Strategy [info]
    ├── Digital Marketing Plan [info]
    ├── Social Media Strategy [info]
    └── SEO & Content Strategy [info]

📅 Book a Consultation [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-0900]
🌐 Our Website [behavior: action → link → website URL]
```

---

### Info Pages

**Business Strategy**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Business Plan | 📈 Business Plan Development | Comprehensive business plan with market analysis, financial projections, and roadmap. Ready for banks or investors. | $2,500 | 2-3 weeks |
| Market Entry | 📈 Market Entry Strategy | Research-backed strategy for entering new markets or segments. Competitive landscape, pricing, and channel planning. | $3,000 | 3-4 weeks |
| Growth & Scaling | 📈 Growth & Scaling | For businesses ready to scale. Process optimization, team structure, and growth acceleration framework. | $2,000 | 2 weeks |
| Competitive Analysis | 📈 Competitive Analysis | Deep dive into your competitive landscape. Positioning gaps, opportunities, and actionable recommendations. | $1,500 | 1-2 weeks |

**Financial Consulting**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Financial Audit | 💰 Financial Health Audit | Full review of your finances — P&L, balance sheet, cost structure, and profitability analysis with recommendations. | $1,800 | 1-2 weeks |
| Tax Planning | 💰 Tax Planning | Optimize your tax position legally. Identify deductions, structure advice, and compliance review. | $1,200 | 1 week |
| Fundraising | 💰 Fundraising & Investor Prep | Pitch deck, financial model, and investor outreach strategy. Coaching for investor meetings. | $3,500 | 3-4 weeks |
| Cash Flow | 💰 Cash Flow Management | Analyze and improve your cash cycle. Forecasting tools, payment optimization, and working capital advice. | $1,000 | 1 week |

**Legal Advisory**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Business Formation | ⚖️ Business Formation | LLC, Corporation, or Partnership setup. Includes registration, operating agreements, and tax structure advice. | $800 | 1 week |
| Contract Review | ⚖️ Contract Review | Expert review of business contracts — vendor, client, partnership, employment. Risk assessment and redlining. | $300/contract | 2-3 days |
| Compliance | ⚖️ Compliance & Regulatory | Ensure your business meets industry regulations. Gap analysis and compliance roadmap. | $1,500 | 2 weeks |
| IP Protection | ⚖️ Intellectual Property | Trademark, copyright, and patent strategy. Filing assistance and IP portfolio management. | $1,200 | 2-3 weeks |

**IT & Digital**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Digital Transformation | 💻 Digital Transformation | End-to-end assessment and roadmap to digitize your operations. Tools, workflows, and change management. | $4,000 | 4-6 weeks |
| Cybersecurity | 💻 Cybersecurity Assessment | Vulnerability scan, risk assessment, and security recommendations. Protect your data and systems. | $2,000 | 1-2 weeks |
| Cloud Migration | 💻 Cloud Migration | Strategy and execution plan for moving to AWS, Azure, or GCP. Cost analysis and timeline. | $2,500 | 2-3 weeks |
| Software Selection | 💻 Software Selection | Evaluate and recommend the right software stack for your needs. CRM, ERP, project management, and more. | $1,000 | 1 week |

**Marketing & Branding**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Brand Strategy | 📣 Brand Strategy | Define your brand identity — positioning, voice, visual direction, and messaging framework. | $2,000 | 2 weeks |
| Digital Marketing | 📣 Digital Marketing Plan | Complete digital marketing strategy — channels, budget allocation, KPIs, and campaign roadmap. | $1,800 | 2 weeks |
| Social Media | 📣 Social Media Strategy | Platform selection, content calendar, growth tactics, and engagement strategy. Tailored to your audience. | $1,200 | 1-2 weeks |
| SEO & Content | 📣 SEO & Content Strategy | Keyword research, content plan, technical SEO audit, and link-building strategy for organic growth. | $1,500 | 2 weeks |

---

### Main Flow: Book a Consultation

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What service area do you need help with? | → Opens "Our Services" menu |
| 2 | choice | What describes your business best? | Startup (pre-revenue), Small business (1-10 people), Growing company (10-50), Established (50+) |
| 3 | text | Can you briefly describe what you need help with? | — |
| 4 | text | Your name? | — |
| 5 | text | Company name? | — |
| 6 | text | Best email or phone to reach you? | — |
| 7 | choice | How would you prefer to meet? | Video call (Zoom), Phone call, In-person at our office |

**Confirmation:**
```
Here's what I have 📋

• Service: Business Plan Development
• Business size: Startup (pre-revenue)
• Need: We're launching a food delivery app and need a solid business plan for investor meetings
• Name: Jordan Walsh
• Company: FreshBite Inc.
• Contact: jordan@freshbite.com
• Meeting: Video call (Zoom)

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What service area do you need help with?  
> *(shows menu: Our Services → Business Strategy → Business Plan Development)*  
> **User:** Business Plan Development  
>
> **Bot:** What describes your business best?  
> **User:** Startup (pre-revenue)  
>
> **Bot:** Can you briefly describe what you need help with?  
> **User:** We're launching a food delivery app and need a solid business plan for investor meetings  
>
> **Bot:** Your name?  
> **User:** Jordan Walsh  
>
> **Bot:** Company name?  
> **User:** FreshBite Inc.  
>
> **Bot:** Best email or phone to reach you?  
> **User:** jordan@freshbite.com  
>
> **Bot:** How would you prefer to meet?  
> **User:** Video call (Zoom)  
>
> **Bot:** Here's what I have 📋  
> • Service: Business Plan Development  
> • Business size: Startup (pre-revenue)  
> • Need: Launching a food delivery app, need business plan for investors  
> • Name: Jordan Walsh  
> • Company: FreshBite Inc.  
> • Contact: jordan@freshbite.com  
> • Meeting: Video call (Zoom)  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Thank you, Jordan! 📊 One of our strategy consultants will reach out within 24 hours to schedule your Zoom session. Looking forward to helping FreshBite succeed!


---
---

# ═══════════════════════════════════════════════
# 10. TRAVEL AGENCY
# ═══════════════════════════════════════════════

**Template Name:** Wanderlust Travel  
**Welcome Message:** "Welcome to Wanderlust Travel! ✈️ Ready for your next adventure? Browse our trips or let us plan something special."

---

### Menu Structure

```
✈️ Trip Types [behavior: menu]
├── 🏖 Beach & Island [menu]
│   ├── Maldives Escape [info]
│   ├── Bali Paradise [info]
│   ├── Greek Islands [info]
│   └── Cancún All-Inclusive [info]
├── 🏔 Adventure & Nature [menu]
│   ├── Swiss Alps Trekking [info]
│   ├── Costa Rica Eco-Tour [info]
│   ├── Iceland Northern Lights [info]
│   └── African Safari [info]
├── 🏛 City & Culture [menu]
│   ├── Paris & Rome Classic [info]
│   ├── Tokyo Explorer [info]
│   ├── Istanbul Heritage [info]
│   └── New York City Break [info]
├── 🚢 Cruises [menu]
│   ├── Mediterranean Cruise [info]
│   ├── Caribbean Cruise [info]
│   └── Norwegian Fjords [info]
└── 💼 Business Travel [menu]
    ├── Corporate Package [info]
    ├── Conference & Event Travel [info]
    └── Executive Airport Transfers [info]

📅 Plan My Trip [behavior: action → start_flow]
📞 Call an Agent [behavior: action → call → +1 555-1000]
🌐 Our Website [behavior: action → link → website URL]
```

---

### Info Pages

**Beach & Island**

| Trip | Title | Description | Price | Duration |
|------|-------|-------------|-------|----------|
| Maldives | 🏖 Maldives Escape | Overwater villa resort with private beach. Snorkeling, spa, sunset dining. All-inclusive option. Transfers from Malé airport. | From $2,800/person | 5 nights |
| Bali | 🏖 Bali Paradise | Ubud rice terraces, Seminyak beach, temple visits, and spa. Perfect mix of culture and relaxation. | From $1,500/person | 7 nights |
| Greek Islands | 🏖 Greek Islands | Island-hop between Santorini, Mykonos, and Crete. Whitewashed villages, blue domes, and crystal water. | From $1,800/person | 7 nights |
| Cancún | 🏖 Cancún All-Inclusive | 5-star resort, unlimited food and drinks, beach access, excursions to Chichen Itza and cenotes. | From $1,200/person | 5 nights |

**Adventure & Nature**

| Trip | Title | Description | Price | Duration |
|------|-------|-------------|-------|----------|
| Swiss Alps | 🏔 Swiss Alps Trekking | Guided hiking through Interlaken, Jungfrau, and Grindelwald. Mountain lodges, cable cars, and chocolate tastings. | From $2,200/person | 6 nights |
| Costa Rica | 🌿 Costa Rica Eco-Tour | Rainforest hikes, zip-lining, volcano hot springs, wildlife spotting. Eco-lodges throughout. | From $1,600/person | 7 nights |
| Iceland | 🌌 Iceland Northern Lights | Chase the aurora borealis. Hot springs, glaciers, waterfalls, and whale watching. Winter magic. | From $2,000/person | 5 nights |
| African Safari | 🦁 African Safari | Kenya or Tanzania game drives. Big Five spotting, Masai village visit, and luxury safari lodge. | From $3,500/person | 6 nights |

**City & Culture**

| Trip | Title | Description | Price | Duration |
|------|-------|-------------|-------|----------|
| Paris & Rome | 🏛 Paris & Rome Classic | Eiffel Tower, Louvre, Colosseum, Vatican. Train between cities. Guided tours and free time balanced. | From $1,800/person | 7 nights |
| Tokyo | 🗼 Tokyo Explorer | Shibuya, Asakusa, Akihabara, and day trip to Mt. Fuji. Mix of ultra-modern and ancient. JR pass included. | From $2,000/person | 6 nights |
| Istanbul | 🕌 Istanbul Heritage | Hagia Sophia, Grand Bazaar, Bosphorus cruise, and local food tours. East meets West. | From $900/person | 4 nights |
| NYC | 🗽 New York City Break | Broadway, Central Park, Times Square, and Statue of Liberty. Hotel in Midtown Manhattan. | From $1,400/person | 4 nights |

**Cruises**

| Cruise | Title | Description | Price | Duration |
|--------|-------|-------------|-------|----------|
| Mediterranean | 🚢 Mediterranean Cruise | Barcelona, Marseille, Rome, Naples, and Athens. All meals, entertainment, and port excursions. | From $1,600/person | 7 nights |
| Caribbean | 🚢 Caribbean Cruise | Jamaica, Cayman Islands, Cozumel. Crystal-clear beaches, snorkeling, and tropical vibes. | From $1,200/person | 5 nights |
| Norwegian Fjords | 🚢 Norwegian Fjords | Stunning fjord scenery, Bergen, Flåm railway, and midnight sun (summer). Unforgettable nature. | From $1,900/person | 7 nights |

**Business Travel**

| Service | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Corporate Package | 💼 Corporate Package | Flights, hotel, and ground transport for business trips. Negotiated corporate rates. Flexible changes. | Custom pricing | Per trip |
| Conference Travel | 💼 Conference Travel | Group bookings for conferences or team events. Hotel blocks, venue coordination, and logistics. | Custom pricing | Per event |
| Executive Transfers | 💼 Executive Transfers | Premium airport pickup and drop-off. Mercedes or BMW sedan. Available in 50+ cities worldwide. | From $80/transfer | Per trip |

---

### Main Flow: Plan My Trip

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What kind of trip are you dreaming of? | → Opens "Trip Types" menu |
| 2 | choice_with_manual | How many travelers? | 1 (Solo), 2 (Couple), 3-4 (Small group), 5+ (Group), *or type a number* |
| 3 | choice_with_manual | When are you planning to travel? | Next month, In 2-3 months, In 6 months, *or type specific dates* |
| 4 | choice | What's your budget range per person? | Under $1,000, $1,000-$2,000, $2,000-$3,000, Over $3,000, Flexible |
| 5 | text | Anything specific you'd like included or any preferences? | — |
| 6 | text | Your name? | — |
| 7 | text | Email or phone number? | — |

**Confirmation:**
```
Here's what I have 📋

• Trip: Greek Islands
• Travelers: 2 (Couple)
• When: In 2-3 months
• Budget: $1,000-$2,000 per person
• Preferences: We love seafood and want at least 2 islands
• Name: Emma & Jake Collins
• Contact: emma.collins@email.com

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What kind of trip are you dreaming of?  
> *(shows menu: Trip Types → Beach & Island → Greek Islands)*  
> **User:** Greek Islands  
>
> **Bot:** How many travelers?  
> **User:** 2 (Couple)  
>
> **Bot:** When are you planning to travel?  
> **User:** In 2-3 months  
>
> **Bot:** What's your budget range per person?  
> **User:** $1,000-$2,000  
>
> **Bot:** Anything specific you'd like included or any preferences?  
> **User:** We love seafood and want to visit at least 2 different islands  
>
> **Bot:** Your name?  
> **User:** Emma Collins  
>
> **Bot:** Email or phone number?  
> **User:** emma.collins@email.com  
>
> **Bot:** Here's what I have 📋  
> • Trip: Greek Islands  
> • Travelers: 2 (Couple)  
> • When: In 2-3 months  
> • Budget: $1,000-$2,000 per person  
> • Preferences: Love seafood, at least 2 islands  
> • Name: Emma Collins  
> • Contact: emma.collins@email.com  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Exciting, Emma! ✈️ One of our travel specialists will put together a custom Greek Islands itinerary for you. Expect to hear from us within 48 hours. Opa! 🇬🇷


---
---

# ═══════════════════════════════════════════════
# 11. EVENT PLANNING
# ═══════════════════════════════════════════════

**Template Name:** Stellar Events  
**Welcome Message:** "Welcome to Stellar Events! 🎉 Let's make your next event unforgettable. Browse our packages or start planning."

---

### Menu Structure

```
🎉 Event Packages [behavior: menu]
├── 💒 Weddings [menu]
│   ├── Intimate Wedding (up to 50) [info]
│   ├── Classic Wedding (50-150) [info]
│   ├── Grand Wedding (150+) [info]
│   └── Destination Wedding [info]
├── 💼 Corporate Events [menu]
│   ├── Team Building Day [info]
│   ├── Annual Gala [info]
│   ├── Product Launch [info]
│   └── Conference & Summit [info]
├── 🎂 Private Celebrations [menu]
│   ├── Birthday Party [info]
│   ├── Anniversary Celebration [info]
│   ├── Baby Shower [info]
│   └── Graduation Party [info]
└── 🎤 Special Events [menu]
    ├── Concert & Music Event [info]
    ├── Charity Fundraiser [info]
    └── Festival & Fair [info]

📅 Start Planning [behavior: action → start_flow]
📞 Call Our Team [behavior: action → call → +1 555-1100]
📸 Our Portfolio [behavior: action → link → portfolio URL]
```

---

### Info Pages

**Weddings**

| Package | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Intimate | 💒 Intimate Wedding | Beautiful ceremony and reception for up to 50 guests. Includes venue styling, florals, catering, and coordinator. | From $5,000 | Up to 50 guests |
| Classic | 💒 Classic Wedding | Full wedding production for 50-150 guests. Photography, DJ, décor, catering, wedding cake, and coordination. | From $12,000 | 50-150 guests |
| Grand | 💒 Grand Wedding | Premium celebration for 150+ guests. Live band or DJ, premium catering, videography, luxury décor, and full planning. | From $25,000 | 150+ guests |
| Destination | 💒 Destination Wedding | We handle everything — venue abroad, travel logistics, local vendors, legal requirements, and guest management. | From $15,000 | Custom |

**Corporate Events**

| Package | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Team Building | 💼 Team Building Day | Outdoor or indoor team activities, catering, and facilitation. Builds trust and boosts morale. | From $2,000 | 20-100 people |
| Annual Gala | 💼 Annual Gala | Formal evening event with dinner, entertainment, awards ceremony, and décor. Black-tie ready. | From $8,000 | 50-300 guests |
| Product Launch | 💼 Product Launch | Create buzz with a professional launch event. Stage, AV, media wall, catering, and PR coordination. | From $5,000 | Custom |
| Conference | 💼 Conference & Summit | Multi-session event planning. Venue, AV, speaker management, registration, and breakout rooms. | From $10,000 | 100-500 attendees |

**Private Celebrations**

| Package | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Birthday Party | 🎂 Birthday Party | Custom-themed party with décor, catering, entertainment, and cake. For kids, teens, or adults. | From $800 | 15-50 guests |
| Anniversary | 🥂 Anniversary Celebration | Elegant evening to celebrate your milestone. Dinner, champagne, flowers, and photo setup. | From $1,500 | 20-80 guests |
| Baby Shower | 👶 Baby Shower | Sweet and stylish celebration. Themed décor, games, light catering, and gift coordination. | From $600 | 15-40 guests |
| Graduation | 🎓 Graduation Party | Celebrate the achievement! Custom décor, catering, photo booth, and music. | From $1,000 | 20-60 guests |

**Special Events**

| Package | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Concert | 🎤 Concert & Music Event | Stage, sound, lighting, ticketing, security, and artist coordination. Small venue to outdoor stages. | From $8,000 | Custom |
| Charity Fundraiser | ❤️ Charity Fundraiser | Auction setup, donor management, entertainment, and event flow. Maximize donations with a memorable evening. | From $3,000 | Custom |
| Festival | 🎪 Festival & Fair | Multi-vendor coordination, permits, stages, food stalls, family activities, and marketing. | From $15,000 | Custom |

---

### Main Flow: Start Planning

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What type of event are you planning? | → Opens "Event Packages" menu |
| 2 | choice_with_manual | Approximately how many guests? | Under 30, 30-80, 80-150, 150-300, 300+, *or type a number* |
| 3 | choice_with_manual | When is the event? | In 1-2 months, In 3-6 months, In 6-12 months, *or type a date* |
| 4 | choice | What's your approximate budget? | Under $2,000, $2,000-$5,000, $5,000-$15,000, $15,000-$30,000, Over $30,000 |
| 5 | text | Tell us a bit about your vision — any theme, style, or must-haves? | — |
| 6 | text | Your name? | — |
| 7 | text | Phone number or email? | — |

**Confirmation:**
```
Here's what I have 📋

• Event: Classic Wedding (50-150)
• Guests: 80-150
• Date: In 6-12 months
• Budget: $15,000-$30,000
• Vision: Outdoor garden theme, live acoustic music, farm-to-table catering
• Name: Laura Bennett
• Contact: +1 555-0654

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What type of event are you planning?  
> *(shows menu: Event Packages → Weddings → Classic Wedding)*  
> **User:** Classic Wedding (50-150)  
>
> **Bot:** Approximately how many guests?  
> **User:** About 100  
>
> **Bot:** When is the event?  
> **User:** In 6-12 months  
>
> **Bot:** What's your approximate budget?  
> **User:** $15,000-$30,000  
>
> **Bot:** Tell us a bit about your vision — any theme, style, or must-haves?  
> **User:** Outdoor garden theme, live acoustic music, and we'd love farm-to-table catering  
>
> **Bot:** Your name?  
> **User:** Laura Bennett  
>
> **Bot:** Phone number or email?  
> **User:** +1 555-0654  
>
> **Bot:** Here's what I have 📋  
> • Event: Classic Wedding (50-150)  
> • Guests: ~100  
> • Date: In 6-12 months  
> • Budget: $15,000-$30,000  
> • Vision: Outdoor garden theme, live acoustic music, farm-to-table catering  
> • Name: Laura Bennett  
> • Contact: +1 555-0654  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** How exciting, Laura! 🎉 One of our wedding planners will reach out within 24 hours to start bringing your garden wedding to life. Congratulations!


---
---

# ═══════════════════════════════════════════════
# 12. EDUCATION & COURSES
# ═══════════════════════════════════════════════

**Template Name:** BrightPath Academy  
**Welcome Message:** "Welcome to BrightPath Academy! 📚 Expand your skills with our courses. Browse below or enroll now."

---

### Menu Structure

```
📚 Our Courses [behavior: menu]
├── 🌍 Languages [menu]
│   ├── English (Beginner to Advanced) [info]
│   ├── Spanish [info]
│   ├── French [info]
│   └── German [info]
├── 💻 Technology [menu]
│   ├── Web Development (Full Stack) [info]
│   ├── Data Science & Python [info]
│   ├── UI/UX Design [info]
│   └── Cybersecurity Basics [info]
├── 💼 Business & Management [menu]
│   ├── Project Management (PMP Prep) [info]
│   ├── Digital Marketing [info]
│   ├── Accounting & Finance Basics [info]
│   └── Leadership & Management [info]
├── 🎨 Creative Arts [menu]
│   ├── Graphic Design [info]
│   ├── Photography [info]
│   ├── Video Editing [info]
│   └── Creative Writing [info]
└── 📝 Test Preparation [menu]
    ├── IELTS Preparation [info]
    ├── TOEFL Preparation [info]
    ├── SAT Preparation [info]
    └── GRE Preparation [info]

📅 Enroll Now [behavior: action → start_flow]
📞 Call Admissions [behavior: action → call → +1 555-1200]
🌐 Student Portal [behavior: action → link → portal URL]
```

---

### Info Pages

**Languages**

| Course | Title | Description | Price | Duration |
|--------|-------|-------------|-------|----------|
| English | 🌍 English Course | From beginner to advanced. Grammar, conversation, writing, and listening. Small classes, native speakers. Certificate on completion. | $400/level | 8 weeks (2x/week) |
| Spanish | 🌍 Spanish Course | Learn to communicate in Spanish. Conversational focus with grammar foundations. Beginner and intermediate levels. | $350/level | 8 weeks (2x/week) |
| French | 🌍 French Course | Practical French for travel, work, or passion. Interactive classes with cultural immersion elements. | $350/level | 8 weeks (2x/week) |
| German | 🌍 German Course | Structured German learning — A1 to B2 levels. Grammar, speaking, and formal writing skills. | $380/level | 8 weeks (2x/week) |

**Technology**

| Course | Title | Description | Price | Duration |
|--------|-------|-------------|-------|----------|
| Web Dev | 💻 Web Development | Full-stack program: HTML, CSS, JavaScript, React, Node.js, and databases. Build real projects. Career-ready skills. | $1,200 | 12 weeks (3x/week) |
| Data Science | 💻 Data Science & Python | Python programming, data analysis, machine learning basics, and visualization. Pandas, NumPy, and scikit-learn. | $1,000 | 10 weeks (3x/week) |
| UI/UX Design | 💻 UI/UX Design | User research, wireframing, Figma, prototyping, and usability testing. Build a professional portfolio. | $800 | 8 weeks (2x/week) |
| Cybersecurity | 💻 Cybersecurity Basics | Network security, ethical hacking intro, security tools, and best practices. Great for IT professionals. | $900 | 8 weeks (2x/week) |

**Business & Management**

| Course | Title | Description | Price | Duration |
|--------|-------|-------------|-------|----------|
| Project Management | 💼 Project Management | PMP exam preparation with real case studies. Agile, Scrum, and waterfall methodologies covered. | $700 | 6 weeks (2x/week) |
| Digital Marketing | 💼 Digital Marketing | SEO, Google Ads, social media, email marketing, and analytics. Hands-on campaigns with real budgets. | $600 | 6 weeks (2x/week) |
| Accounting | 💼 Accounting & Finance | Bookkeeping, financial statements, budgeting, and tax basics. Practical skills for business owners. | $500 | 6 weeks (2x/week) |
| Leadership | 💼 Leadership & Management | Communication, team building, conflict resolution, and strategic thinking. For new and aspiring managers. | $550 | 4 weeks (2x/week) |

**Creative Arts**

| Course | Title | Description | Price | Duration |
|--------|-------|-------------|-------|----------|
| Graphic Design | 🎨 Graphic Design | Adobe Photoshop, Illustrator, and InDesign. Logo design, social media graphics, and print materials. | $650 | 8 weeks (2x/week) |
| Photography | 📷 Photography | Camera basics, composition, lighting, and editing. Portrait, landscape, and product photography. DSLR recommended. | $450 | 6 weeks (2x/week) |
| Video Editing | 🎬 Video Editing | Adobe Premiere Pro and After Effects. Cutting, transitions, color grading, and motion graphics. | $550 | 6 weeks (2x/week) |
| Creative Writing | ✍️ Creative Writing | Fiction, non-fiction, and screenwriting foundations. Weekly feedback, peer review, and publishing guidance. | $350 | 6 weeks (1x/week) |

**Test Preparation**

| Course | Title | Description | Price | Duration |
|--------|-------|-------------|-------|----------|
| IELTS | 📝 IELTS Preparation | All four skills — reading, writing, listening, speaking. Mock exams, scoring strategies, and personalized feedback. | $400 | 4 weeks (3x/week) |
| TOEFL | 📝 TOEFL Preparation | Computer-based practice with timed sections. Focus on academic English and test strategies. | $400 | 4 weeks (3x/week) |
| SAT | 📝 SAT Preparation | Math and verbal intensive. Practice tests, score analysis, and targeted improvement plans. | $500 | 6 weeks (3x/week) |
| GRE | 📝 GRE Preparation | Quantitative, verbal, and analytical writing. Advanced strategies, vocabulary building, and timed practice. | $550 | 6 weeks (3x/week) |

---

### Main Flow: Enroll Now

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | Which course are you interested in? | → Opens "Our Courses" menu |
| 2 | choice | What's your current level in this area? | Complete beginner, Some basic knowledge, Intermediate, Advanced |
| 3 | choice | Preferred schedule? | Weekday mornings, Weekday evenings, Weekends, Online (self-paced) |
| 4 | text | Your full name? | — |
| 5 | text | Email address? | — |
| 6 | text | Phone number? | — |

**Confirmation:**
```
Here's what I have 📋

• Course: Web Development (Full Stack)
• Level: Some basic knowledge
• Schedule: Weekday evenings
• Name: Priya Sharma
• Email: priya.sharma@email.com
• Phone: +1 555-0876

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** Which course are you interested in?  
> *(shows menu: Our Courses → Technology → Web Development)*  
> **User:** Web Development (Full Stack)  
>
> **Bot:** What's your current level in this area?  
> **User:** Some basic knowledge  
>
> **Bot:** Preferred schedule?  
> **User:** Weekday evenings  
>
> **Bot:** Your full name?  
> **User:** Priya Sharma  
>
> **Bot:** Email address?  
> **User:** priya.sharma@email.com  
>
> **Bot:** Phone number?  
> **User:** +1 555-0876  
>
> **Bot:** Here's what I have 📋  
> • Course: Web Development (Full Stack)  
> • Level: Some basic knowledge  
> • Schedule: Weekday evenings  
> • Name: Priya Sharma  
> • Email: priya.sharma@email.com  
> • Phone: +1 555-0876  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** You're enrolled, Priya! 📚 Check your email for next steps and the course start date. Welcome to BrightPath!


---
---

# ═══════════════════════════════════════════════
# 13. ONLINE STORE
# ═══════════════════════════════════════════════

**Template Name:** Urban Essentials  
**Welcome Message:** "Hey! 👋 Welcome to Urban Essentials. Browse our collection or place an order directly here."

---

### Menu Structure

```
🛍 Shop [behavior: menu]
├── 👕 Clothing [menu]
│   ├── T-Shirts [info]
│   ├── Hoodies [info]
│   ├── Joggers [info]
│   └── Jackets [info]
├── 👟 Footwear [menu]
│   ├── Sneakers [info]
│   ├── Slides [info]
│   └── Boots [info]
├── 🎒 Accessories [menu]
│   ├── Caps & Beanies [info]
│   ├── Backpacks [info]
│   ├── Sunglasses [info]
│   └── Watches [info]
└── 🏠 Home & Lifestyle [menu]
    ├── Scented Candles [info]
    ├── Mugs & Drinkware [info]
    ├── Phone Cases [info]
    └── Tote Bags [info]

🛒 Place an Order [behavior: action → start_flow]
📦 Track My Order [behavior: action → link → tracking URL]
📞 Customer Support [behavior: action → call → +1 555-1300]
```

---

### Info Pages

**Clothing**

| Product | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| T-Shirts | 👕 T-Shirts | Premium cotton tees in 12 colors. Relaxed fit, pre-shrunk, ultra-soft. Unisex sizing XS–3XL. | $25 | 100% cotton |
| Hoodies | 👕 Hoodies | Heavyweight fleece hoodies with kangaroo pocket. Warm, cozy, and built to last. Available in 8 colors. | $55 | Cotton-poly blend |
| Joggers | 👕 Joggers | Tapered joggers with elastic waistband and cuffs. Perfect for lounging or running errands. | $40 | French terry cotton |
| Jackets | 👕 Jackets | Lightweight windbreaker with zip pockets. Water-resistant, packable. Great for travel or daily wear. | $65 | Nylon, water-resistant |

**Footwear**

| Product | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Sneakers | 👟 Sneakers | Minimalist leather sneakers in white, black, or grey. Clean look, cushioned sole. Runs true to size. | $80 | Leather upper, rubber sole |
| Slides | 👟 Slides | Comfortable slides with contoured footbed. Ideal for poolside, beach, or casual outings. | $25 | EVA foam |
| Boots | 👟 Boots | Matte leather Chelsea boots. Elastic gore for easy on/off. Works with jeans or chinos. | $95 | Leather, rubber sole |

**Accessories**

| Product | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Caps & Beanies | 🧢 Caps & Beanies | Embroidered logo caps (adjustable snapback) or knit beanies. One size fits most. | $18 | Cotton / Acrylic knit |
| Backpacks | 🎒 Backpacks | Water-resistant daypack with laptop sleeve (fits 15"). Multiple compartments. Clean, urban design. | $60 | Cordura nylon |
| Sunglasses | 🕶 Sunglasses | UV400 polarized lenses in classic and modern frames. Lightweight with spring hinges. | $35 | Polycarbonate, UV400 |
| Watches | ⌚ Watches | Minimalist analog watch with genuine leather strap. Japanese movement. 38mm or 42mm dial. | $75 | Stainless steel, leather |

**Home & Lifestyle**

| Product | Title | Description | Price | Details |
|---------|-------|-------------|-------|---------|
| Scented Candles | 🕯 Scented Candles | Hand-poured soy candles. Scents: Cedarwood, Vanilla, Sea Salt, Lavender. 40-hour burn time. | $22 | 8oz soy wax, cotton wick |
| Mugs | ☕ Mugs & Drinkware | Ceramic mugs with our signature designs. 12oz, dishwasher safe. Makes a great gift. | $15 | Ceramic, 12oz |
| Phone Cases | 📱 Phone Cases | Slim-fit protective cases with original art prints. Available for iPhone and Samsung Galaxy. | $20 | Polycarbonate + TPU |
| Tote Bags | 👜 Tote Bags | Canvas tote with screen-printed design. Sturdy enough for groceries, stylish enough for the office. | $18 | 12oz canvas |

---

### Main Flow: Place an Order

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What product are you interested in? | → Opens "Shop" menu |
| 2 | choice_with_manual | What size? | XS, S, M, L, XL, 2XL, One size, *or type your size* |
| 3 | choice_with_manual | How many would you like? | 1, 2, 3, *or type a number* |
| 4 | text | What's your full name? | — |
| 5 | text | Shipping address? | — |
| 6 | text | Phone number for delivery updates? | — |
| 7 | choice | Shipping method? | Standard (5-7 days, free), Express (2-3 days, +$8), Next day (+$15) |

**Confirmation:**
```
Here's what I have 📋

• Product: Hoodies
• Size: L
• Quantity: 2
• Name: Carlos Reyes
• Address: 42 Oak Street, Apt 5B, Brooklyn NY 11201
• Phone: +1 555-0432
• Shipping: Express (2-3 days)

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What product are you interested in?  
> *(shows menu: Shop → Clothing → Hoodies)*  
> **User:** Hoodies  
>
> **Bot:** What size?  
> **User:** L  
>
> **Bot:** How many would you like?  
> **User:** 2  
>
> **Bot:** What's your full name?  
> **User:** Carlos Reyes  
>
> **Bot:** Shipping address?  
> **User:** 42 Oak Street, Apt 5B, Brooklyn NY 11201  
>
> **Bot:** Phone number for delivery updates?  
> **User:** +1 555-0432  
>
> **Bot:** Shipping method?  
> **User:** Express (2-3 days)  
>
> **Bot:** Here's what I have 📋  
> • Product: Hoodies  
> • Size: L  
> • Quantity: 2  
> • Name: Carlos Reyes  
> • Address: 42 Oak Street, Apt 5B, Brooklyn NY 11201  
> • Phone: +1 555-0432  
> • Shipping: Express (2-3 days)  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Order placed, Carlos! 🛍 You'll get a tracking link by SMS once it ships. Thanks for shopping with Urban Essentials!


---
---

# ═══════════════════════════════════════════════
# 14. CLEANING SERVICES
# ═══════════════════════════════════════════════

**Template Name:** SparkleClean  
**Welcome Message:** "Hi there! ✨ Welcome to SparkleClean. We make your space shine. Browse our services or book a cleaning."

---

### Menu Structure

```
🏠 Residential Cleaning [behavior: menu]
├── Standard Home Cleaning [info]
├── Deep Cleaning [info]
├── Move-In / Move-Out Cleaning [info]
├── Post-Construction Cleaning [info]
└── Window Cleaning [info]

🏢 Commercial Cleaning [behavior: menu]
├── Office Cleaning [info]
├── Retail Store Cleaning [info]
├── Medical Facility Cleaning [info]
└── Warehouse & Industrial [info]

⭐ Specialty Services [behavior: menu]
├── Carpet & Upholstery Cleaning [info]
├── Pressure Washing [info]
├── Air Duct Cleaning [info]
└── Disinfection & Sanitization [info]

📅 Book a Cleaning [behavior: action → start_flow]
📞 Call Us [behavior: action → call → +1 555-1400]
💬 WhatsApp Chat [behavior: action → link → whatsapp direct URL]
```

---

### Info Pages

**Residential Cleaning**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Standard | 🏠 Standard Home Cleaning | Regular cleaning — vacuuming, mopping, dusting, kitchen, and bathrooms. Everything looking fresh and tidy. | From $90 | 2-3 hours |
| Deep Cleaning | 🏠 Deep Cleaning | Everything in standard plus inside appliances, baseboards, light fixtures, window sills, and behind furniture. | From $150 | 3-5 hours |
| Move-In/Out | 📦 Move-In / Move-Out | Empty home cleaned top to bottom. Cabinets wiped, appliances cleaned inside and out, all surfaces ready. | From $200 | 4-6 hours |
| Post-Construction | 🔨 Post-Construction | Remove dust, debris, and residue after renovation. Window cleaning, floor polishing, and detail cleaning. | From $250 | 5-8 hours |
| Window Cleaning | 🪟 Window Cleaning | Interior and exterior windows, screens, and frames. Streak-free finish. Pricing based on number of windows. | From $80 | 1-3 hours |

**Commercial Cleaning**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Office | 🏢 Office Cleaning | Daily or weekly office cleaning. Desks, floors, kitchenette, restrooms, and trash. After-hours available. | From $150/visit | 2-4 hours |
| Retail | 🏪 Retail Store Cleaning | Floor care, display dusting, restrooms, fitting rooms, and entrance. Keep your store looking its best. | From $120/visit | 2-3 hours |
| Medical | 🏥 Medical Facility | Hospital-grade disinfection protocols. Waiting rooms, exam rooms, and bathrooms. Compliant with health regulations. | From $200/visit | 3-4 hours |
| Warehouse | 🏭 Warehouse & Industrial | Large-space cleaning with industrial equipment. Floor scrubbing, high dusting, and debris removal. | From $300/visit | 4-8 hours |

**Specialty Services**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Carpet & Upholstery | 🛋 Carpet & Upholstery | Hot water extraction and steam cleaning. Removes stains, allergens, and odors. Safe for all fabrics. | From $100/room | 30-60 min/room |
| Pressure Washing | 💧 Pressure Washing | Driveways, patios, decks, siding, and fences. Removes grime, mildew, and years of buildup. | From $120 | 1-3 hours |
| Air Duct Cleaning | 🌬 Air Duct Cleaning | Full HVAC system cleaning. Removes dust, allergens, and debris from air ducts. Improves air quality. | From $200 | 2-4 hours |
| Disinfection | 🦠 Disinfection & Sanitization | EPA-approved disinfectant fogging for homes, offices, or commercial spaces. Kills 99.9% of germs. | From $150 | 1-2 hours |

---

### Main Flow: Book a Cleaning

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What type of cleaning do you need? | → Opens full menu |
| 2 | choice | What type of property? | Apartment, House, Office, Commercial space |
| 3 | choice_with_manual | How big is the space? | Studio/small (under 500 sqft), 1-2 bedrooms, 3-4 bedrooms, Large (2000+ sqft), *or type your own* |
| 4 | choice | How often do you need cleaning? | One-time, Weekly, Bi-weekly, Monthly |
| 5 | choice_with_manual | When would you like us to come? | Tomorrow, This week, Next week, *or type a date* |
| 6 | text | What's the address? | — |
| 7 | text | Your name? | — |
| 8 | text | Phone number? | — |

**Confirmation:**
```
Here's what I have 📋

• Service: Deep Cleaning
• Property: Apartment
• Size: 1-2 bedrooms
• Frequency: One-time
• Date: This week
• Address: 18 Maple Ave, Apt 3C, Austin TX 78701
• Name: Megan Brooks
• Phone: +1 555-0345

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What type of cleaning do you need?  
> *(shows menu: Residential Cleaning → Deep Cleaning)*  
> **User:** Deep Cleaning  
>
> **Bot:** What type of property?  
> **User:** Apartment  
>
> **Bot:** How big is the space?  
> **User:** 1-2 bedrooms  
>
> **Bot:** How often do you need cleaning?  
> **User:** One-time  
>
> **Bot:** When would you like us to come?  
> **User:** This week  
>
> **Bot:** What's the address?  
> **User:** 18 Maple Ave, Apt 3C, Austin TX 78701  
>
> **Bot:** Your name?  
> **User:** Megan Brooks  
>
> **Bot:** Phone number?  
> **User:** +1 555-0345  
>
> **Bot:** Here's what I have 📋  
> • Service: Deep Cleaning  
> • Property: Apartment  
> • Size: 1-2 bedrooms  
> • Frequency: One-time  
> • Date: This week  
> • Address: 18 Maple Ave, Apt 3C, Austin TX 78701  
> • Name: Megan Brooks  
> • Phone: +1 555-0345  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Booked! ✨ Our team will be there this week. We'll send a reminder the day before with your cleaner's name. Your place is about to sparkle, Megan!


---
---

# ═══════════════════════════════════════════════
# 15. HOME REPAIR & MAINTENANCE
# ═══════════════════════════════════════════════

**Template Name:** HandyPro Services  
**Welcome Message:** "Welcome to HandyPro! 🔧 Whether it's a leaky faucet or a full renovation — we've got the right pro for the job."

---

### Menu Structure

```
🔧 Our Services [behavior: menu]
├── 🚿 Plumbing [menu]
│   ├── Leak Repair [info]
│   ├── Drain Cleaning [info]
│   ├── Faucet & Fixture Install [info]
│   ├── Water Heater Service [info]
│   └── Toilet Repair [info]
├── ⚡ Electrical [menu]
│   ├── Outlet & Switch Install [info]
│   ├── Lighting Installation [info]
│   ├── Electrical Panel Upgrade [info]
│   ├── Ceiling Fan Install [info]
│   └── Wiring & Rewiring [info]
├── 🎨 Painting [menu]
│   ├── Interior Painting (per room) [info]
│   ├── Exterior Painting [info]
│   ├── Cabinet Painting [info]
│   └── Wallpaper Installation [info]
├── 🪚 Carpentry [menu]
│   ├── Shelving & Storage [info]
│   ├── Door Repair / Install [info]
│   ├── Deck & Fence Repair [info]
│   └── Custom Built-Ins [info]
├── ❄️ HVAC [menu]
│   ├── AC Service & Repair [info]
│   ├── Heating System Repair [info]
│   ├── Thermostat Installation [info]
│   └── Duct Cleaning & Repair [info]
└── 🏠 General Handyman [menu]
    ├── Furniture Assembly [info]
    ├── TV Mounting [info]
    ├── Drywall Repair [info]
    └── Pressure Washing [info]

📅 Request a Service [behavior: action → start_flow]
📞 Emergency Line [behavior: action → call → +1 555-1500]
💬 Send Photos [behavior: action → link → whatsapp direct URL]
```

---

### Info Pages

**Plumbing**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Leak Repair | 🚿 Leak Repair | Fix leaking pipes, joints, or valves. We locate the leak and repair it properly — no temporary patches. | From $80 | 1-2 hours |
| Drain Cleaning | 🚿 Drain Cleaning | Professional unclogging of sinks, showers, tubs, or main drains. Snaking or hydro-jetting as needed. | From $70 | 30-60 min |
| Faucet Install | 🚿 Faucet & Fixture Install | Install new faucets, showerheads, or bathroom fixtures. Includes removal of old fixtures. | From $60 + parts | 1 hour |
| Water Heater | 🚿 Water Heater Service | Repair, flush, or replace your water heater. We work with tank and tankless systems. | From $120 | 1-3 hours |
| Toilet Repair | 🚿 Toilet Repair | Running toilet, weak flush, or leaks at the base. Quick diagnosis and fix. Replacement available if needed. | From $65 | 30-60 min |

**Electrical**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Outlet & Switch | ⚡ Outlet & Switch Install | Install, replace, or upgrade outlets and switches. GFCI outlets, USB outlets, dimmer switches available. | From $50/unit | 30 min/unit |
| Lighting | ⚡ Lighting Installation | Install recessed lights, chandeliers, pendants, or under-cabinet lighting. Wiring included. | From $75/fixture | 1 hour/fixture |
| Panel Upgrade | ⚡ Electrical Panel Upgrade | Upgrade your breaker panel for more capacity. Required for older homes or when adding heavy appliances. | From $800 | 4-6 hours |
| Ceiling Fan | ⚡ Ceiling Fan Install | Install or replace ceiling fans. Includes wiring and mounting. Fans with lights, remotes, or smart features. | From $90 | 1-2 hours |
| Wiring | ⚡ Wiring & Rewiring | New circuit runs, fixture wiring, or whole-home rewiring for older properties. Licensed electricians. | From $150 | Varies |

**Painting**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Interior | 🎨 Interior Painting | Per room — walls and ceiling. Includes prep, primer, two coats, and clean-up. You pick the color. | From $200/room | 4-6 hours/room |
| Exterior | 🎨 Exterior Painting | House exterior, trim, and shutters. Power wash prep, primer, and weather-resistant paint. | From $1,500 | 2-5 days |
| Cabinet | 🎨 Cabinet Painting | Transform your kitchen or bathroom cabinets. Sanding, priming, painting, and new hardware optional. | From $800 | 2-3 days |
| Wallpaper | 🎨 Wallpaper Installation | Professional wallpaper hanging with precise pattern matching. Removal of old wallpaper available. | From $120/roll | 2-4 hours/room |

**Carpentry**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Shelving | 🪚 Shelving & Storage | Custom or pre-built shelving installation. Floating shelves, closet organizers, or garage storage. | From $100 | 1-3 hours |
| Door Repair | 🪚 Door Repair / Install | Fix sticking doors, replace hinges, or install new interior/exterior doors. Includes alignment. | From $80 | 1-2 hours |
| Deck & Fence | 🪚 Deck & Fence Repair | Board replacement, post repair, staining, or complete section rebuild. Extends the life of your outdoor space. | From $150 | 2-6 hours |
| Custom Built-Ins | 🪚 Custom Built-Ins | Bookshelves, window seats, entertainment centers built to your specs. Consultation and design included. | From $500 | 1-3 days |

**HVAC**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| AC Service | ❄️ AC Service & Repair | Maintenance, recharge, filter change, or repair. We service all central AC and mini-split systems. | From $100 | 1-2 hours |
| Heating Repair | 🔥 Heating System Repair | Furnace, boiler, or heat pump diagnostics and repair. Keep your home warm when it matters. | From $120 | 1-3 hours |
| Thermostat | 🌡 Thermostat Installation | Install smart thermostats (Nest, Ecobee, Honeywell) or standard units. Wiring and configuration included. | From $70 + device | 1 hour |
| Duct Repair | 🌬 Duct Cleaning & Repair | Seal leaky ducts, replace damaged sections, or clean entire duct system. Improves efficiency and air quality. | From $200 | 2-4 hours |

**General Handyman**

| Service | Title | Description | Price | Duration |
|---------|-------|-------------|-------|----------|
| Furniture Assembly | 🪑 Furniture Assembly | IKEA or any flat-pack furniture. Desks, beds, wardrobes, shelves — we build it right. | From $50/item | 30-90 min/item |
| TV Mounting | 📺 TV Mounting | Wall mount your TV with cable management. We bring the mount and hardware. All TV sizes. | From $80 | 1 hour |
| Drywall Repair | 🔧 Drywall Repair | Patch holes, fix cracks, and texture match. From nail holes to large patches. Includes sanding and priming. | From $60 | 1-2 hours |
| Pressure Washing | 💧 Pressure Washing | Driveways, sidewalks, patios, decks, and siding. Removes years of dirt, mold, and grime. | From $120 | 1-3 hours |

---

### Main Flow: Request a Service

| Step | Type | Question | Options |
|------|------|----------|---------|
| 1 | select_from_menu | What service do you need? | → Opens "Our Services" menu |
| 2 | choice | How urgent is this? | Emergency (today), Within a few days, This week, Flexible / no rush |
| 3 | text | Can you describe the issue or what you need done? | — |
| 4 | choice | Is this a house, apartment, or commercial property? | House, Apartment / Condo, Commercial / Office |
| 5 | text | What's the address? | — |
| 6 | text | Your name? | — |
| 7 | text | Phone number? | — |
| 8 | choice_with_manual | When works best for you? | Tomorrow morning, Tomorrow afternoon, This weekend, *or type a date/time* |

**Confirmation:**
```
Here's what I have 📋

• Service: Leak Repair
• Urgency: Within a few days
• Issue: Kitchen sink pipe is leaking under the cabinet
• Property: Apartment / Condo
• Address: 55 River Rd, Unit 12, Portland OR 97201
• Name: Ryan Kowalski
• Phone: +1 555-0678
• Preferred time: Tomorrow morning

Does this look right?
✔ Confirm | ✏ Start over
```

---

### Example Conversation

> **Bot:** What service do you need?  
> *(shows menu: Our Services → Plumbing → Leak Repair)*  
> **User:** Leak Repair  
>
> **Bot:** How urgent is this?  
> **User:** Within a few days  
>
> **Bot:** Can you describe the issue or what you need done?  
> **User:** Kitchen sink pipe is leaking under the cabinet, there's a small puddle forming  
>
> **Bot:** Is this a house, apartment, or commercial property?  
> **User:** Apartment / Condo  
>
> **Bot:** What's the address?  
> **User:** 55 River Rd, Unit 12, Portland OR 97201  
>
> **Bot:** Your name?  
> **User:** Ryan Kowalski  
>
> **Bot:** Phone number?  
> **User:** +1 555-0678  
>
> **Bot:** When works best for you?  
> **User:** Tomorrow morning  
>
> **Bot:** Here's what I have 📋  
> • Service: Leak Repair  
> • Urgency: Within a few days  
> • Issue: Kitchen sink pipe leaking under cabinet, small puddle  
> • Property: Apartment / Condo  
> • Address: 55 River Rd, Unit 12, Portland OR 97201  
> • Name: Ryan Kowalski  
> • Phone: +1 555-0678  
> • Preferred time: Tomorrow morning  
>
> Does this look right?  
> **User:** ✔ Confirm  
>
> **Bot:** Got it, Ryan! 🔧 A plumber will be at your place tomorrow morning. We'll text you their name and exact arrival time. Hang in there!


---
---

# ═══════════════════════════════════════════════
# TEMPLATE SUMMARY TABLE
# ═══════════════════════════════════════════════

| # | Business Type | Template Name | Menu Items | Info Pages | Flow Steps |
|---|---------------|---------------|------------|------------|------------|
| 1 | Beauty Salon | Glow Studio | 25 services | 25 | 5 steps |
| 2 | Real Estate | Prime Realty | 24 properties + 3 services | 27 | 7 steps |
| 3 | Medical Clinic | CarePoint Medical | 23 services | 23 | 8 steps |
| 4 | Car Rental | DriveEasy Rentals | 15 vehicles | 15 | 7 steps |
| 5 | Fitness & Gym | FitZone | 14 options | 14 | 6 steps |
| 6 | Spa & Wellness | Serenity Spa | 17 treatments | 17 | 6 steps |
| 7 | Restaurant & Cafe | The Garden Kitchen | 18 menu items + 3 packages | 21 | 8 steps |
| 8 | Driving School | SafeRoad Academy | 14 programs | 14 | 7 steps |
| 9 | Consulting | Vertex Consulting | 20 services | 20 | 7 steps |
| 10 | Travel Agency | Wanderlust Travel | 16 trips + 3 corporate | 19 | 7 steps |
| 11 | Event Planning | Stellar Events | 15 packages | 15 | 7 steps |
| 12 | Education | BrightPath Academy | 20 courses | 20 | 6 steps |
| 13 | Online Store | Urban Essentials | 15 products | 15 | 7 steps |
| 14 | Cleaning Services | SparkleClean | 13 services | 13 | 8 steps |
| 15 | Home Repair | HandyPro Services | 25 services | 25 | 8 steps |

**Total: 282 info pages across 15 templates**

---

# ═══════════════════════════════════════════════
# DESIGN PRINCIPLES APPLIED
# ═══════════════════════════════════════════════

1. **Services defined ONLY in menu** — flows use `select_from_menu` to reference them, zero duplication
2. **Every flow starts with menu selection** — user always picks a service/product first
3. **Natural WhatsApp tone** — no robotic labels, questions read like a real conversation
4. **Every template ends with confirmation** — summary + confirm/start over
5. **Realistic pricing** — researched market rates for each industry
6. **2-3 level menu depth** — not too shallow, not overwhelming
7. **Each business feels unique** — different flow logic, different question types, different tone
8. **Ready to use** — admin only needs to change business name, prices, and phone number
