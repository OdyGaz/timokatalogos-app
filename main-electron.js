const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
    // Δημιουργία του κύριου παραθύρου της εφαρμογής
    const mainWindow = new BrowserWindow({
        width: 1300,
        height: 850,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: true,     // Αλλαγή σε true για άμεση επικοινωνία με το IPC
            contextIsolation: false,   // Αλλαγή σε false για απλούστευση της επικοινωνίας
            webSecurity: false         // Παράκαμψη CORS για τη φόρτωση τοπικών ES Modules
        }
    });

    // Φόρτωση του index.html από τον ριζικό φάκελο
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // ΝΕΟ: Παράκαμψη του window.print() ώστε να καλεί απευθείας τη δημιουργία PDF
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript(`
            window.print = () => {
                const { ipcRenderer } = require('electron');
                ipcRenderer.send('print-to-pdf');
            };
        `);
    });
}

// ΝΕΟ: Ακρόαση για το σήμα παραγωγής PDF από τον Renderer
ipcMain.on('print-to-pdf', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    
    // Εμφάνιση του επίσημου διαλόγου "Αποθήκευση ως..." των Windows
    dialog.showSaveDialog(win, {
        title: 'Αποθήκευση Καταλόγου ως PDF',
        defaultPath: path.join(app.getPath('desktop'), 'timokatalogos.pdf'),
        filters: [
            { name: 'Αρχεία PDF', extensions: ['pdf'] }
        ]
    }).then(file => {
        // Αν ο χρήστης δεν ακύρωσε το παράθυρο και επέλεξε διαδρομή
        if (!file.canceled && file.filePath) {
            
            // Δημιουργία του PDF χωρίς περιθώρια και με εκτύπωση φόντου
            win.webContents.printToPDF({
                pageSize: 'A4',
                marginsType: 1, // 1 σημαίνει καθόλου περιθώρια (No margins)
                printBackground: true
            }).then(data => {
                // Εγγραφή του αρχείου στον δίσκο
                fs.writeFile(file.filePath, data, (error) => {
                    if (error) {
                        console.error('Σφάλμα κατά την εγγραφή του αρχείου PDF:', error);
                    }
                });
            }).catch(err => {
                console.error('Σφάλμα κατά την παραγωγή του PDF:', err);
            });
            
        }
    }).catch(err => {
        console.error('Σφάλμα κατά την εμφάνιση του Save Dialog:', err);
    });
});

// Εκκίνηση της εφαρμογής όταν το Electron είναι έτοιμο
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Τερματισμός της εφαρμογής όταν κλείνουν όλα τα παράθυρα (εκτός macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});