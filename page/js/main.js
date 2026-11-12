// =========================================================
// ARGENT A1 Alloy — Landing Page Script
// =========================================================
(() => {
  const PRICE = 249000;
  const TOTAL_STOCK = 1000;
  const DEADLINE = new Date("2026-12-01T23:59:59+09:00");
  const STORAGE_KEY = "argent-preorders";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const won = (n) => n.toLocaleString("ko-KR") + "원";

  /* ---------- Nav: 스크롤 배경 + 모바일 메뉴 ---------- */
  const nav = $("#nav");
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  const stickyCta = $("#stickyCta");
  const preorderSection = $("#preorder");

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);

    // 모바일 하단 CTA: 히어로 지나면 노출, 사전예약 섹션에서는 숨김
    const preTop = preorderSection.getBoundingClientRect().top;
    stickyCta.classList.toggle("is-visible", y > window.innerHeight * 0.8 && preTop > window.innerHeight * 0.6);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open);
  });
  $$("a", navMenu).forEach((a) =>
    a.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  // 같은 부모 안의 요소는 순차적으로 등장
  $$(".reveal").forEach((el) => {
    const siblings = $$(":scope > .reveal", el.parentElement);
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 90}ms`;
    io.observe(el);
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 숫자 카운트업 ---------- */
  // data-count="목표값" data-decimals="소수 자릿수(선택)"
  const counters = $$("[data-count]");
  const formatNum = (n, decimals) =>
    n.toLocaleString("ko-KR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = formatNum(target * easeOutExpo(t), decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!reduceMotion) {
    counters.forEach((el) => (el.textContent = formatNum(0, Number(el.dataset.decimals || 0))));
    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // reveal 페이드인과 겹치도록 살짝 늦게 시작
          setTimeout(() => runCounter(entry.target), 250);
          countIO.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countIO.observe(el));
  }

  /* ---------- Lifestyle 패럴랙스 ---------- */
  const lifeBg = $(".lifestyle__bg");
  if (lifeBg && !reduceMotion) {
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = lifeBg.parentElement.getBoundingClientRect();
        const progress = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
        lifeBg.style.transform = `translateY(${progress * -60}px)`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Hotspot (터치 기기에서 탭으로 토글) ---------- */
  $$(".hotspot").forEach((spot) =>
    spot.addEventListener("click", () => {
      $$(".hotspot").forEach((s) => s !== spot && s.classList.remove("is-active"));
      spot.classList.toggle("is-active");
    })
  );

  /* ---------- Countdown ---------- */
  const cd = {
    days: $('[data-unit="days"]'),
    hours: $('[data-unit="hours"]'),
    minutes: $('[data-unit="minutes"]'),
    seconds: $('[data-unit="seconds"]'),
  };
  const pad = (n) => String(n).padStart(2, "0");
  const tick = () => {
    let diff = Math.max(0, DEADLINE - Date.now());
    const s = Math.floor(diff / 1000);
    cd.days.textContent = pad(Math.floor(s / 86400));
    cd.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    cd.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    cd.seconds.textContent = pad(s % 60);
  };
  tick();
  setInterval(tick, 1000);

  /* ---------- 저장된 예약 & 남은 수량 ---------- */
  const loadOrders = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  };
  const saveOrders = (orders) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { /* 무시 */ }
  };

  const BASE_SOLD = 827; // 가상의 기존 예약 수
  const stockLeftEl = $("#stockLeft");
  const stockFill = $("#stockFill");
  const renderStock = () => {
    const mine = loadOrders().reduce((sum, o) => sum + o.qty, 0);
    const sold = Math.min(TOTAL_STOCK, BASE_SOLD + mine);
    stockLeftEl.textContent = (TOTAL_STOCK - sold).toLocaleString("ko-KR");
    stockFill.style.width = `${(sold / TOTAL_STOCK) * 100}%`;
  };
  // 섹션이 보일 때 게이지 애니메이션
  new IntersectionObserver(([e], obs) => {
    if (e.isIntersecting) { renderStock(); obs.disconnect(); }
  }, { threshold: 0.3 }).observe($(".stock"));

  /* ---------- 수량 & 합계 ---------- */
  const qtyInput = $("#qty");
  const totalPrice = $("#totalPrice");
  const updateTotal = () => (totalPrice.textContent = won(PRICE * Number(qtyInput.value)));
  $$(".qty__btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = Number(qtyInput.value) + Number(btn.dataset.step);
      qtyInput.value = Math.min(Number(qtyInput.max), Math.max(Number(qtyInput.min), next));
      updateTotal();
    })
  );

  /* ---------- 휴대폰 번호 자동 하이픈 ---------- */
  const phone = $("#phone");
  phone.addEventListener("input", () => {
    const d = phone.value.replace(/\D/g, "").slice(0, 11);
    phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  });

  /* ---------- 폼 검증 & 제출 ---------- */
  const form = $("#preorderForm");
  const rules = {
    name: (v) => (v.trim().length >= 2 ? "" : "이름을 2자 이상 입력해주세요."),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "올바른 이메일 주소를 입력해주세요."),
    phone: (v) => (/^01[016789]-\d{3,4}-\d{4}$/.test(v) ? "" : "휴대폰 번호를 정확히 입력해주세요."),
    agree: (_, el) => (el.checked ? "" : "개인정보 수집 및 이용에 동의해주세요."),
  };

  const validateField = (name) => {
    const el = form.elements[name];
    const field = el.closest(".field");
    const msg = rules[name](el.value, el);
    field.classList.toggle("is-invalid", !!msg);
    $(".field__error", field).textContent = msg;
    return !msg;
  };

  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    el.addEventListener(el.type === "checkbox" ? "change" : "blur", () => validateField(name));
    el.addEventListener("input", () => {
      if (el.closest(".field").classList.contains("is-invalid")) validateField(name);
    });
  });

  const modal = $("#modal");
  const openModal = (html) => {
    $("#modalBody").innerHTML = html;
    modal.hidden = false;
    $("#modalClose").focus();
    document.body.style.overflow = "hidden";
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = "";
  };
  $("#modalClose").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => e.target === modal && closeModal());
  document.addEventListener("keydown", (e) => e.key === "Escape" && !modal.hidden && closeModal());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      $(".is-invalid input", form)?.focus();
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const orders = loadOrders();
    if (orders.some((o) => o.email === data.email)) {
      const field = form.elements.email.closest(".field");
      field.classList.add("is-invalid");
      $(".field__error", field).textContent = "이미 이 이메일로 사전예약하셨어요.";
      form.elements.email.focus();
      return;
    }

    const order = {
      no: "AG-" + Date.now().toString().slice(-8),
      name: data.name.trim(),
      email: data.email,
      phone: data.phone,
      color: data.color,
      switch: data.switch,
      qty: Number(data.qty),
      marketing: !!data.marketing,
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    saveOrders(orders);
    renderStock();

    const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    openModal(
      `<strong>${esc(order.name)}</strong>님, 감사합니다.<br />
       예약번호 <strong>${order.no}</strong><br />
       ${esc(order.color)} · ${esc(order.switch)} · ${order.qty}대 (${won(PRICE * order.qty)})<br /><br />
       출시 전 결제 안내를 문자로 보내드릴게요.`
    );

    form.reset();
    updateTotal();
  });
})();
