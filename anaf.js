// Variabile globale pentru lista de orașe
let orase = [];
let selectedIndex = -1;
let orasSelectat = false;

/**
 * Funcția care verifică un CUI folosind serviciul web ANAF și completează formularul.
 * Aceasta este prima metodă de interogare.
 */

function selectOras(o) {
    if (!o || !o.oras) {
        console.error('Obiect oraș invalid:', o);
        return;
    }
    
    orasInput.value = o.oras.toUpperCase();
    document.getElementById('idOras').value = o.idOras || '';
    document.getElementById('idJudet').value = o.idJudet || '';
    orasSelectat = true;
    resultsDiv.innerHTML = '';
    selectedIndex = -1;
    
    console.log(`✅ Oraș selectat: ${o.oras} (Județ: ${o.judet}, ID Oraș: ${o.idOras}, ID Județ: ${o.idJudet})`);
}

function extractAndMatchCity(cityString) {
    if (!cityString) return null;
    
    // 1. Extrage ultimul cuvânt din string (numele orașului)
    const words = cityString.trim().split(' ');
    let cityName = words[words.length - 1];
    
    // 2. Curăță caractere speciale (virgule, puncte, etc.)
    cityName = cityName.replace(/[.,;]/g, '');
    
    // 3. Transformă în majuscule pentru potrivirea case-insensitive
    const cityNameUpper = cityName.toUpperCase();
    
    // 4. Caută în lista de orașe
    const cityFound = orase.find(o => 
        o.oras.toUpperCase() === cityNameUpper || 
        o.oras.toUpperCase().includes(cityNameUpper) ||
        cityNameUpper.includes(o.oras.toUpperCase())
    );
    
    if (cityFound) {
        return cityFound;
    }
    
    // 5. Dacă nu găsim exact, încercăm să căutăm fără diacritice
    const cityWithoutDiacritics = cityNameUpper
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    
    const cityFoundWithoutDiacritics = orase.find(o => {
        const orasNormalized = o.oras.toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        return orasNormalized === cityWithoutDiacritics;
    });
    
    return cityFoundWithoutDiacritics || null;
}

async function verificareCUIAnaf(cui) {
    // Pregătim corpul cererii conform specificațiilor ANAF
    const requestDate = new Date().toISOString().split('T')[0]; // Data de azi în format YYYY-MM-DD
    const requestBody = [
        {
            "cui": parseInt(cui),
            "data": requestDate
        }
    ];

    // URL-ul API-ului ANAF cu proxy CORS pentru a evita erorile din browser
    const apiUrl = "https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva";

    try {
        // Facem cererea POST către ANAF prin proxy
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Eroare API ANAF: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        // Verificăm dacă CUI-ul a fost găsit
        if (result.message !== "SUCCESS") {
            // Nu aruncăm eroare aici, doar returnăm false pentru a permite încercarea cu API-ul alternativ
            console.log(`CUI-ul ${cui} nu a fost găsit în registrele ANAF.`);
            return false;
        }

        // Extragem datele companiei din primul rezultat găsit
        const companyData = result.found[0];
        const dateGenerale = companyData.date_generale;
        const adresaSediu = companyData.adresa_sediu_social || {};
        const adresaFiscal = companyData.adresa_domiciliu_fiscal || {};
        const inregistrareTVA = companyData.inregistrare_scop_Tva || {};

        // Populăm câmpurile formularului cu datele obținute
        const form = document.getElementById('partenerForm');

        // Nume firmă (denumire)
        if (dateGenerale.denumire) {
            document.getElementById('nume').value = dateGenerale.denumire.toUpperCase();
        }

        // Cod fiscal (CUI) - cu sau fără RO în funcție de platitor TVA
        const isPlatitorTVA = inregistrareTVA.scpTVA === true;
        document.getElementById('cod').value = isPlatitorTVA ? 'RO' + cui : cui;

        // Checkbox pentru platitor TVA
        document.getElementById('platitorTVA').checked = isPlatitorTVA;

        // Nr. reg. com.
        if (dateGenerale.nrRegCom) {
            document.getElementById('registru').value = dateGenerale.nrRegCom;
        }

        // Adresă - folosim datele din sediul social sau domiciliul fiscal
        const adresaDeFolosit = adresaSediu.sdenumire_Localitate ? adresaSediu : adresaFiscal;

        // Aici integrez cu sistemul de selecție oraș: încerc să găsesc orașul în lista noastră
        if (adresaDeFolosit.sdenumire_Localitate) {
            const numeOras = adresaDeFolosit.sdenumire_Localitate.toUpperCase();
            const orasGasit = orase.find(o => o.oras.toUpperCase() === numeOras);
            
            if (orasGasit) {
                // Dacă orașul există în lista noastră, îl selectăm automat
                selectOras(orasGasit);
            } else {
                // Dacă nu-l găsim, punem doar numele în câmp
                document.getElementById('oras').value = numeOras;
                // Marchem că nu a fost selectat din listă
                orasSelectat = false;
            }
        }

        // ID Oraș și ID Județ (din obiectul oraș găsit, nu din răspunsul ANAF)
        // Acestea sunt deja setate de funcția selectOras dacă orașul a fost găsit

        // Stradă
        if (adresaDeFolosit.sdenumire_Strada) {
            let stradaCompleta = adresaDeFolosit.sdenumire_Strada;
            if (adresaDeFolosit.snumar_Strada) {
                stradaCompleta += ' nr. ' + adresaDeFolosit.snumar_Strada;
            }
            document.getElementById('strada').value = stradaCompleta.toUpperCase();
        }

        // Număr stradă (separat)
        if (adresaDeFolosit.snumar_Strada) {
            document.getElementById('numar_strada').value = adresaDeFolosit.snumar_Strada;
        }

        console.log('✅ Date firma preluate de la ANAF:', {
            denumire: dateGenerale.denumire,
            cui: dateGenerale.cui,
            platitorTVA: isPlatitorTVA,
            stareInregistrare: dateGenerale.stare_inregistrare
        });

        return true;

    } catch (error) {
        console.error('Eroare la verificarea CUI prin ANAF:', error);
        // Returnăm false pentru a permite încercarea cu API-ul alternativ
        return false;
    }
}

