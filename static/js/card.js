(function () {
  const $ = (s) => document.querySelector(s);

  const nameIn = $("#input-name");
  const roleIn = $("#input-role");
  const photoIn = $("#input-photo");
  const classIn = $("#input-class");
  const btnCreate = $("#btn-create");
  const btnRegen = $("#btn-regen");
  const fileLabel = $("#file-label");
  const fileWrap = document.querySelector(".file-wrap");

  const cardName = $("#card-name");
  const cardRole = $("#card-role");
  const cardClass = $("#card-class");
  const cardId = $("#card-id");
  const cardIdShort = $("#card-id-short");
  const cardPhoto = $("#card-photo");
  const placeholder = $("#placeholder");
  const qrBox = $("#qrcode");
  const barcodeImg = $("#card-barcode");

  let currentId = null;
  let currentBarcode = null;
  let photoData = null;

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

  function apply() {
    cardName.textContent = (nameIn.value || "YOUR NAME").trim().toUpperCase();
    cardRole.textContent = (roleIn.value || "YOUR ROLE").trim().toUpperCase();
    cardClass.textContent = classIn.value;
    if (currentId) {
      cardId.textContent = currentId;
      setShortId(currentId);
    }
    if (currentBarcode && barcodeImg) {
      barcodeImg.src = currentBarcode;
      barcodeImg.style.display = "block";
    }
  }

  async function fetchBuilderId() {
    try {
      const res = await fetch("/api/builder-id", { method: "POST" });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      currentId = data.id;
      currentBarcode = data.barcode;
      cardId.textContent = currentId;
      setShortId(currentId);
      if (barcodeImg && currentBarcode) {
        barcodeImg.src = currentBarcode;
        barcodeImg.style.display = "block";
      }
      return data;
    } catch (e) {
      console.error(e);
      const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");
      const numbers = String(1000 + Math.floor(Math.random() * 9000));
      currentId = `#HH-GOA-${letters}-${numbers}`;
      currentBarcode = null;
      cardId.textContent = currentId;
      setShortId(currentId);
      if (barcodeImg) barcodeImg.style.display = "none";
      return { id: currentId, barcode: null };
    }
  }

  photoIn.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      photoData = ev.target.result;
      cardPhoto.src = photoData;
      cardPhoto.classList.remove("hidden");
      placeholder.style.display = "none";
      if (fileLabel)
        fileLabel.textContent =
          f.name.length > 28 ? f.name.slice(0, 25) + "…" : f.name;
      if (fileWrap) fileWrap.classList.add("has-file");
    };
    r.readAsDataURL(f);
  });

  btnRegen.addEventListener("click", async () => {
    btnRegen.disabled = true;
    btnRegen.textContent = "Generating…";
    await fetchBuilderId();
    renderQR();
    btnRegen.disabled = false;
    btnRegen.textContent = "↻ New Builder ID";
  });

  btnCreate.addEventListener("click", async () => {
    apply();
    if (!currentId) await fetchBuilderId();
    const payload = {
      name: (nameIn.value || "").trim(),
      role: (roleIn.value || "").trim(),
      klass: classIn.value,
      id: currentId,
      barcode: currentBarcode,
      photo: photoData || null,
    };
    try {
      sessionStorage.setItem("hhgoa_card", JSON.stringify(payload));
    } catch (e) {
      console.warn(e);
    }
    window.location.href = "/result";
  });

  nameIn.addEventListener("input", apply);
  roleIn.addEventListener("input", apply);
  classIn.addEventListener("change", apply);

  (async () => {
    await fetchBuilderId();
    renderQR();
    apply();
  })();
})();