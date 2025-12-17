/* ========= util ========= */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

/* ========= header: menú móvil ========= */
(function initNav() {
  const toggle = $("#navToggle");
  const menu = $("#navMenu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();

/* ========= tema (dark/light) ========= */
(function initTheme() {
  const btn = $("#themeToggle");
  const saved = storage.get("gn_theme", null);

  if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  const syncIcon = () => {
    if (!btn) return;
    const theme = document.documentElement.getAttribute("data-theme");
    btn.textContent = theme === "light" ? "☀️" : "🌙";
  };
  syncIcon();

  btn?.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    storage.set("gn_theme", next);
    syncIcon();
  });
})();

/* ========= footer year ========= */
(function initYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();

/* ========= newsletter (simulado) ========= */
(function initNewsletter() {
  const form = $("#newsletterForm");
  const msg = $("#newsletterMsg");
  if (!form || !msg) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email")?.value?.trim() || "";
    if (!email || !email.includes("@")) {
      msg.textContent = "Por favor escribe un correo válido.";
      return;
    }
    msg.textContent = "¡Listo! Suscripción simulada guardada en tu navegador.";
    storage.set("gn_newsletter_email", email);
    form.reset();
  });
})();

/* ========= contacto (simulado + validación) ========= */
(function initContact() {
  const form = $("#contactForm");
  const msg = $("#contactMsg");
  if (!form || !msg) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("#name")?.value?.trim() || "";
    const email = $("#email2")?.value?.trim() || "";
    const topic = $("#topic")?.value || "";
    const message = $("#message")?.value?.trim() || "";

    const errors = [];
    if (name.length < 2) errors.push("Nombre mínimo 2 caracteres.");
    if (!email.includes("@")) errors.push("Correo no válido.");
    if (!topic) errors.push("Selecciona un tema.");
    if (message.length < 10) errors.push("Mensaje mínimo 10 caracteres.");

    if (errors.length) {
      msg.textContent = "Revisa: " + errors.join(" ");
      return;
    }

    msg.textContent = "¡Enviado! (simulado) Gracias por contactarnos.";
    storage.set("gn_last_contact", {
      name,
      email,
      topic,
      message,
      at: Date.now(),
    });
    form.reset();
  });
})();

/* ========= estrellas ========= */
(function initStars() {
  const starEls = $$(".stars");
  if (!starEls.length) return;

  const render = (rating) => {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let out = "";
    for (let i = 0; i < 5; i++) {
      if (i < full) out += "★";
      else if (i === full && half) out += "⯪"; // “media”
      else out += "☆";
    }
    return out;
  };

  starEls.forEach((el) => {
    const rating = Number(el.dataset.rating || "0");
    el.textContent = render(rating);
  });
})();

/* ========= noticias: dataset + render + filtros + favoritos ========= */
const NEWS = [
  {
    id: "n1",
    title: "Direct sorpresa: anuncios para Switch (simulado)",
    desc: "Recap de trailers, fechas y un par de anuncios inesperados para cerrar el año.",
    category: "eventos",
    date: "2025-12-05",
    hot: true,
    image: "assets/news1.svg",
    tags: ["Direct", "Switch", "Trailers"],
  },
  {
    id: "n2",
    title: "Lanzamientos destacados del mes en eShop (simulado)",
    desc: "Selección curada de indies y remasters con buena relación calidad/tiempo.",
    category: "lanzamientos",
    date: "2025-11-22",
    hot: true,
    image: "assets/news2.svg",
    tags: ["eShop", "Indie", "Ofertas"],
  },
  {
    id: "n3",
    title: "Guía rápida: optimiza tu inventario (simulado)",
    desc: "Consejos para no saturar tu inventario y avanzar más rápido en juegos de aventura.",
    category: "guias",
    date: "2025-10-14",
    hot: false,
    image: "assets/news3.svg",
    tags: ["Guía", "Tips", "Aventura"],
  },
  {
    id: "n4",
    title: "Rumor: hardware y funciones sociales (simulado)",
    desc: "Una mirada crítica a filtraciones: qué suena probable y qué no.",
    category: "rumores",
    date: "2025-12-01",
    hot: true,
    image: "assets/news1.svg",
    tags: ["Rumores", "Hardware", "Online"],
  },
  {
    id: "n5",
    title: "Evento local: meet-up de speedrunners (simulado)",
    desc: "Cómo organizar un mini torneo y qué reglas usar para que sea justo.",
    category: "eventos",
    date: "2025-09-02",
    hot: false,
    image: "assets/news2.svg",
    tags: ["Speedrun", "Comunidad", "Evento"],
  },
  {
    id: "n6",
    title: "Lanzamiento: multijugador para jugar en sofá (simulado)",
    desc: "Un party-game accesible, perfecto para familia y amigos.",
    category: "lanzamientos",
    date: "2025-12-10",
    hot: true,
    image: "assets/news3.svg",
    tags: ["Co-op", "Party", "Sofá"],
  },
];

