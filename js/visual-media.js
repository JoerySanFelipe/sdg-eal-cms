/**
 * js/visual-media.js
 * High-impact visual components and stylistic UI elements for the UCU External Office website.
 */

/* ==========================================================================
   2. HERO & UI COMPONENTS
   ========================================================================== */

class UcuHomeHeroSlider extends HTMLElement {
  static get observedAttributes() {
    return ["images", "base-path"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal && this.hasRendered) {
      this.hasRendered = false;
      this.connectedCallback();
    }
  }

  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";

    this.hasRendered = true;

    const base = this.getAttribute("base-path") || "./";

    // Configuration for image slides (lazy loaded async)
    const imagesRaw = this.getAttribute("images");
    let imageSlides = [
      `${base}images/home-sliders/1.png`,
      `${base}images/home-sliders/2.png`,
      `${base}images/home-sliders/3.png`
    ];
    
    if (imagesRaw) {
      try {
        const parsed = JSON.parse(imagesRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          imageSlides = parsed;
        }
      } catch (e) {
        console.error("Invalid images JSON for UcuHomeHeroSlider");
      }
    }

    // Total slides = Dynamic Images
    const totalSlides = imageSlides.length;

    this.innerHTML = `
      <section style="height: calc(100dvh - 80px); min-height: 600px;" class="relative w-full overflow-hidden bg-[#0d1020] group/slider" id="hero-slider-container">
        
        ${imageSlides.map((src, i) => `
          <div class="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${i === 0 ? 'opacity-100' : 'opacity-0'} hero-slide" data-index="${i}">
            <img src="${src}" class="w-full h-full object-cover object-center hero-img" alt="UCU Campus Slide ${i + 1}" loading="lazy" decoding="async" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none"></div>
          </div>
        `).join('')}

        <div class="absolute bottom-6 w-full flex justify-center z-30 pointer-events-none">
          <div class="relative flex items-center justify-center group/nav px-16 py-4 pointer-events-auto">
            
            <button class="hero-prev absolute left-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full opacity-0 group-hover/nav:opacity-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none -translate-x-4 group-hover/nav:translate-x-0 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:bg-ucu-red hover:border-ucu-red hover:scale-105" aria-label="Previous Slide">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div class="flex items-center gap-3">
              ${Array.from({ length: totalSlides }).map((_, i) => `
                <button class="hero-indicator transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-full h-1.5 focus:outline-none shadow-sm ${i === 0 ? 'w-12 bg-ucu-yellow' : 'w-4 bg-white/40 hover:bg-white/80'}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>
              `).join('')}
            </div>

            <button class="hero-next absolute right-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full opacity-0 group-hover/nav:opacity-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none translate-x-4 group-hover/nav:translate-x-0 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:bg-ucu-red hover:border-ucu-red hover:scale-105" aria-label="Next Slide">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            
          </div>
        </div>
      </section>
    `;

    this.currentIndex = 0;
    this.totalSlides = totalSlides;
    this.slides = this.querySelectorAll('.hero-slide');
    this.indicators = this.querySelectorAll('.hero-indicator');
    this.btnPrev = this.querySelector('.hero-prev');
    this.btnNext = this.querySelector('.hero-next');

    // Event Bindings
    this.btnPrev.addEventListener('click', () => this.navigate(-1));
    this.btnNext.addEventListener('click', () => this.navigate(1));
    
