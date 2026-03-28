/* Table of content
--------------------------------------------

========

--------
ANIMATION AFTER PAGE LOAD
MASONRY ON GALLERY PAGE
SLIDER ON HOME PAGE
CURSOR 
NAVIGATION ANIMATION
PAGE TRANSITIONS 
IMAGES SORTING
-----------
==========

*/

// Enable smooth touch scrolling on entire website
if ('ontouchstart' in window) {
  document.addEventListener('touchmove', (e) => {
    // Block only 3+ finger gesture defaults that can interfere with the UI.
    if (e.touches.length > 2) {
      e.preventDefault();
    }
  }, { passive: false });
}

// Email sending functionality
async function sendMail() {
  const form = {
    name: document.getElementById("name"),
    subject: document.getElementById("subject"),
    email: document.getElementById("email"),
    body: document.getElementById("body")
  };

  // Validate form fields
  if (!form.name || !form.subject || !form.email || !form.body) {
    console.error('Form fields not found');
    alert("Error: Form fields not found");
    return;
  }

  try {
    const params = {
      name: form.name.value.trim(),
      subject: form.subject.value.trim(),
      email: form.email.value.trim(),
      body: form.body.value.trim()
    };
    
    if (!params.name || !params.email || !params.subject || !params.body) {
      alert("Please fill in all fields");
      return;
    }

    await emailjs.send("service_f943jnr", "template_kdzo5or", params);
    alert("Email Sent Successfully!");
    
    // Clear form
    Object.values(form).forEach(field => field.value = '');
  } catch (error) {
    console.error('Failed to send email:', error);
    alert("Failed to send email. Please try again later.");
  }
}

// Update copyright year
function updateCopyright() {
  const yearElement = document.getElementById("year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// PAGE EFFECT AFTER LOADING
$(window).on("load", function () {
  const loadertext = document.querySelector(".loader-text-stroke");
  const loaderFill = loadertext?.querySelector(".loader-text");
  const loader = document.getElementById("loader");
  if (!loadertext || !loader) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const exitDelay = prefersReducedMotion ? 120 : 1450;

  const timeline = gsap.timeline({
    defaults: {
      ease: "sine.inOut"
    }
  });

  let hasDismissedLoader = false;

  function dismissLoader() {
    if (hasDismissedLoader) return;
    hasDismissedLoader = true;

    timeline
      .to([loadertext, loaderFill].filter(Boolean), {
        duration: prefersReducedMotion ? 0.2 : 1.35,
        opacity: 0,
        y: prefersReducedMotion ? 0 : -6
      })
      .to(loader, {
        duration: prefersReducedMotion ? 0.25 : 1.1,
        opacity: 0,
        ease: prefersReducedMotion ? "none" : "sine.inOut",
        onComplete: function () {
          loader.style.display = "none";
        }
      }, "-=0.55");
  }

  window.setTimeout(dismissLoader, exitDelay);
});

// GALLERY PAGE SLIDER

new Swiper(".swiper-container", {
  slidesPerView: "auto",
  speed: 1000,
  spaceBetween: 20,
  centeredSlides: true,
  grabCursor: true,
  on: {
    init: function () {
      let swiper = this;
      for (let i = 0; i < swiper.slides.length; i++) {
        $(swiper.slides[i])
          .find(".img-container")
          .attr({
            "data-swiper-parallax": 1 * swiper.width,
          });
      }
    },
    resize: function () {
      this.update();
    },
  },
  autoplay: {
    delay: 8000,
    disableOnInteraction: true,
  },
  pagination: {
    el: "#home .swiper-pagination",
    type: "fraction",
  },
  mousewheel: true,
  observer: true,
  observeParents: true,
});
// SLIDER ON GALLERY PAGE

$(document).ready(function () {
  $(".image-type").lettering();
});

//DISPLAY NAVIGATION CONTENT ON MENUBAR CLICK
$(function () {
  $(".menu-bar").on("click", function () {
    //WHEN MENUBAR IS CLICKED BRING NAVIGATION UP
    gsap.to("#navigation", 1, {
      y: "0%",
      ease: "Expo.easeInOut",
      onComplete: function () {
        //WHEN NAVIGATION ANIMATION IS COMPLETED DO THE FOLLOWING
        gsap.to(".navigation-opacity", 0.5, {
          //GET ELEMENTS OF CLASS 'NAVIGATION-OPACITY' AND TURN THEIR OPACITY TO 1
          opacity: 1,
          stagger: 0.1,
        });
      },
    });
  });

  $(".navigation-close").on("click", function () {
    //WHEN NAVIGATION CLOSE IS CLICKED ANIMATE NAVIGATION DOWN

    gsap.to(".navigation-opacity", 0.5, {
      //GET ELEMENTS OF CLASS 'NAVIGATION-OPACITY' AND TURN THEIR OPACITY TO 0
      opacity: 0,
      stagger: 0.05,
      onComplete: function () {
        //WHEN OPACITY ANIMATION IS COMPLETED DO THE FOLLOWING
        gsap.to("#navigation", 1, {
          y: "100%",
          ease: "Expo.easeInOut",
        });
      },
    });
  });
});

//PAGE TRANSITIONS

const ROUTE_SECTION_IDS = [
  "home",
  "about",
  "gallery",
  "contact",
  "policies",
  "terms-of-service",
  "privacy-policy",
  "legal-notice",
  "cookie-policy",
  "google-analytics",
  "not-found",
];

let isRouteTransitioning = false;

function normalizeRouteTarget(target) {
  const fallback = "#home";
  const missingRoute = "#not-found";

  if (!target || typeof target !== "string") return fallback;

  const hash = target.startsWith("#") ? target : `#${target}`;
  if (hash === "#") return fallback;

  if (ROUTE_SECTION_IDS.includes(hash.slice(1)) && document.querySelector(hash)) {
    return hash;
  }

  if (document.querySelector(missingRoute)) {
    return missingRoute;
  }

  return fallback;
}

function applyRouteVisibility(target) {
  const resolved = normalizeRouteTarget(target);

  ROUTE_SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.style.display = `#${id}` === resolved ? "block" : "none";
  });

  document.body.classList.toggle("is-home-route", resolved === "#home");
  return resolved;
}

