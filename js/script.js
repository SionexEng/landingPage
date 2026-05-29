
// ── HERO CAROUSEL ──────────────────────────────
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
let current = 0;

function goToSlide(n) {
  slides[current].classList.remove('active');
  dots[current].classList.remove('active');
  current = (n + slides.length) % slides.length;
  slides[current].classList.add('active');
  dots[current].classList.add('active');
}

setInterval(() => goToSlide(current + 1), 5500);

// ── HEADER SCROLL ──────────────────────────────
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── MOBILE MENU ────────────────────────────────
const hamburger = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
function setMobileMenu(open) {
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  mobileMenu.setAttribute('aria-hidden', String(!open));
}

hamburger.addEventListener('click', () => setMobileMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMobileMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    setMobileMenu(false);
    hamburger.focus();
  }
});

// ── SCROLL REVEAL ──────────────────────────────
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revObs.observe(el));

// ── PROJECT FILTER ─────────────────────────────
function filterProjects(cat, btn) {
  // Update buttons
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const cards = document.querySelectorAll('.project-card');
  cards.forEach((card, i) => {
    const match = cat === 'all' ? card.dataset.featured === 'true' : card.dataset.cat === cat;
    if (match) {
      card.classList.remove('hidden');
      setTimeout(() => card.classList.add('fade-in'), i * 40);
      setTimeout(() => card.classList.remove('fade-in'), i * 40 + 450);
    } else {
      card.classList.add('hidden');
    }
  });
}

// ── PHONE MASK ─────────────────────────────────
const telInput = document.getElementById('f-tel');
if (telInput) {
  telInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = '(' + v.slice(0,2) + ') ' + v.slice(2,7) + '-' + v.slice(7);
    else if (v.length > 2) v = '(' + v.slice(0,2) + ') ' + v.slice(2);
    else if (v.length > 0) v = '(' + v;
    e.target.value = v;
  });
}

// ── NOTIFICATION ───────────────────────────────
function showNotification(msg, type = 'success') {
  const n = document.getElementById('notification');
  const t = document.getElementById('notification-text');
  t.textContent = msg;
  n.style.borderColor = type === 'success' ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)';
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 4500);
}

// ── FORM SUBMIT ────────────────────────────────
document.getElementById('contact-form').addEventListener('submit', async e => {
  e.preventDefault();

  const nome    = document.getElementById('f-nome').value.trim();
  const email   = document.getElementById('f-email').value.trim();
  const tel     = document.getElementById('f-tel').value.trim();
  const servico = document.getElementById('f-servico').value;
  const msg     = document.getElementById('f-msg').value.trim();
  const honey   = document.getElementById('f-honey').value;

  // Proteção honeypot: bot preencheu o campo oculto
  if (honey) return;

  // Validações
  if (!nome || !email || !tel || !servico) {
    showNotification('Preencha todos os campos obrigatórios (*).', 'error'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showNotification('Email inválido. Verifique e tente novamente.', 'error'); return;
  }

  const btn = document.getElementById('submit-btn');
  document.getElementById('btn-text').style.display = 'none';
  document.getElementById('btn-loading').style.display = 'inline';
  btn.disabled = true;

  // Data e hora do envio (horário de Brasília)
  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Corpo do e-mail estruturado — chegará formatado em tabela no formsubmit
  const fd = new FormData();

  // Campos que aparecem como linhas na tabela do e-mail
  fd.append('Nome Completo',      nome);
  fd.append('E-mail do Cliente',  email);
  fd.append('Telefone',           tel);
  fd.append('Serviço Solicitado', servico);
  fd.append('Detalhes do Projeto', msg || '(não informado)');
  fd.append('Data e Hora',        agora);

  // Metadados do formsubmit (prefixados com _)
  fd.append('_replyto',       email);                                        // responder direto ao cliente
  fd.append('_subject',       `[Orçamento Sionex] ${servico} — ${nome}`);   // assunto claro na caixa de entrada
  fd.append('_template',      'table');                                      // corpo em tabela HTML formatada
  fd.append('_autoresponse',
    `Olá, ${nome}! Recebemos sua solicitação de orçamento para "${servico}". ` +
    `Nossa equipe técnica entrará em contato em até 24 horas. Obrigado por escolher a Sionex!`
  );
  fd.append('_captcha', 'false'); // desativa reCAPTCHA (pode reativar em produção)

  try {
    const resp = await fetch('https://formsubmit.co/ajax/contato@sionex.com.br', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: fd
    });

    if (resp.ok) {
      showNotification('Orçamento enviado! Entraremos em contato em breve.', 'success');
      e.target.reset();
    } else {
      throw new Error('Resposta não-ok: ' + resp.status);
    }
  } catch {
    showNotification('Erro ao enviar. Tente pelo WhatsApp: (11) 92046-8265', 'error');
  }

  document.getElementById('btn-text').style.display = 'inline';
  document.getElementById('btn-loading').style.display = 'none';
  btn.disabled = false;
});

// ── SMOOTH SCROLL ──────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 75, behavior: 'smooth' });
    }
  });
});

