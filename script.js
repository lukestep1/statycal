const nav = document.getElementById('nav');
const toggle = document.querySelector('.menu-toggle');
const heroImage = document.querySelector('.hero__image');
const decorToggle = document.getElementById('decor-toggle');
const logoImg = document.querySelector('.brand img');

const closeNav = () => {
  if (!nav || !toggle) return;
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
};

const openNav = () => {
  if (!nav || !toggle) return;
  nav.classList.add('open');
  toggle.setAttribute('aria-expanded', 'true');
  const firstLink = nav.querySelector('a');
  if (firstLink) firstLink.focus();
};

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.contains('open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  document.addEventListener('click', event => {
    const target = event.target;
    if (!target) return;
    if (nav.classList.contains('open') && !nav.contains(target) && !toggle.contains(target)) {
      closeNav();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeNav();
      toggle.focus();
    }
  });
}

if (nav) {
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeNav());
  });
}

if (heroImage) {
  heroImage.addEventListener('error', () => {
    heroImage.remove();
  });
}

if (logoImg) {
  logoImg.addEventListener('error', () => {
    logoImg.remove();
  });
}

const setDecor = enabled => {
  document.body.classList.toggle('decorative-on', enabled);
  if (decorToggle) decorToggle.checked = enabled;
  try {
    localStorage.setItem('statycal-decor', enabled ? 'on' : 'off');
  } catch (error) {
    // storage not available
  }
};

const initialDecorPref = (() => {
  if (document.body.dataset.decorative === 'on') return true;
  if (document.body.dataset.decorative === 'off') return false;
  try {
    return localStorage.getItem('statycal-decor') === 'on';
  } catch (error) {
    return false;
  }
})();

setDecor(initialDecorPref);

if (decorToggle) {
  decorToggle.addEventListener('change', event => {
    setDecor(event.target.checked);
  });
}

const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
  document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
}

const form = document.getElementById('contact-form');

if (form) {
  const honeypot = form.querySelector('input[name=\"website\"]');
  const timestampField = document.getElementById('submittedAt');
  const replyToField = document.getElementById('replytoField');
  const formLoadTime = Date.now();
  const mailtoFallback = form.dataset.mailto || 'mailto:hello@statycal.com?subject=Consultation%20request';
  const endpoint = form.dataset.formEndpoint || form.action;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (honeypot && honeypot.value) return;

    if (Date.now() - formLoadTime < 1000) {
      return;
    }

    const button = form.querySelector('button[type=\"submit\"]');
    if (!button) return;
    const existing = form.querySelector('.form-status');
    if (existing) existing.remove();

    const emailField = form.querySelector('input[name=\"email\"]');
    const nameField = form.querySelector('input[name=\"name\"]');
    const messageField = form.querySelector('textarea[name=\"message\"]');
    const topicField = form.querySelector('select[name=\"topic\"]');
    const emailValid = emailField && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailField.value.trim());
    const nameValid = nameField && nameField.value.trim().length > 1;
    const messageValid = messageField && messageField.value.trim().length > 5;
    const topicValid = topicField && topicField.value.trim().length > 0;

    if (!emailValid || !nameValid || !messageValid || !topicValid) {
      const note = document.createElement('p');
      note.className = 'muted small form-status error';
      note.setAttribute('role', 'status');
      note.textContent = 'Please complete name, a valid work email, topic, and a short message.';
      form.appendChild(note);
      (nameField || emailField || topicField || messageField)?.focus();
      return;
    }

    if (timestampField) timestampField.value = new Date().toISOString();
    if (replyToField && emailField) replyToField.value = emailField.value.trim();

    button.disabled = true;
    button.textContent = 'Sending...';

    const data = new FormData(form);
    let success = false;

    try {
      const response = await fetch(endpoint, {
        method: form.method || 'POST',
        headers: { Accept: 'application/json' },
        body: data
      });
      success = response.ok;
    } catch (error) {
      success = false;
    }

    button.disabled = false;
    button.textContent = 'Send request';

    const note = document.createElement('p');
    note.className = 'muted small form-status';
    note.setAttribute('role', 'status');

    if (success) {
      form.reset();
      note.textContent = 'Request received — we respond within one business day.';
      try {
        const record = Object.fromEntries(data.entries());
        localStorage.setItem('statycal-last-lead', JSON.stringify(record));
      } catch (error) {
        // localStorage unavailable
      }
    } else {
      note.innerHTML = 'We could not submit right now. Please retry or <a class=\"link\" href=\"' + mailtoFallback + '\">email hello@statycal.com</a>.';
      note.classList.add('error');
    }

    form.appendChild(note);
  });
}
