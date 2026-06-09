import { Activity, ConsultationTopic, EventItem, Spot, MenuProduct, Language } from './types';

export const TRANSLATIONS = {
  en: {
    navBrand: "MIRASA",
    navSlogan: "Coffee & Space",
    exploreBtn: "Explore Sanctuary",
    joinCommunityBtn: "Join Community",
    bookBtn: "Book an Experience",
    learnMore: "Discover More",
    langCode: "ID",
    
    // Hero
    heroTitle: "More Than Coffee, More Than Space.",
    heroSub: "In the misty hills of Indonesia, a creative ecosystem and nature-inspired sanctuary thrives. A place where meaningful connection flows, roots expand, and ideas grow naturally.",
    
    // Philosophy
    philosophyTitle: "Our Soul",
    philosophyQuote: "“Roots always search for space to grow, water always finds a path through stone, and humans are the same.”",
    philosophyPara1: "Sometimes life feels crowded, pressure freezes our spirit, and ideas stop moving. But in silence, surrounded by giant whispering trees, nature helps us ground ourselves and hear our inner voice once more.",
    philosophyPara2: "Mirasa exists not as a mere destination, but as an ecosystem. It is here to hold space for your healing, your ideas, your physical movement, and your slow, authentic living. Allow yourself to breathe deeply, savor slowly brewed coffee, and find your tribe.",
    philosophySubtitle: "A place where ideas grow naturally.",

    // Core Pillar Headings
    experiencesSectionTitle: "Immersive Experiences",
    experiencesSubtitle: "Nurture your body, mind, and spirit",
    consultationTitle: "Coffee, Conversation & Growth",
    consultationSubtitle: "Speak with experts, creatives, and mentors under the canopy of giant trees. No stuffy offices—just warm, inspiring breakthrough dialogues.",
    consultationQuote: "“Sometimes, one conversation can change the entire direction of a person's life.”",
    communityTitle: "The Creative Sanctuary",
    communitySubtitle: "Connected by nature. Driven by shared purpose. Meet the active circles that shape the heart of Mirasa.",
    activeCircles: "Active Circles",
    
    // Sections
    eventsTopic: "Sanctuary Gatherings",
    eventsSubtitle: "Curated workshops, slow gatherings, and wellness retreats to expand your horizons.",
    eventDate: "Date",
    eventTime: "Time",
    eventPrice: "Contribution",
    eventRegister: "Reserve Seat",
    eventClose: "Class Full",
    
    // Booking Form
    bookingFormTitle: "Begin Your Path",
    bookingFormSub: "Request a quiet table, dynamic workspace, wellness class, or private mentor consultation.",
    bookingName: "Full Name",
    bookingEmail: "Email Address",
    bookingPhone: "WhatsApp Number",
    bookingDate: "Preferred Date",
    bookingTime: "Preferred Time",
    bookingType: "Experience Type",
    bookingMessage: "What are you seeking or working on today?",
    bookingSubmit: "Request Reservation via WhatsApp",
    bookingSuccess: "Thank you. Your request has been prepared! Click send in the WhatsApp window to finalize your booking.",
    
    // Chatbot related headings
    chatHeading: "Mira • Digital Sanctuary Companion",
    chatPlaceholder: "Ask me anything about spots, coffee blends, mentor discussions, or event booking...",
    chatIntro: "Hello, seeker. I am Mira, born of the roots and breezes of Mirasa Hills. I can guide you to serene spots, share our hand-dripped menu, guide your booking, or suggest experiences. What does your heart seek today?",
    
    // Footer
    footerQuote: "“Sometimes all humans need is a quiet space, good coffee, nature, and meaningful conversations.”",
    footerHours: "Breathe In: Daily 08:00 AM - 10:00 PM",
    footerLoc: "Jl. Cibengang, Ciburial, Kec. Cimenyan, Kabupaten Bandung, Jawa Barat 40198",
    newsletterSub: "Receive slow living insights and selective event openings.",
    subscribe: "Subscribe",
    subPlaceholder: "Enter email for slow updates",
    rights: "All rights reserved. Cultivating space since 2024.",
  },
  id: {
    navBrand: "MIRASA",
    navSlogan: "Kopi & Ruang",
    exploreBtn: "Jelajahi Sanctuary",
    joinCommunityBtn: "Gabung Komunitas",
    bookBtn: "Pesan Pengalaman",
    learnMore: "Pelajari Lebih Lanjut",
    langCode: "EN",
    
    // Hero
    heroTitle: "Bukan Sekadar Kopi, Bukan Sekadar Ruang.",
    heroSub: "Di perbukitan berkabut Indonesia, tumbuh sebuah ekosistem kreatif dan perlindungan alamiah. Wadah terkoneksinya manusia, bertumbuhnya akar diri, dan lahirnya ide secara alami.",
    
    // Philosophy
    philosophyTitle: "Jiwa Kami",
    philosophyQuote: "“Akar selalu mencari ruang untuk tumbuh, air selalu menemukan celah di antara bebatuan, dan manusia pun demikian.”",
    philosophyPara1: "Terkadang hidup terasa terlalu bising, tekanan membekukan jiwa, dan ide-ide berhenti berputar. Namun dalam keheningan, di bawah desau pohon raksasa, alam membantu kita menapak bumi dan mendengarkan suara hati kembali.",
    philosophyPara2: "Mirasa hadir bukan sekadar sebagai kedai atau ruang kerja, melainkan sebuah ekosistem. Kami merawat ruang bagi pemulihan Anda, ide-ide kreatif Anda, aktivitas raga yang sehat, serta kehidupan yang selaras dan melambat.",
    philosophySubtitle: "Tempat di mana setiap ide tumbuh secara alami.",

    // Core Pillar Headings
    experiencesSectionTitle: "Pengalaman Imersif",
    experiencesSubtitle: "Merawat raga, pikiran, dan jiwa Anda",
    consultationTitle: "Kopi, Percakapan & Pertumbuhan",
    consultationSubtitle: "Berdiskusi santai bersama pakar, praktisi, dan mentor di bawah rimbunnya pohon. Bebas dari sekat kantor formal—hanya percakapan hangat yang menginspirasi.",
    consultationQuote: "“Terkadang, satu percakapan berharga mampu mengubah arah hidup seseorang selamanya.”",
    communityTitle: "Ekosistem Kreatif",
    communitySubtitle: "Terhubung lewat alam, digerakkan tujuan bersama. Berkenalan dengan lingkaran aktif yang mendetak di jantung Mirasa.",
    activeCircles: "Lingkaran Aktif",

    // Sections
    eventsTopic: "Agenda Sanctuary",
    eventsSubtitle: "Lokakarya terkurasi, pertemuan santai, dan kelas meditasi untuk memperluas cakrawala Anda.",
    eventDate: "Tanggal",
    eventTime: "Waktu",
    eventPrice: "Kontribusi",
    eventRegister: "Amankan Kursi",
    eventClose: "Sesi Penuh",
    
    // Booking Form
    bookingFormTitle: "Mulai Langkah Anda",
    bookingFormSub: "Pesan meja tenang, area kerja kolaboratif, kelas kesehatan diri, atau sesi konsultasi mentor privat.",
    bookingName: "Nama Lengkap",
    bookingEmail: "Alamat Email",
    bookingPhone: "Nomor WhatsApp",
    bookingDate: "Tanggal Pilihan",
    bookingTime: "Waktu Pilihan",
    bookingType: "Jenis Pengalaman",
    bookingMessage: "Apa yang ingin Anda capai atau diskusikan hari ini?",
    bookingSubmit: "Kirim Permintaan via WhatsApp",
    bookingSuccess: "Terima kasih. Permintaan Anda telah disiapkan! Selesaikan dengan mengeklik tombol kirim pada jendela WhatsApp.",

    // Chatbot related headings
    chatHeading: "Mira • Pendamping Digital Mirasa",
    chatPlaceholder: "Tanyakan mengenai sudut sunyi, racikan kopi, diskusi mentor, atau info agenda...",
    chatIntro: "Selamat datang, penjelajah rasa. Saya Mira, lahir dari akar dan angin perbukitan Mirasa. Saya dapat menuntun Anda ke ruang sunyi, berbagi cita rasa seduhan manual kami, memandu pemesanan, atau menyarankan aktivitas. Apa yang sedang dicari jiwa Anda hari ini?",

    // Footer
    footerQuote: "“Terkadang, hal mendasar yang dibutuhkan manusia hanyalah ruang yang sunyi, kopi yang nikmat, alam raya, serta percakapan yang mendalam.”",
    footerHours: "Buka · Tutup pukul 22.00 WIB",
    footerLoc: "Jl. Cibengang, Ciburial, Kec. Cimenyan, Kabupaten Bandung, Jawa Barat 40198",
    newsletterSub: "Dapatkan catatan gaya hidup santai (slow living) dan pembukaan pendaftaran agenda terbatas.",
    subscribe: "Langganan",
    subPlaceholder: "Masukkan email Anda",
    rights: "Hak cipta dilindungi. Merawat ruang dan tumbuh bersama sejak 2024.",
  }
};

