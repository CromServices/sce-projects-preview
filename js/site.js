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
  var TIMES = ["Morning", "Midday", "Afternoon"];

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
      btn.dataset.iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
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

  function buildPills(container, items, name) {
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

  function initQuote(root) {
    if (!root) return;
    var form = root.querySelector("form");
    var success = root.querySelector("[data-success]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["name", "phone", "email", "suburb", "details"].forEach(function (field) {
        var input = form.querySelector('[name="' + field + '"]');
        var err = form.querySelector('[data-error="' + field + '"]');
        setText(err, "");
        input.removeAttribute("aria-invalid");
        if (!input.value.trim()) {
          setText(err, "This field is needed.");
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

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    syncHeaderH();
    window.addEventListener("resize", syncHeaderH);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(syncHeaderH);
    }
    document.querySelectorAll("[data-booking]").forEach(initBooking);
    document.querySelectorAll("[data-quote]").forEach(initQuote);
  });
})();
