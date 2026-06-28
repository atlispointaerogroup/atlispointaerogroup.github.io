/* =====================================================================
   AtlisPoint Aero Group — main.js (v2)
   Shared interactions + a bold, clearly-visible wireframe aircraft hero.
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
    function onScroll() { if (nav) nav.classList.toggle("scrolled", window.scrollY > 24); }
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
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
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
        card.style.transform = "translateY(-4px) perspective(800px) rotateX(" + ((py - 0.5) * -6) + "deg) rotateY(" + ((px - 0.5) * 6) + "deg)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Reveal animations ---------- */
  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (prefersReduced) { els.forEach(function (el) { el.classList.add("is-visible"); }); return; }
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      els.forEach(function (el) {
        window.gsap.fromTo(el, { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" } });
        el.style.opacity = "";
      });
      window.gsap.utils.toArray(".line-divider").forEach(function (line) {
        window.gsap.fromTo(line, { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 1.1, ease: "power2.out", scrollTrigger: { trigger: line, start: "top 90%" } });
      });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
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
      var get = function (k) { return (data.get(k) || "").toString().trim(); };
      var name = get("name"), email = get("email"), org = get("org"), topic = get("topic"), message = get("message");
      var subject = "Inquiry" + (topic ? " \u2014 " + topic : "") + (org ? " (" + org + ")" : "");
      var bodyLines = ["Name: " + name, "Email: " + email, org ? "Organization: " + org : "", topic ? "Interest: " + topic : "", "", message].filter(Boolean);
      window.location.href = "mailto:info@atlispoint.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyLines.join("\n"));
      var note = form.querySelector(".form-note");
      if (note) note.textContent = "Opening your email client\u2026 if nothing happens, write to info@atlispoint.com directly.";
    });
  }

  /* ---------- Three.js wireframe aircraft hero (bold + glowing) ---------- */
  function initHero3D() {
    var canvas = document.getElementById("hero-canvas");
    var poster = document.querySelector(".hero__poster");
    if (!canvas) return;
    if (prefersReduced || !window.THREE) {
      if (poster) poster.style.opacity = "1";
      canvas.style.display = "none";
      return;
    }
    var THREE = window.THREE, renderer, scene, camera, craft, grid, frameId;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (err) {
      if (poster) poster.style.opacity = "1";
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.6, 11);
    camera.lookAt(0, 0, 0);

    var accent = new THREE.Color(0x39c2ff);
    var accentBright = new THREE.Color(0x8fe0ff);

    craft = new THREE.Group();
    // Bright additive glowing lines so the aircraft clearly reads on dark
    var lineMat = new THREE.LineBasicMaterial({ color: accentBright, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending });
    var lineMat2 = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    var fillMat = new THREE.MeshBasicMaterial({ color: 0x0c1622, transparent: true, opacity: 0.55 });

    function addWire(geo) {
      var g = new THREE.Group();
      g.add(new THREE.Mesh(geo, fillMat));
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 22), lineMat));
      return g;
    }

    var fuse = addWire(new THREE.CylinderGeometry(0.62, 0.34, 7.0, 16, 1, false));
    fuse.rotation.z = Math.PI / 2; craft.add(fuse);

    var nose = addWire(new THREE.ConeGeometry(0.62, 1.5, 16));
    nose.rotation.z = -Math.PI / 2; nose.position.x = 4.2; craft.add(nose);

    var tailcone = addWire(new THREE.ConeGeometry(0.34, 1.1, 14));
    tailcone.rotation.z = Math.PI / 2; tailcone.position.x = -4.05; craft.add(tailcone);

    var wing = addWire(new THREE.BoxGeometry(2.3, 0.09, 5.6));
    wing.position.set(-0.1, -0.12, 0); craft.add(wing);

    var vstab = addWire(new THREE.BoxGeometry(1.35, 1.5, 0.09));
    vstab.position.set(-3.05, 0.85, 0); craft.add(vstab);

    var hstab = addWire(new THREE.BoxGeometry(1.25, 0.08, 2.7));
    hstab.position.set(-3.15, 0.05, 0); craft.add(hstab);

    [-1.9, 1.9].forEach(function (z) {
      var eng = addWire(new THREE.CylinderGeometry(0.3, 0.26, 1.5, 12));
      eng.rotation.z = Math.PI / 2; eng.position.set(0.0, -0.55, z); craft.add(eng);
    });

    craft.scale.set(1.18, 1.18, 1.18);
    craft.rotation.x = 0.16;
    craft.rotation.y = -0.5;
    craft.position.set(0.6, 0.2, 0);
    scene.add(craft);

    // Glowing halo behind the aircraft
    var halo = new THREE.Mesh(
      new THREE.CircleGeometry(5.2, 48),
      new THREE.MeshBasicMaterial({ color: 0x123247, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })
    );
    halo.position.set(0.6, 0.2, -3.5); scene.add(halo);

    // Particle field
    var count = isMobile ? 260 : 520;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = -5 - Math.random() * 12;
    }
    var dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    grid = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: accent, size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending }));
    scene.add(grid);

    function resize() {
      var w = canvas.clientWidth || canvas.parentElement.clientWidth;
      var h = canvas.clientHeight || canvas.parentElement.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      // On phones the plane sits a touch higher/centered
      craft.position.x = w < 760 ? 0.0 : 0.6;
    }
    window.addEventListener("resize", resize); resize();

    var targetRotX = 0.16;
    if (!isMobile) {
      window.addEventListener("pointermove", function (e) {
        targetRotX = 0.16 + ((e.clientY / window.innerHeight) - 0.5) * 0.3;
      });
    }

    var running = true, clock = new THREE.Clock();
    function animate() {
      if (!running) return;
      frameId = requestAnimationFrame(animate);
      var t = clock.getElapsedTime();
      craft.rotation.y += 0.0035;
      craft.rotation.x += (targetRotX - craft.rotation.x) * 0.05;
      craft.position.y = 0.2 + Math.sin(t * 0.6) * 0.16;
      grid.rotation.y = t * 0.02;
      halo.material.opacity = 0.30 + Math.sin(t * 0.8) * 0.08;
      renderer.render(scene, camera);
    }
    animate();

    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { clock.start(); animate(); } else if (frameId) cancelAnimationFrame(frameId);
    });
    var hero = document.querySelector(".hero");
    if (hero && "IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        var vis = en[0].isIntersecting;
        if (vis && !running) { running = true; clock.start(); animate(); }
        if (!vis && running) { running = false; if (frameId) cancelAnimationFrame(frameId); }
      }, { threshold: 0.01 }).observe(hero);
    }
  }

  function boot() {
    initNav(); initProgress(); initReveals(); initCards(); initContactForm();
    if ("requestIdleCallback" in window) { requestIdleCallback(initHero3D, { timeout: 1500 }); }
    else { setTimeout(initHero3D, 200); }
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", boot); }
  else { boot(); }
})();
