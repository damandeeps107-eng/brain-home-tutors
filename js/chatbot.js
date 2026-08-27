/* ==========================================================================
   Brains Home Tutors Jammu - Advanced AI Academic Assistant ("Brainy Bot")
   Features:
   - Deep NLP keyword matching (Location, Google Maps link, 6 Core Courses)
   - Rich interactive course detail cards with direct WhatsApp & form triggers
   - In-chat lead capture & quick inquiry dispatch
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const launcher = document.getElementById('chatbotLauncher');
  const modal = document.getElementById('chatbotModal');
  const closeBtn = document.getElementById('chatCloseBtn');
  const chatBody = document.getElementById('chatBody');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');

  if (!launcher || !modal) return;

  // Track conversational state
  let leadState = {
    step: 0,
    course: '',
    name: '',
    phone: ''
  };

  // Toggle Chatbot Modal
  launcher.addEventListener('click', () => {
    modal.classList.toggle('open');
    const badge = launcher.querySelector('.chat-notification-badge');
    if (badge) badge.style.display = 'none';
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('open');
  });

  // --- Detailed Course Database ---
  const courseDetails = {
    'foundation': {
      title: "🏫 Class 9th & 10th (Science & Maths Foundation)",
      tag: "Boards + Competitive Foundation",
      desc: "Comprehensive 1-on-1 home tuition for Science (Physics, Chemistry, Biology) and Mathematics for Classes 9 & 10.",
      highlights: [
        "• Complete CBSE & JKBOSE Board syllabus",
        "• Early foundation for NEET & IIT-JEE",
        "• Numerical practice & weekly tests",
        "• Regular performance reports for parents"
      ]
    },
    'jee': {
      title: "🎯 IIT-JEE Prep (JEE Main & Advanced)",
      tag: "JEE Main + Advanced Level",
      desc: "Advanced problem-solving coaching for IIT-JEE aspirants by verified IITian & senior engineering faculty.",
      highlights: [
        "• Multi-concept & integer-type numericals",
        "• Speed & accuracy improvement tactics",
        "• All 3 subjects: Physics, Chemistry & Maths",
        "• Full-length NTA pattern mock tests"
      ]
    },
    'neet': {
      title: "🩺 NEET Prep (Biology + Physics + Chemistry)",
      tag: "NEET UG Medical Specialization",
      desc: "Targeted 1-on-1 home coaching for NEET UG medical entrance covering all 3 core subjects.",
      highlights: [
        "• Biology diagrams, NCERT line-by-line focus",
        "• Physics numerical speed building",
        "• Organic reaction mechanisms & Inorganic mnemonics",
        "• Rank improvement strategy & past 10-year papers"
      ]
    },
    'maths': {
      title: "📐 Mathematics (Class 9th to 12th)",
      tag: "Boards + IIT-JEE Focus",
      desc: "From foundational algebra to advanced calculus — personalized Maths home coaching that builds confidence.",
      highlights: [
        "• Algebra, Trigonometry & Geometry (9th-10th)",
        "• Calculus, Vectors & 3D Geometry (11th-12th)",
        "• JEE Main & Advanced level problem sets",
        "• Daily practice problem (DPP) sheets"
      ]
    },
    'chemistry': {
      title: "🧪 Chemistry (Class 11th & 12th)",
      tag: "Organic, Inorganic & Physical",
      desc: "Exam-ready precision coaching for Class 11 & 12 Chemistry for Boards, NEET, and JEE.",
      highlights: [
        "• Organic Reaction Mechanisms & named reactions",
        "• Physical Chemistry numerical solving formulas",
        "• Inorganic Periodic Trends & NCERT memory maps",
        "• High weightage chapter masterclasses"
      ]
    },
    'physics': {
      title: "⚛️ Physics (Class 11th & 12th)",
      tag: "Mechanics, Electromagnetism & Modern Physics",
      desc: "Master Physics with deep conceptual clarity, HC Verma numericals, and derivation practice.",
      highlights: [
        "• Mechanics, Thermodynamics & Waves (11th)",
        "• Electrostatics, Optics & Modern Physics (12th)",
        "• Derivations + Board paper writing tips",
        "• Competitive numerical shortcuts for NEET & JEE"
      ]
    }
  };

  // Append user message
  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message user';
    msgDiv.textContent = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Append bot message with optional interactive chips & action buttons
  function addBotMessage(htmlContent, chips = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message bot';
    msgDiv.innerHTML = htmlContent;

    if (chips && chips.length > 0) {
      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'chat-chips';
      chips.forEach(chip => {
        const chipBtn = document.createElement('button');
        chipBtn.className = 'chip-btn';
        if (typeof chip === 'string') {
          chipBtn.textContent = chip;
          chipBtn.addEventListener('click', () => handleChipClick(chip));
        } else if (typeof chip === 'object') {
          chipBtn.textContent = chip.label;
          chipBtn.addEventListener('click', chip.action);
        }
        chipsContainer.appendChild(chipBtn);
      });
      msgDiv.appendChild(chipsContainer);
    }

    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Show rich course details card inside chat
  function showCourseDetailsCard(courseKey) {
    const course = courseDetails[courseKey];
    if (!course) return;

    const html = `
      <div style="font-weight: 700; color: var(--primary); font-size: 1rem; margin-bottom: 0.3rem;">${course.title}</div>
      <div style="display: inline-block; background: var(--accent-light); color: #966F27; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; margin-bottom: 0.6rem; border: 1px solid var(--accent-border);">${course.tag}</div>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.6rem;">${course.desc}</p>
      <div style="font-weight: 600; font-size: 0.82rem; color: var(--primary); margin-bottom: 0.4rem;">Key Program Highlights:</div>
      <div style="font-size: 0.82rem; color: var(--text-main); line-height: 1.5; margin-bottom: 0.8rem;">
        ${course.highlights.join('<br>')}
      </div>
      <div style="font-size: 0.82rem; color: var(--primary); font-weight: 600;">📞 Call Helpline: <a href="tel:9419291913" style="color: var(--accent); font-weight: 700;">9419291913</a></div>
    `;

    const actionChips = [
      {
        label: "📝 Inquire for This Course",
        action: () => triggerCourseInquiry(course.title)
      },
      {
        label: "💬 WhatsApp Query (9419291913)",
        action: () => {
          const waUrl = `https://wa.me/919419291913?text=${encodeURIComponent('Hi Brains Home Tutors, I am inquiring about ' + course.title)}`;
          window.open(waUrl, '_blank');
        }
      },
      "Other Courses",
      "Google Location"
    ];

    addBotMessage(html, actionChips);
  }

  // Location Response Card
  function showLocationCard() {
    const html = `
      <div style="font-weight: 700; color: var(--primary); font-size: 1rem; margin-bottom: 0.4rem;">📍 Brains Home Tutors Location & Address</div>
      <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.6rem;">
        We provide 1-on-1 home tutors across all major areas in <strong>Jammu</strong> including:
      </p>
      <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600; margin-bottom: 0.8rem;">
        • Gandhi Nagar & Trikuta Nagar<br>
        • Channi Himmat & Shastri Nagar<br>
        • Sainik Colony & Greater Kailash<br>
        • Nanak Nagar & Bantalab
      </div>
      <div style="background: white; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-light); font-size: 0.85rem; margin-bottom: 0.8rem;">
        <i class="fa-solid fa-map-location-dot" style="color: var(--accent); margin-right: 0.4rem;"></i> <strong>Google Map Profile:</strong><br>
        <a href="https://share.google/gk2AA9AT4NJqCBgP9" target="_blank" style="color: var(--accent); font-weight: 700; word-break: break-all;">https://share.google/gk2AA9AT4NJqCBgP9 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i></a>
      </div>
      <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">
        📞 Helpline: <a href="tel:9419291913" style="color: var(--accent);">9419291913</a><br>
        📧 Email: <a href="mailto:brainshometutorsjammu@gmail.com" style="color: var(--primary);">brainshometutorsjammu@gmail.com</a>
      </div>
    `;

    const chips = [
      {
        label: "🗺️ Open Google Maps Profile",
        action: () => window.open('https://share.google/gk2AA9AT4NJqCBgP9', '_blank')
      },
      "Request Home Tutor",
      "Call 9419291913"
    ];

    addBotMessage(html, chips);
  }

  // Trigger form pre-selection and smooth scroll
  function triggerCourseInquiry(courseTitle) {
    modal.classList.remove('open');
    const inquirySection = document.getElementById('inquiry');
    const subjectSelect = document.getElementById('studentSubject');

    if (subjectSelect) {
      for (let i = 0; i < subjectSelect.options.length; i++) {
        if (courseTitle.toLowerCase().includes(subjectSelect.options[i].text.toLowerCase()) ||
            subjectSelect.options[i].text.toLowerCase().includes(courseTitle.toLowerCase())) {
          subjectSelect.selectedIndex = i;
          break;
        }
      }
    }

    if (inquirySection) {
      inquirySection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Handle user typing & send
  function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInput.value = '';

    setTimeout(() => {
      processAdvancedBotReply(text);
    }, 450);
  }

  sendBtn.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // Chip click router
  function handleChipClick(chipText) {
    addUserMessage(chipText);

    setTimeout(() => {
      processAdvancedBotReply(chipText);
    }, 400);
  }

  // --- Advanced Natural Language Intelligence Processor ---
  function processAdvancedBotReply(text) {
    const lower = text.toLowerCase();

    // 1. Location / Address / Map Queries
    if (lower.includes('location') || lower.includes('address') || lower.includes('where') || lower.includes('gmap') || lower.includes('map') || lower.includes('kaha') || lower.includes('office') || lower.includes('google location')) {
      showLocationCard();
      return;
    }

    // 2. Specific Course Queries
    if (lower.includes('class 9') || lower.includes('class 10') || lower.includes('9th') || lower.includes('10th') || lower.includes('foundation')) {
      showCourseDetailsCard('foundation');
      return;
    }

    if (lower.includes('jee') || lower.includes('iit') || lower.includes('engineering') || lower.includes('advanced')) {
      showCourseDetailsCard('jee');
      return;
    }

    if (lower.includes('neet') || lower.includes('medical') || lower.includes('doctor') || lower.includes('bio') || lower.includes('biology')) {
      showCourseDetailsCard('neet');
      return;
    }

    if (lower.includes('math') || lower.includes('maths') || lower.includes('calculus') || lower.includes('algebra')) {
      showCourseDetailsCard('maths');
      return;
    }

    if (lower.includes('chemistry') || lower.includes('chem') || lower.includes('organic') || lower.includes('inorganic')) {
      showCourseDetailsCard('chemistry');
      return;
    }

    if (lower.includes('physics') || lower.includes('phys') || lower.includes('mechanics') || lower.includes('optics')) {
      showCourseDetailsCard('phys');
      return;
    }

    // 3. Courses Overview Query
    if (lower.includes('courses') || lower.includes('subject') || lower.includes('list') || lower.includes('program') || lower.includes('batch')) {
      const html = `
        <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.4rem;">Select a Course to View Details & Inquiry:</div>
        <p style="font-size: 0.88rem; color: var(--text-muted);">We provide specialized 1-on-1 home tuition in Jammu for all 6 core programs:</p>
      `;
      const chips = [
        "Class 9th & 10th",
        "IIT-JEE Prep",
        "NEET Prep",
        "Mathematics",
        "Chemistry",
        "Physics"
      ];
      addBotMessage(html, chips);
      return;
    }

    // 4. Contact / Helpline / Phone Queries
    if (lower.includes('phone') || lower.includes('contact') || lower.includes('call') || lower.includes('number') || lower.includes('email') || lower.includes('whatsapp')) {
      const html = `
        <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.4rem;">📞 Direct Helpline & Support</div>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.6rem;">
          You can reach out to our Academic Coordinator directly:
        </p>
        <div style="font-size: 0.88rem; color: var(--primary); font-weight: 600; line-height: 1.6;">
          • Phone: <a href="tel:9419291913" style="color: var(--accent); font-weight: 700;">9419291913</a><br>
          • WhatsApp: <a href="https://wa.me/919419291913" target="_blank" style="color: #25D366; font-weight: 700;">9419291913</a><br>
          • Email: <a href="mailto:brainshometutorsjammu@gmail.com" style="color: var(--primary);">brainshometutorsjammu@gmail.com</a>
        </div>
      `;
      const chips = [
        {
          label: "💬 Open WhatsApp Chat",
          action: () => window.open('https://wa.me/919419291913', '_blank')
        },
        "Request Home Tutor",
        "Google Location"
      ];
      addBotMessage(html, chips);
      return;
    }

    // 5. General Inquiry / Default Help Response
    const defaultHtml = `
      Hello! I am <strong>Brainy Bot</strong> 🤖, your Academic Advisor at <strong>Brains Home Tutors Jammu</strong>.<br><br>
      How can I assist you today? Select an option below:
    `;
    const defaultChips = [
      "📍 Google Location",
      "🏫 Class 9th & 10th",
      "🎯 IIT-JEE Prep",
      "🩺 NEET Prep",
      "📐 Mathematics",
      "🧪 Chemistry",
      "⚛️ Physics",
      "📞 Call 9419291913"
    ];
    addBotMessage(defaultHtml, defaultChips);
  }

  // Delegated event for initial embedded chips
  document.querySelectorAll('.chat-chips .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleChipClick(btn.textContent);
    });
  });
});
