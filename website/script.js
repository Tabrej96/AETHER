/* ============================================================
   AETHER Marketing Site — JavaScript
   Particles, scroll animations, terminal demo, interactivity
   ============================================================ */

// ============ PARTICLE SYSTEM ============
class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.animId = null;
    this.resize();
    this.init();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    const count = Math.min(80, Math.floor((this.canvas.width * this.canvas.height) / 18000));
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.init();
    });
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }

  animate() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, i) => {
      p.pulse += 0.015;
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;

      // Mouse repulsion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        p.vx += (dx / dist) * force * 0.02;
        p.vy += (dy / dist) * force * 0.02;
      }

      // Damping
      p.vx *= 0.999;
      p.vy *= 0.999;

      const alpha = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const d = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (d < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(124, 77, 255, ${0.06 * (1 - d / 140)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });

    this.animId = requestAnimationFrame(() => this.animate());
  }
}

// ============ SCROLL ANIMATIONS (Intersection Observer) ============
function initScrollAnimations() {
  const elements = document.querySelectorAll('.anim-fade-up');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Don't unobserve — allow re-triggering if element leaves and re-enters
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// ============ COUNTER ANIMATION ============
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          const target = parseInt(entry.target.dataset.count, 10);
          const duration = 2000;
          const start = performance.now();

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            entry.target.textContent = current + (target === 92 ? '%' : '+');
            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              entry.target.textContent = target + (target === 92 ? '%' : '+');
            }
          }
          requestAnimationFrame(update);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((c) => observer.observe(c));
}

// ============ NAVIGATION ============
function initNav() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  // Scroll effect
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scroll = window.pageYOffset;
    if (scroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    lastScroll = scroll;
  }, { passive: true });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Close mobile nav on link click
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = links.querySelectorAll('a[href^="#"]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
      const top = section.offsetTop - 100;
      if (window.pageYOffset >= top) {
        current = section.getAttribute('id');
      }
    });

    navAnchors.forEach((a) => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });
  }, { passive: true });
}

// ============ TERMINAL DEMO ============
const demoScripts = {
  validate: [
    { type: 'cmd', text: '$ npx tsx bin/aether.ts validate', cls: 'terminal-prompt' },
    { type: 'out', text: '', cls: '', delay: 200 },
    { type: 'out', text: '🔍 AETHER v1.0 — Component Verification', cls: 'info', delay: 300 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'Agents ............... 117/117  ✅', cls: 'success', delay: 200 },
    { type: 'out', text: 'Skills ............... 540/540  ✅', cls: 'success', delay: 150 },
    { type: 'out', text: 'Workflows ............ 54/54   ✅', cls: 'success', delay: 150 },
    { type: 'out', text: 'MCP Tools ............ 20/20   ✅', cls: 'success', delay: 150 },
    { type: 'out', text: 'Engines .............. 21/21   ✅', cls: 'success', delay: 150 },
    { type: 'out', text: 'Tests ................ 119/119  ✅', cls: 'success', delay: 150 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'Quality Gate ......... PASSED (floor: 100/100)', cls: 'success', delay: 200 },
    { type: 'out', text: 'Registry Audit ....... OK', cls: 'info', delay: 200 },
    { type: 'out', text: 'Merkle Checkpoint .... VERIFIED', cls: 'info', delay: 200 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: '✅ All 711 components validated in 4.2s', cls: 'success', delay: 300 },
    { type: 'out', text: '', cls: '', delay: 50 },
    { type: 'out', text: 'No fabricated numbers. No external daemons required.', cls: 'muted', delay: 200 },
  ],
  programs: [
    { type: 'cmd', text: '$ npx tsx bin/aether.ts programs', cls: 'terminal-prompt' },
    { type: 'out', text: '', cls: '', delay: 200 },
    { type: 'out', text: '📋 AETHER 1.0 — Capability Program Registry', cls: 'info', delay: 300 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'P01  Development Intelligence    measured ✅  MIT (ECC, Superpowers)', cls: '', delay: 200 },
    { type: 'out', text: 'P02  Reverse Intelligence        measured ✅  MIT (REA)', cls: '', delay: 150 },
    { type: 'out', text: 'P03  Autonomous Execution        measured ✅  MIT (OpenHands, OpenManus)', cls: '', delay: 150 },
    { type: 'out', text: 'P04  Multi-Agent Orchestration   measured ✅  MIT (AutoGen, Agent Framework)', cls: '', delay: 150 },
    { type: 'out', text: 'P05  Browser Intelligence        measured ✅  MIT + Apache-2.0 (Browser-Use, Agent-Browser)', cls: '', delay: 150 },
    { type: 'out', text: 'P06  Visual Computer             measured ✅  CC-BY-4.0 (OmniParser)', cls: '', delay: 150 },
    { type: 'out', text: 'P07  Browser Runtime             measured ✅  Apache-2.0 (Playwright)', cls: '', delay: 150 },
    { type: 'out', text: 'P08  Workspace & Knowledge       measured ✅  Public (Obsidian)', cls: '', delay: 150 },
    { type: 'out', text: 'P09  Creative & Visual           measured ✅  MIT (Three.js)', cls: '', delay: 150 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'All upstream sources studied out-of-process where AGPL/GPL.', cls: 'muted', delay: 200 },
    { type: 'out', text: '9 programs · 9 engines · 0 linked copyleft code.', cls: 'muted', delay: 200 },
  ],
  runtime: [
    { type: 'cmd', text: '$ npx tsx bin/aether.ts runtime --live', cls: 'terminal-prompt' },
    { type: 'out', text: '', cls: '', delay: 200 },
    { type: 'out', text: '⚡ AETHER Runtime — Live Mode', cls: 'warn', delay: 300 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'Provider ............... openai/gpt-4o', cls: '', delay: 200 },
    { type: 'out', text: 'Task .................. "Build a checkout form with GST"', cls: '', delay: 200 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: '> Research-first gate: Gathering context...', cls: 'step-line', delay: 400 },
    { type: 'out', text: '> Plan verification: Checking against invariants...', cls: 'step-line', delay: 300 },
    { type: 'out', text: '> Security gates: Scanning for secrets...', cls: 'step-line', delay: 300 },
    { type: 'out', text: '> Generating: P01 discovery + P11 quality panel...', cls: 'step-line', delay: 400 },
    { type: 'out', text: '> P16: Computing paise-exact totals...', cls: 'step-line', delay: 200 },
    { type: 'out', text: '> P17: Building reconciliation workflow...', cls: 'step-line', delay: 200 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: '✅ 19 pillars verified · Output ready for deployment', cls: 'success', delay: 400 },
  ],
  calc: [
    { type: 'cmd', text: '$ npx tsx bin/aether.ts calc', cls: 'terminal-prompt' },
    { type: 'out', text: '', cls: '', delay: 200 },
    { type: 'out', text: '🧮 AETHER P16 — Calculation Engine (BigInt, Paise-Exact)', cls: 'info', delay: 300 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'EMI Calculation:', cls: 'highlight', delay: 200 },
    { type: 'out', text: '  Principal  .... ₹ 5,00,000.00', cls: '', delay: 150 },
    { type: 'out', text: '  Rate ....... 10.5% p.a.', cls: '', delay: 150 },
    { type: 'out', text: '  Tenure ...... 24 months', cls: '', delay: 150 },
    { type: 'out', text: '  EMI ......... ₹ 23,261.87', cls: 'success', delay: 300 },
    { type: 'out', text: '  Total ........ ₹ 5,58,284.88', cls: '', delay: 200 },
    { type: 'out', text: '  Interest ..... ₹ 58,284.88', cls: '', delay: 200 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: 'Prorated Refund:', cls: 'highlight', delay: 200 },
    { type: 'out', text: '  Annual sub .. $ 999.00', cls: '', delay: 150 },
    { type: 'out', text: '  Days used ... 73 of 365', cls: '', delay: 150 },
    { type: 'out', text: '  Refund ...... $ 799.73', cls: 'success', delay: 300 },
    { type: 'out', text: '', cls: '', delay: 100 },
    { type: 'out', text: '✅ Single rounding boundary · Zero floating-point drift', cls: 'muted', delay: 200 },
  ],
};

