Partner Management System (Sistem Gestiune Parteneri)

A modern web application for managing business partners (physical persons) with integration to SQL Server database. Built for Romanian businesses with ANAF compliance.

Features

- Modern, responsive UI with gradient design
- Physical person (individual) partner creation
- Integration with Romanian tax authority (ANAF) requirements
- City autocomplete from comprehensive Romanian cities database
- CNP (Romanian personal identification number) validation
- Complete address management (street, number, building, staircase, floor, apartment)
- Contact information (phone, email)
- Duplicate partner detection
- Direct SQL Server integration

Tech Stack

**Frontend:**
- HTML5
- CSS3 (Modern gradient design, animations)
- Vanilla JavaScript (ES6+)

**Backend:**
- Python 3.x
- Flask
- pyodbc (SQL Server connector)
- Flask-CORS

**Database:**
- Microsoft SQL Server

Prerequisites

- Python 3.7+
- Microsoft SQL Server
- SQL Server ODBC Driver
- Flask and dependencies

Installation

1. **Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/partner-management-system.git
cd partner-management-system
```

2. **Install Python dependencies:**
```bash
pip install flask flask-cors pyodbc
```

3. **Configure database connection:**

Edit `app.py` and update the connection string:
```python
conn_str = (
    "Driver={SQL Server};"
    "Server=YOUR_SERVER;" 
    "Database=YOUR_DATABASE;"
    "Trusted_Connection=yes;"
)
```

4. **Ensure you have the required database tables:**
- `Partener` - Main partner table
- `Adresa` - Address table
- `DictionarDetaliu` - Dictionary for entity types
- `Oras` - Cities table

Running the Application

1. **Start the Flask backend:**
```bash
python app.py
```

The server will start on `http://localhost:5000`

2. **Open the frontend:**

Open `index.html` in your browser or use a local server:
```bash
# Using Python's built-in server
python -m http.server 8000
# Then navigate to http://localhost:8000
```

3. **Access the application:**
- Landing page: `http://localhost:8000/index.html`
- Physical person form: `http://localhost:8000/formular_pf.html`

Project Structure
```
partner-management-system/
├── index.html              # Landing page
├── formular_pf.html        # Physical person form
├── style_landing.css       # Landing page styles
├── style.css               # Form styles
├── script.js               # Landing page scripts
├── script_pf.js            # Form validation & submission
├── orase.json              # Romanian cities database
├── app.py                  # Flask backend
├── img/
│   └── minifarm-logo.png   # Company logo
└── README.md
```

Usage

1. Navigate to the landing page
2. Click "Persoană Fizică" to create a physical person partner
3. Fill in the required fields:
   - Full Name (required)
   - CNP (optional, validated if provided)
   - ID Card Series & Number (optional)
   - City (required, autocomplete)
   - Street & Number (required)
   - Building details (optional)
   - Contact info (optional)
4. Submit the form
5. The partner is created in the SQL Server database

Features in Detail

### CNP Validation
- Real-time validation of Romanian CNP
- Visual feedback (green/red border)
- Validates check digit algorithm

### City Autocomplete
- Search by city name or county
- Keyboard navigation (arrow keys, Enter, Escape)
- Mouse hover support
- Prevents manual entry (must select from list)

### Address Management
- Separate fields for complete Romanian addresses
- All address components stored separately for ANAF compliance

### Duplicate Prevention
- Checks for existing partner by name
- Checks for existing partner code
- Returns appropriate error messages

 Security

- Input sanitization for SQL injection prevention
- Character restrictions on name field
- CNP format validation
- Server-side validation

 API Endpoints

### POST `/adauga-partener`
Create a new partner

**Request body:**
```json
{
  "id": "EXT123456",
  "nume": "POPESCU ION",
  "codFiscal": "1234567890123",
  "reg_com": "CT123456",
  "platitorTVA": false,
  "idOras": 228,
  "strada": "CALEA VICTORIEI",
  "numar_strada": "12A",
  "bloc": "A1",
  "scara": "B",
  "etaj": "3",
  "apartament": "15",
  "telefon": "0740123456",
  "email": "ion@example.com"
}
```

**Response:**
```json
{
  "cod": 0,
  "idPartener": 12345
}
```

**Response codes:**
- `0` - Success
- `1` - Insert failed
- `3` - Partner code already exists
- `4` - Partner name already exists
- `11` - Address creation failed

 Known Issues

- Legal entity (Persoană Juridică) form not yet implemented
- `spNewTableId` stored procedure has ID collision issues (workaround implemented)

 Future Enhancements

- [ ] Legal entity form
- [ ] Partner editing functionality
- [ ] Partner search/list view
- [ ] Export to Excel
- [ ] Document upload for partners
- [ ] Partner categorization
- [ ] Advanced filtering

 Author

**Your Name**
- GitHub: [@MafteiMarius](https://github.com/MafteiMarius)
- LinkedIn: [Maftei Marius](https://www.linkedin.com/in/marius-maftei-48490b196/)

 License

This project is licensed under the MIT License - see the LICENSE file for details.

 Acknowledgments

- Built for compliance with Romanian ANAF regulations
- Uses BizPharma database structure
- City data includes all Romanian localities
---

**Note:** This system is designed for Romanian businesses and includes Romania-specific validation and data structures.
```

## **Step 3: Create LICENSE file**

**Create `LICENSE`:**
```
MIT License

Copyright (c) 2026 MafteiMarius

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
