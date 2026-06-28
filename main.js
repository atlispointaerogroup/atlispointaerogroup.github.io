/* =====================================================================
   AtlisPoint Aero Group — main.js
   Shared interactions: nav, scroll progress, reveals (GSAP ScrollTrigger
   with IntersectionObserver fallback), Three.js wireframe aircraft hero,
   card pointer-tilt, and contact form (mailto, no server).
   Honors prefers-reduced-motion: disables 3D + heavy motion, shows poster.
   ===================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 760px)").matches;

  /* ---------- Mobile nav toggle ---------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav__toggle");
    var links = document.querySelector(".nav__links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("open"); });
      });
    }
    function onScroll() {
      if (!nav) return;
      nav.classList.toggle("scrolled", window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Card pointer-tilt + glow tracking ---------- */
  function initCards() {
    if (prefersReduced || isMobile) return;
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
        var rx = (py - 0.5) * -6;
        var ry = (px - 0.5) * 6;
        card.style.transform = "translateY(-4px) perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Reveal animations ---------- */
  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (prefersReduced) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      els.forEach(function (el) {
        window.gsap.fromTo(el,
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" }
          });
        el.style.opacity = "";
      });
      // Line-draw dividers
      window.gsap.utils.toArray(".line-divider").forEach(function (line) {
        window.gsap.fromTo(line, { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 1.1, ease: "power2.out",
            scrollTrigger: { trigger: line, start: "top 90%" } });
      });
    } else {
      // IntersectionObserver fallback
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Contact form (mailto, no server) ---------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var org = (data.get("org") || "").toString().trim();
      var topic = (data.get("topic") || "").toString().trim();
      var message = (data.get("message") || "").toString().trim();
      var subject = "Inquiry" + (topic ? " — " + topic : "") + (org ? " (" + org + ")" : "");
      var bodyLines = [
        "Name: " + name,
        "Email: " + email,
        org ? "Organization: " + org : "",
        topic ? "Interest: " + topic : "",
        "",
        message
      ].filter(Boolean);
      var href = "mailto:info@atlispoint.com?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));
      window.location.href = href;
      var note = form.querySelector(".form-note");
      if (note) { note.textContent = "Opening your email client… if nothing happens, write to info@atlispoint.com directly."; }
    });
  }

  /* ---------- Three.js wireframe aircraft hero ---------- */
  function initHero3D() {
    var canvas = document.getElementById("hero-canvas");
    var poster = document.querySelector(".hero__poster");
    if (!canvas) return;
    if (prefersReduced || !window.THREE) {
      // Show static poster, drop the canvas
      if (poster) poster.style.opacity = "1";
      canvas.style.display = "none";
      return;
    }

    var THREE = window.THREE;
    var renderer, scene, camera, craft, grid, raf, frameId;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    } catch (err) {
      if (poster) poster.style.opacity = "1";
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.4 : 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.4, 9);

    var accent = new THREE.Color(0x39c2ff);

    // ----- Build a low-poly aircraft from primitives -----
    craft = new THREE.Group();
    var lineMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.85 });
    var fillMat = new THREE.MeshBasicMaterial({ color: 0x0e1116, transparent: true, opacity: 0.35 });

    function addWire(geo, sx, sy, sz) {
      var mesh = new THREE.Mesh(geo, fillMat);
      var wire = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 18), lineMat);
      var g = new THREE.Group();
      g.add(mesh); g.add(wire);
      if (sx !== undefined) g.scale.set(sx, sy, sz);
      return g;
    }

    // Fuselage (tapered cylinder along X)
    var fuse = addWire(new THREE.CylinderGeometry(0.55, 0.32, 6.4, 14, 1, false));
    fuse.rotation.z = Math.PI / 2;
    craft.add(fuse);

    // Nose cone
    var nose = addWire(new THREE.ConeGeometry(0.55, 1.3, 14));
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 3.8;
    craft.add(nose);

    // Main wings (thin boxes swept back)
    var wingGeo = new THREE.BoxGeometry(2.0, 0.08, 4.6);
    var wingL = addWire(wingGeo); wingL.position.set(-0.2, -0.1, 0);
    craft.add(wingL);

    // Tail vertical stabilizer
    var vstab = addWire(new THREE.BoxGeometry(1.1, 1.2, 0.08));
    vstab.position.set(-2.7, 0.7, 0);
    craft.add(vstab);

    // Horizontal stabilizers
    var hstab = addWire(new THREE.BoxGeometry(1.1, 0.07, 2.2));
    hstab.position.set(-2.8, 0, 0);
    craft.add(hstab);

    // Engines under wings
    [-1.5, 1.5].forEach(function (z) {
      var eng = addWire(new THREE.CylinderGeometry(0.26, 0.22, 1.3, 10));
      eng.rotation.z = Math.PI / 2;
      eng.position.set(0.1, -0.5, z);
      craft.add(eng);
    });

    craft.scale.set(0.92, 0.92, 0.92);
    craft.rotation.x = 0.12;
    craft.position.x = -0.4;
    scene.add(craft);

    // ----- Blueprint particle grid behind ----
    var dotGeo = new THREE.BufferGeometry();
    var count = isMobile ? 220 : 460;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = -6 - Math.random() * 10;
    }
    dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    grid = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: accent, size: 0.04, transparent: true, opacity: 0.5 }));
    scene.add(grid);

    var glow = new THREE.PointLight(0x39c2ff, 1, 50);
    glow.position.set(4, 3, 6);
    scene.add(glow);

    // ----- Resize -----
    function resize() {
      var w = canvas.clientWidth || canvas.parentElement.clientWidth;
      var h = canvas.clientHeight || canvas.parentElement.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    // ----- Mouse parallax -----
    var targetRotY = 0, targetRotX = 0.12;
    if (!isMobile) {
      window.addEventListener("pointermove", function (e) {
        var nx = (e.clientX / window.innerWidth) - 0.5;
        var ny = (e.clientY / window.innerHeight) - 0.5;
        targetRotY = nx * 0.5;
        targetRotX = 0.12 + ny * 0.25;
      });
    }

    var running = true;
    var clock = new THREE.Clock();
    function animate() {
      if (!running) return;
      frameId = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      craft.rotation.y += 0.0026;
      craft.rotation.y += (targetRotY - (craft.rotation.y % (Math.PI * 2)) * 0) * 0; // keep auto-rotate dominant
      craft.position.y = Math.sin(t * 0.6) * 0.12;
      // subtle parallax blend on x tilt
      craft.rotation.x += (targetRotX - craft.rotation.x) * 0.04;
      grid.rotation.y = t * 0.02;
      renderer.render(scene, camera);
    }
    animate();

    // Pause when offscreen / tab hidden (perf + battery)
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { clock.start(); animate(); }
      else if (frameId) cancelAnimationFrame(frameId);
    });
    var hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      var hio = new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; clock.start(); animate(); }
        if (!vis && running) { running = false; if (frameId) cancelAnimationFrame(frameId); }
      }, { threshold: 0.01 });
      hio.observe(hero);
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    initNav();
    initProgress();
    initReveals();
    initCards();
    initContactForm();
    // Lazy-init 3D after first paint so it never blocks load
    if ("requestIdleCallback" in window) {
      requestIdleCallback(initHero3D, { timeout: 1500 });
    } else {
      setTimeout(initHero3D, 200);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