$(function pagetransition() {
  var links = [...document.querySelectorAll(".page-link")]; // get all elements with class 'page link'
  var breaker = document.querySelector("#breaker"); //get element with ID Breaker

  links.forEach((link) =>
    link.addEventListener("click", function (event) {
      //on click on page link element

      var page = link.getAttribute("href"); // get its value of attribute href

      if (document.querySelector(page)) {
        if (isRouteTransitioning) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        isRouteTransitioning = true;
        document.body.classList.add("page-transitioning");
        document.body.classList.remove("footer-open");
        document.dispatchEvent(new CustomEvent("page-transition-start", {
          detail: { page },
        }));

        //DISPLAYBREAKER FUNCTION
        function displaybreaker() {
          breaker.style.display = "block"; //display breaker animation

          breaker.addEventListener("animationend", function () {
            this.style.display = "none"; // on animation end set the style of breaker to none
            document.body.classList.remove("page-transitioning");
            document.dispatchEvent(new CustomEvent("page-transition-end", {
              detail: { page },
            }));
          }, { once: true });

          gsap.to(".navigation-opacity", 0.5, {
            //close navigation
            opacity: 0,
            stagger: -0.05,
            onComplete: function () {
              gsap.to("#navigation", 1, {
                y: "100%",
                ease: "Expo.easeInOut",
              });
            },
          }); //close navigation
        }

        //DISPLAYBREAKER FUNCTION

        displaybreaker(); // CALL DISPLAYBREAKER FUNCTION

        //  CHANGEPAGE FUNCTION
        function changepage() {
          setTimeout(function () {
            applyRouteVisibility(page);
            isRouteTransitioning = false;
            if (window.location.hash !== page) {
              window.location.hash = page;
            }
            document.dispatchEvent(new CustomEvent("page-transition-complete", {
              detail: { page },
            }));
          }, 1500);
        }
        //  CHANGEPAGE FUNCTION

        changepage(); // CALL CHANGEPAGE FUNCTION
      }
    }),
  );
});

