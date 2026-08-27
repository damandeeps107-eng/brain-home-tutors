/* ==========================================================================
   Brains Home Tutors Jammu - Main Application Logic
   Updated 6 Courses, GMap Location & Interactive Tutor Request
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. Full-Background Image Slider Component ---
  const heroSlides = document.querySelectorAll('.hero-slide');
  let currentSlide = 0;

  function nextSlide() {
    if (heroSlides.length === 0) return;
    
    heroSlides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % heroSlides.length;
    heroSlides[currentSlide].classList.add('active');
  }

  // Change slide every 5 seconds
  if (heroSlides.length > 1) {
    setInterval(nextSlide, 5000);
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

      // Direct WhatsApp dispatch without timeout/confirm to avoid popup blockers
      const waMsg = `Hi Brains Home Tutors Jammu, I have submitted an inquiry for ${name}. Grade: ${grade}, Course: ${subject}, Location: ${location}. Phone: ${phone}. Please assign a tutor!`;
      const waUrl = `https://wa.me/919419291913?text=${encodeURIComponent(waMsg)}`;
      
      // Open WhatsApp directly
      window.open(waUrl, '_blank');
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