async function verificareCUIAlternativ(cui) {
    try {
        const response = await fetch(`https://lista-firme.info/api/v1/info?cui=${cui}`);
        
        if (!response.ok) {
            throw new Error('CUI-ul nu a fost găsit sau eroare de rețea.');
        }
        
        const data = await response.json();
        
        // Verifică dacă API-ul a returnat un răspuns valid
        if (data && data.cui && data.cui !== 'The selected cui is invalid.') {
            // Precompletează câmpurile cu datele din API
            if (data.name) {
                document.getElementById('nume').value = data.name.toUpperCase();
            }
            
            if (data.reg_com) {
                document.getElementById('registru').value = data.reg_com.toUpperCase();
            }
            
            // Adresă - folosind noua funcție pentru extragerea orașului
            if (data.address) {
                if (typeof data.address === 'string') {
                    // Încearcă să găsești orașul în stringul adresei
                    const orasGasit = extractAndMatchCity(data.address);
                    
                    if (orasGasit) {
                        // Dacă am găsit orașul în listă, îl selectăm automat
                        selectOras(orasGasit);
                        console.log(`✅ Oraș găsit în listă: ${orasGasit.oras}`);
                    } else {
                        // Dacă nu-l găsim, încercăm să extragem ultimul cuvânt din adresă
                        const lastWord = data.address.city.trim().split(' ').pop();
                        const cleanedWord = lastWord.replace(/[.,;]/g, '').toUpperCase();
                        document.getElementById('oras').value = cleanedWord;
                        orasSelectat = false;
                        console.log(`⚠️ Oraș setat manual: ${cleanedWord} (nu găsit în listă)`);
                    }
                } else if (typeof data.address === 'object') {
                    if (data.address.street) {
                        document.getElementById('strada').value = data.address.street.toUpperCase();
                    }
                    if (data.address.number) {
                        document.getElementById('numar_strada').value = data.address.number;
                    }
                    if (data.address.city) {
                        // Dacă API-ul returnează un câmp separat pentru oraș
                        const orasGasit = extractAndMatchCity(data.address.city);
                        if (orasGasit) {
                            selectOras(orasGasit);
                        } else {
                            document.getElementById('oras').value = data.address.city.toUpperCase();
                            orasSelectat = false;
                        }
                    }
                }
            }
            
            return true;
        } else {
            throw new Error('CUI-ul nu a fost găsit în baza de date alternativă.');
        }
    } catch (error) {
        console.error('Eroare la verificarea CUI prin API alternativ:', error);
        return false;
    }
}

/**
 * Funcția principală care orchestrează verificarea CUI
 * Încearcă ANAF, apoi fallback-ul
 */
async function verificareCUICompleta(cui) {
    // Încearcă mai întâi cu ANAF (metoda preferată)
    const successAnaf = await verificareCUIAnaf(cui);
    
    if (successAnaf) {
        alert('✅ Datele firmei au fost preluate de la ANAF și completate în formular!');
        return true;
    }
    
    // Dacă ANAF nu a funcționat, încearcă cu API-ul alternativ
    console.log('ANAF nu a returnat date. Încerc API alternativ...');
    const successAlternativ = await verificareCUIAlternativ(cui);
    
    if (successAlternativ) {
        alert('ℹ️ Datele firmei au fost preluate din sursă alternativă. Verificați și ajustați dacă este necesar.');
        return true;
    }
    
    // Dacă niciuna dintre metode nu a funcționat
    alert('❌ CUI-ul nu a putut fi verificat prin niciuna dintre surse. Completați datele manual.');
    return false;
}

