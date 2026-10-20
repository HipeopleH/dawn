/* Dawn website — router, toc, copy + the smooth layer */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------------
  // route graph — drives sidebar nav and prev/next
  // ------------------------------------------------------------------
  var PAGES = [
    { route: "#/", title: "Home", group: null },
    { route: "#/docs/overview", title: "Overview", group: "Documentation" },
    { route: "#/docs/install", title: "Installation", group: "Documentation" },
    { route: "#/docs/getting-started", title: "Getting started", group: "Documentation" },
    { route: "#/docs/editor", title: "Script editor", group: "Documentation" },
    { route: "#/docs/hotkeys", title: "Hotkeys", group: "Documentation" },
    { route: "#/docs/console", title: "Console output", group: "Documentation" },
    { route: "#/docs/scripthub", title: "Script hub", group: "Documentation" },
    { route: "#/docs/autoexec", title: "AutoExec", group: "Documentation" },
    { route: "#/docs/api", title: "API reference", group: "Reference" },
    { route: "#/docs/files", title: "File layout", group: "Reference" },
    { route: "#/docs/uninstall", title: "Uninstall", group: "Reference" },
    { route: "#/docs/troubleshooting", title: "Troubleshooting", group: "Reference" },
    { route: "#/docs/faq", title: "FAQ", group: "Reference" },
    { route: "#/changelog", title: "Changelog", group: null },
  ];

  function pageByRoute(hash) {
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].route === hash) return PAGES[i];
    return PAGES[0];
  }

  function pageIdOf(route) { return route === "#/" ? "home" : route.slice(2); }

  function currentPage() {
    var full = location.hash || "#/";
    var route = "#/" + full.replace(/^#\/?/, "").split("#")[0];
    return pageByRoute(route);
  }

  // ------------------------------------------------------------------
  // reveal-on-scroll (re-armed per route visit)
  // ------------------------------------------------------------------
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("rev-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  }

  function armReveal(pageEl) {
    if (!io) return;
    pageEl.querySelectorAll(".rev").forEach(function (el, i) {
      el.classList.remove("rev-in");
      if (REDUCED) { el.classList.add("rev-in"); return; }
      el.style.setProperty("--d", Math.min(i % 10 * 45, 260) + "ms");
      io.observe(el);
    });
  }

  function tagRevealTargets() {
    // the direct flow of a doc page + feature cards on home
    var n = 0;
    var rowIdx;
    document.querySelectorAll("tbody").forEach(function (tb) {
      rowIdx = -1;
      tb.querySelectorAll("tr").forEach(function (tr) { tr.style.setProperty("--r", ++rowIdx); });
    });
    document.querySelectorAll(".page .content > *, .page .body-cols > article .content > *, .home-feature, .grid-2 .card, .grid-3 .card, .code-block, .table-wrap, .callout").forEach(function (el) {
      if (!el.classList.contains("rev")) { el.classList.add("rev"); n++; }
      if (el.classList.contains("grid-2") || el.classList.contains("grid-3")) {
        Array.prototype.forEach.call(el.children, function (c, ci) {
          c.classList.add("rev");
          c.style.setProperty("--d", Math.min(ci * 55, 220) + "ms");
        });
      }
    });
    return n;
  }

  // ------------------------------------------------------------------
  // router + toc
  // ------------------------------------------------------------------
  function render() {
    var full = location.hash || "#/";
    var route = "#/" + full.replace(/^#\/?/, "").split("#")[0];
    var page = pageByRoute(route);
    var anchorId = full.split("#")[2] || null;
    var pageEl = document.getElementById(pageIdOf(page.route));

    document.querySelectorAll(".page").forEach(function (el) {
      el.classList.toggle("active", el.id === pageIdOf(page.route));
    });
    document.querySelectorAll(".nav-item").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === page.route);
    });

    document.title = page.route === "#/" ? "Dawn — Roblox executor" : page.title + " — Dawn";

    buildToc(pageEl);
    buildPageNav(page);

    // keep the sidebar honest on tall lists
    var marked = document.querySelector(".nav-item.active");
    if (marked && marked.scrollIntoView) { try { marked.scrollIntoView({ block: "nearest" }); } catch (e) { } }

    if (anchorId && document.getElementById(anchorId)) {
      setTimeout(function () {
        var t = document.getElementById(anchorId);
        t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
        t.classList.add("flash");
        setTimeout(function () { t.classList.remove("flash"); }, 1600);
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }

    armReveal(pageEl || document.body);
    tick();   // progress + spy for the new page
    closeDrawer();
  }

  function buildToc(pageEl) {
    if (!pageEl) return;
    var host = pageEl.querySelector(".content-toc");
    if (!host) return;
    var toc = host.querySelector("#toc") || host;
    toc.innerHTML = "";

    var heads = pageEl.querySelectorAll("h2[id], h3[id]");
    if (!heads.length) { host.style.display = "none"; return; }
    host.style.display = "";

    heads.forEach(function (h, i) {
      var a = document.createElement("a");
      a.href = pageHistoryRoute(heads) + "#" + h.id;
      a.textContent = h.textContent;
      a.style.setProperty("--i", i);
      if (h.tagName === "H3") a.className = "lvl3";
      toc.appendChild(a);
    });
  }

  // figure out the canonical route from the active page's id
  function pageHistoryRoute() {
    var full = location.hash || "#/";
    return "#/" + full.replace(/^#\/?/, "").split("#")[0];
  }

  function buildPageNav(page) {
    var box = document.getElementById("page-nav");
    if (!box) return;
    var idx = PAGES.indexOf(page);
    var prev = PAGES[idx - 1] || null;
    var next = PAGES[idx + 1] || null;
    var aPrev = document.getElementById("nav-prev");
    var aNext = document.getElementById("nav-next");
    box.style.display = "flex";
    aPrev.style.display = prev ? "" : "none";
    aNext.style.display = next ? "" : "none";
    if (prev) { aPrev.querySelector(".lnk").textContent = prev.title; aPrev.href = prev.route; }
    if (next) { aNext.querySelector(".lnk").textContent = next.title; aNext.href = next.route; }
  }

  window.addEventListener("hashchange", render);

  // ------------------------------------------------------------------
  // scroll plumbing: progress bar, topbar shadow, toc scrollspy, fab
  // ------------------------------------------------------------------
  var progress = document.getElementById("read-progress");
  var fab = document.getElementById("top-fab");

  // tick runs synchronously — the doc-chrome updates are cheap, and a
  // backgrounded window may never fire rAF, which would strand the bar.
  function tick() {
    var y = window.scrollY || window.pageYOffset || 0;
    var pageEl = document.querySelector(".page.active");

    document.body.classList.toggle("scrolled", y > 10);

    if (progress) {
      var dMax = document.documentElement.scrollHeight - window.innerHeight;
      var frac = dMax > 40 ? Math.min(1, Math.max(0, y / dMax)) : 0;
      progress.style.width = (frac * 100) + "%";
      progress.style.opacity = frac > 0.02 ? "1" : "0";
      var ghost = document.querySelector(".site-footer .ghost");
      if (ghost) document.documentElement.style.setProperty("--ghostY", y);
    }

    if (fab) fab.classList.toggle("show", y > 900);

    if (pageEl) {
      var current = null;
      var heads = pageEl.querySelectorAll("h2[id], h3[id]");
      var line = y + 120;
      for (var i = 0; i < heads.length; i++) {
        if (heads[i].offsetTop <= line) current = heads[i];
        else break;
      }
      var host = pageEl.querySelector(".content-toc");
      if (host) {
        var mark = current ? (projectRoute(pageEl) + "#" + current.id) : null;
        host.querySelectorAll("a").forEach(function (a) {
          a.classList.toggle("current", a.getAttribute("href") === mark);
        });
      }
    }
  }

  function projectRoute(pageEl) {
    var full = location.hash || "#/";
    return "#/" + full.replace(/^#\/?/, "").split("#")[0];
  }

  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", tick, { passive: true });

  if (fab) fab.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
  });

  // ------------------------------------------------------------------
  // copy buttons
  // ------------------------------------------------------------------
  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".copy-btn");
    if (!btn) return;
    var pre = btn.closest(".code-block").querySelector("pre");
    var text = pre.innerText.replace(/\n$/, "");
    navigator.clipboard.writeText(text).then(function () {
      btn.textContent = "\u2713 copied";
      btn.classList.add("done");
      setTimeout(function () { btn.textContent = "copy"; btn.classList.remove("done"); }, 1400);
    }).catch(function () { });
  });

  // ------------------------------------------------------------------
  // hero spotlight
  // ------------------------------------------------------------------
  var hero = document.querySelector(".hero");
  if (hero && !REDUCED) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    }, { passive: true });
  }

  // ------------------------------------------------------------------
  // code heads — window dots + wrapped label (auto)
  // ------------------------------------------------------------------
  document.querySelectorAll(".code-head").forEach(function (h) {
    if (h.querySelector(".dots")) return;
    var dots = document.createElement("span");
    dots.className = "dots";
    for (var i = 0; i < 3; i++) dots.appendChild(document.createElement("i"));
    var label = document.createElement("span");
    label.className = "codehead-label";
    var tn = h.firstChild;
    if (tn && tn.nodeType === 3) {
      label.textContent = tn.textContent.trim();
      h.removeChild(tn);
    } else {
      label.textContent = "code";
    }
    h.insertBefore(dots, h.firstChild);
    h.insertBefore(label, dots.nextSibling);
  });

  // ------------------------------------------------------------------
  // inertial wheel scroll — native position, damped approach
  // ------------------------------------------------------------------
  var wheelTarget = null;   // null = synced to native position
  var wheelRaf = 0;
  var wheelV = 0;           // glide velocity once the target lands
  var wheelLastV = 0;       // approach speed, inherited by the glide

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function wheelStep() {
    wheelRaf = 0;
    var y = window.scrollY;
    if (wheelTarget === null) {
      // coasting phase — exponential decay glide instead of a dead stop
      if (Math.abs(wheelV) < 0.25) { wheelV = 0; return; }
      var ny = Math.max(0, Math.min(maxScroll(), y + wheelV));
      wheelV *= 0.955;
      window.scrollTo(0, ny);
      wheelRaf = requestAnimationFrame(wheelStep);
      return;
    }
    if (Math.abs(wheelTarget - y) < 1.2) {
      wheelV = wheelLastV;      // hand approach speed to the glide
      wheelLastV = 0;
      window.scrollTo(0, wheelTarget);
      wheelTarget = null;
      wheelRaf = requestAnimationFrame(wheelStep);
      return;
    }
    wheelLastV = (wheelTarget - y) * 0.16;
    window.scrollTo(0, Math.max(0, Math.min(maxScroll(), y + wheelLastV)));
    wheelRaf = requestAnimationFrame(wheelStep);
  }

  window.addEventListener("scroll", function () {
    if (!wheelRaf) wheelTarget = window.scrollY;  // resync on native drags / anchor jumps
  }, { passive: true });

  window.addEventListener("wheel", function (e) {
    if (REDUCED) return;
    if (e.ctrlKey || e.deltaMode === 1 || e.deltaMode === 2) return; // zoom / line-mode: native
    if (e.altKey || e.shiftKey) return;
    var scroller = e.target && e.target.closest
      ? e.target.closest(".sidebar, .code-block pre, .content-toc")
      : null;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) return; // native inside
    e.preventDefault();
    var max = maxScroll();
    if (max <= 0) return;
    if (wheelTarget === null) wheelTarget = window.scrollY;
    wheelTarget = Math.max(0, Math.min(max, wheelTarget + e.deltaY));
    if (!wheelRaf) wheelRaf = requestAnimationFrame(wheelStep);
    if (document.body) document.body.dataset.wheel = "1";
    tick();
  }, { passive: false });

  // ------------------------------------------------------------------
  // ambient rain — looping video backdrop
  // ------------------------------------------------------------------
  var rainVideo = document.getElementById("rain");
  if (rainVideo) {
    var rainPlay = function () { rainVideo.play().catch(function () { }); };
    rainPlay();
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) rainPlay();
    });
    // the class only toggles the fade — add it now, the CSS transition does the intro
    rainVideo.classList.add("on");
  }

  // ------------------------------------------------------------------
  // automatic download verify — drag/browse the exe onto this page and
  // the SHA-256 gets checked against the current release, fully local
  // (crypto.subtle digest; nothing is ever uploaded)
  // ------------------------------------------------------------------
  var RELEASE_SHA256 = "d58fcc6a93701a390934dff63671d3bdf1ed4fd3d0a178adabacbb9f28d824ed";

  function hexOf(buf) {
    var u8 = new Uint8Array(buf), out = "";
    for (var i = 0; i < u8.length; i++) {
      var h = u8[i].toString(16);
      out += h.length === 1 ? "0" + h : h;
    }
    return out;
  }

  function verifyOutcome(text, ok, detail) {
    var el = document.getElementById("verify-result");
    if (!el) return;
    el.textContent = detail ? text + "\ncomputed: " + detail : text;
    el.dataset.state = ok ? "ok" : "bad";
    el.classList.toggle("show", true);
  }

  function verifyFile(file) {
    var el = document.getElementById("verify-result");
    if (!el) return;
    el.textContent = "hashing " + file.name + " ...";
    el.dataset.state = "busy";
    el.classList.add("show");
    if (!window.crypto || !crypto.subtle) {
      verifyOutcome("this browser can't digest locally — use the manual commands below", false, null);
      return;
    }
    // a File is not a BufferSource in every runtime — always pull the
    // arrayBuffer explicitly before digesting
    file.arrayBuffer().then(function (ab) {
      return crypto.subtle.digest("SHA-256", ab);
    }).then(function (buf) {
      var hex = hexOf(buf).toLowerCase();
      if (hex === RELEASE_SHA256.toLowerCase()) {
        verifyOutcome("\u2713 verified — this is the genuine Dawn bootstrapper", true, hex);
      } else {
        verifyOutcome("\u26a0 mismatch — do not run it. Re-download from the Discord server", false, hex);
      }
    }).catch(function () {
      verifyOutcome("hashing failed — try again or use the manual commands", false, null);
    });
  }

  function wireAutoVerify() {
    var pre = document.querySelector("#checksum + .code-block"); // placeholder anchor guard
    var drop = document.getElementById("verify-drop");
    var picker = document.getElementById("verify-picker");
    var holder = document.getElementById("verify-result");
    if (!drop || !(window.File && window.FileReader)) return;

    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }, false);
    });
    ["dragleave", "dragend"].forEach(function (ev) {
      drop.addEventListener(ev, function () { drop.classList.remove("over"); }, false);
    });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      drop.classList.remove("over");
      var f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      if (!/\.exe$/i.test(f.name)) {
        verifyOutcome("drop the Bootstrapper.install.exe file", false, null);
        return;
      }
      verifyFile(f);
    }, false);

    if (picker) picker.addEventListener("change", function () {
      if (picker.files && picker.files[0]) verifyFile(picker.files[0]);
    });
  }

  // excerpt reveal on scroll doesn't apply here — wire directly after boot
  // (idempotent: drop zone lives on a single static page element)

  // ------------------------------------------------------------------
  // keyboard — Escape dismisses the mobile drawer; that's the map
  // ------------------------------------------------------------------
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });

  // ------------------------------------------------------------------
  // mobile drawer
  // ------------------------------------------------------------------
  function closeDrawer() { setDrawer(false); }
  var drawerSidebar = document.querySelector(".sidebar");
  var drawerScrim = document.getElementById("sidebar-scrim");
  function setDrawer(open) {
    if (!drawerSidebar) return;
    drawerSidebar.classList.toggle("open", open);
    if (drawerScrim) drawerScrim.classList.toggle("show", open);
    document.body.classList.toggle("drawer-open", open);
  }
  var toggle = document.getElementById("sidebar-toggle");
  if (toggle) toggle.addEventListener("click", function () {
    setDrawer(!drawerSidebar.classList.contains("open"));
  });
  if (drawerScrim) drawerScrim.addEventListener("click", function () { setDrawer(false); });

  // click ripples on nav + buttons
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".nav-item, .btn-primary, .btn-secondary");
    if (!t) return;
    var r = t.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2.2;
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (e.clientX - r.left) + "px";
    s.style.top = (e.clientY - r.top) + "px";
    t.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.remove(); }, 750);
  });

  // ------------------------------------------------------------------
  // boot
  // ------------------------------------------------------------------
  tagRevealTargets();
  wireAutoVerify();
  render();
})();
