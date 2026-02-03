let orase = [];
let selectedIndex = -1;
let orasSelectat = false;

const numeInput = document.getElementById('nume');
const orasInput = document.getElementById('oras');
const resultsDiv = document.getElementById('orasResults');

fetch('/static/orase.json')
  .then(res => res.json())
  .then(data => {
    orase = data.orase;
  });

numeInput.addEventListener('input', function () {
  this.value = this.value.replace(/[";:<>\/\\|=_]/g, '');
});

function isValidCNP(cnp) {
  if (!cnp || cnp.trim() === "") return true;

  if (!/^[1-8]\d{12}$/.test(cnp)) return false;

  const control = "279146358279";
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnp[i]) * parseInt(control[i]);
  }

  let remainder = sum % 11;
  let checkDigit = remainder === 10 ? 1 : remainder;

  return checkDigit === parseInt(cnp[12]);
}

function toUpperCaseWords(str) {
  return str
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function formatSerieNumar(serie, numar) {
  const serieClean = serie.trim().toUpperCase().replace(/\s+/g, '');
  
  const numarClean = numar.trim().replace(/\s+/g, '');
  
  if (serieClean && numarClean) {
    return serieClean + numarClean;
  } else if (serieClean) {
    return serieClean;
  } else if (numarClean) {
    return numarClean;
  }
  
  return '';
}

function generateIdFromCNP(cnp) {
  const numar = document.getElementById('numar').value.trim();
  random_number = Math.floor(100000 + Math.random() * 900000);
  if (cnp.length === 13) {
    return 'EXT' + cnp.slice(-6);
  }
  else if (numar && numar.length > 0) {
    return 'EXT' + numar;
  }
  return `EXT${random_number}`;
}

document.getElementById('cod').addEventListener('input', function() {
  const cnpValue = this.value.trim();
  const cnpInput = this;
  
  this.value = this.value.replace(/\D/g, '');
  
  if (cnpValue.length === 13) {
    if (isValidCNP(cnpValue)) {
      cnpInput.style.borderColor = 'green';
      cnpInput.style.borderWidth = '2px';
    } else {
      cnpInput.style.borderColor = 'red';
      cnpInput.style.borderWidth = '2px';
    }
  } else {
    cnpInput.style.borderColor = '';
    cnpInput.style.borderWidth = '';
  }
});

document.getElementById('nume').addEventListener('blur', function() {
  const numeValue = this.value.trim();
  if (numeValue) {
    this.value = toUpperCaseWords(numeValue);
  }
});

document.getElementById('serie').addEventListener('blur', function() {
  const serieValue = this.value.trim();
  if (serieValue) {
    this.value = serieValue.toUpperCase().replace(/\s+/g, '');
  }
});

orasInput.addEventListener('input', function () {
  orasSelectat = false;
  const q = this.value.trim().toLowerCase();
  resultsDiv.innerHTML = '';
  selectedIndex = -1;

  if (!q) return;

  let filtered = orase.filter(o =>
    o.oras.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    filtered = orase.filter(o =>
      o.judet.toLowerCase().includes(q)
    );
  }

  filtered.slice(0, 20).forEach((o, index) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.textContent = `${o.oras} (${o.judet})`;

    div.dataset.idOras = o.idOras;
    div.dataset.idJudet = o.idJudet;

    // mouse hover syncs keyboard
    div.addEventListener('mouseenter', () => {
      clearActive();
      selectedIndex = index;
      div.classList.add('active');
    });

    div.onclick = () => selectOras(o);

    resultsDiv.appendChild(div);
  });
});

orasInput.addEventListener('keydown', function (e) {
  const items = resultsDiv.querySelectorAll('.result-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length;
    updateActive(items);
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex =
      (selectedIndex - 1 + items.length) % items.length;
    updateActive(items);
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedIndex >= 0) {
      items[selectedIndex].click();
    }
  }

  if (e.key === 'Escape') {
    resultsDiv.innerHTML = '';
    selectedIndex = -1;
  }
});

function updateActive(items) {
  items.forEach(i => i.classList.remove('active'));
  items[selectedIndex].classList.add('active');

  items[selectedIndex].scrollIntoView({
    block: 'nearest'
  });
}

function clearActive() {
  const items = resultsDiv.querySelectorAll('.result-item');
  items.forEach(i => i.classList.remove('active'));
}

