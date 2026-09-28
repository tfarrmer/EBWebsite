/* =========================================================
   Erika Elise Beauty — Shared JavaScript
   Vanilla JS only. No dependencies.
   ========================================================= */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    setFooterYear();
    initGalleryReveal();
    initLightbox();
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
   * Fades gallery items in as they scroll into view.
   * The hidden starting state is only applied here, so content stays
   * visible if JS or IntersectionObserver is unavailable.
   */
  function initGalleryReveal() {
    var items = document.querySelectorAll(".gallery__item");
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!items.length || reduceMotion || !("IntersectionObserver" in window)) {
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

    items.forEach(function (item) {
      item.classList.add("reveal");
      observer.observe(item);
    });
  }

  /**
   * Lightbox for the portfolio gallery.
   * Expects .gallery__link anchors (href = full image) and the
   * #lightbox dialog markup from pages/portfolio.html.
   */
  function initLightbox() {
    var lightbox = document.getElementById("lightbox");
    var links = Array.prototype.slice.call(document.querySelectorAll(".gallery__link"));

    if (!lightbox || !links.length) {
      return;
    }

    var stage = lightbox.querySelector(".lightbox__stage");
    var figure = lightbox.querySelector(".lightbox__figure");
    var img = lightbox.querySelector(".lightbox__img");
    var counter = lightbox.querySelector(".lightbox__counter");
    var closeBtn = lightbox.querySelector(".lightbox__close");
    var prevBtn = lightbox.querySelector(".lightbox__prev");
    var nextBtn = lightbox.querySelector(".lightbox__next");
    var current = 0;
    var lastFocus = null;
    var closeTimer = null;

    if (links.length < 2) {
      prevBtn.hidden = true;
      nextBtn.hidden = true;
    }

    function show(index) {
      current = (index + links.length) % links.length;
      var link = links[current];
      var thumb = link.querySelector("img");
      img.src = link.getAttribute("href");
      img.alt = thumb ? thumb.alt : "";
      counter.textContent = (current + 1) + " / " + links.length;

      // Warm the cache for the neighbours so next/previous feel instant.
      [current - 1, current + 1].forEach(function (i) {
        var neighbour = links[(i + links.length) % links.length];
        new Image().src = neighbour.getAttribute("href");
      });
    }

    function open(index) {
      window.clearTimeout(closeTimer);
      lastFocus = document.activeElement;
      show(index);
      lightbox.hidden = false;
      void lightbox.offsetWidth;
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
      closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      closeTimer = window.setTimeout(function () {
        lightbox.hidden = true;
        img.removeAttribute("src");
      }, 300); // matches CSS transition duration
      if (lastFocus) {
        lastFocus.focus();
      }
    }

    function isOpen() {
      return lightbox.classList.contains("is-open");
    }

    links.forEach(function (link, index) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        open(index);
      });
    });

    closeBtn.addEventListener("click", close);
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });

    // Clicking anywhere outside the image (and not on a control) closes.
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox || event.target === stage || event.target === figure) {
        close();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!isOpen()) {
        return;
      }

      if (event.key === "Escape") {
        close();
      } else if (event.key === "ArrowLeft") {
        show(current - 1);
      } else if (event.key === "ArrowRight") {
        show(current + 1);
      } else if (event.key === "Tab") {
        trapFocus(event);
      }
    });

    function trapFocus(event) {
      var focusable = Array.prototype.filter.call(
        lightbox.querySelectorAll("button"),
        function (el) { return !el.hidden; }
      );
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (!lightbox.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
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
