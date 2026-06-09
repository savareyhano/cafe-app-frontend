import { useState, useEffect, FormEvent } from 'react';
import { 
  Compass, 
  MapPin, 
  Instagram, 
  Send, 
  Calendar, 
  Users, 
  Clock, 
  Briefcase, 
  ChevronRight, 
  Filter, 
  CheckCircle2, 
  BookOpen, 
  Compass as SanctuaryIcon,
  Activity as NatureIcon,
  Smile,
  ArrowUpRight,
  Mail,
  Database,
  Server,
  Code,
  Copy,
  Check
} from 'lucide-react';
import { Language } from './types';
import { 
  TRANSLATIONS, 
  ACTIVITIES, 
  CONSULTATIONS, 
  EVENTS, 
  SPOTS, 
  COFFEE_MENU, 
  GALLERY_IMAGES 
} from './data';

// Import subcomponents
import Soundtrack from './components/Soundtrack';
import ChatBot from './components/ChatBot';
import BookingForm from './components/BookingForm';
import { motion, AnimatePresence } from 'motion/react';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1600"
];

const HERO_KEYWORDS = {
  en: ["SLOW INTEGRATION", "ORGANIC INNOVATION", "SOULFUL DISCOURSE", "LIMITLESS HORIZONS"],
  id: ["INTEGRASI PERLAHAN", "INOVASI ORGANIK", "DISKUSI MENDALAM", "CAKRAWALA TANPA BATAS"]
};

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [activeSpotIdx, setActiveSpotIdx] = useState(0);
  
  // Dynamic state for booked events counters to resemble proper booking systems
  const [eventsData, setEventsData] = useState(EVENTS);
  const [bookedEvents, setBookedEvents] = useState<string[]>([]);
  
  // State for newsletter & community form submission confirmation
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubbed, setNewsletterSubbed] = useState(false);
  const [communityName, setCommunityName] = useState('');
  const [communityEmail, setCommunityEmail] = useState('');
  const [communityCircles, setCommunityCircles] = useState<string[]>([]);
  const [communityJoined, setCommunityJoined] = useState(false);

  // Selected experience to auto-fill the booking form
  const [selectedExperience, setSelectedExperience] = useState<string>('');

  // Supabase states for integration console
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseSql, setSupabaseSql] = useState<string>('');
  const [supabaseBookings, setSupabaseBookings] = useState<any[]>([]);
  const [supabaseMembers, setSupabaseMembers] = useState<any[]>([]);
  const [dbSource, setDbSource] = useState<string>('in-memory-fallback');
  const [showDbConsole, setShowDbConsole] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'bookings' | 'members' | 'schema'>('bookings');
  const [isLoadingConsole, setIsLoadingConsole] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [seedingInProgress, setSeedingInProgress] = useState(false);
  const [seedingSuccess, setSeedingSuccess] = useState<string | null>(null);

  // Check Supabase configurations & fetch instructions
  const fetchSupabaseStatusInfo = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseConfigured(data.configured);
        setSupabaseUrl(data.supabaseUrl || '');
        setSupabaseSql(data.sqlInstructions || '');
      }
    } catch (err) {
      console.warn("Could not check Supabase status on local server", err);
    }
  };

  // Retrieve records from Database for Owner inspection
  const fetchConsoleData = async () => {
    setIsLoadingConsole(true);
    try {
      const bookingsRes = await fetch('/api/bookings');
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setSupabaseBookings(bookingsData.bookings || []);
        setDbSource(bookingsData.source || 'in-memory-fallback');
      }

      const membersRes = await fetch('/api/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setSupabaseMembers(membersData.members || []);
      }
    } catch (err) {
      console.error("Error loading console data:", err);
    } finally {
      setIsLoadingConsole(false);
    }
  };

  // Seed Dummy Data to Supabase
  const handleSeedData = async () => {
    setSeedingInProgress(true);
    setSeedingSuccess(null);
    try {
      const res = await fetch('/api/supabase/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setSeedingSuccess(data.message || "Seeded successfully.");
        // Delay clearing success message
        setTimeout(() => setSeedingSuccess(null), 6000);
        fetchConsoleData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to seed dummy data. Please execute the SQL commands in your Supabase SQL Editor first to ensure tables exist.");
      }
    } catch (err) {
      console.error("Error seeding data:", err);
      alert("Network error connecting to seeding service.");
    } finally {
      setSeedingInProgress(false);
    }
  };

  useEffect(() => {
    fetchSupabaseStatusInfo();
  }, []);

  useEffect(() => {
    if (showDbConsole) {
      fetchConsoleData();
    }
  }, [showDbConsole]);

  // Copy SQL script tool helper
  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSql);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  // Auto-rotating Hero slides simulating video atmosphere
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx(prev => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Soft scrolling to anchor elements 
  const scrollToId = (id: string, selectTypePreFill?: string) => {
    if (selectTypePreFill) {
      setSelectedExperience(selectTypePreFill);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookEvent = (eventId: string, eventTitle: string) => {
    if (bookedEvents.includes(eventId)) return;

    // Decrement slots locally in state
    setEventsData(prev => prev.map(evt => {
      if (evt.id === eventId && evt.slotsLeft > 0) {
        return { ...evt, slotsLeft: evt.slotsLeft - 1 };
      }
      return evt;
    }));

    setBookedEvents(prev => [...prev, eventId]);
    
    // Automatically pre-fill the general booking form
    scrollToId('booking-section', `SANKTUARI RESERVASI : ${eventTitle}`);
  };

  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubbed(true);
    setTimeout(() => {
      setNewsletterEmail('');
    }, 4000);
  };

  const toggleCommunityCircle = (circle: string) => {
    setCommunityCircles(prev => 
      prev.includes(circle) 
        ? prev.filter(c => c !== circle) 
        : [...prev, circle]
    );
  };

  const handleCommunitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!communityName || !communityEmail) {
      alert(language === 'en' ? 'Please fill in required fields.' : 'Harap melengkapi kolom wajib.');
      return;
    }

    try {
      const response = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: communityName,
          email: communityEmail,
          circles: communityCircles
        })
      });

      if (response.ok) {
        setCommunityJoined(true);
      }
    } catch (e) {
      console.error(e);
      setCommunityJoined(true); // Fallback locally
    }
  };

  const categories = {
    en: [
      { id: 'all', name: 'All Journeys' },
      { id: 'nature', name: 'Nature Living' },
      { id: 'mindfulness', name: 'Mindfulness' },
      { id: 'art', name: 'Creative Craft' },
      { id: 'business', name: 'Intellectual/Core' },
      { id: 'community', name: 'Gatherings' }
    ],
    id: [
      { id: 'all', name: 'Semua Agenda' },
      { id: 'nature', name: 'Harmoni Alam' },
      { id: 'mindfulness', name: 'Ketenangan Jiwa' },
      { id: 'art', name: 'Karya Kreatif' },
      { id: 'business', name: 'Ruang Ideasi' },
      { id: 'community', name: 'Lingkar Sosial' }
    ]
  };

  const filteredActivities = activeCategoryFilter === 'all'
    ? ACTIVITIES
    : ACTIVITIES.filter(act => act.category === activeCategoryFilter);

  return (
    <div className="min-h-screen bg-earth-dark text-beige font-sans selection:bg-wood selection:text-beige relative overflow-x-hidden pb-12">
      
      {/* BACKGROUND SOUNDSCAPE GENERATOR */}
      <Soundtrack language={language} />

      {/* FLOAT CHATBOT MIRA */}
      <ChatBot language={language} />

      {/* STICKY NAV RAIL */}
      <nav id="sanctuary-nav" className="fixed top-0 inset-x-0 z-40 bg-forest-dark/75 backdrop-blur-md border-b border-beige/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-forest-light to-wood flex items-center justify-center border border-beige/25">
              <span className="font-serif text-lg font-bold text-beige tracking-wide">M</span>
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-widest text-beige block">
                {TRANSLATIONS[language].navBrand}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#dfc6b3] block opacity-80 -mt-1">
                {TRANSLATIONS[language].navSlogan}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-widest">
            <button onClick={() => scrollToId('philosophy-section')} className="hover:text-wood transition-colors cursor-pointer">
              {language === 'en' ? 'Philosophy' : 'Jiwa'}
            </button>
            <button onClick={() => scrollToId('menu-section')} className="hover:text-wood transition-colors cursor-pointer">
              {language === 'en' ? 'Brews' : 'Menu'}
            </button>
            <button onClick={() => scrollToId('experiences-section')} className="hover:text-wood transition-colors cursor-pointer">
              {language === 'en' ? 'Experiences' : 'Pengalaman'}
            </button>
            <button onClick={() => scrollToId('mentors-section')} className="hover:text-wood transition-colors cursor-pointer">
              {language === 'en' ? 'Mentorship' : 'Konsultasi'}
            </button>
            <button onClick={() => scrollToId('spots-section')} className="hover:text-wood transition-colors cursor-pointer">
              {language === 'en' ? 'Spaces' : 'Area'}
            </button>
            <button onClick={() => scrollToId('events-section')} className="hover:text-wood transition-colors cursor-pointer">
              {language === 'en' ? 'Gatherings' : 'Agenda'}
            </button>
          </div>

          {/* Language Switch Button & CTA */}
          <div className="flex items-center gap-4">
            <button
              id="language-switch-btn"
              onClick={() => {
                setLanguage(prev => prev === 'en' ? 'id' : 'en');
              }}
              className="px-3 py-1.5 rounded-full border border-beige/20 text-[10px] font-mono hover:border-wood transition-all duration-300 bg-forest-dark/40 hover:bg-forest text-beige cursor-pointer"
            >
              ⇄ {TRANSLATIONS[language].langCode}
            </button>

            <button
              onClick={() => scrollToId('booking-section')}
              className="hidden sm:inline-flex bg-beige text-forest hover:bg-[#eae1d4] px-5 py-2.5 rounded-full text-xs font-mono font-medium tracking-wide cursor-pointer transition-all duration-300 shadow-xl border border-transparent hover:scale-103"
            >
              {TRANSLATIONS[language].bookBtn}
            </button>
          </div>

        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero-section" className="relative h-screen w-full overflow-hidden flex flex-col justify-end pb-16 pt-24">
        {/* Cinematic Backdrop Slideshow */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroSlideIdx}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.55, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 1.8 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${HERO_IMAGES[heroSlideIdx]})` }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-earth-dark via-earth-dark/40 to-forest-dark/60 z-10" />
        </div>

        {/* Ambient Overlay Vignette */}
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 relative z-20">
          <div className="max-w-3xl">
            {/* Top Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-wood/30 bg-forest-dark/40 backdrop-blur-sm text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase mb-5"
            >
              <Compass size={11} className="animate-spin" style={{ animationDuration: '8s' }} />
              {language === 'en' ? 'INDONESIAN HIGHLAND SANCTUARY' : 'SANKTUARI DATARAN TINGGI PACET'}
            </motion.div>

            {/* Display Headings */}
            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-serif text-4xl sm:text-5xl lg:text-7xl font-light tracking-tight text-white leading-tight mb-6"
            >
              {TRANSLATIONS[language].heroTitle}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.6 }}
              className="text-sm sm:text-lg text-[#eae1d4] font-light leading-relaxed mb-8 max-w-2xl font-sans"
            >
              {TRANSLATIONS[language].heroSub}
            </motion.p>

            {/* CTA Elements */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button
                onClick={() => scrollToId('experiences-section')}
                className="bg-wood hover:bg-wood-dark text-white px-7 py-3.5 rounded-full text-xs font-mono font-medium tracking-widest uppercase cursor-pointer transition-all duration-300"
              >
                {TRANSLATIONS[language].exploreBtn}
              </button>

              <button
                onClick={() => scrollToId('community-section')}
                className="bg-forest-light/60 hover:bg-forest text-beige border border-white/10 hover:border-wood px-6 py-3.5 rounded-full text-xs font-mono font-medium tracking-widest uppercase cursor-pointer transition-all duration-300"
              >
                {TRANSLATIONS[language].joinCommunityBtn}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Carousel indicator footer lines */}
        <div className="absolute bottom-6 right-6 z-25 hidden sm:flex items-center gap-3">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroSlideIdx(idx)}
              className={`h-1 cursor-pointer transition-all duration-500 rounded-full ${idx === heroSlideIdx ? 'w-8 bg-wood' : 'w-3 bg-white/20'}`}
              aria-label={`Jump to slide ${idx}`}
            />
          ))}
        </div>
      </section>

      {/* PHILOSOPHY SECTION */}
      <section id="philosophy-section" className="py-24 max-w-7xl mx-auto px-6 md:px-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-1" />

          {/* Description Storytelling Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono tracking-widest text-wood uppercase block">
              ✦ {TRANSLATIONS[language].philosophyTitle}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-white leading-tight">
              {TRANSLATIONS[language].philosophySubtitle}
            </h2>
            <div className="h-[1px] w-24 bg-wood/40 my-3" />
            <p className="text-sm text-beige/80 leading-relaxed font-sans font-light">
              {TRANSLATIONS[language].philosophyPara1}
            </p>
            <p className="text-sm text-beige/80 leading-relaxed font-sans font-light">
              {TRANSLATIONS[language].philosophyPara2}
            </p>
          </div>

          {/* Pure Nature Quote Box */}
          <div className="lg:col-span-4 bg-forest/40 border border-beige/10 p-8 rounded-2xl md:p-10 relative overflow-hidden backdrop-blur-md">
            <div className="absolute -top-10 -right-10 text-beige/5 text-9xl font-serif font-bold pointer-events-none">
              “
            </div>
            <p className="font-serif text-lg md:text-xl text-beige font-light italic leading-relaxed mb-6">
              {TRANSLATIONS[language].philosophyQuote}
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#dfc6b3]">
              <div className="h-0.5 w-6 bg-wood" />
              <span>{language === 'en' ? 'Mirasa Nature Wisdom' : 'Kearifan Alam Mirasa'}</span>
            </div>
          </div>

          <div className="lg:col-span-1" />

        </div>
      </section>

      {/* COFFEE SIGNATURE TASTING MENU */}
      <section id="menu-section" className="py-20 bg-forest-dark/30 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-wood uppercase block">
              ✦ {language === 'en' ? 'PREMIUM HAND-CRAFTED SEDUH' : 'MOMENTUM SEDUH MANUAL'}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl text-white font-light">
              {language === 'en' ? 'The Tasting Ritual' : 'Ritual Cita Rasa Kopi'}
            </h2>
            <p className="text-xs text-beige/60 font-mono">
              {language === 'en' ? 'Clean natural extracts and herbal elixirs harvested locally.' : 'Seduhan bersih dari perkebunan lereng bukit.'}
            </p>
          </div>

          {/* Menu Items Responsive Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {COFFEE_MENU.map((item) => (
              <div 
                key={item.id} 
                className="bg-forest-dark/40 border border-beige/5 p-6 rounded-2xl hover:border-wood/30 hover:bg-forest/20 transition-all duration-300 flex items-start gap-5 group"
              >
                {/* Visual Label wrapper */}
                <div className="w-12 h-12 rounded-xl bg-forest-light/60 flex items-center justify-center border border-beige/10 group-hover:bg-wood/20 group-hover:border-wood/40 transition-colors shrink-0">
                  <span className="font-mono text-[10px] tracking-wider text-[#dfc6b3]">
                    {item.category === 'signature' ? '✦' : '☕'}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-base text-white group-hover:text-wood transition-colors">
                      {item.name}
                    </h3>
                    <span className="font-mono text-xs text-wood font-medium">
                      {item.price}
                    </span>
                  </div>
                  <p className="text-xs text-beige/70 leading-relaxed font-sans font-light">
                    {item.description[language]}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => scrollToId('booking-section', 'Ritual Seduh Premium')}
              className="inline-flex items-center gap-2 text-xs font-mono text-wood hover:text-beige transition-colors uppercase tracking-widest group"
            >
              <span>{language === 'en' ? 'Reserve a Coffee Ceremony Tasting' : 'Daftar Sesi Cicip Cita Rasa Kopi'}</span>
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* MOUNTAIN CO-WORKING & REFLECTION SPOTS */}
      <section id="spots-section" className="py-24 max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase block">
            ✦ {language === 'en' ? 'SANCTUARY PHYSICAL DESIGN' : 'DESAIN JATI DIRI RUANG'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-white">
            {language === 'en' ? 'Our Reflection Spaces' : 'Sudut Tenang Mirasa'}
          </h2>
          <p className="text-xs text-beige/60 font-sans max-w-md mx-auto">
            {language === 'en' ? 'A quiet micro-retreat designed to dissolve boundaries between nature and human intellect.' : 'Kawasan mikro terstruktur rapi untuk melebur kejenuhan raga.'}
          </p>
        </div>

        {/* Spot Tabs Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Tab List Menu */}
          <div className="lg:col-span-4 flex flex-col justify-center gap-3">
            {SPOTS.map((sp, idx) => (
              <button
                key={sp.id}
                onClick={() => setActiveSpotIdx(idx)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  idx === activeSpotIdx
                    ? 'bg-wood text-white border-wood shadow-xl'
                    : 'bg-forest-dark/40 border-beige/10 text-beige hover:border-wood/30 hover:bg-forest/20'
                }`}
              >
                <div className="font-mono text-[9px] uppercase tracking-widest opacity-65 mb-1">
                  0{idx + 1} // {language === 'en' ? 'SANCTUARY SPOT' : 'SUDUT UTAMA'}
                </div>
                <h3 className="font-serif text-lg font-medium tracking-wide">
                  {sp.name[language]}
                </h3>
              </button>
            ))}
          </div>

          {/* Right Selected Tab Image and Text Overlay */}
          <div className="lg:col-span-8 bg-forest-dark/30 border border-beige/10 rounded-3xl overflow-hidden min-h-[400px] flex flex-col relative group">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-102" style={{ backgroundImage: `url(${SPOTS[activeSpotIdx].image})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/30 to-transparent z-10" />

            <div className="mt-auto p-8 md:p-12 relative z-20 space-y-3">
              <span className="px-2.5 py-1 bg-beige/10 backdrop-blur-md rounded border border-white/10 text-[9px] font-mono tracking-widest text-[#dfc6b3] uppercase inline-block">
                {language === 'en' ? 'EXPLORABLE Spot' : 'RUANG TERBUKA'}
              </span>
              <h4 className="font-serif text-2xl md:text-3xl text-white font-light">
                {SPOTS[activeSpotIdx].name[language]}
              </h4>
              <p className="text-xs text-beige/80 max-w-xl font-sans leading-relaxed">
                {SPOTS[activeSpotIdx].description[language]}
              </p>
              
              <div className="pt-2">
                <button 
                  onClick={() => scrollToId('booking-section', `Sewa Area: ${SPOTS[activeSpotIdx].name[language]}`)}
                  className="bg-beige text-forest hover:bg-beige-dark px-4 py-2.5 rounded-full text-[10px] font-mono tracking-widest uppercase cursor-pointer transition-all"
                >
                  {language === 'en' ? 'Reserve Area' : 'Pesan Sudut Ini'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* EXPERIENCES & ACTIVITIES SECTION */}
      <section id="experiences-section" className="py-24 max-w-7xl mx-auto px-6 md:px-12 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <span className="text-xs font-mono tracking-widest text-[#dfc6b3] uppercase block">
              ✦ {TRANSLATIONS[language].experiencesSectionTitle}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-white">
              {language === 'en' ? 'Cultivated Pathways' : 'Aliran Rantai Pengalaman'}
            </h2>
          </div>

          {/* Filter Segment Categories */}
          <div className="flex flex-wrap gap-2 py-1 select-none">
            {categories[language].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-full border text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-all ${
                  cat.id === activeCategoryFilter
                    ? 'bg-beige text-forest border-beige font-semibold shadow-md'
                    : 'bg-forest-dark/40 border-beige/10 text-beige/80 hover:border-[#dfc6b3]/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Experiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredActivities.map((act) => (
              <motion.div
                id={`card-${act.id}`}
                key={act.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="bg-forest/15 border border-beige/10 rounded-2xl overflow-hidden flex flex-col hover:border-wood transition-colors group"
              >
                {/* Img Box */}
                <div className="h-44 overflow-hidden relative">
                  <img 
                    src={act.image} 
                    alt={act.title[language]} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-forest-dark/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/5 text-[9px] font-mono tracking-wider text-[#dfc6b3]">
                    {act.intensity[language]}
                  </span>
                </div>

                {/* Info and buttons */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#dfc6b3] uppercase block">
                      {act.category} • {act.duration}
                    </span>
                    <h3 className="font-serif text-lg text-white group-hover:text-wood line-clamp-1">
                      {act.title[language]}
                    </h3>
                    <p className="text-xs text-beige/70 line-clamp-3 leading-relaxed font-sans font-light">
                      {act.description[language]}
                    </p>
                  </div>

                  <button
                    onClick={() => scrollToId('booking-section', act.title[language])}
                    className="w-full bg-forest-light/30 border border-beige/10 hover:border-wood hover:bg-wood/20 text-beige text-[10px] font-mono py-2 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                  >
                    {language === 'en' ? 'Select Intent' : 'Pilih Pengalaman'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* COFFEE, CONVERSATION & GROWTH (MENTOR) */}
      <section id="mentors-section" className="py-24 bg-forest-dark/45 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
            
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-mono tracking-widest text-[#dfc6b3] uppercase block">
                ✦ {TRANSLATIONS[language].consultationTitle}
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-light text-white leading-tight">
                {language === 'en' ? 'Speak with Thinkers in Nature' : 'Sesi Konsultasi & Pemantik Pikiran'}
              </h2>
              <p className="text-sm text-beige/70 max-w-2xl font-sans font-light">
                {TRANSLATIONS[language].consultationSubtitle}
              </p>
            </div>

            <div className="lg:col-span-5 bg-wood/15 border border-wood/30 p-8 rounded-2xl relative">
              <p className="font-serif text-lg italic text-beige font-light leading-relaxed">
                {TRANSLATIONS[language].consultationQuote}
              </p>
            </div>

          </div>

          {/* Mentors Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CONSULTATIONS.map((me) => (
              <div 
                key={me.id} 
                className="bg-forest-dark/40 border border-beige/5 p-8 rounded-2xl hover:border-wood/30 transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={me.mentorImage} 
                      alt={me.mentorName} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-wood"
                    />
                    <div>
                      <h3 className="font-serif text-lg text-white">
                        {me.mentorName}
                      </h3>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#dfc6b3]">
                        {me.mentorRole[language]}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-serif text-[#eae1d4] text-base font-semibold pt-2">
                    {me.title[language]}
                  </h4>

                  <p className="text-xs text-beige/70 leading-relaxed font-sans font-light">
                    {me.description[language]}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => scrollToId('booking-section', `Sesi Dialog: ${me.mentorName}`)}
                    className="text-xs font-mono text-[#dfc6b3] hover:text-wood uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Request Sesi Dialog' : 'Pesan Sesi Dialog'}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SPECIAL ACTIVE EVENTS SECTION */}
      <section id="events-section" className="py-24 max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase block">
            ✦ {TRANSLATIONS[language].eventsTopic}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-white">
            {language === 'en' ? 'Limited Gathering Series' : 'Pendaftaran Agenda Terbatas'}
          </h2>
          <p className="text-xs text-beige/60">
            {TRANSLATIONS[language].eventsSubtitle}
          </p>
        </div>

        {/* List of active limited gathering seats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {eventsData.map((evt) => {
            const isBooked = bookedEvents.includes(evt.id);
            const isFull = evt.slotsLeft === 0;

            return (
              <div 
                key={evt.id}
                className="bg-forest/10 border border-beige/10 rounded-2xl overflow-hidden flex flex-col group hover:border-wood/40 transition-all duration-300"
              >
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={evt.image} 
                    alt={evt.title[language]} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                  />
                  <span className="absolute top-4 right-4 bg-wood text-beige text-[9px] font-mono font-medium px-2.5 py-1 rounded tracking-wide">
                    {evt.category}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <h3 className="font-serif text-xl text-white group-hover:text-wood transition-colors">
                      {evt.title[language]}
                    </h3>

                    {/* Meta Row grid */}
                    <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[10px] font-mono border-t border-white/5 pt-3">
                      <div className="text-beige/50 flex items-center gap-1.5">
                        <Calendar size={11} />
                        <span>{TRANSLATIONS[language].eventDate}</span>
                      </div>
                      <div className="text-beige font-medium">{evt.date}</div>

                      <div className="text-beige/50 flex items-center gap-1.5">
                        <Clock size={11} />
                        <span>{TRANSLATIONS[language].eventTime}</span>
                      </div>
                      <div className="text-beige font-medium">{evt.time}</div>

                      <div className="text-beige/50 flex items-center gap-1.5">
                        <Users size={11} style={{ color: evt.slotsLeft <= 5 ? '#dfc6b3' : '' }} />
                        <span>{language === 'en' ? 'Slots Available' : 'Kursi Tersisa'}</span>
                      </div>
                      <div className={`font-medium ${evt.slotsLeft <= 5 ? 'text-orange-400 animate-pulse' : 'text-emerald-400'}`}>
                        {evt.slotsLeft} {language === 'en' ? 'Seats' : 'Kursi'}
                      </div>

                      <div className="text-beige/50 flex items-center gap-1.5">
                        <Send size={11} />
                        <span>{TRANSLATIONS[language].eventPrice}</span>
                      </div>
                      <div className="text-wood font-bold">{evt.price}</div>
                    </div>
                  </div>

                  <button
                    disabled={isFull || isBooked}
                    onClick={() => handleBookEvent(evt.id, evt.title[language])}
                    className={`w-full py-3 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase cursor-pointer transition-all ${
                      isBooked
                        ? 'bg-emerald-800/40 text-emerald-300 border border-emerald-500/30'
                        : isFull
                        ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                        : 'bg-beige text-forest hover:bg-beige-dark hover:scale-[1.02]'
                    }`}
                  >
                    {isBooked 
                      ? (language === 'en' ? 'Reserve Processed' : 'Pemesanan Diproses')
                      : isFull 
                      ? TRANSLATIONS[language].eventClose 
                      : TRANSLATIONS[language].eventRegister
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DYNAMIC RESERVATION BOOKING SYSTEM */}
      <section id="booking-section" className="py-24 bg-forest-dark/40 border-y border-white/5 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase block">
              ✦ {TRANSLATIONS[language].bookingFormTitle}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-white leading-tight">
              {language === 'en' ? 'Reserve Your Sanctuary Slot' : 'Amankan Kursi Keheningan Anda'}
            </h2>
            <p className="text-xs text-beige/60">
              {TRANSLATIONS[language].bookingFormSub}
            </p>
          </div>

          <div className="bg-forest/10 border border-white/5 p-8 rounded-2xl md:p-12 shadow-2xl backdrop-blur-md">
            <BookingForm language={language} prefilledType={selectedExperience} />
          </div>
        </div>
      </section>

      {/* COMMUNITY SEGMENT & MEMBERSHIP */}
      <section id="community-section" className="py-24 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-1" />

          {/* Slogan */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono tracking-widest text-wood uppercase block">
              ✦ {TRANSLATIONS[language].communityTitle}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-light text-white leading-tight">
              {TRANSLATIONS[language].navBrand} <br />
              {language === 'en' ? 'Living Ecosystem' : 'Ekosistem Berkelanjutan'}
            </h2>
            <p className="text-sm text-beige/70 leading-relaxed font-sans font-light">
              {TRANSLATIONS[language].communitySubtitle}
            </p>

            {/* List Circles */}
            <div className="space-y-3 pr-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-wood" />
                <span className="text-xs text-beige font-mono">Runners Forest Loop Circle (Misty Runs)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-wood" />
                <span className="text-xs text-beige font-mono">Pine Ridge Gravel Cyclists League</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-wood" />
                <span className="text-xs text-beige font-mono">Mahogany Hollow Woodcarver Guild</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-wood" />
                <span className="text-xs text-beige font-mono">Coffee Origin Tasting & Agriscience Union</span>
              </div>
            </div>
          </div>

          {/* Interactive Circle Join Card */}
          <div className="lg:col-span-5 bg-forest-dark/40 border border-beige/10 p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <AnimatePresence>
              {communityJoined ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 bg-[#16251d] z-25 flex flex-col items-center justify-center p-6 text-center"
                >
                  <CheckCircle2 size={42} className="text-wood animate-pulse mb-4" />
                  <h3 className="font-serif text-xl text-white mb-2 font-bold">
                    {language === 'en' ? 'Circle Activated!' : 'Selamat Bergabung!'}
                  </h3>
                  <p className="text-xs text-[#dfc6b3] max-w-xs leading-relaxed font-sans font-light">
                    {language === 'en' 
                      ? "Your spirit is recorded in the roots. We will email details for the next mountain gathering call." 
                      : "Biodata telah dicatat oleh jaringan alam. Tim kami segera mengabarkan waktu kumpul terdekat."
                    }
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <h3 className="font-serif text-lg text-white mb-2 font-medium">
              {language === 'en' ? 'Join Community Circle' : 'Masuk Jaringan Jantung Komunitas'}
            </h3>
            <p className="text-[11px] text-beige/60 font-mono mb-6">
              {language === 'en' ? 'Gain exclusive entry, private events, and circle notifications.' : 'Dapatkan relasi erat, info agenda rintisan, dan undangan terbatas.'}
            </p>

            <form onSubmit={handleCommunitySubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder={language === 'en' ? "Your Name *" : "Nama Lengkap *"}
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full bg-forest-dark/50 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none"
              />

              <input
                type="email"
                required
                placeholder={language === 'en' ? "Your Email *" : "Alamat Email *"}
                value={communityEmail}
                onChange={(e) => setCommunityEmail(e.target.value)}
                className="w-full bg-forest-dark/50 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none"
              />

              {/* Circle Toggle Options */}
              <div className="space-y-2 pt-2">
                <label className="block text-[9px] font-mono tracking-widest text-[#dfc6b3] uppercase">
                  {language === 'en' ? 'SELECT YOUR CIRCLES' : 'PILIH LINGKARAN ANDA'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono select-none">
                  {[
                    { id: 'runners', label: '👟 Runners Loop' },
                    { id: 'cyclists', label: '🚲 Cyclist Group' },
                    { id: 'carvers', label: '🪵 Carver Guild' },
                    { id: 'thinkers', label: '🧠 Thinkers Union' }
                  ].map((circle) => {
                    const selected = communityCircles.includes(circle.id);
                    return (
                      <button
                        type="button"
                        key={circle.id}
                        onClick={() => toggleCommunityCircle(circle.id)}
                        className={`p-2 rounded-xl text-left border cursor-pointer transition-all ${
                          selected
                            ? 'bg-wood text-white border-wood'
                            : 'bg-forest/20 border-beige/10 text-beige/80'
                        }`}
                      >
                        {circle.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-wood hover:bg-wood-dark text-white py-3 rounded-xl text-xs font-mono tracking-widest uppercase cursor-pointer transition-colors pt-3"
              >
                {language === 'en' ? 'Initialize Membership' : 'Gabung Lingkaran'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1" />

        </div>
      </section>

      {/* PHOTO PREVIEW GRID GALLERY */}
      <section className="py-24 max-w-7xl mx-auto px-6 md:px-12 bg-forest-dark/10 rounded-3xl my-24 border border-beige/5">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase block">
            ✦ {language === 'en' ? 'ATMOSPHERIC GALLERY' : 'GALERI VISUAL SENYAP'}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-light text-white">
            {language === 'en' ? 'Seasons of Reflection' : 'Jurnal Senyap Kehidupan'}
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_IMAGES.map((img, idx) => (
            <div 
              key={idx} 
              className="group relative h-72 rounded-2xl overflow-hidden border border-white/5 shadow-md flex items-end p-6"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-103" 
                style={{ backgroundImage: `url(${img.url})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/90 via-forest-dark/10 to-transparent z-10" />

              <div className="relative z-20 space-y-1">
                <span className="text-[9px] font-mono tracking-widest text-wood uppercase block">
                  CRAFTED / MIRASA
                </span>
                <h4 className="font-serif text-lg text-white font-light group-hover:text-wood transition-colors">
                  {img.title[language]}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SUPABASE CLOUD INTEGRATION GATEWAY */}
      <section className="py-16 max-w-7xl mx-auto px-6 md:px-12 border-t border-white/5 relative z-10">
        <div className="bg-forest-light/10 border border-beige/12 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-64 h-64 bg-wood/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-beige/10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-wood/10 text-wood">
                  <Database size={16} />
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[#dfc6b3] uppercase block">
                  Cloud Synchronization Hub
                </span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl font-light text-white">
                Supabase Integration Console
              </h2>
              <p className="text-xs text-beige/60 max-w-xl leading-relaxed">
                {language === 'en' 
                  ? 'Connect Supabase to unlock lightning-fast, persistent, real-time database capabilities for all bookings, newsletter leads, and memberships.'
                  : 'Hubungkan dengan Supabase untuk mengaktifkan penyimpanan awan (cloud database) yang andal bagi agenda reservasi dan data keanggotaan.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Connection Status Badge */}
              <div className={`px-3.5 py-2 rounded-full border text-[10px] font-mono flex items-center gap-2 select-none ${
                supabaseConfigured 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <Server size={11} className={supabaseConfigured ? 'animate-pulse' : ''} />
                <span>
                  STATUS: {supabaseConfigured ? (language === 'en' ? 'CONNECTED (Supabase Cloud)' : 'TERKONEKSI (Awan Supabase)') : (language === 'en' ? 'DEMO MODE (Local Spring)' : 'MODE DEMO (Memori Lokal)')}
                </span>
              </div>

              <button
                onClick={() => setShowDbConsole(!showDbConsole)}
                className="bg-beige text-forest hover:bg-beige-dark px-4 py-2 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                {showDbConsole 
                  ? (language === 'en' ? 'Hide Database Console' : 'Sembunyikan Konsol') 
                  : (language === 'en' ? 'Open Database Console' : 'Buka Konsol Basis Data')}
                <ChevronRight size={12} className={`transition-transform duration-300 ${showDbConsole ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {/* Collapsible Console Panel */}
          {showDbConsole && (
            <div className="pt-8 space-y-6">
              {seedingSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono animate-fade-in">
                  ✓ {seedingSuccess}
                </div>
              )}

              {supabaseConfigured && (
                <div className="p-4 bg-wood/10 border border-wood/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-mono font-semibold text-beige">
                      {language === 'en' ? 'Want to populate test entries in your tables?' : 'Ingin menyuntikkan data uji coba ke tabel Anda?'}
                    </h4>
                    <p className="text-[11px] text-beige/60">
                      {language === 'en' 
                        ? 'Trigger a secure cloud seed to inject beautiful, complete test bookings and customer records into Supabase for quick review.'
                        : 'Luncurkan perintah "seed" untuk mengisi tabel bookings & members pada akun Supabase Anda dengan entri data uji coba yang lengkap.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={seedingInProgress}
                    onClick={handleSeedData}
                    className="flex-shrink-0 bg-wood hover:bg-wood-dark text-white px-4 py-2 rounded-lg text-xs font-mono font-semibold tracking-wide transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow"
                  >
                    {seedingInProgress 
                      ? (language === 'en' ? 'Seeding...' : 'Mengirim data...') 
                      : (language === 'en' ? 'Seed Test Data to Supabase' : 'Suntik Data Uji Coba')}
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-beige/12">
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('bookings')}
                  className={`px-4 py-2.5 text-xs font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeConsoleTab === 'bookings'
                      ? 'border-wood text-beige font-semibold'
                      : 'border-transparent text-beige/50 hover:text-beige'
                  }`}
                >
                  {language === 'en' ? 'Bookings Ledger' : 'Arsip Reservasi'} ({supabaseBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('members')}
                  className={`px-4 py-2.5 text-xs font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeConsoleTab === 'members'
                      ? 'border-wood text-beige font-semibold'
                      : 'border-transparent text-beige/50 hover:text-beige'
                  }`}
                >
                  {language === 'en' ? 'Community Members' : 'Lingkar Anggota'} ({supabaseMembers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('schema')}
                  className={`px-4 py-2.5 text-xs font-mono tracking-wider border-b-2 transition-all cursor-pointer ${
                    activeConsoleTab === 'schema'
                      ? 'border-wood text-beige font-semibold'
                      : 'border-transparent text-beige/50 hover:text-beige'
                  }`}
                >
                  {language === 'en' ? 'SQL Table Schema' : 'Skema Tabel SQL'}
                </button>
              </div>

              {/* Loader */}
              {isLoadingConsole ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="h-8 w-8 border-3 border-wood border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-beige/50 font-mono">Synchronizing keys with mountain server...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Ledger Tab */}
                  {activeConsoleTab === 'bookings' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono text-beige/40">
                        <span>DATA SOURCE: <strong className="text-beige/70 uppercase">{dbSource}</strong></span>
                        <button 
                          type="button"
                          onClick={fetchConsoleData} 
                          className="hover:text-wood underline cursor-pointer"
                        >
                          Refresh ledger
                        </button>
                      </div>

                      {supabaseBookings.length === 0 ? (
                        <div className="py-8 text-center text-xs text-beige/40 font-mono border border-dashed border-beige/10 rounded-xl">
                          No active bookings recorded yet. Select experiences above to request reservations.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-beige/10 bg-forest-dark/30">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-forest-light/10 border-b border-beige/10 text-beige/40 font-mono text-[10px]">
                                <th className="p-3">Ref ID</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email & WhatsApp</th>
                                <th className="p-3">Experience</th>
                                <th className="p-3">Date / Time</th>
                                <th className="p-3">Source</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-beige/5 text-beige/95">
                              {supabaseBookings.map((b, idx) => (
                                <tr key={b.id || idx} className="hover:bg-forest-light/5 transition-colors">
                                  <td className="p-3 font-mono text-[10px] text-[#dfc6b3]">{b.id}</td>
                                  <td className="p-3 font-medium">{b.name}</td>
                                  <td className="p-3 space-y-0.5">
                                    <div className="font-sans text-beige/70">{b.email}</div>
                                    <div className="font-mono text-[10px] text-beige/40">{b.phone}</div>
                                  </td>
                                  <td className="p-3 font-mono text-[11px] text-[#dfc6b3]">{b.type}</td>
                                  <td className="p-3 font-mono text-[10px] text-beige/70">
                                    {b.date} @ {b.time}
                                  </td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono border uppercase ${
                                      dbSource.startsWith('supabase') 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                        : 'bg-beige/10 border-beige/20 text-beige/60'
                                    }`}>
                                      {dbSource === 'supabase' ? 'Cloud' : dbSource === 'supabase-empty-fallback' ? 'Cloud (Fallback)' : 'In-Memory'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Members Tab */}
                  {activeConsoleTab === 'members' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-mono text-beige/40">
                        <span>DATA SOURCE: <strong className="text-beige/70 uppercase">{dbSource}</strong></span>
                        <button 
                          type="button"
                          onClick={fetchConsoleData} 
                          className="hover:text-wood underline cursor-pointer"
                        >
                          Refresh membership list
                        </button>
                      </div>

                      {supabaseMembers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-beige/40 font-mono border border-dashed border-beige/10 rounded-xl">
                          No registered community members found yet. Start by filling the community form above!
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-beige/10 bg-forest-dark/30">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-forest-light/10 border-b border-beige/10 text-beige/45 font-mono text-[10px]">
                                <th className="p-3">Member ID</th>
                                <th className="p-3">Full Name</th>
                                <th className="p-3">Email Address</th>
                                <th className="p-3">Selected Circles</th>
                                <th className="p-3">Join Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-beige/5 text-beige/95">
                              {supabaseMembers.map((m, idx) => (
                                <tr key={m.id || idx} className="hover:bg-forest-light/5 transition-colors">
                                  <td className="p-3 font-mono text-[10px] text-[#dfc6b3]">{m.id}</td>
                                  <td className="p-3 font-medium">{m.name}</td>
                                  <td className="p-3 font-sans text-beige/70">{m.email}</td>
                                  <td className="p-3">
                                    <div className="flex flex-wrap gap-1">
                                      {m.circles && m.circles.length > 0 ? (
                                        m.circles.map((circle: string, i: number) => (
                                          <span key={i} className="px-1.5 py-0.5 rounded bg-wood/10 text-[#dfc6b3] text-[9px] font-mono border border-wood/20">
                                            {circle}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-beige/30 font-mono text-[10px]">Mailing List Only</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 font-mono text-[10px] text-beige/40">
                                    {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Schema Tab */}
                  {activeConsoleTab === 'schema' && (
                    <div className="space-y-4">
                      <div className="bg-forest-dark/40 border border-beige/10 p-5 rounded-xl space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-mono text-beige/80">
                            Paste this schema in Supabase → SQL Editor to instantly setup tables:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopySql}
                            className="bg-wood/25 text-beige hover:bg-wood/40 border border-wood/30 px-3 py-1.5 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {sqlCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {sqlCopied ? 'Copied with Success!' : 'Copy Schema'}
                          </button>
                        </div>
                        
                        <pre className="p-4 bg-forest-dark border border-white/5 rounded-lg text-[11px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-72">
                          {supabaseSql}
                        </pre>
                      </div>

                      <div className="p-4 bg-[#1e2516]/40 border border-wood/15 rounded-xl flex items-start gap-3">
                        <Code size={16} className="text-wood mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-mono font-semibold text-beige">Interactive Credentials Instruction:</h4>
                          <p className="text-[11px] text-beige/60 leading-relaxed">
                            Open <strong className="text-wood">.env.example</strong> or set environment secrets <strong className="text-white">SUPABASE_URL</strong> and <strong className="text-white">SUPABASE_ANON_KEY</strong> to plug this application to your target Supabase container instance seamlessly.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pt-24 pb-12 bg-forest-dark border-t border-beige/10 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            
            {/* Column 1 Logo */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-wood flex items-center justify-center border border-white/10">
                  <span className="font-serif text-lg font-bold text-beige">M</span>
                </div>
                <div>
                  <span className="font-serif text-xl font-medium tracking-widest text-white block">
                    {TRANSLATIONS[language].navBrand}
                  </span>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-wood -mt-1 font-semibold">
                    {TRANSLATIONS[language].navSlogan}
                  </p>
                </div>
              </div>

              <p className="font-serif text-base text-beige/70 italic max-w-sm leading-relaxed">
                {TRANSLATIONS[language].footerQuote}
              </p>

              <div className="space-y-1 text-xs text-beige/50 font-mono">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-wood" />
                  <span>{TRANSLATIONS[language].footerHours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-wood" />
                  <span>{TRANSLATIONS[language].footerLoc}</span>
                </div>
              </div>
            </div>

            {/* Column 2 Navigation Links */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="font-serif text-amber-50 text-sm tracking-wide">
                {language === 'en' ? 'Sanctuary Navigation' : 'Navigasi Intern'}
              </h4>
              <ul className="space-y-2 text-xs text-beige/70 font-mono uppercase tracking-widest">
                <li><button onClick={() => scrollToId('philosophy-section')} className="hover:text-wood cursor-pointer">Philosophy</button></li>
                <li><button onClick={() => scrollToId('menu-section')} className="hover:text-wood cursor-pointer">Beverages</button></li>
                <li><button onClick={() => scrollToId('experiences-section')} className="hover:text-wood cursor-pointer">Experiences</button></li>
                <li><button onClick={() => scrollToId('mentors-section')} className="hover:text-wood cursor-pointer">Mentorship</button></li>
                <li><button onClick={() => scrollToId('spots-section')} className="hover:text-wood cursor-pointer">Spaces</button></li>
                <li><button onClick={() => scrollToId('events-section')} className="hover:text-wood cursor-pointer">Gatherings</button></li>
              </ul>
            </div>

            {/* Column 3 Newsletter */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="font-serif text-amber-50 text-sm tracking-wide">
                {language === 'en' ? 'Slow Living Letter' : 'Catatan Hidup Lambat'}
              </h4>
              <p className="text-xs text-beige/70 leading-relaxed font-sans font-light">
                {TRANSLATIONS[language].newsletterSub}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder={TRANSLATIONS[language].subPlaceholder}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-forest/40 border border-beige/15 text-beige text-xs px-4 py-2.5 rounded-xl outline-none focus:border-wood transition-colors"
                />
                <button
                  type="submit"
                  className="bg-wood hover:bg-wood-dark text-beige px-4 py-2.5 rounded-xl text-xs font-mono tracking-widest uppercase cursor-pointer transition-colors"
                >
                  {TRANSLATIONS[language].subscribe}
                </button>
              </form>

              {newsletterSubbed && (
                <span className="text-[10px] font-mono text-emerald-400 block animate-pulse">
                  ✓ {language === 'en' ? 'You have joined our organic mailing root.' : 'Alamat surat terekam dalam lingkar organik.'}
                </span>
              )}
              
              {/* Instagram, Email & Map Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <a 
                  href="https://www.instagram.com/mirasacoffee.space/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2.5 rounded-lg bg-forest/30 border border-beige/10 text-[#dfc6b3] hover:text-beige hover:border-wood transition-colors inline-flex items-center gap-1.5 text-[10px] font-mono"
                >
                  <Instagram size={13} />
                  <span>@mirasacoffee.space</span>
                </a>
                <a 
                  href="mailto:hello@mirasacoffee.space" 
                  className="p-2.5 rounded-lg bg-forest/30 border border-beige/10 text-[#dfc6b3] hover:text-beige hover:border-wood transition-colors inline-flex items-center gap-1.5 text-[10px] font-mono"
                >
                  <Mail size={13} />
                  <span>hello@mirasacoffee.space</span>
                </a>
                <a 
                  href="https://maps.google.com/?q=Jl.+Cibengang,+Ciburial,+Kec.+Cimenyan,+Kabupaten+Bandung,+Jawa+Barat+40198" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2.5 rounded-lg bg-forest/30 border border-beige/10 text-[#dfc6b3] hover:text-beige hover:border-wood transition-colors inline-flex items-center gap-1.5 text-[10px] font-mono"
                >
                  <MapPin size={13} />
                  <span>Cimenyan Bandung, Maps</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright and Slogans */}
          <div className="pt-8 border-t border-beige/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-mono text-beige/40">
            <div>
              &copy; {new Date().getFullYear()} MIRASA. {TRANSLATIONS[language].rights}
            </div>
            <div className="flex items-center gap-4">
              <span>Ciburial, Bandung, West Java, Indonesia</span>
              <span>•</span>
              <a href="https://wa.me/6282310609347" target="_blank" rel="noopener noreferrer" className="hover:text-wood">WA Reservation</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
