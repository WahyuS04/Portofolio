from html.parser import HTMLParser
from pathlib import Path

translations = {
    'nav.home': {'id': 'Home', 'en': 'Home'},
    'nav.about': {'id': 'About', 'en': 'About'},
    'nav.experience': {'id': 'Experience', 'en': 'Experience'},
    'nav.project': {'id': 'Project', 'en': 'Project'},
    'nav.contact': {'id': 'Contact', 'en': 'Contact'},
    'nav.hire': {'id': 'Hubungi Saya', 'en': 'Contact Me'},
    'hero.greeting': {'id': 'Halo, saya', 'en': 'Hello, I am'},
    'hero.roleStatic': {'id': 'Tertarik pada ', 'en': 'Focused on '},
    'hero.viewProjects': {'id': 'Lihat Proyek', 'en': 'View Projects'},
    'hero.downloadCV': {'id': 'Unduh CV', 'en': 'Download CV'},
    'about.sectionLabel': {'id': 'Tentang Saya', 'en': 'About Me'},
    'about.title': {'id': 'Kenali Saya <span class="gradient-text">Lebih Dekat</span>', 'en': 'Get to Know <span class="gradient-text">Me Better</span>'},
    'about.intro': {'id': 'Saya adalah lulusan <strong>S1 Sistem Informasi dari Universitas Mercu Buana Yogyakarta</strong> yang memiliki minat dalam pengembangan web, desain web, serta manajemen proyek teknologi informasi.', 'en': 'I am a graduate of <strong>Bachelor of Information Systems from Mercu Buana University Yogyakarta</strong> with an interest in web development, web design, and IT project management.'},
    'about.desc': {'id': 'Selama masa pendidikan dan magang, saya terlibat dalam berbagai proyek yang membantu meningkatkan kemampuan analisis sistem, pengembangan aplikasi web, pengelolaan proyek, serta tata kelola teknologi informasi.', 'en': 'During my studies and internship, I participated in various projects that helped improve system analysis, web application development, project management, and IT governance skills.'},
    'about.locationLabel': {'id': '📍 Lokasi', 'en': '📍 Location'},
    'about.locationValue': {'id': 'Kebumen, Jawa Tengah, Indonesia', 'en': 'Kebumen, Central Java, Indonesia'},
    'about.educationLabel': {'id': '🎓 Pendidikan Terakhir', 'en': '🎓 Last Education'},
    'about.educationValue': {'id': 'S1 Sistem Informasi, UMBY', 'en': 'B.Sc. Information Systems, UMBY'},
    'about.statusLabel': {'id': '💼 Status', 'en': '💼 Status'},
    'about.statusValue': {'id': 'Aktif Mencari Kerja', 'en': 'Open to Opportunities'},
    'about.languagesLabel': {'id': '🌐 Bahasa', 'en': '🌐 Languages'},
    'about.languagesValue': {'id': 'Indonesia, Inggris', 'en': 'Indonesian, English'},
    'about.contactButton': {'id': 'Hubungi Saya', 'en': 'Contact Me'},
    'about.educationButton': {'id': 'Lihat Pendidikan', 'en': 'View Education'},
    'education.sectionLabel': {'id': 'Riwayat Akademis', 'en': 'Academic History'},
    'education.title': {'id': 'Pendidikan <span class="gradient-text">Formal</span>', 'en': 'Education <span class="gradient-text">Formal</span>'},
    'certifications.sectionLabel': {'id': 'Pencapaian', 'en': 'Achievements'},
    'certifications.title': {'id': 'Sertifikasi <span class="gradient-text">Profesional</span>', 'en': 'Professional <span class="gradient-text">Certifications</span>'},
    'organizations.sectionLabel': {'id': 'Kepemimpinan', 'en': 'Leadership'},
    'organizations.title': {'id': 'Riwayat <span class="gradient-text">Organisasi</span>', 'en': 'Organization <span class="gradient-text">History</span>'},
    'internship.sectionLabel': {'id': 'Pengalaman Kerja', 'en': 'Work Experience'},
    'internship.title': {'id': 'Pengalaman <span class="gradient-text">Magang</span>', 'en': 'Internship <span class="gradient-text">Experience</span>'},
    'projects.sectionLabel': {'id': 'Karya Saya', 'en': 'My Work'},
    'projects.title': {'id': 'Proyek <span class="gradient-text">Pilihan</span>', 'en': 'Selected <span class="gradient-text">Projects</span>'},
    'projects.filterAll': {'id': 'Semua', 'en': 'All'},
    'projects.filterWeb': {'id': 'Aplikasi Web', 'en': 'Web Apps'},
    'projects.filterMobile': {'id': 'Aplikasi Mobile', 'en': 'Mobile Apps'},
    'projects.filterDesign': {'id': 'Desain UI/UX', 'en': 'UI/UX Design'},
    'skills.sectionLabel': {'id': 'Kompetensi', 'en': 'Competencies'},
    'skills.title': {'id': 'Keahlian & <span class="gradient-text">Teknologi</span>', 'en': 'Skills & <span class="gradient-text">Technology</span>'},
    'skills.tabFrontend': {'id': 'Bahasa & Framework', 'en': 'Languages & Frameworks'},
    'skills.tabTools': {'id': 'Desain & Alat Kerja', 'en': 'Design & Tools'},
    'contact.sectionLabel': {'id': 'Hubungi Saya', 'en': 'Contact Me'},
    'contact.title': {'id': 'Mari <span class="gradient-text">Terhubung</span>', 'en': 'Let’s <span class="gradient-text">Connect</span>'},
    'contact.description': {'id': 'Punya posisi magang/kerja kosong atau ingin berkolaborasi? Jangan ragu untuk mengirimkan pesan!', 'en': 'Have an open internship/job position or want to collaborate? Feel free to send a message!'},
    'contact.emailLabel': {'id': 'Email', 'en': 'Email'},
    'contact.emailValue': {'id': 'rizky.pratama@email.com', 'en': 'rizky.pratama@email.com'},
    'contact.phoneLabel': {'id': 'WhatsApp', 'en': 'WhatsApp'},
    'contact.phoneValue': {'id': '+62 812-3456-7890', 'en': '+62 812-3456-7890'},
    'contact.locationLabel': {'id': 'Domisili', 'en': 'Location'},
    'contact.locationValue': {'id': 'Jakarta, Indonesia', 'en': 'Jakarta, Indonesia'},
    'contact.nameLabel': {'id': 'Nama Lengkap', 'en': 'Full Name'},
    'contact.namePlaceholder': {'id': 'Nama Anda', 'en': 'Your Name'},
    'contact.emailLabelForm': {'id': 'Alamat Email', 'en': 'Email Address'},
    'contact.emailPlaceholder': {'id': 'email@contoh.com', 'en': 'email@example.com'},
    'contact.subjectLabel': {'id': 'Subjek', 'en': 'Subject'},
    'contact.subjectPlaceholder': {'id': 'Tawaran Kerja / Magang / Kolaborasi', 'en': 'Job Offer / Internship / Collaboration'},
    'contact.messageLabel': {'id': 'Pesan Anda', 'en': 'Your Message'},
    'contact.messagePlaceholder': {'id': 'Tuliskan pesan secara singkat dan jelas di sini...', 'en': 'Write a short and clear message here...'},
    'contact.sendButton': {'id': 'Kirim Pesan ✨', 'en': 'Send Message ✨'},
    'contact.sendingText': {'id': 'Mengirim...', 'en': 'Sending...'},
    'contact.successMessage': {'id': '💖 Pesan Anda telah sukses dikirim! Terima kasih banyak.', 'en': '💖 Your message was sent successfully! Thank you.'},
    'footer.description': {'id': 'Membangun antarmuka yang ramah pengguna dengan sentuhan kreativitas.', 'en': 'Building user-friendly interfaces with a touch of creativity.'},
    'footer.copy': {'id': '© 2026 Rizky Pratama. Dibuat dengan ❤️ & ✨', 'en': '© 2026 Rizky Pratama. Built with ❤️ & ✨'},
}

