async function loadContent() {
  const res = await fetch("./content.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Unable to load content.json");
  return await res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function setLink(id, href) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!href) {
    el.style.display = "none";
    return;
  }
  el.href = href;
}

function makeItem({ title, meta, bullets }) {
  const wrap = document.createElement("div");
  wrap.className = "item";

  const top = document.createElement("div");
  top.className = "top";

  const t = document.createElement("div");
  t.className = "title";
  t.textContent = title || "";

  const m = document.createElement("div");
  m.className = "meta";
  m.textContent = meta || "";

  top.appendChild(t);
  top.appendChild(m);

  wrap.appendChild(top);

  if (Array.isArray(bullets) && bullets.length) {
    const ul = document.createElement("ul");
    bullets.forEach(b => {
      const li = document.createElement("li");
      li.textContent = b;
      ul.appendChild(li);
    });
    wrap.appendChild(ul);
  }
  return wrap;
}

function renderList(listId, items) {
  const ul = document.getElementById(listId);
  if (!ul) return;
  ul.innerHTML = "";
  (items || []).forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    ul.appendChild(li);
  });
}

function renderStack(stackId, items, mapper) {
  const el = document.getElementById(stackId);
  if (!el) return;
  el.innerHTML = "";
  (items || []).forEach(it => el.appendChild(mapper(it)));
}

function renderChips(chips) {
  const el = document.getElementById("chips");
  if (!el) return;
  el.innerHTML = "";
  (chips || []).forEach(c => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = c;
    el.appendChild(chip);
  });
}

function renderContact(contact) {
  const el = document.getElementById("contact");
  if (!el) return;
  el.innerHTML = "";

  const blocks = [
    contact?.location ? `📍 ${contact.location}` : null,
    contact?.phone ? `📞 ${contact.phone}` : null,
    contact?.email ? `✉️ ${contact.email}` : null,
  ].filter(Boolean);

  blocks.forEach(line => {
    const div = document.createElement("div");
    div.textContent = line;
    el.appendChild(div);
  });

  if (contact?.email) {
    const a = document.createElement("a");
    a.href = `mailto:${contact.email}`;
    a.textContent = "Email me";
    el.appendChild(a);
  }

  if (contact?.linkedin) {
    const a = document.createElement("a");
    a.href = contact.linkedin;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "View LinkedIn";
    el.appendChild(a);
  }
}

(async function init() {
  try {
    const data = await loadContent();

    setText("name", data.name);
    setText("headline", data.headline);
    setText("summary", data.summary);

    // Top buttons
    if (data.contact?.email) setLink("emailLink", `mailto:${data.contact.email}`);
    else setLink("emailLink", null);

    setLink("linkedinLink", data.contact?.linkedin || null);
    setLink("downloadCvLink", data.downloadCvUrl || null);

    renderChips(data.highlightChips);
    renderList("skills", data.skills);

    renderStack("projects", data.projects, p =>
      makeItem({
        title: p.title,
        meta: p.meta,
        bullets: p.bullets
      })
    );

    renderStack("experience", data.experience, e =>
      makeItem({
        title: e.roleCompany,
        meta: e.dates,
        bullets: e.bullets
      })
    );

    renderStack("education", data.education, ed =>
      makeItem({
        title: ed.title,
        meta: ed.meta,
        bullets: ed.bullets
      })
    );

    renderContact(data.contact);

    const year = new Date().getFullYear();
    setText("footerText", `© ${year} ${data.name || ""} — Hosted on GitHub Pages`);
  } catch (err) {
    console.error(err);
    document.body.innerHTML = `
      <div style="max-width:900px;margin:40px auto;padding:16px;color:#fff;font-family:system-ui">
        <h2>Site error</h2>
        <p>Could not load <code>content.json</code>. Make sure the file exists in the same folder as <code>index.html</code>.</p>
      </div>`;
  }
})();
