/* ==========================================================================
   Brains Home Tutors Jammu - Main Application Logic
   Updated 6 Courses, GMap Location & Interactive Tutor Request
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. Full-Background Image Slider Component ---
  const bgSlides = document.querySelectorAll('.hero-bg-slide');
  const heroDots = document.querySelectorAll('.hero-slider-dots-bar .hero-dot');
  const prevBtn = document.getElementById('slidePrev');
  const nextBtn = document.getElementById('slideNext');
  let currentSlide = 0;
  let slideTimer;

  function showSlide(index) {
    if (bgSlides.length === 0) return;
    if (index >= bgSlides.length) currentSlide = 0;
    else if (index < 0) currentSlide = bgSlides.length - 1;
    else currentSlide = index;

    bgSlides.forEach((slide, i) => {
      slide.classList.toggle('active', i === currentSlide);
    });
    heroDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });
  }

  function nextSlide() {
    showSlide(currentSlide + 1);
  }

  function prevSlide() {
    showSlide(currentSlide - 1);
  }

  function startSlideTimer() {
    stopSlideTimer();
    slideTimer = setInterval(nextSlide, 3800);
  }

  function stopSlideTimer() {
    if (slideTimer) clearInterval(slideTimer);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startSlideTimer();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startSlideTimer();
    });
  }

  heroDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'));
      showSlide(idx);
      startSlideTimer();
    });
  });

  // Start auto slide
  startSlideTimer();

  // Pause slider on hover over hero section
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    heroSection.addEventListener('mouseenter', stopSlideTimer);
    heroSection.addEventListener('mouseleave', startSlideTimer);
  }

  // --- 2. Mobile Menu Drawer Toggle ---
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '84px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'white';
        navLinks.style.padding = '1.5rem';
        navLinks.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
      }
    });
  }

  // --- 3. Course Category Filtering System ---
  const tabBtns = document.querySelectorAll('.course-tabs .tab-btn');
  const courseCards = document.querySelectorAll('.courses-grid .course-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterCategory = btn.getAttribute('data-filter');

      courseCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterCategory === 'all' || category.includes(filterCategory)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // --- 4. Enquire About Course Button Actions ---
  const enquireBtns = document.querySelectorAll('.enquire-course-btn');
  enquireBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const courseName = btn.getAttribute('data-course-name') || 'Selected Course';
      const courseId = btn.getAttribute('data-course-id') || '';
      const inquirySection = document.getElementById('inquiry');
      const subjectSelect = document.getElementById('courseInterest');

      if (subjectSelect) {
        for (let i = 0; i < subjectSelect.options.length; i++) {
          const optVal = subjectSelect.options[i].value.toLowerCase();
          const optText = subjectSelect.options[i].text.toLowerCase();
          const nameLower = courseName.toLowerCase();
          const idLower = courseId.toLowerCase();

          if ((idLower && (optVal.includes(idLower) || optText.includes(idLower))) ||
              nameLower.includes(optVal) || optVal.includes(nameLower) || optText.includes(nameLower)) {
            subjectSelect.selectedIndex = i;
            break;
          }
        }
      }

      if (inquirySection) {
        inquirySection.scrollIntoView({ behavior: 'smooth' });
        showToast(`Enquiring for ${courseName}. Complete form below or call 9419291913!`, 'success');
      }
    });
  });

  // --- 5. Inquiry Form Handler ---
  const inquiryForm = document.getElementById('inquiryForm');

  if (inquiryForm) {
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('studentName')?.value || 'Parent';
      const phone = document.getElementById('phone')?.value || '';
      const grade = document.getElementById('classGrade')?.value || 'Tuition';
      const subject = document.getElementById('courseInterest')?.value || 'Course';
      const location = document.getElementById('area')?.value || 'Jammu';

      // Validation
      if (!phone || phone.length < 10) {
        showToast('Please enter a valid 10-digit mobile number.', 'warning');
        return;
      }

      // Show toast notification
      showToast(`Thank you, ${name}! Your tutor inquiry for ${subject} has been registered. Our Academic Coordinator will call you at 9419291913 shortly!`, 'success');

      // Reset form
      inquiryForm.reset();

      // Simulated WhatsApp dispatch option
      setTimeout(() => {
        const waMsg = `Hi Brains Home Tutors Jammu, I have submitted an inquiry for ${name}. Grade: ${grade}, Course: ${subject}, Location: ${location}. Phone: ${phone}. Please assign a tutor!`;
        const waUrl = `https://wa.me/919419291913?text=${encodeURIComponent(waMsg)}`;
        if (confirm("Would you like to open WhatsApp to connect directly with Academic Coordinator on 9419291913 right now?")) {
          window.open(waUrl, '_blank');
        }
      }, 1000);
    });
  }

  // --- 6. Toast Notification Helper ---
  function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}" style="color: var(--accent);"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
});
