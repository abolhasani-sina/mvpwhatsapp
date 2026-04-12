/**
 * Multilingual template content for all 9 business types.
 * Used by the Conversation Builder to pre-fill content when
 * starting from a template or switching language.
 *
 * Structure: TEMPLATES[businessType][language] → { categories }
 * Each category has services (with details) + shared questions.
 */

// ─── Shared Question Presets (reused across templates) ─────────
const BOOKING = {
  en: [
    { label: 'Which service would you like?', type: 'service', required: true },
    { label: 'Your full name', type: 'text', required: true },
    { label: 'Phone number', type: 'phone', required: true },
    { label: 'Preferred date', type: 'date', required: true },
    { label: 'Preferred time', type: 'time', required: true },
  ],
  fa: [
    { label: 'کدام خدمات را می‌خواهید؟', type: 'service', required: true },
    { label: 'نام و نام خانوادگی', type: 'text', required: true },
    { label: 'شماره تماس', type: 'phone', required: true },
    { label: 'تاریخ مورد نظر', type: 'date', required: true },
    { label: 'ساعت مورد نظر', type: 'time', required: true },
  ],
  tr: [
    { label: 'Hangi hizmeti istersiniz?', type: 'service', required: true },
    { label: 'Adınız ve soyadınız', type: 'text', required: true },
    { label: 'Telefon numaranız', type: 'phone', required: true },
    { label: 'Tercih ettiğiniz tarih', type: 'date', required: true },
    { label: 'Tercih ettiğiniz saat', type: 'time', required: true },
  ],
};

const INQUIRY = {
  en: [
    { label: 'Your full name', type: 'text', required: true },
    { label: 'Phone number', type: 'phone', required: true },
    { label: 'Your question or message', type: 'text', required: true },
  ],
  fa: [
    { label: 'نام و نام خانوادگی', type: 'text', required: true },
    { label: 'شماره تماس', type: 'phone', required: true },
    { label: 'سوال یا پیام شما', type: 'text', required: true },
  ],
  tr: [
    { label: 'Adınız ve soyadınız', type: 'text', required: true },
    { label: 'Telefon numaranız', type: 'phone', required: true },
    { label: 'Soru veya mesajınız', type: 'text', required: true },
  ],
};

const RESERVATION = {
  en: [
    { label: 'Name for reservation', type: 'text', required: true },
    { label: 'Number of guests', type: 'number', required: true },
    { label: 'Date', type: 'date', required: true },
    { label: 'Time', type: 'time', required: true },
    { label: 'Special requests', type: 'text', required: false },
  ],
  fa: [
    { label: 'نام برای رزرو', type: 'text', required: true },
    { label: 'تعداد مهمان', type: 'number', required: true },
    { label: 'تاریخ', type: 'date', required: true },
    { label: 'ساعت', type: 'time', required: true },
    { label: 'درخواست ویژه', type: 'text', required: false },
  ],
  tr: [
    { label: 'Rezervasyon adı', type: 'text', required: true },
    { label: 'Misafir sayısı', type: 'number', required: true },
    { label: 'Tarih', type: 'date', required: true },
    { label: 'Saat', type: 'time', required: true },
    { label: 'Özel istekler', type: 'text', required: false },
  ],
};

const RENTAL = {
  en: [
    { label: 'Which vehicle?', type: 'service', required: true },
    { label: 'Full name (as on license)', type: 'text', required: true },
    { label: 'Phone number', type: 'phone', required: true },
    { label: 'Pick-up date', type: 'date', required: true },
    { label: 'Return date', type: 'date', required: true },
    { label: 'Pick-up location', type: 'select', required: true, options: ['Main Office', 'Airport Terminal', 'Hotel Delivery'] },
  ],
  fa: [
    { label: 'کدام خودرو؟', type: 'service', required: true },
    { label: 'نام کامل (مطابق گواهینامه)', type: 'text', required: true },
    { label: 'شماره تماس', type: 'phone', required: true },
    { label: 'تاریخ تحویل', type: 'date', required: true },
    { label: 'تاریخ بازگشت', type: 'date', required: true },
    { label: 'محل تحویل', type: 'select', required: true, options: ['دفتر مرکزی', 'ترمینال فرودگاه', 'تحویل در هتل'] },
  ],
  tr: [
    { label: 'Hangi araç?', type: 'service', required: true },
    { label: 'Ad soyad (ehliyetteki gibi)', type: 'text', required: true },
    { label: 'Telefon numaranız', type: 'phone', required: true },
    { label: 'Teslim alma tarihi', type: 'date', required: true },
    { label: 'İade tarihi', type: 'date', required: true },
    { label: 'Teslim alma yeri', type: 'select', required: true, options: ['Ana Ofis', 'Havalimanı', 'Otel Teslimatı'] },
  ],
};