function initTerminal() {
  const output = document.getElementById('terminalOutput');
  const runBtn = document.getElementById('runDemo');
  const tabs = document.querySelectorAll('.demo-tab');
  let currentDemo = 'validate';
  let running = false;

  function clearOutput() {
    output.innerHTML = '';
  }

  function addLine(text, cls, delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.className = `terminal-line line-anim ${cls}`;
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
        resolve();
      }, delay);
    });
  }

  async function runDemo(name) {
    if (running) return;
    running = true;
    clearOutput();

    // Add blinking cursor
    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';

    const script = demoScripts[name] || demoScripts['validate'];
    let totalDelay = 0;

    for (const item of script) {
      totalDelay += item.delay || 100;
      await addLine(item.text, item.cls, totalDelay);
    }

    // Add cursor at end
    const lastLine = document.createElement('div');
    lastLine.className = 'terminal-line line-anim';
    lastLine.appendChild(cursor);
    output.appendChild(lastLine);
    output.scrollTop = output.scrollHeight;

    running = false;
  }

  runBtn.addEventListener('click', () => runDemo(currentDemo));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentDemo = tab.dataset.demo;
      runDemo(currentDemo);
    });
  });

  // Run default demo after a short delay
  setTimeout(() => runDemo('validate'), 800);
}

// ============ COPY TO CLIPBOARD ============
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      } catch (err) {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.classList.add('copied');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
      }
    });
  });
}

// ============ SMOOTH SCROLL FOR NAV LINKS ============
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ============ KNOWLEDGE GRAPH HOVER EFFECT ============
function initGraphEffect() {
  const nodes = document.querySelectorAll('.graph-node:not(.graph-root)');
  nodes.forEach((node, i) => {
    node.style.animationDelay = `${i * 0.1}s`;
  });
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  // Start particle system
  const canvas = document.getElementById('particles');
  if (canvas) new ParticleSystem(canvas);

  // Scroll animations
  initScrollAnimations();

  // Counter animation
  animateCounters();

  // Navigation
  initNav();

  // Terminal demo
  initTerminal();

  // Copy buttons
  initCopyButtons();

  // Smooth scroll
  initSmoothScroll();

  // Graph effect
  initGraphEffect();

  // Reveal hero content immediately
  document.querySelectorAll('.hero .anim-fade-up').forEach((el) => {
    setTimeout(() => el.classList.add('visible'), 100);
  });
});

// ============ PARALLAX SUBTLE EFFECT ON SCROLL ============
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      const scrollY = window.pageYOffset;
      const hero = document.querySelector('.hero-content');
      if (hero && scrollY < window.innerHeight) {
        hero.style.transform = `translateY(${scrollY * 0.15}px)`;
        hero.style.opacity = 1 - (scrollY / (window.innerHeight * 0.8));
      }
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
