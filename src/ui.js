/* src/ui.js */

import {
    getState,
    updateGeneralInfo,
    setActivePage,
    addCategory,
    updateCategoryTitle,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    exportState,
    importState,
    resetState,
    toggleColumnCollapse,
    updateCustomBackground, // ΝΕΟ
} from './state.js';

// Elements της αρχικής σελίδας
const editorPanel = document.getElementById('editor-panel');
const previewPanel = document.getElementById('preview-panel');

// Μεταβλητές για τη διατήρηση της κατάστασης του cursor και του scroll κατά το render
let activeElementId = null;
let cursorPosition = 0;
let savedScrollTop = 0;

/**
 * Αποθηκεύει το ποιο input είναι ενεργό, πού βρίσκεται ο κέρσορας και τη θέση κύλισης
 */
function saveFocus() {
    const active = document.activeElement;
    if (active && active.id) {
        activeElementId = active.id;
        cursorPosition = active.selectionStart || 0;
    } else {
        activeElementId = null;
    }
    
    if (editorPanel) {
        savedScrollTop = editorPanel.scrollTop;
    }
}

/**
 * Επαναφέρει την εστίαση, τη θέση του κέρσορα και τη θέση κύλισης του sidebar
 */
function restoreFocus() {
    if (editorPanel) {
        editorPanel.scrollTop = savedScrollTop;
    }

    if (activeElementId) {
        const el = document.getElementById(activeElementId);
        if (el) {
            el.focus({ preventScroll: true });
            
            if (el.setSelectionRange && (el.type === 'text' || el.type === 'textarea')) {
                el.setSelectionRange(cursorPosition, cursorPosition);
            }
        }
    }
}

/**
 * Αρχικοποίηση Event Listeners (Event Delegation)
 */