    this.indicators.forEach(ind => {
      ind.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        this.goToSlide(idx);
      });
    });

    this.startAutoPlay();
  }

  navigate(direction) {
    let nextIndex = this.currentIndex + direction;
    if (nextIndex < 0) nextIndex = this.totalSlides - 1;
    if (nextIndex >= this.totalSlides) nextIndex = 0;
    this.goToSlide(nextIndex);
  }

  goToSlide(index) {
    if (index === this.currentIndex) return;
    
    this.startAutoPlay(); // Reset interval upon manual navigation

    const oldIndex = this.currentIndex;
    this.currentIndex = index;

    // Transition Slides (Pure Crossfade, Zero Movement)
    this.slides[oldIndex].classList.remove('opacity-100', 'z-10');
    this.slides[oldIndex].classList.add('opacity-0', 'z-0');
    
    this.slides[this.currentIndex].classList.remove('opacity-0', 'z-0');
    this.slides[this.currentIndex].classList.add('opacity-100', 'z-10');

    // Update Pill Indicators
    this.indicators[oldIndex].className = "hero-indicator transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-full h-1.5 focus:outline-none shadow-sm w-4 bg-white/40 hover:bg-white/80";
    this.indicators[this.currentIndex].className = "hero-indicator transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-full h-1.5 focus:outline-none shadow-sm w-12 bg-ucu-yellow";
  }

  startAutoPlay() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.navigate(1);
    }, 6000); // 6-second cycle for premium pacing
  }

  disconnectedCallback() {
    if (this.timer) clearInterval(this.timer);
  }
}

class UcuHeroBanner extends HTMLElement {
  static get observedAttributes() {
    return ['eyebrow', 'headline', 'title', 'highlight', 'description', 'subtitle', 'bg-color', 'carousel'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this.hasRendered = false;
      this.connectedCallback();
    }
  }

  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";
    this.style.position = "sticky";
    this.style.top = "0";
    this.style.zIndex = "0";

    const bgColor = this.getAttribute("bg-color") || "bg-ucu-blue";
    const eyebrow = this.getAttribute("eyebrow") || "";
    const headline =
      this.getAttribute("headline") ||
      this.getAttribute("title") ||
      "UCU External Office";
    const highlight = this.getAttribute("highlight") || "";
    const description =
      this.getAttribute("description") || this.getAttribute("subtitle") || "";
    const carouselData = this.getAttribute("carousel");

    const colorMap = {
      "bg-ucu-blue-dark": "from-ucu-blue-dark/70 via-ucu-blue-dark/20",
      "bg-ucu-red": "from-ucu-red/70 via-ucu-red/20",
      "bg-dark-red": "from-dark-red/70 via-dark-red/20",
      "bg-ucu-blue": "from-ucu-blue/70 via-ucu-blue/20",
    };
    const gradientClasses =
      colorMap[bgColor] || "from-ucu-blue/70 via-ucu-blue/20";

    const styleBlock = `
      <style>
        @keyframes ucuHeroReveal {
          0% { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .ucu-hero-reveal {
          animation: ucuHeroReveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0; 
        }
      </style>
    `;

    const eyebrowMarkup = eyebrow
      ? `<div class="mb-4 hero-fade-el"><div class="ucu-hero-reveal" style="animation-delay: 100ms;"><span class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase text-white/90 shadow-sm">${eyebrow}</span></div></div>`
      : "";

    const highlightMarkup = highlight
      ? `<span class="block text-ucu-yellow text-5xl md:text-6xl lg:text-7xl font-extrabold mt-1 md:mt-2 tracking-tighter drop-shadow-lg">${highlight}</span>`
      : "";

    const headlineMarkup = `
      <div class="hero-fade-el">
        <h1 class="text-white text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] drop-shadow-md ucu-hero-reveal" style="animation-delay: 250ms;">
          ${headline}
          ${highlightMarkup}
        </h1>
      </div>
    `;

    const descriptionMarkup = description
      ? `<div class="hero-fade-el"><p class="text-white/85 text-lg md:text-xl font-normal leading-relaxed mt-4 max-w-4xl text-balance ucu-hero-reveal" style="animation-delay: 400ms;">${description}</p></div>`
      : "";

    let carouselMarkup = "";
    if (carouselData) {
      try {
        const items = JSON.parse(carouselData);
        if (items && items.length > 0) {
          carouselMarkup = `
            <div class="relative mt-4 h-8 [perspective:800px] w-full max-w-3xl hero-fade-el">
                <div class="ucu-carousel-container ucu-hero-reveal h-full w-full" style="animation-delay: 550ms;">
                  ${items
                    .map(
                      (item, i) => `
                    <p class="carousel-text absolute left-0 w-full origin-[50%_50%_-20px] ${i === 0 ? "opacity-100 rotate-x-[0deg]" : "opacity-0 rotate-x-[90deg]"} text-left text-lg md:text-xl font-semibold tracking-wide text-ucu-yellow transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
                        ${item}
                    </p>
                  `,
                    )
                    .join("")}
                </div>
            </div>
          `;
        }
      } catch (e) {
        console.error("Invalid carousel data provided to ucu-hero-banner.");
      }
    }