export const ACTIVITIES: Activity[] = [
  {
    id: "act-forest-coffee",
    title: {
      en: "Forest Coffee & Hand-Drip Ritual",
      id: "Seduhan Kopi Ritual Hutan"
    },
    description: {
      en: "Learn to ground yourself through a meditative, slow hand-pour brewing technique using mountain-roasted single origins.",
      id: "Pelajari seni membumikan diri lewat teknik seduh manual yang meditatif menggunakan biji kopi lokal dataran tinggi."
    },
    category: "nature",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
    duration: "45 mins",
    intensity: { en: "Gentle & Sensory", id: "Lembut & Indrawi" }
  },
  {
    id: "act-reflection",
    title: {
      en: "Silent Morning Reflection",
      id: "Refleksi Hening Pagi Hari"
    },
    description: {
      en: "Enjoy the misty mountain morning with an hour of silent reading or guided journaling on our giant wooden observation deck.",
      id: "Nikmati kabut pagi pegunungan dengan satu jam keheningan membaca atau menulis jurnal terbimbing di dek kayu raksasa kami."
    },
    category: "mindfulness",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800",
    duration: "60 mins",
    intensity: { en: "Extremely Calming", id: "Sangat Teduh" }
  },
  {
    id: "act-sunset-talks",
    title: {
      en: "Sunset Conversation Circle",
      id: "Lingkar Cerita Matahari Terbenam"
    },
    description: {
      en: "Cozy fire-pit gathering for authentic human connection, sharing personal stories, laughter, and wisdom beneath twilight hues.",
      id: "Pertemuan hangat di api unggun luar ruangan untuk bertukar cerita asli, gelak tawa, dan hikmat di bawah langit senja."
    },
    category: "community",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
    duration: "90 mins",
    intensity: { en: "Empathetic & Warm", id: "Penuh Empati & Hangat" }
  },
  {
    id: "act-yoga-nature",
    title: {
      en: "Yoga Under the Giant Trees",
      id: "Yoga di Bawah Pohon Raksasa"
    },
    description: {
      en: "Vinyasa flow on lawn mats, synchronized with the rhythmic hum of forest winds and morning cicadas.",
      id: "Gerakan Vinyasa mengalir di atas rumput alami, diiringi ritme desau angin hutan dan serangga pagi."
    },
    category: "mindfulness",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    duration: "75 mins",
    intensity: { en: "Active Mindfulness", id: "Pikiran Aktif & Sadar" }
  },
  {
    id: "act-run-club",
    title: {
      en: "Community Forest Runners Club",
      id: "Komunitas Berlari Rimbun Hutan"
    },
    description: {
      en: "A social 5K/10K jog passing through natural pine canopies and mountain paths, designed to boost blood flow and fresh thinking.",
      id: "Lari santai 5K/10K melintasi gerbang pinus alami dan rute lereng, dirancang untuk menyegarkan aliran darah dan imajinasi."
    },
    category: "community",
    image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=800",
    duration: "60 mins",
    intensity: { en: "Cardio Focus", id: "Fokus Kardio Ringan" }
  },
  {
    id: "act-cycling-hills",
    title: {
      en: "Hillside Cycling Experience",
      id: "Gowes Sepeda Lereng Bukit"
    },
    description: {
      en: "Guided cycling tours over crisp mountain roads. Challenge your legs, breath, and soak in endless emerald views.",
      id: "Tur bersepeda terbimbing menelusuri aspal bukit yang bersih. Pacu stamina kaki, nafas, dan manjakan mata dengan hamparan hijau."
    },
    category: "nature",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    duration: "120 mins",
    intensity: { en: "Challenging & Rewarding", id: "Menantang & Berharga" }
  },
  {
    id: "act-wood-art",
    title: {
      en: "Wood Carving & Artistic Woodcraft",
      id: "Seni Ukir & Kerajinan Kayu"
    },
    description: {
      en: "Work alongside local artisans, carving your thoughts and stories onto native fallen mahogany timber blocks.",
      id: "Belajar langsung dari seniman lokal, mengukir cita rasa rasa dan ide di atas balok kayu mahoni yang gugur alami."
    },
    category: "art",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
    duration: "90 mins",
    intensity: { en: "Creative Focus", id: "Konsentrasi Kreatif" }
  },
  {
    id: "act-braindump",
    title: {
      en: "Startup & Branding Brainstorm",
      id: "Sesi Gagasan Startup & Branding"
    },
    description: {
      en: "Gather on giant custom outdoor sofas to pitch ideas, map marketing systems, and refine design schemas with creative colleagues.",
      id: "Berdiskusi di sofa luar ruang berukuran besar untuk melempar gagasan, memetakan sistem pemasaran, dan memperjelas skema desain bersama rekan kreatif."
    },
    category: "business",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    duration: "120 mins",
    intensity: { en: "Intellectual & Bold", id: "Intelektual & Berani" }
  }
];