// CODUL PENTRU AUTOCMPLETARE ORAȘE ȘI GESTIONARE FORMULAR
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
    const resultsDiv = document.getElementById('orasResults');

    // 1. Încarcă lista de orașe din fișierul JSON
    fetch('orase.json')
        .then(res => res.json())
        .then(data => {
            orase = data.orase;
        })
        .catch(error => {
            console.error('Eroare la încărcarea listei de orașe:', error);
        });

    // 2. Validează inputul CUI (doar cifre)
    codInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        
        if (this.value.length >= 2) {
            verificaCUIButton.style.display = 'inline-block';
        } else {
            verificaCUIButton.style.display = 'none';
        }
    });

    // 3. Handler pentru butonul de verificare CUI
    verificaCUIButton.addEventListener('click', async function() {
        const cui = codInput.value.trim();
        
        if (!cui || cui.length < 2) {
            alert('Introduceți un CUI valid pentru verificare (minimum 2 cifre).');
            return;
        }
        
        // Arată starea de încărcare
        const originalText = verificaCUIButton.textContent;
        verificaCUIButton.textContent = 'Se verifică...';
        verificaCUIButton.disabled = true;
        
        // Apelează funcția principală de verificare
        await verificareCUICompleta(cui);
        
        // Restabilește starea butonului
        verificaCUIButton.textContent = originalText;
        verificaCUIButton.disabled = false;
    });

    // 4. Funcționalitatea de autocomplete pentru orașe
    numeInput.addEventListener('input', function() {
        this.value = this.value.replace(/[";:<>\/\\|=_]/g, '');
    });

    orasInput.addEventListener('input', function() {
        orasSelectat = false;
        const query = this.value.trim().toLowerCase();
        resultsDiv.innerHTML = '';
        selectedIndex = -1;

        if (!query) return;

        let filtered = orase.filter(o =>
            o.oras.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            filtered = orase.filter(o =>
                o.judet.toLowerCase().includes(query)
            );
        }

        filtered.slice(0, 20).forEach((o, index) => {
            const div = document.createElement('div');
            div.className = 'result-item';
            div.textContent = `${o.oras} (${o.judet})`;

            div.dataset.idOras = o.idOras;
            div.dataset.idJudet = o.idJudet;

            div.addEventListener('mouseenter', () => {
                clearActive();
                selectedIndex = index;
                div.classList.add('active');
            });

            div.onclick = () => selectOras(o);

            resultsDiv.appendChild(div);
        });
    });

    orasInput.addEventListener('keydown', function(e) {
        const items = resultsDiv.querySelectorAll('.result-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateActive(items);
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
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

    // 5. Funcții helper pentru autocomplete orașe
    function updateActive(items) {
        items.forEach(i => i.classList.remove('active'));
        if (selectedIndex >= 0) {
            items[selectedIndex].classList.add('active');
            items[selectedIndex].scrollIntoView({
                block: 'nearest'
            });
        }
    }

    function clearActive() {
        const items = resultsDiv.querySelectorAll('.result-item');
        items.forEach(i => i.classList.remove('active'));
    }

    

    // 6. Transformă textul în majuscule la ieșirea din câmpuri
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

    // 7. Handler pentru trimiterea formularului
    partenerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const cui = codInput.value.trim();
        if (!/^\d{2,15}$/.test(cui)) {
            alert('❌ CUI invalid! Trebuie să conțină doar cifre (2-15 cifre).');
            codInput.focus();
            return;
        }

        const nume = numeInput.value.trim().toUpperCase();
        if (!nume) {
            alert('❌ Introduceți denumirea firmei.');
            numeInput.focus();
            return;
        }

        if (/[\";:<>\/\\|=_]/.test(numeInput.value)) {
            alert('❌ Numele conține caractere nepermise.');
            numeInput.focus();
            return;
        }

        const oras = orasInput.value.trim().toUpperCase();
        if (!oras) {
            alert('❌ Introduceți orașul.');
            orasInput.focus();
            return;
        }

        const strada = stradaInput.value.trim().toUpperCase();
        if (!strada) {
            alert('❌ Introduceți strada.');
            stradaInput.focus();
            return;
        }

        const numarStrada = numarStradaInput.value.trim();
        if (!numarStrada) {
            alert('❌ Introduceți numărul străzii.');
            numarStradaInput.focus();
            return;
        }

        if (!orasSelectat) {
            alert('❌ Selectați orașul din listă. Introducerea manuală nu este permisă.');
            orasInput.focus();
            return;
        }

        if(!platitorTVAInput.checked) {
            const confirmTVA = confirm('Ați bifat că firma nu este plătitoare de TVA. Confirmați această alegere?');
            if (!confirmTVA) {
                return;
            }
        }

        const generatedId = 'EXT' + cui;
        const codFiscal = platitorTVAInput.checked ? '' + cui : cui;

        const data = {
            id: generatedId,
            nume: nume,
            cod: codFiscal,
            platitorTVA: platitorTVAInput.checked,
            reg_com: registruInput.value.trim().toUpperCase(),
            oras: oras,
            idOras: document.getElementById('idOras').value,
            idJudet: document.getElementById('idJudet').value,
            strada: strada,
            numar_strada: numarStrada,
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const numeFisier = `${nume.replace(/\s+/g, '_')}_${generatedId}.json`;
        a.download = numeFisier;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            partenerForm.reset();
            verificaCUIButton.style.display = 'none';
            orasSelectat = false;
        }, 100);

        alert(`✅ Fișierul "${numeFisier}" a fost generat cu succes!`);
    });
});