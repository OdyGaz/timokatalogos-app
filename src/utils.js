/* src/utils.js */

/**
 * Μορφοποιεί μια τιμή προσθέτοντας το σύμβολο του ευρώ (€) και διορθώνοντας την υποδιαστολή.
 * Αν η τιμή δεν είναι έγκυρος αριθμός (π.χ. "Δωρεάν" ή "Μερίδα"), επιστρέφεται ως έχει.
 */
export function formatCurrency(value) {
    if (value === undefined || value === null) return "";
    
    const trimmed = value.toString().trim();
    if (trimmed === "") return "";
    
    // Αφαίρεση του συμβόλου € αν υπάρχει ήδη για να γίνει καθαρός υπολογισμός
    let cleanValue = trimmed.replace('€', '').trim();
    
    // Αντικατάσταση του ελληνικού κόμματος με τελεία για να αναγνωριστεί ως αριθμός από τη JS
    cleanValue = cleanValue.replace(',', '.');
    
    const number = parseFloat(cleanValue);
    
    // Αν δεν είναι έγκυρος αριθμός, επιστρέφει το αρχικό κείμενο χωρίς αλλαγή
    if (isNaN(number)) {
        return trimmed;
    }
    
    // Μορφοποίηση σε 2 δεκαδικά ψηφία και επαναφορά του ελληνικού κόμματος (,)
    return `${number.toFixed(2).replace('.', ',')}€`;
}

/**
 * Ελέγχει αν μια συμβολοσειρά (string) είναι έγκυρο JSON.
 * Χρησιμοποιείται κατά την εισαγωγή (import) του αρχείου backup.
 */
export function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Καθυστερεί την εκτέλεση μιας συνάρτησης (Debounce).
 * Χρήσιμο για μελλοντική χρήση σε βαριές διεργασίες κατά την πληκτρολόγηση.
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}