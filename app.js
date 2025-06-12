// Ham Radio Station Simulator - JavaScript

class HamRadioApp {
    constructor() {
        this.currentFreq = 14074000; // 20m FT8
        this.currentBand = '20m';
        this.currentMode = 'FT8';
        this.pttActive = false;
        this.waterfallData = [];
        this.map = null;
        this.qsoLog = [];
        this.currentRoom = null;
        this.ft8Messages = [];
        this.config = {
            callsign: 'EA7HAM',
            name: '',
            qth: '',
            locator: ''
        };

        // Data from JSON
        this.bandsData = [
            {"banda": "160m", "inicio": 1810, "fin": 2000, "modos": ["CW", "SSB", "FT8"]},
            {"banda": "80m", "inicio": 3500, "fin": 3800, "modos": ["CW", "SSB", "FT8", "PSK31"]},
            {"banda": "40m", "inicio": 7000, "fin": 7300, "modos": ["CW", "SSB", "FT8", "PSK31"]},
            {"banda": "30m", "inicio": 10100, "fin": 10150, "modos": ["CW", "FT8", "PSK31"]},
            {"banda": "20m", "inicio": 14000, "fin": 14350, "modos": ["CW", "SSB", "FT8", "PSK31"]},
            {"banda": "17m", "inicio": 18068, "fin": 18168, "modos": ["CW", "SSB", "FT8"]},
            {"banda": "15m", "inicio": 21000, "fin": 21450, "modos": ["CW", "SSB", "FT8"]},
            {"banda": "12m", "inicio": 24890, "fin": 24990, "modos": ["CW", "SSB", "FT8"]},
            {"banda": "10m", "inicio": 28000, "fin": 29700, "modos": ["CW", "SSB", "FM", "FT8"]}
        ];

        this.repeatersData = [
            {"indicativo": "EB7RCH", "freq_tx": 145.775, "freq_rx": 145.175, "ctcss": 88.5, "ubicacion": "Huelva", "lat": 37.2614, "lon": -6.9447, "modo": "FM"},
            {"indicativo": "EA7RCY", "freq_tx": 145.750, "freq_rx": 145.150, "ctcss": 88.5, "ubicacion": "Sevilla", "lat": 37.3891, "lon": -5.9845, "modo": "FM"},
            {"indicativo": "EB7RCA", "freq_tx": 430.925, "freq_rx": 438.525, "ctcss": 88.5, "ubicacion": "Cádiz", "lat": 36.5298, "lon": -6.2923, "modo": "FM"},
            {"indicativo": "EA1RKV", "freq_tx": 145.600, "freq_rx": 145.000, "ctcss": 88.5, "ubicacion": "Madrid", "lat": 40.4168, "lon": -3.7038, "modo": "FM"},
            {"indicativo": "EB3RFN", "freq_tx": 145.750, "freq_rx": 145.150, "ctcss": 88.5, "ubicacion": "Barcelona", "lat": 41.3851, "lon": 2.1734, "modo": "FM"},
            {"indicativo": "EA5RKV", "freq_tx": 145.725, "freq_rx": 145.125, "ctcss": 88.5, "ubicacion": "Valencia", "lat": 39.4699, "lon": -0.3763, "modo": "FM"}
        ];

        this.ft8Frequencies = [
            {"banda": "80m", "frecuencia": 3573.0},
            {"banda": "40m", "frecuencia": 7074.0},
            {"banda": "30m", "frecuencia": 10136.0},
            {"banda": "20m", "frecuencia": 14074.0},
            {"banda": "17m", "frecuencia": 18100.0},
            {"banda": "15m", "frecuencia": 21074.0},
            {"banda": "12m", "frecuencia": 24915.0},
            {"banda": "10m", "frecuencia": 28074.0}
        ];

        this.demoMessages = [
            "CQ EA7ABC JN29",
            "EA7ABC DL1XYZ JO40",
            "DL1XYZ EA7ABC -12",
            "EA7ABC DL1XYZ R-15",
            "DL1XYZ EA7ABC RRR",
            "EA7ABC DL1XYZ 73",
            "CQ F1ABC JN18",
            "CQ CQ I2DEF JN45",
            "EA1GHI EA2JKL JN29"
        ];

        this.voipRooms = [
            {"nombre": "Sala HF España", "usuarios": 12, "descripcion": "Radioaficionados españoles"},
            {"nombre": "Emergency Net", "usuarios": 5, "descripcion": "Red de emergencias"},
            {"nombre": "DX Corner", "usuarios": 8, "descripcion": "Cazadores de DX"},
            {"nombre": "VHF/UHF Local", "usuarios": 15, "descripcion": "Repetidores locales"},
            {"nombre": "Digital Modes", "usuarios": 6, "descripcion": "Modos digitales"}
        ];

        this.init();
    }

