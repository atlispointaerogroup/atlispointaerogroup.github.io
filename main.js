/* =========================================================
   AtlisPoint Aero Group — main.js (v3)
   Shared interactions + a realistic 3D globe hero with
   animated great-circle flight routes and moving aircraft.
   Honors prefers-reduced-motion: disables 3D + heavy motion,
   shows a static poster instead.
   ========================================================= */
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
    if (nav) {
      var onScroll = function () {
        if (window.scrollY > 24) nav.classList.add("nav--scrolled");
        else nav.classList.remove("nav--scrolled");
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (h.scrollTop / max) : 0;
      bar.style.transform = "scaleX(" + p + ")";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------- Pointer-tilt on cards ---------- */
  function initCards() {
    if (prefersReduced || isMobile) return;
    var cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + (x * 5).toFixed(2) + "deg) rotateX(" + (-y * 5).toFixed(2) + "deg) translateY(-3px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Contact form (mailto, no backend) ---------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var msg = (data.get("message") || "").toString().trim();
      var subject = encodeURIComponent("Inquiry from " + (name || "website"));
      var body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\n" + msg);
      var note = form.querySelector(".form-note");
      if (note) { note.textContent = "Opening your email client\u2026"; note.classList.add("show"); }
      window.location.href = "mailto:info@atlispoint.com?subject=" + subject + "&body=" + body;
    });
  }

  /* ---------- Hero: realistic 3D globe with flight routes ---------- */
  function initHero3D() {
    var canvas = document.getElementById("hero-canvas");
    var hero = document.querySelector(".hero");
    if (!canvas) return;

    // Graceful degradation: no 3D for reduced-motion or missing WebGL/THREE.
    if (prefersReduced || typeof THREE === "undefined") {
      canvas.style.display = "none";
      var poster = document.querySelector(".hero__poster");
      if (poster) poster.classList.add("show");
      return;
    }

    var scene = new THREE.Scene();
    var W = canvas.clientWidth || hero.clientWidth;
    var H = canvas.clientHeight || hero.clientHeight;
    var camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.4, 7.4);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (err) {
      canvas.style.display = "none";
      var p2 = document.querySelector(".hero__poster");
      if (p2) p2.classList.add("show");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);

    var GLOBE_R = 2.05;
    var root = new THREE.Group();
    scene.add(root);
    var globe = new THREE.Group();
    root.add(globe);

    // Lighting for a realistic shaded sphere
    var ambient = new THREE.AmbientLight(0x35506e, 0.55);
    scene.add(ambient);
    var key = new THREE.DirectionalLight(0xbfdcff, 1.15);
    key.position.set(-4, 3, 5);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x2a6cff, 0.7);
    rim.position.set(5, -2, -3);
    scene.add(rim);

    // Ocean sphere — deep, slightly metallic, realistic
    var ocean = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0c2238, roughness: 0.78, metalness: 0.22,
        emissive: 0x06121f, emissiveIntensity: 1.0
      })
    );
    globe.add(ocean);

    // Subtle latitude/longitude graticule (thin, low opacity — not blueprint-y)
    var grat = new THREE.Group();
    var gratMat = new THREE.LineBasicMaterial({ color: 0x3f6f9c, transparent: true, opacity: 0.22 });
    for (var la = -60; la <= 60; la += 30) {
      var pts = [];
      var rr = GLOBE_R * Math.cos(la * Math.PI / 180) * 1.002;
      var yy = GLOBE_R * Math.sin(la * Math.PI / 180) * 1.002;
      for (var t = 0; t <= 64; t++) {
        var a = (t / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(rr * Math.cos(a), yy, rr * Math.sin(a)));
      }
      grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat));
    }
    for (var lo = 0; lo < 180; lo += 30) {
      var pts2 = [];
      for (var t2 = 0; t2 <= 64; t2++) {
        var ph = (t2 / 64) * Math.PI * 2;
        var x = GLOBE_R * 1.002 * Math.sin(ph) * Math.cos(lo * Math.PI / 180);
        var z = GLOBE_R * 1.002 * Math.sin(ph) * Math.sin(lo * Math.PI / 180);
        var y2 = GLOBE_R * 1.002 * Math.cos(ph);
        pts2.push(new THREE.Vector3(x, y2, z));
      }
      grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gratMat));
    }
    globe.add(grat);

    // Atmosphere glow
    var atmo = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R * 1.045, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x4ea3ff, transparent: true, opacity: 0.06, side: THREE.BackSide })
    );
    globe.add(atmo);

    // Land scatter: cluster small points to suggest continents (no fake model)
    function latLonToVec(lat, lon, r) {
      var phi = (90 - lat) * Math.PI / 180;
      var theta = (lon + 180) * Math.PI / 180;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    var landBoxes = [
      [10, 50, -100, -60], [-10, 12, -75, -40], [35, 70, -10, 40],
      [0, 35, 8, 50], [5, 55, 60, 130], [-40, -12, 112, 152]
    ];
    var landPos = [];
    for (var i = 0; i < 2600; i++) {
      var b = landBoxes[i % landBoxes.length];
      var lat = b[0] + Math.random() * (b[1] - b[0]);
      var lon = b[2] + Math.random() * (b[3] - b[2]);
      var v = latLonToVec(lat, lon, GLOBE_R * 1.004);
      landPos.push(v.x, v.y, v.z);
    }
    var landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute("position", new THREE.Float32BufferAttribute(landPos, 3));
    var land = new THREE.Points(landGeo, new THREE.PointsMaterial({
      color: 0x6fd2ff, size: 0.028, transparent: true, opacity: 0.85, sizeAttenuation: true
    }));
    globe.add(land);

    // Flight routes: great-circle arcs lifting off the surface + moving planes
    var cities = [
      [40.7, -74.0], [51.5, -0.1], [25.2, 55.3], [1.35, 103.8],
      [-33.9, 151.2], [35.7, 139.7], [-23.5, -46.6], [19.4, -99.1],
      [48.9, 2.35], [22.3, 114.2], [33.9, -118.4], [30.0, 31.2]
    ];
    var routePairs = [
      [0,1],[1,2],[2,3],[3,4],[5,3],[0,7],[6,7],[8,9],[10,0],[1,8],[2,11],[5,9]
    ];
    var arcs = [];
    var planes = [];
    var routeGroup = new THREE.Group();
    globe.add(routeGroup);

    function slerp(a, b, t) {
      var av = a.clone().normalize(), bv = b.clone().normalize();
      var dot = Math.min(1, Math.max(-1, av.dot(bv)));
      var omega = Math.acos(dot);
      if (omega < 1e-4) return av.clone();
      var s1 = Math.sin((1 - t) * omega) / Math.sin(omega);
      var s2 = Math.sin(t * omega) / Math.sin(omega);
      return av.multiplyScalar(s1).add(bv.multiplyScalar(s2));
    }

    routePairs.forEach(function (pair, idx) {
      var p0 = latLonToVec(cities[pair[0]][0], cities[pair[0]][1], GLOBE_R);
      var p1 = latLonToVec(cities[pair[1]][0], cities[pair[1]][1], GLOBE_R);
      var dist = p0.distanceTo(p1);
      var lift = 0.18 + dist * 0.14;
      var pts = [];
      var SEG = 60;
      for (var s = 0; s <= SEG; s++) {
        var t = s / SEG;
        var v = slerp(p0, p1, t).normalize();
        var h = GLOBE_R + Math.sin(t * Math.PI) * lift;
        pts.push(v.multiplyScalar(h));
      }
      var curve = new THREE.CatmullRomCurve3(pts);
      var geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
      var line = new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: 0x57b7ff, transparent: true, opacity: 0.0
      }));
      routeGroup.add(line);
      arcs.push({ line: line, curve: curve, appear: idx * 0.12 });

      // small endpoint markers
      [p0, p1].forEach(function (p) {
        var dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.022, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x8fd6ff })
        );
        dot.position.copy(p.clone().normalize().multiplyScalar(GLOBE_R * 1.01));
        routeGroup.add(dot);
      });

      // a glowing "aircraft" travelling along the route
      var plane = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xeaf6ff })
      );
      routeGroup.add(plane);
      planes.push({ mesh: plane, curve: curve, t: Math.random(), speed: 0.04 + Math.random() * 0.05 });
    });

    // Mouse parallax
    var targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    if (!isMobile) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        targetRY = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
        targetRX = ((e.clientY - r.top) / r.height - 0.5) * 0.3;
      });
    }

    globe.rotation.x = 0.32;
    var clock = new THREE.Clock();
    var elapsed = 0;

    function resize() {
      W = canvas.clientWidth || hero.clientWidth;
      H = canvas.clientHeight || hero.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    }
    window.addEventListener("resize", resize);

    var running = true;
    function animate() {
      if (!running) return;
      requestAnimationFrame(animate);
      var dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;

      globe.rotation.y += dt * 0.06;
      curRX += (targetRX - curRX) * 0.05;
      curRY += (targetRY - curRY) * 0.05;
      root.rotation.x = curRX;
      root.rotation.y = curRY;

      // reveal arcs progressively, then keep them softly glowing
      arcs.forEach(function (a) {
        var amt = Math.min(1, Math.max(0, (elapsed - a.appear) / 1.2));
        a.line.material.opacity = amt * 0.55;
      });

      // move planes along their arcs
      planes.forEach(function (pl) {
        pl.t += dt * pl.speed;
        if (pl.t > 1) pl.t -= 1;
        var pos = pl.curve.getPoint(pl.t);
        pl.mesh.position.copy(pos);
      });

      renderer.render(scene, camera);
    }

    // Pause when off-screen to save battery
    if ("IntersectionObserver" in window) {
      var hio = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          running = en.isIntersecting;
          if (running) { clock.getDelta(); animate(); }
        });
      }, { threshold: 0.02 });
      hio.observe(hero);
    }

    resize();
    animate();
  }

  /* ---------- Boot ---------- */
  function boot() {
    initNav();
    initProgress();
    initCards();
    initReveals();
    initContactForm();
    initHero3D();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
