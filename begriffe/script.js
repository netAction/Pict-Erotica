// --- 2. HILFSFUNKTION: PARSEN ---
function parseSimpleTextToCards(input) {
    const lines = input.split('\n');
    let cardId = 1;

    // Filtert leere Zeilen und nummeriert die Begriffe
    return lines
        .map(line => line.trim())
        .filter(trimmedLine => trimmedLine !== '')
        .map(trimmedLine => ({
            id: cardId++,
            term: trimmedLine // Bezeichnung hier als 'term' speichern
        }));
}

// --- 3. LOGIK: MISCHEN UND KARTEN STRUKTURIEREN ---

function createMixedCards(leichtArray, schwerArray) {
    const mixedCards = [];
    let cardId = 1;

    // Hilfsfunktion zum Mischen/Zufällige Entnahme
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Mischen Sie die beiden Listen, um die Zufälligkeit der Paarungen zu erhöhen
    const shuffledLeicht = shuffleArray(leichtArray);
    const shuffledSchwer = shuffleArray(schwerArray);

    // Berechnen Sie, wie viele vollständige Karten (2 leicht + 2 schwer) möglich sind
    const maxCards = Math.floor(Math.min(shuffledLeicht.length / 2, shuffledSchwer.length / 2));

    for (let i = 0; i < maxCards; i++) {
        // Ziehe 2 leichte Begriffe
        const l1 = shuffledLeicht[i * 2].term;
        const l2 = shuffledLeicht[i * 2 + 1].term;

        // Ziehe 2 schwere Begriffe
        const s1 = shuffledSchwer[i * 2].term;
        const s2 = shuffledSchwer[i * 2 + 1].term;

        mixedCards.push({
            cardnumber: cardId++,
            text_leicht1: l1,
            text_leicht2: l2,
            text_schwer1: s1,
            text_schwer2: s2
        });
    }

    const unbenutzteLeichteBegriffe = shuffledLeicht.slice(maxCards * 2);
    const unbenutzteSchwereBegriffe = shuffledSchwer.slice(maxCards * 2);
    console.log("Nicht verwendete leichte Begriffe:", unbenutzteLeichteBegriffe)
    console.log("Nicht verwendete schwere Begriffe:", unbenutzteSchwereBegriffe)

    return mixedCards;
}

function renderCards(cards) {
    const chunks = [];
    const CARDS_PER_PAGE = 6; // Definiert die Seitengröße

    // Iteriert durch das gesamte Karten-Array in Schritten von 6
    for (let i = 0; i < cards.length; i += CARDS_PER_PAGE) {
        // Schneidet den aktuellen 6er-Block (oder den Rest) ab
        const group = cards.slice(i, i + CARDS_PER_PAGE);

        // Erzeugt den HTML-Inhalt für diesen 6er-Block
        const pageContent = group.map(card => {
            return `
                <div class="card" data-card-id="${card.cardnumber}">
                    <div class="card__text card__text--easy">① ${card.text_leicht1.trim()}</div>
                    <div class="card__text card__text--easy">② ${card.text_leicht2.trim()}</div>
                    <div class="card__easyhardseparator"></div>
                    <div class="card__text card__text--hard">③ ${card.text_schwer1.trim()}</div>
                    <div class="card__text card__text--hard">④ ${card.text_schwer2.trim()}</div>
                </div>
            `;
        }).join('\n');

        // Fügt den gesamten Block in den Seiten-Container ein
        chunks.push(`<div class="pages__single">\n${pageContent}\n</div>`);
    }
    
    // Gibt alle Seiten-Container (Chunks) als einen großen String zurück
    return chunks.join('\n\n');
}

// A. Parsen der Rohdaten
const leichteBegriffe = parseSimpleTextToCards(begriffe_leicht);
const schwereBegriffe = parseSimpleTextToCards(begriffe_schwer);

// B. Mischen und Karten erstellen
const fertigeKarten = createMixedCards(leichteBegriffe, schwereBegriffe);

// C. HTML rendern
let pages_html = renderCards(fertigeKarten);

// D. Ausgabe im Dokument
document.querySelector('.pages').innerHTML = pages_html;