    init() {
        this.loadConfig();
        this.setupEventListeners();
        this.startClock();
        this.initializeWaterfall();
        this.populateRepeaters();
        this.populateVoipRooms();
        this.populateFrequencyTable();
        this.startFT8Simulation();
        this.loadLogbook();
        this.updateDisplay();

        // Initialize theme
        this.initTheme();

        // Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('data:text/javascript;base64,c2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgZXZlbnQgPT4geyBldmVudC53YWl0VW50aWwoc2VsZi5za2lwV2FpdGluZygpKTsgfSk7IHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBldmVudCA9PiB7IGV2ZW50LnJlc3BvbmRXaXRoKGZldGNoKGV2ZW50LnJlcXVlc3QpLmNhdGNoKCgpID0+IG5ldyBSZXNwb25zZSgnT2ZmbGluZSBtb2RlJykpKTsgfSk7')
                .catch(err => console.log('SW registration failed'));
        }
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Band buttons
        document.querySelectorAll('.band-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeBand(e.target.dataset.band));
        });

        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeMode(e.target.dataset.mode));
        });

        // PTT button
        document.getElementById('pttButton').addEventListener('mousedown', () => this.startPTT());
        document.getElementById('pttButton').addEventListener('mouseup', () => this.stopPTT());
        document.getElementById('pttButton').addEventListener('mouseleave', () => this.stopPTT());

        // VFO knob
        this.setupKnob('vfoKnob', (value) => this.adjustFrequency(value));
        
        // Digital mode tabs
        document.querySelectorAll('.digital-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchDigitalMode(e.target.dataset.digital));
        });

        // Tool tabs
        document.querySelectorAll('.tool-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTool(e.target.dataset.tool));
        });

        // Forms
        document.getElementById('qsoForm').addEventListener('submit', (e) => this.saveQSO(e));
        document.getElementById('configForm').addEventListener('submit', (e) => this.saveConfig(e));

        // Antenna calculator
        document.getElementById('antennaFreq').addEventListener('input', (e) => this.calculateAntenna(e.target.value));

        // Coordinates converter
        document.getElementById('convertCoords').addEventListener('click', () => this.convertCoordinates());

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // FT8 band change
        document.getElementById('ft8Band').addEventListener('change', (e) => this.changeFT8Band(e.target.value));
    }

    switchTab(tabName) {
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update modules
        document.querySelectorAll('.module').forEach(module => module.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        // Initialize map when repeaters tab is selected
        if (tabName === 'repeaters' && !this.map) {
            this.initializeMap();
        }
    }

    changeBand(band) {
        this.currentBand = band;
        
        // Update UI
        document.querySelectorAll('.band-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-band="${band}"]`).classList.add('active');

        // Update frequency based on band
        const bandData = this.bandsData.find(b => b.banda === band);
        if (bandData) {
            // Set to middle of band or FT8 frequency if available
            const ft8Freq = this.ft8Frequencies.find(f => f.banda === band);
            if (ft8Freq && this.currentMode === 'FT8') {
                this.currentFreq = ft8Freq.frecuencia * 1000;
            } else {
                this.currentFreq = (bandData.inicio + bandData.fin) / 2 * 1000;
            }
        }

        this.updateDisplay();
        this.playButtonSound();
    }

    changeMode(mode) {
        this.currentMode = mode;
        
        // Update UI
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

        // Adjust frequency for FT8
        if (mode === 'FT8') {
            const ft8Freq = this.ft8Frequencies.find(f => f.banda === this.currentBand);
            if (ft8Freq) {
                this.currentFreq = ft8Freq.frecuencia * 1000;
            }
        }

        this.updateDisplay();
        this.playButtonSound();
    }

    adjustFrequency(delta) {
        const step = this.currentMode === 'CW' ? 10 : 100;
        this.currentFreq += delta * step;
        
        // Keep within band limits
        const bandData = this.bandsData.find(b => b.banda === this.currentBand);
        if (bandData) {
            this.currentFreq = Math.max(bandData.inicio * 1000, Math.min(bandData.fin * 1000, this.currentFreq));
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        // Update frequency display
        document.getElementById('frequency').textContent = (this.currentFreq / 1000).toFixed(3);
        document.getElementById('mode').textContent = this.currentMode;
        document.getElementById('band').textContent = this.currentBand;

        // Simulate S-meter
        const sMeter = document.getElementById('sMeter');
        const sValue = Math.random() * 60 + 20; // Random S-meter reading
        sMeter.style.width = `${sValue}%`;
    }

    setupKnob(knobId, callback) {
        const knob = document.getElementById(knobId);
        let isDragging = false;
        let lastAngle = 0;

        knob.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = knob.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            lastAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = knob.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            
            const deltaAngle = currentAngle - lastAngle;
            const delta = deltaAngle > 0 ? 1 : -1;
            
            callback(delta);
            
            // Update knob visual
            const pointer = knob.querySelector('.knob-pointer');
            const currentRotation = parseInt(knob.dataset.rotation || 0);
            const newRotation = currentRotation + delta * 10;
            knob.dataset.rotation = newRotation;
            pointer.style.transform = `translateX(-50%) rotate(${newRotation}deg)`;
            
            lastAngle = currentAngle;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    startPTT() {
        this.pttActive = true;
        document.getElementById('pttButton').classList.add('active');
        this.playPTTSound();
    }

    stopPTT() {
        this.pttActive = false;
        document.getElementById('pttButton').classList.remove('active');
    }

    initializeWaterfall() {
        const canvas = document.getElementById('waterfallCanvas');
        const ctx = canvas.getContext('2d');
        
        // Initialize waterfall data
        for (let i = 0; i < canvas.height; i++) {
            this.waterfallData[i] = new Uint8Array(canvas.width);
        }

        this.updateWaterfall();
    }

    updateWaterfall() {
        const canvas = document.getElementById('waterfallCanvas');
        const ctx = canvas.getContext('2d');
        
        // Shift data down
        for (let i = canvas.height - 1; i > 0; i--) {
            this.waterfallData[i] = new Uint8Array(this.waterfallData[i - 1]);
        }
        
        // Generate new line with simulated signals
        const newLine = new Uint8Array(canvas.width);
        for (let x = 0; x < canvas.width; x++) {
            // Background noise
            newLine[x] = Math.random() * 30;
            
            // Add some signals
            if (Math.random() < 0.02) {
                const signalWidth = 3;
                const signalStrength = 100 + Math.random() * 155;
                for (let i = 0; i < signalWidth && x + i < canvas.width; i++) {
                    newLine[x + i] = Math.max(newLine[x + i], signalStrength);
                }
            }
        }
        this.waterfallData[0] = newLine;
        
        // Draw waterfall
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                const intensity = this.waterfallData[y][x];
                
                // Color mapping (blue->green->yellow->red)
                if (intensity < 64) {
                    imageData.data[index] = 0;
                    imageData.data[index + 1] = 0;
                    imageData.data[index + 2] = intensity * 4;
                } else if (intensity < 128) {
                    imageData.data[index] = 0;
                    imageData.data[index + 1] = (intensity - 64) * 4;
                    imageData.data[index + 2] = 255 - (intensity - 64) * 4;
                } else if (intensity < 192) {
                    imageData.data[index] = (intensity - 128) * 4;
                    imageData.data[index + 1] = 255;
                    imageData.data[index + 2] = 0;
                } else {
                    imageData.data[index] = 255;
                    imageData.data[index + 1] = 255 - (intensity - 192) * 4;
                    imageData.data[index + 2] = 0;
                }
                imageData.data[index + 3] = 255; // Alpha
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Continue animation
        setTimeout(() => this.updateWaterfall(), 100);
    }

    startFT8Simulation() {
        this.updateFT8Time();
        this.generateFT8Messages();
        
        setInterval(() => {
            this.updateFT8Time();
            if (new Date().getSeconds() % 15 === 0) {
                this.generateFT8Messages();
            }
        }, 1000);
    }

    updateFT8Time() {
        const now = new Date();
        const minutes = now.getUTCMinutes().toString().padStart(2, '0');
        const seconds = now.getUTCSeconds().toString().padStart(2, '0');
        document.getElementById('ft8Time').textContent = `${minutes}:${seconds}`;
    }

    generateFT8Messages() {
        const messagesContainer = document.getElementById('ft8Messages');
        const now = new Date();
        const timeStr = now.toISOString().substr(11, 5);
        
        // Add 1-3 random messages
        const numMessages = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numMessages; i++) {
            const message = this.demoMessages[Math.floor(Math.random() * this.demoMessages.length)];
            const db = -25 + Math.random() * 30;
            const dt = (Math.random() - 0.5) * 2;
            const freq = 1000 + Math.random() * 2000;
            
            const messageElement = document.createElement('div');
            messageElement.className = 'ft8-message';
            messageElement.innerHTML = `
                <span>${timeStr}</span>
                <span>${db.toFixed(0)}</span>
                <span>${dt.toFixed(1)}</span>
                <span>${freq.toFixed(0)}</span>
                <span>${message}</span>
            `;
            
            messagesContainer.appendChild(messageElement);
            
            // Keep only last 20 messages
            while (messagesContainer.children.length > 21) { // +1 for header
                messagesContainer.removeChild(messagesContainer.children[1]);
            }
            
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    switchDigitalMode(mode) {
        document.querySelectorAll('.digital-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-digital="${mode}"]`).classList.add('active');
        
        document.querySelectorAll('.digital-mode').forEach(content => content.classList.remove('active'));
        document.getElementById(`${mode}-content`).classList.add('active');
    }

    changeFT8Band(band) {
        const ft8Freq = this.ft8Frequencies.find(f => f.banda === band);
        if (ft8Freq) {
            this.currentFreq = ft8Freq.frecuencia * 1000;
            this.currentBand = band;
            this.updateDisplay();
        }
    }

    initializeMap() {
        this.map = L.map('map').setView([40.4168, -3.7038], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add repeater markers
        this.repeatersData.forEach(repeater => {
            const marker = L.marker([repeater.lat, repeater.lon]).addTo(this.map);
            marker.bindPopup(`
                <strong>${repeater.indicativo}</strong><br>
                TX: ${repeater.freq_tx} MHz<br>
                RX: ${repeater.freq_rx} MHz<br>
                CTCSS: ${repeater.ctcss} Hz<br>
                ${repeater.ubicacion}
            `);
        });
    }

    populateRepeaters() {
        const repeaterList = document.getElementById('repeaterList');
        
        this.repeatersData.forEach(repeater => {
            const repeaterElement = document.createElement('div');
            repeaterElement.className = 'repeater-item';
            repeaterElement.innerHTML = `
                <div class="repeater-call">${repeater.indicativo}</div>
                <div class="repeater-freq">TX: ${repeater.freq_tx} MHz</div>
                <div class="repeater-freq">RX: ${repeater.freq_rx} MHz</div>
                <div class="repeater-location">${repeater.ubicacion}</div>
            `;
            
            repeaterElement.addEventListener('click', () => {
                if (this.map) {
                    this.map.setView([repeater.lat, repeater.lon], 10);
                }
            });
            
            repeaterList.appendChild(repeaterElement);
        });
    }

    populateVoipRooms() {
        const roomList = document.getElementById('roomList');
        
        this.voipRooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.innerHTML = `
                <div class="room-name">${room.nombre}</div>
                <div class="room-users">${room.usuarios} usuarios</div>
                <div class="room-desc">${room.descripcion}</div>
            `;
            
            roomElement.addEventListener('click', () => {
                this.joinRoom(room);
            });
            
            roomList.appendChild(roomElement);
        });
    }

    joinRoom(room) {
        this.currentRoom = room;
        document.querySelectorAll('.room-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // Update connected users
        this.updateConnectedUsers(room);
    }

    updateConnectedUsers(room) {
        const userList = document.querySelector('#connectedUsers .user-list');
        userList.innerHTML = '';
        
        // Generate fake user list
        const users = ['EA1ABC', 'EA3XYZ', 'F1DEF', 'DL1GHI'];
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.textContent = user;
            userElement.className = 'user-item';
            userList.appendChild(userElement);
        });
    }

    saveQSO(event) {
        event.preventDefault();
        
        const qso = {
            callsign: document.getElementById('callsign').value,
            datetime: document.getElementById('qsoDateTime').value,
            frequency: document.getElementById('qsoFreq').value,
            mode: document.getElementById('qsoMode').value,
            rstTx: document.getElementById('rstTx').value,
            rstRx: document.getElementById('rstRx').value,
            name: document.getElementById('qsoName').value,
            qth: document.getElementById('qsoQth').value,
            comments: document.getElementById('qsoComments').value,
            id: Date.now()
        };
        
        this.qsoLog.push(qso);
        this.saveLogbook();
        this.updateLogbookDisplay();
        
        // Reset form
        document.getElementById('qsoForm').reset();
        document.getElementById('qsoDateTime').value = new Date().toISOString().slice(0, 16);
        document.getElementById('qsoFreq').value = this.currentFreq / 1000;
        document.getElementById('qsoMode').value = this.currentMode;
    }

    updateLogbookDisplay() {
        // Update stats
        const stats = document.getElementById('logbookStats');
        const countries = new Set(this.qsoLog.map(qso => qso.callsign.match(/^[A-Z0-9]+/)[0])).size;
        const bands = new Set(this.qsoLog.map(qso => this.getFrequencyBand(qso.frequency))).size;
        
        stats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${this.qsoLog.length}</span>
                <span class="stat-label">QSOs Total</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${countries}</span>
                <span class="stat-label">Países</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${bands}</span>
                <span class="stat-label">Bandas</span>
            </div>
        `;
        
        // Update table
        const table = document.getElementById('logbookTable');
        table.innerHTML = `
            <table class="logbook-table-content">
                <thead>
                    <tr>
                        <th>Indicativo</th>
                        <th>Fecha/Hora</th>
                        <th>Freq</th>
                        <th>Modo</th>
                        <th>RST</th>
                        <th>Nombre</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.qsoLog.slice(-10).reverse().map(qso => `
                        <tr>
                            <td>${qso.callsign}</td>
                            <td>${new Date(qso.datetime).toLocaleDateString()}</td>
                            <td>${qso.frequency}</td>
                            <td>${qso.mode}</td>
                            <td>${qso.rstTx}/${qso.rstRx}</td>
                            <td>${qso.name}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    getFrequencyBand(freq) {
        const freqKhz = parseFloat(freq);
        for (const band of this.bandsData) {
            if (freqKhz >= band.inicio && freqKhz <= band.fin) {
                return band.banda;
            }
        }
        return 'Unknown';
    }

    switchTool(tool) {
        document.querySelectorAll('.tool-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-tool="${tool}"]`).classList.add('active');
        
        document.querySelectorAll('.tool').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tool}-tool`).classList.add('active');
    }

    calculateAntenna(frequency) {
        if (!frequency) return;
        
        const freq = parseFloat(frequency);
        const wavelength = 300 / freq; // meters
        const quarterWave = wavelength / 4;
        const halfWave = wavelength / 2;
        const fullWave = wavelength;
        
        document.getElementById('antennaResults').innerHTML = `
            <h4>Resultados para ${freq} MHz:</h4>
            <p><strong>Longitud de onda completa:</strong> ${fullWave.toFixed(2)} m</p>
            <p><strong>Media onda (dipolo):</strong> ${halfWave.toFixed(2)} m</p>
            <p><strong>Cuarto de onda (vertical):</strong> ${quarterWave.toFixed(2)} m</p>
            <p><strong>5/8 de onda:</strong> ${(wavelength * 5/8).toFixed(2)} m</p>
        `;
    }

    convertCoordinates() {
        const lat = parseFloat(document.getElementById('latitude').value);
        const lon = parseFloat(document.getElementById('longitude').value);
        
        if (isNaN(lat) || isNaN(lon)) return;
        
        const locator = this.toMaidenhead(lat, lon);
        document.getElementById('coordsResult').innerHTML = `
            <h4>Resultado:</h4>
            <p><strong>Maidenhead Locator:</strong> ${locator}</p>
        `;
    }

    toMaidenhead(lat, lon) {
        const A = Math.floor((lon + 180) / 20);
        const B = Math.floor((lat + 90) / 10);
        const C = Math.floor(((lon + 180) % 20) / 2);
        const D = Math.floor((lat + 90) % 10);
        const E = Math.floor(((lon + 180) - A * 20 - C * 2) * 12);
        const F = Math.floor(((lat + 90) - B * 10 - D) * 24);
        
        return String.fromCharCode(65 + A) + String.fromCharCode(65 + B) + 
               C.toString() + D.toString() + 
               String.fromCharCode(97 + E) + String.fromCharCode(97 + F);
    }

    populateFrequencyTable() {
        const table = document.getElementById('frequencyTable');
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Banda</th>
                        <th>Inicio (kHz)</th>
                        <th>Fin (kHz)</th>
                        <th>Modos</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.bandsData.map(band => `
                        <tr>
                            <td>${band.banda}</td>
                            <td>${band.inicio}</td>
                            <td>${band.fin}</td>
                            <td>${band.modos.join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    saveConfig(event) {
        event.preventDefault();
        
        this.config = {
            callsign: document.getElementById('stationCall').value,
            name: document.getElementById('stationName').value,
            qth: document.getElementById('stationQth').value,
            locator: document.getElementById('stationLocator').value
        };
        
        localStorage.setItem('hamRadioConfig', JSON.stringify(this.config));
        
        // Update header with new callsign
        document.querySelector('.station-info h1').textContent = this.config.callsign;
        
        alert('Configuración guardada correctamente');
    }

    loadConfig() {
        const saved = localStorage.getItem('hamRadioConfig');
        if (saved) {
            this.config = JSON.parse(saved);
            document.getElementById('stationCall').value = this.config.callsign;
            document.getElementById('stationName').value = this.config.name;
            document.getElementById('stationQth').value = this.config.qth;
            document.getElementById('stationLocator').value = this.config.locator;
            document.querySelector('.station-info h1').textContent = this.config.callsign;
        }
        
        // Set current datetime for QSO form
        document.getElementById('qsoDateTime').value = new Date().toISOString().slice(0, 16);
        document.getElementById('qsoFreq').value = this.currentFreq / 1000;
        document.getElementById('qsoMode').value = this.currentMode;
    }

    saveLogbook() {
        localStorage.setItem('hamRadioLogbook', JSON.stringify(this.qsoLog));
    }

    loadLogbook() {
        const saved = localStorage.getItem('hamRadioLogbook');
        if (saved) {
            this.qsoLog = JSON.parse(saved);
            this.updateLogbookDisplay();
        }
    }

    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const utcTime = now.toISOString().substr(11, 8) + ' UTC';
        document.getElementById('utcTime').textContent = utcTime;
    }

    initTheme() {
        const savedTheme = localStorage.getItem('hamRadioTheme') || 'dark';
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        localStorage.setItem('hamRadioTheme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    updateThemeToggle(theme) {
        const toggle = document.getElementById('themeToggle');
        toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    playButtonSound() {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    playPTTSound() {
        // Create PTT activation sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hamRadioApp = new HamRadioApp();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.type === 'text' || e.target.type === 'textarea') return;
    
    switch(e.key) {
        case ' ':
            e.preventDefault();
            if (window.hamRadioApp) {
                if (window.hamRadioApp.pttActive) {
                    window.hamRadioApp.stopPTT();
                } else {
                    window.hamRadioApp.startPTT();
                }
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (window.hamRadioApp) {
                window.hamRadioApp.adjustFrequency(1);
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (window.hamRadioApp) {
                window.hamRadioApp.adjustFrequency(-1);
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === ' ' && window.hamRadioApp && window.hamRadioApp.pttActive) {
        window.hamRadioApp.stopPTT();
    }
});
