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
    const parts = v.split(" ");
    if (parts.length >= 2) return parts[0] + "<br>" + parts.slice(1).join(" ");
    return v;
  }

  function apply() {
    const name = (nameIn.value || "YOUR NAME").trim().toUpperCase();
    const role = (roleIn.value || "YOUR ROLE").trim().toUpperCase();
    cardName.textContent = name;
    cardRole.textContent = role;
    cardClass.innerHTML = fmtClass(classIn.value);
    if (currentId) cardId.textContent = currentId;
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
      if (barcodeImg) {
        barcodeImg.src = currentBarcode;
        barcodeImg.style.display = "block";
      }
      return data;
    } catch (e) {
      console.error(e);
      // Fallback client-side unique-ish id if API fails
      const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
      ).join("");
      const numbers = String(1000 + Math.floor(Math.random() * 9000));
      currentId = `#HH-GOA-${letters}-${numbers}`;
      currentBarcode = null;
      cardId.textContent = currentId;
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
    if (!currentId) {
      await fetchBuilderId();
    }
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
      console.warn("sessionStorage failed", e);
    }
    window.location.href = "/result";
  });

  nameIn.addEventListener("input", apply);
  roleIn.addEventListener("input", apply);
  classIn.addEventListener("change", apply);

  // Init: fetch unique ID + barcode from Python backend
  (async () => {
    await fetchBuilderId();
    renderQR();
    apply();
  })();
})();
