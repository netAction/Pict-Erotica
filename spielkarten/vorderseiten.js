// Achtung: CORMORANT_MEDIUM_BASE64 muss global aus der externen Datei verfügbar sein!
// jsPDF und svg2pdf müssen über <script>-Tags geladen sein!

document.addEventListener('DOMContentLoaded', async () => {
    
    // I. JS-PDF & SVG IMPORT PRÜFUNG
    if (typeof window.jspdf === 'undefined') {
        console.error("jsPDF 3.0.3 wurde nicht geladen.");
        return;
    }
    const { jsPDF } = window.jspdf; 

    // KORREKTUR: Zugriff auf die Export-Eigenschaft des UMD-Objekts
    if (typeof window.svg2pdf !== 'object' || typeof window.svg2pdf.svg2pdf !== 'function') {
        console.error("Fehler: Das SVG-Plugin konnte nicht korrekt initialisiert werden.");
        return;
    }
    const svgConverter = window.svg2pdf.svg2pdf; 

    if (typeof spielkarten_daten === 'undefined') {
        console.error("Die Konstante 'spielkarten_daten' ist nicht definiert.");
        return;
    }
    
    // NEU: Font-Daten-Check (angenommen, die Konstante ist definiert)
    if (typeof CORMORANT_MEDIUM_BASE64 === 'undefined') {
        console.error("Fehler: Die Konstante 'CORMORANT_MEDIUM_BASE64' ist nicht definiert. Bitte die Base64-Datei einbinden.");
        return;
    }


    // II. GLOBALE KONSTANTEN & MAẞE
    const NEUTRAL_BG_RGB = [236, 240, 241]; 
    const FONT_NAME = 'CormorantMedium'; // Der interne Name für jsPDF
    const FONT_STYLE = 'normal';
    
    // PDF-MAẞE
    const totalWidth = 65; 
    const totalHeight = 97;
    const bleed = 3; 
    const cardWidth = 59; 
    const cardHeight = 91; 
    const padding = 8; 
    const radius = 8; 
    
    // LAYOUT FÜR DEN SICHTBAREN RAND (5mm Rand)
    const visibleBorderWidth = 5; 
    const innerContentX = bleed + visibleBorderWidth; 
    const innerContentY = bleed + visibleBorderWidth;
    const innerContentWidth = cardWidth - 2 * visibleBorderWidth; 
    const innerContentHeight = cardHeight - 2 * visibleBorderWidth; 


    // --- NEU: ATTRIBUT-KARTEN DATEN ---
    const MODIFIER_COLOR = "#607D8B"; // Dunkelgrau/Blau
    
    const attribut_karten_daten = [
        { text: "HAUPTASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" }, 
        { text: "NEBENASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "NEBENASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "NEBENASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "NEBENASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "NEBENASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "NEBENASPEKT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "VIEL", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "WICHTIG", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "KEIN / NICHT", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "FÜHRT ZU", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
        { text: "", color: MODIFIER_COLOR, title: "MODIFIKATOR" },
    ];


    // III. HILFSFUNKTIONEN (unverändert)
    function flattenCards(data) {
        let cardId = 1;
        const allCards = [];

        data.forEach(gruppe => {
            const gruppenColor = gruppe.color_hex;
            const gruppenTitle = gruppe.title;

            gruppe.cards.forEach(card => {
                allCards.push({
                    cardnumber: cardId++,
                    color: gruppenColor,
                    title: gruppenTitle,
                    svg_code: card.image_svg, 
                    text_content: card.text.trim()
                });
            });
        });
        return allCards;
    }
    
    // IV. PDF GENERIERUNGS-LOGIK

    async function generatePDF(cards) { 
        
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: [totalWidth, totalHeight] 
        });

        // --- FONT EINBETTUNG START ---
        doc.addFileToVFS(FONT_NAME + '.ttf', CORMORANT_MEDIUM_BASE64); 
        doc.addFont(FONT_NAME + '.ttf', FONT_NAME, FONT_STYLE);
        doc.setFont(FONT_NAME, FONT_STYLE);
        // --- FONT EINBETTUNG ENDE ---


        // Allgemeine Einstellungen
        doc.setFontSize(10);
        
        // Temporärer Parser für das SVG-Markup
        const parser = new DOMParser();

        for (const card of cards) { 
            
            doc.addPage(); 
            
            // 1. FARBIGER GRUND (ANSCHNITT UND 5MM RAND)
            doc.setFillColor(card.color); 
            doc.rect(0, 0, totalWidth, totalHeight, 'F'); 

            // --- Layout-Switch: Piktogramm-Karte vs. Attribut-Karte ---
            
            if (card.svg_code) {
                // A. PIKTOGRAMM-KARTE (mit SVG)
                
                // 2. INNERE KARTENFLÄCHE (WEISS/NEUTRAL, ABGERUNDET)
                doc.setFillColor(NEUTRAL_BG_RGB[0], NEUTRAL_BG_RGB[1], NEUTRAL_BG_RGB[2]); 
                doc.roundedRect(innerContentX, innerContentY, innerContentWidth, innerContentHeight, radius, radius, 'F');

                // 3. TITEL IM FARBIGEN 5MM-RAND (Oben)
                const titleYPosition = bleed + visibleBorderWidth / 2 + 1;
                doc.setFontSize(12);
                doc.setTextColor(255, 255, 255); // WEISS FÜR DEN RAND
                doc.text(card.title.toUpperCase(), totalWidth / 2, titleYPosition, { align: 'center' }); 

                // 4. PIKTOGRAMM PLATZIERUNG (SVG-Code)
                const imageSize = 40;
                const imageX = innerContentX + innerContentWidth / 2 - imageSize / 2; 
                const imageY = innerContentY + padding; 
                
                if (card.svg_code) {
                    const svgElement = parser.parseFromString(card.svg_code, 'image/svg+xml').documentElement;
                    await svgConverter(svgElement, doc, { 
                        x: imageX, 
                        y: imageY, 
                        width: imageSize, 
                        height: imageSize 
                    });
                } else {
                    // Platzhalter
                    doc.setFillColor(200, 200, 200); 
                    doc.rect(imageX, imageY, imageSize, imageSize, 'F');
                }
                
                // 5. TEXTPLATZIERUNG FÜR PIKTOGRAMM-BEGRIFFE 
                const textBlockWidth = innerContentWidth - 2 * padding; 
                const imageBottomY = imageY + imageSize;
                
                const textAreaYStart = imageBottomY; 
                const textAreaYEnd = totalHeight - bleed - visibleBorderWidth; 
                const availableTextHeight = textAreaYEnd - textAreaYStart; 

                doc.setFont(FONT_NAME, FONT_STYLE);
                doc.setTextColor(0, 0, 0); 
                const FONT_SIZE = 24; 
                doc.setFontSize(FONT_SIZE); 

                const textLines = card.text_content.split('\n');
                const lineCount = textLines.length;
                const LINE_HEIGHT_MM = FONT_SIZE * 0.3528 * 1.1;
                const totalTextHeight = lineCount * LINE_HEIGHT_MM;

                const startY = textAreaYStart + (availableTextHeight / 2) - (totalTextHeight / 2) + (LINE_HEIGHT_MM * 0.75);

                let currentY = startY;
                textLines.forEach(line => {
                    doc.text(line, totalWidth / 2, currentY, { align: 'center' });
                    currentY += LINE_HEIGHT_MM;
                });

            } else {
                // B. ATTRIBUT-KARTE (VOLLFLÄCHIG FARBIG, TEXT OBEN ZENTRIERT)
                
                // 5. TEXTPLATZIERUNG FÜR ATTRIBUT-KARTE (Horizontal zentriert, oben positioniert)
                
                doc.setFont(FONT_NAME, FONT_STYLE);
                doc.setTextColor(255, 255, 255); // WEISSE SCHRIFT auf farbigem Grund
                const FONT_SIZE_ATTR = 20; // Etwas größer, aber nicht zu groß
                doc.setFontSize(FONT_SIZE_ATTR); 

                const textLines = card.text_content.split('\n');
                const lineCount = textLines.length;
                
                const LINE_HEIGHT_MM_ATTR = FONT_SIZE_ATTR * 0.3528 * 1.1;
                
                // Platzierung: Startpunkt ist nahe dem oberen Rand (innerContentY)
                // Wir verwenden innerContentY + Puffer, um den Text im oberen 5mm Bereich zu halten.
                const topTextStart = innerContentY + visibleBorderWidth + 5; 

                let currentY = topTextStart;
                
                textLines.forEach(line => {
                    // X-Koordinate: totalWidth / 2 -> Horizontal zentriert
                    // Y-Koordinate: currentY -> Positionierung von oben nach unten
                    doc.text(line, totalWidth / 2, currentY, { 
                        align: 'center'
                    });
                    currentY += LINE_HEIGHT_MM_ATTR;
                });
            }
        }

        doc.deletePage(1); 
        doc.save('vorderseiten.pdf');
    }

    // V. INITIALISIERUNG START
    const fertigePiktogrammKarten = flattenCards(spielkarten_daten);
    
    const startCardNumber = fertigePiktogrammKarten.length + 1;
    
    // Attribut-Karten in das flache Format konvertieren
    const fertigeAttributKarten = attribut_karten_daten.map((card, index) => ({
        cardnumber: startCardNumber + index,
        color: card.color, 
        title: card.title,
        svg_code: null, // WICHTIG: Kein SVG, um den Layout-Switch auszulösen
        text_content: card.text.trim()
    }));

    // Alle Karten zusammenführen
    const alleKarten = [...fertigePiktogrammKarten, ...fertigeAttributKarten];

    await generatePDF(alleKarten); 
});