//PAGE TRANSITION

// Initialize gallery when DOM is loaded
// Setup popup modal functionality
function setupPopupModal() {
  const galleryGrid = document.querySelector(".gallery-grid");
  const popupModal = document.getElementById("popup-modal");
  const popupImage = document.getElementById("popup-image");
  const popupCaption = document.getElementById("popup-caption");
  const popupClose = document.querySelector(".popup-close");
  const popupLoader = document.getElementById("popup-loader");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomResetBtn = document.getElementById("zoom-reset");
  const popupPrevBtn = document.getElementById("popup-prev");
  const popupNextBtn = document.getElementById("popup-next");
  const popupCounter = document.getElementById("popup-counter");

  if (!galleryGrid || !popupModal || !popupImage || !popupCaption || !popupClose || !popupLoader) {
    console.warn('Popup modal elements not found');
    return;
  }

  if (window.__popupController) {
    window.__popupController.refreshVisibleImages();
    return;
  }

  let currentScale = 1;
  const ZOOM_STEP = 0.25;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;
  const INITIAL_SCALE = 0.6;
  const SWIPE_THRESHOLD = 40;
  let visibleImages = [];
  let currentImageIndex = -1;
  let touchStartDistance = 0;
  let touchStartScale = 1;
  let lastTapTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let isPinchGesture = false;

  function updateImageScale() {
    popupImage.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
  }

  function refreshVisibleImages() {
    visibleImages = Array.from(document.querySelectorAll(".gallery-img")).filter((img) => {
      if (!img.isConnected) return false;
      if (img.style.display === "none") return false;
      const col = img.closest(".column");
      if (col && col.style.display === "none") return false;
      return img.offsetParent !== null;
    });
  }

  function updateCounter() {
    if (!popupCounter) return;
    if (currentImageIndex < 0 || visibleImages.length === 0) {
      popupCounter.textContent = "0 / 0";
      return;
    }
    popupCounter.textContent = `${currentImageIndex + 1} / ${visibleImages.length}`;
  }

  function closePopup() {
    popupModal.style.display = "none";
    popupImage.src = "";
    popupImage.style.display = "none";
    popupLoader.style.display = "none";
    currentImageIndex = -1;
    currentScale = 1;
    updateImageScale();
    updateCounter();
    document.body.style.overflow = "";
  }

  function renderCurrentImage() {
    if (!visibleImages.length || currentImageIndex < 0) return;
    const image = visibleImages[currentImageIndex];
    if (!image) return;

    const highResSrc = image.getAttribute("data-highres") || image.getAttribute("src") || "";
    popupModal.style.display = "block";
    popupLoader.style.display = "block";
    popupImage.style.display = "none";
    popupImage.src = "";
    popupCaption.textContent = image.alt || "portfolio";
    popupImage.alt = image.alt || "portfolio";
    currentScale = INITIAL_SCALE;
    updateImageScale();
    updateCounter();
    document.body.style.overflow = "hidden";

    popupImage.onload = function () {
      popupLoader.style.display = "none";
      popupImage.style.display = "block";
    };

    popupImage.onerror = function () {
      popupLoader.style.display = "none";
      popupImage.style.display = "none";
    };

    popupImage.src = highResSrc;
  }

  function navigate(step) {
    if (!visibleImages.length) return;
    currentImageIndex = (currentImageIndex + step + visibleImages.length) % visibleImages.length;
    renderCurrentImage();
  }

  function openByImage(image) {
    refreshVisibleImages();
    const idx = visibleImages.indexOf(image);
    if (idx === -1) return;
    currentImageIndex = idx;
    renderCurrentImage();
  }

  function getTouchDistance(event) {
    return Math.hypot(
      event.touches[0].pageX - event.touches[1].pageX,
      event.touches[0].pageY - event.touches[1].pageY
    );
  }

  popupImage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      touchStartDistance = getTouchDistance(e);
      touchStartScale = currentScale;
      isPinchGesture = true;
    } else if (e.touches.length === 1) {
      isPinchGesture = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTapTime;
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
        // Double tap to reset zoom
        currentScale = 1;
        updateImageScale();
      }
      lastTapTime = currentTime;
    }
  });

  popupImage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e);
      const scale = (distance / touchStartDistance) * touchStartScale;
      currentScale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
      updateImageScale();
    }
  });

  popupImage.addEventListener('touchend', (e) => {
    if (isPinchGesture || !e.changedTouches || e.changedTouches.length === 0) {
      return;
    }
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        navigate(1);
      } else {
        navigate(-1);
      }
    }
  });

  // Zoom button controls
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      currentScale = Math.min(currentScale + ZOOM_STEP, MAX_SCALE);
      updateImageScale();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      currentScale = Math.max(currentScale - ZOOM_STEP, MIN_SCALE);
      updateImageScale();
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      currentScale = INITIAL_SCALE;
      updateImageScale();
    });
  }

  if (popupPrevBtn) {
    popupPrevBtn.addEventListener("click", () => navigate(-1));
  }

  if (popupNextBtn) {
    popupNextBtn.addEventListener("click", () => navigate(1));
  }

  galleryGrid.addEventListener("click", function (event) {
    const image = event.target.closest(".gallery-img");
    if (!image) return;
    openByImage(image);
  });

  popupClose.addEventListener("click", closePopup);

  popupModal.addEventListener("click", function (event) {
    if (event.target === popupModal) {
      closePopup();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (popupModal.style.display !== "block") return;

    if (event.key === "Escape") {
      closePopup();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigate(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(-1);
    }
  });

  // Prevent context menu on the popup image
  popupImage.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });

  // Mouse wheel zoom
  popupImage.addEventListener('wheel', (e) => {
    if (popupModal.style.display !== "block") return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    currentScale = Math.min(Math.max(currentScale + delta, MIN_SCALE), MAX_SCALE);
    updateImageScale();
  }, { passive: false });

  refreshVisibleImages();
  updateCounter();

  window.__popupController = {
    refreshVisibleImages,
    closePopup,
  };

  window.refreshPopupGalleryCache = refreshVisibleImages;
}

