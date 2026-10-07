// ==============================================================================
// Muslim Ultra & Quran Academy - Supabase Client Configuration
// ==============================================================================

const SUPABASE_URL = 'https://apsaxarhenlsmigaklko.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc2F4YXJoZW5sc21pZ2FrbGtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjYxMzUsImV4cCI6MjEwNjgwMjEzNX0.oTNI7DlDi8uZ_Ja-IMRI9lbK8ZUCwmstCc2ti1pvyE8';

// Initialize Supabase Client
let supabaseClient = null;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Fallback Mock Data for Graceful Offline / Initial State
const FALLBACK_PROGRAMS = [
  {
    id: 'f1',
    title: 'Noorani Qaida & Basic Nazra',
    slug: 'noorani-qaida-nazra',
    description: 'Ideal for beginners and children. Learn Arabic alphabet phonetics, correct articulation (Makharij), and smooth Quranic reading from scratch.',
    monthly_fee: '$35 / month',
    duration: '30 mins / 3 days a week',
    schedule_flexibility: 'Flexible 1-on-1 Timing',
    display_order: 1
  },
  {
    id: 'f2',
    title: 'Hifz-ul-Quran (Memorization)',
    slug: 'hifz-ul-quran',
    description: 'Structured memorization program guided by certified Huffaz with daily revision (Sabaq, Sabaqi, Manzil) and personalized progress tracking.',
    monthly_fee: '$65 / month',
    duration: '45 mins / 5 days a week',
    schedule_flexibility: 'Flexible 1-on-1 Timing',
    display_order: 2
  },
  {
    id: 'f3',
    title: 'Tajweed & Tarteel Rules',
    slug: 'tajweed-tarteel',
    description: 'Master the rules of Noon Sakinah, Meem Sakinah, Madd, Ghunnah, and Waqf to recite the Holy Quran with authentic melody and precision.',
    monthly_fee: '$45 / month',
    duration: '30 mins / 4 days a week',
    schedule_flexibility: 'Flexible 1-on-1 Timing',
    display_order: 3
  },
  {
    id: 'f4',
    title: 'Quran Translation & Tafseer',
    slug: 'translation-tafseer',
    description: 'Word-by-word Arabic grammatical breakdown, thematic study of Surahs, and scholarly classical Tafseer explanations.',
    monthly_fee: '$50 / month',
    duration: '40 mins / 3 days a week',
    schedule_flexibility: 'Flexible 1-on-1 Timing',
    display_order: 4
  },
  {
    id: 'f5',
    title: 'Kids Islamic Studies & Duas',
    slug: 'kids-islamic-studies',
    description: 'Engaging curriculum covering daily Sunnah duas from Hisn al-Muslim, basic Fiqh of Taharah/Salah, Seerah of the Prophet ﷺ, and Islamic manners.',
    monthly_fee: '$40 / month',
    duration: '30 mins / 3 days a week',
    schedule_flexibility: 'Flexible 1-on-1 Timing',
    display_order: 5
  }
];

const FALLBACK_TEACHERS = [
  {
    id: 't1',
    name: 'Qari Muhammad Abdullah',
    qualification: 'Ijazah in Hafs \'an \'Asim, Al-Azhar Certified',
    experience: '8+ Years Online Teaching',
    photo_url: 'images/teachers/teacher-abdullah.png',
    bio: 'Specializes in Tajweed rectification, beginner Qaida phonetics, and youth engagement.'
  },
  {
    id: 't2',
    name: 'Ustadh Hafiz Bilal Ahmed',
    qualification: 'Hafiz-ul-Quran & Wifaq-ul-Madaris Graduate',
    experience: '10+ Years Hifz Mentorship',
    photo_url: 'images/teachers/teacher-bilal.png',
    bio: 'Dedicated Hifz mentor with over 40+ students who completed full Quran memorization under his guidance.'
  },
  {
    id: 't3',
    name: 'Ustadha Fatima Zahra',
    qualification: 'MA Islamic Studies & Qirat Specialization',
    experience: '6+ Years Teaching Female & Children',
    photo_url: 'images/teachers/teacher-fatima.png',
    bio: 'Expert in interactive kids learning, Tajweed for sisters, and daily Sunnah supplications.'
  }
];

// Public Fetch Functions
async function getActiveAnnouncement() {
  if (!supabaseClient) return null;
  try {
    const { data, error } = await supabaseClient
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (e) {
    console.warn('Supabase announcement fetch:', e);
    return null;
  }
}

async function getActivePrograms() {
  if (!supabaseClient) return FALLBACK_PROGRAMS;
  try {
    const { data, error } = await supabaseClient
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_PROGRAMS;
    return data;
  } catch (e) {
    console.warn('Supabase programs fetch error:', e);
    return FALLBACK_PROGRAMS;
  }
}

async function getActiveTeachers() {
  if (!supabaseClient) return FALLBACK_TEACHERS;
  try {
    const { data, error } = await supabaseClient
      .from('teachers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error || !data || data.length === 0) return FALLBACK_TEACHERS;
    return data;
  } catch (e) {
    console.warn('Supabase teachers fetch error:', e);
    return FALLBACK_TEACHERS;
  }
}

async function submitTrialBooking(bookingData) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const { data, error } = await supabaseClient
    .from('trial_bookings')
    .insert([
      {
        student_name: bookingData.name,
        contact_info: bookingData.contact,
        program_id: bookingData.programId || null,
        program_title: bookingData.programTitle || 'General Trial',
        preferred_time: bookingData.preferredTime || 'Flexible',
        notes: bookingData.notes || '',
        status: 'new'
      }
    ]);
  if (error) throw error;
  return data;
}

async function submitContactMessage(msgData) {
  if (!supabaseClient) throw new Error('Supabase client not initialized');
  const { data, error } = await supabaseClient
    .from('contact_messages')
    .insert([
      {
        name: msgData.name,
        email: msgData.email,
        message: msgData.message,
        is_read: false
      }
    ]);
  if (error) throw error;
  return data;
}

// Auto-render top announcement banner if element exists
document.addEventListener('DOMContentLoaded', async () => {
  const bannerContainer = document.getElementById('global-announcement-banner');
  if (bannerContainer) {
    const ann = await getActiveAnnouncement();
    if (ann && ann.message) {
      bannerContainer.innerHTML = `
        <div class="announcement-bar">
          <div class="container announcement-inner">
            <span>${ann.message}</span>
            ${ann.link_url ? `<a href="${ann.link_url}" class="announcement-link">Learn More &rarr;</a>` : ''}
          </div>
        </div>
      `;
      bannerContainer.style.display = 'block';
    }
  }
});
