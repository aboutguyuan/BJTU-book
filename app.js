(function () {
  const data = window.SITE_DATA;
  if (!data) {
    document.getElementById("manualContent").innerHTML = "<p>请先运行 <code>npm run build</code> 生成手册数据。</p>";
    return;
  }

  const chapterNav = document.getElementById("chapterNav");
  const mobileChapterNav = document.getElementById("mobileChapterNav");
  const content = document.getElementById("manualContent");
  const pageToc = document.getElementById("pageToc");
  const searchInput = document.getElementById("manualSearch");
  const searchResults = document.getElementById("searchResults");
  const drawer = document.querySelector(".mobile-drawer");

  function renderChapterLinks(target) {
    target.innerHTML = data.chapters
      .map((chapter) => `<a class="sidebar-link" href="#${chapter.id}" data-chapter-link="${chapter.id}">${chapter.title}</a>`)
      .join("");
  }

  function renderContent() {
    content.innerHTML = data.chapters
      .map((chapter) => {
        const sections = chapter.sections
          .map((section) => `<section id="${section.id}" class="manual-section"><h3>${section.title}</h3>${section.html}</section>`)
          .join("");
        return `<section id="${chapter.id}" class="chapter" data-chapter="${chapter.id}"><h2>${chapter.title}</h2>${chapter.introHtml}${sections}</section>`;
      })
      .join("");
  }

  function setActiveChapter(id) {
    document.querySelectorAll("[data-chapter-link]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.chapterLink === id);
    });

    const chapter = data.chapters.find((item) => item.id === id);
    if (!chapter) return;

    const tocLinks = [
      `<a href="#${chapter.id}" data-toc-link="${chapter.id}">${chapter.title}</a>`,
      ...chapter.sections.map((section) => `<a href="#${section.id}" data-toc-link="${section.id}">${section.title}</a>`)
    ];
    pageToc.innerHTML = tocLinks.join("");
  }

  function setActiveToc(id) {
    document.querySelectorAll("[data-toc-link]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.tocLink === id);
    });
  }

  function currentIdFromHash() {
    return decodeURIComponent(window.location.hash.replace(/^#/, ""));
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
  }

  function normalize(text) {
    return String(text).toLowerCase().replace(/\s+/g, "");
  }

  function excerpt(text, query) {
    const compactQuery = query.trim();
    const index = text.toLowerCase().indexOf(compactQuery.toLowerCase());
    if (index === -1) return text.slice(0, 90);
    const start = Math.max(0, index - 26);
    const end = Math.min(text.length, index + compactQuery.length + 58);
    return `${start > 0 ? "..." : ""}${text.slice(start, end)}${end < text.length ? "..." : ""}`;
  }

  function runSearch(query) {
    const q = query.trim();
    if (!q) {
      searchResults.innerHTML = "";
      return;
    }

    const normalized = normalize(q);
    const results = [];
    for (const chapter of data.chapters) {
      const chapterHaystack = normalize(`${chapter.title} ${chapter.text}`);
      if (chapterHaystack.includes(normalized)) {
        results.push({
          id: chapter.id,
          title: chapter.title,
          text: chapter.text
        });
      }
      for (const section of chapter.sections) {
        const sectionHaystack = normalize(`${section.title} ${section.text}`);
        if (sectionHaystack.includes(normalized)) {
          results.push({
            id: section.id,
            title: section.title,
            text: section.text
          });
        }
      }
    }

    searchResults.innerHTML = results.slice(0, 12).map((result) => {
      return `<a class="search-result" href="#${result.id}"><strong>${result.title}</strong><span>${escapeHtml(excerpt(result.text, q))}</span></a>`;
    }).join("") || `<div class="search-result"><strong>NO RESULT</strong><span>没有找到匹配内容。</span></div>`;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function copyCurrentLink() {
    const id = currentIdFromHash() || "top";
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      const button = document.querySelector(".copy-link");
      const previous = button.textContent;
      button.textContent = "OK";
      window.setTimeout(() => {
        button.textContent = previous;
      }, 900);
    }).catch(() => {
      window.prompt("复制当前链接", url);
    });
  }

  function initObservers() {
    const chapterObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveChapter(visible.target.id);
    }, {
      rootMargin: "-96px 0px -58% 0px",
      threshold: [0.08, 0.2, 0.4]
    });

    const headingObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveToc(visible.target.id);
    }, {
      rootMargin: "-96px 0px -72% 0px",
      threshold: [0.1, 0.3]
    });

    document.querySelectorAll(".chapter").forEach((section) => chapterObserver.observe(section));
    document.querySelectorAll(".chapter, .manual-section").forEach((section) => headingObserver.observe(section));
  }

  renderChapterLinks(chapterNav);
  renderChapterLinks(mobileChapterNav);
  renderContent();

  setActiveChapter(data.chapters[0]?.id);
  initObservers();

  document.querySelector(".menu-toggle").addEventListener("click", openDrawer);
  document.querySelector(".drawer-close").addEventListener("click", closeDrawer);
  drawer.addEventListener("click", (event) => {
    if (event.target === drawer || event.target.closest("a")) closeDrawer();
  });
  document.querySelector(".search-focus").addEventListener("click", () => searchInput.focus());
  document.querySelector(".copy-link").addEventListener("click", copyCurrentLink);
  searchInput.addEventListener("input", (event) => runSearch(event.target.value));

  if (currentIdFromHash()) {
    window.setTimeout(() => document.getElementById(currentIdFromHash())?.scrollIntoView(), 100);
  }
})();