// Initialize gallery functionality
function initializeGallery() {
  const galleryGrid = document.querySelector(".gallery-grid");
  if (!galleryGrid) {
    console.warn("Gallery container not found");
    return;
  }

  const imageSelector = document.querySelector(".image-selector");
  const shouldUseMasonry = () => window.innerWidth > 0;
  const isMobileViewport = () => window.innerWidth <= 675;
  let masonry = null;
  let layoutScheduled = false;
  let currentFilter = "all";
  let hiddenPaths = [];
  let dynamicGalleryLoaded = false;
  let layoutObserver = null;
  let mobileScrollLayoutTimer;
  const shouldUseLocalApi = (() => {
    const host = window.location.hostname;
    const port = window.location.port;
    const isLocalHost = host === "127.0.0.1" || host === "localhost";
    const isStaticFiveServer = isLocalHost && port === "5500";
    return !isStaticFiveServer;
  })();

  function normalizeCategoryName(value) {
    const raw = (value || "").toLowerCase().trim();
    const aliases = {
      event: "event",
      events: "event",
      portrait: "portrait",
      portraits: "portrait",
      place: "places",
      places: "places",
      architecture: "architecture",
      architectures: "architecture",
    };
    return aliases[raw] || raw;
  }

  function initMasonry() {
    if (!shouldUseMasonry()) {
      if (masonry) {
        masonry.destroy();
        masonry = null;
        window._masonryInstance = null;
      }
      clearMasonryStyles();
      return;
    }
    if (!masonry) {
      masonry = new Masonry(".gallery-grid", {
        itemSelector: ".column",
        isAnimated: false,
        transitionDuration: 0,
        initLayout: false,
        resize: true,
        percentPosition: false,
        columnWidth: getColumnWidth(),
        horizontalOrder: true,
      });
      window._masonryInstance = masonry;
    }
  }

  function getColumnWidth() {
    const gridWidth =
      galleryGrid.clientWidth || galleryGrid.getBoundingClientRect().width || window.innerWidth;
    if (window.innerWidth <= 950) {
      return gridWidth;
    }
    return gridWidth / 3;
  }

  function clearMasonryStyles() {
    galleryGrid.style.removeProperty("height");
    galleryGrid.querySelectorAll(".column").forEach((col) => {
      col.style.removeProperty("position");
      col.style.removeProperty("left");
      col.style.removeProperty("top");
    });
  }

  function scheduleLayout() {
    if (layoutScheduled) return;
    layoutScheduled = true;
    requestAnimationFrame(() => {
      layoutScheduled = false;
      if (!shouldUseMasonry()) {
        clearMasonryStyles();
        return;
      }
      if (!masonry) {
        initMasonry();
      }
      if (!masonry) return;
      masonry.options.columnWidth = getColumnWidth();
      masonry.reloadItems();
      masonry.layout();
    });
  }

  function waitForImages(images, timeoutMs = 1800) {
    if (!images || images.length === 0) return Promise.resolve();
    const promises = Array.from(images).map((img) =>
      new Promise((resolve) => {
        if (img.complete && img.naturalWidth > 0) {
          resolve();
          return;
        }
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }),
    );
    const timeout = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    return Promise.race([Promise.all(promises), timeout]);
  }

  function isHiddenByPolicy(img) {
    const src = img.getAttribute("src") || img.src || "";
    return hiddenPaths.some((h) => src.endsWith(h) || src === h);
  }

  function refreshPopupAndLayout() {
    scheduleLayout();
    if (typeof window.refreshPopupGalleryCache === "function") {
      window.refreshPopupGalleryCache();
    }
  }

  function bindImageLayoutListeners(img) {
    if (!img || img.dataset.layoutBound === "1") return;
    img.dataset.layoutBound = "1";
    img.addEventListener("load", refreshPopupAndLayout, { passive: true });
    img.addEventListener("error", refreshPopupAndLayout, { passive: true });
    if (layoutObserver) {
      layoutObserver.observe(img);
    }
  }

  function setupMobileLayoutObserver() {
    if (typeof IntersectionObserver !== "function") return;
    if (layoutObserver) {
      layoutObserver.disconnect();
    }
    // Mobile lazy-loaded images near the viewport can arrive late; force a repack.
    layoutObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          scheduleLayout();
        }
      },
      {
        root: null,
        rootMargin: "320px 0px",
        threshold: 0,
      },
    );
  }

  function eagerPrepareVisibleImages(visibleImages) {
    const front = visibleImages.slice(0, 18);
    front.forEach((img) => {
      if (!img) return;
      img.decoding = "async";
      if (img.loading !== "eager") {
        img.loading = "eager";
      }
      bindImageLayoutListeners(img);
      if (typeof img.decode === "function") {
        img.decode().catch(() => {
          // Ignore decode failures for partial/streamed images.
        });
      }
    });
  }

  function applyGalleryFilter(sortValue) {
    currentFilter = (sortValue || "all").toLowerCase().trim();
    const normalizedFilter = normalizeCategoryName(currentFilter);
    const images = document.querySelectorAll(".gallery-img");
    const visibleImages = [];
    images.forEach((img) => {
      const col = img.closest(".column");
      if (!col) return;
      const alt = normalizeCategoryName(img.alt || "portfolio");
      const visibleByFilter =
        normalizedFilter === "all" || alt === normalizedFilter;
      const visible = visibleByFilter && !isHiddenByPolicy(img);
      col.style.display = visible ? "" : "none";
      img.style.display = visible ? "" : "none";
      if (visible) {
        visibleImages.push(img);
      }
    });
    eagerPrepareVisibleImages(visibleImages);
    if (shouldUseMasonry()) {
      if (!masonry) {
        initMasonry();
      }
      if (masonry) {
        masonry.reloadItems();
      }
    }
    refreshPopupAndLayout();
    waitForImages(visibleImages.slice(0, 12), 1000).then(() => {
      refreshPopupAndLayout();
    });
  }

  function syncActiveButton(sortValue) {
    if (!imageSelector) return;
    imageSelector.querySelectorAll(".image-sort-button").forEach((btn) => {
      const isActive = (btn.dataset.sort || "").toLowerCase() === sortValue;
      btn.classList.toggle("active", isActive);
    });
  }

  function appendMissingCategoryButtons(items) {
    if (!imageSelector || !Array.isArray(items)) return;
    const existing = new Set(
      Array.from(imageSelector.querySelectorAll(".image-sort-button")).map((btn) =>
        (btn.dataset.sort || "").toLowerCase().trim(),
      ),
    );

    const discovered = new Set();
    for (const item of items) {
      const cat = (item.alt || "portfolio").toLowerCase().trim();
      if (!cat || cat === "all" || existing.has(cat)) continue;
      discovered.add(cat);
    }

    for (const cat of discovered) {
      const a = document.createElement("a");
      a.href = "#";
      a.className = "image-sort-button hover";
      a.dataset.sort = cat;
      a.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      imageSelector.appendChild(a);
      existing.add(cat);
    }
  }

  async function loadHideList() {
    if (!shouldUseLocalApi) return;
    try {
      const r = await fetch("/api/hide-list");
      if (!r.ok) return;
      const j = await r.json();
      hiddenPaths = Array.isArray(j.items) ? j.items : [];
      applyGalleryFilter(currentFilter);
    } catch {
      // Ignore network failures for hide-list.
    }
  }

  async function loadDynamicGallery() {
    if (!shouldUseLocalApi) return;
    const existingSrcs = new Set(
      Array.from(document.querySelectorAll(".gallery-img")).map(
        (i) => i.getAttribute("src") || i.src || "",
      ),
    );
    window._blobUrls = window._blobUrls || new Set();

    try {
      const r = await fetch("/api/list");
      if (!r.ok) return;
      const data = await r.json();
      if (!data || !Array.isArray(data.items)) return;

      appendMissingCategoryButtons(data.items);

      const frag = document.createDocumentFragment();
      const newImages = [];

      for (const item of data.items) {
        if (existingSrcs.has(item.url) || window._blobUrls.has(item.url)) continue;
        const col = document.createElement("div");
        col.className = "column";

        const img = document.createElement("img");
        img.className = "gallery-img";
        img.loading = "lazy";
        img.decoding = "async";
        img.src = item.url;
        img.setAttribute("data-highres", item.url);
        img.alt = item.alt || "portfolio";
        bindImageLayoutListeners(img);

        col.appendChild(img);
        frag.appendChild(col);
        newImages.push(img);
        window._blobUrls.add(item.url);
        existingSrcs.add(item.url);
      }

      if (newImages.length) {
        galleryGrid.insertBefore(frag, galleryGrid.firstChild);
        scheduleLayout();
        await waitForImages(newImages, 4500);
      }

      initMasonry();
      applyGalleryFilter(currentFilter);
    } catch {
      // Ignore network failures for dynamic gallery.
    }
  }

  function maybeLoadDynamicGallery() {
    if (dynamicGalleryLoaded) return;
    if (normalizeRouteTarget(window.location.hash || "#home") !== "#gallery") return;
    dynamicGalleryLoaded = true;
    loadDynamicGallery();
  }

  if (imageSelector) {
    imageSelector.addEventListener("click", (event) => {
      const btn = event.target.closest(".image-sort-button");
      if (!btn) return;
      event.preventDefault();
      const sortValue = (btn.dataset.sort || "all").toLowerCase().trim();
      syncActiveButton(sortValue);
      applyGalleryFilter(sortValue);
    });
  }

  galleryGrid.style.opacity = "0";
  galleryGrid.style.transition = "opacity 180ms ease-out";

  setupMobileLayoutObserver();

  document.querySelectorAll(".gallery-img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    bindImageLayoutListeners(img);
  });

  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", () => {
      setTimeout(refreshPopupAndLayout, 1550);
    });
  });

  initMasonry();

  const staticImages = Array.from(galleryGrid.querySelectorAll(".gallery-img")).slice(0, 18);
  waitForImages(staticImages, 1200).then(async () => {
    applyGalleryFilter(currentFilter);
    galleryGrid.style.opacity = "1";
    await loadHideList();
    maybeLoadDynamicGallery();
  });

  document.addEventListener("page-transition-complete", (event) => {
    if (event.detail && event.detail.page === "#gallery") {
      maybeLoadDynamicGallery();
    }
  });

  window.addEventListener("hashchange", () => {
    maybeLoadDynamicGallery();
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const shouldHaveMasonry = shouldUseMasonry();
      if (shouldHaveMasonry && !masonry) {
        initMasonry();
      }
      if (!shouldHaveMasonry && masonry) {
        masonry.destroy();
        masonry = null;
        window._masonryInstance = null;
      }
      refreshPopupAndLayout();
    }, 120);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!isMobileViewport()) return;
      clearTimeout(mobileScrollLayoutTimer);
      mobileScrollLayoutTimer = setTimeout(() => {
        scheduleLayout();
      }, 90);
    },
    { passive: true },
  );

  setupPopupModal();
}

