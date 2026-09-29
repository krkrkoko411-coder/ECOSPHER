/* ============================================================
   EcoSphere — Technology for a Greener Tomorrow
   script.js · Vanilla JavaScript · no dependencies
   ------------------------------------------------------------
   01 Utilities            08 Agriculture advisor
   02 Theme engine         09 Transportation explorer
   03 Navigation           10 Eco Tips
   04 Reveal & counters    11 Climate Challenge quiz
   05 Expandable cards     12 Arabic section (RTL)
   06 Dashboard simulation 13 Misc
   ============================================================ */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     01 UTILITIES
     ---------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Count a number up (or down) to its target value. */
  function animateNumber(el, to, options) {
    const opts = options || {};
    const duration = opts.duration || 1300;
    const suffix = opts.suffix || "";
    const from = typeof opts.from === "number" ? opts.from : 0;
    if (prefersReducedMotion()) { el.textContent = String(to) + suffix; return; }
    const start = performance.now();
    function frame(now) {
      const p = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(from + (to - from) * eased)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /** Build an inline <svg><use> icon string. */
  function icon(id, cls) {
    return '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#' + id + '"></use></svg>';
  }

  /** Smoothly bring an element into view, degrading gracefully if unsupported. */
  function scrollToEl(el, block) {
    if (!el || typeof el.scrollIntoView !== "function") return;
    try { el.scrollIntoView({ block: block || "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" }); }
    catch (e) { el.scrollIntoView(); }
  }

  /* ----------------------------------------------------------
     02 THEME ENGINE + PERSISTENCE
     ---------------------------------------------------------- */
  const Theme = (function () {
    const KEY = "ecosphere-theme";
    const root = document.documentElement;
    const toggle = $("#themeToggle");
    let current = "light";

    function read() {
      try {
        const saved = localStorage.getItem(KEY);
        if (saved === "light" || saved === "dark") return saved;
      } catch (e) { /* storage blocked — fall back to system preference */ }
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark" : "light";
    }

    function apply(theme) {
      current = theme === "dark" ? "dark" : "light";
      root.setAttribute("data-theme", current);
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", current === "dark" ? "#0a0d14" : "#10a36d");
      if (!toggle) return;
      const dark = current === "dark";
      toggle.setAttribute("aria-pressed", dark ? "true" : "false");
      toggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    }

    function init() {
      apply(read());
      if (toggle) {
        toggle.addEventListener("click", function () {
          const next = current === "dark" ? "light" : "dark";
          apply(next);
          try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
        });
      }
    }

    return { init: init, get: function () { return current; } };
  })();

  /* ----------------------------------------------------------
     03 NAVIGATION — mobile menu, smooth scroll, scrollspy
     ---------------------------------------------------------- */
  const Nav = (function () {
    const header = $("#siteHeader");
    const nav = $("#siteNav");
    const navToggle = $("#navToggle");
    const overlay = $("#navOverlay");
    const links = $$("[data-nav]");
    const progress = $("#scrollBar");
    const toTop = $("#toTop");
    const targets = ["home", "climate", "calculator", "technology",
      "agriculture", "transportation", "tips", "challenge", "about", "arabic"];

    function setMenu(open) {
      if (!nav || !navToggle) return;
      nav.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (overlay) {
        if (open) {
          overlay.hidden = false;
          requestAnimationFrame(function () { overlay.classList.add("is-open"); });
        } else {
          overlay.classList.remove("is-open");
          setTimeout(function () { overlay.hidden = true; }, 300);
        }
      }
      document.body.classList.toggle("is-locked", open);
    }
    function closeMenu() { setMenu(false); }

    function smoothTo(target) {
      const headerH = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 12;
      window.scrollTo({ top: Math.max(top, 0), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }

    function spy(y) {
      const line = y + (header ? header.offsetHeight : 0) + 130;
      let active = targets[0];
      targets.forEach(function (id) {
        const sec = document.getElementById(id);
        if (sec && sec.offsetTop <= line) active = id;
      });
      links.forEach(function (l) {
        const on = l.getAttribute("data-nav") === active;
        l.classList.toggle("is-active", on);
        const side = $('.side-link[href="#' + active + '"]');
        if (side) side.classList.toggle("is-active", on);
      });
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const y = window.pageYOffset || document.documentElement.scrollTop;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.width = (docH > 0 ? clamp((y / docH) * 100, 0, 100) : 0) + "%";
        if (header) header.classList.toggle("is-stuck", y > 8);
        if (toTop) {
          toTop.hidden = false;
          toTop.classList.toggle("is-shown", y > 520);
        }
        spy(y);
        ticking = false;
      });
    }

    function init() {
      if (overlay) overlay.addEventListener("click", closeMenu);

      // Smooth in-page navigation (nav, footer, CTAs)
      document.addEventListener("click", function (e) {
        const anchor = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
        if (!anchor) return;
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        smoothTo(target);
        if (history.replaceState) history.replaceState(null, "", id);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav && nav.classList.contains("is-open")) closeMenu();
      });

      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      if (toTop) {
        toTop.addEventListener("click", function () {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
        });
      }
    }

    return { init: init, close: closeMenu };
  })();

  /* ----------------------------------------------------------
     04 SCROLL REVEAL + COUNTERS + PROGRESS VISUALS
     ---------------------------------------------------------- */
  const Reveal = (function () {
    function animateWithin(scope) {
      $$(".counter[data-count-to]", scope).forEach(function (c) {
        if (c.dataset.done === "1") return;
        c.dataset.done = "1";
        animateNumber(c, Number(c.getAttribute("data-count-to")) || 0, { duration: 1500 });
      });
    }

    function init() {
      const items = $$(".reveal");
      if (!("IntersectionObserver" in window)) {
        items.forEach(function (el) { el.classList.add("is-visible"); animateWithin(el); });
        return;
      }
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.classList.add("is-visible");
          io.unobserve(el);
          const parent = el.parentElement;
          if (parent) {
            const idx = Array.prototype.indexOf.call(parent.children, el);
            el.style.transitionDelay = Math.min(Math.max(idx, 0), 6) * 70 + "ms";
            setTimeout(function () { el.style.transitionDelay = ""; }, 1000);
          }
          animateWithin(el);
        });
      }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });
      items.forEach(function (el) { io.observe(el); });
    }

    return { init: init };
  })();

  /* ----------------------------------------------------------
     05A CLIMATE TOPICS — full independent articles per card
     Rendered into each "Learn more" panel.
     ---------------------------------------------------------- */
  const TOPICS = [
    {
      id: "cc-0",
      lead: "Climate change is the long-term shift in the average conditions we call weather, measured over decades rather than days. The IPCC concluded that human activities, principally through greenhouse gas emissions, have unequivocally caused global warming.",
      blocks: [
        {
          h: "What it actually is",
          p: "Weather is what the sky does today. Climate is what the averages look like over roughly thirty years. That distinction matters: a single cold winter says nothing about climate, but a thirty-year average that drifts upward says everything."
        },
        {
          h: "How it works",
          list: [
            "Sunlight enters the atmosphere and warms the surface, which then re-radiates energy upward as infrared heat.",
            "Greenhouse gases in the atmosphere absorb part of that outgoing heat and re-emit it in all directions, slowing the loss to space.",
            "Human activity adds greenhouse gases — mainly carbon dioxide from burning coal, oil and gas — so more heat is retained than leaves.",
            "The extra energy has to accumulate somewhere, and it accumulates in the ocean, the land and the ice."
          ]
        },
        {
          h: "What the science measures",
          facts: [
            { v: "+1.1°C", t: "rise in global surface temperature between 1850–1900 and 2011–2020.", s: "IPCC AR6 · A.1" },
            { v: "Every region", t: "climate change is already affecting weather and climate extremes across the globe.", s: "IPCC AR6 · A.2" },
            { v: "193", t: "governments that approved the Sixth Assessment Report line by line.", s: "IPCC AR6" }
          ]
        },
        {
          h: "Why it is not only about temperature",
          p: "The IPCC reports that vulnerable communities who have contributed the least to current climate change are disproportionately affected, and that climate risks and projected impacts escalate with every increment of warming. Climate change is therefore a fairness problem as much as a physical one."
        },
        {
          h: "Where technology helps",
          p: "Sensors and satellites turn a slow planetary trend into something measurable rather than anecdotal. Attribution science compares observed changes against model simulations to work out which event was made more likely by warming, and forecasting software turns that record into warnings that arrive early enough to be useful."
        }
      ],
      topics: "Greenhouse gases · Carbon cycle · Attribution science · Climate models · Feedback loops"
    },
    {
      id: "cc-1",
      lead: "Global warming is the specific, measurable rise in Earth's average surface temperature — the central physical expression of climate change, and the quantity that most scientists report on.",
      blocks: [
        {
          h: "Why a baseline is needed",
          p: "A temperature is meaningless without a reference point. The IPCC uses 1850–1900 as the pre-industrial baseline, which is the closest global period before large-scale industrial fuel burning. Every warming figure you read is a difference measured against some baseline, and the honest way to state one is to name the baseline alongside it."
        },
        {
          h: "Where the extra heat goes",
          p: "Land and air warm quickly, but the ocean dominates: it absorbs the large majority of the excess heat and holds it for centuries. This is why atmospheric temperature rises more slowly than total energy accumulation — and why the ocean, not the air, is where much of the long-term warming is stored. The IPCC reports widespread and rapid changes in the atmosphere, ocean, cryosphere and biosphere."
        },
        {
          h: "The 1.5°C and 2°C conversation",
          list: [
            "Best-estimate warming reaches 1.5°C in the near term in the considered scenarios and modelled pathways.",
            "Every additional increment of global warming intensifies multiple and concurrent hazards at the same time.",
            "Emissions implied by current national pledges make it likely that warming will exceed 1.5°C this century and harder to limit below 2°C.",
            "Deep, rapid and sustained reductions would slow warming discernibly within around two decades, and change atmospheric composition within a few years."
          ]
        },
        {
          h: "The scale of what is still to come",
          p: "The IPCC is explicit that for any given future warming level, many climate-related risks are higher than assessed previously, and that projected long-term impacts are up to multiple times higher than currently observed. Warming is not a threshold to be crossed once; it is a dial that turns every risk up together."
        },
        {
          h: "Where technology helps",
          p: "Monitoring networks establish the record, climate models project forward, and mitigation technologies change the energy that produces the warming in the first place. The IPCC notes that feasible, effective and low-cost options for mitigation and adaptation are already available — the constraint is deployment, not invention."
        }
      ],
      topics: "Baseline periods · Surface temperature · Ocean heat content · Ice-sheet loss · Thermal inertia"
    },
    {
      id: "cc-2",
      lead: "Climate change does not create storms — it changes the odds. The IPCC finds that human-caused climate change is already affecting many weather and climate extremes in every region across the globe, with high confidence.",
      blocks: [
        {
          h: "What counts as an extreme",
          p: "An extreme is an event that is rare for a particular place but not impossible — a heatwave that would have been extraordinary fifty years ago, a rainfall total that overwhelms drainage, a drought that lasts several seasons. The event itself is always possible; what changes is how often it happens and how strong it gets."
        },
        {
          h: "The main types",
          list: [
            "Heatwaves — prolonged high temperatures, often the deadliest hazard in many regions.",
            "Drought — extended periods of low rainfall, which interact with heat to dry soils and reservoirs.",
            "Extreme rainfall — heavier downpours that overwhelm drainage and flood infrastructure.",
            "Tropical cyclones — the science shows that warmer oceans support more intense storms, though the influence on total storm numbers is more complex.",
            "Cold and dry spells — extremes in every direction, not only towards warmth."
          ]
        },
        {
          h: "Why a warmer world changes the dice",
          p: "A warmer atmosphere holds more moisture, so when that moisture condenses it releases more energy. The same storm therefore carries more potential rainfall. Warmer air also changes circulation patterns, which reshapes where heat, drought and rain are concentrated. This is why scientists speak of shifts in frequency and intensity rather than a simple multiplication of storms."
        },
        {
          h: "Warning is the technology that matters most",
          p: "The difference between a disaster and an inconvenience is often measured in hours of lead time. Multi-hazard early warning systems combine detection, forecasting and communication into a single chain: sensors and satellites observe, models predict, and the message reaches the people who can act before the event arrives rather than after."
        },
        {
          h: "Where technology helps",
          p: "Numerical weather prediction, satellite monitoring, radar networks and cheap IoT sensors have all widened the area that can be watched. The IPCC also notes that mitigation delivers co-benefits for air quality and health — cleaner energy reduces both greenhouse gases and the pollution that accompanies combustion."
        }
      ],
      topics: "Heatwaves · Drought · Extreme rainfall · Tropical cyclones · Early-warning systems"
    },
    {
      id: "cc-3",
      lead: "Water stress is the state in which demand for water outstrips reliable supply. It is not always a shortage of water — sometimes the water is there but is the wrong quality, or arrives at the wrong time of year.",
      blocks: [
        {
          h: "Three different faces of the same problem",
          list: [
            "Physical scarcity — the basin simply does not contain enough water to meet demand.",
            "Quality scarcity — pollution makes technically available water unsafe or unusable.",
            "Timing scarcity — the water exists, but seasonal supply no longer matches when people need it."
          ]
        },
        {
          h: "How climate change alters the water cycle",
          p: "Warming intensifies evaporation from oceans, lakes and soil, and changes where rain falls. The result is not simply drier — it is less predictable. Many regions receive more total rainfall concentrated into shorter, heavier events, which means wetter flood seasons followed by longer dry spells. Mountain snowpack and glaciers store water seasonally and release it as melt; when that store shrinks, the smoothing effect that rivers depend on weakens."
        },
        {
          h: "The water–energy link",
          p: "Water and energy are bound together. Power stations need water for cooling, and pumping, filtering and moving water consumes electricity. When both are constrained at once, as happens in droughts, the effect is worse than either shortage alone. Managing one without seeing the other is why integrated planning matters."
        },
        {
          h: "Groundwater: invisible and slow",
          p: "Aquifers are often the first source cities turn to in dry periods, and the least visible. Water can be extracted faster than it recharges, and because groundwater is out of sight, over-draw is easy to miss until the wells themselves fail. Monitoring boreholes and modelling recharge is therefore a form of climate adaptation."
        },
        {
          h: "Where technology helps",
          list: [
            "Soil-moisture sensors and smart irrigation deliver water according to crop and soil condition instead of a fixed calendar.",
            "Leak-detection sensors and smart meters surface losses that would otherwise go unnoticed for months.",
            "Satellite monitoring tracks snowpack, river flow and groundwater storage at regional scale.",
            "Reuse, rainwater harvesting and desalination add supply without adding extraction from the same basin."
          ]
        }
      ],
      topics: "Water scarcity · Aquifers · Glaciers and snowpack · Floods and droughts · Desalination"
    },
    {
      id: "cc-4",
      lead: "Energy consumption is the total energy a system uses to deliver a service — heating a home, moving a vehicle, processing a tonne of steel. The IPCC tracks greenhouse gas emissions by sector: energy supply, industry, agriculture, land use, transport and buildings.",
      blocks: [
        {
          h: "Energy is not the same as electricity",
          p: "Most energy is used as heat, not as electricity. Electric vehicles, heat pumps and induction heating are efficient partly because they move energy into the category where it is easiest to deliver cleanly, using a grid that increasingly runs on variable renewable sources. Efficiency and electrification are therefore related strategies rather than alternatives."
        },
        {
          h: "Two sides of the same problem",
          list: [
            "Supply — how energy is generated: solar, wind, hydro, nuclear, geothermal or fossil fuels.",
            "Demand — how much energy is needed for the same outcome, which is what efficiency addresses.",
            "Demand that can be shifted in time — using less at peak and more when renewables are generating."
          ]
        },
        {
          h: "Efficiency: the same service for less energy",
          p: "An efficient appliance is not one that does less, but one that wastes less in performing the same task. The IPCC reports that policies and laws addressing mitigation have consistently expanded, and that rapid and far-reaching transitions across all sectors are necessary to achieve deep and sustained emissions reductions. It also finds that sufficient global capital exists to close the investment gaps — the barrier is how quickly that capital is directed, not its absence."
        },
        {
          h: "The problem variable energy creates",
          p: "Solar panels generate at noon and not at night; wind output changes with the weather. A grid that mixes large amounts of both has to balance supply and demand continuously. That is what makes smart grids, storage, interconnectors and demand-response systems central rather than optional: without flexibility, clean generation cannot be used at the moment it is needed."
        },
        {
          h: "Where technology helps",
          p: "Smart meters and energy dashboards make consumption visible, which is the precondition for every efficiency gain. Building-management systems tune lighting, heating and cooling to real occupancy. Forecasting software predicts renewable output so storage can be charged in advance. The IPCC highlights that enhancing technology innovation systems is key to accelerating widespread adoption."
        }
      ],
      topics: "Fossil fuels · Renewable energy · Electrification · Energy efficiency · Grid storage"
    },
    {
      id: "cc-5",
      lead: "Pollution is contamination of air, water or soil by substances that cause harm to health or ecosystems. It shares both causes and consequences with climate change: the same combustion that emits carbon dioxide also emits particulates and nitrogen oxides.",
      blocks: [
        {
          h: "The main agents",
          list: [
            "Air — fine particulate matter, nitrogen oxides, sulphur dioxide, ground-level ozone, volatile organic compounds and toxic metals.",
            "Water — nutrients that cause eutrophication, pathogens, heavy metals, plastics, pharmaceuticals and industrial chemicals.",
            "Soil — pesticides, heavy metals, hydrocarbons and persistent organic pollutants that remain for years."
          ]
        },
        {
          h: "Health is the strongest argument",
          p: "The IPCC states that deep, rapid and sustained mitigation would deliver co-benefits, especially for air quality and health. This is a genuine and immediate benefit: cleaner energy reduces greenhouse gases and the particulates released by the same combustion. It also notes that options for reducing emission-intensive consumption, including behavioural and lifestyle changes, exist alongside technical ones."
        },
        {
          h: "Ocean acidification: the link to climate",
          p: "About a quarter of the carbon dioxide released by human activity dissolves into the ocean. It reacts with seawater to form carbonic acid, lowering pH and reducing the carbonate ions that shell-forming organisms such as corals and some plankton need. This is a different process from warming, but it is driven by the same emissions, which is why the two are usually discussed together."
        },
        {
          h: "Why monitoring is the first step",
          p: "Pollution is often invisible until it causes harm, and the source is frequently far from where it is detected. Air-quality networks, low-cost sensors, satellite instruments and remote sensing turn an unmeasured problem into a measured one. The IPCC notes that enhanced access to finance and technology is a critical enabler of climate action, which applies equally to monitoring pollution."
        },
        {
          h: "Where technology helps",
          list: [
            "Emission controls, filters and scrubbers reduce releases at the source rather than treating symptoms.",
            "Satellite and ground monitoring identifies pollution sources that would otherwise be misattributed.",
            "Circular design and material tracking reduce waste at the point it is created.",
            "The IPCC highlights equity and climate justice as central: prioritising them improves outcomes for the people most exposed."
          ]
        }
      ],
      topics: "Air quality · Ocean acidification · Plastic waste · Soil degradation · Public health"
    }
  ];

  /* Render each topic as a full article inside its "Learn more" panel. */
  function renderTopic(t) {
    let html = '<article class="topic-article">';
    html += '<p class="topic-lead">' + t.lead + "</p>";
    t.blocks.forEach(function (b) {
      html += '<section class="topic-block"><h4>' + b.h + "</h4>";
      if (b.p) html += "<p>" + b.p + "</p>";
      if (b.list) {
        html += "<ul>";
        b.list.forEach(function (li) { html += '<li>' + icon("i-check") + "<span>" + li + "</span></li>"; });
        html += "</ul>";
      }
      if (b.facts) {
        html += '<ul class="topic-facts">';
        b.facts.forEach(function (f) {
          html += "<li><strong>" + f.v + "</strong><span>" + f.t +
            '</span><em class="topic-cite">' + f.s + "</em></li>";
        });
        html += "</ul>";
      }
      html += "</section>";
    });
    html += '<footer class="topic-foot"><span class="topic-label">Key topics</span>' +
      '<span class="topic-list">' + t.topics + "</span></footer>";
    html += "</article>";
    return html;
  }

  const Expandables = (function () {
    function close(card) {
      card.classList.remove("is-open");
      card.setAttribute("data-open", "false");
      const btn = $(".card-more", card);
      if (btn) btn.setAttribute("aria-expanded", "false");
      const d = $(".card-detail", card);
      if (d) d.hidden = true;
    }

    function open(card) {
      const grid = card.parentElement;
      if (grid) $$(".is-open", grid).forEach(function (other) {
        if (other !== card) close(other);
      });
      card.classList.add("is-open");
      card.setAttribute("data-open", "true");
      const btn = $(".card-more", card);
      if (btn) {
        btn.setAttribute("aria-expanded", "true");
        btn.setAttribute("aria-controls", card.getAttribute("data-cc") || "");
      }
      const d = $(".card-detail", card);
      if (d) {
        d.hidden = false;
        if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(d);
      }
    }

    function init() {
      // fill the climate topic panels with their full articles
      TOPICS.forEach(function (t) {
        const panel = document.getElementById(t.id);
        if (panel) panel.innerHTML = renderTopic(t);
      });

      // climate cards: whole card is clickable, inner button is the a11y control
      $$(".climate-card").forEach(function (card) {
        card.setAttribute("data-open", "false");
        card.addEventListener("click", function () {
          if (card.classList.contains("is-open")) close(card); else open(card);
        });
      });

      // green-technology cards keep their existing short detail panels
      $$(".tech-card").forEach(function (card) {
        const detail = $(".card-detail", card);
        if (!detail) return;
        card.setAttribute("data-open", "false");
        const more = $(".card-more", card);
        if (more) {
          more.setAttribute("type", "button");
          more.setAttribute("aria-expanded", "false");
          more.setAttribute("aria-controls", card.getAttribute("data-tc") || "");
        }
        card.addEventListener("click", function () {
          if (card.classList.contains("is-open")) close(card); else open(card);
        });
      });
    }
    return { init: init };
  })();



  /* ----------------------------------------------------------
     06 CLIMATE FACTS (verified — no invented data)
     ---------------------------------------------------------- */
  const FACTS = [
    {
      value: "+1.1°C", note: "Global surface temperature, 2011–2020 vs the 1850–1900 baseline.",
      src: "IPCC AR6 · A.1"
    },
    {
      value: "1.5°C", note: "Best-estimate warming level reached in the near term in considered scenarios.",
      src: "IPCC AR6 · B.1"
    },
    {
      value: "193", note: "Member governments that approved the IPCC Sixth Assessment Report line by line.",
      src: "IPCC AR6 · 2023"
    },
    {
      value: "2 decades", note: "Time for deep, rapid, sustained emissions cuts to slow warming discernibly.",
      src: "IPCC AR6 · B.1"
    },
    {
      value: "1 year", note: "Time for those same cuts to change atmospheric composition discernibly.",
      src: "IPCC AR6 · B.1"
    },
    {
      value: "Every region", note: "Climate change is already affecting weather and climate extremes everywhere.",
      src: "IPCC AR6 · A.2"
    }
  ];

  const Facts = (function () {
    function init() {
      const grid = $("#factGrid");
      if (!grid) return;
      grid.innerHTML = FACTS.map(function (f, i) {
        return '<article class="fact-card reveal" style="transition-delay:' + (i * 60) + 'ms">' +
          '<p class="fact-value">' + f.value + "</p>" +
          '<p class="fact-text">' + f.note + "</p>" +
          '<p class="fact-cite">' + f.src + "</p>" +
          "</article>";
      }).join("");
      requestAnimationFrame(function () {
        $$(".fact-card", grid).forEach(function (c) { c.classList.add("is-visible"); });
      });
    }
    return { init: init };
  })();


  /* ----------------------------------------------------------
     07 ECO CALCULATOR — score engine + recommendations
     ---------------------------------------------------------- */
  const Calculator = (function () {
    const RING = 2 * Math.PI * 86; // radius 86
    const WEIGHTS = { energy: 0.34, water: 0.18, transport: 0.22, waste: 0.14, habits: 0.12 };
    const REQUIRED = ["electricity", "devices", "water", "transport", "frequency", "recycling", "habits"];

    function readAnswers() {
      const form = $("#ecoForm");
      const out = {};
      if (!form) return out;
      $$("input[type=radio]:checked", form).forEach(function (input) {
        out[input.name] = input.value;
      });
      return out;
    }

    /** Split the answers into the five profile dimensions (0–100 each). */
    function scoreProfile(a) {
      const electricity = { low: 92, medium: 68, high: 38 }[a.electricity] || 60;
      const devices = { "1": 94, "3": 70, "5": 40 }[a.devices] || 60;
      const water = { low: 94, medium: 66, high: 32 }[a.water] || 60;
      const mode = { walk: 98, public: 78, ev: 68, fuel: 34 }[a.transport] || 60;
      const freq = { rare: 92, normal: 66, often: 38 }[a.frequency] || 60;
      const transport = Math.round(mode * 0.7 + freq * 0.3);
      const waste = { good: 94, some: 62, low: 28 }[a.recycling] || 60;
      const habits = { always: 94, often: 66, rare: 30 }[a.habits] || 60;
      return {
        energy: Math.round(electricity * 0.62 + devices * 0.38),
        water: water, transport: transport, waste: waste, habits: habits
      };
    }

    function overall(p) {
      const raw =
        p.energy * WEIGHTS.energy + p.water * WEIGHTS.water +
        p.transport * WEIGHTS.transport + p.waste * WEIGHTS.waste +
        p.habits * WEIGHTS.habits;
      return clamp(Math.round(raw), 0, 100);
    }

    function profileText(score) {
      if (score >= 82) return "Outstanding — your habits are already highly resource-efficient. Keep refining them and share what works.";
      if (score >= 66) return "Strong foundation — you already do a lot right, with clear room to improve efficiency further.";
      if (score >= 48) return "Balanced profile — a good baseline that can grow with a few targeted changes.";
      if (score >= 30) return "Developing profile — your current profile shows opportunities to improve energy efficiency.";
      return "Starting point — every journey begins somewhere; small changes now build lasting habits.";
    }

    /** Build dynamic, non-judgemental recommendations from the answers. */
    function buildRecs(a) {
      const recs = [];
      if (a.electricity === "high" || a.devices === "5") {
        recs.push({ tag: "Energy", icon: "i-bolt",
          text: "Your current profile shows opportunities to improve energy efficiency. Switch off or unplug idle devices, and choose energy-efficient products when you replace appliances." });
      }
      if (a.electricity === "low" && a.devices === "1") {
        recs.push({ tag: "Energy", icon: "i-star",
          text: "Your energy profile is strong. A smart plug or power meter helps you confirm that low usage stays low over time." });
      }
      if (a.water === "high") {
        recs.push({ tag: "Water", icon: "i-drop",
          text: "Consider smart water management: shorter showers, a low-flow shower head, and a simple meter or leak sensor to spot wasted water early." });
      }
      if (a.water === "low") {
        recs.push({ tag: "Water", icon: "i-check",
          text: "Your water habits are already efficient. Collecting rainwater for plants extends that habit at almost no cost." });
      }
      if (a.transport === "fuel" || a.frequency === "often") {
        recs.push({ tag: "Transport", icon: "i-bus",
          text: "For part of your regular journeys, consider sustainable transportation: public transport, cycling, walking, or an electric vehicle for longer distances." });
      }
      if (a.transport === "walk" || a.transport === "public") {
        recs.push({ tag: "Transport", icon: "i-bike",
          text: "Strong transport choice. A route-planning app can help you keep picking the lowest-impact option for each trip." });
      }
      if (a.recycling === "low" || a.recycling === "some") {
        recs.push({ tag: "Waste", icon: "i-recycle",
          text: "Improve recycling habits by starting with the easiest streams where you live — paper, plastic and metal — then add glass and textiles." });
      }
      if (a.habits === "rare") {
        recs.push({ tag: "Habits", icon: "i-monitor",
          text: "Use digital tools to monitor resource consumption: an energy dashboard or a simple weekly usage note turns good intentions into a visible habit." });
      }
      if (a.habits === "always" || a.habits === "often") {
        recs.push({ tag: "Habits", icon: "i-brain",
          text: "Your saving habits are solid. Automating them with timers, smart plugs or occupancy sensors makes them effortless to maintain." });
      }
      recs.push({ tag: "Next step", icon: "i-leaf",
        text: "Explore the Green Technology section to see which technologies — solar, smart grids or digital monitoring — support exactly the changes above." });
      return recs.slice(0, 6);
    }

    function renderRecs(recs) {
      const list = $("#recList");
      if (!list) return;
      list.innerHTML = recs.map(function (r, i) {
        return '<li class="rec-item" style="animation-delay:' + (i * 70) + 'ms">' + icon(r.icon) +
          '<div><span>' + r.text + '</span><br><span class="rec-tag">' + r.tag + '</span></div></li>';
      }).join("");
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(list);
    }

    function renderProfile(p) {
      [["#bdEnergy", p.energy], ["#bdWater", p.water], ["#bdTransport", p.transport],
       ["#bdWaste", p.waste], ["#bdHabits", p.habits]].forEach(function (pair) {
        const bar = $(pair[0]);
        const val = bar ? bar.parentElement.nextElementSibling : null;
        if (bar) bar.style.width = pair[1] + "%";
        if (val) val.textContent = pair[1];
      });
    }

    function renderScore(score) {
      const value = $("#scoreValue");
      const ring = $("#scoreRing");
      const profile = $("#scoreProfile");
      const from = value ? Number(value.textContent) || 0 : 0;
      if (value) animateNumber(value, score, { from: from, duration: 1400 });
      if (ring) ring.style.strokeDashoffset = String(RING * (1 - score / 100));
      if (profile) profile.textContent = profileText(score);
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(profile ? profile.parentElement : null);
    }

    function showError(show) {
      const err = $("#formError");
      if (!err) return;
      err.hidden = !show;
    }

    function markInvalid(a) {
      const form = $("#ecoForm");
      if (!form) return;
      $$(".field", form).forEach(function (f) { f.classList.remove("is-invalid"); });
      REQUIRED.forEach(function (key) {
        if (a[key]) return;
        const input = form.querySelector('input[name="' + key + '"]');
        const field = input ? input.closest(".field") : null;
        if (field) field.classList.add("is-invalid");
      });
    }

    function run() {
      const answers = readAnswers();
      if (validate(answers).length) {
        markInvalid(answers);
        showError(true);
        return false;
      }
      showError(false);
      markInvalid(answers);
      const profile = scoreProfile(answers);
      renderScore(overall(profile));
      renderProfile(profile);
      renderRecs(buildRecs(answers));
      return true;
    }

    function validate(answers) {
      return REQUIRED.filter(function (k) { return !answers[k]; });
    }

    function init() {
      const form = $("#ecoForm");
      if (!form) return;
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (run()) scrollToEl($("#calcResult"));
      });
      form.addEventListener("change", function () { showError(false); });

      const reset = $("#resetCalc");
      if (reset) {
        reset.addEventListener("click", function () {
          form.reset();
          markInvalid({});
          showError(false);
          renderScore(0);
          renderProfile({ energy: 0, water: 0, transport: 0, waste: 0, habits: 0 });
          const list = $("#recList");
          if (list) list.innerHTML = '<li class="rec-item is-empty">Your recommendations will appear here after you calculate your score.</li>';
          scrollToEl(form, "center");
        });
      }
    }

    return { init: init, run: run };
  })();

  /* ----------------------------------------------------------
     08 AGRICULTURE ADVISOR
     ---------------------------------------------------------- */
  const Agriculture = (function () {
    const ADVICE = {
      water: {
        title: "High Water Usage",
        text: "Smart irrigation can help deliver water according to crop and soil conditions instead of on a fixed schedule. Scheduling from soil-moisture readings avoids the two common losses: over-watering and unnecessary pumping.",
        points: [
          "Install soil-moisture probes at root depth, not only at the surface.",
          "Use drip lines so water reaches the root zone with less evaporation.",
          "Track daily water use per zone to find leaks or blocked emitters quickly."
        ]
      },
      heat: {
        title: "Hot Weather",
        text: "When heat is the limiting factor, technology shifts the focus from adding water to reducing stress: shade, timing and monitoring. Sensors let you irrigate early morning or late evening, when evaporation is lowest.",
        points: [
          "Watch soil-moisture trends rather than a single reading — drying speed reveals heat stress early.",
          "Use local weather stations to schedule watering before the hottest part of the day.",
          "Pair moisture data with mulching or shading to cut evaporation further."
        ]
      },
      dry: {
        title: "Low Soil Moisture",
        text: "Moisture sensors turn an invisible shortage into a number you can act on. A threshold-based alert triggers irrigation only where and when the crop actually needs it.",
        points: [
          "Set an alert threshold per crop stage — seedlings and mature plants differ.",
          "Verify the sensor with a manual reading before changing the whole irrigation plan.",
          "Pair moisture data with a rain forecast so you do not water before rainfall."
        ]
      },
      change: {
        title: "Changing Conditions",
        text: "Rapidly changing weather makes static schedules unreliable. Data-driven farming combines forecasts with field sensors, so the plan adapts instead of repeating yesterday's routine.",
        points: [
          "Connect local weather forecasts to irrigation decisions rather than fixed timers.",
          "Keep a season log of what each field produced so next year's plan starts from evidence.",
          "Review sensor history weekly to separate real trends from a single bad reading."
        ]
      }
    };

    function render(key) {
      const out = $("#agriOutput");
      const a = ADVICE[key];
      if (!out || !a) return;
      out.classList.add("is-filled");
      out.innerHTML =
        "<h4>" + icon("i-brain") + a.title + "</h4>" +
        "<p>" + a.text + "</p>" +
        "<ul>" + a.points.map(function (p) {
          return "<li>" + icon("i-check") + "<span>" + p + "</span></li>";
        }).join("") + "</ul>";
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(out);
    }

    function init() {
      const buttons = $$("#agriScenarios .scenario");
      if (!buttons.length) return;
      buttons.forEach(function (btn) {
        btn.addEventListener("click", function () {
          buttons.forEach(function (b) { b.setAttribute("aria-checked", "false"); });
          btn.setAttribute("aria-checked", "true");
          render(btn.getAttribute("data-sit"));
        });
        btn.addEventListener("keydown", function (e) {
          const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
          const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
          if (!fwd && !back) return;
          e.preventDefault();
          const i = buttons.indexOf(btn);
          const next = buttons[(i + (fwd ? 1 : -1) + buttons.length) % buttons.length];
          next.focus();
          next.click();
        });
      });
      buttons[0].setAttribute("aria-checked", "true");
      render("water");
    }
    return { init: init };
  })();

  /* ----------------------------------------------------------
     09 TRANSPORTATION EXPLORER
     ---------------------------------------------------------- */
  const Transport = (function () {
    const DATA = {
      walk: {
        name: "Walking", icon: "i-walk",
        sub: "Human-powered travel with no vehicle energy demand",
        resource: "Uses no fuel and very little energy beyond the food your body needs. The main environmental consideration is the production of shoes and clothing over time.",
        environment: "Produces no direct exhaust or noise at street level, so it also improves local air quality around busy streets.",
        tech: "Route-planning and navigation apps, step counters, and walking data recorded by phones make active travel measurable.",
        benefit: "Adds physical activity while removing a trip from the transport system entirely.",
        foot: "Educational summary — EcoSphere does not publish or imply specific emission figures."
      },
      bike: {
        name: "Bicycle", icon: "i-bike",
        sub: "Efficient human-powered transport",
        resource: "Requires little energy to operate and can replace higher-energy trips for most city distances. Parts and manufacturing carry an embodied cost.",
        environment: "No exhaust emissions while riding, and a very small footprint compared with motorized options.",
        tech: "Activity trackers, GPS devices, smart helmets and cycle-route planners all support safer, better-planned journeys.",
        benefit: "Delivers useful transport for a fraction of the energy, and supports healthy routines at the same time.",
        foot: "Educational summary — relative comparisons only; no verified figures are claimed."
      },
      public: {
        name: "Public Transportation", icon: "i-bus",
        sub: "Shared mobility that spreads the energy cost across passengers",
        resource: "One vehicle serving many travellers uses its energy more efficiently than the same number of private cars. Occupancy and route efficiency matter.",
        environment: "Fewer vehicles on the road means less congestion, less noise and generally better local air quality.",
        tech: "Integrated ticketing, real-time arrival displays, demand-responsive routing and passenger counting data improve the service.",
        benefit: "Connects communities to work and education while keeping road space for those who need it.",
        foot: "Educational summary — impact depends strongly on how full the service is."
      },
      ev: {
        name: "Electric Vehicle", icon: "i-ev",
        sub: "Electrified transport powered by a grid",
        resource: "Moves from fuel to electricity, so the environmental result depends on how that electricity is generated. Battery manufacturing also requires raw materials.",
        environment: "Produces no tailpipe exhaust, which improves street-level air quality even where the electricity mix is not yet fully renewable.",
        tech: "Battery management systems, smart charging, route planners and home-to-grid software optimise when charging happens.",
        benefit: "Can be paired with solar generation so the vehicle becomes part of a home's energy system.",
        foot: "Educational summary — the electricity source is the decisive factor."
      },
      fuel: {
        name: "Conventional Vehicle", icon: "i-car",
        sub: "Combustion-powered private transport",
        resource: "Depends on liquid fuel refined from fossil sources, and carries the energy cost of producing and transporting that fuel.",
        environment: "Produces tailpipe emissions and noise, contributing to poorer local air quality in dense areas.",
        tech: "Efficient engines, aerodynamics, lighter materials and route software all reduce the energy used per trip.",
        benefit: "Presents a clear baseline — and therefore a clear target for what technology can improve.",
        foot: "Educational summary — EcoSphere deliberately avoids stating specific emission values."
      }
    };

    function select(key, focus) {
      const d = DATA[key] || DATA.walk;
      const panel = $("#transPanel");
      if (!panel) return;
      $$(".trans-tab").forEach(function (t) {
        const active = t.getAttribute("data-trans") === key;
        t.setAttribute("aria-selected", active ? "true" : "false");
        t.setAttribute("tabindex", active ? "0" : "-1");
        if (active && focus) t.focus();
      });
      panel.setAttribute("aria-labelledby", "tab-" + key);
      panel.innerHTML =
        '<div class="trans-title"><span class="t-ic">' + icon(d.icon) + '</span>' +
        "<div><h3>" + d.name + "</h3><p>" + d.sub + "</p></div></div>" +
        '<div class="trans-grid">' +
        "<div class='trans-cell'><h4>" + icon("i-layers") + "Resource use</h4><p>" + d.resource + "</p></div>" +
        "<div class='trans-cell'><h4>" + icon("i-globe") + "Environment</h4><p>" + d.environment + "</p></div>" +
        "<div class='trans-cell'><h4>" + icon("i-code") + "Technology involved</h4><p>" + d.tech + "</p></div>" +
        "<div class='trans-cell'><h4>" + icon("i-leaf") + "Sustainability benefit</h4><p>" + d.benefit + "</p></div>" +
        "</div>" +
        '<p class="trans-foot">' + d.foot + "</p>";
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(panel);
    }

    function init() {
      const tabs = $$(".trans-tab");
      if (!tabs.length) return;
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () { select(tab.getAttribute("data-trans"), false); });
      });
      const list = $("#transTabs");
      if (list) {
        list.addEventListener("keydown", function (e) {
          if (["ArrowRight", "ArrowLeft", "Home", "End"].indexOf(e.key) === -1) return;
          e.preventDefault();
          // fall back to the selected tab when focus is not on one
          let i = tabs.indexOf(document.activeElement);
          if (i < 0) i = tabs.findIndex(function (t) { return t.getAttribute("aria-selected") === "true"; });
          if (i < 0) i = 0;
          let next = i;
          if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          select(tabs[next].getAttribute("data-trans"), true);
        });
      }
      select("walk", false);
    }
    return { init: init };
  })();

  /* ----------------------------------------------------------
     10 ECO TIPS — random, never repeating the previous tip
     ---------------------------------------------------------- */
  const Tips = (function () {
    const LIST = [
      { tag: "Energy", title: "Switch off the standby load",
        text: "TVs, chargers and desktop computers left in standby still draw power. A single power strip switched off at the end of the day removes many small losses at once." },
      { tag: "Energy", title: "Choose efficiency before size",
        text: "When replacing an appliance, look at the energy label and pick the model that does the same job with less consumption — a cheaper purchase often costs more to run." },
      { tag: "Water", title: "Turn off the tap while brushing",
        text: "A tap left running uses several litres per minute. Closing it while you brush is the simplest water saving available, and it costs nothing." },
      { tag: "Water", title: "Use a timer for outdoor watering",
        text: "Watering early morning or late evening reduces evaporation. A simple timer or a soil-moisture sensor makes the correct time automatic." },
      { tag: "Waste", title: "Refill before you replace",
        text: "Refillable bottles, jars and stationery cut packaging waste quickly. The rule is simple: repair and refill first, buy new only when there is no alternative." },
      { tag: "Waste", title: "Sort before you throw",
        text: "Separating paper, plastic, glass and metal at the point of disposal makes recycling far more effective than sorting a mixed bin later." },
      { tag: "Transport", title: "Replace one short car trip",
        text: "Walk or cycle for one nearby journey each week. Over a year these small substitutions add up without changing your whole routine." },
      { tag: "Transport", title: "Plan the route, not just the destination",
        text: "Navigation apps can show the fastest and often the most efficient route. Combining nearby errands into one trip saves both time and energy." },
      { tag: "Digital", title: "Track one resource for a month",
        text: "Pick one number — electricity, water or fuel — and record it weekly. Seeing the trend in a simple log is usually more persuasive than intention." },
      { tag: "Digital", title: "Use one app instead of five",
        text: "A single dashboard that shows energy, water and travel is easier to keep using than several tools, and easier to act on." },
      { tag: "Community", title: "Share what actually worked",
        text: "Tell one person about the change that stuck for you. Habits spread through conversation far more reliably than through reminders alone." },
      { tag: "Community", title: "Learn one smart-agriculture idea",
        text: "Soil sensors and weather stations show how technology saves water on a real farm. Understanding the system makes the idea easier to support." }
    ];

    let current = -1;
    let seen = 0;

    function show(index) {
      const tip = LIST[index];
      const card = $("#tipCard");
      const num = $("#tipNum"), title = $("#tipTitle"), text = $("#tipText"), tag = $("#tipTag");
      if (!tip || !card) return;
      num.textContent = "Tip " + String(index + 1).padStart(2, "0") + " / " + String(LIST.length).padStart(2, "0");
      title.textContent = tip.title;
      text.textContent = tip.text;
      tag.textContent = tip.tag;
      card.classList.remove("is-new");
      void card.offsetWidth; // restart the entry animation
      card.classList.add("is-new");
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(card);
    }

    function next() {
      let index;
      do { index = Math.floor(Math.random() * LIST.length); }
      while (index === current);           // never repeat the same tip twice in a row
      current = index;
      seen += 1;
      show(index);
      const counter = $("#tipCount");
      if (counter) counter.textContent = seen + (seen === 1 ? " tip explored of " : " tips explored of ") + LIST.length;
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(counter);
    }

    function init() {
      const btn = $("#nextTip");
      next();
      if (btn) btn.addEventListener("click", next);
    }
    return { init: init };
  })();

  /* ----------------------------------------------------------
     11 CLIMATE CHALLENGE QUIZ
     ---------------------------------------------------------- */
  const Quiz = (function () {
    const QUESTIONS = [
      {
        q: "Which technology converts sunlight directly into electricity?",
        options: ["Solar panels", "Wind turbines", "Smart meters", "Water filters"],
        answer: 0,
        ok: "Correct. Photovoltaic cells release electrons when light strikes them, turning sunlight into current.",
        no: "Solar panels are the technology that converts light into electricity. Wind turbines use moving air instead."
      },
      {
        q: "What is the main purpose of soil-moisture sensors in smart agriculture?",
        options: [
          "To make crops grow taller",
          "To irrigate according to actual soil conditions",
          "To replace the need for farmers",
          "To measure sunlight only"
        ],
        answer: 1,
        ok: "Correct. Sensors report real conditions, so water is delivered when the crop and soil actually need it.",
        no: "Sensors measure moisture so irrigation can be scheduled from real conditions rather than a fixed timetable."
      },
      {
        q: "Why does a smart grid help when renewable energy is added to a network?",
        options: [
          "It stores electricity in batteries only",
          "It removes the need for any monitoring",
          "It balances variable supply and demand in real time",
          "It increases the cost of electricity"
        ],
        answer: 2,
        ok: "Correct. Automated control uses live data to balance supply and demand as solar and wind output changes.",
        no: "A smart grid's key job is balancing variable supply and demand using real-time data and automated control."
      },
      {
        q: "Which action reduces household water waste the most directly?",
        options: [
          "Fixing a dripping tap and using a shower timer",
          "Buying a larger water tank",
          "Drinking more water",
          "Washing the car more often"
        ],
        answer: 0,
        ok: "Correct. Fixing leaks and limiting shower time addresses the two most common household losses.",
        no: "Leaks and long showers are the usual household losses, so repairing and timing directly reduces waste."
      },
      {
        q: "What does an energy label help a consumer do?",
        options: [
          "Compare how much energy appliances use before buying",
          "Predict future electricity prices",
          "Guarantee lower bills forever",
          "Measure the weather"
        ],
        answer: 0,
        ok: "Correct. The label lets you compare consumption for the same job, so a lower-running-cost choice becomes visible.",
        no: "The energy label is a comparison tool: it shows how much energy a product uses for the same task."
      },
      {
        q: "Why can an electric vehicle be better for local air quality?",
        options: [
          "Because it produces no tailpipe exhaust",
          "Because it uses no electricity at all",
          "Because it makes roads wider",
          "Because batteries absorb carbon dioxide"
        ],
        answer: 0,
        ok: "Correct. It produces no tailpipe exhaust, which improves street-level air — though the wider impact still depends on the electricity source.",
        no: "The local benefit comes from the absence of tailpipe exhaust. The overall impact still depends on how the electricity is generated."
      },
      {
        q: "Which statement best describes climate change?",
        options: [
          "A single very cold winter",
          "A long-term shift in average climate patterns",
          "The weather forecast for tomorrow",
          "Any dry season"
        ],
        answer: 1,
        ok: "Correct. Climate change refers to a long-term shift in average patterns, not a single day's weather.",
        no: "Climate is the long-term pattern; weather is the short-term state. A single cold winter does not define climate change."
      },
      {
        q: "What is the most useful first step when a resource problem is not visible?",
        options: [
          "Wait until it becomes a crisis",
          "Measure it with a sensor or a simple log",
          "Stop using the resource entirely",
          "Replace every device at once"
        ],
        answer: 1,
        ok: "Correct. You cannot improve what you do not measure — monitoring turns an invisible system into usable information.",
        no: "Measurement comes first. Once usage is visible, targeted and affordable improvements become possible."
      },
      {
        q: "What did the IPCC conclude about the cause of global warming?",
        options: [
          "That human activity has unequivocally caused it",
          "That it is caused by natural cycles only",
          "That the cause is still unknown",
          "That it stopped in 2000"
        ],
        answer: 0,
        ok: "Correct. The IPCC states that human activity, mainly through greenhouse gas emissions, has unequivocally caused global warming.",
        no: "The IPCC found that human activity, principally through greenhouse gas emissions, has unequivocally caused global warming."
      },
      {
        q: "By roughly how much has global surface temperature risen between 1850–1900 and 2011–2020?",
        options: ["0.3°C", "1.1°C", "2.5°C", "5.0°C"],
        answer: 1,
        ok: "Correct — about 1.1°C, according to the IPCC Sixth Assessment Report.",
        no: "The IPCC Sixth Assessment Report gives 1.1°C of warming for 2011–2020 compared with the 1850–1900 baseline."
      },
      {
        q: "What happens to climate risks as warming increases?",
        options: [
          "They stay the same after 1.5°C",
          "Only flooding increases",
          "They escalate with every increment of warming",
          "They decrease as emissions fall"
        ],
        answer: 2,
        ok: "Correct. Climate-related risks and impacts escalate with every increment of global warming — it is a rising curve, not a single cliff.",
        no: "The IPCC finds that risks and projected adverse impacts escalate with every increment of warming."
      },
      {
        q: "Which two technologies work together to deliver water only when soil is dry?",
        options: [
          "Solar panels and wind turbines",
          "Soil-moisture sensors and automated irrigation",
          "Carbon capture and smart grids",
          "Satellites and desalination plants"
        ],
        answer: 1,
        ok: "Correct. The sensor measures the condition and the controller decides when to irrigate — measurement plus automation.",
        no: "Soil-moisture sensors provide the reading and automated irrigation acts on it; together they remove fixed schedules."
      },
      {
        q: "Why is measuring resource use the essential first step?",
        options: [
          "Because measurement replaces all other action",
          "Because it is required by law",
          "Because you cannot improve what you have not measured",
          "Because sensors are cheap"
        ],
        answer: 2,
        ok: "Correct. Monitoring turns an invisible system into usable information, which is what makes targeted improvement possible.",
        no: "Monitoring makes an invisible system visible; that is what allows targeted, affordable improvements."
      }
    ];

    const KEYS = ["A", "B", "C", "D"];
    const el = {};
    const ROUND = 8;                       // questions asked per attempt
    let deck = [];                         // shuffled question list for this attempt
    let order = [];                        // shuffled option order for the current question
    let index = 0, score = 0, answered = false;

    /** Fisher-Yates shuffle — a different order every attempt. */
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    /** Build a fresh randomised deck of ROUND unique questions. */
    function newDeck() { return shuffle(QUESTIONS).slice(0, ROUND); }

    function setProgress(pct) {
      if (el.bar) el.bar.style.width = pct + "%";
      if (el.barWrap) el.barWrap.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function labelNext(text) {
      el.next.textContent = "";
      el.next.insertAdjacentHTML("beforeend", text + " " + icon("i-arrow"));
    }

    function renderQuestion() {
      const item = deck[index];
      order = shuffle(item.options.map(function (_, i) { return i; }));
      answered = false;
      el.num.textContent = String(index + 1);
      el.total.textContent = String(deck.length);
      el.score.textContent = String(score);
      el.text.textContent = item.q;
      el.feedback.hidden = true;
      el.feedback.textContent = "";
      el.next.hidden = false;
      el.next.disabled = true;
      labelNext("Next Question");
      setProgress((index / deck.length) * 100);

      // options are displayed in a shuffled order each time
      el.options.innerHTML = order.map(function (optIdx, pos) {
        return '<button type="button" class="q-opt" data-i="' + optIdx + '">' +
          '<span class="q-key">' + KEYS[pos] + "</span><span>" + item.options[optIdx] + "</span></button>";
      }).join("");

      $$(".q-opt", el.options).forEach(function (btn) {
        btn.addEventListener("click", function () { choose(Number(btn.getAttribute("data-i"))); });
      });

      // re-trigger the entry animation
      el.body.style.animation = "none";
      void el.body.offsetWidth;
      el.body.style.animation = "";
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(el.body);
    }

    function choose(i) {
      if (answered) return;
      answered = true;
      const item = deck[index];
      const correct = i === item.answer;
      if (correct) score += 1;

      $$(".q-opt", el.options).forEach(function (btn) {
        const idx = Number(btn.getAttribute("data-i"));
        btn.disabled = true;
        if (idx === item.answer) btn.classList.add("is-correct");
        else if (idx === i) btn.classList.add("is-wrong");
      });

      el.feedback.textContent = correct ? item.ok : item.no;
      el.feedback.hidden = false;
      el.score.textContent = String(score);
      el.next.disabled = false;
      labelNext(index === deck.length - 1 ? "See My Result" : "Next Question");
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(el.body);
    }

    function resultText(correct, total) {
      const pct = Math.round((correct / total) * 100);
      if (pct === 100) return "A perfect round. You have a strong grasp of how climate and technology connect — try explaining one idea from this quiz to someone else to make it stick.";
      if (pct >= 75) return "Excellent work. You understand the core ideas well. Revisit the two topics you missed in the Green Technology section to reach full confidence.";
      if (pct >= 50) return "A good result. You have the foundations; a second pass through the Climate and Smart Agriculture sections will sharpen the rest.";
      if (pct >= 25) return "A promising start. Every question you review is one more idea you can explain — work through the sections above, then restart the challenge.";
      return "This is the beginning of the learning curve. Read the Climate overview and the Green Technology cards, then come back and try again — progress here is normal.";
    }

    function finish() {
      const total = deck.length;
      const pct = Math.round((score / total) * 100);
      setProgress(100);
      el.num.textContent = String(total);
      el.score.textContent = String(score);
      el.text.textContent = "Challenge complete";
      el.options.innerHTML = "";
      el.feedback.hidden = true;
      el.next.hidden = true;
      el.restart.hidden = false;
      el.result.hidden = false;
      el.resultValue.textContent = String(pct);
      el.resultSummary.textContent = "You answered " + score + " of " + total +
        " questions correctly — that's " + pct + "%.";
      el.resultFeedback.textContent = resultText(score, total);
      if (typeof I18N !== "undefined" && I18N.tr) I18N.tr(el.result);
      scrollToEl(el.result);
    }

    function next() {
      if (!answered) return;
      if (index === deck.length - 1) { finish(); return; }
      index += 1;
      renderQuestion();
    }

    /** Restart builds a brand-new randomised deck. */
    function restart() {
      index = 0;
      score = 0;
      deck = newDeck();
      el.result.hidden = true;
      el.restart.hidden = true;
      el.next.hidden = false;
      renderQuestion();
    }

    function init() {
      el.num = $("#qNum"); el.total = $("#qTotal"); el.score = $("#qScore");
      el.text = $("#qText"); el.options = $("#qOptions"); el.feedback = $("#qFeedback");
      el.body = $("#quizBody"); el.bar = $("#quizBar"); el.barWrap = $("#quizBarWrap");
      el.next = $("#qNext"); el.restart = $("#qRestart"); el.result = $("#quizResult");
      el.resultValue = $("#qrValue"); el.resultSummary = $("#qrSummary");
      el.resultFeedback = $("#qrFeedback");
      if (!el.text || !el.options || !el.next) return;
      deck = newDeck();
      el.next.addEventListener("click", next);
      el.restart.addEventListener("click", restart);
      const qr = $("#qrRestart");
      if (qr) qr.addEventListener("click", restart);
      labelNext("Next Question");
      renderQuestion();
    }
    return { init: init };
  })();

  /* ----------------------------------------------------------
     12 I18N — English ⇄ Arabic toggle with full RTL support
     Translations are keyed by the original English string, so the
     same table covers static markup and JS-rendered content.
     ---------------------------------------------------------- */
  const I18N = (function () {
    const KEY = "ecosphere-lang";
    const root = document.documentElement;
    const originalText = new WeakMap();

    /* English source string -> Arabic. Also used for the reverse direction. */
    const AR = {
      /* --- navigation & UI --- */
      "Home": "الرئيسية",
      "Climate": "المناخ",
      "Dashboard": "لوحة القيادة",
      "Eco Calculator": "الحاسبة البيئية",
      "Green Technology": "التكنولوجيا الخضراء",
      "Smart Agriculture": "الزراعة الذكية",
      "Transportation": "النقل",
      "Eco Tips": "نصائح بيئية",
      "Climate Challenge": "تحدي المناخ",
      "About": "عن المشروع",
      "Explore": "استكشف",
      "Question": "السؤال",
      "Score:": "النتيجة:",
      "of": "من",
      "Final Score": "النتيجة النهائية",
      "Next Question": "السؤال التالي",
      "See My Result": "اعرض نتيجتي",
      "Restart Challenge": "أعد المحاولة",
      "Question of": "السؤال",
      "Dark Mode": "الوضع الداكن",
      "Light Mode": "الوضع الفاتح",
      "Skip to main content": "تخطَّ إلى المحتوى الرئيسي",
      "Back to top": "العودة إلى الأعلى",
      "Explore EcoSphere": "استكشف EcoSphere",
      "Calculate My Eco Score": "احسب نتيجتك البيئية",
      "Recalculate": "أعد الحساب",
      "Show Another Tip": "اعرض نصيحة أخرى",
      "Try the Eco Calculator": "جرّب الحاسبة البيئية",
      "Open details": "اعرض التفاصيل",
      "Learn more": "اعرف المزيد",
      "Live Indicators": "المؤشرات المباشرة",
      "Simulation Controls": "أدوات المحاكاة",
      "Environmental Profile": "الملف البيئي",
      "Your Eco Score": "نتيجتك البيئية",
      "Personalised Recommendations": "توصيات مخصّصة",
      "Agriculture Advisor": "مستشار الزراعة",
      "Chapter 01": "الفصل الأول",
      "Chapter 02": "الفصل الثاني",
      "Chapter 03": "الفصل الثالث",
      "Chapter 04": "الفصل الرابع",
      "Chapter 05": "الفصل الخامس",
      "Chapter 06": "الفصل السادس",
      "Chapter 07": "الفصل السابع",
      "Chapter 08": "الفصل الثامن",
      "Scroll": "مرّر",
      "Energy": "الطاقة",
      "Water": "المياه",
      "Waste": "النفايات",
      "Transport": "النقل",
      "Habits": "العادات",
      "HTML5": "HTML5",
      "CSS3": "CSS3",
      "JavaScript": "JavaScript",
      "A": "أ", "B": "ب", "C": "ج", "D": "د",

      /* --- hero --- */
      "Technology for a Greener Tomorrow": "تكنولوجيا تصنع مستقبلًا أكثر اخضارًا",
      "Interactive Educational Project · Climate Change & Technology":
        "مشروع تعليمي تفاعلي · التغير المناخي والتكنولوجيا",
      "Technology can be more than a tool. It can be part of the solution.":
        "التكنولوجيا ليست مجرد أداة، بل يمكن أن تكون جزءًا من الحل.",
      "Climate change affects people, ecosystems, water, agriculture, energy and communities. EcoSphere shows how modern technology — sensors, software, smart grids and digital monitoring — helps us measure these changes, reduce resource waste and respond with practical, data-driven solutions.":
        "يؤثر التغير المناخي في الناس والنظم البيئية والمياه والزراعة والطاقة والمجتمعات. يُظهر EcoSphere كيف تساعد التكنولوجيا الحديثة — المستشعرات والبرمجيات والشبكات الذكية والرصد الرقمي — على قياس هذه التغيرات، وتقليل هدر الموارد، والاستجابة بحلول عملية قائمة على البيانات.",
      "Learning Modules": "وحدات تعليمية",
      "Interactive Tools": "أدوات تفاعلية",
      "Quiz Questions": "أسئلة الاختبار",

      /* --- climate --- */
      "Understanding the Climate Challenge": "فهم تحدي المناخ",
      "Climate change is not a single problem — it is a system of connected pressures. Below are six major challenge areas. Select any card to open a short explanation.":
        "التغير المناخي ليس مشكلة واحدة، بل نظام من الضغوط المترابطة. وفيما يلي ست مجالات رئيسية للتحديات. اختر أي بطاقة لعرض شرح موجز.",
      "Climate Change": "التغير المناخي",
      "Global Warming": "الاحتباس الحراري",
      "Extreme Weather": "الطقس المتطرف",
      "Water Stress": "الإجهاد المائي",
      "Energy Consumption": "استهلاك الطاقة",
      "Environmental Pollution": "التلوث البيئي",
      "A long-term shift in average weather patterns that reshapes ecosystems, seasons and rainfall.":
        "تحوّل طويل الأمد في أنماط الطقس يعيد تشكيل النظم البيئية والفصول ومواسم الأمطار.",
      "The steady rise in average surface temperature caused by extra heat trapped in the atmosphere.":
        "الارتفاع المستمر في متوسط حرارة سطح الأرض بسبب الحرارة الزائدة المحبوسة في الغلاف الجوي.",
      "Unusually intense heat, storms, droughts or rainfall events linked to a changing climate.":
        "موجات حر أو عواصف أو جفاف أو أمطار غير معتادة مرتبطة بتغير المناخ.",
      "Growing demand and uneven supply put pressure on rivers, aquifers and drinking water.":
        "الطلب المتزايد والعرض غير المتوازن يضعان ضغطًا على الأنهار والمياه الجوفية ومياه الشرب.",
      "How electricity is generated and used across homes, cities and industry.":
        "كيف تُولَّد الكهرباء وتُستخدم في المنازل والمدن والصناعة.",
      "Air, water and soil contamination produced by waste, industry and heavy transport.":
        "تلوث الهواء والماء والتربة الناتج عن النفايات والصناعة والنقل الثقيل.",
      "Technology helps by tracking changes over time through sensors and satellites, so patterns can be measured instead of guessed. Software then turns that data into warnings and planning tools.":
        "تساعد التكنولوجيا عبر المستشعرات والأقمار الصناعية على تتبّع التغيرات مع الوقت، في تصبح الأنماط قابلة للقياس بدلًا من التخمين. ثم تحوّل البرمجيات هذه البيانات إلى إنذارات وأدوات تخطيط.",
      "Digital models and monitoring stations help quantify warming trends, while efficient technology reduces the energy demand that adds to it.":
        "تساعد النماذج الرقمية ومحطات الرصد في تحديد اتجاهات ارتفاع الحرارة، فيما تقلل التقنيات الموفّرة من الطلب على الطاقة الذي يسهم فيها.",
      "Early-warning systems use sensors, satellite feeds and forecasting software to give communities more preparation time before a flood, storm or heatwave arrives.":
        "تستخدم أنظمة الإنذار المبكر المستشعرات وبيانات الأقمار الصناعية وبرمجيات التنبؤ لتمنح المجتمعات وقتًا أكبر للاستعداد قبل وصول فيضان أو عاصفة أو موجة حر.",
      "Smart meters, leak-detection sensors and irrigation scheduling software reduce the water lost before it is used, and report remaining supply in near real time.":
        "تقليل العدادات الذكية ومستشعرات كشف التسربات وبرمجيات جدولة الري من المياه المفقودة قبل استخدامها، وتُظهر المتبقي بشكل شبه فوري.",
      "Smart meters, energy dashboards and automated controls make consumption visible, so savings can be measured, compared and repeated across a whole community.":
        "تجعل العدادات الذكية ولوحات الطاقة والتحكم الآلي الاستهلاك مرئيًا، فيمكن قياس الوفر ومقارنته وتكراره على مستوى المجتمع كله.",
      "Digital monitoring stations, low-cost air sensors and satellite imaging help identify pollution sources quickly and support cleaner regulation.":
        "تساعد محطات الرصد الرقمي ومستشعرات الهواء منخفضة التكلفة والتصوير عبر الأقمار الصناعية في تحديد مصادر التلوث بسرعة ودعم لوائح أنظف.",

      /* --- verified climate facts (IPCC AR6) --- */
      "Verified Science": "علم موثّق",
      "The Climate, Measured": "المناخ بالأرقام",
      "These are real findings from the scientific record, not invented numbers. Every figure below comes from the IPCC Sixth Assessment Report (AR6, 2023).":
        "هذه نتائج حقيقية من السجل العلمي، وليست أرقامًا مُختلقة. كل رقم أدناه مصدره التقرير السادس للتقييم للجنة المناخية الدولية (IPCC) عام 2023.",
      "Source: IPCC AR6 Synthesis Report, 2023":
        "المصدر: التقرير التركيبي للتقييم السادس للجنة المناخية الدولية (IPCC) عام 2023",
      "— the Sixth Assessment Report of the Intergovernmental Panel on Climate Change, approved line by line by 193 member governments.":
        " — التقرير السادس للجنة المناخية الحكومية الدولية، الذي اعتُمد سطرًا بسطر من قبل 193 دولة عضو.",
      "Global surface temperature, 2011–2020 vs the 1850–1900 baseline.":
        "درجة حرارة سطح الأرض العالمية في 2011–2020 مقارنة بخط الأساس 1850–1900.",
      "Best-estimate warming level reached in the near term in considered scenarios.":
        "مستوى الاحترار التقديري الأفضل الذي يُتوقع الوصول إليه قريبًا في السيناريوهات المدروسة.",
      "Member governments that approved the IPCC Sixth Assessment Report line by line.":
        "عدد الدول الأعضاء التي اعتمدت التقرير السادس للجنة المناخية الدولية سطرًا بسطر.",
      "Time for deep, rapid, sustained emissions cuts to slow warming discernibly.":
        "المدة اللازمة لخفض الانبعاثات بعمق وسرعة واستمرار لإبطاء الاحترار بشكل ملموس.",
      "Time for those same cuts to change atmospheric composition discernibly.":
        "المدة اللازمة للخفض نفسه чтобы يغيّر تركيب الغلاف الجوي بشكل ملموس.",
      "Climate change is already affecting weather and climate extremes everywhere.":
        "التغير المناخي يؤثر بالفعل على الطقس والظواهر المناخية المتطرفة في كل مكان.",
      "Every figure shown here is quoted from the IPCC AR6 Synthesis Report (2023), approved line by line by 193 member governments. EcoSphere presents no invented or illustrative statistics as fact.":
        "كل رقم معروض هنا منقول عن التقرير التركيبي للجنة المناخية الدولية (2023)، المعتمد سطرًا بسطر من 193 دولة عضو. يقدّم EcoSphere أي إحصاءات مُختلقة أو توضيحية بوصفها حقائق.",
      "Key topics": "المواضيع الرئيسية",
      "What it actually is": "ما هو حقًا",
      "How it works": "كيف يعمل",
      "What the science measures": "ما الذي تقيسه العلوم",
      "Why it is not only about temperature": "لماذا لا يقتصر الأمر على الحرارة",
      "Where technology helps": "أين تساعد التكنولوجيا",
      "Why a baseline is needed": "لماذا نحتاج خط أساس",
      "Where the extra heat goes": "إلى أين تذهب الحرارة الزائدة",
      "The 1.5°C and 2°C conversation": "مسألة 1.5 درجة و2 درجة",
      "The scale of what is still to come": "حجم ما هو قادم",
      "What counts as an extreme": "ما الذي يُعدّ حالة متطرفة",
      "The main types": "الأنواع الرئيسية",
      "Why a warmer world changes the dice": "لماذا يغيّر العالم الأكثر دفئًا احتمالات وقوع الأحداث",
      "Warning is the technology that matters most": "الإنذار المبكر هو التقنية الأكثر أهمية",
      "Three different faces of the same problem": "ثلاثة أوجه لمشكلة واحدة",
      "How climate change alters the water cycle": "كيف يغيّر التغير المناخي دورة الماء",
      "The water–energy link": "الصلة بين الماء والطاقة",
      "Groundwater: invisible and slow": "المياه الجوفية: خفية وبطيئة",
      "Energy is not the same as electricity": "الطاقة ليست الكهرباء",
      "Two sides of the same problem": "جانبان لمشكلة واحدة",
      "Efficiency: the same service for less energy": "الكفاءة: الخدمة نفسها بطاقة أقل",
      "The problem variable energy creates": "المشكلة التي تخلقها الطاقة المتغيرة",
      "The main agents": "الملوثات الرئيسية",
      "Health is the strongest argument": "الصحة هي أقوى حجة",
      "Ocean acidification: the link to climate": "تحمض المحيطات: الصلة بالمناخ",
      "Why monitoring is the first step": "لماذا الرصد هو الخطوة الأولى",
      "Climate change is the long-term shift in the average conditions we call weather, measured over decades rather than days. The IPCC concluded that human activities, principally through greenhouse gas emissions, have unequivocally caused global warming.":
        "التغير المناخي هو التحوّل طويل الأمد في متوسط الظروف التي نسمّيها الطقس، ويُقاس على مدى عقود لا أيام. وخلص IPCC إلى أن النشاط البشري، وخصوصًا عبر انبعاثات غازات الدفيئة، قد سبّب الاحتباس الحراري بشكل لا يقبل الشك.",
      "Global warming is the specific, measurable rise in Earth's average surface temperature — the central physical expression of climate change, and the quantity that most scientists report on.":
        "الاحتباس الحراري هو الارتفاع الملموس في متوسط حرارة سطح الأرض، وهو التعبير الفيزيائي المركزي عن التغير المناخي والكمية التي يبلّغ عنها معظم العلماء.",
      "Climate change does not create storms — it changes the odds. The IPCC finds that human-caused climate change is already affecting many weather and climate extremes in every region across the globe, with high confidence.":
        "التغير المناخي لا يخلق العواصف، بل يغيّر احتمالاتها. وخلص IPCC إلى أن التغير المناخي الذي سببه الإنسان يؤثر بالفعل على كثير من الظواهر الجوية والمناخية المتطرفة في كل منطقة من العالم، بثقة عالية.",
      "Water stress is the state in which demand for water outstrips reliable supply. It is not always a shortage of water — sometimes the water is there but is the wrong quality, or arrives at the wrong time of year.":
        "الإجهاد المائي هو الحالة التي يف فيها الطلب على الماء إلى إمداد موثوق. وهو ليس دائمًا نقصًا في الماء — أحيانًا يكون الماء موجودًا لكن بجودة غير مناسبة، أو يأتي في وقت غير مناسب من العام.",
      "Energy consumption is the total energy a system uses to deliver a service — heating a home, moving a vehicle, processing a tonne of steel. The IPCC tracks greenhouse gas emissions by sector: energy supply, industry, agriculture, land use, transport and buildings.":
        "استهلاك الطاقة هو إجمالي الطاقة التي يستخدمها نظام لتقديم خدمة ما — تدفئة منزل، أو تحريك مركبة، أو معالجة طن من الفولاذ. ويتتبع IPCC انبعاثات غازات الدفيئة حسب القطاع: إمداد الطاقة، الصناعة، الزراعة، استخدام الأراضي، النقل، والمباني.",
      "Pollution is contamination of air, water or soil by substances that cause harm to health or ecosystems. It shares both causes and consequences with climate change: the same combustion that emits carbon dioxide also emits particulates and nitrogen oxides.":
        "التلوث هو تلوث الهواء أو الماء أو التربة بمواد تضر بالصحة أو النظم البيئية. وهو يتشارك مع التغير المناخي في الأسباب والنتائج: فالحرق الذي ينبعث منه ثاني أكسيد الكربون ينبعث منه أيضًا الجسيمات الدقيقة وأكاسيد النيتروجين.",
      "rise in global surface temperature between 1850–1900 and 2011–2020.":
        "ارتفاع في حرارة سطح الأرض العالمية بين 1850–1900 و2011–2020.",
      "climate change is already affecting weather and climate extremes across the globe.":
        "التغير المناخي يؤثر بالفعل على الطقس والظواهر المناخية المتطرفة في أنحاء العالم.",
      "governments that approved the Sixth Assessment Report line by line.":
        "عدد الدول التي اعتمدت التقرير السادس سطرًا بسطر.",
      "Weather is what the sky does today. Climate is what the averages look like over roughly thirty years. That distinction matters: a single cold winter says nothing about climate, but a thirty-year average that drifts upward says everything.":
        "الطقس هو ما يفعله السماء اليوم. أما المناخ فهو ما تبدو عليه المتوسطات على مدى نحو ثلاثين عامًا. وهذا التمييز مهم: شتاء بارد واحد لا يقول شيئًا عن المناخ، لكن متوسطًا لثلاثين عامًا يميل إلى الارتفاع يقول كل شيء.",
      "The IPCC reports that vulnerable communities who have contributed the least to current climate change are disproportionately affected, and that climate risks and projected impacts escalate with every increment of warming. Climate change is therefore a fairness problem as much as a physical one.":
        "يقدّر IPCC أن المجتمعات الهشّة التي ساهمت بأقل قدر في التغير المناخي الحالي تتأثر بشكل غير متناسب، وأن مخاطر المناخ وآثاره المتوقعة تتصاعد مع كل زيادة في الاحترار. لذلك فإن التغير المناخي مسألة إنصاف بقدر ما هي مسألة فيزيائية.",
      "Sensors and satellites turn a slow planetary trend into something measurable rather than anecdotal. Attribution science compares observed changes against model simulations to work out which event was made more likely by warming, and forecasting software turns that record into warnings that arrive early enough to be useful.":
        "تحوّل المستشعرات والأقمار الصناعية اتجاهًا كوكبيًا بطيئًا إلى شيء قابل للقياس لا إلى انطباعات. وتقارن علم النسبة التغييرات المرصودة مع محاكاة النماذج لتحديد أي حدث أصبح أكثر احتمالًا بفعل الاحترار، وتحوّل برمجيات التنبؤ ذلك السجل إلى إنذارات تصل مبكرًا بما يكفي لتكون نافعة.",
      "A temperature is meaningless without a reference point. The IPCC uses 1850–1900 as the pre-industrial baseline, which is the closest global period before large-scale industrial fuel burning. Every warming figure you read is a difference measured against some baseline, and the honest way to state one is to name the baseline alongside it.":
        "درجة الحرارة لا قيمة لها دون نقطة مرجعية. ويستخدم IPCC الفترة 1850–1900 كخط أساس ما قبل الثورة الصناعية، وهي أقرب فترة عالمية سبقت الحرق الصناعي الكبير للوقود. وكل رقم احترار تقرأه هو فرق يُقاس مقابل خط أساس ما، والطريقة الأمانة لذكره هي أن تسمّي خط الأساس إلى جانب الرقم.",
      "Land and air warm quickly, but the ocean dominates: it absorbs the large majority of the excess heat and holds it for centuries. This is why atmospheric temperature rises more slowly than total energy accumulation — and why the ocean, not the air, is where much of the long-term warming is stored. The IPCC reports widespread and rapid changes in the atmosphere, ocean, cryosphere and biosphere.":
        "اليابسة والهواء تسخنان بسرعة، لكن المحيط هو المهيمن: فهو يمتص الغالبية العظمى من الحرارة الزائدة ويحتفظ بها لقرون. ولهذا ترتفع حرارة الغلاف الجوي أبطأ من تراكم الطاقة الإجمالي، ولهذا يكون المحيط لا الهواء هو место تخزين كثير من الاحترار طويل الأمد. ويقدّر IPCC تغيرات واسعة وسريعة في الغلاف الجوي والمحيط والكتل الجليدية والbiosphere.",
      "Sunlight enters the atmosphere and warms the surface, which then re-radiates energy upward as infrared heat.":
        "يدخل ضوء الشمس الغلاف الجوي ويسخّن السطح، الذي يعيد بدوره إشعاع الطاقة إلى الأعلى على هيئة حرارة بالأشعة تحت الحمراء.",
      "Greenhouse gases in the atmosphere absorb part of that outgoing heat and re-emit it in all directions, slowing the loss to space.":
        "تمتص غازات الدفيئة في الغلاف الجوي جزءًا من تلك الحرارة الصادرة وتعيد بثها في جميع الاتجاهات، ما يبطئ الفقدان إلى الفضاء.",
      "Human activity adds greenhouse gases — mainly carbon dioxide from burning coal, oil and gas — so more heat is retained than leaves.":
        "يضيف النشاط البشري غازات دفيئة — وأهمها ثاني أكسيد الكربون من حرق الفحم والنفط والغاز — فيُحتجز من الحرارة أكثر مما يخرج.",
      "The extra energy has to accumulate somewhere, and it accumulates in the ocean, the land and the ice.":
        "لا بد أن تتراكم الطاقة الزائدة في مكان ما، وهي تتراكم في المحيط واليابسة والجليد.",
      "Extreme rainfall — heavier downpours that overwhelm drainage and flood infrastructure.":
        "الأمطار الغزيرة — هطول أثقل يتجاوز قدرة شبكات الصرف ويغمر البنية التحتية.",
      "Tropical cyclones — the science shows that warmer oceans support more intense storms, though the influence on total storm numbers is more complex.":
        "الأعاصير الاستوائية — تُظهر الدراسات أن المحيطات الأدفأ تدعم عواصف أكثر عنفًا، مع أن تأثيرها على العدد الكلي للعواصف أكثر تعقيدًا.",
      "Physical scarcity — the basin simply does not contain enough water to meet demand.":
        "النقص الفيزيائي — لا يحتوي الحوض على كمية كافية من الماء لتلبية الطلب.",
      "Quality scarcity — pollution makes technically available water unsafe or unusable.":
        "النقص النوعي — يجعل التلوث الماء المتاح تقنيًا غير آمن أو غير قابل للاستخدام.",
      "Timing scarcity — the water exists, but seasonal supply no longer matches when people need it.":
        "النقص الزمني — الماء موجود، لكن الإمداد الموسمي لم يعد يطابق وقت حاجة الناس إليه.",
      "Warming intensifies evaporation from oceans, lakes and soil, and changes where rain falls. The result is not simply drier — it is less predictable. Many regions receive more total rainfall concentrated into shorter, heavier events, which means wetter flood seasons followed by longer dry spells. Mountain snowpack and glaciers store water seasonally and release it as melt; when that store shrinks, the smoothing effect that rivers depend on weakens.":
        "يُعزّز الاحترار التبخر من المحيطات والبحيرات والتربة، ويغيّر أماكن هطول المطر. والنتيجة ليست جفافًا فحسب، بل تراجعًا في القدرة على التنبؤ. وتتلقى مناطق كثيرة أمطارًا إجمالية أكثر تتركز في فترات أقصر وأشد، أي مواسم فيضان أكثر رطوبة تليها فترات جفاف أطول. وتخزن الثلوج والجبال الجليدية الماء موسميًا وتطلقه عند الذوبان؛ وعندما ينكمش هذا المخزون يضعف تأثير التنعيم الذي تعتمد عليه الأنهار.",
      "Leak-detection sensors and smart meters surface losses that would otherwise go unnoticed for months.":
        "تكشف مستشعرات التسربات والعدادات الذكية خسائر كانت ستمر دون ملاحظة لأشهر.",
      "Satellite monitoring tracks snowpack, river flow and groundwater storage at regional scale.":
        "يتابع الرصد بالأقمار الصناعية الغطاء الثلجي وجريان الأنهار ومخزون المياه الجوفية على النطاق الإقليمي.",
      "Reuse, rainwater harvesting and desalination add supply without adding extraction from the same basin.":
        "تضيف إعادة الاستخدام وجمع مياه الأمطار وتحلية المياه إمدادًا جديدًا دون زيادة السحب من الحوض نفسه.",
      "Supply — how energy is generated: solar, wind, hydro, nuclear, geothermal or fossil fuels.":
        "العرض — كيف تُولَّد الطاقة: الشمسية، أو الرياح، أو المائية، أو النووية، أو الحرارية الأرضية، أو الوقود الأحفوري.",
      "Soil — pesticides, heavy metals, hydrocarbons and persistent organic pollutants that remain for years.":
        "التربة — المبيدات والمعادن الثقيلة والهيدروكربونات والملوثات العضوية الثابتة التي تبقى سنوات.",
      "Emission controls, filters and scrubbers reduce releases at the source rather than treating symptoms.":
        "تخفض أنظمة التحكم بالانبعاثات والمرشّحات وأجهزة الغسل الإفرازات عند المصدر بدلًا من معالجة الأعراض.",
      "Satellite and ground monitoring identifies pollution sources that would otherwise be misattributed.":
        "يحدد الرصد بالأقمار الصناعية والميداني مصادر التلوث التي قد تُنسب إلى غيرها لولا ذلك.",
      "Greenhouse gases · Carbon cycle · Attribution science · Climate models · Feedback loops":
        "غازات الدفيئة · دورة الكربون · علم النسبة · النماذج المناخية · حلقات التغذية الراجعة",
      "Baseline periods · Surface temperature · Ocean heat content · Ice-sheet loss · Thermal inertia":
        "فترات خط الأساس · حرارة السطح · محتوى حرارة المحيط · ذوبان الجليد · القصور الحراري",
      "Heatwaves · Drought · Extreme rainfall · Tropical cyclones · Early-warning systems":
        "موجات الحر · الجفاف · الأمطار الغزيرة · الأعاصير الاستوائية · أنظمة الإنذار المبكر",
      "Water scarcity · Aquifers · Glaciers and snowpack · Floods and droughts · Desalination":
        "ندرة المياه · المياه الجوفية · الأنهار الجليدية والثلوج · الفيضانات والجفاف · تحلية المياه",
      "Fossil fuels · Renewable energy · Electrification · Energy efficiency · Grid storage":
        "الوقود الأحفوري · الطاقة المتجددة · التمكين الكهربائي · كفاءة الطاقة · تخزين الشبكة",
      "Air quality · Ocean acidification · Plastic waste · Soil degradation · Public health":
        "جودة الهواء · تحمض المحيطات · نفايات البلاستيك · تدهور التربة · الصحة العامة",
      "2 decades": "عشر سنوات",
      "1 year": "سنة واحدة",
      "Every region": "كل منطقة",
      "What did the IPCC conclude about the cause of global warming?":
        "ما الذي خلص إليه IPCC بشأن سبب الاحتباس الحراري؟",
      "That human activity has unequivocally caused it": "أن النشاط البشري قد سببه بشكل لا يقبل الشك",
      "That it is caused by natural cycles only": "أن الدورات الطبيعية وحدها هي السبب",
      "That the cause is still unknown": "أن السبب ما زال مجهولًا",
      "That it stopped in 2000": "أنه توقف عام 2000",
      "By roughly how much has global surface temperature risen between 1850–1900 and 2011–2020?":
        "بكم تقريبًا ارتفعت حرارة سطح الأرض العالمية بين 1850–1900 و2011–2020؟",
      "0.3°C": "0.3°م",
      "2.5°C": "2.5°م",
      "5.0°C": "5.0°م",
      "What happens to climate risks as warming increases?":
        "ماذا يحدث لمخاطر المناخ مع زيادة الاحترار؟",
      "They stay the same after 1.5°C": "تبقى كما هي بعد 1.5 درجة",
      "Only flooding increases": "تزيد الفيضانات فقط",
      "They escalate with every increment of warming": "تتصاعد مع كل زيادة في الاحترار",
      "They decrease as emissions fall": "تنخفض مع تراجع الانبعاثات",
      "Which two technologies work together to deliver water only when soil is dry?":
        "ما التقنيتان اللتان تعملان معًا لتوصيل الماء فقط عندما تكون التربة جافة؟",
      "Soil-moisture sensors and automated irrigation": "مستشعرات رطوبة التربة والري الآلي",
      "Satellites and desalination plants": "الأقمار الصناعية ومحطات تحلية المياه",
      "Why is measuring resource use the essential first step?":
        "لماذا قياس استهلاك الموارد هو الخطوة الأولى الأساسية؟",
      "Because measurement replaces all other action": "لأن القياس يحل محل كل الإجراءات الأخرى",
      "Because it is required by law": "لأنه مطلوب قانونًا",
      "Because you cannot improve what you have not measured": "لأنك لا يمكنك تحسين ما لم تقسه",
      "Because sensors are cheap": "لأن المستشعرات رخيصة",


      /* --- eco calculator --- */
      "Answer a few everyday questions about energy, water, transport and habits. EcoSphere turns your answers into a personalised":
        "أجب عن بضعة أسئلة يومية عن الطاقة والمياه والنقل والعادات. يحوّل EcoSphere إجاباتك إلى",
      "Eco Score out of 100, together with practical suggestions you can start using today.":
        "نتيجة بيئية من 100، مع اقتراحات عملية يمكنك البدء بها اليوم.",
      "Complete the form to see your personalised profile.":
        "أكمل النموذج لعرض ملفك البيئي المخصّص.",
      "Please complete every question before calculating your score.":
        "يرجى الإجابة عن كل الأسئلة قبل حساب نتيجتك.",
      "1. How much electricity does your household use?": "١. كم تستهلك من الكهرباء أسرتك؟",
      "2. How many electronic devices do you use regularly?": "٢. كم عدد الأجهزة الإلكترونية التي تستخدمها بانتظام؟",
      "3. How would you describe your water usage?": "٣. كيف تصف استهلاكك للمياه؟",
      "4. What is your main mode of transportation?": "٤. ما وسيلة تنقلك الأساسية؟",
      "5. How often do you travel with this method?": "٥. كم مرة تنتقل بهذه الوسيلة؟",
      "6. How are your recycling habits?": "٦. ما عاداتك في إعادة التدوير؟",
      "7. How often do you follow energy-saving habits?": "٧. كم تلتزم بعادات توفير الطاقة؟",
      "Low — 1–2 appliances, mindful use": "منخفض — جهاز أو اثنان، استخدام واعٍ",
      "Medium — typical daily household use": "متوسط — الاستخدام اليومي المعتاد",
      "High — many appliances, long hours": "مرتفع — أجهزة كثيرة وساعات طويلة",
      "1–2 devices": "جهاز أو جهازان",
      "3–5 devices": "٣ إلى ٥ أجهزة",
      "6 or more devices": "٦ أجهزة أو أكثر",
      "Low — short showers, taps rarely running": "منخفض — استحمام قصير والصنابير لا تعمل كثيرًا",
      "Medium — average household routines": "متوسط — روتين منزلي عادي",
      "High — frequent and long use": "مرتفع — استخدام متكرر وطويل",
      "Walking or cycling": "المشي أو ركوب الدراجة",
      "Public transportation": "النقل العام",
      "Electric vehicle": "مركبة كهربائية",
      "Conventional fuel vehicle": "مركبة وقود تقليدية",
      "Rarely — a few times a week": "نادرًا — بضع مرات في الأسبوع",
      "Regularly — most days": "بانتظام — معظم الأيام",
      "Frequently — long daily distances": "كثيرًا — مسافات يومية طويلة",
      "Good — I separate and recycle regularly": "جيد — أفصل وأعيد التدوير بانتظام",
      "Some — only for certain materials": "جزئيًا — لمواد محددة فقط",
      "Limited — recycling is rare for me": "محدود — نادرًا ما أعيد التدوير",
      "Always — lights off, devices unplugged": "دائمًا — الأنوار مطفئة والأجهزة مفصولة",
      "Often — when I remember": "غالبًا — عندما أتذكر",
      "Rarely — I rarely think about it": "نادرًا — لا أفكر فيها كثيرًا",

      /* --- green technology --- */
      "Green technology means using engineering and digital systems to reduce environmental impact. Select any card to open a detailed explanation.":
        "التكنولوجيا الخضراء تعني استخدام الهندسة والأنظمة الرقمية لتقليل الأثر البيئي. اختر أي بطاقة لعرض شرح مفصّل.",
      "Solar Energy": "الطاقة الشمسية",
      "Wind Energy": "طاقة الرياح",
      "Smart Grids": "الشبكات الذكية",
      "Green Buildings": "المباني الخضراء",
      "Carbon Capture": "التقاط الكربون",
      "Digital Environmental Monitoring": "الرصد البيئي الرقمي",
      "Converts sunlight into electricity through photovoltaic cells, with no fuel burned during operation.":
        "تحوّل ضوء الشمس إلى كهرباء عبر الخلايا الكهروضوئية، دون حرق أي وقود أثناء التشغيل.",
      "Uses turbine blades driven by moving air to generate power without direct emissions.":
        "تستخدم شفرات عنفية تديرها حركة الهواء لتوليد الكهرباء دون انبعاثات مباشرة.",
      "An electrical network that monitors and balances supply and demand using digital control.":
        "شبكة كهربائية تراقب وتوازن بين العرض والطلب باستخدام التحكم الرقمي.",
      "Structures designed to use less energy through insulation, efficient systems and smart controls.":
        "مبانٍ مصمّمة لاستهلاك طاقة أقل عبر العزل والأنظمة الموفّرة والتحكم الذكي.",
      "Techniques that separate and store carbon dioxide before it reaches the atmosphere.":
        "تقنيات تفصل وثاني أكسيد الكربون قبل وصوله إلى الغلاف الجوي.",
      "Air, water and soil sensors that report conditions so problems are found early.":
        "مستشعرات للهواء والماء والتربة تُبلّغ عن الظروف ليُكتشف المشكلات مبكرًا.",
      "What is it?": "ما هو؟",
      "How it works?": "كيف يعمل؟",
      "Technology's role?": "دور التكنولوجيا؟",
      "Addresses?": "ما التحدي الذي يعالجه؟",
      "Panels that turn light into current.": "ألواح تحوّل الضوء إلى تيار كهربائي.",
      "A rotor and generator driven by wind.": "دوّار ومولّد تدفعهما الرياح.",
      "A network with sensors, meters and automated control software.":
        "شبكة تحتوي مستشعرات وعدادات وبرمجيات تحكّم آلي.",
      "Buildings engineered around efficiency and low-impact materials.":
        "مبانٍ مصمّمة حول الكفاءة والمواد منخفضة الأثر.",
      "Filters and absorption systems that trap carbon dioxide.":
        "مرشّحات وأنظمة امتصاص تحتجز ثاني أكسيد الكربون.",
      "Networks of low-cost sensors plus cloud dashboards.":
        "شبكات مستشعرات منخفضة التكلفة مع لوحات متابعة سحابية.",
      "Photovoltaic cells release electrons when struck by light.":
        "تحرّر الخلايا الكهروضوئية الإلكترونات عند سقوط الضوء عليها.",
      "Aerodynamic lift spins the blades, turning a shaft connected to a generator.":
        "تدور الشفرات بفعل الرفع الهوائي فتدير عمودًا متصلًا بمولّد.",
      "Real-time data guides where power flows and when storage is charged.":
        "توجّه البيانات اللحظية مسار التيار وموعد شحن التخزين.",
      "Sensors adjust lighting, heating and cooling according to real occupancy.":
        "تضبط المستشعرات الإضاءة والتدفئة والتبريد حسب الإشغال الفعلي.",
      "Gas passes through a material that binds the carbon, then it is stored safely.":
        "يمر الغاز عبر مادة ترتبط بالكربون، ثم يُخزَّن بأمان.",
      "Devices sample the environment and send readings to software for analysis.":
        "تقيس الأجهزة حالة البيئة وترسل القراءات إلى برمجيات للتحليل.",
      "Inverters, smart meters and weather-monitoring software improve output and balance supply.":
        "تحسّن العاكسات والعدادات الذكية وبرمجيات مراقبة الطقس الإنتاجية وتوازن العرض.",
      "Sensors adjust blade angle to match wind speed and protect the turbine.":
        "تضبط المستشعرات زاوية الشفرات لتناسب سرعة الرياح وتحمي العنفة.",
      "Automation reduces waste and integrates variable renewable sources.":
        "يقلل الأتمتة الهدر ويدمج المصادر المتجددة المتغيّرة.",
      "Building-management systems tune conditions automatically.":
        "ضبط أنظمة إدارة المباني الظروف تلقائيًا.",
      "Monitoring verifies that stored carbon stays where intended.":
        "يؤكد الرصد أن الكربون المخزَّن يبقى في مكانه المقصود.",
      "Turns invisible changes into visible, actionable information.":
        "تحوّل التغيرات غير المرئية إلى معلومات مرئية وقابلة للتطبيق.",
      "Energy-related emissions.": "الانبعاثات المرتبطة بالطاقة.",
      "Fossil-fuel dependence.": "الاعتماد على الوقود الأحفوري.",
      "Energy efficiency and grid stability.": "كفاءة الطاقة واستقرار الشبكة.",
      "Urban energy demand.": "الطلب على الطاقة في المدن.",
      "Hard-to-decarbonise industrial emissions.": "الانبعاثات الصناعية الصعبة الحدّ من الكربون.",
      "Pollution and resource loss.": "التلوث وفقد الموارد.",

      /* --- smart agriculture --- */
      "Farming depends on weather, soil and water — all of which technology can measure. Smart agriculture uses that information to make better decisions with fewer resources.":
        "تعتمد الزراعة على الطقس والتربة والماء، وكلها أمور تستطيع التكنولوجيا قياسها. تستخدم الزراعة الذكية هذه المعلومات لاتخاذ قرارات أفضل بموارد أقل.",
      "Smart Irrigation": "الري الذكي",
      "Soil Monitoring": "مراقبة التربة",
      "Weather Monitoring": "مراقبة الطقس",
      "Sensors & IoT": "المستشعرات وإنترنت الأشياء",
      "Efficient Water Usage": "الاستخدام الكفء للمياه",
      "Data-Driven Farming": "زراعة قائمة على البيانات",
      "Water is delivered only when the crop and the soil actually need it, instead of on a fixed schedule.":
        "يُسلَّم الماء فقط عندما يحتاجه المحصول والتربة فعلًا، بدلًا من جدول ثابت.",
      "Probes measure moisture, temperature and nutrients so fertiliser is applied only where it helps.":
        "تقيس المجسات الرطوبة والحرارة والمغذيات ليُضاف السماد حيث يفيد فقط.",
      "Local stations and forecasting tools warn of rain, frost or heat before it affects the harvest.":
        "تحذّر المحطات المحلية وأدوات التنبؤ من المطر أو الصقيع أو الحر قبل أن يؤثر في الحصاد.",
      "Small networked devices report field conditions continuously instead of relying on occasional visits.":
        "تبلغ أجهزة شبكية صغيرة عن حالة الحقل باستمرار بدلًا من الاعتماد على زيارات متفرقة.",
      "Drip systems and moisture-based control reduce evaporation and the water lost to over-irrigation.":
        "تقلل أنظمة التنقيط والتحكم بالرطوبة التبخر والمياه المفقودة بسبب الري الزائد.",
      "Records from each season become a map of what worked, guiding the next planting decision.":
        "تصبح سجلات كل موسم خريطة لما نجح، فتساعد في قرار الزراعة التالي.",
      "Choose the situation your farm is facing and EcoSphere will suggest a technology response.":
        "اختر الموقف الذي تواجهه مزرعتك وسيقترح EcoSphere استجابة تكنولوجية.",
      "High Water Usage": "استهلاك مياه مرتفع",
      "Hot Weather": "طقس حار",
      "Low Soil Moisture": "رطوبة تربة منخفضة",
      "Changing Conditions": "ظروف متغيّرة",
      "Select a situation above to receive a practical recommendation.":
        "اختر موقفًا أعلاه للحصول على توصية عملية.",

      /* --- transportation --- */
      "How people and goods move shapes energy use and air quality. Select a transport option to see the technology and sustainability considerations behind it.":
        "تحدد طريقة تنقل الأشخاص والبضائع استهلاك الطاقة وجودة الهواء. اختر وسيلة نقل لترى الجوانب التقنية والاستدامة خلفها.",
      "Walking": "المشي",
      "Bicycle": "الدراجة",
      "Public Transport": "النقل العام",
      "Electric Vehicle": "المركبة الكهربائية",
      "Conventional Vehicle": "المركبة التقليدية",
      "Sustainable Transportation": "النقل المستدام",
      "Resource use": "استخدام الموارد",
      "Environment": "البيئة",
      "Technology involved": "التكنولوجيا المستخدمة",
      "Sustainability benefit": "الفائدة للاستدامة",
      "Human-powered travel with no vehicle energy demand": "تنقّل بقوة الإنسان دون طلب طاقة للمركبة",
      "Efficient human-powered transport": "نقل فعّال بقوة الإنسان",
      "Shared mobility that spreads the energy cost across passengers": "تنقّل مشترك يوزّع كلفة الطاقة على الركاب",
      "Electrified transport powered by a grid": "نقل كهربائي يعمل بالشبكة",
      "Combustion-powered private transport": "نقل خاص يعمل بالاحتراق",
      "Uses no fuel and very little energy beyond the food your body needs. The main environmental consideration is the production of shoes and clothing over time.":
        "لا يستخدم وقودًا ويستهلك طاقة ضئيلة جدًا بخلاف ما يحتاجه جسمك من طعام. أهم الاعتبارات البيئية هي إنتاج الأحذية والملابس مع الوقت.",
      "Requires little energy to operate and can replace higher-energy trips for most city distances. Parts and manufacturing carry an embodied cost.":
        "لا يحتاج طاقة كبيرة للتشغيل ويمكنه استبدال الرحلات الأعلى استهلاكًا ضمن معظم مسافات المدينة، مع تحمل تكلفة كامنة للأجزاء والتصنيع.",
      "One vehicle serving many travellers uses its energy more efficiently than the same number of private cars. Occupancy and route efficiency matter.":
        "مركبة واحدة تخدم عددًا كبيرًا من المسافرين، تستهلك طاقتها بكفاءة أعلى من العدد نفسه من السيارات الخاصة. عدد الركاب وكفاءة المسار مهمّان.",
      "Moves from fuel to electricity, so the environmental result depends on how that electricity is generated. Battery manufacturing also requires raw materials.":
        "تنتقل من الوقود إلى الكهرباء، لذا تعتمد النتيجة البيئية على طريقة توليد الكهرباء. كما يتطلب تصنيع البطاريات مواد خام.",
      "Depends on liquid fuel refined from fossil sources, and carries the energy cost of producing and transporting that fuel.":
        "تعتمد على وقود سائل مُكرّر من مصادر أحفورية، وتحمل كلفة إنتاج ونقل ذلك الوقود.",
      "Produces no direct exhaust or noise at street level, so it also improves local air quality around busy streets.":
        "لا ينتج عادمًا أو ضجيجًا مباشرًا على مستوى الشارع، فيحسّن أيضًا جودة الهواء المحلية حول الشوارع المزدحمة.",
      "No exhaust emissions while riding, and a very small footprint compared with motorized options.":
        "لا انبعاثات عادم أثناء التنقّل، وبصمة بيئية صغيرة جدًا مقارنة بالخيارات الآلية.",
      "Fewer vehicles on the road means less congestion, less noise and generally better local air quality.":
        "مركبات أقل على الطريق تعني ازدحامًا وضجيجًا أقل وجودة هواء محلي أفضل عمومًا.",
      "Produces no tailpipe exhaust, which improves street-level air quality even where the electricity mix is not yet fully renewable.":
        "لا ينتج عادمًا من العادم، فيحسّن جودة الهواء على مستوى الشارع حتى لو لم يكن مزيج الكهرباء متجددًا بالكامل بعد.",
      "Produces tailpipe emissions and noise, contributing to poorer local air quality in dense areas.":
        "ينتج انبعاثات وضجيجًا من العادم، بما يسهم في رداءة جودة الهواء في المناطق الكثيفة.",
      "Route-planning and navigation apps, step counters, and walking data recorded by phones make active travel measurable.":
        "تطبيقات تخطيط المسارات والملاحة وعدّادات الخطوات والبيانات التي تسجّلها الهواتف تجعل التنقّل النشط قابلًا للقياس.",
      "Activity trackers, GPS devices, smart helmets and cycle-route planners all support safer, better-planned journeys.":
        "أجهزة تتبّع النشاط وأجهزة تحديد المواقع والخوذ الذكية ومخطّطو مسارات الدراجات يدعمون رحلات أكثر أمانًا وتخطيطًا.",
      "Integrated ticketing, real-time arrival displays, demand-responsive routing and passenger counting data improve the service.":
        "التذاكر المتكاملة وشاشات الوصول اللحظية والمسارات المتجاوبة مع الطلب وبيانات عدّ الركاب تحسّن الخدمة.",
      "Battery management systems, smart charging, route planners and home-to-grid software optimise when charging happens.":
        "أنظمة إدارة البطاريات والشحن الذكي ومخطّطو المسارات وبرمجيات الربط بين المنزل والشبكة تحسّن توقيت الشحن.",
      "Efficient engines, aerodynamics, lighter materials and route software all reduce the energy used per trip.":
        "المحركات الموفّرة والديناميكا الهوائية والمواد الأخف وبرمجيات المسارات تخفض الطاقة المستخدمة في كل رحلة.",
      "Adds physical activity while removing a trip from the transport system entirely.":
        "يضيف نشاطًا بدنيًا ويلغي رحلة من نظام النقل كليًا.",
      "Delivers useful transport for a fraction of the energy, and supports healthy routines at the same time.":
        "يوفّر نقلًا مفيدًا بجزء بسيط من الطاقة، ويدعم العادات الصحية في الوقت نفسه.",
      "Connects communities to work and education while keeping road space for those who need it.":
        "يربط المجتمعات بالعمل والتعليم مع إبقاء مساحة الطريق لمن يحتاجها.",
      "Can be paired with solar generation so the vehicle becomes part of a home's energy system.":
        "يمكن ربطها بتوليد شمسي لتصبح المركبة جزءًا من نظام الطاقة المنزلي.",
      "Presents a clear baseline — and therefore a clear target for what technology can improve.":
        "تمثّل خط أساس واضحًا، وبالتالي هدفًا واضحًا لما يمكن للتكنولوجيا تحسينه.",
      "Educational summary — EcoSphere does not publish or imply specific emission figures.":
        "ملخّص تعليمي — لا ينشر EcoSphere أرقام انبعاثات محددة أو يوحي بها.",
      "Educational summary — relative comparisons only; no verified figures are claimed.":
        "ملخّص تعليمي — مقارنات نسبية فقط، ولا يُدَّعى وجود أرقام موثّقة.",
      "Educational summary — impact depends strongly on how full the service is.":
        "ملخّص تعليمي — يعتمد الأثر بدرجة كبيرة على امتلاء الخدمة.",
      "Educational summary — the electricity source is the decisive factor.":
        "ملخّص تعليمي — مصدر الكهرباء هو العامل الحاسم.",
      "Educational summary — EcoSphere deliberately avoids stating specific emission values.":
        "ملخّص تعليمي — يتجنب EcoSphere ذكر أرقام انبعاثات محددة عن قصد.",

      /* --- eco tips --- */
      "Small, repeatable actions. Pick one for this week.":
        "أفعال صغيرة قابلة للتكرار. اختر واحدًا لهذا الأسبوع.",
      "Switch off the standby load":
        "أطفئ استهلاك وضع الاستعداد",
      "TVs, chargers and desktop computers left in standby still draw power. A single power strip switched off at the end of the day removes many small losses at once.":
        "التلفزيونات والشواحن وأجهزة الكمبيوتر المكتبية الموصولة في وضع الاستظار تستهلك الكهرباء. فصل شريط كهرباء واحد في نهاية اليوم يزيل خسائر صغيرة كثيرة دفعة واحدة.",
      "Choose efficiency before size":
        "اختر الكفاءة قبل الحجم",
      "When replacing an appliance, look at the energy label and pick the model that does the same job with less consumption — a cheaper purchase often costs more to run.":
        "عند استبدال أي جهاز، انظر إلى ملصق كفاءة الطاقة واختر الطراز الذي يؤدي المهمة نفسها باستهلاك أقل — فالشراء الأرخص غالبًا يكلّف أكثر في التشغيل.",
      "Turn off the tap while brushing":
        "أغلق الصنبور أثناء تنظيف الأسنان",
      "A tap left running uses several litres per minute. Closing it while you brush is the simplest water saving available, and it costs nothing.":
        "الصنبور المفتوح يستهلك عدة لترات في الدقيقة. إغلقه أثناء تنظيف الأسنان أبسط توفير متاح للمياه، وهو مجاني تمامًا.",
      "Use a timer for outdoor watering":
        "استخدم مؤقتًا لري الحديقة",
      "Watering early morning or late evening reduces evaporation. A simple timer or a soil-moisture sensor makes the correct time automatic.":
        "الري في الصباح الباكر أو آخر المساء يقلل التبخر. مؤقت بسيط أو مستشعر رطوبة التربة يجعل التوقيت الصحيح تلقائيًا.",
      "Refill before you replace":
        "أعد التعبئة قبل الاستبدال",
      "Refillable bottles, jars and stationery cut packaging waste quickly. The rule is simple: repair and refill first, buy new only when there is no alternative.":
        "القوارير والأوعية والأدوات المكتبية القابلة لإعادة التعبئة تقلل نفايات التغليف بسرعة. القاعدة بسيطة: أصلح وأعد التعبئة أولًا، ولا تشترِ جديدًا إلا عند عدم وجود بديل.",
      "Sort before you throw":
        "افصل قبل أن ترمي",
      "Separating paper, plastic, glass and metal at the point of disposal makes recycling far more effective than sorting a mixed bin later.":
        "فصل الورق والبلاستيك والزجاج والمعدن لحظة رميها يجعل إعادة التدوير أكثر فعالية بكثير من فرز سلة مختلطة لاحقًا.",
      "Replace one short car trip":
        "استبدل رحلة قصيرة بالسيارة",
      "Walk or cycle for one nearby journey each week. Over a year these small substitutions add up without changing your whole routine.":
        "امشُ أو استخدم الدراجة لرحلة قريبة واحدة كل أسبوع. على مدار العام تتراكم هذه الاستبدالات الصغيرة دون تغيير روتينك بالكامل.",
      "Plan the route, not just the destination":
        "خطّط للطريق لا للوجهة فقط",
      "Navigation apps can show the fastest and often the most efficient route. Combining nearby errands into one trip saves both time and energy.":
        "تطبيقات الملاحة تعرض عادةً أسرع طريق وأكثره كفاءة. ودمج المهام القريبة في رحلة واحدة يوفّر الوقت والطاقة معًا.",
      "Track one resource for a month":
        "تابع موردًا واحدًا لمدة شهر",
      "Pick one number — electricity, water or fuel — and record it weekly. Seeing the trend in a simple log is usually more persuasive than intention.":
        "اختر رقمًا واحدًا — الكهرباء أو الماء أو الوقود — وسجّله أسبوعيًا. رؤية الاتجاه في سجل بسيط أكثر إقناعًا عادةً من النية وحدها.",
      "Use one app instead of five":
        "استخدم تطبيقًا واحدًا بدل خمسة",
      "A single dashboard that shows energy, water and travel is easier to keep using than several tools, and easier to act on.":
        "لوحة واحدة تعرض الطاقة والمياه والتنقّل أسهل في الاستمرار من عدة أدوات، وأسهل لاتخاذ إجراء.",
      "Share what actually worked":
        "شارك ما نجح فعلًا",
      "Tell one person about the change that stuck for you. Habits spread through conversation far more reliably than through reminders alone.":
        "أخبر شخصًا واحدًا بالتغيير الذي ثبت معك. العادات تنتشر بالحديث أكثر ثباتًا من التذكيرات وحدها.",
      "Learn one smart-agriculture idea":
        "تعلّم فكرة واحدة من الزراعة الذكية",
      "Soil sensors and weather stations show how technology saves water on a real farm. Understanding the system makes the idea easier to support.":
        "مستشعرات التربة ومحطات الطقس توضّح كيف توفّر التكنولوجيا المياه في مزرعة حقيقية، وفهم النظام يجعل دعم الفكرة أسهل.",
      "Digital": "رقمي",
      "Community": "المجتمع",

      /* --- quiz --- */
      "Eight questions covering climate, energy, water, agriculture and green technology. Choose the answer that fits best — you will get feedback either way.":
        "ثمانية أسئلة تغطي المناخ والطاقة والمياه والزراعة والتكنولوجيا الخضراء. اختر الإجابة الأنسب — وستحصل على شرح في الحالتين.",
      "Quiz progress": "تقدّم الاختبار",
      "Answer choices": "خيارات الإجابة",
      "Challenge complete": "انتهى التحدي",
      "Which technology converts sunlight directly into electricity?":
        "أي تقنية تحوّل ضوء الشمس مباشرة إلى كهرباء؟",
      "Solar panels": "الألواح الشمسية",
      "Wind turbines": "العنفات الهوائية",
      "Smart meters": "العدادات الذكية",
      "Water filters": "مرشحات المياه",
      "What is the main purpose of soil-moisture sensors in smart agriculture?":
        "ما الغرض الأساسي من مستشعرات رطوبة التربة في الزراعة الذكية؟",
      "To make crops grow taller": "لجعل المحاصيل أطول",
      "To irrigate according to actual soil conditions": "للري وفق حالة التربة الفعلية",
      "To replace the need for farmers": "لاستبدال حاجة المزارعين",
      "To measure sunlight only": "لقياس ضوء الشمس فقط",
      "Why does a smart grid help when renewable energy is added to a network?":
        "لماذا تساعد الشبكة الذكية عند إضافة طاقة متجددة إلى الشبكة؟",
      "It stores electricity in batteries only": "لأنها تخزن الكهرباء في البطاريات فقط",
      "It removes the need for any monitoring": "لأنها تلغي الحاجة إلى أي رصد",
      "It balances variable supply and demand in real time": "لأنها توازن العرض والطلب المتغيّر في الوقت الحقيقي",
      "It increases the cost of electricity": "لأنها ترفع تكلفة الكهرباء",
      "Which action reduces household water waste the most directly?":
        "أي إجراء يقلل هدر المياه المنزلي بشكل مباشر أكثر من غيره؟",
      "Fixing a dripping tap and using a shower timer": "إصلاح صنبور متسرب واستخدام مؤقت للاستحمام",
      "Buying a larger water tank": "شراء خزان مياه أكبر",
      "Drinking more water": "شرب مزيد من الماء",
      "Washing the car more often": "غسل السيارة أكثر",
      "What does an energy label help a consumer do?":
        "بماذا يساعد ملصق كفاءة الطاقة المستهلك؟",
      "Compare how much energy appliances use before buying": "مقارنة استهلاك الأجهزة للطاقة قبل الشراء",
      "Predict future electricity prices": "التنبّؤ بأسعار الكهرباء المستقبلية",
      "Guarantee lower bills forever": "ضمان فواتير أقل دائمًا",
      "Measure the weather": "قياس الطقس",
      "Why can an electric vehicle be better for local air quality?":
        "لماذا قد تكون المركبة الكهربائية أفضل لجودة الهواء المحلية؟",
      "Because it produces no tailpipe exhaust": "لأنها لا تنتج عادمًا من العادم",
      "Because it uses no electricity at all": "لأنها لا تستخدم كهرباء إطلاقًا",
      "Because it makes roads wider": "لأنها توسّع الطرق",
      "Because batteries absorb carbon dioxide": "لأن البطاريات تمتص ثاني أكسيد الكربون",
      "Which statement best describes climate change?":
        "أي عبارة تصف التغير المناخي بشكل أدق؟",
      "A single very cold winter": "شتاء بارد واحد",
      "A long-term shift in average climate patterns": "تحوّل طويل الأمد في أنماط المناخ المتوسطة",
      "The weather forecast for tomorrow": "توقعات الطقس للغد",
      "Any dry season": "أي موسم جفاف",
      "What is the most useful first step when a resource problem is not visible?":
        "ما أنفع خطوة أولى عندما تكون مشكلة مورد غير مرئية؟",
      "Wait until it becomes a crisis": "الانتظار حتى تتحول إلى أزمة",
      "Measure it with a sensor or a simple log": "قياسها بمستشعر أو سجل بسيط",
      "Stop using the resource entirely": "التوقف عن استخدام المورد كليًا",
      "Replace every device at once": "استبدال كل الأجهزة دفعة واحدة",
      "Correct. Photovoltaic cells release electrons when light strikes them, turning sunlight into current.":
        "إجابة صحيحة. تحرّر الخلايا الكهروضوئية الإلكترونات عند سقوط الضوء عليها، فيتحوّل ضوء الشمس إلى تيار كهربائي.",
      "Solar panels are the technology that converts light into electricity. Wind turbines use moving air instead.":
        "الألواح الشمسية هي التقنية التي تحوّل الضوء إلى كهرباء، أما العنفة الهوائية فتستخدم حركة الهواء.",
      "Correct. Sensors report real conditions, so water is delivered when the crop and soil actually need it.":
        "إجابة صحيحة. تبلّغ المستشعرات عن الظروف الفعلية، فيصل الماء عندما يحتاجه المحصول والتربة حقًا.",
      "Sensors measure moisture so irrigation can be scheduled from real conditions rather than a fixed timetable.":
        "تقيس المستشعرات الرطوبة ليُجدوَل الري وفق ظروف حقيقية لا وفق جدول ثابت.",
      "Correct. Automated control uses live data to balance supply and demand as solar and wind output changes.":
        "إجابة صحيحة. يستخدم التحكم الآلي بيانات حيّة لمازنة العرض والطلب مع تغيّر إنتاج الطاقة الشمسية والريحية.",
      "A smart grid's key job is balancing variable supply and demand using real-time data and automated control.":
        "مهمّة الشبكة الذكية هي موازنة العرض والطلب المتغيّر عبر بيانات لحظية وتحكّم آلي.",
      "Correct. Fixing leaks and limiting shower time addresses the two most common household losses.":
        "إجابة صحيحة. معالجة التسريبات وتحديد وقت الاستحمام تعالجان أكثر مصادر الهدر المنزلي شيوعًا.",
      "Leaks and long showers are the usual household losses, so repairing and timing directly reduces waste.":
        "التسريبات والاستحمام الطويل هما مصدرا الهدر المعتادان، لذا تقلّل المعالجة والضبط الهدر مباشرة.",
      "Correct. The label lets you compare consumption for the same job, so a lower-running-cost choice becomes visible.":
        "إجابة صحيحة. يتيح الملصق مقارنة الاستهلاك لأداء المهمة نفسها، فيظهر الخيار الأقل كلفة تشغيلًا.",
      "The energy label is a comparison tool: it shows how much energy a product uses for the same task.":
        "ملصق كفاءة الطاقة أداة مقارنة: يُظهر مقدار الطاقة التي يستهلكها المنتج لأداء المهمة نفسها.",
      "Correct. It produces no tailpipe exhaust, which improves street-level air — though the wider impact still depends on the electricity source.":
        "إجابة صحيحة. لا تنتج عادمًا، مما يحسّن الهواء على مستوى الشارع، مع أن الأثر الأوسع يعتمد على مصدر الكهرباء.",
      "The local benefit comes from the absence of tailpipe exhaust. The overall impact still depends on how the electricity is generated.":
        "الفائدة المحلية تأتي من غياب العادم، أما الأثر الإجمالي فيعتمد على كيفية توليد الكهرباء.",
      "Correct. Climate change refers to a long-term shift in average patterns, not a single day's weather.":
        "إجابة صحيحة. يشير التغير المناخي إلى تحوّل طويل الأمد في الأنماط المتوسطة، لا إلى طقس يوم واحد.",
      "Climate is the long-term pattern; weather is the short-term state. A single cold winter does not define climate change.":
        "المناخ هو النمط طويل الأمد، أما الطقس فهو الحالة قصيرة الأمد. شتاء بارد واحد لا يعرّف التغير المناخي.",
      "Correct. You cannot improve what you do not measure — monitoring turns an invisible system into usable information.":
        "إجابة صحيحة. لا يمكنك تحسين ما لا تقيسه — فالرصد يحوّل نظامًا غير مرئي إلى معلومات قابلة للاستخدام.",
      "Measurement comes first. Once usage is visible, targeted and affordable improvements become possible.":
        "القياس يأتي أولًا. فور وضوح الاستخدام تصبح التحسينات المستهدفة والميسورة التكلفة ممكنة.",
      "You answered 0 of 8 correctly.": "أجبت عن 0 من 8 بشكل صحيح.",
      "A perfect round. You have a strong grasp of how climate and technology connect — try explaining one idea from this quiz to someone else to make it stick.":
        "جولة مثالية. لديك فهم قوي لكيفية ترابط المناخ والتكنولوجيا — جرّب أن تشرح فكرة واحدة من هذا الاختبار لشخص آخر لترسخ.",
      "Excellent work. You understand the core ideas well. Revisit the two topics you missed in the Green Technology section to reach full confidence.":
        "عمل ممتاز. أنت تفهم الأفكار الأساسية جيدًا. أعد مراجعة الموضوعين اللذين أخطأت فيهما في قسم التكنولوجيا الخضراء لتصل إلى ثقة كاملة.",
      "A good result. You have the foundations; a second pass through the Climate and Smart Agriculture sections will sharpen the rest.":
        "نتيجة جيدة. لديك الأساس؛ وجولة ثانية في قسمي المناخ والزراعة الذكية ستشذّب الباقي.",
      "A promising start. Every question you review is one more idea you can explain — work through the sections above, then restart the challenge.":
        "بداية واعدة. كل سؤال تراجعه فكرة إضافية تستطيع شرحها — راجع الأقسام أعلاه ثم أعد المحاولة.",
      "This is the beginning of the learning curve. Read the Climate overview and the Green Technology cards, then come back and try again — progress here is normal.":
        "هذه بداية منحنى التعلم. اقرأ نظرة عامة على المناخ وبطاقات التكنولوجيا الخضراء، ثم عد وحاول مرة أخرى — والتقدّم هنا أمر طبيعي.",

      /* --- technology flow --- */
      "The Core Idea": "الفكرة الأساسية",
      "How Technology Moves the Planet Forward": "كيف تق التكنولوجيا الكوكب إلى الأمام",
      "Every EcoSphere module follows the same six-step chain.":
        "تتبع كل وحدة في EcoSphere سلسلة من ست خطوات نفسها.",
      "Digital Technology": "التكنولوجيا الرقمية",
      "Smart Data": "البيانات الذكية",
      "Innovation": "الابتكار",
      "Efficient Resource Use": "الاستخدام الكفء للموارد",
      "Sustainable Future": "مستقبل مستدام",
      "Identify the environmental pressure that needs solving.":
        "تحديد الضغط البيئي الذي يحتاج إلى حل.",
      "Apply sensors, software and connected devices.":
        "تطبيق المستشعرات والبرمجيات والأجهزة المتصلة.",
      "Collect readings and turn them into clear information.":
        "جمع القراءات وتحويلها إلى معلومات واضحة.",
      "Design a better way to act on that information.":
        "تصميم طريقة أفضل للتعامل مع تلك المعلومات.",
      "Use less energy, water and material for the same result.":
        "استخدام طاقة وماء ومواد أقل للنتيجة نفسها.",
      "Scale what works so the impact lasts.":
        "توسيع ما ينجح ليبقى الأثر دائمًا.",

      /* --- why ecospheres --- */
      "Why EcoSphere?": "لماذا EcoSphere؟",
      "Programming turns awareness into action":
        "البرمجة تحوّل الوعي إلى فعل",
      "EcoSphere demonstrates how programming and digital technology can transform environmental awareness into an interactive educational experience. Instead of reading about climate change, visitors calculate a score, simulate a farm, compare transport options and test their knowledge — turning passive reading into active learning.":
        "يُظهر EcoSphere كيف يمكن للبرمجة والتكنولوجيا الرقمية أن تحوّل الوعي البيئي إلى تجربة تعليمية تفاعلية. بدلًا من القراءة عن التغير المناخي، يحسب الزائر نتيجة، ويحلّل مزرعة، ويقارن وسائل النقل، ويختبر معارفه — محوّلًا القراءة السلبية إلى تعلم نشط.",
      "The project connects five things that are often taught separately: people, technology, knowledge, resources and climate. Bringing them together in one interface shows how a single line of code can make an invisible system visible.":
        "يربط المشروع خمسة أمور تُدرَّس غالبًا بشكل منفصل: الناس والتكنولوجيا والمعرفة والموارد والمناخ. جمعها في واجهة واحدة يوضّح كيف يمكن لسطر واحد من البرمجة أن يجعل نظامًا غير مرئي مرئيًا.",
      "People": "الناس",
      "Technology": "التكنولوجيا",
      "Knowledge": "المعرفة",
      "Resources": "الموارد",
      "Everyday choices by users drive the learning.": "خيارات المستخدمين اليومية تقود التعلّم.",
      "Vanilla HTML, CSS and JavaScript power each interaction.":
        "تشغّل HTML و CSS و JavaScript النقية كل تفاعل.",
      "Concepts are explained in short, clear language.": "تُشرح المفاهيم بلغة قصيرة وواضحة.",
      "Energy, water and waste are tracked and scored.": "تُتابَع الطاقة والمياه والنفايات وتُحسب.",
      "Every module links back to a real environmental goal.":
        "كل وحدة ترتبط بهدف بيئي حقيقي.",

      /* --- technologies used --- */
      "Technologies Used": "التقنيات المستخدمة",
      "Built with three web technologies": "مبني بثلاث تقنيات ويب",
      "No frameworks, no backend, no database — just the browser.":
        "بلا أطر عمل، وبلا خادم خلفي، وبلا قاعدة بيانات — المتصفح فقط.",
      "Structure and semantic content — landmarks, headings, forms and ARIA attributes that make the project accessible and machine-readable.":
        "البنية والمحتوى الدلالي — المعالم والعناوين والنماذج وسمات ARIA التي تجعل المشروع متاحًا وقابلًا للقراءة آليًا.",
      "Visual identity, responsive design, animation and theming — including two purpose-built light and dark palettes driven by custom properties.":
        "الهوية البصرية والتصميم المتجاوب والحركة والتنسيق — بما في ذلك لوحتا ألوان مصممتان خصيصًا للفاتح والداكن عبر الخصائص المخصصة.",
      "Interactivity, calculations, quiz logic, personalisation and dynamic content — all running client-side with no dependencies.":
        "التفاعلية والحسابات ومنطق الاختبار والتخصيص والمحتوى الديناميكي — كلها تعمل في متصفح المستخدم دون أي اعتماديات.",
      "Semantic sections": "أقسام دلالية",
      "Accessible forms": "نماذج متاحة",
      "Inline SVG icons": "أيقونات SVG مدمجة",
      "CSS variables": "متغيّرات CSS",
      "Grid & flexbox": "الشبكة و Flexbox",
      "Keyframe motion": "حركة الإطارات الأساسية",
      "Score engine": "محرك النتيجة",
      "State management": "إدارة الحالة",
      "localStorage": "التخزين المحلي",

      /* --- about --- */
      "About EcoSphere": "عن EcoSphere",
      "Mission": "الرسالة",
      "Vision": "الرؤية",
      "Mission Statement": "بيان الرسالة",
      "100% client-side": "يعمل في المتصفح بالكامل",
      "Dual theme": "نمطان للعرض",
      "Fully responsive": "متجاوب بالكامل",
      "EcoSphere is an interactive educational technology project designed around the relationship between climate change and technology. It presents the idea that software, sensors and smart systems can support climate understanding and more efficient use of resources — and it does so entirely inside a web browser.":
        "EcoSphere مشروع تقني تعليمي تفاعلي صُمّم حول العلاقة بين التغير المناخي والتكنولوجيا. يقدّم فكرة أن البرمجيات والمستشعرات والأنظمة الذكية يمكن أن تدعم فهم المناخ واستخدامًا أكفأ للموارد — وكل ذلك داخل متصفح الويب.",
      "\"Turn climate awareness into interactive learning and practical digital solutions.\"":
        "«نحوّل الوعي المناخي إلى تعلّم تفاعلي وحلول رقمية عملية.»",
      "\"A future where technology helps people understand, manage, and protect the resources around them.\"":
        "«مستقبل تساعد فيه التكنولوجيا الناس على فهم الموارد من حولهم وإدارتها وحمايتها.»",

      /* --- footer --- */
      "Educational Project": "مشروع تعليمي",
      "Built for a national high-school competition on climate change and technology.":
        "صُمّم لمسابقة وطنية لطلاب المرحلة الثانوية حول التغير المناخي والتكنولوجيا.",
      "Climate figures are quoted from the IPCC Sixth Assessment Report (2023). The Eco Score is a self-assessment exercise, not a scientific measurement.":
        "أرقام المناخ منقولة عن التقرير السادس للجنة المناخية الدولية (2023). أما النتيجة البيئية فهي تمرين تقييم ذاتي وليست قياسًا علميًا.",
      "EcoSphere — Technology for a Greener Tomorrow.":
        "EcoSphere — تكنولوجيا تصنع مستقبلًا أكثر اخضارًا.",

      /* --- calculator feedback --- */
      "Outstanding — your habits are already highly resource-efficient. Keep refining them and share what works.":
        "متميّز — عاداتك موفّرة للموارد بدرجة عالية. واصل تحسينها وشارك ما ينجح.",
      "Strong foundation — you already do a lot right, with clear room to improve efficiency further.":
        "أساس قوي — أنت تفعل الكثير بشكل صحيح، مع مجال واضح لمزيد من تحسين الكفاءة.",
      "Balanced profile — a good baseline that can grow with a few targeted changes.":
        "ملف متوازن — نقطة بداية جيدة يمكن أن تنمو بتغييرات موجّهة قليلة.",
      "Developing profile — your current profile shows opportunities to improve energy efficiency.":
        "ملف في التطوير — تُظهر حالتك الحالية فرصًا لتحسين كفاءة الطاقة.",
      "Starting point — every journey begins somewhere; small changes now build lasting habits.":
        "نقطة البداية — كل رحلة تبدأ من مكان ما؛ التغييرات الصغيرة اليوم تبني عادات دائمة.",
      "Your recommendations will appear here after you calculate your score.":
        "ستظهر توصياتك هنا بعد حساب نتيجتك.",
      "Next step": "الخطوة التالية",
      "Your current profile shows opportunities to improve energy efficiency. Switch off or unplug idle devices, and choose energy-efficient products when you replace appliances.":
        "تُظهر حالتك الحالية فرصًا لتحسين كفاءة الطاقة. أطفئ الأجهزة الخاملة أو افصلها، واختر منتجات موفّرة عند استبدال الأجهزة.",
      "Your energy profile is strong. A smart plug or power meter helps you confirm that low usage stays low over time.":
        "ملف الطاقة لديك قوي. يساعد قابس ذكي أو مقياس كهرباء في تأكيد بقاء استهلاكك منخفضًا مع الوقت.",
      "Consider smart water management: shorter showers, a low-flow shower head, and a simple meter or leak sensor to spot wasted water early.":
        "فكّر في إدارة ذكية للمياه: استحمام أقصر، ورأس دش منخفض التدفق، وعدّاد بسيط أو مستشعر تسرب لرصد الهدر مبكرًا.",
      "Your water habits are already efficient. Collecting rainwater for plants extends that habit at almost no cost.":
        "عاداتك في المياه موفّرة بالفعل. جمع مياه الأمطار لل植物ات يوسّع هذه العادة بتكلفة تكاد تكون معدومة.",
      "For part of your regular journeys, consider sustainable transportation: public transport, cycling, walking, or an electric vehicle for longer distances.":
        "لجزء من تنقّلاتك اليومية، فكّر في نقل مستدام: النقل العام، أو الدراجة، أو المشي، أو مركبة كهربائية للمسافات الأطول.",
      "Strong transport choice. A route-planning app can help you keep picking the lowest-impact option for each trip.":
        "اختيار نقل قوي. تطبيق لتخطيط المسارات يساعدك على اختيار أقل خيار أثرًا في كل رحلة.",
      "Improve recycling habits by starting with the easiest streams where you live — paper, plastic and metal — then add glass and textiles.":
        "حسّن عادات إعادة التدوير بالبدء بأكثر الفئات سهولة حيث تعيش — الورق والبلاستيك والمعدن — ثم أضف الزجاج والمنسوجات.",
      "Use digital tools to monitor resource consumption: an energy dashboard or a simple weekly usage note turns good intentions into a visible habit.":
        "استخدم أدوات رقمية لمتابعة استهلاك الموارد: لوحة طاقة أو ملاحظة أسبوعية بسيطة تحوّل النوايا الجيدة إلى عادة ملموسة.",
      "Your saving habits are solid. Automating them with timers, smart plugs or occupancy sensors makes them effortless to maintain.":
        "عاداتك في التوفير راسخة. أتمتتها عبر المؤقتات أو القوابس الذكية أو مستشعرات الإشغال يجعل الالتزام بلا جهد.",
      "Explore the Green Technology section to see which technologies — solar, smart grids or digital monitoring — support exactly the changes above.":
        "استكشف قسم التكنولوجيا الخضراء لترى أي التقنيات — الشمسية أو الشبكات الذكية أو الرصد الرقمي — تدعم التغييرات السابقة تحديدًا.",

      /* --- agriculture advisor --- */
      "Install soil-moisture probes at root depth, not only at the surface.":
        "ثبّت مجسات رطوبة التربة عند عمق الجذور، لا عند السطح فقط.",
      "Use drip lines so water reaches the root zone with less evaporation.":
        "استخدم خطوط التنقيط ليصل الماء إلى منطقة الجذور مع تبخر أقل.",
      "Track daily water use per zone to find leaks or blocked emitters quickly.":
        "تابع استهلاك الماء يوميًا لكل منطقة لاكتشاف التسربات أو الفوهات المسدودة بسرعة.",
      "Watch soil-moisture trends rather than a single reading — drying speed reveals heat stress early.":
        "راقب اتجاهات رطوبة التربة بدلًا من قراءة واحدة — فسرعة الجفاف تكشف الإجهاد الحراري مبكرًا.",
      "Use local weather stations to schedule watering before the hottest part of the day.":
        "استخدم محطات الطقس المحلية لجدولة الري قبل أحر جزء من اليوم.",
      "Pair moisture data with mulching or shading to cut evaporation further.":
        "اقترن بيانات الرطوبة بالتغطية أو التظليل لخفض التبخر أكثر.",
      "Set an alert threshold per crop stage — seedlings and mature plants differ.":
        "حدّد عتبة تنبيه لكل مرحلة من مراحل المحصول، فالبذور والنبات الناضج يختلفان.",
      "Verify the sensor with a manual reading before changing the whole irrigation plan.":
        "تحقق من المستشعر بقراءة يدوية قبل تغيير خطة الري بالكامل.",
      "Pair moisture data with a rain forecast so you do not water before rainfall.":
        "اقترن بيانات الرطوبة بتنبؤات الأمطار حتى لا تري قبل هطول المطر.",
      "Connect local weather forecasts to irrigation decisions rather than fixed timers.":
        "اربط تنبؤات الطقس المحلية بقرارات الري بدلًا من المؤقتات الثابتة.",
      "Keep a season log of what each field produced so next year's plan starts from evidence.":
        "احتفظ بسجل موسمي لإنتاج كل حقل كي تبدأ خطة العام القادم على أساس أدلة.",
      "Review sensor history weekly to separate real trends from a single bad reading.":
        "راجع سجل المستشعرات أسبوعيًا للتمييز بين الاتجاهات الحقيقية وقراءة واحدة خاطئة.",
      "Smart irrigation can help deliver water according to crop and soil conditions instead of on a fixed schedule. Scheduling from soil-moisture readings avoids the two common losses: over-watering and unnecessary pumping.":
        "يساعد الري الذكي على إيصال الماء وفق حالة المحصول والتربة بدلًا من جدول ثابت. فالجدولة بناءً على قراءات رطوبة التربة تتجنّب الفاقدَين الشائعين: الري الزائد والضخ غير الضروري.",
      "When heat is the limiting factor, technology shifts the focus from adding water to reducing stress: shade, timing and monitoring. Sensors let you irrigate early morning or late evening, when evaporation is lowest.":
        "عندما يكون الحر هو العامل المحدد، تنقل التكنولوجيا التركيز من إضافة الماء إلى تقليل الإجهاد: الظل والتوقيت والرصد. وتتيح المستشعرات الري في الصباح الباكر أو آخر المساء حيث يكون التبخر الأدنى.",
      "Moisture sensors turn an invisible shortage into a number you can act on. A threshold-based alert triggers irrigation only where and when the crop actually needs it.":
        "تحوّل مستشعرات الرطوبة نقصًا غير مرئي إلى رقم يمكنك التصرف بناءً عليه. وينبّه الحدّ الآلي إلى الري فقط حيث وحين يحتاجه المحصول فعلًا.",
      "Rapidly changing weather makes static schedules unreliable. Data-driven farming combines forecasts with field sensors, so the plan adapts instead of repeating yesterday's routine.":
        "يجعل الطقس سريع التغيّر الجداول الثابتة غير موثوقة. تجمع الزراعة القائمة على البيانات بين التنبؤات ومستشعرات الحقل، فيتكيّف الخطة بدلًا من تكرار روتين الأمس.",

      /* --- sidebar --- */
      "Close sidebar": "إغلاق القائمة الجانبية",
      "Sidebar": "القائمة الجانبية",
      "Sidebar navigation": "تنقّل القائمة الجانبية",

      /* --- remaining UI strings --- */
      "Interactive Dashboard": "لوحة تفاعلية",
      "Chapter 02 · Interactive Tool": "الفصل الثاني · أداة تفاعلية",
      "Chapter 07 · Gamified Learning": "الفصل السابع · تعلّم تفاعلي",
      "Eco Score": "النتيجة البيئية",
      "out of 100, together with practical suggestions you can start using today.":
        "من 100، مع اقتراحات عملية يمكنك البدء بها اليوم.",
      "This score is an educational self-assessment, not a scientific measurement.":
        "هذه النتيجة تقييم ذاتي تعليمي وليست قياسًا علميًا.",
      "Every module is built as a small lesson: understand the challenge, see the technology, try a tool, and leave with one practical action. The project is designed to be presented, explored and questioned, and it is written to remain fast and dependency-free.":
        "بُنيت كل وحدة كدرس صغير: افهم التحدي، شاهد التكنولوجيا، جرّب أداة، واغادر بفعل عملي واحد. صُمّم المشروع ليُعرض ويُستكشف ويُناقش، وكُتب ليبقى سريعًا بلا اعتماديات.",
      "HTML5 · CSS3 · JavaScript": "HTML5 · CSS3 · JavaScript",
      "Sphere": "Sphere",
      " tip explored of ": " نصيحة من ",
      " tips explored of ": " نصائح من ",
      "Tip ": "نصيحة ",
      "Best-estimate warming reaches 1.5°C in the near term in the considered scenarios and modelled pathways.":
        "يصل الاحترار التقديري الأفضل إلى 1.5 درجة مئوية قريبًا في السيناريوهات والمسارات النموذجية المدروسة.",
      "Every additional increment of global warming intensifies multiple and concurrent hazards at the same time.":
        "كل زيادة إضافية في الاحترار العالمي تعمّق مخاطر متعددة ومتزامنة في الوقت نفسه.",
      "Emissions implied by current national pledges make it likely that warming will exceed 1.5°C this century and harder to limit below 2°C.":
        "الانبعاثات التي يفترضها التعهدات الوطنية الحالية تجعل تجاوز 1.5 درجة مئوية هذا القرن محتملًا، وتحدّ من إمكانية إبقاء الاحترار دون درجتين.",
      "Deep, rapid and sustained reductions would slow warming discernibly within around two decades, and change atmospheric composition within a few years.":
        "الخفض العميق والسريع والمستدام للانبعاثات من شأنه أن يبطئ الاحترار بشكل ملموس خلال نحو عشرين عامًا، ويغيّر تركيب الغلاف الجوي خلال سنوات قليلة.",
      "The IPCC is explicit that for any given future warming level, many climate-related risks are higher than assessed previously, and that projected long-term impacts are up to multiple times higher than currently observed. Warming is not a threshold to be crossed once; it is a dial that turns every risk up together.":
        "يصرّ IPCC على أن أي مستوى مستقبلي معيّن من الاحترار يجعل كثيرًا من المخاطر المناخية أعلى مما قيّم سابقًا، وأن الآثار طويلة الأمد المتوقعة قد تصل إلى أضعاف ما هو مرصود حاليًا. الاحترار ليس عتبة تُتجاوز مرة واحدة، بل مقبض يرفع كل المخاطر معًا.",
      "Monitoring networks establish the record, climate models project forward, and mitigation technologies change the energy that produces the warming in the first place. The IPCC notes that feasible, effective and low-cost options for mitigation and adaptation are already available — the constraint is deployment, not invention.":
        "تضع شبكات الرصد السجل، وتُسقط النماذج المناخية صورة للمستقبل، وتغيّر تقنيات خفض الانبعاثات الطاقة التي تنتج الاحترار في المقام الأول. ويشير IPCC إلى أن خيارات قابلة للتنفيذ وفعالة ومنخفضة التكلفة للتخفيف والتكيف متاحة بالفعل — والعائق هو التطبيق، لا الاختراع.",
      "An extreme is an event that is rare for a particular place but not impossible — a heatwave that would have been extraordinary fifty years ago, a rainfall total that overwhelms drainage, a drought that lasts several seasons. The event itself is always possible; what changes is how often it happens and how strong it gets.":
        "الحالة المتطرفة حدث نادر في مكان بعينه لكن ليس مستحيلًا — موجة حر كانت استثنائية قبل خمسين عامًا، أو كمية أمطار تتجاوز قدرة الصرف، أو جفاف يستمر عدة مواسم. الحدث نفسه ممكن دائمًا؛ ما يتغير هو تكراره ودرجته.",
      "Heatwaves — prolonged high temperatures, often the deadliest hazard in many regions.":
        "موجات الحر — فترات ممتدة من الحرارة المرتفعة، وغالبًا أخطر خطر في مناطق كثيرة.",
      "Drought — extended periods of low rainfall, which interact with heat to dry soils and reservoirs.":
        "الجفاف — فترات طويلة من الأمطار القليلة، تتفاعل مع الحرارة لتجفّف التربة والخزانات.",
      "Cold and dry spells — extremes in every direction, not only towards warmth.":
        "الفترات الباردة والجافة — تطرفات في كل الاتجاهات، لا نحو الدفء وحده.",
      "A warmer atmosphere holds more moisture, so when that moisture condenses it releases more energy. The same storm therefore carries more potential rainfall. Warmer air also changes circulation patterns, which reshapes where heat, drought and rain are concentrated. This is why scientists speak of shifts in frequency and intensity rather than a simple multiplication of storms.":
        "الغلاف الجوي الأكثر دفئًا يحمل رطوبة أكثر، فحين يتكثف هذا البخار يحرر طاقة أكبر. لذلك تحمل العاصفة نفسها أمطارًا محتملة أعلى. والهواء الأدفأ يغيّر أنماط الدوران، فيعيد تشكيل انحصار الحرارة والجفاف والمطر. ولهذا يتحدث العلماء عن تغيّر في التكرار والشدة لا عن مضاعفة بسيطة لعدد العواصف.",
      "The difference between a disaster and an inconvenience is often measured in hours of lead time. Multi-hazard early warning systems combine detection, forecasting and communication into a single chain: sensors and satellites observe, models predict, and the message reaches the people who can act before the event arrives rather than after.":
        "الفرق بين الكارثة والمزعجة يُقاس غالبًا بساعات الإنذار المبكر. تجمع أنظمة الإنذار المبكر متعددة الأخطار الكشف والتنبؤ والتواصل في سلسلة واحدة: ترصد المستشعرات والأقمار الصناعية، وتتنبأ النماذج، وتصل الرسالة إلى القادرين على التصرف قبل وقوع الحدث لا بعده.",
      "Numerical weather prediction, satellite monitoring, radar networks and cheap IoT sensors have all widened the area that can be watched. The IPCC also notes that mitigation delivers co-benefits for air quality and health — cleaner energy reduces both greenhouse gases and the pollution that accompanies combustion.":
        "وسّع التنبؤ العددي بالطقس والرصد بالأقمار الصناعية وشبكات الرادار والمستشعرات الرخيصة عبر الإنترنت الأشياء المساحة التي يمكن مراقبتها. ويشير IPCC أيضًا إلى أن التخفيف会带来 فوائد مشتركة لجودة الهواء والصحة، فالطاقة الأنظف تقلل غازات الدفيئة والتلوث المصاحب للاحتراق معًا.",

      "Water and energy are bound together. Power stations need water for cooling, and pumping, filtering and moving water consumes electricity. When both are constrained at once, as happens in droughts, the effect is worse than either shortage alone. Managing one without seeing the other is why integrated planning matters.":
        "الماء والطاقة مرتبطان ببعضهما. تحتاج محطات الكهرباء إلى الماء للتبريد، واستخراج الماء وتنقيته ونقله يستهلك الكهرباء. وعندما يتقيّد الاثنان معًا، كما يحدث في مواسم الجفاف، يصبح الأثر أسوأ من نقص أحدهما وحده. وإدارة أحدهما دون رؤية الآخر هي سبب أهمية التخطيط المتكامل.",
      "Aquifers are often the first source cities turn to in dry periods, and the least visible. Water can be extracted faster than it recharges, and because groundwater is out of sight, over-draw is easy to miss until the wells themselves fail. Monitoring boreholes and modelling recharge is therefore a form of climate adaptation.":
        "غالبًا ما تكون المياه الجوفية أول مصدر تلجأ إليه المدن في الفترات الجافة، وهي الأقل وضوحًا. يمكن سحب الماء أسرع من إعادة تغذية الطبقة، ولأن المياه الجوفية بعيدة عن الأنظار يصعب اكتشاف السحب الزائد حتى تفشل الآبار نفسها. لذلك فإن رصد آبار المراقبة ونمذجة التغذية شكلًا من أشكال التكيف مع المناخ.",
      "Soil-moisture sensors and smart irrigation deliver water according to crop and soil condition instead of a fixed calendar.":
        "توصّل مستشعرات رطوبة التربة والري الذكي الماء وفق حالة المحصول والتربة بدلًا من جدول ثابت.",
      "Most energy is used as heat, not as electricity. Electric vehicles, heat pumps and induction heating are efficient partly because they move energy into the category where it is easiest to deliver cleanly, using a grid that increasingly runs on variable renewable sources. Efficiency and electrification are therefore related strategies rather than alternatives.":
        "تُستخدم معظم الطاقة على هيئة حرارة لا كهرباء. والمركبات الكهربائية والمضخات الحرارية والتدفئة بالحثّ كفاءة جزئيًا لأنها تنقل الطاقة إلى الفئة التي يسهل توصيلها نظيفًا، مستفيدة من شبكة تعمل بصورة متزايدة على مصادر متجددة متغيّرة. لذلك فإن الكفاءة والتمكين الكهربائي استراتيجيتان متلازمتان لا بديلان.",
      "Demand — how much energy is needed for the same outcome, which is what efficiency addresses.":
        "الطلب — مقدار الطاقة اللازمة للوصول إلى النتيجة نفسها، وهو ما تعالجه الكفاءة.",
      "Demand that can be shifted in time — using less at peak and more when renewables are generating.":
        "الطلب القابل للنقل الزمني — استخدام أقل في الذروة وأكثر حين تولّد المصادر المتجددة.",
      "An efficient appliance is not one that does less, but one that wastes less in performing the same task. The IPCC reports that policies and laws addressing mitigation have consistently expanded, and that rapid and far-reaching transitions across all sectors are necessary to achieve deep and sustained emissions reductions. It also finds that sufficient global capital exists to close the investment gaps — the barrier is how quickly that capital is directed, not its absence.":
        "الجهاز الموفّر ليس الجهاز الذي يفعل أقل، بل الجهاز الذي يهدر أقل وهو يؤدي المهمة نفسها. ويقدّر IPCC أن السياسات والقوانين المتعلقة بالتخفيف قد توسّعت باستمرار، وأن انتقالات سريعة وشاملة في جميع القطاعات ضرورية لتحقيق خفض عميق ومستدام للانبعاثات. كما يجد أن رأس المال العالمي الكافي موجود لسد فجوات الاستثمار — والعائق هو سرعة توجيه ذلك رأس المال، لا غيابه.",
      "Smart meters and energy dashboards make consumption visible, which is the precondition for every efficiency gain. Building-management systems tune lighting, heating and cooling to real occupancy. Forecasting software predicts renewable output so storage can be charged in advance. The IPCC highlights that enhancing technology innovation systems is key to accelerating widespread adoption.":
        "تجعل العدادات الذكية ولوحات الطاقة الاستهلاك مرئيًا، وهو شرط مسبق لكل مكسب في الكفاءة. وتضبط أنظمة إدارة المباني الإضاءة والتدفئة والتبريد حسب الإشغال الفعلي. وتتوقع برمجيات التنبؤ إنتاج الطاقة المتجددة ليُشحن التخزين مسبقًا. ويشير IPCC إلى أن تعزيز أنظمة الابتكار التكنولوجي هو مفتاح تسريع التبني الواسع.",

      "Solar panels generate at noon and not at night; wind output changes with the weather. A grid that mixes large amounts of both has to balance supply and demand continuously. That is what makes smart grids, storage, interconnectors and demand-response systems central rather than optional: without flexibility, clean generation cannot be used at the moment it is needed.":
        "تولّد الألواح الشمسية عند الظهر لا في الليل، ويتغيّر إنتاج الرياح مع الطقس. وعلى شبكة تمزج كميات كبيرة من الاثنتين أن توازن العرض والطلب باستمرار. وهذا ما يجعل الشبكات الذكية والتخزين والروابط بين المناطق وأنظمة الاستجابة للطلب محورية لا اختيارية: فبدون المرونة لا يمكن استخدام التوليد النظيف في اللحظة التي يحتاجه فيها.",
      "Air — fine particulate matter, nitrogen oxides, sulphur dioxide, ground-level ozone, volatile organic compounds and toxic metals.":
        "الهواء — الجسيمات الدقيقة وأكاسيد النيتروجين وثاني أكسيد الكبريت والأوزون قرب السطح والمركبات العضوية المتطايرة والمعادن السامة.",
      "Water — nutrients that cause eutrophication, pathogens, heavy metals, plastics, pharmaceuticals and industrial chemicals.":
        "الماء — العناصر الغذائية التي تسبب الإثراء الجيني، ومسببات الأمراض، والمعادن الثقيلة، والبلاستيك، والأدوية، والمواد الكيميائية الصناعية.",
      "The IPCC states that deep, rapid and sustained mitigation would deliver co-benefits, especially for air quality and health. This is a genuine and immediate benefit: cleaner energy reduces greenhouse gases and the particulates released by the same combustion. It also notes that options for reducing emission-intensive consumption, including behavioural and lifestyle changes, exist alongside technical ones.":
        "يقدّر IPCC أن التخفيف العميق والسريع والمستدام سيأتي بفوائد مشتركة، ولا سيما في جودة الهواء والصحة. وهذه فائدة حقيقية وفورية: فالطاقة الأنظف تقلل غازات الدفيئة والجسيمات الدقيقة التي يطلقها الاحتراق نفسه. كما يشير إلى أن خيارات تقليل الاستهلاك كثيف الانبعاثات، بما فيها التغييرات السلوكية وأسلوب الحياة، موجودة إلى جانب الخيارات التقنية.",
      "About a quarter of the carbon dioxide released by human activity dissolves into the ocean. It reacts with seawater to form carbonic acid, lowering pH and reducing the carbonate ions that shell-forming organisms such as corals and some plankton need. This is a different process from warming, but it is driven by the same emissions, which is why the two are usually discussed together.":
        "يذوب نحو ربع ثاني أكسيد الكربون الذي يطلقه النشاط البشري في المحيط. وهو يتفاعل مع مياه البحر مكوّنًا حمض الكربونيك، فيخفض الأس الهيدروجيني ويقلّل الأيونات الكربونية التي تحتاجها الأحياء المشكلة للأصداف مثل المرجان وبعض العوالق. وهذه عملية مختلفة عن الاحترار، لكن الانبعاثات نفسها هي التي تحركها، ولهذا تُناقشان معًا عادةً.",
      "Pollution is often invisible until it causes harm, and the source is frequently far from where it is detected. Air-quality networks, low-cost sensors, satellite instruments and remote sensing turn an unmeasured problem into a measured one. The IPCC notes that enhanced access to finance and technology is a critical enabler of climate action, which applies equally to monitoring pollution.":
        "غالبًا ما يكون التلوث خفيًا حتى يسبب ضررًا، ويكون مصدره بعيدًا في كثير من الأحيان عن المكان الذي يُكتشف فيه. تحوّل شبكات جودة الهواء والمستشعرات منخفضة التكلفة وأجهزة الأقمار الصناعية والاستشعار عن بعد مشكلة غير مقاسة إلى مشكلة مقاسة. ويشير IPCC إلى أن تحسين الوصول إلى التمويل والتكنولوجيا عامل حاسم للعمل المناخي، وينطبق الأمر ذاته على رصد التلوث.",
      "Circular design and material tracking reduce waste at the point it is created.":
        "التصميم الدائري وتتبع المواد يقللان النفايات عند نقطة نشوئها.",
      "The IPCC highlights equity and climate justice as central: prioritising them improves outcomes for the people most exposed.":
        "يؤكد IPCC أن العدالة والعدالة المناخية محوريتان: فأولويتهما يحسّنان النتائج للأشخاص الأكثر تعرّضًا.",
      "You answered ": "أجبت عن ",
      " questions correctly — that's ": " سؤالًا بشكل صحيح — أي ",
      "Carbon capture and smart grids": "التقاط الكربون والشبكات الذكية",
      "Solar panels and wind turbines": "الألواح الشمسية والعنفات الهوائية",
      " of ": " من "
    };

    /* ----------------------------------------------------------
       apply
       ---------------------------------------------------------- */
    const SKIP = { SCRIPT: 1, STYLE: 1, SVG: 1, SYMBOL: 1, DEFS: 1, TEXTAREA: 1 };

    let lang = "en";

    function translate(str) {
      return Object.prototype.hasOwnProperty.call(AR, str) ? AR[str] : null;
    }

    /**
     * Only these keys may match *inside* longer dynamic strings.
     * Everything else must match a whole text node exactly.
     * Without this whitelist, short keys like "A" would corrupt
     * strings such as "IPCC AR6 · A.1".
     */
    const FRAGMENTS = [
      " tip explored of ", " tips explored of ",
      "You answered ", " questions correctly — that’s ",
      " questions correctly — that's ", "Tip ", " of "
    ];

    /** Replace translated fragments inside longer dynamic strings. */
    function translateParts(src) {
      let out = src;
      FRAGMENTS.forEach(function (k) {
        if (out.indexOf(k) > -1) out = out.split(k).join(AR[k] || k);
      });
      return out === src ? null : out;
    }


    /** Walk a node and swap text between the original and the translation. */
    function walk(node) {
      if (node.nodeType === 3) {
        if (!originalText.has(node)) originalText.set(node, node.nodeValue);
        const src = originalText.get(node);
        const key = src.replace(/\s+/g, " ").trim();
        const t = translate(key) || (lang === "ar" ? translateParts(src) : null);
        if (lang === "ar" && t) {
          node.nodeValue = t === key ? src.replace(key, t) : t;
        } else {
          node.nodeValue = src;
        }
        return;
      }
      if (node.nodeType !== 1 || SKIP[node.tagName]) return;
      // attributes
      ["aria-label", "title", "placeholder", "alt"].forEach(function (attr) {
        if (!node.hasAttribute(attr)) return;
        const store = "i18n-" + attr;
        if (!node.hasAttribute(store)) node.setAttribute(store, node.getAttribute(attr));
        const orig = node.getAttribute(store);
        const t = translate(orig);
        if (lang === "ar" && t) node.setAttribute(attr, t);
        else node.setAttribute(attr, orig);
      });
      for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
    }

    function apply(next) {
      lang = next === "ar" ? "ar" : "en";
      root.setAttribute("lang", lang);
      root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      walk(document.body);
      updateToggle();
      try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
    }

    function toggle() {
      apply(lang === "ar" ? "en" : "ar");
    }

    function updateToggle() {
      const btn = $("#langToggle");
      const label = $("#langLabel");
      const sideBtn = $("#sideLangBtn");
      const sideTheme = $("#sideThemeBtn");
      if (label) label.textContent = lang === "ar" ? "English" : "عربي";
      if (btn) btn.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "التبديل إلى العربية");
      if (sideBtn) {
        sideBtn.textContent = lang === "ar" ? "English" : "العربية";
        if (sideBtn.hasAttribute("data-i18n")) {
          sideBtn.setAttribute("data-i18n", lang === "ar" ? "side.switchEn" : "side.switchAr");
        }
      }
      if (sideTheme) {
        const dark = document.documentElement.getAttribute("data-theme") === "dark";
        sideTheme.textContent = dark ? "الوضع الفاتح" : "الوضع الداكن";
        sideTheme.setAttribute("data-i18n", dark ? "side.lightMode" : "side.darkMode");
      }
    }

    function init() {
      let saved = null;
      try { saved = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
      if (saved !== "ar" && saved !== "en") {
        saved = (navigator.language || "en").toLowerCase().indexOf("ar") === 0 ? "ar" : "en";
      }
      apply(saved);
      const btn = $("#langToggle");
      if (btn) btn.addEventListener("click", toggle);
      const sideBtn = $("#sideLangBtn");
      if (sideBtn) sideBtn.addEventListener("click", toggle);
    }

    return {
      init: init, apply: apply, toggle: toggle,
      refresh: updateToggle,
      get: function () { return lang; },
      /** Translate a freshly rendered subtree (dynamic content). */
      tr: function (root) { if (root) walk(root); }
    };
  })();

  /* ----------------------------------------------------------
     13 SIDEBAR — slide-in navigation panel
     ---------------------------------------------------------- */
  const Sidebar = (function () {
    const el = $("#sidebar");
    const overlay = $("#navOverlay");
    const openBtn = $("#navToggle");
    const closeBtn = $("#sidebarClose");
    const themeBtn = $("#sideThemeBtn");
    let lastFocus = null;

    function setOpen(open) {
      if (!el) return;
      if (open) lastFocus = document.activeElement;
      el.classList.toggle("is-open", open);
      el.setAttribute("aria-hidden", open ? "false" : "true");
      if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (overlay) {
        if (open) {
          overlay.hidden = false;
          requestAnimationFrame(function () { overlay.classList.add("is-open"); });
        } else {
          overlay.classList.remove("is-open");
          setTimeout(function () { overlay.hidden = true; }, 300);
        }
      }
      document.body.classList.toggle("is-locked", open);
      if (open && closeBtn) closeBtn.focus();
      if (!open && lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function close() { setOpen(false); }

    function init() {
      if (openBtn) {
        openBtn.addEventListener("click", function () {
          setOpen(openBtn.getAttribute("aria-expanded") !== "true");
        });
      }
      if (closeBtn) closeBtn.addEventListener("click", close);
      if (overlay) overlay.addEventListener("click", close);
      if (themeBtn) themeBtn.addEventListener("click", function () {
        $("#themeToggle").click();
        I18N.refresh();
      });
      // close after choosing a destination
      $$(".side-link", el).forEach(function (a) {
        a.addEventListener("click", function () { setTimeout(close, 60); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && el && el.classList.contains("is-open")) close();
      });
      // keep the sidebar in sync with viewport changes
      window.addEventListener("resize", function () {
        if (window.innerWidth > 1100 && el && el.classList.contains("is-open")) close();
      });
    }
    return { init: init, close: close, open: function () { setOpen(true); } };
  })();


  /* ----------------------------------------------------------
     14 MISC — year stamp
     ---------------------------------------------------------- */
  function initMisc() {
    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ----------------------------------------------------------
     BOOT
     ---------------------------------------------------------- */
  function boot() {
    Theme.init();        // restore saved theme first to avoid a flash
    Nav.init();
    Reveal.init();
    Expandables.init();
    Facts.init();
    Calculator.init();
    Agriculture.init();
    Transport.init();
    Tips.init();
    Quiz.init();
    Sidebar.init();
    I18N.init();         // last, so it translates everything rendered above
    initMisc();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