    this.innerHTML = `
        ${styleBlock}
        <div class="w-full relative z-0">
            <div class="ucu-banner-container w-full h-[320px] md:h-[360px] relative overflow-hidden" style="background-color: #111827;">
              <div class="absolute inset-0 flex items-center w-full" style="
  background:
    linear-gradient(160deg, #0d1433 0%, #1a2550 30%, #24305e 55%, #1e1a40 80%, #0d1020 100%),
    radial-gradient(ellipse 100% 50% at 50% 100%, rgba(57,74,138,0.55) 0%, transparent 60%),
    radial-gradient(ellipse 50% 80% at 90% 10%, rgba(196,54,67,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 30% 40% at 10% 30%, rgba(80,100,180,0.2) 0%, transparent 60%);
  background-blend-mode: normal, screen, screen, screen;
">
                    <div class="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center font-sans relative">
                        ${eyebrowMarkup}
                        ${headlineMarkup}
                        ${descriptionMarkup}
                        ${carouselMarkup}
                    </div>
                </div>
            </div>
            <div class="absolute top-full left-0 w-full h-24 md:h-40 pointer-events-none -z-10" style="background: linear-gradient(to bottom, rgba(36,48,94,0.7), rgba(36,48,94,0.2), transparent);"></div>
        </div>
    `;

    if (carouselMarkup) {
      setTimeout(() => {
        const container = this.querySelector(".ucu-carousel-container");
        if (!container) return;
        const texts = container.querySelectorAll(".carousel-text");
        if (texts.length <= 1) return;

        let index = 0;
        setInterval(() => {
          texts[index].classList.remove("opacity-100", "rotate-x-[0deg]");
          texts[index].classList.add("opacity-0", "-rotate-x-[90deg]");

          const prevIndex = index;
          setTimeout(() => {
            texts[prevIndex].classList.remove("-rotate-x-[90deg]");
            texts[prevIndex].classList.add("rotate-x-[90deg]");
          }, 800);

          index = (index + 1) % texts.length;
          texts[index].classList.remove("opacity-0", "rotate-x-[90deg]");
          texts[index].classList.add("opacity-100", "rotate-x-[0deg]");
        }, 3500);
      }, 100);
    }

    setTimeout(() => {
      const bannerContainer = this.querySelector(".ucu-banner-container");
      const fadeEls = Array.from(this.querySelectorAll(".hero-fade-el"));

      if (!bannerContainer || fadeEls.length === 0) return;

      this.scrollHandler = () => {
        const bannerHeight = bannerContainer.offsetHeight;
        const scrollY = window.scrollY;
        const curtainY = bannerHeight - scrollY;
        const bannerRect = bannerContainer.getBoundingClientRect();

        fadeEls.forEach((el) => {
          const elRect = el.getBoundingClientRect();
          const elTop = elRect.top - bannerRect.top;
          const elHeight = elRect.height;

          const buffer = 20;
          let opacity = (curtainY - elTop + buffer) / (elHeight + buffer);

          if (opacity > 1) opacity = 1;
          if (opacity < 0) opacity = 0;

          el.style.opacity = opacity;
        });
      };

      window.addEventListener("scroll", this.scrollHandler, { passive: true });
      this.scrollHandler();
    }, 50);
  }

  disconnectedCallback() {
    if (this.scrollHandler) {
      window.removeEventListener("scroll", this.scrollHandler);
    }
  }
}

class UcuImageSlider extends HTMLElement {
  static get observedAttributes() {
    return ['images', 'duration'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this.hasRendered = false;
      this.connectedCallback();
    }
  }