function initializeConsentManager() {
  const CONSENT_KEY = "mp_cookie_consent_v1";
  const GA_PLACEHOLDER_ID = "G-XXXXXXXXXX";
  const banner = document.getElementById("cookie-banner");
  const settingsPanel = document.getElementById("cookie-settings-panel");
  const analyticsOptIn = document.getElementById("cookie-analytics-optin");
  const acceptBtn = document.getElementById("cookie-accept");
  const rejectBtn = document.getElementById("cookie-reject");
  const saveBtn = document.getElementById("cookie-save");
  const openSettingsBtn = document.getElementById("cookie-open-settings");
  const closeSettingsBtn = document.getElementById("cookie-close-settings");

  if (!banner || !analyticsOptIn || !acceptBtn || !rejectBtn || !saveBtn) {
    return;
  }

  function syncBannerMetrics() {
    const isVisible = banner.classList.contains("is-visible");
    document.body.classList.toggle("cookie-banner-visible", isVisible);
    document.body.style.setProperty(
      "--cookie-banner-height",
      isVisible ? `${Math.ceil(banner.offsetHeight)}px` : "0px",
    );
  }

  function readConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.analytics !== "boolean") return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function writeConsent(analytics) {
    const payload = {
      essential: true,
      analytics: Boolean(analytics),
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    return payload;
  }

  function getConfiguredMeasurementId() {
    const measurementId = (window.GA_MEASUREMENT_ID || "").trim();
    if (!measurementId || measurementId === GA_PLACEHOLDER_ID) return "";
    return measurementId;
  }

  function setGaDisabledFlag(isDisabled) {
    const measurementId = getConfiguredMeasurementId();
    if (!measurementId) return;
    window[`ga-disable-${measurementId}`] = Boolean(isDisabled);
  }

  function clearCookieByName(name) {
    if (!name) return;

    const hostname = window.location.hostname || "";
    const domainVariants = [""];
    const parts = hostname.split(".").filter(Boolean);

    for (let i = 0; i <= parts.length - 2; i += 1) {
      domainVariants.push(parts.slice(i).join("."));
    }

    const uniqueDomains = Array.from(new Set(domainVariants));
    const expiry = "Thu, 01 Jan 1970 00:00:00 GMT";

    uniqueDomains.forEach((domain) => {
      const domainClause = domain ? `domain=.${domain};` : "";
      document.cookie = `${name}=; expires=${expiry}; path=/; ${domainClause} SameSite=Lax`;
    });
  }

  function clearAnalyticsCookies() {
    const cookieNames = document.cookie
      .split(";")
      .map((entry) => entry.split("=")[0].trim())
      .filter(Boolean);

    cookieNames.forEach((name) => {
      if (name === "_ga" || name.startsWith("_ga_") || name === "_gid" || name.startsWith("_gat")) {
        clearCookieByName(name);
      }
    });
  }

  function blockAnalyticsUntilConsent() {
    setGaDisabledFlag(true);
    clearAnalyticsCookies();
  }

  function loadAnalyticsIfConsented() {
    const consent = readConsent();
    if (!consent || !consent.analytics) return;

    const measurementId = getConfiguredMeasurementId();
    if (!measurementId) return;

    setGaDisabledFlag(false);

    if (window.__gaLoaded) {
      if (typeof window.gtag === "function") {
        window.gtag("config", measurementId, {
          anonymize_ip: true,
        });
      }
      return;
    }

    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
    });
  }

  function showBanner() {
    banner.classList.add("is-visible");
    syncBannerMetrics();
  }

  function hideBanner() {
    banner.classList.remove("is-visible");
    if (settingsPanel) settingsPanel.classList.remove("is-open");
    syncBannerMetrics();
  }

  const currentConsent = readConsent();
  if (!currentConsent) {
    analyticsOptIn.checked = false;
    blockAnalyticsUntilConsent();
    showBanner();
  } else {
    analyticsOptIn.checked = currentConsent.analytics;
    hideBanner();
    if (currentConsent.analytics) {
      loadAnalyticsIfConsented();
    } else {
      blockAnalyticsUntilConsent();
    }
  }

  acceptBtn.addEventListener("click", () => {
    analyticsOptIn.checked = true;
    writeConsent(true);
    hideBanner();
    loadAnalyticsIfConsented();
  });

  rejectBtn.addEventListener("click", () => {
    analyticsOptIn.checked = false;
    writeConsent(false);
    hideBanner();
    blockAnalyticsUntilConsent();
  });

  saveBtn.addEventListener("click", () => {
    const hasAnalyticsConsent = analyticsOptIn.checked;
    writeConsent(hasAnalyticsConsent);
    hideBanner();
    if (hasAnalyticsConsent) {
      loadAnalyticsIfConsented();
    } else {
      blockAnalyticsUntilConsent();
    }
  });

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
      showBanner();
      if (settingsPanel) settingsPanel.classList.add("is-open");
      syncBannerMetrics();
    });
  }

  const openSettingsBtnPolicies = document.getElementById("cookie-open-settings-policies");
  if (openSettingsBtnPolicies) {
    openSettingsBtnPolicies.addEventListener("click", () => {
      showBanner();
      if (settingsPanel) settingsPanel.classList.add("is-open");
      syncBannerMetrics();
    });
  }

  if (closeSettingsBtn && settingsPanel) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsPanel.classList.remove("is-open");
      syncBannerMetrics();
    });
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      syncBannerMetrics();
    });
    observer.observe(banner);
  }

  window.addEventListener("resize", syncBannerMetrics, { passive: true });
  syncBannerMetrics();
}