export function initUI() {
    // 1. Listeners για πληκτρολόγηση (input)
    editorPanel.addEventListener('input', (e) => {
        const target = e.target;
        const action = target.dataset.action;
        const state = getState();
        const pageNum = state.activePage;

        if (action === 'general-input') {
            const key = target.dataset.key;
            updateGeneralInfo({ [key]: target.value });
        } else if (action === 'category-input') {
            const column = target.dataset.column;
            const catIndex = parseInt(target.dataset.index);
            updateCategoryTitle(pageNum, column, catIndex, target.value);
        } else if (action === 'item-input') {
            const column = target.dataset.column;
            const catIndex = parseInt(target.dataset.cat);
            const itemIndex = parseInt(target.dataset.item);
            const key = target.dataset.key;
            updateItem(pageNum, column, catIndex, itemIndex, { [key]: target.value });
        }
    });

    // 2. Listeners για κλικ (Buttons & Tabs)
    editorPanel.addEventListener('click', (e) => {
        const target = e.target.closest('[data-click-action]');
        if (!target) return;

        const action = target.dataset.clickAction;
        const state = getState();
        const pageNum = state.activePage;
        const column = target.dataset.column;
        const catIndex = parseInt(target.dataset.cat);
        const itemIndex = parseInt(target.dataset.item);

        switch (action) {
            case 'switch-tab':
                const tabNum = parseInt(target.dataset.tab);
                setActivePage(tabNum);
                break;
            case 'add-category':
                addCategory(pageNum, column);
                break;
            case 'delete-category':
                if (confirm('Θέλετε σίγουρα να διαγράψετε αυτή την κατηγορία και όλα τα προϊόντα της;')) {
                    deleteCategory(pageNum, column, catIndex);
                }
                break;
            case 'add-item':
                addItem(pageNum, column, catIndex);
                break;
            case 'delete-item':
                deleteItem(pageNum, column, catIndex, itemIndex);
                break;
            case 'move-item-up':
                moveItem(pageNum, column, catIndex, itemIndex, 'up');
                break;
            case 'move-item-down':
                moveItem(pageNum, column, catIndex, itemIndex, 'down');
                break;
            case 'toggle-column-collapse':
                toggleColumnCollapse(column);
                break;
            case 'trigger-print': // ΔΙΟΡΘΩΣΗ ΓΙΑ DIRECT PDF SAVE
                // Έλεγχος αν τρέχουμε σε Electron για απευθείας άνοιγμα του Save Dialog
                if (window.require) {
                    const { ipcRenderer } = window.require('electron');
                    ipcRenderer.send('print-to-pdf');
                } else {
                    window.print(); // Fallback αν ποτέ τρέξει σε απλό browser
                }
                break;             
            case 'trigger-reset':
                if (confirm('Προσοχή: Αυτή η ενέργεια θα διαγράψει όλες τις αλλαγές σας και θα επαναφέρει τον αρχικό κατάλογο. Θέλετε να συνεχίσετε;')) {
                    resetState();
                }
                break;
            case 'trigger-export':
                downloadBackup();
                break;
            case 'trigger-import':
                document.getElementById('file-import-input').click();
                break;
            case 'trigger-bg-upload': // ΝΕΟ
                document.getElementById('file-bg-input').click();
                break;
            case 'trigger-bg-remove': // ΝΕΟ
                if (confirm('Θέλετε να επαναφέρετε το προεπιλεγμένο φόντο του καταλόγου;')) {
                    try {
                        updateCustomBackground(null);
                    } catch (err) {
                        alert('Σφάλμα κατά την επαναφορά του φόντου.');
                    }
                }
                break;
        }
    });

    // 3. Listener για εισαγωγή αρχείου backup (JSON) & επιλογής φόντου
    editorPanel.addEventListener('change', (e) => {
        if (e.target.id === 'file-import-input') {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = importState(event.target.result);
                if (success) {
                    alert('Η εισαγωγή των δεδομένων έγινε με επιτυχία!');
                } else {
                    alert('Σφάλμα: Το αρχείο δεν είναι έγκυρος κατάλογος.');
                }
            };
            reader.readAsText(file);
        }

        // ΝΕΟ: Διαχείριση επιλογής εικόνας φόντου
        if (e.target.id === 'file-bg-input') {
            const file = e.target.files[0];
            if (!file) return;

            // Προληπτικός έλεγχος μεγέθους: 2MB όριο (2 * 1024 * 1024 bytes)
            const MAX_SIZE = 2 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                alert('Η εικόνα που επιλέξατε είναι πολύ μεγάλη. Παρακαλούμε επιλέξτε μια εικόνα μικρότερη από 2MB.');
                e.target.value = ''; // Reset του input
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    updateCustomBackground(event.target.result);
                } catch (error) {
                    alert('Αδυναμία αποθήκευσης. Ο χώρος αποθήκευσης της εφαρμογής έχει εξαντληθεί. Δοκιμάστε να ανεβάσετε μια εικόνα με χαμηλότερη ανάλυση ή μικρότερο μέγεθος αρχείου.');
                }
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Κατεβάζει το αρχείο backup (JSON) στον υπολογιστή
 */
function downloadBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportState());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "backup_timokatalogos_gianna.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

/**
 * Σχεδιάζει ολόκληρη την οθόνη (Editor & Preview)
 */
export function render(state) {
    saveFocus();

    // 1. Σχεδίαση της αριστερής φόρμας
    editorPanel.innerHTML = buildEditorHTML(state);

    // 2. Σχεδίαση της δεξιάς σελίδας Α4
    previewPanel.innerHTML = buildPreviewHTML(state);

    // 3. Έλεγχος για υπερχείλιση περιεχομένου
    checkOverflow();

    restoreFocus();
}

/* ==========================================
   HTML BUILDERS (TEMPLATES)
   ========================================== */

function buildEditorHTML(state) {
    const gen = state.general;
    const pageNum = state.activePage;
    const pageKey = `page${pageNum}`;
    const pageData = state[pageKey];

    return `
        <div class="editor-header">
            <h2>Διαχείριση Καταλόγου</h2>
        </div>

        <!-- Banner Προειδοποίησης Υπερχείλισης -->
        <div id="overflow-warning" class="overflow-warning-banner">
            ⚠️ <span id="overflow-warning-text">Προσοχή!</span>
        </div>

        <!-- Καρτέλες (Tabs) -->
        <div class="tabs-container">
            <button class="tab-btn ${pageNum === 1 ? 'active' : ''}" data-click-action="switch-tab" data-tab="1">
                Σελίδα 1: Ροφήματα
            </button>
            <button class="tab-btn ${pageNum === 2 ? 'active' : ''}" data-click-action="switch-tab" data-tab="2">
                Σελίδα 2: Ποτά & Μεζέδες
            </button>
            <button class="tab-btn ${pageNum === 3 ? 'active' : ''}" data-click-action="switch-tab" data-tab="3">
                Σελίδα 3: Γλυκά & Specials
            </button>
        </div>

        <!-- Γενικά Στοιχεία -->
        <div class="form-group">
            <label for="input-general-storeName">Όνομα Καταστήματος</label>
            <input type="text" id="input-general-storeName" value="${gen.storeName || ''}" data-action="general-input" data-key="storeName">
        </div>
        <div class="form-group">
            <label for="input-general-subtitle">Τοποθεσία / Υπότιτλος</label>
            <input type="text" id="input-general-subtitle" value="${gen.subtitle || ''}" data-action="general-input" data-key="subtitle">
        </div>
        <div class="form-group">
            <label for="input-general-phone">Τηλέφωνο</label>
            <input type="text" id="input-general-phone" value="${gen.phone || ''}" data-action="general-input" data-key="phone">
        </div>
        <div class="form-group">
            <label for="input-general-wifiName">Όνομα WiFi</label>
            <input type="text" id="input-general-wifiName" value="${gen.wifiName || ''}" data-action="general-input" data-key="wifiName">
        </div>
        <div class="form-group">
            <label for="input-general-wifiPass">Κωδικός WiFi</label>
            <input type="text" id="input-general-wifiPass" value="${gen.wifiPass || ''}" data-action="general-input" data-key="wifiPass">
        </div>
        <!-- ΝΕΟ: Πεδίο εισαγωγής για το μήνυμα αλλεργιών <-- ΠΡΟΣΘΗΚΗ -->
        <div class="form-group">
            <label for="input-general-allergyText">Μήνυμα Αλλεργιών (Κάτω μέρος Α4)</label>
            <input type="text" id="input-general-allergyText" value="${gen.allergyText || ''}" data-action="general-input" data-key="allergyText">
        </div>

        <!-- Προσαρμοσμένη Εικόνα Φόντου (A4) - ΝΕΟ -->
        <div class="form-group">
            <label>Προσαρμοσμένη Εικόνα Φόντου (A4)</label>
            <div style="display: flex; gap: 5px; align-items: center; margin-top: 5px;">
                <button class="btn btn-secondary" style="flex: 1; padding: 8px;" data-click-action="trigger-bg-upload">
                    📂 Επιλογή Εικόνας
                </button>
                ${gen.customBackground ? `
                    <button class="btn btn-danger" style="padding: 8px 12px;" data-click-action="trigger-bg-remove">
                        🗑️ Κατάργηση
                    </button>
                ` : ''}
            </div>
            <!-- Κρυφό input για την επιλογή αρχείου φόντου -->
            <input type="file" id="file-bg-input" accept="image/*" style="display: none;">
        </div>

        <!-- Διαχείριση Αριστερής Στήλης του Καταλόγου -->
        <div class="column-section">
            <h3 class="collapsible-header" data-click-action="toggle-column-collapse" data-column="leftColumn">
                <span class="collapse-arrow">${state.leftColCollapsed ? '►' : '▼'}</span>
                Αριστερή Στήλη Καταλόγου
            </h3>
            <div class="column-content" style="${state.leftColCollapsed ? 'display: none;' : ''}">
                ${buildColumnEditorHTML(pageData.leftColumn, 'leftColumn', pageNum)}
                <button class="btn btn-secondary btn-add-category" data-click-action="add-category" data-column="leftColumn">
                    + Προσθήκη Κατηγορίας Αριστερά
                </button>
            </div>
        </div>

        <!-- Διαχείριση Δεξιάς Στήλης του Καταλόγου -->
        <div class="column-section">
            <h3 class="collapsible-header" data-click-action="toggle-column-collapse" data-column="rightColumn">
                <span class="collapse-arrow">${state.rightColCollapsed ? '►' : '▼'}</span>
                Δεξιά Στήλη Καταλόγου
            </h3>
            <div class="column-content" style="${state.rightColCollapsed ? 'display: none;' : ''}">
                ${buildColumnEditorHTML(pageData.rightColumn, 'rightColumn', pageNum)}
                <button class="btn btn-secondary btn-add-category" data-click-action="add-category" data-column="rightColumn">
                    + Προσθήκη Κατηγορίας Δεξιά
                </button>
            </div>
        </div>

        <!-- Ενέργειες (Εκτύπωση & Backup) -->
        <div class="actions-container">
            <button class="btn btn-primary btn-print" data-click-action="trigger-print">
                🖨️ Εκτύπωση σε PDF (A4)
            </button>
            <div style="display: flex; gap: 5px;">
                <button class="btn btn-secondary" style="flex: 1;" data-click-action="trigger-export">💾 Backup</button>
                <button class="btn btn-secondary" style="flex: 1;" data-click-action="trigger-import">📂 Εισαγωγή</button>
            </div>
            <button class="btn btn-danger" data-click-action="trigger-reset">🔄 Επαναφορά Καταλόγου</button>
            
            <!-- Κρυφό input για εισαγωγή JSON αρχείου -->
            <input type="file" id="file-import-input" accept=".json" style="display: none;">
        </div>
    `;
}

function buildColumnEditorHTML(columnData, columnName, pageNum) {
    if (!columnData || columnData.length === 0) {
        return `<p style="font-size:0.85rem; color:#888; font-style:italic; margin-bottom:15px;">Δεν υπάρχουν κατηγορίες.</p>`;
    }

    return columnData.map((category, catIndex) => `
        <div class="category-block">
            <div class="category-header">
                <input type="text" id="input-category-${columnName}-${catIndex}" value="${category.title}" 
                       data-action="category-input" data-column="${columnName}" data-index="${catIndex}" 
                       style="font-weight:bold; background-color:#1f1f1f; border:1px solid #555; padding:4px 8px; color:#fff; width:70%;">
                <button class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem;" 
                        data-click-action="delete-category" data-column="${columnName}" data-cat="${catIndex}">
                    Διαγραφή
                </button>
            </div>

            <!-- Λίστα Προϊόντων Κατηγορίας -->
            <div class="items-list">
                ${category.items.map((item, itemIndex) => `
                    <div class="item-row-editor">
                        <input type="text" id="input-item-${columnName}-${catIndex}-${itemIndex}-name" class="item-name-input" value="${item.name}" placeholder="Όνομα"
                               data-action="item-input" data-column="${columnName}" data-cat="${catIndex}" data-item="${itemIndex}" data-key="name">
                        <input type="text" id="input-item-${columnName}-${catIndex}-${itemIndex}-desc" class="item-desc-input" value="${item.desc}" placeholder="Περιγραφή"
                               data-action="item-input" data-column="${columnName}" data-cat="${catIndex}" data-item="${itemIndex}" data-key="desc">
                        <input type="text" id="input-item-${columnName}-${catIndex}-${itemIndex}-price" class="item-price-input" value="${item.price}" placeholder="Τιμή"
                               data-action="item-input" data-column="${columnName}" data-cat="${catIndex}" data-item="${itemIndex}" data-key="price">
                        
                        <!-- Βελάκια σειράς & Διαγραφή -->
                        <button class="btn btn-secondary" style="padding:3px 6px; font-size:0.7rem;" 
                                data-click-action="move-item-up" data-column="${columnName}" data-cat="${catIndex}" data-item="${itemIndex}">▲</button>
                        <button class="btn btn-secondary" style="padding:3px 6px; font-size:0.7rem;" 
                                data-click-action="move-item-down" data-column="${columnName}" data-cat="${catIndex}" data-item="${itemIndex}">▼</button>
                        <button class="btn btn-danger" style="padding:3px 6px; font-size:0.7rem;" 
                                data-click-action="delete-item" data-column="${columnName}" data-cat="${catIndex}" data-item="${itemIndex}">X</button>
                    </div>
                `).join('')}
            </div>

            <button class="btn btn-secondary btn-add-item" data-click-action="add-item" data-column="${columnName}" data-cat="${catIndex}">
                + Προσθήκη Προϊόντος
            </button>
        </div>
    `).join('');
}

function buildPreviewHTML(state) {
    const gen = state.general;
    const activePage = state.activePage;

    // Δημιουργία των στοιχείων επικοινωνίας
    const contactItems = [];
    if (gen.phone) contactItems.push(`Τηλ: <strong>${gen.phone}</strong>`);
    if (gen.wifiName) contactItems.push(`WiFi: <strong>${gen.wifiName}</strong>`);
    if (gen.wifiPass) contactItems.push(`Pass: <strong>${gen.wifiPass}</strong>`);
    
    const contactRowHTML = contactItems.length > 0 
        ? `<div class="menu-contact-row">${contactItems.join(' &nbsp;•&nbsp; ')}</div>` 
        : '';

    // Παράγουμε το HTML και για τις 3 σελίδες στη σειρά
    let fullHTML = '';
    
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
        const pageKey = `page${pageNum}`;
        const pageData = state[pageKey];
        const isActive = pageNum === activePage;

        // ΝΕΟ: Εφαρμογή δυναμικής εικόνας αν έχει οριστεί custom φόντο
        const bgStyle = gen.customBackground 
            ? `style="background-image: url('${gen.customBackground}') !important;"` 
            : '';

        fullHTML += `
            <div class="a4-page ${isActive ? 'active-page' : ''}" ${bgStyle}>
                <!-- Κεφαλίδα -->
                <header class="menu-header">
                    <div class="header-main-title">${gen.storeName.replace('Καφενείο', '').replace('καφενείο', '').trim()}</div>
                    
                    <div class="header-divider">
                        <svg viewBox="0 0 800 100" width="300" height="38" xmlns="http://www.w3.org/2000/svg">
                            <!-- Αριστερή Οριζόντια Γραμμή -->
                            <line x1="50" y1="50" x2="330" y2="50" stroke="#1c3322" stroke-width="1.5" />
                            
                            <!-- Δεξιά Οριζόντια Γραμμή -->
                            <line x1="470" y1="50" x2="750" y2="50" stroke="#1c3322" stroke-width="1.5" />
                            
                            <!-- Κλασικό Κεντρικό Κόσμημα (Swirls & Fleur-de-lis) -->
                            <g fill="none" stroke="#1c3322" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <!-- Κεντρικός κρίνος -->
                                <path d="M 400,25 Q 403,38 412,42 Q 403,45 400,68 Q 397,45 388,42 Q 397,38 400,25 Z" fill="#1c3322" />
                                <path d="M 388,42 Q 375,38 375,50 Q 375,55 382,53 Q 390,50 400,62 Q 410,50 418,53 Q 425,55 425,50 Q 425,38 412,42" />
                                
                                <!-- Αριστερή σπείρα -->
                                <path d="M 370,50 C 350,30 335,45 335,53 C 335,63 348,65 358,55 C 363,50 365,45 355,42 C 342,38 328,55 348,65 C 358,70 370,55 380,50" />
                                <path d="M 345,50 C 352,50 358,45 355,42 C 352,38 342,42 342,48 C 342,54 350,55 358,50" />
                                
                                <!-- Δεξιά σπείρα -->
                                <path d="M 430,50 C 450,30 465,45 465,53 C 465,63 452,65 442,55 C 437,50 435,45 445,42 C 458,38 472,55 452,65 C 442,70 430,55 420,50" />
                                <path d="M 455,50 C 448,50 442,45 445,42 C 448,38 458,42 458,48 C 458,54 450,55 442,50" />
                                
                                <!-- Διακοσμητικές τελείες στις άκρες των γραμμών -->
                                <circle cx="330" cy="50" r="2.5" fill="#1c3322" stroke="none" />
                                <circle cx="470" cy="50" r="2.5" fill="#1c3322" stroke="none" />
                            </g>
                        </svg>
                    </div>
                    
                    <div class="header-subtitle">${gen.subtitle}</div>
                </header>

                <!-- Δίστηλο Περιεχόμενο -->
                <div class="menu-columns">
                    <div class="menu-column">
                        ${buildColumnPreviewHTML(pageData.leftColumn)}
                    </div>
                    <div class="menu-column">
                        ${buildColumnPreviewHTML(pageData.rightColumn)}
                    </div>
                </div>

                <!-- Κάτω Μέρος Καταλόγου -->
                <!-- Κάτω Μέρος Καταλόγου -->
                <footer class="menu-footer-section">
                    ${contactRowHTML}
                    <!-- Εμφάνιση του μηνύματος μόνο αν δεν είναι κενό -->
                    ${gen.allergyText ? `
                        <div class="menu-allergy-row" style="font-size: 0.72rem; color: #4a5c4d; font-style: italic; margin-top: 4px; text-align: center; font-family: 'EB Garamond', serif;">
                            ${gen.allergyText}
                        </div>
                    ` : ''}
                </footer>
            </div>
        `;
    }
    
    return fullHTML;
}