  connectedCallback() {
    this.duration = parseInt(this.getAttribute("duration") || "4000", 10);
    const imagesRaw = this.getAttribute("images");
    this.images = [];
    
    if (imagesRaw) {
      try {
        this.images = JSON.parse(imagesRaw);
      } catch (e) {
        console.error("Invalid images array passed to UcuImageSlider.");
        return;
      }
    }

    if (!this.images || this.images.length === 0) return;
    this.currentIndex = 0;

    const slidesHtml = this.images.map((src, index) => `
      <div class="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out slider-slide bg-gray-100 flex items-center justify-center ${index === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}">
        <img src="${src}" alt="UCU Institutional Feature" class="w-full h-full object-cover" onerror="this.style.display='none'">
        <span class="absolute text-muted/30 font-bold uppercase tracking-widest text-xs -z-10">Image Pending</span>
      </div>
    `).join("");

    const indicatorsHtml = this.images.map((_, index) => `
      <button data-index="${index}" class="slider-indicator transition-all duration-500 ease-out rounded-full h-1.5 ${index === 0 ? 'w-8 bg-ucu-yellow' : 'w-2.5 bg-white/50 hover:bg-white/80'} focus:outline-none" aria-label="Go to slide ${index + 1}"></button>
    `).join("");

    this.innerHTML = `
      <div class="relative w-full h-full group overflow-hidden">
        ${slidesHtml}
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-20 pointer-events-none"></div>
        <button class="slider-prev absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-ucu-red backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none -translate-x-4 group-hover:translate-x-0 shadow-lg border border-white/10" aria-label="Previous Slide">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button class="slider-next absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-ucu-red backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 focus:outline-none translate-x-4 group-hover:translate-x-0 shadow-lg border border-white/10" aria-label="Next Slide">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
        <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          ${indicatorsHtml}
        </div>
      </div>
    `;

    if (this.images.length > 1) {
      this.slides = this.querySelectorAll('.slider-slide');
      this.indicators = this.querySelectorAll('.slider-indicator');
      this.btnPrev = this.querySelector('.slider-prev');
      this.btnNext = this.querySelector('.slider-next');

      this.btnPrev.addEventListener('click', () => this.goToSlide(this.currentIndex - 1));
      this.btnNext.addEventListener('click', () => this.goToSlide(this.currentIndex + 1));
      
      this.indicators.forEach(ind => {
        ind.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          this.goToSlide(idx);
        });
      });

      this.startTimer();
    }
  }

  goToSlide(index) {
    this.startTimer();
    const oldIndex = this.currentIndex;
    if (index < 0) {
      this.currentIndex = this.images.length - 1;
    } else if (index >= this.images.length) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }

    if (oldIndex === this.currentIndex) return;

    this.slides[oldIndex].classList.remove('opacity-100', 'z-10');
    this.slides[oldIndex].classList.add('opacity-0', 'z-0');
    this.slides[this.currentIndex].classList.remove('opacity-0', 'z-0');
    this.slides[this.currentIndex].classList.add('opacity-100', 'z-10');

    this.indicators[oldIndex].className = "slider-indicator transition-all duration-500 ease-out rounded-full h-1.5 w-2.5 bg-white/50 hover:bg-white/80 focus:outline-none";
    this.indicators[this.currentIndex].className = "slider-indicator transition-all duration-500 ease-out rounded-full h-1.5 w-8 bg-ucu-yellow focus:outline-none";
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.goToSlide(this.currentIndex + 1);
    }, this.duration);
  }
  
  disconnectedCallback() {
    if (this.timer) clearInterval(this.timer);
  }
}

