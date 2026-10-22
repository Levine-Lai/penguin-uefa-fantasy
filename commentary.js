(() => {
  "use strict";
  const api = window.__penguinCupDashboard;
  const $ = (selector) => document.querySelector(selector);
  const input = $("#commentText");
  const prefix = "penguin-review:v1:";
  const memory = new Map();
  let selected = null;
  let noticeTimer;
  let exportedUrls = [];
  const regionName = (region) => region === "arctic" ? "Shuo 🐧 北极赛区" : "Acidboy 🐧 南极赛区";
  const storageKey = (match) => prefix + [match.region, match.round, match.home, match.away].map(encodeURIComponent).join(":");
  function notify(message) {
    $("#writerNotice").textContent = message;
    $("#writerNotice").hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { $("#writerNotice").hidden = true; }, 5500);
  }
  function readDraft(match) {
    const key = storageKey(match);
    if (memory.has(key)) return memory.get(key);
    try { return JSON.parse(localStorage.getItem(key) || "null")?.text || ""; }
    catch { return ""; }
  }
  function saveDraft() {
    if (!selected) return;
    const key = storageKey(selected);
    const text = input.value;
    memory.set(key, text);
    try {
      if (text) localStorage.setItem(key, JSON.stringify({ text, updatedAt: new Date().toISOString() }));
      else localStorage.removeItem(key);
      $("#saveStatus").textContent = "已保存到本机";
    } catch {
      $("#saveStatus").textContent = "仅暂存，请导出备份";
    }
    $("#characterCount").textContent = `${Array.from(text).length} 字`;
    refreshCards();
  }
  function refreshCards() {
    const { region, round } = api.getState();
    const matches = api.getRoundMatches(round, region);
    let completed = 0;
    document.querySelectorAll("#matchGrid [data-match-index]").forEach((card) => {
      const match = matches[Number(card.dataset.matchIndex)];
      const hasText = match && Boolean(readDraft(match).trim());
      card.classList.toggle("has-comment", hasText);
      if (hasText) completed += 1;
    });
    $("#draftCount").textContent = `已点评 ${completed} / ${matches.length}`;
    $("#writerRoundTitle").textContent = `第 ${round} 轮`;
  }
  document.addEventListener("penguin:match-opened", ({ detail }) => {
    if (selected) saveDraft();
    selected = api.getRoundMatches(detail.round, detail.region)[detail.index];
    input.value = readDraft(selected);
    $("#editorFixture").textContent = `${selected.homeManager} vs ${selected.awayManager}`;
    $("#characterCount").textContent = `${Array.from(input.value).length} 字`;
    $("#saveStatus").textContent = input.value ? "已保存到本机" : "";
    $("#nextMatch").disabled = detail.index === 17;
    if (window.innerWidth > 760) input.focus({ preventScroll: true });
  });
  input.addEventListener("input", saveDraft);
  window.addEventListener("pagehide", saveDraft);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveDraft(); });
  $("#nextMatch").addEventListener("click", () => {
    if (!selected) return;
    const button = document.querySelector(`#matchGrid [data-match-index="${selected.index + 1}"]`);
    button?.click();
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-region], [data-round]")) refreshCards();
    if (!event.target.closest(".export-controls")) {
      $("#exportMenu").hidden = true;
      $("#exportButton").setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith(prefix)) memory.delete(event.key);
    refreshCards();
  });
  $("#exportButton").addEventListener("click", () => {
    $("#exportMenu").hidden = !$("#exportMenu").hidden;
    $("#exportButton").setAttribute("aria-expanded", String(!$("#exportMenu").hidden));
  });
  function closeExport() {
    $("#exportDialog").hidden = true;
    document.body.style.overflow = $("#matchModal").hidden ? "" : "hidden";
    $("#exportButton").focus();
  }
  $("#closeExport").addEventListener("click", closeExport);
  $("#exportDialog").addEventListener("click", (event) => { if (event.target === $("#exportDialog")) closeExport(); });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#exportDialog").hidden) closeExport();
  });

  const FONT = '"Microsoft YaHei", "PingFang SC", sans-serif';
  function linesFor(ctx, text, width) {
    const lines = [];
    for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
      let line = "";
      const segments = typeof Intl.Segmenter === "function"
        ? [...new Intl.Segmenter("zh-CN", { granularity: "grapheme" }).segment(paragraph)].map((part) => part.segment)
        : Array.from(paragraph);
      for (const char of segments) {
        if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = char; }
        else line += char;
      }
      lines.push(line);
    }
    return lines;
  }
  function rounded(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
  }
  function text(ctx, value, x, y, size, color, align = "left", weight = 500) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "top";
    ctx.fillText(String(value), x, y);
  }
  const logoCache = new Map();
  function loadLogo(url) {
    if (!logoCache.has(url)) {
      logoCache.set(url, new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const timeout = setTimeout(() => { logoCache.delete(url); reject(new Error("队徽加载超时，请检查网络后重新导出。")); }, 15000);
        img.onload = () => { clearTimeout(timeout); resolve(img); };
        img.onerror = () => { clearTimeout(timeout); logoCache.delete(url); reject(new Error("队徽加载失败，请检查网络后重新导出。")); };
        img.src = url;
      }));
    }
    return logoCache.get(url);
  }
  function drawMatch(ctx, item, top) {
    const { match, lines, height, headerHeight, homeNames, awayNames, homeLogo, awayLogo } = item;
    ctx.save();
    rounded(ctx, 28, top, 1024, height, 22); ctx.clip();
    ctx.fillStyle = "#0a1d40"; ctx.fillRect(28, top, 1024, height);
    const gradient = ctx.createLinearGradient(28, top, 1052, top + headerHeight);
    gradient.addColorStop(0, "#0c2252"); gradient.addColorStop(1, "#091a41");
    ctx.fillStyle = gradient; ctx.fillRect(28, top, 1024, headerHeight);
    ctx.fillStyle = "rgba(1,9,30,.23)"; ctx.fillRect(28, top, 1024, 74);
    text(ctx, `第 ${match.round} 轮`, 60, top + 24, 24, "#90a6cd", "left", 500);
    const scored = Number.isFinite(match.homeScore) && Number.isFinite(match.awayScore);
    const scoreColor = (score, opponent) => !scored || score === opponent ? "#f7f9ff" : score > opponent ? "#4ed28b" : "#ff6374";
    function team(image, names, club, x) {
      ctx.drawImage(image, x - 51, top + 112, 102, 102);
      names.forEach((line, i) => text(ctx, line, x, top + 240 + i * 48, 38, "#ffffff", "center", 600));
      text(ctx, club, x, top + 250 + names.length * 48, 24, "#92adc9", "center", 500);
    }
    team(homeLogo, homeNames, match.homeClub, 260);
    team(awayLogo, awayNames, match.awayClub, 820);
    const boardTop = top + 157;
    const boardFill = ctx.createLinearGradient(0, boardTop, 0, boardTop + 126);
    boardFill.addColorStop(0, "#061942"); boardFill.addColorStop(1, "#041238");
    rounded(ctx, 423, boardTop, 234, 126, 22); ctx.fillStyle = boardFill; ctx.fill();
    ctx.strokeStyle = "rgba(0,201,255,.2)"; ctx.lineWidth = 2; ctx.stroke();
    for (const x of [436, 560]) {
      rounded(ctx, x, boardTop + 14, 84, 96, 13); ctx.fillStyle = "rgba(255,255,255,.025)"; ctx.fill();
    }
    text(ctx, ":", 540, boardTop + 40, 40, "#75b7d1", "center", 700);
    ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.font = 'italic 700 54px "Times New Roman", Georgia, serif';
    ctx.fillStyle = scoreColor(match.homeScore, match.awayScore); ctx.fillText(scored ? match.homeScore : "—", 478, boardTop + 63);
    ctx.fillStyle = scoreColor(match.awayScore, match.homeScore); ctx.fillText(scored ? match.awayScore : "—", 602, boardTop + 63);
    ctx.beginPath(); ctx.moveTo(28, top + headerHeight); ctx.lineTo(1052, top + headerHeight); ctx.strokeStyle = "#29466d"; ctx.lineWidth = 1.5; ctx.stroke();
    let y = top + headerHeight + 36;
    for (const line of lines) { text(ctx, line, 64, y, 38, "#dce8f7"); y += 64; }
    ctx.restore();
    rounded(ctx, 28, top, 1024, height, 22); ctx.strokeStyle = "#2a4773"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  async function renderImages(matches, region, round) {
    const measure = document.createElement("canvas").getContext("2d");
    measure.font = `500 38px ${FONT}`;
    const cards = await Promise.all(matches.map(async (match) => {
      const [homeLogo, awayLogo] = await Promise.all([loadLogo(match.homeLogo), loadLogo(match.awayLogo)]);
      const lines = linesFor(measure, readDraft(match).trim(), 952);
      measure.font = `600 38px ${FONT}`;
      const homeNames = linesFor(measure, match.homeManager, 320);
      const awayNames = linesFor(measure, match.awayManager, 320);
      const headerHeight = 364 + (Math.max(homeNames.length, awayNames.length) - 1) * 48;
      measure.font = `500 38px ${FONT}`;
      return { match, lines, homeNames, awayNames, homeLogo, awayLogo, headerHeight, height: headerHeight + 72 + lines.length * 64 };
    }));
    // Keep each PNG within browser canvas limits, even with very long commentary.
    const pages = [[]];
    let height = 140;
    for (const card of cards) {
      if (card.height > 24000) throw new Error("单场点评过长，请拆成较短的段落后分次导出。");
      if (height + card.height + 24 > 26000 && pages.at(-1).length) { pages.push([]); height = 140; }
      pages.at(-1).push(card); height += card.height + 24;
    }
    const results = [];
    for (let index = 0; index < pages.length; index += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 140 + pages[index].reduce((sum, card) => sum + card.height + 24, 0);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#040f26"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      text(ctx, regionName(region), 40, 36, 34, "#bceafa", "left", 700);
      text(ctx, `第 ${round} 轮${pages.length > 1 ? ` · ${index + 1}/${pages.length}` : ""}`, 1040, 40, 28, "#87a9cb", "right");
      let top = 116;
      for (const item of pages[index]) { drawMatch(ctx, item, top); top += item.height + 24; }
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("图片生成失败，请缩短点评后重试。");
      results.push({ blob, width: canvas.width, height: canvas.height, name: `${region === "arctic" ? "北极" : "南极"}赛区-GD${round}${pages.length > 1 ? `-${index + 1}` : ""}.png` });
      canvas.width = 0; canvas.height = 0;
    }
    return results;
  }
  async function exportReviews(mode) {
    saveDraft();
    $("#exportMenu").hidden = true;
    $("#exportButton").setAttribute("aria-expanded", "false");
    const { region, round } = api.getState();
    const regions = mode === "both" ? ["arctic", "antarctic"] : [region];
    $("#exportButton").disabled = true; $("#exportButton").textContent = "正在生成…";
    try {
      await document.fonts.ready;
      const results = [];
      for (const area of regions) {
        const matches = api.getRoundMatches(round, area).filter((match) => readDraft(match).trim());
        if (matches.length) results.push(...await renderImages(matches, area, round));
      }
      if (!results.length) { notify("请先点击一场对阵，写好点评后再导出。"); return; }
      exportedUrls.forEach((url) => URL.revokeObjectURL(url)); exportedUrls = [];
      $("#exportImages").replaceChildren();
      for (const result of results) {
        const url = URL.createObjectURL(result.blob); exportedUrls.push(url);
        const section = document.createElement("section"); section.className = "export-result";
        const title = document.createElement("h3"); title.textContent = result.name;
        const img = document.createElement("img"); img.src = url; img.alt = result.name;
        const download = document.createElement("a"); download.href = url; download.download = result.name; download.textContent = "下载 PNG 长图";
        const info = document.createElement("small"); info.textContent = `${result.width} × ${result.height} · ${(result.blob.size / 1024 / 1024).toFixed(1)} MB`;
        section.append(title, img, download, info); $("#exportImages").append(section);
      }
      $("#exportDialog").hidden = false; document.body.style.overflow = "hidden"; $("#closeExport").focus();
    } catch (error) { notify(error.message || "导出失败，请重试。"); }
    finally { $("#exportButton").disabled = false; $("#exportButton").textContent = "导出长图 ↓"; }
  }
  document.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", () => exportReviews(button.dataset.export)));
  $("#backupButton").addEventListener("click", () => {
    saveDraft();
    const { round } = api.getState();
    const output = [];
    for (const region of ["arctic", "antarctic"]) {
      const entries = api.getRoundMatches(round, region).filter((match) => readDraft(match).trim());
      if (!entries.length) continue;
      output.push(`${regionName(region)} · 第 ${round} 轮\n`);
      for (const match of entries) output.push(`${match.homeManager} ${match.homeScore ?? "—"} : ${match.awayScore ?? "—"} ${match.awayManager}\n${readDraft(match)}\n`);
    }
    if (!output.length) { notify("本轮还没有点评。"); return; }
    const url = URL.createObjectURL(new Blob([output.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `GD${round}-点评备份.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
    $("#exportMenu").hidden = true;
  });
  refreshCards();
})();
