// ===== CUSTOM CURSOR =====
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
});
function animateFollower() {
  fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12;
  if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
  requestAnimationFrame(animateFollower);
}
animateFollower();

const defaultLanguage = 'id';
let currentLanguage = localStorage.getItem('portfolioLang')?.toLowerCase() || defaultLanguage;

const languageSelect = document.getElementById('languageSelect');
if (languageSelect) languageSelect.value = currentLanguage;

const rolesByLanguage = {
  id: ['Web Design', 'Web Development', 'System Analyst', 'Data Analyst', 'Project Management'],
  en: ['Web Design', 'Web Development', 'System Analyst', 'Data Analyst', 'Project Management']
};
let currentRoleList = rolesByLanguage[currentLanguage] || rolesByLanguage.id;
const roleEl = document.getElementById('roleText');
let ri = 0, ci = 0, deleting = false;

let originalTexts = {};    
let translationCache = {}; 
const CACHE_KEY = 'portfolioTranslations_v2';
const FINGERPRINT_KEY = 'portfolioFingerprint_v2';

// Kumpulkan semua teks asli dari DOM
function collectOriginalTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key || originalTexts[key]) return;
    originalTexts[key] = el.innerHTML.trim();
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (!key || originalTexts[key]) return;
    originalTexts[key] = el.placeholder || '';
  });
}

// Fingerprint sederhana — berubah jika konten HTML berubah
function buildFingerprint() {
  const str = Object.values(originalTexts).join('|');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h.toString(36);
}

function loadCache() {
  try {
    const fp   = localStorage.getItem(FINGERPRINT_KEY);
    const data = localStorage.getItem(CACHE_KEY);
    if (fp && data) { translationCache = JSON.parse(data); return fp; }
  } catch (e) {}
  translationCache = {};
  return null;
}

function saveCache(fp) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(translationCache));
    localStorage.setItem(FINGERPRINT_KEY, fp);
  } catch (e) {}
}

