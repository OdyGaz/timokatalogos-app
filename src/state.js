/* src/state.js */

const LOCAL_STORAGE_KEY = 'timokatalogos_gianna_state';

// Προεπιλεγμένα δεδομένα για την πρώτη εκκίνηση της εφαρμογής
const DEFAULT_STATE = {
    general: {
        storeName: "Coffee Shop",
        subtitle: "Location",
        phone: "Phone Number",
        wifiName: "WiFi",
        wifiPass: "Pass",
        customBackground: null, // ΝΕΟ: Αρχικά δεν υπάρχει προσαρμοσμένο φόντο
        allergyText: "Παρακαλούμε ενημερώστε το προσωπικό μας για τυχόν αλλεργίες ή δυσανεξίες." // <-- ΠΡΟΣΘΗΚΗ
    },
    activePage: 1, // 1 για Ροφήματα, 2 για Ποτά & Μεζέδες, 3 για Γλυκά & Specials
    page1: {
        leftColumn: [
            {
                title: "ΚΑΦΕΔΕΣ / ΡΟΦΗΜΑΤΑ",
                items: [
                    { name: "Ελληνικός μονός", desc: "Παραδοσιακός στη χόβολη", price: "2,00€" },
                    { name: "Ελληνικός διπλός", desc: "", price: "2,80€" },
                    { name: "Φραπέ / Νες", desc: "Ζεστό ή κρύο", price: "2,50€" },
                    { name: "Freddo Espresso", desc: "", price: "3,00€" },
                    { name: "Cappuccino μονό", desc: "", price: "3,20€" }
                ]
            }
        ],
        rightColumn: [
            {
                title: "ΑΝΑΨΥΚΤΙΚΑ",
                items: [
                    { name: "Coca-Cola / Πορτοκαλάδα", desc: "Λεμονάδα", price: "2,50€" },
                    { name: "Σόδα", desc: "", price: "2,00€" },
                    { name: "Εμφιαλωμένο νερό (500ml)", desc: "", price: "0,50€" },
                    { name: "Χυμός (διάφοροι)", desc: "", price: "2,50€" }
                ]
            }
        ]
    },
    page2: {
        leftColumn: [
            {
                title: "ΤΣΙΠΟΥΡΟ & ΟΥΖΟ",
                items: [
                    { name: "Τσίπουρο χύμα (50ml)", desc: "Με μεζεδάκι", price: "2,50€" },
                    { name: "Τσίπουρο φιάλη", desc: "", price: "12,00€" },
                    { name: "Ούζο ποτήρι", desc: "", price: "3,00€" }
                ]
            }
        ],
        rightColumn: [
            {
                title: "ΜΕΖΕΔΕΣ",
                items: [
                    { name: "Τοστ", desc: "Με τυρί και γαλοπούλα", price: "3,50€" },
                    { name: "Πατάτες τηγανητές", desc: "Φρεσκοκομμένες", price: "4,00€" },
                    { name: "Χωριάτικη σαλάτα", desc: "Με φέτα και ελαιόλαδο", price: "6,50€" }
                ]
            }
        ]
    },
    page3: {
        leftColumn: [
            {
                title: "ΓΛΥΚΑ & ΠΑΓΩΤΑ",
                items: [
                    { name: "Παγωτό (διάφορες γεύσεις)", desc: "Μερίδα 2 μπάρες", price: "4,00€" },
                    { name: "Γλυκό κουταλιού", desc: "Παραδοσιακό βύσσινο ή κυδώνι", price: "2,50€" }
                ]
            }
        ],
        rightColumn: [
            {
                title: "SPECIALS",
                items: [
                    { name: "Ποικιλία Γιάννα", desc: "Για 2-4 άτομα", price: "15,00€" }
                ]
            }
        ]
    },
    leftColCollapsed: false,   // Αν είναι κλειστή η αριστερή στήλη στο sidebar
    rightColCollapsed: false   // Αν είναι κλειστή η δεξιά στήλη στο sidebar
};