export const CONSULTATIONS: ConsultationTopic[] = [
  {
    id: "cons-startup",
    title: { en: "Startup & Business Ideation", id: "Inkubasi Ide Bisnis & Startup" },
    description: {
      en: "Stuck with business structure? Let us brainstorm products, target segments, and product-market fit beneath the tree canopy.",
      id: "Buntu dengan struktur bisnis? Mari tumpahkan gagasan, segmen sasaran, dan keselarasan produk di bawah rimbun pohon."
    },
    mentorName: "Aditya Wardhana",
    mentorRole: { en: "Tech Founder & Venture builder", id: "Founder Teknologi & Pengembang Modal" },
    mentorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "cons-branding",
    title: { en: "Creative Direction & Branding", id: "Arah Kreatif & Karakter Brand" },
    description: {
      en: "Unlock authentic visual storytelling. Align your brand values, identity colors, and creative philosophy with natural aesthetics.",
      id: "Tingkatkan narasi visual yang otentik. Selaraskan nilai merek, warna identitas, dan filosofi kreatif Anda dengan alam."
    },
    mentorName: "Nadia Utami",
    mentorRole: { en: "Lead Designer & Visual Storyteller", id: "Desainer Utama & Pencerita Visual" },
    mentorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "cons-mindfulness",
    title: { en: "Mental Wellness & Psychology", id: "Kesehatan Mental & Psikologi" },
    description: {
      en: "An empathetic, highly confidential space to discuss work burnouts, life transitions, and ground your emotional steps in natural ease.",
      id: "Ruang empati privat yang terjaga kerahasiaannya untuk membahas kelelahan kerja, masa transisi hidup, dan menyelaraskan batin."
    },
    mentorName: "Baskara Jati, M.Psi",
    mentorRole: { en: "Clinical Psychologist & Nature Therapist", id: "Psikolog Klinis & Terapis Alam" },
    mentorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  }
];

