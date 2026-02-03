from flask import Flask, request, jsonify, send_from_directory
# from flask_cors import CORS
import pyodbc
import sys

app = Flask(__name__, static_folder='static')
# CORS(app)

# --- CONFIGURARE ---
# Încearcă să schimbi Driver={SQL Server} cu Driver={SQL Server Native Client 11.0} 
# dacă prima variantă nu merge.
conn_str = (
    "Driver={SQL Server};"
    "Server=ST-TEST\BIZPHARMA2008;" # Exemplu: SERVER-PC\SQLEXPRESS
    "Database=BizPharma;"
    "UID=sa;" # Exemplu: sa
    "PWD=Minifarm53tr10;"
)

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route('/adauga-partener', methods=['POST'])
def adauga():
    data = request.json
    print("\n--- CERERE NOUA ---")
    print(f"Date primite din browser: {data}")
    
    conn = None
    try:
        print("Încerc conectarea la SQL Server...")
        conn = pyodbc.connect(conn_str, timeout=5)
        cursor = conn.cursor()
        print("Conexiune reușită!")
        
        # Combină strada cu numărul (dacă există)
        strada_completa = data.get('strada', '')
        numar_strada = data.get('numar_strada', '')
        if numar_strada:
            strada_completa = f"{strada_completa} {numar_strada}".strip()
        
        # Add timestamp to make address unique and avoid ID collision
        import time
        timestamp_suffix = str(int(time.time() * 1000))[-6:]  # Last 6 digits of timestamp
        strada_completa = f"{strada_completa}#{timestamp_suffix}"
        
        # Truncate strada la 50 caractere (limita din SQL)
        if len(strada_completa) > 50:
            strada_completa = strada_completa[:50]
        
        # Separate street name and number (NO timestamp!)
        strada_nume = data.get('strada', '')
        numar_strada = data.get('numar_strada', '') or None
        bloc = data.get('bloc', '') or None
        scara = data.get('scara', '') or None
        apartament = data.get('apartament', '') or None
        telefon = data.get('telefon', '') or None
        email = data.get('email', '') or None
        cod_partener = data.get('id', '')
        
        sql = """
        SET NOCOUNT ON;
        
        DECLARE @IdPartener INT;
        DECLARE @IdAdresa INT;
        DECLARE @Rezultat INT;
        DECLARE @IdTipEntitate INT;
        
        -- Get IdTipEntitate
        SELECT @IdTipEntitate = IdDictionarDetaliu 
        FROM DictionarDetaliu 
        WHERE IdDictionar = 158 AND Nume = 'Persoana juridica';
        
        -- Check if partner with this Cod already exists
        IF EXISTS(SELECT 1 FROM Partener WHERE Cod = ?)
        BEGIN
            SET @Rezultat = 3;
            SELECT @Rezultat AS Rezultat, NULL AS IdPartener;
            RETURN;
        END
        
        -- Check if partner with this Nume already exists
        IF EXISTS(SELECT 1 FROM Partener WHERE Nume = ?)
        BEGIN
            SET @Rezultat = 4;
            SELECT @Rezultat AS Rezultat, NULL AS IdPartener;
            RETURN;
        END
        
        -- Generate unique IDs manually
        SELECT @IdAdresa = ISNULL(MAX(IdAdresa), 0) + 1 FROM Adresa;
        SELECT @IdPartener = ISNULL(MAX(IdPartener), 0) + 1 FROM Partener;
        
        -- Insert address (with all fields)
        INSERT INTO Adresa (IdAdresa, IdOras, Strada, Numar, Bloc, Scara, Ap, TelefonMobil, Email)
        VALUES (@IdAdresa, ?, ?, ?, ?, ?, ?, ?, ?);
        
        IF @@ERROR = 0
        BEGIN
            -- Insert partner with Cod from frontend
            INSERT INTO Partener (IdPartener, Cod, Nume, IdOrganizatie, CodFiscal, NrRegCom, EsteClient, EsteClientActiv, IdAdresa, PlatitorTVA, IdTipEntitate, NecesitaDecomisionare, CapitalSocial, EsteProducator, EsteFurnizor, TermenPlata, EsteProducatorActiv, EsteFurnizorActiv, ProcDisc, Rang, EstePartenerExtern, TermenPlataFix, TVALaIncasare, ProcAdaosVanzare, LimitaCredit, Observatie, EsteSediuCentral, ZileDepasireScadenta)
            VALUES (@IdPartener, ?, ?, 1, ?, ?, 1, 1, @IdAdresa, ?, @IdTipEntitate, 0, 0, 0, 0, 0, 0, 0, 0, NULL, 0, 0, 0, 0, 0, '', 0, 0);
            
            IF @@ERROR = 0
                SET @Rezultat = 0;
            ELSE
                SET @Rezultat = 1;
        END
        ELSE
            SET @Rezultat = 11;
            
        SELECT @Rezultat AS Rezultat, @IdPartener AS IdPartener;
        """
        
        params = (
            cod_partener,                              # Check if Cod exists
            data.get('nume'),                          # Check if Nume exists
            int(data.get('idOras')) if data.get('idOras') else None,  # IdOras
            strada_nume,                               # Strada
            numar_strada,                              # Numar
            bloc,                                      # Bloc
            scara,                                     # Scara
            apartament,                                # Ap
            telefon,                                   # TelefonMobil
            email,                                     # Email
            cod_partener,                              # Cod for partner
            data.get('nume'),                          # Nume for partner
            data.get('codFiscal') or None,             # CodFiscal
            data.get('reg_com') or None,               # NrRegCom
            1 if data.get('platitorTVA') else 0        # PlatitorTVA
        )
        
        print(f"Execut procedura cu parametrii: {params}")
        cursor.execute(sql, params)
        
        # Check if we got results before the error
        try:
            row = cursor.fetchone()
            rezultat = row[0] if row else -1
            id_partener = row[1] if row and len(row) > 1 else None
        except:
            rezultat = -1
            id_partener = None
        
        conn.commit()
        print(f"Procedura finalizată. Rezultat SQL: {rezultat}, IdPartener: {id_partener}")
        
        return jsonify({
            "cod": rezultat,
            "idPartener": id_partener
        })
        
    except pyodbc.Error as e:
        if conn:
            conn.rollback()
        sqlstate = e.args[0] if len(e.args) > 0 else "Unknown"
        errmsg = e.args[1] if len(e.args) > 1 else str(e)
        print(f"EROARE SQL: {sqlstate} - {errmsg}")
        return jsonify({"cod": -1, "eroare": f"SQL Error: {errmsg}"}), 500
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"EROARE PYTHON: {str(e)}")
        return jsonify({"cod": -1, "eroare": str(e)}), 500
        
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    print("Serverul PartnerAPI pornește pe portul 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)