// Το τρέχον state της εφαρμογής
let state = {};

// Λίστα με συναρτήσεις-συνδρομητές που ενημερώνονται όταν αλλάζει το state
const listeners = [];

/**
 * Φορτώνει τα δεδομένα από το LocalStorage ή χρησιμοποιεί τα default αν δεν υπάρχουν.
 * Περιλαμβάνει ελέγχους για τη συμπλήρωση πεδίων που μπορεί να λείπουν από παλαιότερες εκδόσεις.
 */
export function initState() {
    try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // Εξασφάλιση συμβατότητας με παλαιότερα δεδομένα LocalStorage
            if (!parsed.page3) {
                parsed.page3 = JSON.parse(JSON.stringify(DEFAULT_STATE.page3));
            }
            if (parsed.leftColCollapsed === undefined) {
                parsed.leftColCollapsed = DEFAULT_STATE.leftColCollapsed;
            }
            if (parsed.rightColCollapsed === undefined) {
                parsed.rightColCollapsed = DEFAULT_STATE.rightColCollapsed;
            }
            // ΝΕΟ: Εξασφάλιση συμβατότητας για το customBackground
            if (parsed.general && parsed.general.customBackground === undefined) {
                parsed.general.customBackground = null;
            }
            // ΝΕΟ: Εξασφάλιση συμβατότητας για το allergyText <-- ΠΡΟΣΘΗΚΗ
            if (parsed.general && parsed.general.allergyText === undefined) {
                    parsed.general.allergyText = DEFAULT_STATE.general.allergyText;
            }

            state = parsed;
        } else {
            state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    } catch (e) {
        console.warn("Αδυναμία ανάγνωσης LocalStorage. Χρήση προεπιλεγμένων δεδομένων.", e);
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    notifyListeners();
}

/**
 * Επιστρέφει ένα αντίγραφο του τρέχοντος state
 */
export function getState() {
    return state;
}

/**
 * Προσθέτει έναν συνδρομητή (π.χ. τη συνάρτηση render από το ui.js)
 */
export function subscribe(listener) {
    listeners.push(listener);
}

/**
 * Ενημερώνει όλους τους συνδρομητές ότι τα δεδομένα άλλαξαν
 */
function notifyListeners() {
    listeners.forEach(listener => listener(state));
}

/**
 * Αποθηκεύει το state στο LocalStorage και ενημερώνει τους συνδρομητές
 */
function saveState() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error("Αδυναμία αποθήκευσης στο LocalStorage.", e);
    }
    notifyListeners();
}

/* ==========================================
   ΣΥΝΑΡΤΗΣΕΙΣ ΕΝΗΜΕΡΩΣΗΣ ΔΕΔΟΜΕΝΩΝ (MUTATORS)
   ========================================== */

export function updateGeneralInfo(fields) {
    state.general = { ...state.general, ...fields };
    saveState();
}

// ΝΕΟ: Ενημέρωση ή διαγραφή του προσαρμοσμένου φόντου με έλεγχο ορίου αποθήκευσης
export function updateCustomBackground(base64Data) {
    if (state.general) {
        const originalBackground = state.general.customBackground;
        try {
            state.general.customBackground = base64Data;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
            notifyListeners();
            return true;
        } catch (e) {
            // Επαναφορά στην προηγούμενη κατάσταση αν αποτύχει η αποθήκευση λόγω QuotaExceededError
            state.general.customBackground = originalBackground;
            throw e; // Το σφάλμα μεταφέρεται προς τα έξω για να εμφανιστεί το error message στο ui.js
        }
    }
    return false;
}

export function setActivePage(pageNum) {
    if (pageNum === 1 || pageNum === 2 || pageNum === 3) {
        state.activePage = pageNum;
        saveState();
    }
}

// Διαχείριση Κατηγοριών
export function addCategory(pageNum, column) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column]) {
        state[pageKey][column].push({
            title: "ΝΕΑ ΚΑΤΗΓΟΡΙΑ",
            items: []
        });
        saveState();
    }
}