class UcuMetricCards extends HTMLElement {
  static get observedAttributes() {
    return ["data-metrics"];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === "data-metrics" && oldVal !== newVal) {
      this.connectedCallback();
    }
  }

  connectedCallback() {
    this.hasRendered = true;

    let metricsData = this.getAttribute("data-metrics");
    if (!metricsData) return;

    let metrics = [];
    try {
      if (typeof metricsData === 'string') {
        if (metricsData.includes("%5B") || metricsData.includes("%7B") || metricsData.startsWith("%")) {
          metricsData = decodeURIComponent(metricsData);
        }
        if (metricsData.includes("&quot;")) {
          metricsData = metricsData.replace(/&quot;/g, '"');
        }
        metrics = JSON.parse(metricsData);
      }
    } catch (e) {
      try {
        metrics = JSON.parse(decodeURIComponent(metricsData));
      } catch (e2) {
        console.error("Invalid metrics data in UcuMetricCards:", e, metricsData);
        return;
      }
    }

    if (!Array.isArray(metrics) || metrics.length === 0) return;

    const themeStyles = {
      navy: { 
        bg: "bg-ucu-blue-dark text-white shadow-md border border-white/5", 
        value: "!text-white", 
        label: "!text-white/90", 
        icon: "!text-ucu-yellow" 
      },
      blue: { 
        bg: "bg-ucu-blue-dark text-white shadow-md border border-white/5", 
        value: "!text-white", 
        label: "!text-white/90", 
        icon: "!text-ucu-yellow" 
      },
      red: { 
        bg: "bg-ucu-red text-white shadow-md border border-white/5", 
        value: "!text-white", 
        label: "!text-white/90", 
        icon: "!text-ucu-yellow" 
      },
      yellow: { 
        bg: "bg-ucu-yellow text-ucu-blue-dark shadow-md border border-black/5", 
        value: "!text-ucu-blue-dark", 
        label: "!text-ucu-blue-dark/90", 
        icon: "!text-ucu-red" 
      },
      white: { 
        bg: "bg-white text-ucu-blue-dark border border-slate-100 shadow-md", 
        value: "!text-ucu-blue-dark", 
        label: "!text-slate-600", 
        icon: "!text-ucu-red" 
      },
    };

    const defaultIcons = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>`
    ];

    const getGridClass = (count) => {
      if (count === 1) return "grid-cols-1";
      if (count === 2) return "grid-cols-2";
      if (count === 3) return "grid-cols-1 md:grid-cols-3";
      if (count === 4) return "grid-cols-2 md:grid-cols-4";
      if (count === 5) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
      if (count === 6) return "grid-cols-2 md:grid-cols-3 lg:grid-cols-6";
      return "grid-cols-1 md:grid-cols-3";
    };

    const cardsHtml = metrics.map((metric, idx) => {
      const activeTheme = metric.theme || "navy";
      const styles = themeStyles[activeTheme] || themeStyles.navy;
      
      // CMS Direct Value (No automated math or system link overrides)
      const displayValue = (metric.value !== undefined && metric.value !== null && metric.value !== "")
        ? String(metric.value)
        : "0";

      const hasTrigger = !!metric.evidenceId;
      const tagName = hasTrigger ? "button" : "div";
      const extraAttrs = hasTrigger ? `type="button" data-modal-trigger="${metric.evidenceId}"` : "";
      const hoverClasses = hasTrigger ? "cursor-pointer text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ucu-red focus-visible:ring-offset-2" : "";

      const valueSizeClass = displayValue.length > 8 ? "text-xl md:text-2xl" : "text-3xl md:text-4xl";
      
      // Dynamic Lucide Icon Resolution
      let iconSvg = '';
      const iconKey = metric.icon || metric.iconName;
      if (iconKey && window.lucide) {
        const raw = String(iconKey).trim();
        const kebab = raw.replace(/([a-z0-9])([A-Z])/g, (m, a, b) => a + '-' + b).toLowerCase();
        const pascal = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);
        
        const sources = [window.lucide.icons, window.lucide];
        let def = null;
        for (const src of sources) {
          if (!src) continue;
          if (src[raw]) { def = src[raw]; break; }
          if (src[pascal]) { def = src[pascal]; break; }
          if (src[kebab]) { def = src[kebab]; break; }
          if (src[camel]) { def = src[camel]; break; }
        }

        if (Array.isArray(def)) {
          const inner = def.map(([tag, attrs]) => {
            const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
            return `<${tag} ${attrStr}/>`;
          }).join('');
          iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
        } else if (def && typeof def.toSvg === 'function') {
          iconSvg = def.toSvg({ width: 28, height: 28, 'stroke-width': 2 });
        }
      }

      if (!iconSvg) {
        iconSvg = (metric.svgIcon && typeof metric.svgIcon === 'string' && metric.svgIcon.includes('<svg'))
          ? metric.svgIcon
          : defaultIcons[idx % defaultIcons.length];
      }

      // Ensure SVG stroke adapts to current theme icon color
      if (iconSvg && typeof iconSvg === 'string') {
        iconSvg = iconSvg.replace(/stroke="(?!(none|currentColor))[^"]+"/gi, 'stroke="currentColor"');
      }

      return `
        <${tagName} ${extraAttrs} class="${styles.bg} rounded-2xl p-6 shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-center min-h-[140px] group ${hoverClasses}">
          <div class="flex items-center gap-2 mb-3 text-2xl ${styles.icon} transition-transform duration-300 group-hover:scale-110">${iconSvg}</div>
          <div class="${valueSizeClass} font-black tracking-tight leading-none ${styles.value} ucu-counter mb-2" data-target="${displayValue}">${displayValue}</div>
          <div class="${styles.label} text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] leading-tight">${metric.label || ''}</div>
        </${tagName}>
      `;
    }).join("");

    const gridClass = this.getAttribute("grid-class") || getGridClass(metrics.length);
    this.innerHTML = `<div class="w-full grid gap-4 md:gap-6 ${gridClass}">${cardsHtml}</div>`;

    this.initCounterAnimations();
  }

  initCounterAnimations() {
    const counters = this.querySelectorAll('.ucu-counter');
    if (!counters.length) return;

    const isIframe = window.self !== window.top || window.location.search.includes('cms_preview=true') || window.location.search.includes('preview=true');
    if (isIframe || !('IntersectionObserver' in window)) {
      counters.forEach(c => {
        const targetStr = c.getAttribute('data-target') || c.textContent;
        c.textContent = targetStr;
      });
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetStr = el.getAttribute('data-target') || el.textContent;
          obs.unobserve(el);
          this.animateNumber(el, targetStr);
        }
      });
    }, { threshold: 0.01 });

    counters.forEach(c => observer.observe(c));
  }

  animateNumber(element, targetStr, duration = 1200) {
    const cleanStr = String(targetStr).trim();
    const match = cleanStr.match(/^([^0-9.]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
    if (!match) {
      element.textContent = cleanStr;
      return;
    }

    const prefix = match[1];
    const targetNum = parseFloat(match[2].replace(/,/g, ''));
    const suffix = match[3];
    const isFloat = match[2].includes('.');

    const startTime = performance.now();
    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentNum = isFloat ? (targetNum * easeOut).toFixed(1) : Math.round(targetNum * easeOut);
      element.textContent = `${prefix}${currentNum.toLocaleString()}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = cleanStr;
      }
    };
    requestAnimationFrame(step);
  }
}

// --- NEW: Inline Metric Injector ---
class UcuMetric extends HTMLElement {
  connectedCallback() {
    const id = this.getAttribute("id");
    if (id && window.UCU_METRICS && window.UCU_METRICS[id] !== undefined) {
      this.textContent = window.UCU_METRICS[id];
    } else {
      this.textContent = this.getAttribute("fallback") || "0";
      console.warn(`[UCU Architecture] Metric ID '${id}' not found in registry.`);
    }
    this.style.display = "inline";
    this.style.fontWeight = "inherit"; // Respect parent typography
  }
}

/* ==========================================================================
   4. COMPONENT REGISTRATION
   ========================================================================== */

if (!customElements.get("ucu-home-hero-slider")) customElements.define("ucu-home-hero-slider", UcuHomeHeroSlider);
if (!customElements.get("ucu-hero-banner")) customElements.define("ucu-hero-banner", UcuHeroBanner);
if (!customElements.get("ucu-image-slider")) customElements.define("ucu-image-slider", UcuImageSlider);
if (!customElements.get("ucu-metric-cards")) customElements.define("ucu-metric-cards", UcuMetricCards);
if (!customElements.get("ucu-metric")) customElements.define("ucu-metric", UcuMetric);