async function translateOne(text, targetLang) {
  const tags = [];
  const stripped = text.replace(/<[^>]+>/g, match => {
    tags.push(match);
    return `[[T${tags.length - 1}]]`;
  });

  if (!stripped.trim()) return text; 

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(stripped)}&langpair=id|${targetLang}`;
    const res  = await fetch(url);
    const data = await res.json();
    let translated = data.responseData?.translatedText || stripped;

    // Kembalikan tag HTML
    translated = translated.replace(/\[\[T(\d+)\]\]/g, (_, i) => tags[+i] || '');
    return translated;
  } catch (e) {
    return text; 
  }
}

// Terjemahkan semua teks — batch dengan jeda kecil agar tidak kena rate-limit
async function translateAllTexts(targetLang) {
  if (translationCache[targetLang]) return translationCache[targetLang];

  const entries = Object.entries(originalTexts);
  if (entries.length === 0) return {};

  showLoader(true);

  const result = {};
  // MyMemory gratis: 500 req/hari per IP, max ~500 karakter per request
  // Kita proses paralel dalam batch 5 agar lebih cepat
  const BATCH = 5;
  for (let i = 0; i < entries.length; i += BATCH) {
    const chunk = entries.slice(i, i + BATCH);
    await Promise.all(chunk.map(async ([key, text]) => {
      result[key] = await translateOne(text, targetLang);
    }));
    // Jeda kecil antar batch agar tidak overwhelming API
    if (i + BATCH < entries.length) await sleep(300);
  }

  translationCache[targetLang] = result;
  saveCache(buildFingerprint());
  showLoader(false);
  return result;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Terapkan terjemahan ke DOM
function applyTranslations(translations) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key] !== undefined) el.innerHTML = translations[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key] !== undefined) el.placeholder = translations[key];
  });
}

// Kembalikan ke teks asli Indonesia
function applyOriginalTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (originalTexts[key] !== undefined) el.innerHTML = originalTexts[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (originalTexts[key] !== undefined) el.placeholder = originalTexts[key];
  });
}

// Set bahasa aktif
async function setLanguage(lang) {
  currentLanguage = ['id', 'en'].includes(lang) ? lang : defaultLanguage;
  localStorage.setItem('portfolioLang', currentLanguage);
  currentRoleList = rolesByLanguage[currentLanguage] || rolesByLanguage.id;
  document.documentElement.lang = currentLanguage;
  if (languageSelect) languageSelect.value = currentLanguage;

  if (currentLanguage === 'id') {
    applyOriginalTexts();
  } else {
    const translations = await translateAllTexts(currentLanguage);
    if (translations) applyTranslations(translations);
  }

  // Reset typing animation
  ri = 0; ci = 0; deleting = false;
  if (roleEl) roleEl.textContent = '';
  setTimeout(typeEffect, 200);
}

// Toast loader
function showLoader(show) {
  let el = document.getElementById('transLoader');
  if (show && !el) {
    el = document.createElement('div');
    el.id = 'transLoader';
    el.innerHTML = '🌐 Translating…';
    el.style.cssText = `
      position:fixed;top:80px;right:20px;z-index:9999;
      background:rgba(0,0,0,.8);color:#fff;
      padding:10px 18px;border-radius:10px;font-size:13px;
      font-family:inherit;backdrop-filter:blur(6px);
      box-shadow:0 4px 20px rgba(0,0,0,.3);`;
    document.body.appendChild(el);
  } else if (!show && el) {
    el.remove();
  }
}

// Language selector
if (languageSelect) {
  languageSelect.addEventListener('change', () => setLanguage(languageSelect.value));
}

// Init saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  collectOriginalTexts();

  // Invalidasi cache jika konten HTML berubah
  const savedFP  = loadCache();
  const currentFP = buildFingerprint();
  if (savedFP !== currentFP) {
    translationCache = {};
    saveCache(currentFP);
  }

  // Terapkan bahasa tersimpan
  if (currentLanguage !== 'id') {
    if (translationCache[currentLanguage]) {
      applyTranslations(translationCache[currentLanguage]);
      document.documentElement.lang = currentLanguage;
    } else {
      setLanguage(currentLanguage);
    }
  }

  typeEffect();
});

// ===== TYPING EFFECT =====
function typeEffect() {
  if (!roleEl) return;
  const word = currentRoleList[ri];
  if (!deleting) {
    roleEl.textContent = word.slice(0, ++ci);
    if (ci === word.length) { deleting = true; setTimeout(typeEffect, 2500); return; }
  } else {
    roleEl.textContent = word.slice(0, --ci);
    if (ci === 0) { deleting = false; ri = (ri + 1) % currentRoleList.length; }
  }
  setTimeout(typeEffect, deleting ? 75 : 120);
}

// ===== NAVBAR & SCROLL =====
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);
  updateActiveNav();
});

if (hamburger) hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

if (navLinks) navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
}));

function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 150) current = s.id; });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
}

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); }
  });
}, { threshold: 0.1 });

document.querySelectorAll(
  '.hero-text,.hero-image,.about-image-wrap,.about-content,.edu-card,.timeline-item,.project-card,.cert-card,.skill-tag-item,.org-card,.contact-info,.contact-form,.section-header'
).forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 3) * 0.06 + 's';
  revealObserver.observe(el);
});

// ===== SKILLS TABS =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

// ===== PROJECTS FILTER =====
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.project-card').forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.style.opacity = '0'; card.style.transform = 'scale(0.9)';
      setTimeout(() => {
        card.classList.toggle('hidden', !match);
        if (match) requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; });
      }, 150);
    });
  });
});

// ===== CONTACT FORM =====

// Inisialisasi EmailJS
emailjs.init("jIasFypAbnOmID0lW");

const form = document.getElementById('contactForm');

if (form) {

    form.addEventListener('submit', function (e) {

        e.preventDefault();

        let valid = true;

        const name = document.getElementById('nameInput');
        const email = document.getElementById('emailInput');
        const subject = document.getElementById('subjectInput');
        const msg = document.getElementById('messageInput');

        const nameErr = document.getElementById('nameError');
        const emailErr = document.getElementById('emailError');
        const msgErr = document.getElementById('messageError');

        const btnText = document.getElementById('btnText');
        const btnLoading = document.getElementById('btnLoading');
        const submitBtn = document.getElementById('submitBtn');
        const successEl = document.getElementById('formSuccess');

        // Reset Error
        [name, email, msg].forEach(field => {
            if (field) field.classList.remove('error');
        });

        [nameErr, emailErr, msgErr].forEach(error => {
            if (error) error.textContent = '';
        });

        if (successEl) {
            successEl.style.display = 'none';
        }

        // Validasi Nama
        if (!name.value.trim()) {
            name.classList.add('error');
            nameErr.textContent =
                currentLanguage === 'en'
                    ? 'Name is required.'
                    : 'Nama wajib diisi.';
            valid = false;
        }

        // Validasi Email
        if (
            !email.value.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
        ) {
            email.classList.add('error');
            emailErr.textContent =
                currentLanguage === 'en'
                    ? 'Invalid email.'
                    : 'Email tidak valid.';
            valid = false;
        }

        // Validasi Pesan
        if (
            !msg.value.trim() ||
            msg.value.trim().length < 10
        ) {
            msg.classList.add('error');
            msgErr.textContent =
                currentLanguage === 'en'
                    ? 'Message must be at least 10 characters.'
                    : 'Pesan minimal 10 karakter.';
            valid = false;
        }

        if (!valid) return;

        // Loading State
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        // Kirim Email
        emailjs.send(
            "service_xjfooj5",
            "template_aky3c9a",
            {
                from_name: name.value,
                from_email: email.value,
                subject: subject.value,
                message: msg.value
            }
        )
        .then(function () {

            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;

            if (successEl) {
                successEl.style.display = 'block';

                setTimeout(() => {
                    successEl.style.display = 'none';
                }, 5000);
            }

            form.reset();

        })
        .catch(function (error) {

            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;

            console.error("EmailJS Error:", error);

            alert(
                currentLanguage === 'en'
                    ? 'Failed to send message.'
                    : 'Gagal mengirim pesan.'
            );

        });

    });

}

// ===== BACK TO TOP =====
const backToTop = document.getElementById('backToTop');
if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ===== IMAGE FALLBACK =====
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    if (img.dataset.fallbackDone) return;
    img.dataset.fallbackDone = '1';
    img.style.display = 'none';
    const ph = document.createElement('div');
    ph.style.cssText = 'width:100%;height:100%;background:linear-gradient(135deg,#ff758f,#9b5de5);display:flex;align-items:center;justify-content:center;font-size:5rem;color:#fff;border-radius:inherit;';
    ph.textContent = '🌸';
    img.parentNode.appendChild(ph);
  });
});

// ===== PROJECT SCREENSHOTS LIGHTBOX =====
(function initProjectScreenshots(){
  function createModal(){
    if (document.getElementById('ssModal')) return;
    const modal = document.createElement('div');
    modal.id = 'ssModal'; modal.className = 'ss-modal';
    modal.innerHTML = `
      <div class="ss-viewer">
        <button class="ss-prev" aria-label="Previous">‹</button>
        <img src="" alt="Screenshot" />
        <button class="ss-next" aria-label="Next">›</button>
        <button class="ss-close" aria-label="Close">✕</button>
        <button class="ss-fullscreen" aria-label="Full screen">⛶</button>
        <div class="ss-caption"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    modal.querySelector('.ss-close').addEventListener('click', closeModal);
    modal.querySelector('.ss-prev').addEventListener('click', () => navigate(-1));
    modal.querySelector('.ss-next').addEventListener('click', () => navigate(1));
    modal.querySelector('.ss-fullscreen').addEventListener('click', () => toggleFullscreen(modal.querySelector('.ss-viewer')));
    document.addEventListener('fullscreenchange', updateFullscreenState);

  }

  let imgs = [], idx = 0, imageCaptions = [];

  function openModal(list, captions, start = 0){
    createModal();
    imgs = list.slice();
    idx = Math.max(0, Math.min(start, imgs.length - 1));
    imageCaptions = captions.slice();
    const modal = document.getElementById('ssModal');
    const imgEl = modal.querySelector('img');
    const cap = modal.querySelector('.ss-caption');
    imgEl.src = imgs[idx];
    cap.textContent = buildCaptionText();
    modal.classList.add('open');
  }

  function buildCaptionText(){
    const captionIndex = `${idx + 1}/${imgs.length}`;
    if (!imageCaptions.length) return captionIndex;
    const captionText = imageCaptions[idx] || '';
    return captionText ? `${captionIndex} · ${captionText}` : captionIndex;
  }

  function setButtonLabels(){
    document.querySelectorAll('.proj-ss').forEach(btn => {
      const list = (btn.dataset.ss || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!list.length) return;
      const countText = list.length > 1 ? `${list.length} Dokumentasi` : '1 Dokumentasi';
      btn.textContent = `🖼️ ${countText}`;
    });
  }

  function closeModal(){
    const m = document.getElementById('ssModal');
    if (m) {
      m.classList.remove('open');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }

  function toggleFullscreen(target){
    if (!target) return;
    if (!document.fullscreenElement) {
      target.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function updateFullscreenState(){
    const button = document.querySelector('.ss-fullscreen');
    if (!button) return;
    button.textContent = document.fullscreenElement ? '🗗' : '⛶';
  }

  function navigate(dir){
    if (!imgs.length) return;
    idx = (idx + dir + imgs.length) % imgs.length;
    const m = document.getElementById('ssModal'); if (!m) return;
    const imgEl = m.querySelector('img'); const cap = m.querySelector('.ss-caption');
    imgEl.src = imgs[idx]; cap.textContent = buildCaptionText();
  }

  document.addEventListener('keydown', e => {
    if (!document.getElementById('ssModal')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });

  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('.proj-ss');
    if (!el) return;
    e.preventDefault();
    const list = (el.dataset.ss || '').split(',').map(s => s.trim()).filter(Boolean);
    const captions = (el.dataset.ssCaptions || '').split('|').map(s => s.trim()).filter(Boolean);
    if (!list.length) return;
    openModal(list, captions);
  });

  setButtonLabels();
})();