export const EVENTS: EventItem[] = [
  {
    id: "evt-acoustic",
    title: { en: "Acoustic Fire-Pit Soul Sessions", id: "Malam Akustik Jiwa & Api Unggun" },
    date: "2026-05-30",
    time: "18:00 - 21:00",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    slotsLeft: 12,
    price: "IDR 125,000",
    category: "Art & Music"
  },
  {
    id: "evt-writing",
    title: { en: "Poetry & Emotional Journaling Workshop", id: "Lokakarya Puisi & Menulis Jurnal Emosi" },
    date: "2026-06-03",
    time: "09:00 - 12:00",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800",
    slotsLeft: 6,
    price: "IDR 180,000",
    category: "Creative Writing"
  },
  {
    id: "evt-retreat",
    title: { en: "Saturday Wellness Retreat: Breathe & Align", id: "Retret Kesehatan Sabtu: Bernapas & Menyelaraskan" },
    date: "2026-06-06",
    time: "06:30 - 15:00",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
    slotsLeft: 5,
    price: "IDR 450,000",
    category: "Full Wellness"
  }
];

export const SPOTS: Spot[] = [
  {
    id: "spot-canopy",
    name: { en: "The Canopy Net Deck", id: "Dek Jaring Bawa Kanopi" },
    description: {
      en: "Suspended mesh beds surrounded by mahogany treetops. Perfect for creative brainstorming and looking at clouds.",
      id: "Jaring gantung nyaman yang dikelilingi puncak pohon mahoni. Sempurna untuk memancing gagasan baru sembari memandang awan."
    },
    image: "https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "spot-amphitheater",
    name: { en: "The Stone Amphitheater", id: "Amfiteater Batu Alami" },
    description: {
      en: "Carved into mountain stone, standard setting for cozy evening acoustic sessions, local poetry, and sunset deep-talk circles.",
      id: "Dipahat langsung di atas batu gunung, pusat pementasan akustik rimbun, pembacaan sajak, dan cerita senja mendalam."
    },
    image: "https://images.unsplash.com/photo-1505232458627-5373b7a431d9?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "spot-creators",
    name: { en: "Creators Glass Greenhouse", id: "Rumah Kaca Inkubasi Kreatif" },
    description: {
      en: "A light-filled workspace with premium ergonomics, massive wooden desks, views of distant hills, and complete forest immersion.",
      id: "Ruang kolaborasi kaca fungsional ergonomis tinggi dengan meja kayu besar, pemandangan bukit hijau, serta desau rerimbunan."
    },
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
  }
];