meta_translations = {
    'description': {
        'id': 'Portfolio profesional Rizky Pratama. Lihat profil, pendidikan, pengalaman magang, proyek, sertifikasi, keahlian, dan organisasi saya.',
        'en': 'Professional portfolio of Rizky Pratama. Explore profile, education, internship experience, projects, certifications, skills, and organizations.'
    }
}

class AttrHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.result = ''

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'data-i18n' in attrs:
            key = attrs['data-i18n']
            if key in translations:
                attrs['data-i18n-id'] = translations[key]['id']
                attrs['data-i18n-en'] = translations[key]['en']
        if 'data-i18n-placeholder' in attrs:
            key = attrs['data-i18n-placeholder']
            if key in translations:
                attrs['data-i18n-placeholder-id'] = translations[key]['id']
                attrs['data-i18n-placeholder-en'] = translations[key]['en']
        if tag == 'meta' and attrs.get('name') == 'description':
            attrs['data-i18n-id'] = meta_translations['description']['id']
            attrs['data-i18n-en'] = meta_translations['description']['en']
        attr_str = ''.join(f' {name}="{value}"' for name, value in attrs.items())
        self.result += f'<{tag}{attr_str}>'

    def handle_endtag(self, tag):
        self.result += f'</{tag}>'

    def handle_startendtag(self, tag, attrs):
        attrs = dict(attrs)
        if 'data-i18n' in attrs:
            key = attrs['data-i18n']
            if key in translations:
                attrs['data-i18n-id'] = translations[key]['id']
                attrs['data-i18n-en'] = translations[key]['en']
        if 'data-i18n-placeholder' in attrs:
            key = attrs['data-i18n-placeholder']
            if key in translations:
                attrs['data-i18n-placeholder-id'] = translations[key]['id']
                attrs['data-i18n-placeholder-en'] = translations[key]['en']
        if tag == 'meta' and attrs.get('name') == 'description':
            attrs['data-i18n-id'] = meta_translations['description']['id']
            attrs['data-i18n-en'] = meta_translations['description']['en']
        attr_str = ''.join(f' {name}="{value}"' for name, value in attrs.items())
        self.result += f'<{tag}{attr_str} />'

    def handle_data(self, data):
        self.result += data

    def handle_comment(self, data):
        self.result += f'<!--{data}-->'

    def handle_entityref(self, name):
        self.result += f'&{name};'

    def handle_charref(self, name):
        self.result += f'&#{name};'


path = Path('index.html')
html = path.read_text(encoding='utf-8')
parser = AttrHTMLParser()
parser.feed(html)
path.write_text(parser.result, encoding='utf-8')
print('Updated index.html with data-i18n-id and data-i18n-en attributes.')
