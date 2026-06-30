/* =========================================================
   AtlisPoint Aero Group — main.js (v4, light tactical theme)
   Shared interactions + a clean tactical globe hero with
   animated great-circle flight routes and moving aircraft.
   Honors prefers-reduced-motion: disables 3D, shows poster.
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 760px)").matches;

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

  function initCards() {
    if (prefersReduced || isMobile) return;
    var cards = document.querySelectorAll(".card");
    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) translateY(-3px) rotateY(" + (x * 2.2).toFixed(2) + "deg) rotateX(" + (-y * 2.2).toFixed(2) + "deg)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

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

  /* ---------- Hero: light tactical globe with flight routes ---------- */
  function initHero3D() {
    return; /* v8: globe disabled, B&W static hero */
    var canvas = document.getElementById("hero-canvas");
    var hero = document.querySelector(".hero");
    if (!canvas) return;

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
    camera.position.set(0, 0.25, 5.85);

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
    catch (err) {
      canvas.style.display = "none";
      var p2 = document.querySelector(".hero__poster");
      if (p2) p2.classList.add("show");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);

    var GLOBE_R = 2.05;
    var root = new THREE.Group(); scene.add(root);
    var globe = new THREE.Group(); root.add(globe);

    // Soft, realistic lighting for a light scene
    var ambient = new THREE.AmbientLight(0xffffff, 0.85); scene.add(ambient);
    var key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(-4, 4, 5); scene.add(key);
    var fill = new THREE.DirectionalLight(0xcfd8e2, 0.45); fill.position.set(5, -2, -3); scene.add(fill);

    // Light ocean sphere (soft slate-blue), matte
    var ocean = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_R, 64, 64),
      new THREE.MeshStandardMaterial({ color: 0x33485e, roughness: 0.9, metalness: 0.05 })
    );
    globe.add(ocean);

    // Very subtle graticule (light gray)
    var grat = new THREE.Group();
    var gratMat = new THREE.LineBasicMaterial({ color: 0x7f96aa, transparent: true, opacity: 0.28 });
    for (var la = -60; la <= 60; la += 30) {
      var pts = []; var rr = GLOBE_R * Math.cos(la*Math.PI/180)*1.002; var yy = GLOBE_R*Math.sin(la*Math.PI/180)*1.002;
      for (var t = 0; t <= 64; t++){ var a=(t/64)*Math.PI*2; pts.push(new THREE.Vector3(rr*Math.cos(a), yy, rr*Math.sin(a))); }
      grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gratMat));
    }
    for (var lo = 0; lo < 180; lo += 30) {
      var pts2 = [];
      for (var t2 = 0; t2 <= 64; t2++){ var ph=(t2/64)*Math.PI*2;
        var x=GLOBE_R*1.002*Math.sin(ph)*Math.cos(lo*Math.PI/180);
        var z=GLOBE_R*1.002*Math.sin(ph)*Math.sin(lo*Math.PI/180);
        var y2=GLOBE_R*1.002*Math.cos(ph); pts2.push(new THREE.Vector3(x,y2,z)); }
      grat.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gratMat));
    }
    globe.add(grat);

    function latLonToVec(lat, lon, r) {
      var phi=(90-lat)*Math.PI/180, theta=(lon+180)*Math.PI/180;
      return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
    }

    // Land as dense matte points in tactical olive/slate
    var landBoxes = [
      [10,50,-100,-60],[-10,12,-75,-40],[35,70,-10,40],
      [0,35,8,50],[5,55,60,130],[-40,-12,112,152]
    ];
    var landPos = [];
    for (var i=0;i<3200;i++){ var b=landBoxes[i%landBoxes.length];
      var lat=b[0]+Math.random()*(b[1]-b[0]); var lon=b[2]+Math.random()*(b[3]-b[2]);
      var v=latLonToVec(lat,lon,GLOBE_R*1.004); landPos.push(v.x,v.y,v.z); }
    var landGeo=new THREE.BufferGeometry(); landGeo.setAttribute("position", new THREE.Float32BufferAttribute(landPos,3));
    var land=new THREE.Points(landGeo, new THREE.PointsMaterial({ color:0x9fb89a, size:0.03, transparent:true, opacity:0.95, sizeAttenuation:true }));
    globe.add(land);

    // Flight routes — dark tactical steel-blue arcs, dark plane dots
    var cities = [
      [40.7,-74.0],[51.5,-0.1],[25.2,55.3],[1.35,103.8],[-33.9,151.2],[35.7,139.7],
      [-23.5,-46.6],[19.4,-99.1],[48.9,2.35],[22.3,114.2],[33.9,-118.4],[30.0,31.2]
    ];
    var routePairs = [[0,1],[1,2],[2,3],[3,4],[5,3],[0,7],[6,7],[8,9],[10,0],[1,8],[2,11],[5,9]];
    var arcs=[], planes=[], routeGroup=new THREE.Group(); globe.add(routeGroup);

    function slerp(a,b,t){ var av=a.clone().normalize(), bv=b.clone().normalize();
      var dot=Math.min(1,Math.max(-1,av.dot(bv))); var om=Math.acos(dot);
      if(om<1e-4) return av.clone();
      var s1=Math.sin((1-t)*om)/Math.sin(om), s2=Math.sin(t*om)/Math.sin(om);
      return av.multiplyScalar(s1).add(bv.multiplyScalar(s2)); }

    routePairs.forEach(function(pair, idx){
      var p0=latLonToVec(cities[pair[0]][0],cities[pair[0]][1],GLOBE_R);
      var p1=latLonToVec(cities[pair[1]][0],cities[pair[1]][1],GLOBE_R);
      var dist=p0.distanceTo(p1), lift=0.18+dist*0.14, pts=[], SEG=60;
      for(var s=0;s<=SEG;s++){ var t=s/SEG; var v=slerp(p0,p1,t).normalize();
        var h=GLOBE_R+Math.sin(t*Math.PI)*lift; pts.push(v.multiplyScalar(h)); }
      var curve=new THREE.CatmullRomCurve3(pts);
      var geo=new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
      var line=new THREE.Line(geo, new THREE.LineBasicMaterial({ color:0x8fd0a8, transparent:true, opacity:0.0 }));
      routeGroup.add(line); arcs.push({line:line, appear:idx*0.1});
      [p0,p1].forEach(function(p){
        var dot=new THREE.Mesh(new THREE.SphereGeometry(0.024,8,8), new THREE.MeshBasicMaterial({color:0xbfe8cf}));
        dot.position.copy(p.clone().normalize().multiplyScalar(GLOBE_R*1.01)); routeGroup.add(dot); });
      var plane=new THREE.Mesh(new THREE.SphereGeometry(0.04,10,10), new THREE.MeshBasicMaterial({color:0xffffff}));
      routeGroup.add(plane); planes.push({mesh:plane, curve:curve, t:Math.random(), speed:0.04+Math.random()*0.05});
    });

    var targetRX=0,targetRY=0,curRX=0,curRY=0;
    if(!isMobile){ hero.addEventListener("pointermove", function(e){
      var r=hero.getBoundingClientRect();
      targetRY=((e.clientX-r.left)/r.width-0.5)*0.5; targetRX=((e.clientY-r.top)/r.height-0.5)*0.3; }); }

    globe.rotation.x=0.32;
    var clock=new THREE.Clock(), elapsed=0;
    function resize(){ W=canvas.clientWidth||hero.clientWidth; H=canvas.clientHeight||hero.clientHeight;
      camera.aspect=W/H; camera.updateProjectionMatrix(); renderer.setSize(W,H,false); }
    window.addEventListener("resize", resize);

    var running=true;
    function animate(){ if(!running) return; requestAnimationFrame(animate);
      var dt=Math.min(clock.getDelta(),0.05); elapsed+=dt;
      globe.rotation.y+=dt*0.06;
      curRX+=(targetRX-curRX)*0.05; curRY+=(targetRY-curRY)*0.05;
      root.rotation.x=curRX; root.rotation.y=curRY;
      arcs.forEach(function(a){ var amt=Math.min(1,Math.max(0,(elapsed-a.appear)/1.2)); a.line.material.opacity=amt*0.8; });
      planes.forEach(function(pl){ pl.t+=dt*pl.speed; if(pl.t>1) pl.t-=1; pl.mesh.position.copy(pl.curve.getPoint(pl.t)); });
      renderer.render(scene,camera); }

    if("IntersectionObserver" in window){
      var hio=new IntersectionObserver(function(ents){ ents.forEach(function(en){
        running=en.isIntersecting; if(running){ clock.getDelta(); animate(); } }); }, {threshold:0.02});
      hio.observe(hero);
    }
    resize(); animate();
  }

  function boot(){ initNav(); initProgress(); initCards(); initReveals(); initContactForm(); initHero3D(); }
  if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", boot); }
  else { boot(); }
})();
