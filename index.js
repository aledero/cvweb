(function () {
  var LANGS = ["en", "es"];
  var root = document.documentElement;
  var cache = {};

  function storageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }

  // ---------- Theme (runs in <head> to avoid a flash) ----------
  var savedTheme = storageGet("theme");
  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light"));

  // ---------- Language: saved choice > browser language > English ----------
  var savedLang = storageGet("lang");
  var browserLang = (navigator.language || "").slice(0, 2).toLowerCase();
  var currentLang = LANGS.indexOf(savedLang) !== -1 ? savedLang : (LANGS.indexOf(browserLang) !== -1 ? browserLang : "en");
  root.lang = currentLang;
  root.classList.add("i18n-pending");

  // Start downloading right away, in parallel with the rest of the page.
  var firstLoad = loadLang(currentLang);

  // Language files are plain scripts (lang/xx.js) that register themselves in
  // window.LANGS, so they also load when the page is opened from file://.
  function loadLang(lang) {
    if (!cache[lang]) {
      cache[lang] = new Promise(function (resolve, reject) {
        if (window.LANGS && window.LANGS[lang]) return resolve(window.LANGS[lang]);
        var script = document.createElement("script");
        script.src = "lang/" + lang + ".js";
        script.onload = function () {
          var dict = window.LANGS && window.LANGS[lang];
          dict ? resolve(dict) : reject(new Error("lang/" + lang + ".js did not register window.LANGS." + lang));
        };
        script.onerror = function () {
          script.remove();
          reject(new Error("Could not load lang/" + lang + ".js"));
        };
        document.head.appendChild(script);
      });
      cache[lang].catch(function () { delete cache[lang]; });
    }
    return cache[lang];
  }

  function get(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  var renderers = {
    about: function (items) {
      return items.map(function (text) { return el("p", null, text); });
    },
    experience: function (items) {
      return items.map(function (job) {
        var li = el("li", "job");
        var head = el("div", "job-head");
        head.append(el("h3", null, job.company), el("time", null, job.period));
        li.append(head, el("div", "position", job.position), el("p", null, job.description));
        if (Array.isArray(job.stack) && job.stack.length) {
          var stack = el("ul", "stack");
          job.stack.forEach(function (tech) { stack.append(el("li", null, tech)); });
          li.append(stack);
        }
        return li;
      });
    },
    skills: function (groups) {
      return groups.map(function (group) {
        var wrap = el("div", "skill-group");
        var chips = el("ul", "chips");
        group.items.forEach(function (item) { chips.append(el("li", null, item)); });
        wrap.append(el("h3", null, group.label), chips);
        return wrap;
      });
    },
    // Generic "title + detail" lists
    info: function (items) {
      return items.map(function (item) {
        var li = el("li", null, item.title);
        li.append(el("span", null, item.detail));
        return li;
      });
    }
  };
  renderers.education = renderers.languages = renderers.volunteering = renderers.info;

  function apply(dict, lang) {
    root.lang = lang;
    document.title = dict.meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", dict.meta.description);

    document.querySelectorAll("[data-i18n]").forEach(function (node) {
      var value = get(dict, node.getAttribute("data-i18n"));
      if (typeof value === "string") {
        node.textContent = value.replace("{year}", new Date().getFullYear());
      }
    });

    // data-i18n-attr="aria-label:ui.toggleTheme"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (node) {
      var parts = node.getAttribute("data-i18n-attr").split(":");
      var value = get(dict, parts[1]);
      if (typeof value === "string") node.setAttribute(parts[0], value);
    });

    document.querySelectorAll("[data-i18n-list]").forEach(function (node) {
      var key = node.getAttribute("data-i18n-list");
      var data = dict[key];
      if (renderers[key] && Array.isArray(data)) node.replaceChildren.apply(node, renderers[key](data));
    });

    document.querySelectorAll(".lang button[data-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === lang));
    });

    currentLang = lang;
    root.classList.remove("i18n-pending");
  }

  function setLang(lang) {
    if (lang === currentLang) return;
    storageSet("lang", lang);
    loadLang(lang).then(function (dict) { apply(dict, lang); }).catch(function (err) {
      console.error("Could not load language file:", err);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    firstLoad
      .then(function (dict) { apply(dict, currentLang); })
      .catch(function (err) {
        // Never leave the page hidden: the translation keys written in the HTML show instead.
        console.error("Could not load language file:", err);
        root.classList.remove("i18n-pending");
      });

    document.querySelectorAll(".lang button[data-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () { setLang(btn.getAttribute("data-lang")); });
    });

    var toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        storageSet("theme", next);
      });
    }
  });
})();
