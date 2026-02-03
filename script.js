function cleanFiscalCode(cod) {
    return cod.toUpperCase().replace(/^RO/, '').replace(/\s+/g, '');
}

function isCNP(cod) {
    const cleaned = cleanFiscalCode(cod);
    return /^\d{13}$/.test(cleaned);
}

function isCUI(cod) {
    const cleaned = cleanFiscalCode(cod);
    return /^\d{2,10}$/.test(cleaned);
}

function generateIdFromFiscalCode(cod) {
    const cleaned = cleanFiscalCode(cod);
    
    if (isCNP(cod)) {
        return 'EXT' + cleaned.slice(-6);
    } else {
        return 'EXT' + cleaned;
    }
}

// ================= VALIDARE CNP =================
function isValidCNP(cnp) {
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

// ================= VALIDARE CUI =================
function isValidCUI(value) {
    const cleaned = value.toUpperCase().replace(/^RO/, '');
    if (!/^\d{2,10}$/.test(cleaned)) return false;
    return true;
}

// ================= VALIDARE COD FISCAL =================
function isValidFiscalCode(value) {
    const cleaned = cleanFiscalCode(value);
    
    if (/^\d{13}$/.test(cleaned)) {
        return isValidCNP(cleaned);
    }
    
    return isValidCUI(value);
}

// ================= AFIȘARE/ASCUNDERE CHECKBOX TVA =================
document.getElementById('cod').addEventListener('input', function() {
    const codValue = this.value.trim();
    const tvaContainer = document.getElementById('tvaContainer');
    
    if (!codValue) {
        tvaContainer.style.display = 'none';
        return;
    }
    
    const cleaned = cleanFiscalCode(codValue);
    
    // Verifică dacă este CNP (13 cifre)
    if (/^\d{13}$/.test(cleaned)) {
        // Este CNP - ascunde containerul TVA
        tvaContainer.style.display = 'none';
        document.getElementById('platitorTVA').checked = false;
    } 
    // Verifică dacă este CUI (2-10 cifre)
    else if (/^\d{2,10}$/.test(cleaned)) {
        // Este CUI - arată containerul TVA
        tvaContainer.style.display = 'inline';
    } 
    // Pentru coduri incomplete sau invalide
    else {
        tvaContainer.style.display = 'none';
    }
});

// ================= GENERARE ȘI DESCĂRCARE JSON =================
document.getElementById('partenerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const codValue = document.getElementById('cod').value.trim();
    
    if (!isValidFiscalCode(codValue)) {
        alert("CNP sau Cod Fiscal invalid!");
        return;
    }
    
    const generatedId = generateIdFromFiscalCode(codValue);
    
    const platitorTVA = document.getElementById('platitorTVA').checked;

    const cleanedCod = cleanFiscalCode(codValue);

    const data = {
        id: generatedId,
        nume: document.getElementById('nume').value,
        cod: cleanedCod,
        platitorTVA: platitorTVA,
        registru: document.getElementById('registru').value,
        oras: document.getElementById('oras').value,
        strada: document.getElementById('strada').value,
        numar_strada: document.getElementById('numar_strada').value
    };

    const jsonString = JSON.stringify(data, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    const numePartener = document.getElementById('nume').value.trim();
    const numeFisier = numePartener 
        ? `${numePartener.replace(/\s+/g, '_')}.json`
        : `${generatedId}.json`;
    
    a.download = numeFisier;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
    
    alert(`Fișierul "${numeFisier}" a fost generat cu succes!`);
});