/* =========================================================
   Erika Elise Beauty — Shared JavaScript
   Vanilla JS only. No dependencies.
   ========================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    setFooterYear();
  });

  /**
   * Wires up the hamburger toggle to the full-screen nav overlay.
   * Expects markup:
   *   <button class="nav-toggle" aria-expanded="false" aria-controls="nav-overlay">
   *   <div id="nav-overlay" class="nav-overlay" hidden>
   */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var overlay = document.getElementById("nav-overlay");

    if (!toggle || !overlay) {
      return;
    }

    var overlayLinks = overlay.querySelectorAll("a");

    function openNav() {
      overlay.hidden = false;
      // Force reflow so the transition runs after `hidden` is removed.
      void overlay.offsetWidth;
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
      var firstLink = overlay.querySelector("a");
      if (firstLink) {
        firstLink.focus();
      }
    }

    function closeNav() {
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      window.setTimeout(function () {
        overlay.hidden = true;
      }, 350); // matches CSS transition duration
      toggle.focus();
    }

    function toggleNav() {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    }

    toggle.addEventListener("click", toggleNav);

    overlayLinks.forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (event) {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen && event.key === "Escape") {
        closeNav();
      }
    });

    // Close the overlay if the viewport is resized up to desktop width.
    window.addEventListener("resize", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen && window.innerWidth >= 900) {
        closeNav();
      }
    });
  }

  /**
   * Fills any [data-current-year] element with the current year so the
   * footer copyright line never needs manual updating.
   */
  function setFooterYear() {
    var targets = document.querySelectorAll("[data-current-year]");
    var year = String(new Date().getFullYear());

    targets.forEach(function (el) {
      el.textContent = year;
    });
  }
})();