function selectOras(o) {
  orasInput.value = o.oras.toUpperCase();
  document.getElementById('idOras').value = o.idOras;
  document.getElementById('idJudet').value = o.idJudet;
  orasSelectat = true;
  resultsDiv.innerHTML = '';
  selectedIndex = -1;
}

document.addEventListener('click', function (e) {
  if (!orasInput.contains(e.target) && !resultsDiv.contains(e.target)) {
    resultsDiv.innerHTML = '';
  }
});

document.getElementById('partenerForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const cnpValue = document.getElementById('cod').value.trim();

  if (!isValidCNP(cnpValue)) {
    alert("CNP invalid! Verificați că ați introdus corect.");
    document.getElementById('cod').focus();
    return;
  }

  const numeInput = document.getElementById('nume');
  const numeValue = toUpperCaseWords(numeInput.value);
  
  if (!numeValue) {
    alert("Vă rugăm să introduceți numele și prenumele!");
    numeInput.focus();
    return;
  }

  if (/[\";:<>\/\\|=_]/.test(numeInput.value)) {
    alert('Numele conține caractere nepermise.');
    numeInput.focus();
    return;
  }
  
  numeInput.value = numeValue;

  const serieInput = document.getElementById('serie');
  if (serieInput.value.trim()) {
    serieInput.value = serieInput.value.trim().toUpperCase();
  }

  if (!orasSelectat) {
    alert('Selectați orașul din listă. Introducerea manuală nu este permisă.');
    orasInput.focus();
    return;
  }

  const generatedId = generateIdFromCNP(cnpValue);

  const serieNumarCombinat = formatSerieNumar(
    document.getElementById('serie').value,
    document.getElementById('numar').value
  );

  const data = {
    id: generatedId,
    nume: numeValue,
    codFiscal: cnpValue,
    reg_com: serieNumarCombinat,
    platitorTVA: false,
    oras: document.getElementById('oras').value.trim().toUpperCase(),
    idOras: document.getElementById('idOras').value,
    idJudet: document.getElementById('idJudet').value,
    strada: document.getElementById('strada').value.trim().toUpperCase(),
    numar_strada: document.getElementById('numar_strada').value.trim().toUpperCase(),
    bloc: document.getElementById('bloc').value.trim().toUpperCase() || null,
    scara: document.getElementById('scara').value.trim().toUpperCase() || null,
    etaj: document.getElementById('etaj').value.trim() || null,
    apartament: document.getElementById('apartament').value.trim().toUpperCase() || null,
    telefon: document.getElementById('telefon').value.trim() || null,
    email: document.getElementById('email').value.trim() || null,
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if(submitBtn) submitBtn.disabled = true;

  console.log("Se trimit datele către server...", data);

  fetch('/adauga-partener', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) throw new Error('Eroare rețea sau server');
    return response.json();
  })
  .then(res => {
    if (res.cod === 0) {
      alert(`✅ Succes! Partenerul "${numeValue}" a fost creat.`);
      document.getElementById('partenerForm').reset();
      orasSelectat = false;
    } else if (res.cod === 4) {
      alert(`⚠️ Atenție: Partenerul "${numeValue}" există deja în baza de date!`);
    } else {
      alert(`❌ Eroare neașteptată (Cod SQL: ${res.cod}).`);
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('❌ Nu s-a putut contacta serverul. Verifică dacă aplicația Python rulează.');
  })
  .finally(() => {
    if(submitBtn) submitBtn.disabled = false;
  });
}); // <-- This closing brace was missing/in wrong place!

document.getElementById('numar').addEventListener('input', function() {
  this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
});

document.getElementById('serie').addEventListener('input', function() {
  this.value = this.value.toUpperCase();
});

document.addEventListener('DOMContentLoaded', function() {
  const tvaContainer = document.getElementById('tvaContainer');
  if (tvaContainer) {
    tvaContainer.style.display = 'none';
  }
  
  const codInput = document.getElementById('cod');
  
  codInput.addEventListener('keypress', function(e) {
    if (!/\d/.test(e.key) && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
  });
  
  codInput.addEventListener('input', function() {
    if (this.value.length > 13) {
      this.value = this.value.slice(0, 13);
    }
  });
});
