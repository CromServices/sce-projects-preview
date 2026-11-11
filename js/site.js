(function () {
  "use strict";

  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var JOBS = [
    "Level 2 ASP",
    "Industrial",
    "Commercial",
    "Domestic",
    "Air conditioning and ventilation",
    "Refrigeration"
  ];
  var QUOTE_JOBS = JOBS.concat(["Other"]);
  var TIMES = ["Morning", "Afternoon", "Either"];

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }

  function syncHeaderH() {
    var header = document.querySelector("header.site");
    if (!header) return;
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  }

  function initTheme() {
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      requestAnimationFrame(syncHeaderH);
    });
  }

  function shortDate(d) {
    return DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()];
  }

  function isWeekend(d) {
    var day = d.getDay();
    return day === 0 || day === 6;
  }

  function moveRadio(group, current, dir) {
    var radios = Array.prototype.filter.call(group.querySelectorAll('[role="radio"]'), function (el) {
      return el.getAttribute("aria-disabled") !== "true";
    });
    if (!radios.length) return;
    var idx = radios.indexOf(current);
    if (idx < 0) idx = 0;
    var next = radios[(idx + dir + radios.length) % radios.length];
    next.focus();
    selectRadio(group, next);
  }

  function selectRadio(group, el) {
    if (el.getAttribute("aria-disabled") === "true") return;
    Array.prototype.forEach.call(group.querySelectorAll('[role="radio"]'), function (r) {
      var on = r === el;
      r.setAttribute("aria-checked", on ? "true" : "false");
      r.classList.toggle("is-on", on);
      r.tabIndex = on ? 0 : -1;
    });
    group.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function bindRadiogroup(group) {
    group.addEventListener("click", function (e) {
      var el = e.target.closest('[role="radio"]');
      if (!el || !group.contains(el)) return;
      selectRadio(group, el);
    });
    group.addEventListener("keydown", function (e) {
      var el = e.target.closest('[role="radio"]');
      if (!el || !group.contains(el)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        moveRadio(group, el, 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        moveRadio(group, el, -1);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        selectRadio(group, el);
      }
    });
  }

  function checkedRadio(group) {
    return group.querySelector('[role="radio"][aria-checked="true"]');
  }

  function buildDays(container) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var firstEnabled = null;
    for (var i = 0; i < 14; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);
      var weekend = isWeekend(d);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (weekend ? " is-weekend" : "");
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", "false");
      btn.tabIndex = -1;
      btn.dataset.label = shortDate(d);
      btn.setAttribute("aria-label", shortDate(d) + (weekend ? ", weekend unavailable" : ""));
      if (weekend) btn.setAttribute("aria-disabled", "true");
      btn.innerHTML = '<span class="dow">' + DOW[d.getDay()] + '</span><span class="dom">' + d.getDate() + '</span><span class="mon">' + MON[d.getMonth()] + "</span>";
      container.appendChild(btn);
      if (!weekend && !firstEnabled) firstEnabled = btn;
    }
    if (firstEnabled) {
      firstEnabled.setAttribute("aria-checked", "true");
      firstEnabled.classList.add("is-on");
      firstEnabled.tabIndex = 0;
    }
  }

  function buildPills(container, items) {
    items.forEach(function (label, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill" + (i === 0 ? " is-on" : "");
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", i === 0 ? "true" : "false");
      btn.tabIndex = i === 0 ? 0 : -1;
      btn.dataset.label = label;
      btn.textContent = label;
      container.appendChild(btn);
    });
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  function initBooking(root) {
    if (!root) return;
    var days = root.querySelector("[data-days]");
    var times = root.querySelector("[data-times]");
    var jobs = root.querySelector("[data-jobs]");
    var summary = root.querySelector("[data-summary]");
    var form = root.querySelector("form");
    var success = root.querySelector("[data-success]");
    var formError = root.querySelector("[data-form-error]");

    days.setAttribute("role", "radiogroup");
    days.setAttribute("aria-label", "Preferred day");
    times.setAttribute("role", "radiogroup");
    times.setAttribute("aria-label", "Time of day");
    jobs.setAttribute("role", "radiogroup");
    jobs.setAttribute("aria-label", "Type of work");

    buildDays(days);
    buildPills(times, TIMES);
    buildPills(jobs, JOBS);
    bindRadiogroup(days);
    bindRadiogroup(times);
    bindRadiogroup(jobs);

    function updateSummary() {
      var d = checkedRadio(days);
      var t = checkedRadio(times);
      var parts = [];
      if (d) parts.push(d.dataset.label);
      if (t) parts.push(t.dataset.label);
      setText(summary, parts.join(", "));
    }
    days.addEventListener("change", updateSummary);
    times.addEventListener("change", updateSummary);
    updateSummary();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      setText(form.querySelector('[data-error="name"]'), "");
      setText(form.querySelector('[data-error="phone"]'), "");
      setText(formError, "");
      name.removeAttribute("aria-invalid");
      phone.removeAttribute("aria-invalid");

      if (!name.value.trim()) {
        setText(form.querySelector('[data-error="name"]'), "Please enter your name.");
        name.setAttribute("aria-invalid", "true");
        ok = false;
      }
      var phoneVal = phone.value.replace(/\s+/g, "");
      if (!phoneVal || phoneVal.replace(/[^\d+]/g, "").length < 8) {
        setText(form.querySelector('[data-error="phone"]'), "Please enter a phone number.");
        phone.setAttribute("aria-invalid", "true");
        ok = false;
      }
      if (!checkedRadio(days) || !checkedRadio(times) || !checkedRadio(jobs)) {
        setText(formError, "Please choose a weekday, a time and a type of work.");
        ok = false;
      }
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
  }

  function syncHiddenFromGroup(group, input) {
    var checked = checkedRadio(group);
    input.value = checked ? checked.dataset.label : "";
  }

  function initQuote(root) {
    if (!root) return;
    var form = root.querySelector("form");
    var success = root.querySelector("[data-success]");
    var jobs = root.querySelector("[data-quote-jobs]");
    var times = root.querySelector("[data-quote-times]");
    var workInput = form.querySelector('[name="work"]');
    var whenInput = form.querySelector('[name="when"]');

    jobs.setAttribute("role", "radiogroup");
    times.setAttribute("role", "radiogroup");
    var workLabel = jobs.previousElementSibling;
    var whenLabel = times.previousElementSibling;
    if (workLabel && workLabel.id) jobs.setAttribute("aria-labelledby", workLabel.id);
    else jobs.setAttribute("aria-label", "Type of work");
    if (whenLabel && whenLabel.id) times.setAttribute("aria-labelledby", whenLabel.id);
    else times.setAttribute("aria-label", "Preferred time to talk");

    buildPills(jobs, QUOTE_JOBS);
    buildPills(times, TIMES);
    bindRadiogroup(jobs);
    bindRadiogroup(times);
    syncHiddenFromGroup(jobs, workInput);
    syncHiddenFromGroup(times, whenInput);
    jobs.addEventListener("change", function () { syncHiddenFromGroup(jobs, workInput); });
    times.addEventListener("change", function () { syncHiddenFromGroup(times, whenInput); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["name", "phone", "email", "suburb", "details", "work", "when"].forEach(function (field) {
        var input = form.querySelector('[name="' + field + '"]');
        var err = form.querySelector('[data-error="' + field + '"]');
        if (err) setText(err, "");
        input.removeAttribute("aria-invalid");
        if (!input.value.trim()) {
          if (err) setText(err, "This field is needed.");
          input.setAttribute("aria-invalid", "true");
          ok = false;
        }
      });
      var email = form.querySelector('[name="email"]');
      if (email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        setText(form.querySelector('[data-error="email"]'), "Please enter an email address.");
        email.setAttribute("aria-invalid", "true");
        ok = false;
      }
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
  }

  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
    var root = document.querySelector(".lightbox");
    if (!items.length || !root) return;
    var img = root.querySelector(".lightbox-stage img");
    var cap = root.querySelector("[data-lb-caption]");
    var count = root.querySelector("[data-lb-count]");
    var btnClose = root.querySelector(".lightbox-close");
    var btnPrev = root.querySelector(".lightbox-prev");
    var btnNext = root.querySelector(".lightbox-next");
    var index = 0;
    var lastFocus = null;
    var startX = 0;
    var startY = 0;

    function focusables() {
      return [btnClose, btnPrev, btnNext].filter(function (el) { return el && !el.hidden; });
    }

    function show(i) {
      index = (i + items.length) % items.length;
      var el = items[index];
      img.src = el.getAttribute("data-full") || el.currentSrc || el.src;
      img.alt = el.alt || "";
      cap.textContent = el.getAttribute("data-caption") || el.alt || "";
      count.textContent = (index + 1) + " / " + items.length;
      btnPrev.hidden = items.length < 2;
      btnNext.hidden = items.length < 2;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      root.hidden = false;
      document.body.classList.add("is-locked");
      btnClose.focus();
    }

    function close() {
      root.hidden = true;
      img.removeAttribute("src");
      document.body.classList.remove("is-locked");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    items.forEach(function (el, i) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open(i);
      });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(i);
        }
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(index - 1); });
    btnNext.addEventListener("click", function () { show(index + 1); });
    root.addEventListener("click", function (e) {
      if (e.target === root) close();
    });
    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "Tab") {
        var list = focusables();
        if (!list.length) return;
        var first = list[0];
        var last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    root.addEventListener("touchstart", function (e) {
      if (!e.changedTouches[0]) return;
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (!e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) show(index + 1);
        else show(index - 1);
      } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
        close();
      }
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    syncHeaderH();
    window.addEventListener("resize", syncHeaderH);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeaderH);
    }
    document.querySelectorAll("[data-booking]").forEach(initBooking);
    document.querySelectorAll("[data-quote]").forEach(initQuote);
    initLightbox();
  });
})();
