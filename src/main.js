/* src/main.js */

import { initState, subscribe } from './state.js';
import { initUI, render } from './ui.js';

// Αναμονή για την πλήρη φόρτωση του DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        // 1. Αρχικοποίηση των Event Listeners της φόρμας (αριστερή στήλη)
        initUI();

        // 2. Εγγραφή (Subscribe) της συνάρτησης render στο state.
        // Κάθε φορά που αλλάζει οποιοδήποτε δεδομένο, η οθόνη θα ξανασχεδιάζεται αυτόματα.
        subscribe(render);

        // 3. Φόρτωση των δεδομένων (από LocalStorage ή προεπιλεγμένων)
        // Αυτή η ενέργεια θα πυροδοτήσει αυτόματα και το πρώτο render της εφαρμογής.
        initState();
        
    } catch (error) {
        console.error("Σφάλμα κατά την εκκίνηση της εφαρμογής:", error);
    }
});