function buildColumnPreviewHTML(columnCategories) {
    if (!columnCategories || columnCategories.length === 0) return '';

    return columnCategories.map(category => `
        <div class="menu-category">
            <h4 class="category-title">${category.title}</h4>
            
            ${category.items.map(item => `
                <div class="menu-item">
                    <div class="item-main-row">
                        <span class="item-title">${item.name}</span>
                        <span class="item-dots"></span>
                        <span class="item-price">${item.price}</span>
                    </div>
                    ${item.desc ? `<div class="item-description">${item.desc}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('');
}

/**
 * Ελέγχει αν το περιεχόμενο των στηλών υπερβαίνει το φυσικό ύψος της Α4
 */
function checkOverflow() {
    // Εντοπίζουμε ΜΟΝΟ την ενεργή σελίδα στην οθόνη
    const activePageEl = previewPanel.querySelector('.a4-page.active-page');
    const warningBanner = document.getElementById('overflow-warning');
    const warningText = document.getElementById('overflow-warning-text');

    if (!activePageEl || !warningBanner) return;

    const leftCol = activePageEl.querySelector('.menu-column:first-child');
    const rightCol = activePageEl.querySelector('.menu-column:last-child');

    if (!leftCol || !rightCol) return;

    // Ανίχνευση αν το πραγματικό ύψος (scrollHeight) είναι μεγαλύτερο από το ορατό ύψος (clientHeight)
    const leftOverflow = leftCol.scrollHeight > leftCol.clientHeight;
    const rightOverflow = rightCol.scrollHeight > rightCol.clientHeight;

    // 1. Διαχείριση του κόκκινου εφέ (glow) στις στήλες της Α4
    if (leftOverflow) {
        leftCol.classList.add('column-overflow');
    } else {
        leftCol.classList.remove('column-overflow');
    }

    if (rightOverflow) {
        rightCol.classList.add('column-overflow');
    } else {
        rightCol.classList.remove('column-overflow');
    }

    // 2. Διαχείριση του κόκκινου banner ειδοποίησης στο αριστερό Sidebar
    if (leftOverflow && rightOverflow) {
        warningText.textContent = "Προσοχή! Τα προϊόντα και στις δύο στήλες υπερβαίνουν το όριο της σελίδας και θα κοπούν.";
        warningBanner.style.display = 'flex';
    } else if (leftOverflow) {
        warningText.textContent = "Προσοχή! Τα προϊόντα στην Αριστερή Στήλη υπερβαίνουν το όριο της σελίδας και θα κοπούν.";
        warningBanner.style.display = 'flex';
    } else if (rightOverflow) {
        warningText.textContent = "Προσοχή! Τα προϊόντα στη Δεξιά Στήλη υπερβαίνουν το όριο της σελίδας και θα κοπούν.";
        warningBanner.style.display = 'flex';
    } else {
        warningBanner.style.display = 'none'; // Κανένα πρόβλημα, το banner κρύβεται
    }
}