export function updateCategoryTitle(pageNum, column, catIndex, newTitle) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column] && state[pageKey][column][catIndex]) {
        state[pageKey][column][catIndex].title = newTitle;
        saveState();
    }
}

export function deleteCategory(pageNum, column, catIndex) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column] && state[pageKey][column][catIndex]) {
        state[pageKey][column].splice(catIndex, 1);
        saveState();
    }
}

// Διαχείριση Προϊόντων
export function addItem(pageNum, column, catIndex) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column] && state[pageKey][column][catIndex]) {
        state[pageKey][column][catIndex].items.push({
            name: "Νέο προϊόν",
            desc: "",
            price: "0,00€"
        });
        saveState();
    }
}

export function updateItem(pageNum, column, catIndex, itemIndex, updatedFields) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column] && state[pageKey][column][catIndex]) {
        const item = state[pageKey][column][catIndex].items[itemIndex];
        if (item) {
            state[pageKey][column][catIndex].items[itemIndex] = { ...item, ...updatedFields };
            saveState();
        }
    }
}

export function deleteItem(pageNum, column, catIndex, itemIndex) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column] && state[pageKey][column][catIndex]) {
        state[pageKey][column][catIndex].items.splice(itemIndex, 1);
        saveState();
    }
}

// Μετακίνηση προϊόντος πάνω/κάτω (Rearrange)
export function moveItem(pageNum, column, catIndex, itemIndex, direction) {
    const pageKey = `page${pageNum}`;
    if (state[pageKey] && state[pageKey][column] && state[pageKey][column][catIndex]) {
        const items = state[pageKey][column][catIndex].items;
        if (direction === 'up' && itemIndex > 0) {
            const temp = items[itemIndex];
            items[itemIndex] = items[itemIndex - 1];
            items[itemIndex - 1] = temp;
            saveState();
        } else if (direction === 'down' && itemIndex < items.length - 1) {
            const temp = items[itemIndex];
            items[itemIndex] = items[itemIndex + 1];
            items[itemIndex + 1] = temp;
            saveState();
        }
    }
}

// Backup (Εξαγωγή / Εισαγωγή)
export function exportState() {
    return JSON.stringify(state, null, 2);
}

export function importState(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        // Βασικός έλεγχος εγκυρότητας δομής
        if (parsed.general && parsed.page1 && parsed.page2) {
            state = parsed;
            
            // Έλεγχος συμβατότητας για παλιά backups
            if (!state.page3) {
                state.page3 = JSON.parse(JSON.stringify(DEFAULT_STATE.page3));
            }
            if (state.leftColCollapsed === undefined) {
                state.leftColCollapsed = DEFAULT_STATE.leftColCollapsed;
            }
            if (state.rightColCollapsed === undefined) {
                state.rightColCollapsed = DEFAULT_STATE.rightColCollapsed;
            }
            // ΝΕΟ: Εξασφάλιση συμβατότητας για το customBackground κατά την εισαγωγή
            if (state.general && state.general.customBackground === undefined) {
                state.general.customBackground = null;
            }
            // ΝΕΟ: Εξασφάλιση συμβατότητας για το allergyText κατά την εισαγωγή <-- ΠΡΟΣΘΗΚΗ
            if (state.general && state.general.allergyText === undefined) {
                state.general.allergyText = DEFAULT_STATE.general.allergyText;
            }
        
            saveState();
            return true;
        }
        return false;
    } catch (e) {
        console.error("Αποτυχία εισαγωγής δεδομένων.", e);
        return false;
    }
}

// Επαναφορά στα default
export function resetState() {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
}

// Ανοιγοκλείνει τη στήλη στο sidebar
export function toggleColumnCollapse(columnName) {
    const key = columnName === 'leftColumn' ? 'leftColCollapsed' : 'rightColCollapsed';
    state[key] = !state[key];
    saveState();
}