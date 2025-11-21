// Achtung: Die Konstante "begriffeRaw" MUSS in der Datei begriffe.js definiert sein!

// I. KONSTANTEN UND DATEN
const CONTENT_AREA = document.getElementById('content');
const RANDOM_ACTION_BUTTON = document.getElementById('show-random-action');
const RANDOM_LIST_CONTAINER = document.getElementById('random-list-container');
const RANDOM_PROMPT = document.getElementById('random-prompt');
const HISTORY_LIST = document.getElementById('history-list');
const ALL_LIST = document.getElementById('all-list');
const VIEWS = document.querySelectorAll('.view');
const NAV_ITEMS = document.querySelectorAll('.navigation-footer__item');
const RANDOM_WRAPPER = document.getElementById('random-content-wrapper');

const STORAGE_KEY = 'pictEroticaHistory';
const MAX_RANDOM_WORDS = 4;

let allWords = [];
let currentView = 'random'; 

const loadAndCleanWords = () => {
    const rawData = window.begriffeRaw || ''; 
    
    allWords = rawData
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const pipeIndex = line.indexOf('|');
            return pipeIndex !== -1 ? line.substring(0, pipeIndex) : line;
        });
    
    if (allWords.length === 0) {
        console.error("Die Begriffsliste ist leer. Bitte die Datei begriffe.js prüfen.");
    }
};


// II. SPEICHERUNG UND VERLAUF (Logik unverändert)
const loadHistory = () => {
    try {
        const historyJson = localStorage.getItem(STORAGE_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error("Fehler beim Laden des LocalStorage:", e);
        return [];
    }
};

const saveSelection = (word) => {
    const history = loadHistory();
    if (history.length > 0 && history[0].word === word) {
        return; 
    }

    const timestamp = new Date().toLocaleString('de-DE', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    history.unshift({ word, timestamp });
    const limitedHistory = history.slice(0, 50); 

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    } catch (e) {
        console.error("Fehler beim Speichern des LocalStorage:", e);
    }
};


// III. VIEW MANAGEMENT (TEMPLATING)

const switchView = (viewName) => {
    setActiveNav(viewName);
    currentView = viewName;
    
    VIEWS.forEach(view => {
        view.classList.add('view--hidden');
    });
    
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
        targetView.classList.remove('view--hidden');
    }
    
    // Management des Haupt-Buttons (nur bei Random sichtbar)
    RANDOM_ACTION_BUTTON.style.display = (viewName === 'random') ? 'block' : 'none';
};

const setActiveNav = (viewName) => {
    NAV_ITEMS.forEach(item => {
        item.classList.remove('navigation-footer__item--active');
        if (item.dataset.view === viewName) {
            item.classList.add('navigation-footer__item--active');
        }
    });
};

/**
 * Phase 1: Zeigt die View mit vier zufälligen Begriffen zur Auswahl an.
 */
const renderRandomSelection = () => {
    switchView('random');
    
    // Stellt den Zustand der Elemente vor der Auswahl wieder her
    RANDOM_PROMPT.classList.remove('single-view__instruction');
    RANDOM_PROMPT.textContent = "Wähle den Begriff aus, den du mit Karten legen möchtest:";
    
    if (allWords.length < MAX_RANDOM_WORDS) {
        RANDOM_LIST_CONTAINER.innerHTML = `<p>Nicht genügend Begriffe in der Liste.</p>`;
        return;
    }

    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    const randomWords = shuffled.slice(0, MAX_RANDOM_WORDS);

    let html = ``;
    randomWords.forEach(word => {
        html += `<div class="card-item" data-word="${word}">${word}</div>`;
    });
    
    RANDOM_LIST_CONTAINER.innerHTML = html;

    // Event Listener für die Auswahl hinzufügen
    document.querySelectorAll('.card-item').forEach(card => {
        card.addEventListener('click', (event) => {
            const selectedWord = event.target.dataset.word;
            renderSingleSelected(selectedWord);
            saveSelection(selectedWord);
        });
    });
};

/**
 * Phase 2: Zeigt nur den ausgewählten Begriff in der Mitte an.
 * @param {string} word 
 */
const renderSingleSelected = (word) => {
    // 1. Alle Karten löschen und nur die ausgewählte Karte rendern
    RANDOM_LIST_CONTAINER.innerHTML = `<div class="card-item card-item--selected single-view__card">${word}</div>`;
    
    // 2. Prompt anpassen
    RANDOM_PROMPT.classList.add('single-view__instruction');
    RANDOM_PROMPT.textContent = "Der Begriff wurde ausgewählt. Lege ihn jetzt mit den Karten.";
};


/**
 * Zeigt den Verlauf der ausgewählten Begriffe an.
 */
const renderHistory = () => {
    switchView('history');
    
    const history = loadHistory();
    let html = ``;
    
    if (history.length === 0) {
        html += `<li class="list-wrapper__list-item">Bisher wurden keine Begriffe ausgewählt.</li>`;
    } else {
        history.forEach(item => {
            html += `<li class="list-wrapper__list-item"><span>${item.word}</span> <span class="list-wrapper__timestamp">${item.timestamp}</span></li>`;
        });
    }
    
    HISTORY_LIST.innerHTML = html;
};

/**
 * Zeigt die vollständige Liste aller Begriffe an.
 */
const renderAllWords = () => {
    switchView('all');
    
    let html = ``;
    allWords.forEach(word => {
        // Da list-style: none im CSS gesetzt ist, keine Bullets
        html += `<li class="list-wrapper__list-item">${word}</li>`;
    });
    
    ALL_LIST.innerHTML = html;
    
    document.getElementById('all-list-title').textContent = `Alle ${allWords.length} Begriffe`;
};

/**
 * Zeigt die Credits-Seite an.
 */
const renderCredits = () => {
    switchView('credits');
    // Inhalt ist statisch in der HTML
};


// IV. INITIALISIERUNG UND NAVIGATION

document.addEventListener('DOMContentLoaded', () => {
    // 1. Daten laden und bereinigen
    loadAndCleanWords();

    // 2. Navigation-Buttons
    document.getElementById('show-random-action').addEventListener('click', renderRandomSelection);
    
    NAV_ITEMS.forEach(button => {
        button.addEventListener('click', (event) => {
            const view = event.currentTarget.dataset.view;
            switch (view) {
                case 'random':
                    renderRandomSelection();
                    break;
                case 'history':
                    renderHistory();
                    break;
                case 'all':
                    renderAllWords();
                    break;
                case 'credits':
                    renderCredits();
                    break;
            }
        });
    });
    
    // 3. Startansicht laden
    renderRandomSelection();
});