function formatDate(iso) {
  // simple: YYYY-MM-DD -> DD/MM/YYYY
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

function getFavs() {
  return storage.get("gn_favs", []);
}
function setFavs(favs) {
  storage.set("gn_favs", favs);
  // actualizar contador si existe
  const statFavs = $("#statFavs");
  if (statFavs) statFavs.textContent = String(favs.length);
}

function isFav(id) {
  return getFavs().includes(id);
}

function toggleFav(id) {
  const favs = new Set(getFavs());
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  setFavs(Array.from(favs));
}

function newsCard(item, { compact = false } = {}) {
  const badge = item.hot ? `<span class="badge">Tendencia</span>` : "";
  const cat = `<span class="badge" style="border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.06)">${item.category}</span>`;
  const favLabel = isFav(item.id) ? "Quitar favorito" : "Guardar favorito";
  const favIcon = isFav(item.id) ? "★" : "☆";

  return `
    <article class="news" data-id="${item.id}" data-category="${item.category}">
      <div class="news__media">
        <img src="${item.image}" alt="Imagen relacionada con la noticia" />
      </div>
      <div class="news__body">
        <div class="news__meta">
          ${badge}
          ${cat}
          <span>${formatDate(item.date)}</span>
        </div>
        <h3 class="news__title">${item.title}</h3>
        <p class="news__desc">${item.desc}</p>
        ${
          compact
            ? ""
            : `<p class="tags">${item.tags
                .map((t) => `<span class="tag">${t}</span>`)
                .join("")}</p>`
        }
        <div class="news__actions">
          <button class="btn btn--ghost btn--mini" type="button" data-action="fav" aria-label="${favLabel}">
            ${favIcon} Favorito
          </button>
          <button class="btn btn--mini" type="button" data-action="open">
            Leer (modal)
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderNews(list) {
  const grid = $("#newsGrid");
  if (!grid) return;
  grid.innerHTML = list.map((n) => newsCard(n)).join("");
}

function renderFavs() {
  const favGrid = $("#favGrid");
  if (!favGrid) return;

  const favIds = getFavs();
  const favItems = NEWS.filter((n) => favIds.includes(n.id));

  if (!favItems.length) {
    favGrid.innerHTML = `<div class="card"><h3>Sin favoritos</h3><p>Guarda una noticia para verla aquí.</p></div>`;
    return;
  }

  favGrid.innerHTML = favItems
    .map(
      (n) => `
    <div class="card">
      <h3>${n.title}</h3>
      <p>${n.desc}</p>
      <p class="muted">Categoría: ${n.category} • ${formatDate(n.date)}</p>
      <button class="btn btn--ghost btn--mini" type="button" data-fav-remove="${
        n.id
      }">Quitar</button>
    </div>
  `
    )
    .join("");
}

function applyFilters() {
  const q = ($("#search")?.value || "").toLowerCase().trim();
  const cat = $("#category")?.value || "all";

  const filtered = NEWS.slice()
    .sort((a, b) => b.date.localeCompare(a.date)) // más recientes primero
    .filter((n) => (cat === "all" ? true : n.category === cat))
    .filter((n) => {
      if (!q) return true;
      const hay = `${n.title} ${n.desc} ${n.tags.join(" ")} ${
        n.category
      }`.toLowerCase();
      return hay.includes(q);
    });

  renderNews(filtered);
}

(function initNewsPage() {
  const grid = $("#newsGrid");
  if (!grid) return; // sólo corre en noticias.html

  // stats en home
  const statPosts = $("#statPosts");
  if (statPosts) statPosts.textContent = String(NEWS.length);
  setFavs(getFavs());

  applyFilters();
  renderFavs();

  $("#search")?.addEventListener("input", applyFilters);
  $("#category")?.addEventListener("change", applyFilters);
  $("#clearFilters")?.addEventListener("click", () => {
    const s = $("#search");
    const c = $("#category");
    if (s) s.value = "";
    if (c) c.value = "all";
    applyFilters();
  });

  // acciones de cards
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const card = e.target.closest(".news");
    const id = card?.dataset?.id;
    if (!id) return;

    const action = btn.dataset.action;
    if (action === "fav") {
      toggleFav(id);
      applyFilters();
      renderFavs();
      return;
    }

    if (action === "open") {
      const item = NEWS.find((n) => n.id === id);
      if (!item) return;
      openModal(item);
    }
  });

  // quitar desde favoritos
  $("#favGrid")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav-remove]");
    if (!b) return;
    toggleFav(b.dataset.favRemove);
    applyFilters();
    renderFavs();
  });

  // modal
  function openModal(item) {
    let modal = $("#modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.innerHTML = `
        <div class="modal__backdrop" data-close="1"></div>
        <div class="modal__panel" role="document">
          <button class="btn btn--ghost btn--mini modal__close" data-close="1" type="button">Cerrar</button>
          <div class="modal__content" id="modalContent"></div>
        </div>
      `;
      document.body.appendChild(modal);

      // estilos mínimos del modal
      const style = document.createElement("style");
      style.textContent = `
        #modal{ position:fixed; inset:0; display:grid; place-items:center; z-index:999; }
        .modal__backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.65); }
        .modal__panel{
          position:relative;
          width:min(820px, calc(100% - 28px));
          background: var(--panel);
          border:1px solid var(--border);
          border-radius: 18px;
          box-shadow: var(--shadow);
          padding: 16px;
        }
        .modal__close{ position:absolute; right: 12px; top: 12px; }
        .modal__content h2{ margin-top: 0; }
        .modal__content p{ color: var(--muted); }
      `;
      document.head.appendChild(style);

      modal.addEventListener("click", (ev) => {
        const close = ev.target.closest("[data-close]");
        if (close) modal.remove();
      });

      document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && $("#modal")) $("#modal").remove();
      });
    }

    $("#modalContent").innerHTML = `
      <h2>${item.title}</h2>
      <p class="muted">${formatDate(item.date)} • ${item.category} ${
      item.hot ? "• Tendencia" : ""
    }</p>
      <img src="${
        item.image
      }" alt="Imagen relacionada con la noticia" style="margin:10px 0; border-radius:14px; border:1px solid var(--border);" />
      <p>${item.desc}</p>
      <p class="muted">Tags: ${item.tags
        .map((t) => `<span class="tag">${t}</span>`)
        .join(" ")}</p>
      <p class="muted">Contenido extendido: agrega aquí el texto del PDF o tu investigación de noticias reales.</p>
    `;
  }
})();
