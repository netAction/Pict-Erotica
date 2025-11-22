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
    // Hintergrundfarbe der Attribut-Karten (Hellblau-Grau)
    const ATTRIBUTE_BG_RGB = [224, 232, 240]; // #E0E8F0
    
    // Hintergrundfarbe der Piktogramm-Karten (Nahe am alten Wert)
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


    // --- AKTUALISIERTE ATTRIBUT-KARTEN DATEN ---
    const MODIFIER_COLOR_HEX = "#708D9E"; // Gedämpftes Blau-Grau
    
    // SVG-Codes für die Modifikatoren
    const SVG_MODIFIER_TOP = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184.25 197.81"><path d="M0,0v197.81h8.5c0-3.91,1.59-7.46,4.15-10.02s6.11-4.15,10.02-4.15h138.9c3.91,0,7.46,1.59,10.02,4.15s4.15,6.11,4.15,10.02h8.5V0H0Z" style="fill:${MODIFIER_COLOR_HEX};"/></svg>`;
    const SVG_MODIFIER_CENTER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 184.25 113.39"><path d="M184.25,113.39V0h-8.5c0,3.91-1.59,7.46-4.15,10.02s-6.11,4.15-10.02,4.15H22.68c-3.91,0-7.46-1.59-10.02-4.15S8.5,3.91,8.5,0H0v113.39h8.5c0-3.91,1.59-7.46,4.15-10.02s6.11-4.15,10.02-4.15h138.9c3.91,0,7.46,1.59,10.02,4.15s4.15,6.11,4.15,10.02h8.5Z" style="fill:${MODIFIER_COLOR_HEX};"/></svg>`;


    const attribut_karten_daten = [
        { text: "Hauptaspekt", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "Nebenaspekt", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "wie", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "kein / nicht", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "vulgär", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "Wichtig!", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "metaphorisch", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "Der gesuchte\nBegriff ist ↓", color: MODIFIER_COLOR_HEX, position: "top" },
        { text: "entweder ↑ oder ↓", color: MODIFIER_COLOR_HEX, position: "center" },
        { text: "↓ anstelle von ↑", color: MODIFIER_COLOR_HEX, position: "center" },
        { text: "vorher ↑, nachher ↓", color: MODIFIER_COLOR_HEX, position: "center" },
        { text: "erst ↑, dann ↓", color: MODIFIER_COLOR_HEX, position: "center" },
        { text: "↑ führt zu ↓", color: MODIFIER_COLOR_HEX, position: "center" },
    ];


    // III. HILFSFUNKTIONEN
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

        // --- FONT EINBETTUNG ---
        doc.addFileToVFS(FONT_NAME + '.ttf', CORMORANT_MEDIUM_BASE64); 
        doc.addFont(FONT_NAME + '.ttf', FONT_NAME, FONT_STYLE);
        doc.setFont(FONT_NAME, FONT_STYLE);

        const parser = new DOMParser();
        const rotCenterY = totalHeight / 2; // Hilfsvariable für die Mitte

        for (const card of cards) { 
            
            doc.addPage(); 
            
            // 1. FARBIGER GRUND (ANSCHNITT UND 5MM RAND)
            doc.setFillColor(card.color); 
            doc.rect(0, 0, totalWidth, totalHeight, 'F'); 

            // --- Layout-Switch: Piktogramm-Karte vs. Attribut-Karte ---
            
            // Prüft auf 'svg_code' UND 'title', um Piktogramm-Karten zu identifizieren.
            if (card.svg_code && card.title) {
                // A. PIKTOGRAMM-KARTE (mit SVG)
                
                // 2. INNERE KARTENFLÄCHE (WEISS/NEUTRAL, ABGERUNDET)
                doc.setFillColor(NEUTRAL_BG_RGB[0], NEUTRAL_BG_RGB[1], NEUTRAL_BG_RGB[2]); 
                doc.roundedRect(innerContentX, innerContentY, innerContentWidth, innerContentHeight, radius, radius, 'F');

                // 3. TITEL IM FARBIGEN 5MM-RAND (Oben)
                const titleYPosition = bleed + visibleBorderWidth / 2 + 1.5; 
                doc.setFontSize(12);
                doc.setTextColor(255, 255, 255); 
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
                // B. ATTRIBUT-KARTE (GEDÄMPFTES DESIGN)
                
                // Setzt den Hintergrund auf Hellblau-Grau
                doc.setFillColor(ATTRIBUTE_BG_RGB[0], ATTRIBUTE_BG_RGB[1], ATTRIBUTE_BG_RGB[2]); 
                doc.rect(0, 0, totalWidth, totalHeight, 'F');
                
                const position = card.position;
                
                let svgCode; // Deklariert svgCode mit 'let' für Zuweisung (FIX)
                let svgWidth = totalWidth; 
                let svgHeight = 0;
                let svgY = 0;
                
                // Bestimmung von Größe und Position des SVG
                if (position === 'top') {
                    svgCode = SVG_MODIFIER_TOP;
                    svgHeight = 69.78; 
                    svgY = -40;
                } else if (position === 'center') {
                    svgCode = SVG_MODIFIER_CENTER;
                    svgHeight = 40;
                    svgY = rotCenterY - (svgHeight / 2); 
                }
                
                // SVG RENDERING DES HINTERGRUNDES
                if (svgCode) {
                    const svgElement = parser.parseFromString(svgCode, 'image/svg+xml').documentElement;
                    await svgConverter(svgElement, doc, { 
                        x: 0, 
                        y: svgY, 
                        width: svgWidth, 
                        height: svgHeight 
                    });
                }
                
                // 5. TEXTPLATZIERUNG (Über dem SVG zentriert)
                doc.setFont(FONT_NAME, FONT_STYLE);
                doc.setTextColor(255, 255, 255); 
                const FONT_SIZE_ATTR = 20; 
                doc.setFontSize(FONT_SIZE_ATTR); 

                const textLines = card.text_content.split('\n');
                const lineCount = textLines.length;
                const LINE_HEIGHT_MM_ATTR = FONT_SIZE_ATTR * 0.3528 * 1; // Faktor 1 (enger)
                const totalTextHeight = lineCount * LINE_HEIGHT_MM_ATTR;

                
                if (position === 'top') {
                     // StartY = Mitte des 69.78mm hohen SVG-Segments - 17mm Korrektur
                     const startYTop = (svgHeight / 2) - (totalTextHeight / 2) + (LINE_HEIGHT_MM_ATTR * 0.4) - 17;
                     
                     let currentY = startYTop;
                     textLines.forEach(line => {
                         doc.text(line, totalWidth / 2, currentY, { align: 'center' });
                         currentY += LINE_HEIGHT_MM_ATTR;
                     });
                } else if (position === 'center') {
                     // StartY = Mitte des 40mm Blocks + 2.5mm Korrektur
                     const startYCenter = svgY + (svgHeight / 2) - (totalTextHeight / 2) + (LINE_HEIGHT_MM_ATTR * 0.4) + 2.5;
                     
                     let currentY = startYCenter;
                     textLines.forEach(line => {
                         doc.text(line, totalWidth / 2, currentY, { align: 'center' });
                         currentY += LINE_HEIGHT_MM_ATTR;
                     });
                }
            }
        }

        doc.deletePage(1); 
        doc.save('vorderseiten.pdf');
    }

    // V. INITIALISIERUNG START
    const fertigePiktogrammKarten = flattenCards(spielkarten_daten);
    
    // Attribut-Karten in das flache Format konvertieren
    const startCardNumber = fertigePiktogrammKarten.length + 1;
    
    const fertigeAttributKarten = attribut_karten_daten.map((card, index) => ({
        cardnumber: startCardNumber + index,
        color: card.color, 
        title: null, 
        // SVG-Code wird aus Position abgeleitet (dieser Key wird nur hier zur Ableitung genutzt)
        svg_code: card.position === 'top' ? SVG_MODIFIER_TOP : SVG_MODIFIER_CENTER, 
        text_content: card.text.trim(),
        position: card.position
    }));

    const alleKarten = [...fertigePiktogrammKarten, ...fertigeAttributKarten];

    await generatePDF(alleKarten); 
});