export const COFFEE_MENU: MenuProduct[] = [
  {
    id: "menu-mirasa-signature",
    name: "Mirasa Mist Cold Brew",
    category: "signature",
    price: "IDR 42,000",
    description: {
      en: "18-hour cold brew infused with mountain honey, lemon-myrtle foam, and aromatic pine smoke.",
      id: "Seduhan dingin 18 jam dilarutkan madu hutan alami, buih lemon-myrtle, dan aroma semerbak cemara."
    }
  },
  {
    id: "menu-v60-local",
    name: "Single Origin PACET V60",
    category: "coffee",
    price: "IDR 38,000",
    description: {
      en: "Locally-farmed Typica, anaerobically fermented, bringing subtle notes of wild forest berries and crisp jasmine tea.",
      id: "Kopi Arabika Typica lokal lereng Pacet, fermentasi anaerobik dengan cita rasa beri liar dan teh melati bersih."
    }
  },
  {
    id: "menu-ginger-latte",
    name: "Cinnamon Wood Latte",
    category: "signature",
    price: "IDR 40,000",
    description: {
      en: "Fresh espresso paired with roasted cinnamon bark syrup, fresh local dairy, and organic ginger dust.",
      id: "Espresso tebal dipadukan sirup kayu manis panggang alami, susu sapi segar setempat, dan taburan jahe organik."
    }
  },
  {
    id: "menu-tea-artisan",
    name: "Wounded Healer Herbal Tea",
    category: "artisan",
    price: "IDR 35,000",
    description: {
      en: "A calming warm elixir of lemongrass, dried butterfly pea flower, chamomile extract, and mint oil.",
      id: "Ramuan hangat penentram raga dari serai wangi, bunga telang kering, ekstrak kamomil, dan minyak daun mint."
    }
  }
];

export const GALLERY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800",
    title: { en: "The Forest Treetops", id: "Kanoopi Tinggi Hutan" }
  },
  {
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800",
    title: { en: "Morning Mist", id: "Pagi Berkabut Lereng" }
  },
  {
    url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    title: { en: "Nature Align Yoga", id: "Penyelarasan Yoga Raga" }
  },
  {
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800",
    title: { en: "Creative Greenhouse", id: "Rumah Kolaborasi Kreatif" }
  },
  {
    url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800",
    title: { en: "Hill Trail Rides", id: "Gowes Lajur Gunung" }
  },
  {
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
    title: { en: "Manual Hand Dripping", id: "Seni Seduh Alami" }
  }
];
