(function () {
  const $ = (s) => document.querySelector(s);

  const cardName = $("#card-name");
  const cardRole = $("#card-role");
  const cardClass = $("#card-class");
  const cardId = $("#card-id");
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

  function renderQR() {
    qrBox.innerHTML = "";
    try {
      new QRCode(qrBox, {
        text: homeUrl(),
        width: 56,
        height: 56,
        colorDark: "#1a1a1a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      qrBox.innerHTML =
        '<div style="width:56px;height:56px;background:#111;opacity:.08;border-radius:2px"></div>';
    }
  }

  function fmtClass(v) {
    if (!v) return "TERMINAL<br>WIZARD";
    const parts = v.split(" ");
    if (parts.length >= 2) return parts[0] + "<br>" + parts.slice(1).join(" ");
    return v;
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

    const name = (data.name || "YOUR NAME").trim().toUpperCase() || "YOUR NAME";
    const role = (data.role || "YOUR ROLE").trim().toUpperCase() || "YOUR ROLE";

    cardName.textContent = name;
    cardRole.textContent = role;
    cardClass.innerHTML = fmtClass(data.klass || "TERMINAL WIZARD");
    cardId.textContent = data.id || "#HH-GOA-····-····";

    if (data.barcode && barcodeImg) {
      barcodeImg.src = data.barcode;
      barcodeImg.style.display = "block";
    } else if (barcodeImg) {
      barcodeImg.style.display = "none";
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
    shareNote.textContent = "";
    shareNote.className = "share-note";
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
    shareNote.textContent = "";
    shareNote.className = "share-note";

    try {
      const dataUrl = await captureCard();
      const tweet = buildTweetText();
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], "hh-goa-builder-card.png", {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          text: tweet,
          files: [file],
          title: "Hacker House Goa 2026 Builder Card",
        });
        shareNote.textContent = "Shared!";
        shareNote.className = "share-note ok";
      } else {
        downloadDataUrl(dataUrl, `hh-goa-2026-${safeName()}.png`);
        const intent =
          "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent(tweet);
        window.open(intent, "_blank", "noopener,width=550,height=420");
        shareNote.textContent =
          "Card downloaded · attach the PNG in the X post that opened.";
        shareNote.className = "share-note ok";
      }
    } catch (err) {
      if (err && err.name === "AbortError") {
        shareNote.textContent = "Share cancelled.";
        shareNote.className = "share-note";
      } else {
        console.error(err);
        try {
          const tweet = buildTweetText();
          if (lastDataUrl) {
            downloadDataUrl(lastDataUrl, `hh-goa-2026-${safeName()}.png`);
          }
          window.open(
            "https://twitter.com/intent/tweet?text=" +
              encodeURIComponent(tweet),
            "_blank",
            "noopener,width=550,height=420"
          );
          shareNote.textContent =
            "Card downloaded · attach the PNG in the X compose window.";
          shareNote.className = "share-note ok";
        } catch (e2) {
          shareNote.textContent =
            "Could not share. Download PNG and post manually.";
          shareNote.className = "share-note err";
        }
      }
    } finally {
      btnShare.innerHTML = orig;
      btnShare.disabled = false;
    }
  });

  load();
})();
