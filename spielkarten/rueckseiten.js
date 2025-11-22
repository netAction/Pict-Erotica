// Achtung: jsPDF und svg2pdf müssen über <script>-tags geladen sein!
// spielkarten_daten muss verfügbar sein!
// CORMORANT_MEDIUM_BASE64 muss verfügbar sein!

document.addEventListener('DOMContentLoaded', async () => {

    // I. JS-PDF & SVG IMPORT PRÜFUNG
    if (typeof window.jspdf === 'undefined') {
        console.error("jsPDF 3.0.3 wurde nicht geladen.");
        return;
    }
    const { jsPDF } = window.jspdf;

    if (typeof window.svg2pdf !== 'object' || typeof window.svg2pdf.svg2pdf !== 'function') {
        console.error("Fehler: Das SVG-Plugin konnte nicht korrekt initialisiert werden.");
        return;
    }
    const svgConverter = window.svg2pdf.svg2pdf;

    if (typeof spielkarten_daten === 'undefined') {
        console.error("Die Konstante 'spielkarten_daten' ist nicht definiert.");
        return;
    }
    
    // FONT-PRÜFUNG BEIBEHALTEN
    const FONT_NAME = 'CormorantMedium'; 
    const CORMORANT_MEDIUM_BASE64 = window.CORMORANT_MEDIUM_BASE64;


    // II. GLOBALE KONSTANTEN & MAẞE
    const TOTAL_BACKS = 110; 
    const EMPTY_FIELD_PERCENTAGE = 0.20; // 20% der Felder bleiben leer
    
    // PDF-MAẞE
    const totalWidth = 65; 
    const totalHeight = 97;
    const bleed = 3; 
    const cardWidth = 59; 
    
    // LAYOUT MAẞE
    const visibleBorderWidth = 5; 
    const innerContentX = bleed + visibleBorderWidth; 
    const innerContentY = bleed + visibleBorderWidth;
    const innerContentWidth = cardWidth - 2 * visibleBorderWidth; 
    const innerContentHeight = 91 - 2 * visibleBorderWidth;
    
    // MOSAIK MAẞE
    const P_SIZE = 7.4; 
    const P_GAP = 1.0; 
    const COLS = 6;     
    const ROWS = 10;    
    const REQUIRED_PICTOS = COLS * ROWS; // 60
    
    const mosaicWidth = COLS * P_SIZE + (COLS - 1) * P_GAP;
    const mosaicHeight = ROWS * P_SIZE + (ROWS - 1) * P_GAP;

    const offsetX = innerContentX + (innerContentWidth / 2) - (mosaicWidth / 2);
    const offsetY = innerContentY + (innerContentHeight / 2) - (mosaicHeight / 2);
    
    const parser = new DOMParser();

    // HILFSFUNKTION: Fisher-Yates (Knut) Shuffle
    function shuffleArray(array) {
        // Erstellt eine flache Kopie, um das Original nicht zu verändern
        const shuffled = [...array]; 
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
        }
        return shuffled;
    }
    
    // III. DATENVORBEREITUNG MIT FILTERUNG UND RECYCLING
    function collectAndParseSvgs(data) {
        const parsedSvgs = [];
        
        data.forEach(gruppe => {
            gruppe.cards.forEach(card => {
                // NEU: Filterung nach image_on_backside
                if (card.image_svg && card.image_on_backside === true) {
                    try {
                        const svgElement = parser.parseFromString(card.image_svg, 'image/svg+xml').documentElement;
                        // Stellt sicher, dass die Piktogramme schwarz sind
                        svgElement.setAttribute('fill', 'rgb(0,0,0)');
                        svgElement.setAttribute('stroke', 'none'); 
                        
                        parsedSvgs.push(svgElement); 
                    } catch (e) {
                         console.error("Fehler beim Vorab-Parsen eines SVGs:", e);
                    }
                }
            });
        });

        if (parsedSvgs.length < REQUIRED_PICTOS) { 
             console.warn(`WARNUNG: Nur ${parsedSvgs.length} Piktogramme mit 'image_on_backside: true' gefunden. Es werden ${REQUIRED_PICTOS} für eine eindeutige Rückseite benötigt. Piktogramme werden wiederholt.`);
        } else {
             console.log(`${parsedSvgs.length} freigegebene Piktogramme gefunden. Eindeutiges Mosaik möglich.`);
        }
        return parsedSvgs;
    }

    const allParsedSvgs = collectAndParseSvgs(spielkarten_daten);
    
    // IV. PDF GENERIERUNGS-LOGIK
    async function generateBacksPDF() { 
        
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [totalWidth, totalHeight] 
        });

        // FONT EINBETTUNG SICHERHEIT
        if (CORMORANT_MEDIUM_BASE64) {
            doc.addFileToVFS(FONT_NAME + '.ttf', CORMORANT_MEDIUM_BASE64); 
            doc.addFont(FONT_NAME + '.ttf', FONT_NAME, 'normal');
            doc.setFont(FONT_NAME, 'normal');
        }

        const BG_COLOR = [255, 255, 255];
        
        for (let i = 0; i < TOTAL_BACKS; i++) { 
            
            doc.addPage(); 
            const currentPageIndex = i + 2; 

            // Hintergrund zeichnen
            doc.setFillColor(BG_COLOR[0], BG_COLOR[1], BG_COLOR[2]); 
            doc.rect(0, 0, totalWidth, totalHeight, 'F'); 

            // NEU: Verfügbare Piktogramme für DIESE Seite mischen
            let shuffledSvgs = shuffleArray(allParsedSvgs);
            
            // Mosaik generieren
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    
                    // NEUE LOGIK: 20% der Felder leer lassen
                    if (Math.random() < EMPTY_FIELD_PERCENTAGE) {
                        continue; // Feld überspringen, bleibt weiß/leer
                    }

                    // Sicherstellen, dass der Piktogramm-Pool aufgefüllt wird, falls er leer ist
                    if (shuffledSvgs.length === 0) {
                        shuffledSvgs = shuffleArray(allParsedSvgs);
                    }

                    // Das nächste Piktogramm aus dem gemischten Array ziehen
                    const svgElementBase = shuffledSvgs.pop(); 
                    
                    // Tiefe Kopie erstellen
                    const svgElement = svgElementBase.cloneNode(true); 

                    const x = offsetX + col * (P_SIZE + P_GAP);
                    const y = offsetY + row * (P_SIZE + P_GAP);

                    if (svgElement) {
                        // SICHERHEIT: Auf das Rendern JEDES einzelnen Piktogramms warten
                        await svgConverter(svgElement, doc, { 
                            x: x, 
                            y: y, 
                            width: P_SIZE, 
                            height: P_SIZE 
                        });
                    }
                }
            }
            console.log(`Seite ${currentPageIndex} fertig gerendert.`);
        }
        
        doc.deletePage(1); // Erste leere Seite löschen
        doc.save('rueckseiten.pdf'); // KORRIGIERT: Neuer Dateiname
    }

    // V. INITIALISIERUNG START
    await generateBacksPDF(); 
});