const ENROLLMENT = {
  en: [
    { label: 'Which course?', type: 'service', required: true },
    { label: 'Student full name', type: 'text', required: true },
    { label: 'Age', type: 'number', required: true },
    { label: 'Phone number', type: 'phone', required: true },
    { label: 'Preferred start date', type: 'date', required: true },
  ],
  fa: [
    { label: 'کدام دوره؟', type: 'service', required: true },
    { label: 'نام کامل هنرجو', type: 'text', required: true },
    { label: 'سن', type: 'number', required: true },
    { label: 'شماره تماس', type: 'phone', required: true },
    { label: 'تاریخ شروع مورد نظر', type: 'date', required: true },
  ],
  tr: [
    { label: 'Hangi kurs?', type: 'service', required: true },
    { label: 'Öğrenci adı soyadı', type: 'text', required: true },
    { label: 'Yaş', type: 'number', required: true },
    { label: 'Telefon numarası', type: 'phone', required: true },
    { label: 'Tercih edilen başlangıç tarihi', type: 'date', required: true },
  ],
};

const REALESTATE_BUY = {
  en: [
    { label: 'Your full name', type: 'text', required: true },
    { label: 'Phone number', type: 'phone', required: true },
    { label: 'Which area or property interests you?', type: 'text', required: true },
    { label: 'Budget range', type: 'select', required: true, options: ['Under $200K', '$200K–$400K', '$400K–$700K', '$700K+'] },
    { label: 'Preferred viewing date', type: 'date', required: true },
  ],
  fa: [
    { label: 'نام و نام خانوادگی', type: 'text', required: true },
    { label: 'شماره تماس', type: 'phone', required: true },
    { label: 'کدام منطقه یا ملک مورد نظرتان است؟', type: 'text', required: true },
    { label: 'محدوده بودجه', type: 'select', required: true, options: ['زیر ۵ میلیارد', '۵ تا ۱۰ میلیارد', '۱۰ تا ۲۰ میلیارد', 'بالای ۲۰ میلیارد'] },
    { label: 'تاریخ بازدید مورد نظر', type: 'date', required: true },
  ],
  tr: [
    { label: 'Adınız ve soyadınız', type: 'text', required: true },
    { label: 'Telefon numaranız', type: 'phone', required: true },
    { label: 'Hangi bölge veya mülk ilginizi çekiyor?', type: 'text', required: true },
    { label: 'Bütçe aralığı', type: 'select', required: true, options: ['200K altı', '200K–400K', '400K–700K', '700K üzeri'] },
    { label: 'Tercih edilen görüntüleme tarihi', type: 'date', required: true },
  ],
};

const REALESTATE_SELL = {
  en: [
    { label: 'Owner full name', type: 'text', required: true },
    { label: 'Property address', type: 'text', required: true },
    { label: 'Property type', type: 'select', required: true, options: ['House', 'Apartment', 'Townhouse', 'Land', 'Commercial'] },
    { label: 'Phone number', type: 'phone', required: true },
    { label: 'Preferred appraisal date', type: 'date', required: true },
  ],
  fa: [
    { label: 'نام مالک', type: 'text', required: true },
    { label: 'آدرس ملک', type: 'text', required: true },
    { label: 'نوع ملک', type: 'select', required: true, options: ['ویلایی', 'آپارتمان', 'تجاری', 'زمین', 'مغازه'] },
    { label: 'شماره تماس', type: 'phone', required: true },
    { label: 'تاریخ ارزیابی مورد نظر', type: 'date', required: true },
  ],
  tr: [
    { label: 'Mal sahibi adı soyadı', type: 'text', required: true },
    { label: 'Mülk adresi', type: 'text', required: true },
    { label: 'Mülk tipi', type: 'select', required: true, options: ['Müstakil Ev', 'Daire', 'Arsa', 'Ticari', 'Villa'] },
    { label: 'Telefon numarası', type: 'phone', required: true },
    { label: 'Tercih edilen değerleme tarihi', type: 'date', required: true },
  ],
};

// ─── Shared Confirm Messages ───────────────────────────────────
const C = {
  appointment: { en: 'Your appointment request has been sent! We will confirm shortly.', fa: 'درخواست نوبت شما ارسال شد! به‌زودی تأیید می‌شود.', tr: 'Randevu talebiniz gönderildi! En kısa sürede onaylanacak.' },
  inquiry: { en: 'Your inquiry has been sent! We will get back to you soon.', fa: 'پیام شما ارسال شد! به‌زودی با شما تماس خواهیم گرفت.', tr: 'Sorunuz gönderildi! En kısa sürede size dönüş yapacağız.' },
  reservation: { en: 'Your reservation request has been sent!', fa: 'درخواست رزرو شما ارسال شد!', tr: 'Rezervasyon talebiniz gönderildi!' },
  request: { en: 'Your request has been submitted!', fa: 'درخواست شما ثبت شد!', tr: 'Talebiniz gönderildi!' },
  enrollment: { en: 'Your enrollment request has been sent!', fa: 'درخواست ثبت‌نام شما ارسال شد!', tr: 'Kayıt talebiniz gönderildi!' },
};

