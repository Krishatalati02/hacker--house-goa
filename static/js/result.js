(function () {
  const $ = (s) => document.querySelector(s);

  const cardName = $("#card-name");
  const cardRole = $("#card-role");
  const cardClass = $("#card-class");
  const cardId = $("#card-id");
  const cardIdShort = $("#card-id-short");
  const cardPhoto = $("#card-photo");
  const placeholder = $("#placeholder");
  const qrBox = $("#qrcode");
  const barcodeImg = $("#card-barcode");
  const btnDownload = $("#btn-download");
  const btnShare = $("#btn-share");
  const shareNote = $("#share-note");

  let data = null;
  let lastDataUrl = null;

  function homeUrl() {
    try {
      return new URL("/", window.location.origin).href;
    } catch (e) {
      return window.location.origin + "/";
    }
  }

  function setShortId(fullId) {
    if (!cardIdShort || !fullId) return;
    const parts = fullId.replace("#", "").split("-");
    cardIdShort.textContent =
      parts.length >= 2
        ? parts[parts.length - 2] + "-" + parts[parts.length - 1]
        : fullId.replace("#", "");
  }

  function renderQR() {
    qrBox.innerHTML = "";
    try {
      new QRCode(qrBox, {
        text: homeUrl(),
        width: 130,
        height: 130,
        colorDark: "#1a1a1a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      qrBox.innerHTML =
        '<div style="width:130px;height:130px;background:#eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999">QR</div>';
    }
  }

  function load() {
    try {
      const raw = sessionStorage.getItem("hhgoa_card");
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      data = null;
    }

    if (!data) {
      shareNote.textContent = "No card data found. Go back and create one.";
      shareNote.className = "share-note err";
      return;
    }

    cardName.textContent = (data.name || "YOUR NAME").trim().toUpperCase() || "YOUR NAME";
    cardRole.textContent = (data.role || "YOUR ROLE").trim().toUpperCase() || "YOUR ROLE";
    cardClass.textContent = data.klass || "TERMINAL WIZARD";
    cardId.textContent = data.id || "#HH-GOA-····-····";
    setShortId(data.id);

    if (data.barcode && barcodeImg) {
      barcodeImg.src = data.barcode;
      barcodeImg.style.display = "block";
    }

    if (data.photo) {
      cardPhoto.src = data.photo;
      cardPhoto.classList.remove("hidden");
      placeholder.style.display = "none";
    }

    renderQR();
  }

  function buildTweetText() {
    const name = (data && data.name) || "Builder";
    const role = (data && data.role) || "";
    const id = (data && data.id) || "#HH-GOA-0000";
    let text = `Just got my official Hacker House Goa 2026 Builder Card 🏝\n\n`;
    text += `${name}`;
    if (role) text += ` · ${role}`;
    text += `\n${id}\n\n`;
    text += `Building at #FrameInGoa · 28–31 Oct · Assagao\n`;
    text += `#HackerHouseGoa #HHGoa2026`;
    return text;
  }

  async function captureCard() {
    const card = $("#builder-card");
    const canvas = await html2canvas(card, {
      scale: 3,
      backgroundColor: null,
      useCORS: true,
      logging: false,
      allowTaint: true,
    });
    lastDataUrl = canvas.toDataURL("image/png");
    return lastDataUrl;
  }

  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement("a");
    a.download = filename;
    a.href = dataUrl;
    a.click();
  }

  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new Blob([u8], { type: mime });
  }

  function safeName() {
    return (
      ((data && data.name) || "builder")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase() || "builder"
    );
  }

  btnDownload.addEventListener("click", async () => {
    btnDownload.disabled = true;
    const orig = btnDownload.innerHTML;
    btnDownload.innerHTML = "Generating…";
    try {
      const dataUrl = await captureCard();
      downloadDataUrl(dataUrl, `hh-goa-2026-${safeName()}.png`);
      shareNote.textContent = "PNG downloaded.";
      shareNote.className = "share-note ok";
    } catch (err) {
      console.error(err);
      shareNote.textContent = "Could not generate image.";
      shareNote.className = "share-note err";
    } finally {
      btnDownload.innerHTML = orig;
      btnDownload.disabled = false;
    }
  });

  btnShare.addEventListener("click", async () => {
    btnShare.disabled = true;
    const orig = btnShare.innerHTML;
    btnShare.innerHTML = "Preparing…";
    try {
      const dataUrl = await captureCard();
      const tweet = buildTweetText();
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], "hh-goa-builder-card.png", { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: tweet, files: [file], title: "HH Goa 2026 Card" });
        shareNote.textContent = "Shared!";
        shareNote.className = "share-note ok";
      } else {
        downloadDataUrl(dataUrl, `hh-goa-2026-${safeName()}.png`);
        window.open(
          "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweet),
          "_blank",
          "noopener,width=550,height=420"
        );
        shareNote.textContent = "Card downloaded · attach the PNG in the X post.";
        shareNote.className = "share-note ok";
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        shareNote.textContent = "Share cancelled.";
        shareNote.className = "share-note";
      } else {
        console.error(err);
        shareNote.textContent = "Could not share. Download PNG manually.";
        shareNote.className = "share-note err";
      }
    } finally {
      btnShare.innerHTML = orig;
      btnShare.disabled = false;
    }
  });

  load();
})();