function initializeFooterLayoutState() {
  const footer = document.querySelector(".site-footer");
  const gallerySection = document.getElementById("gallery");
  const copyright = document.querySelector(".copyright");

  if (!footer) return;
  let footerVisible = false;

  function syncFooterMetrics() {
    document.body.style.setProperty("--footer-height", `${Math.ceil(footer.offsetHeight)}px`);
  }

  function syncState() {
    syncFooterMetrics();

    if (gallerySection && copyright) {
      const galleryVisible = getComputedStyle(gallerySection).display !== "none";
      const shouldHideCopyright = galleryVisible && footerVisible;
      copyright.classList.toggle("is-hidden", shouldHideCopyright);
    }
  }

  if (typeof IntersectionObserver !== "undefined") {
    const observer = new IntersectionObserver((entries) => {
      footerVisible = Boolean(entries[0] && entries[0].isIntersecting);
      syncState();
    }, { threshold: 0.02 });
    observer.observe(footer);
  }

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      syncFooterMetrics();
    });
    observer.observe(footer);
  }

  window.addEventListener("resize", syncState);
  window.addEventListener("scroll", syncState, { passive: true });
  syncState();
}

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  applyRouteVisibility(window.location.hash || "#home");
  window.addEventListener("hashchange", () => {
    if (isRouteTransitioning) return;
    applyRouteVisibility(window.location.hash || "#home");
  });

  updateCopyright(); // Update the copyright year
  initializeGallery(); // Initialize the gallery
  initializeConsentManager(); // Manage cookie consent and analytics loading
  initializeFooterLayoutState(); // Manage footer position and gallery copyright visibility
});