// ─── Template Definitions ──────────────────────────────────────

export const TEMPLATES = {

  // ═══════ 1. BEAUTY SALON ═══════
  beauty_salon: {
    en: { categories: [
      { name: 'Hair Services', services: [
        { name: 'Haircut - Women', description: 'Wash, cut, and blow-dry for women', price: 35, duration: '45 min' },
        { name: 'Haircut - Men', description: "Classic men's cut and styling", price: 20, duration: '30 min' },
        { name: 'Hair Coloring', description: 'Full head single-process color', price: 80, duration: '120 min' },
        { name: 'Highlights / Balayage', description: 'Partial or full highlights', price: 120, duration: '150 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
      { name: 'Nail & Beauty', services: [
        { name: 'Gel Nail Extension', description: 'Full set gel nail extensions', price: 45, duration: '60 min' },
        { name: 'Manicure', description: 'Nail shaping, cuticle care, and polish', price: 20, duration: '30 min' },
        { name: 'Pedicure', description: 'Foot soak, exfoliation, and polish', price: 25, duration: '40 min' },
        { name: 'Eyebrow Shaping', description: 'Wax or thread eyebrow shaping', price: 12, duration: '15 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'خدمات مو', services: [
        { name: 'کوتاهی مو - بانوان', description: 'شستشو، کوتاهی و سشوار', price: 35, duration: '45 min' },
        { name: 'کوتاهی مو - آقایان', description: 'اصلاح و حالت‌دهی مردانه', price: 20, duration: '30 min' },
        { name: 'رنگ مو', description: 'رنگ کامل تک مرحله‌ای', price: 80, duration: '120 min' },
        { name: 'هایلایت / بالیاژ', description: 'هایلایت جزئی یا کامل', price: 120, duration: '150 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
      { name: 'ناخن و زیبایی', services: [
        { name: 'کاشت ناخن ژل', description: 'ست کامل کاشت ناخن ژلی', price: 45, duration: '60 min' },
        { name: 'مانیکور', description: 'مرتب‌سازی ناخن و پولیش', price: 20, duration: '30 min' },
        { name: 'پدیکور', description: 'اسکراب پا و پولیش', price: 25, duration: '40 min' },
        { name: 'اصلاح ابرو', description: 'اصلاح ابرو با موم یا بند', price: 12, duration: '15 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Saç Hizmetleri', services: [
        { name: 'Kadın Saç Kesimi', description: 'Yıkama, kesim ve fön', price: 35, duration: '45 dk' },
        { name: 'Erkek Saç Kesimi', description: 'Klasik erkek kesimi ve şekillendirme', price: 20, duration: '30 dk' },
        { name: 'Saç Boyama', description: 'Tek işlem tam kafa boyama', price: 80, duration: '120 dk' },
        { name: 'Röfle / Balyaj', description: 'Kısmi veya tam röfle', price: 120, duration: '150 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
      { name: 'Tırnak ve Güzellik', services: [
        { name: 'Jel Protez Tırnak', description: 'Komple jel protez tırnak', price: 45, duration: '60 dk' },
        { name: 'Manikür', description: 'Tırnak şekillendirme ve oje', price: 20, duration: '30 dk' },
        { name: 'Pedikür', description: 'Ayak bakımı ve oje', price: 25, duration: '40 dk' },
        { name: 'Kaş Şekillendirme', description: 'Ağda veya iplikle kaş alma', price: 12, duration: '15 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 2. MEDICAL CLINIC ═══════
  clinic: {
    en: { categories: [
      { name: 'Consultations', services: [
        { name: 'General Consultation', description: 'Initial doctor visit and diagnosis', price: 50, duration: '30 min' },
        { name: 'Follow-up Visit', description: 'Follow-up after treatment or test results', price: 30, duration: '20 min' },
        { name: 'Annual Check-up', description: 'Full physical exam with lab work', price: 120, duration: '60 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
      { name: 'Tests & Procedures', services: [
        { name: 'Blood Test Panel', description: 'Complete blood count and metabolic panel', price: 45, duration: '15 min' },
        { name: 'Vaccination', description: 'Standard adult or child vaccination', price: 25, duration: '10 min' },
        { name: 'Prescription Renewal', description: 'Renew existing medication prescription', price: 20, duration: '10 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'مشاوره‌ها', services: [
        { name: 'ویزیت عمومی', description: 'مراجعه اولیه و تشخیص پزشک', price: 50, duration: '30 min' },
        { name: 'ویزیت پیگیری', description: 'پیگیری بعد از درمان یا نتایج آزمایش', price: 30, duration: '20 min' },
        { name: 'چکاپ سالانه', description: 'معاینه کامل فیزیکی و آزمایشات', price: 120, duration: '60 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
      { name: 'آزمایش و خدمات', services: [
        { name: 'آزمایش خون کامل', description: 'شمارش کامل خون و پانل متابولیک', price: 45, duration: '15 min' },
        { name: 'واکسیناسیون', description: 'واکسن استاندارد بزرگسال یا کودک', price: 25, duration: '10 min' },
        { name: 'تمدید نسخه', description: 'تمدید نسخه داروهای فعلی', price: 20, duration: '10 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Muayeneler', services: [
        { name: 'Genel Muayene', description: 'İlk doktor ziyareti ve tanı', price: 50, duration: '30 dk' },
        { name: 'Kontrol Muayenesi', description: 'Tedavi veya test sonrası kontrol', price: 30, duration: '20 dk' },
        { name: 'Yıllık Check-up', description: 'Tam fiziksel muayene ve laboratuvar', price: 120, duration: '60 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
      { name: 'Test ve İşlemler', services: [
        { name: 'Kan Testi Paneli', description: 'Tam kan sayımı ve metabolik panel', price: 45, duration: '15 dk' },
        { name: 'Aşılama', description: 'Standart yetişkin veya çocuk aşısı', price: 25, duration: '10 dk' },
        { name: 'Reçete Yenileme', description: 'Mevcut ilaç reçetesini yenileme', price: 20, duration: '10 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 3. SPA & WELLNESS ═══════
  spa: {
    en: { categories: [
      { name: 'Massage', services: [
        { name: 'Swedish Massage', description: 'Full-body relaxation massage', price: 80, duration: '60 min' },
        { name: 'Deep Tissue Massage', description: 'Focused pressure on tension areas', price: 95, duration: '60 min' },
        { name: 'Hot Stone Massage', description: 'Heated stones for deep muscle relief', price: 110, duration: '75 min' },
        { name: 'Couples Massage', description: 'Side-by-side relaxation for two', price: 160, duration: '60 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
      { name: 'Facial & Body', services: [
        { name: 'Classic Facial', description: 'Cleansing, exfoliation, and hydration', price: 65, duration: '50 min' },
        { name: 'Anti-Aging Facial', description: 'Collagen boost with premium serums', price: 90, duration: '60 min' },
        { name: 'Body Scrub & Wrap', description: 'Full body exfoliation and detox wrap', price: 100, duration: '75 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'ماساژ', services: [
        { name: 'ماساژ سوئدی', description: 'ماساژ آرام‌بخش تمام بدن', price: 80, duration: '60 min' },
        { name: 'ماساژ بافت عمقی', description: 'فشار متمرکز روی نقاط پرتنش', price: 95, duration: '60 min' },
        { name: 'ماساژ سنگ داغ', description: 'سنگ‌های گرم برای رفع عمیق تنش', price: 110, duration: '75 min' },
        { name: 'ماساژ دونفره', description: 'ماساژ آرامش‌بخش کنار هم', price: 160, duration: '60 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
      { name: 'صورت و بدن', services: [
        { name: 'فیشیال کلاسیک', description: 'پاکسازی، لایه‌برداری و آبرسانی', price: 65, duration: '50 min' },
        { name: 'فیشیال ضد پیری', description: 'تقویت کلاژن با سرم‌های ویژه', price: 90, duration: '60 min' },
        { name: 'اسکراب و رپ بدن', description: 'لایه‌برداری و سم‌زدایی تمام بدن', price: 100, duration: '75 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Masaj', services: [
        { name: 'İsveç Masajı', description: 'Tüm vücut rahatlama masajı', price: 80, duration: '60 dk' },
        { name: 'Derin Doku Masajı', description: 'Gergin bölgelere odaklı basınç', price: 95, duration: '60 dk' },
        { name: 'Sıcak Taş Masajı', description: 'Derin kas rahatlaması için taş masajı', price: 110, duration: '75 dk' },
        { name: 'Çift Masajı', description: 'Yan yana ikili rahatlama masajı', price: 160, duration: '60 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
      { name: 'Yüz ve Vücut', services: [
        { name: 'Klasik Cilt Bakımı', description: 'Temizleme, peeling ve nemlendirme', price: 65, duration: '50 dk' },
        { name: 'Yaşlanma Karşıtı Bakım', description: 'Kolajen takviyeli özel serumlar', price: 90, duration: '60 dk' },
        { name: 'Vücut Peelingi', description: 'Tüm vücut peeling ve detoks', price: 100, duration: '75 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 4. RESTAURANT & CAFE ═══════
  restaurant: {
    en: { categories: [
      { name: 'Reservations', services: [
        { name: 'Table for 1-4', description: 'Standard table for up to 4 guests', price: null, duration: null },
        { name: 'Table for 5-8', description: 'Large table for 5-8 guests', price: null, duration: null },
        { name: 'Private Dining Room', description: 'Exclusive room for up to 20 guests', price: 200, duration: null },
      ], questions: RESERVATION.en, confirmMessage: C.reservation.en, responseType: 'request' },
      { name: 'Events & Catering', services: [
        { name: 'Catering (10-25 ppl)', description: 'Catering service for small events', price: 300, duration: null },
        { name: 'Catering (25-50 ppl)', description: 'Full catering for medium events', price: 600, duration: null },
        { name: 'Birthday Package', description: 'Cake, decorations, and reserved area', price: 150, duration: null },
      ], questions: [...INQUIRY.en.slice(0, 2), { label: 'Expected number of guests', type: 'number', required: true }, { label: 'Event date', type: 'date', required: true }, { label: 'Additional details', type: 'text', required: false }], confirmMessage: C.inquiry.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'رزرو میز', services: [
        { name: 'میز ۱ تا ۴ نفره', description: 'میز استاندارد تا ۴ مهمان', price: null, duration: null },
        { name: 'میز ۵ تا ۸ نفره', description: 'میز بزرگ برای ۵ تا ۸ مهمان', price: null, duration: null },
        { name: 'اتاق خصوصی', description: 'اتاق اختصاصی تا ۲۰ مهمان', price: 200, duration: null },
      ], questions: RESERVATION.fa, confirmMessage: C.reservation.fa, responseType: 'request' },
      { name: 'مراسم و کترینگ', services: [
        { name: 'کترینگ (۱۰-۲۵ نفر)', description: 'خدمات کترینگ برای مراسم کوچک', price: 300, duration: null },
        { name: 'کترینگ (۲۵-۵۰ نفر)', description: 'کترینگ کامل برای مراسم متوسط', price: 600, duration: null },
        { name: 'پکیج تولد', description: 'کیک، تزئینات و فضای رزرو شده', price: 150, duration: null },
      ], questions: [...INQUIRY.fa.slice(0, 2), { label: 'تعداد مهمان‌ها', type: 'number', required: true }, { label: 'تاریخ مراسم', type: 'date', required: true }, { label: 'توضیحات بیشتر', type: 'text', required: false }], confirmMessage: C.inquiry.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Rezervasyonlar', services: [
        { name: '1-4 Kişilik Masa', description: '4 kişiye kadar standart masa', price: null, duration: null },
        { name: '5-8 Kişilik Masa', description: '5-8 kişilik büyük masa', price: null, duration: null },
        { name: 'Özel Yemek Odası', description: '20 kişiye kadar özel oda', price: 200, duration: null },
      ], questions: RESERVATION.tr, confirmMessage: C.reservation.tr, responseType: 'request' },
      { name: 'Etkinlik ve İkram', services: [
        { name: 'İkram (10-25 kişi)', description: 'Küçük etkinlikler için ikram servisi', price: 300, duration: null },
        { name: 'İkram (25-50 kişi)', description: 'Orta etkinlikler için tam ikram', price: 600, duration: null },
        { name: 'Doğum Günü Paketi', description: 'Pasta, dekorasyon ve ayrılmış alan', price: 150, duration: null },
      ], questions: [...INQUIRY.tr.slice(0, 2), { label: 'Beklenen misafir sayısı', type: 'number', required: true }, { label: 'Etkinlik tarihi', type: 'date', required: true }, { label: 'Ek detaylar', type: 'text', required: false }], confirmMessage: C.inquiry.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 5. SPORT & FITNESS ═══════
  sport_salon: {
    en: { categories: [
      { name: 'Training', services: [
        { name: 'Personal Training (1 session)', description: 'One-on-one session with a trainer', price: 60, duration: '60 min' },
        { name: 'Personal Training (10 pack)', description: '10-session package with trainer', price: 500, duration: '60 min each' },
        { name: 'Body Composition Analysis', description: 'InBody scan and consultation', price: 25, duration: '20 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
      { name: 'Classes & Memberships', services: [
        { name: 'Group Class - Yoga', description: 'Group yoga session (max 15)', price: 15, duration: '60 min' },
        { name: 'Group Class - HIIT', description: 'High-intensity interval training', price: 15, duration: '45 min' },
        { name: 'Monthly Membership', description: 'Full gym access for one month', price: 50, duration: '30 days' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'تمرین شخصی', services: [
        { name: 'تمرین شخصی (۱ جلسه)', description: 'جلسه خصوصی با مربی', price: 60, duration: '60 min' },
        { name: 'تمرین شخصی (پکیج ۱۰ جلسه)', description: 'پکیج ۱۰ جلسه‌ای با مربی', price: 500, duration: '60 min' },
        { name: 'آنالیز ترکیب بدن', description: 'اسکن بدن و مشاوره', price: 25, duration: '20 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
      { name: 'کلاس‌ها و اشتراک', services: [
        { name: 'کلاس گروهی - یوگا', description: 'جلسه یوگا گروهی (حداکثر ۱۵ نفر)', price: 15, duration: '60 min' },
        { name: 'کلاس گروهی - HIIT', description: 'تمرین تناوبی با شدت بالا', price: 15, duration: '45 min' },
        { name: 'اشتراک ماهانه', description: 'دسترسی کامل به باشگاه به مدت یک ماه', price: 50, duration: '30 روز' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Antrenman', services: [
        { name: 'Kişisel Antrenman (1 seans)', description: 'Antrenörle birebir seans', price: 60, duration: '60 dk' },
        { name: 'Kişisel Antrenman (10\'lu paket)', description: 'Antrenörle 10 seanslık paket', price: 500, duration: '60 dk' },
        { name: 'Vücut Analizi', description: 'InBody taraması ve danışmanlık', price: 25, duration: '20 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
      { name: 'Dersler ve Üyelik', services: [
        { name: 'Grup Dersi - Yoga', description: 'Grup yoga dersi (maks 15 kişi)', price: 15, duration: '60 dk' },
        { name: 'Grup Dersi - HIIT', description: 'Yüksek yoğunluklu interval antrenman', price: 15, duration: '45 dk' },
        { name: 'Aylık Üyelik', description: 'Bir aylık tam spor salonu erişimi', price: 50, duration: '30 gün' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 6. REAL ESTATE ═══════
  real_estate: {
    en: { categories: [
      { name: 'Buy / Rent', services: [
        { name: 'Property Viewing', description: 'Tour a listed property in person', price: null, duration: '30 min' },
        { name: 'Rental Application', description: 'Submit a rental application', price: null, duration: null },
        { name: 'Buyer Consultation', description: 'General real estate buying advice', price: null, duration: '30 min' },
      ], questions: REALESTATE_BUY.en, confirmMessage: C.request.en, responseType: 'request' },
      { name: 'Sell / Lease', services: [
        { name: 'Free Market Appraisal', description: 'Get your property valued by an expert', price: null, duration: '45 min' },
        { name: 'Sell My Property', description: 'List your property for sale with us', price: null, duration: null },
        { name: 'Property Management', description: 'Ongoing management for landlords', price: null, duration: null },
      ], questions: REALESTATE_SELL.en, confirmMessage: C.request.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'خرید / اجاره', services: [
        { name: 'بازدید ملک', description: 'بازدید حضوری از ملک ثبت‌شده', price: null, duration: '30 min' },
        { name: 'درخواست اجاره', description: 'ثبت درخواست اجاره', price: null, duration: null },
        { name: 'مشاوره خرید', description: 'مشاوره عمومی خرید ملک', price: null, duration: '30 min' },
      ], questions: REALESTATE_BUY.fa, confirmMessage: C.request.fa, responseType: 'request' },
      { name: 'فروش / اجاره‌دهی', services: [
        { name: 'ارزیابی رایگان', description: 'ارزیابی ملک شما توسط کارشناس', price: null, duration: '45 min' },
        { name: 'فروش ملک من', description: 'ثبت ملک شما برای فروش', price: null, duration: null },
        { name: 'مدیریت ملک', description: 'مدیریت مستمر برای مالکان', price: null, duration: null },
      ], questions: REALESTATE_SELL.fa, confirmMessage: C.request.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Satın Al / Kirala', services: [
        { name: 'Mülk Görüntüleme', description: 'Listelenen mülkü yerinde gezme', price: null, duration: '30 dk' },
        { name: 'Kiralama Başvurusu', description: 'Kiralama başvurusu yapın', price: null, duration: null },
        { name: 'Alıcı Danışmanlığı', description: 'Genel gayrimenkul alım danışmanlığı', price: null, duration: '30 dk' },
      ], questions: REALESTATE_BUY.tr, confirmMessage: C.request.tr, responseType: 'request' },
      { name: 'Sat / Kiraya Ver', services: [
        { name: 'Ücretsiz Değerleme', description: 'Uzman tarafından mülk değerleme', price: null, duration: '45 dk' },
        { name: 'Mülkümü Sat', description: 'Mülkünüzü bizimle satışa çıkarın', price: null, duration: null },
        { name: 'Mülk Yönetimi', description: 'Ev sahipleri için sürekli yönetim', price: null, duration: null },
      ], questions: REALESTATE_SELL.tr, confirmMessage: C.request.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 7. CAR RENTAL ═══════
  car_rental: {
    en: { categories: [
      { name: 'Daily Rentals', services: [
        { name: 'Economy Car', description: 'Compact car for city driving', price: 35, duration: '1 day' },
        { name: 'Sedan', description: 'Mid-size sedan for comfort', price: 50, duration: '1 day' },
        { name: 'SUV', description: 'Spacious SUV for families or trips', price: 75, duration: '1 day' },
        { name: 'Luxury Car', description: 'Premium vehicle for special occasions', price: 120, duration: '1 day' },
      ], questions: RENTAL.en, confirmMessage: C.reservation.en, responseType: 'request' },
      { name: 'Weekly & Extras', services: [
        { name: 'Weekly - Economy', description: 'Economy car for 7 days', price: 200, duration: '7 days' },
        { name: 'Weekly - SUV', description: 'SUV for 7 days', price: 420, duration: '7 days' },
        { name: 'Airport Pickup', description: 'Vehicle delivered to airport terminal', price: 25, duration: null },
      ], questions: RENTAL.en, confirmMessage: C.reservation.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'اجاره روزانه', services: [
        { name: 'خودرو اقتصادی', description: 'خودرو کوچک برای رانندگی شهری', price: 35, duration: '1 روز' },
        { name: 'سدان', description: 'سدان متوسط و راحت', price: 50, duration: '1 روز' },
        { name: 'شاسی‌بلند', description: 'شاسی‌بلند مناسب خانواده و سفر', price: 75, duration: '1 روز' },
        { name: 'خودرو لوکس', description: 'خودرو لوکس برای مناسبت‌های خاص', price: 120, duration: '1 روز' },
      ], questions: RENTAL.fa, confirmMessage: C.reservation.fa, responseType: 'request' },
      { name: 'هفتگی و خدمات', services: [
        { name: 'هفتگی - اقتصادی', description: 'خودرو اقتصادی برای ۷ روز', price: 200, duration: '7 روز' },
        { name: 'هفتگی - شاسی‌بلند', description: 'شاسی‌بلند برای ۷ روز', price: 420, duration: '7 روز' },
        { name: 'تحویل در فرودگاه', description: 'تحویل خودرو در ترمینال فرودگاه', price: 25, duration: null },
      ], questions: RENTAL.fa, confirmMessage: C.reservation.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Günlük Kiralama', services: [
        { name: 'Ekonomik Araç', description: 'Şehir içi sürüş için kompakt araç', price: 35, duration: '1 gün' },
        { name: 'Sedan', description: 'Konfor için orta sınıf sedan', price: 50, duration: '1 gün' },
        { name: 'SUV', description: 'Aileler ve geziler için geniş SUV', price: 75, duration: '1 gün' },
        { name: 'Lüks Araç', description: 'Özel günler için premium araç', price: 120, duration: '1 gün' },
      ], questions: RENTAL.tr, confirmMessage: C.reservation.tr, responseType: 'request' },
      { name: 'Haftalık ve Ekstralar', services: [
        { name: 'Haftalık - Ekonomik', description: '7 günlük ekonomik araç', price: 200, duration: '7 gün' },
        { name: 'Haftalık - SUV', description: '7 günlük SUV', price: 420, duration: '7 gün' },
        { name: 'Havalimanı Teslimatı', description: 'Havalimanı terminaline araç teslimatı', price: 25, duration: null },
      ], questions: RENTAL.tr, confirmMessage: C.reservation.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 8. DRIVING SCHOOL ═══════
  driving_school: {
    en: { categories: [
      { name: 'Driving Courses', services: [
        { name: 'Single Driving Lesson', description: 'One 60-minute practical lesson', price: 45, duration: '60 min' },
        { name: '10-Lesson Package', description: '10 practical lessons (save 10%)', price: 400, duration: '60 min each' },
        { name: '20-Lesson Package', description: '20 practical lessons (save 15%)', price: 750, duration: '60 min each' },
        { name: 'Refresher Course', description: 'For licensed drivers needing practice', price: 120, duration: '3 × 60 min' },
      ], questions: ENROLLMENT.en, confirmMessage: C.enrollment.en, responseType: 'request' },
      { name: 'Theory & Tests', services: [
        { name: 'Theory Course', description: '8-hour theory preparation course', price: 120, duration: '8 hrs' },
        { name: 'Mock Driving Test', description: 'Full simulation of the driving test', price: 60, duration: '60 min' },
      ], questions: ENROLLMENT.en, confirmMessage: C.enrollment.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'دوره‌های رانندگی', services: [
        { name: 'جلسه تک رانندگی', description: 'یک جلسه ۶۰ دقیقه‌ای عملی', price: 45, duration: '60 min' },
        { name: 'پکیج ۱۰ جلسه', description: '۱۰ جلسه عملی (۱۰٪ تخفیف)', price: 400, duration: '60 min' },
        { name: 'پکیج ۲۰ جلسه', description: '۲۰ جلسه عملی (۱۵٪ تخفیف)', price: 750, duration: '60 min' },
        { name: 'دوره بازآموزی', description: 'برای رانندگان دارای گواهینامه', price: 120, duration: '3 × 60 min' },
      ], questions: ENROLLMENT.fa, confirmMessage: C.enrollment.fa, responseType: 'request' },
      { name: 'آیین‌نامه و آزمون', services: [
        { name: 'دوره آیین‌نامه', description: 'دوره ۸ ساعته آمادگی آزمون', price: 120, duration: '8 ساعت' },
        { name: 'آزمون آزمایشی', description: 'شبیه‌سازی کامل آزمون رانندگی', price: 60, duration: '60 min' },
      ], questions: ENROLLMENT.fa, confirmMessage: C.enrollment.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Sürüş Kursları', services: [
        { name: 'Tek Sürüş Dersi', description: '60 dakikalık pratik ders', price: 45, duration: '60 dk' },
        { name: '10 Ders Paketi', description: '10 pratik ders (%10 indirim)', price: 400, duration: '60 dk' },
        { name: '20 Ders Paketi', description: '20 pratik ders (%15 indirim)', price: 750, duration: '60 dk' },
        { name: 'Tazeleme Kursu', description: 'Ehliyeti olan sürücüler için', price: 120, duration: '3 × 60 dk' },
      ], questions: ENROLLMENT.tr, confirmMessage: C.enrollment.tr, responseType: 'request' },
      { name: 'Teori ve Sınavlar', services: [
        { name: 'Teori Kursu', description: '8 saatlik teorik hazırlık kursu', price: 120, duration: '8 saat' },
        { name: 'Deneme Sınavı', description: 'Sürüş sınavının tam simülasyonu', price: 60, duration: '60 dk' },
      ], questions: ENROLLMENT.tr, confirmMessage: C.enrollment.tr, responseType: 'request' },
    ]},
  },

  // ═══════ 9. CONSULTING OFFICE ═══════
  consulting: {
    en: { categories: [
      { name: 'Consultations', services: [
        { name: 'Initial Consultation', description: 'First meeting to assess your needs', price: 75, duration: '30 min' },
        { name: 'Full Consultation', description: 'In-depth advisory session', price: 150, duration: '60 min' },
        { name: 'Follow-up Session', description: 'Review progress and next steps', price: 100, duration: '45 min' },
      ], questions: BOOKING.en, confirmMessage: C.appointment.en, responseType: 'request' },
      { name: 'Documents & Filing', services: [
        { name: 'Document Review', description: 'Review contracts, proposals, or filings', price: 120, duration: null },
        { name: 'Business Registration', description: 'Help with company or LLC formation', price: 300, duration: null },
        { name: 'Tax Filing Support', description: 'Personal or business tax preparation', price: 200, duration: null },
      ], questions: [...INQUIRY.en.slice(0, 2), { label: 'Which document or service do you need?', type: 'text', required: true }, { label: 'Any relevant deadlines?', type: 'text', required: false }], confirmMessage: C.request.en, responseType: 'request' },
    ]},
    fa: { categories: [
      { name: 'مشاوره', services: [
        { name: 'مشاوره اولیه', description: 'جلسه اول برای بررسی نیازها', price: 75, duration: '30 min' },
        { name: 'مشاوره کامل', description: 'جلسه مشاوره عمیق و تخصصی', price: 150, duration: '60 min' },
        { name: 'جلسه پیگیری', description: 'بررسی پیشرفت و مراحل بعدی', price: 100, duration: '45 min' },
      ], questions: BOOKING.fa, confirmMessage: C.appointment.fa, responseType: 'request' },
      { name: 'مدارک و ثبت', services: [
        { name: 'بررسی مدارک', description: 'بررسی قراردادها و مدارک', price: 120, duration: null },
        { name: 'ثبت شرکت', description: 'کمک در تأسیس شرکت', price: 300, duration: null },
        { name: 'تنظیم اظهارنامه مالیاتی', description: 'تنظیم مالیات شخصی یا شرکتی', price: 200, duration: null },
      ], questions: [...INQUIRY.fa.slice(0, 2), { label: 'کدام مدرک یا خدمات را نیاز دارید؟', type: 'text', required: true }, { label: 'آیا مهلت زمانی خاصی دارید؟', type: 'text', required: false }], confirmMessage: C.request.fa, responseType: 'request' },
    ]},
    tr: { categories: [
      { name: 'Danışmanlık', services: [
        { name: 'İlk Danışma', description: 'İhtiyaçlarınızı değerlendirme toplantısı', price: 75, duration: '30 dk' },
        { name: 'Tam Danışma', description: 'Kapsamlı danışmanlık seansı', price: 150, duration: '60 dk' },
        { name: 'Takip Seansı', description: 'İlerleme durumu ve sonraki adımlar', price: 100, duration: '45 dk' },
      ], questions: BOOKING.tr, confirmMessage: C.appointment.tr, responseType: 'request' },
      { name: 'Belge ve Dosyalama', services: [
        { name: 'Belge İnceleme', description: 'Sözleşme ve dosya incelemesi', price: 120, duration: null },
        { name: 'Şirket Kuruluşu', description: 'Şirket veya LLC kurulumu desteği', price: 300, duration: null },
        { name: 'Vergi Dosyalama', description: 'Kişisel veya kurumsal vergi hazırlığı', price: 200, duration: null },
      ], questions: [...INQUIRY.tr.slice(0, 2), { label: 'Hangi belge veya hizmete ihtiyacınız var?', type: 'text', required: true }, { label: 'İlgili son tarih var mı?', type: 'text', required: false }], confirmMessage: C.request.tr, responseType: 'request' },
    ]},
  },
};

// ─── Languages ─────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fa', label: 'فارسی', dir: 'rtl' },
  { code: 'tr', label: 'Türkçe', dir: 'ltr' },
];

// ─── Helper ────────────────────────────────────────────────────
export function getTemplate(businessType, language = 'en') {
  const tpl = TEMPLATES[businessType];
  if (!tpl) return null;
  return tpl[language] || tpl.en;
}
