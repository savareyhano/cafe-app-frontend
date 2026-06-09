import React, { useState } from 'react';
import { TRANSLATIONS } from '../data';
import { Language } from '../types';
import { Calendar, Clock, User, Mail, MessageSquare, PhoneCall, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingFormProps {
  language: Language;
  prefilledType?: string;
}

export default function BookingForm({ language, prefilledType = "" }: BookingFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    type: prefilledType || 'Forest Coffee Experience',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const bookingOptions = {
    en: [
      "Forest Coffee Experience",
      "Silent Morning Reflection",
      "Yoga Under Giant Trees",
      "Community Wood Carving Workshop",
      "Business & Startup Consultation Room",
      "Design & Branding Mentorship Session",
      "Mental Wellness Nature Therapy Session",
      "General Sanctuary Visit & Cozy Sofa Reservation"
    ],
    id: [
      "Seduhan Kopi Ritual Hutan",
      "Refleksi Hening Pagi Hari",
      "Yoga di Bawah Pohon Raksasa",
      "Lokakarya Ukir Kayu Mahoni",
      "Sesi Konsultasi Bisnis & Ideasi",
      "Arah Kreatif & Karakter Brand",
      "Terapis Alam & Kesehatan Mental",
      "Pemesanan Sofa Santai / Kunjungan Umum"
    ]
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.time) {
      alert(language === 'en' ? 'Please fill in all mandatory fields.' : 'Mohon lengkapi seluruh baris wajib.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Submit to server in-memory database
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Database server issue');
      }

      // 2. Prepare WhatsApp dispatch
      const waNumber = "6282310609347"; // Mirasa sanctuary business Line / WhatsApp Contact
      const messageText = language === 'en'
        ? `*MIRASA COFFEE & SPACE RESCUE RESERVATION*\n\n` +
          `Hello, I would like to book a slow-living experience details as follows:\n` +
          `• *Name:* ${formData.name}\n` +
          `• *Email:* ${formData.email}\n` +
          `• *WhatsApp:* ${formData.phone}\n` +
          `• *Experience:* ${formData.type}\n` +
          `• *Date & Time:* ${formData.date} at ${formData.time}\n` +
          `• *Intention:* ${formData.message || 'Seeking quiet time and fresh thinking.'}\n\n` +
          `Please confirm my slot. Thank you!`
        : `*PENGALAMAN RETRET MIRASA COFFEE & SPACE*\n\n` +
          `Halo tim Mirasa, saya berkunjung untuk merawat ruang diri:\n` +
          `• *Nama:* ${formData.name}\n` +
          `• *Email:* ${formData.email}\n` +
          `• *WhatsApp:* ${formData.phone}\n` +
          `• *Pengalaman:* ${formData.type}\n` +
          `• *Tanggal & Jam:* ${formData.date} pukul ${formData.time}\n` +
          `• *Catatan:* ${formData.message || 'Mencari keheningan raga dan inspirasi segar.'}\n\n` +
          `Mohon bantu amankan kursi saya. Terima kasih!`;

      // Keep URL safe
      const encodedText = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/${waNumber}?text=${encodedText}`;

      // Open WhatsApp in new tab immediately or trigger overlay
      setShowSuccess(true);
      
      // Delay opening whatsapp window slightly for a highly polished UI flow
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }, 1200);

    } catch (error) {
      console.error("[Booking Server Fail]:", error);
      alert(language === 'en' 
        ? "Server offline, but launching direct WhatsApp booking immediately!" 
        : "Sistem server sibuk, mengalihkan pemesanan langsung lewat WhatsApp!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full relative">
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-forest/95 backdrop-blur-md rounded-2xl z-30 flex flex-col items-center justify-center p-6 text-center border border-white/10"
          >
            <motion.div
              initial={{ scale: 0.8, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="bg-wood/20 p-4 rounded-full text-beige border border-wood/40 mb-4 animate-bounce"
            >
              <Sparkles size={36} />
            </motion.div>
            <h3 className="font-serif text-2xl text-beige mb-3 font-semibold">
              {language === 'en' ? 'Resonance Created!' : 'Terhubung dengan Alam!'}
            </h3>
            <p className="text-xs text-beige/80 max-w-sm leading-relaxed mb-6 font-sans">
              {TRANSLATIONS[language].bookingSuccess}
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  date: '',
                  time: '',
                  type: 'Forest Coffee Experience',
                  message: ''
                });
              }}
              className="bg-beige text-forest hover:bg-beige-dark px-5 py-2.5 rounded-full text-xs font-mono font-medium cursor-pointer transition-all"
            >
              {language === 'en' ? 'Book Another' : 'Pesan Pengalaman Lain'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="relative">
            <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <User size={10} /> {TRANSLATIONS[language].bookingName} *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none transition-all placeholder-beige/25"
              placeholder="e.g. Raden Sukarto"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Mail size={10} /> {TRANSLATIONS[language].bookingEmail} *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none transition-all placeholder-beige/25"
              placeholder="e.g. raden@explore.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phone */}
          <div className="relative">
            <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <PhoneCall size={10} /> {TRANSLATIONS[language].bookingPhone} *
            </label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none transition-all placeholder-beige/25"
              placeholder="e.g. +62812345678"
            />
          </div>

          {/* Date */}
          <div className="relative">
            <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Calendar size={10} /> {TRANSLATIONS[language].bookingDate} *
            </label>
            <input
              type="date"
              name="date"
              required
              value={formData.date}
              onChange={handleInputChange}
              className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-2.5 rounded-xl outline-none transition-all text-beige"
            />
          </div>

          {/* Time */}
          <div className="relative">
            <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Clock size={10} /> {TRANSLATIONS[language].bookingTime} *
            </label>
            <input
              type="time"
              name="time"
              required
              value={formData.time}
              onChange={handleInputChange}
              className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-2.5 rounded-xl outline-none transition-all text-beige"
            />
          </div>
        </div>

        {/* Experience Select */}
        <div className="relative">
          <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Sparkles size={10} /> {TRANSLATIONS[language].bookingType}
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none transition-all"
          >
            {bookingOptions[language].map((option, idx) => (
              <option key={idx} value={option} className="bg-forest-dark text-beige">
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Message / Seeking */}
        <div className="relative">
          <label className="block text-[10px] font-mono text-beige/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <MessageSquare size={10} /> {TRANSLATIONS[language].bookingMessage}
          </label>
          <textarea
            name="message"
            rows={3}
            value={formData.message}
            onChange={handleInputChange}
            className="w-full bg-forest-dark/40 border border-beige/15 focus:border-wood text-beige text-xs px-4 py-3 rounded-xl outline-none transition-all placeholder-beige/25 resize-none"
            placeholder={language === 'en' ? "Tell us what idea or mood you are bringing to the hills..." : "Beritahu kami cita rasa raga atau gagasan apa yang Anda bawa..."}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-wood hover:bg-wood-dark disabled:bg-forest/50 text-beige py-3.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-wood/20 active:scale-98"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 border-2 border-beige border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>{TRANSLATIONS[language].bookingSubmit}</span>
              <Send size={12} className="ml-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
