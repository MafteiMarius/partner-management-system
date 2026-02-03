let orase = [];
let selectedIndex = -1;
orasSelectat = false;

const numeInput = document.getElementById('nume');

numeInput.addEventListener('input', function () {
  this.value = this.value.replace(/[";:<>\/\\|=_]/g, '');
});

fetch('orase.json')
  .then(res => res.json())
  .then(data => {
    orase = data.orase;
  });

const orasInput = document.getElementById('oras');
const resultsDiv = document.getElementById('orasResults');

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

    // Mouse hover syncs keyboard
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



document.addEventListener('DOMContentLoaded', function() {
    const codInput = document.getElementById('cod');
    const verificaCUIButton = document.getElementById('verificaCUI');
    const numeInput = document.getElementById('nume');
    const registruInput = document.getElementById('registru');
    const orasInput = document.getElementById('oras');
    const stradaInput = document.getElementById('strada');
    const numarStradaInput = document.getElementById('numar_strada');
    const platitorTVAInput = document.getElementById('platitorTVA');
    const partenerForm = document.getElementById('partenerForm');

    codInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        
        if (this.value.length >= 2) {
            verificaCUIButton.style.display = 'inline-block';
        } else {
            verificaCUIButton.style.display = 'none';
        }
    });

    verificaCUIButton.addEventListener('click', async function() {
        const cui = codInput.value.trim();
        if (!cui || cui.length < 2) {
            alert('Introduceți un CUI valid pentru verificare (minimum 2 cifre).');
            return;
        }

        const originalText = verificaCUIButton.textContent;
        verificaCUIButton.textContent = 'Se verifică...';
        verificaCUIButton.disabled = true;

        try {
            const response = await fetch(`https://lista-firme.info/api/v1/info?cui=${cui}`);
            
            if (!response.ok) {
                throw new Error('CUI-ul nu a fost găsit sau eroare de rețea. Verificați și completați manual.');
            }
            
            const data = await response.json();
            
            // Verificăm dacă API-ul a returnat date valide
            if (data && Object.keys(data.cui) !== 'The selected cui is invalid.') {
                // Precompletăm câmpurile cu datele din API
                // Adaptează aceste mapări în funcție de structura exactă a răspunsului API
                
                if (data.name) {
                    numeInput.value = data.name.toUpperCase();
                }
                
                if (data.reg_com) {
                    registruInput.value = data.reg_com.toUpperCase();
                }
                
                if (data.address) {
                    if (typeof data.address === 'object') {
                        if (data.address.street) {
                            stradaInput.value = data.address.street.toUpperCase();
                        }
                        if (data.address.number) {
                            numarStradaInput.value = data.address.number;
                        }
                    } 
                }
                
                alert('SUCCES - Datele firmei au fost precompletate automat. Verificați și ajustați dacă este necesar.');
            } else {
                alert('EȘUAT - CUI-ul nu a fost găsit. Completați manual.');
                document.getElementById('partenerForm').reset();
            }
        } catch (error) {
            console.error('Eroare la verificarea CUI:', error);
            alert('EȘUAT - CUI-ul nu a fost găsit sau a apărut o eroare. Completați datele manual.');
        } finally {
            verificaCUIButton.textContent = originalText;
            verificaCUIButton.disabled = false;
        }
    });

    numeInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            this.value = this.value.trim().toUpperCase();
        }
    });

    orasInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            this.value = this.value.trim().toUpperCase();
        }
    });

    stradaInput.addEventListener('blur', function() {
        if (this.value.trim()) {
            this.value = this.value.trim().toUpperCase();
        }
    });

    partenerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const cui = codInput.value.trim();
        if (!/^\d{2,15}$/.test(cui)) {
            alert('CUI invalid! Trebuie să conțină doar cifre (2-15 cifre).');
            codInput.focus();
            return;
        }

        const nume = numeInput.value.trim().toUpperCase();
        if (!nume) {
            alert('Introduceți denumirea firmei.');
            numeInput.focus();
            return;
        }

        if (/[\";:<>\/\\|=_]/.test(numeInput.value)) {
            alert('Numele conține caractere nepermise.');
            numeInput.focus();
            return;
}

        const oras = orasInput.value.trim().toUpperCase();
        if (!oras) {
            alert('Introduceți orașul.');
            orasInput.focus();
            return;
        }

        const strada = stradaInput.value.trim().toUpperCase();
        if (!strada) {
            alert('Introduceți strada.');
            stradaInput.focus();
            return;
        }

        const numarStrada = numarStradaInput.value.trim();
        if (!numarStrada) {
            alert('Introduceți numărul străzii.');
            numarStradaInput.focus();
            return;
        }

        const generatedId = 'EXT' + cui;
        const codFiscal = platitorTVAInput.checked ? '' + cui : cui;

        if(!platitorTVAInput.checked) {
            const confirmTVA = confirm('Ați bifat că firma nu este plătitoare de TVA. Confirmați această alegere?');
            if (!confirmTVA) {
                return;
            }
        }

        if (!orasSelectat) {
            alert('Selectați orașul din listă. Introducerea manuală nu este permisă.');
            orasInput.focus();
            return;
}

        const data = {
            id: generatedId,
            nume: nume,
            cod: codFiscal,
            platitorTVA: platitorTVAInput.checked,
            reg_com: registruInput.value.trim().toUpperCase(),
            oras: document.getElementById('oras').value.trim().toUpperCase(),
            idOras: document.getElementById('idOras').value,
            idJudet: document.getElementById('idJudet').value,
            strada: strada,
            numar_strada: numarStrada,
        };

        // Convertim obiectul în string JSON formatat
        const jsonString = JSON.stringify(data, null, 2);

        // Creăm un blob și descărcăm fișierul
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Numele fișierului: partener_<nume>_<id>.json
        const numeFisier = `${nume.replace(/\s+/g, '_')}_${generatedId}.json`;
        a.download = numeFisier;

        document.body.appendChild(a);
        a.click();

        // Curățăm și resetăm formularul
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Resetăm formularul
            partenerForm.reset();
            
            // Ascundem butonul de verificare
            verificaCUIButton.style.display = 'none';
        }, 100);

        // Mesaj de succes
        alert(`Fișierul "${numeFisier}" a fost generat cu succes!`);
    });
});