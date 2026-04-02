// 1. Bepaal de standaardtaal op basis van localStorage of de browser
const supportedLanguages = ['nl', 'en', 'fr', 'de'];
const storedLanguage = localStorage.getItem('taal') || localStorage.getItem('i18nextLng');
const browserLanguage = navigator.language.split('-')[0];
const userLang = supportedLanguages.includes(storedLanguage)
    ? storedLanguage
    : supportedLanguages.includes(browserLanguage)
        ? browserLanguage
        : 'nl';

// 2. Initialiseer i18next
i18next
  .use(i18nextHttpBackend) // Activeer de plugin om JSON te laden
  .use(i18nextBrowserLanguageDetector) 
  .init({
    lng: userLang,          // Gebruik eerst de opgeslagen of ondersteunde browsertaal
    fallbackLng: 'en',     // Val terug op Engels als NL niet bestaat
    supportedLngs: supportedLanguages,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'taal',
      caches: ['localStorage']
    },
    backend: {
      // 2. Vertel waar de JSON bestanden staan. {{lng}} wordt automatisch 'nl' of 'en'
      loadPath: '/locales/{{lng}}.json' 
    }
  })
  .then(function() {
    // 3. Deze code draait pas zodra de JSON succesvol is gedownload
    // Initialize
    updateValueDisplays();
    updateUI();
  });

function vertaalPagina() {
    document.documentElement.lang = i18next.resolvedLanguage || userLang;

    // Zoek alle elementen met een data-i18n attribuut in de HTML
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
        const key = el.getAttribute('data-i18n'); // Bijv: 'welkomst_titel'
        el.innerText = i18next.t(key);            // Haal de tekst uit de JSON en plak het in de HTML
    });
}

const languageButtons = document.querySelectorAll('[data-language-option]');

function updateLanguageSwitcher() {
    const activeLanguage = i18next.resolvedLanguage || i18next.language || userLang;

    languageButtons.forEach(button => {
        const isActive = button.dataset.languageOption === activeLanguage;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

// 3. Functie om alle teksten in de interface te updaten
function updateUI() {
    vertaalPagina();
    updateLanguageSwitcher();
    renderExtraCosts();
    toggleAnalysisSettings();
    setChartMobileView(activeChartView);
    updateValueDisplays();
    updateChart();
    
    // Variabelen doorgeven aan de vertaling
    //document.getElementById('greeting').textContent = i18next.t('groet', { naam: 'Stijn' });
  }
  
// 4. Taal wijzigen via een dropdown of knop
function veranderTaal(nieuweTaal) {
    i18next.changeLanguage(nieuweTaal).then(() => {
        localStorage.setItem('taal', nieuweTaal);
        localStorage.removeItem('i18nextLng');
        updateUI();
    });
}

languageButtons.forEach(button => {
    button.addEventListener('click', () => {
        veranderTaal(button.dataset.languageOption);
    });
});

// Get DOM elements
const currentAge1Slider = document.getElementById('currentAge1');
const retirementAge1Slider = document.getElementById('retirementAge1');
const endAge1Slider = document.getElementById('endAge1');
const currentAge2Slider = document.getElementById('currentAge2');
const retirementAge2Slider = document.getElementById('retirementAge2');
const endAge2Slider = document.getElementById('endAge2');
const currentAssetsSlider = document.getElementById('currentAssets');
const portfolioReturnsSlider = document.getElementById('portfolioReturns');
const annualSpendingSlider = document.getElementById('annualSpending');
const annualContributionSlider = document.getElementById('annualContribution');
const annualContribution2Slider = document.getElementById('annualContribution2');
const inflationSlider = document.getElementById('inflation');
const pensionAgeSlider = document.getElementById('pensionAge');
const monthlyPensionSlider = document.getElementById('monthlyPension');
const pensionAge2Slider = document.getElementById('pensionAge2');
const monthlyPension2Slider = document.getElementById('monthlyPension2');
const showRealValuesCheckbox = document.getElementById('showRealValues');
const analysisModeSelect = document.getElementById('analysisMode');
const simulationCountSlider = document.getElementById('simulationCount');
const returnVolatilitySlider = document.getElementById('returnVolatility');
const inflationVolatilitySlider = document.getElementById('inflationVolatility');
const analysisAdvancedSettings = document.getElementById('analysisAdvancedSettings');
const extraCostsList = document.getElementById('extraCostsList');
const extraCostsEmptyState = document.getElementById('extraCostsEmptyState');
const addCustomCostButton = document.getElementById('addCustomCostButton');
const extraCostPresetButtons = document.querySelectorAll('[data-extra-cost-preset]');
const chartPanel = document.querySelector('.chart-panel');
const chartViewButtons = document.querySelectorAll('[data-chart-view]');
const portfolioChartSummary = document.getElementById('portfolioChartSummary');
const cashflowChartSummary = document.getElementById('cashflowChartSummary');

const currentAge1Value = document.getElementById('currentAge1Value');
const retirementAge1Value = document.getElementById('retirementAge1Value');
const endAge1Value = document.getElementById('endAge1Value');
const currentAge2Value = document.getElementById('currentAge2Value');
const retirementAge2Value = document.getElementById('retirementAge2Value');
const endAge2Value = document.getElementById('endAge2Value');
const currentAssetsValue = document.getElementById('currentAssetsValue');
const portfolioReturnsValue = document.getElementById('portfolioReturnsValue');
const annualSpendingValue = document.getElementById('annualSpendingValue');
const annualContributionValue = document.getElementById('annualContributionValue');
const annualContribution2Value = document.getElementById('annualContribution2Value');
const inflationValue = document.getElementById('inflationValue');
const pensionAgeValue = document.getElementById('pensionAgeValue');
const monthlyPensionValue = document.getElementById('monthlyPensionValue');
const pensionAge2Value = document.getElementById('pensionAge2Value');
const monthlyPension2Value = document.getElementById('monthlyPension2Value');
const simulationCountValue = document.getElementById('simulationCountValue');
const returnVolatilityValue = document.getElementById('returnVolatilityValue');
const inflationVolatilityValue = document.getElementById('inflationVolatilityValue');

// Chart setup
const ctx = document.getElementById('portfolioChart').getContext('2d');
const cashflowCtx = document.getElementById('cashflowChart').getContext('2d');
let portfolioChart = null;
let cashflowChart = null;

const EXTRA_COSTS_STORAGE_KEY = 'fireExtraCosts';
const SHOW_REAL_VALUES_STORAGE_KEY = 'showRealValues';
const CHART_VIEW_STORAGE_KEY = 'activeChartView';
const ANALYSIS_MODE_STORAGE_KEY = 'analysisMode';
const EXTRA_COST_YEAR_MIN = new Date().getFullYear();
const EXTRA_COST_YEAR_MAX = EXTRA_COST_YEAR_MIN + 60;

let extraCosts = []; // array van { id, preset, label, type, amount, startYear, endYear }
let activeChartView = localStorage.getItem(CHART_VIEW_STORAGE_KEY) || 'portfolio';

// Format number with spaces as thousand separators (European style)
function formatNumber(num) {
    if (num >= 1000000 || num <= -1000000) {
        return '€ ' + (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 10000 || num <= -1000) {
        return '€ ' + (num / 1000).toFixed(0) + 'K';
    }
    return '€ ' + (num / 1000).toFixed(1) + 'K';
    //return '€ ' + Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getNumberLocale() {
    const activeLanguage = i18next.resolvedLanguage || i18next.language || userLang;

    if (activeLanguage === 'nl') return 'nl-BE';
    if (activeLanguage === 'fr') return 'fr-BE';
    if (activeLanguage === 'de') return 'de-DE';
    return 'en-BE';
}

function formatEuroAmount(num) {
    return new Intl.NumberFormat(getNumberLocale(), {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(Number(num));
}

function formatCompactEuroAmount(num) {
    const value = Number(num);
    const absoluteValue = Math.abs(value);

    if (absoluteValue >= 1000000) {
        return '\u20AC ' + new Intl.NumberFormat(getNumberLocale(), {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }).format(value / 1000000) + 'M';
    }

    if (absoluteValue >= 10000) {
        return '\u20AC ' + new Intl.NumberFormat(getNumberLocale(), {
            maximumFractionDigits: 0
        }).format(value / 1000) + 'K';
    }

    return formatEuroAmount(value);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getExtraCostPresetLabel(preset) {
    const presetKeyByType = {
        car: 'presetCar',
        studies: 'presetStudies',
        mortgage: 'presetMortgage',
        renovation: 'presetRenovation',
        healthcare: 'presetHealthcare',
        travel: 'presetTravel',
        other: 'addCustomCost'
    };

    return i18next.t(presetKeyByType[preset] || 'addCustomCost');
}

function getStudiesLabel() {
    const nextIndex = extraCosts.filter(cost => cost.preset === 'studies').length + 1;
    return `${getExtraCostPresetLabel('studies')} ${nextIndex}`;
}

function getDefaultExtraCostLabel(preset) {
    if (preset === 'studies') {
        return getStudiesLabel();
    }

    if (preset === 'other') {
        return `${i18next.t('extras')} ${extraCosts.length + 1}`;
    }

    return getExtraCostPresetLabel(preset);
}

function createExtraCost(preset = 'other') {
    const type = preset === 'studies' || preset === 'mortgage' ? 'yearly' : 'one-time';
    const startYear = EXTRA_COST_YEAR_MIN;
    const endYear = type === 'yearly' ? Math.min(startYear + 3, EXTRA_COST_YEAR_MAX) : startYear;

    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        preset,
        label: getDefaultExtraCostLabel(preset),
        type,
        amount: 0,
        startYear,
        endYear
    };
}

function normalizeExtraCost(cost, index = 0) {
    const startYear = Math.min(EXTRA_COST_YEAR_MAX, Math.max(EXTRA_COST_YEAR_MIN, parseInt(cost.startYear, 10) || EXTRA_COST_YEAR_MIN));
    let endYear = Math.min(EXTRA_COST_YEAR_MAX, Math.max(startYear, parseInt(cost.endYear, 10) || startYear));
    const type = cost.type === 'yearly' ? 'yearly' : 'one-time';

    if (type === 'one-time') {
        endYear = startYear;
    }

    return {
        id: cost.id || `migrated-${index}-${Date.now()}`,
        preset: cost.preset || 'other',
        label: (cost.label || '').trim() || ((cost.preset || 'other') === 'other' ? `Extra ${index + 1}` : getDefaultExtraCostLabel(cost.preset || 'other')),
        type,
        amount: Math.max(0, parseFloat(cost.amount) || 0),
        startYear,
        endYear
    };
}

function migrateLegacyExtraCosts() {
    const migratedCosts = [];

    for (let index = 1; index <= 3; index++) {
        const amount = parseFloat(localStorage.getItem(`cost${index}`)) || 0;
        const startYear = parseInt(localStorage.getItem(`cost${index}BeginYear`), 10) || EXTRA_COST_YEAR_MIN;
        const endYear = parseInt(localStorage.getItem(`cost${index}EndYear`), 10) || startYear;

        if (amount <= 0) {
            continue;
        }

        migratedCosts.push(normalizeExtraCost({
            id: `legacy-${index}`,
            preset: 'other',
            label: `Extra ${index}`,
            type: startYear === endYear ? 'one-time' : 'yearly',
            amount,
            startYear,
            endYear
        }, index));
    }

    return migratedCosts;
}

function loadExtraCostsFromStorage() {
    const savedCosts = localStorage.getItem(EXTRA_COSTS_STORAGE_KEY);

    if (savedCosts) {
        try {
            const parsedCosts = JSON.parse(savedCosts);
            if (Array.isArray(parsedCosts)) {
                return parsedCosts.map((cost, index) => normalizeExtraCost(cost, index));
            }
        } catch (error) {
            console.warn('Could not parse saved extra costs.', error);
        }
    }

    return migrateLegacyExtraCosts();
}

function saveExtraCostsToStorage() {
    localStorage.setItem(EXTRA_COSTS_STORAGE_KEY, JSON.stringify(extraCosts));
}

function getExtraCostSummary(cost) {
    const costTypeLabel = i18next.t(cost.type === 'yearly' ? 'extraCostYearly' : 'extraCostOneTime');
    const yearLabel = cost.type === 'yearly'
        ? `${cost.startYear}-${cost.endYear}`
        : `${cost.startYear}`;

    return `${costTypeLabel} | ${yearLabel}`;
}

function renderExtraCosts() {
    if (!extraCostsList || !extraCostsEmptyState) {
        return;
    }

    if (extraCosts.length === 0) {
        extraCostsList.innerHTML = '';
        extraCostsEmptyState.classList.remove('is-hidden');
        return;
    }

    extraCostsEmptyState.classList.add('is-hidden');
    extraCostsList.innerHTML = extraCosts.map(cost => {
        const displayLabel = escapeHtml(cost.label || getDefaultExtraCostLabel(cost.preset));
        const summary = escapeHtml(getExtraCostSummary(cost));
        const isYearly = cost.type === 'yearly';
        const yearOptions = Array.from({ length: EXTRA_COST_YEAR_MAX - EXTRA_COST_YEAR_MIN + 1 }, (_, offset) => {
            const year = EXTRA_COST_YEAR_MIN + offset;
            return `<option value="${year}" ${year === cost.startYear ? 'selected' : ''}>${year}</option>`;
        }).join('');
        const endYearOptions = Array.from({ length: EXTRA_COST_YEAR_MAX - EXTRA_COST_YEAR_MIN + 1 }, (_, offset) => {
            const year = EXTRA_COST_YEAR_MIN + offset;
            return `<option value="${year}" ${year === cost.endYear ? 'selected' : ''}>${year}</option>`;
        }).join('');
        const getActionAttributes = (action, field = '', value = '') => {
            const safeField = String(field);
            const safeValue = String(value);
            return `onclick="window.handleExtraCostActionByParams('${cost.id}','${action}','${safeField}','${safeValue}'); return false;" onpointerup="window.handleExtraCostActionByParams('${cost.id}','${action}','${safeField}','${safeValue}'); return false;"`;
        };

        return `
            <details class="extra-cost-item" data-cost-id="${cost.id}">
                <summary>
                    <div class="extra-cost-summary-main">
                        <span class="extra-cost-title">${displayLabel}</span>
                        <span class="extra-cost-meta">${summary}</span>
                    </div>
                </summary>
                <div class="extra-cost-body">
                    <div class="extra-cost-grid">
                        <div class="field-group">
                            <span class="field-label">${escapeHtml(i18next.t('extraCostName'))}</span>
                            <input type="text" data-field="label" value="${displayLabel}" maxlength="60">
                        </div>
                        <div class="field-group">
                            <span class="field-label">${escapeHtml(i18next.t('extraCostAmount'))}</span>
                            <input type="text" data-field="amount" inputmode="numeric" value="${cost.amount}">
                        </div>
                        <div class="field-group">
                            <span class="field-label">${escapeHtml(i18next.t('beginyear'))}</span>
                            <select data-field="startYear">${yearOptions}</select>
                        </div>
                        <div class="field-group">
                            <span class="field-label">${escapeHtml(i18next.t('endyear'))}</span>
                            <select data-field="endYear" ${isYearly ? '' : 'disabled'}>${endYearOptions}</select>
                        </div>
                    </div>
                    <div class="field-group">
                        <span class="field-label">${escapeHtml(i18next.t('extraCostType'))}</span>
                        <select data-field="type">
                            <option value="one-time" ${isYearly ? '' : 'selected'}>${escapeHtml(i18next.t('extraCostOneTime'))}</option>
                            <option value="yearly" ${isYearly ? 'selected' : ''}>${escapeHtml(i18next.t('extraCostYearly'))}</option>
                        </select>
                    </div>
                    <div class="extra-cost-actions">
                        <button type="button" class="remove-cost-button" data-action="remove-cost" ${getActionAttributes('remove-cost')}>${escapeHtml(i18next.t('extraCostRemove'))}</button>
                    </div>
                </div>
            </details>
        `;
    }).join('');
}

function syncExtraCostCard(costId) {
    const card = extraCostsList ? extraCostsList.querySelector(`[data-cost-id="${costId}"]`) : null;
    const cost = extraCosts.find(item => item.id === costId);

    if (!card || !cost) {
        return;
    }

    const title = card.querySelector('.extra-cost-title');
    const meta = card.querySelector('.extra-cost-meta');
    const labelInput = card.querySelector('[data-field="label"]');
    const amountInput = card.querySelector('[data-field="amount"]');
    const startYearInput = card.querySelector('[data-field="startYear"]');
    const endYearInput = card.querySelector('[data-field="endYear"]');
    const typeInput = card.querySelector('[data-field="type"]');

    if (title) {
        title.textContent = cost.label || getDefaultExtraCostLabel(cost.preset);
    }

    if (meta) {
        meta.textContent = getExtraCostSummary(cost);
    }

    if (labelInput) {
        labelInput.value = cost.label || getDefaultExtraCostLabel(cost.preset);
    }

    if (amountInput) {
        amountInput.value = cost.amount;
    }

    if (startYearInput) {
        startYearInput.value = cost.startYear;
    }

    if (endYearInput) {
        endYearInput.value = cost.endYear;
        endYearInput.disabled = cost.type !== 'yearly';
    }

    if (typeInput) {
        typeInput.value = cost.type;
    }
}

function getExtraCostFieldDefault(cost, field) {
    if (field === 'amount') {
        return 0;
    }

    if (field === 'type') {
        return cost.type || 'one-time';
    }

    if (field === 'endYear') {
        return cost.type === 'yearly' ? cost.startYear : cost.startYear;
    }

    return EXTRA_COST_YEAR_MIN;
}

function applyExtraCostFieldUpdate(cost, field, rawValue) {
    const numericFields = new Set(['amount', 'startYear', 'endYear']);

    if (numericFields.has(field)) {
        const cleanedValue = String(rawValue).replace(/[^\d]/g, '');
        const parsedValue = cleanedValue === '' ? getExtraCostFieldDefault(cost, field) : parseInt(cleanedValue, 10);
        cost[field] = field === 'amount'
            ? Math.max(0, parsedValue || 0)
            : parsedValue;
    } else if (field === 'type') {
        cost.type = rawValue === 'yearly' ? 'yearly' : 'one-time';
    } else {
        cost[field] = String(rawValue).trimStart();
    }

    if (cost.startYear < EXTRA_COST_YEAR_MIN) cost.startYear = EXTRA_COST_YEAR_MIN;
    if (cost.startYear > EXTRA_COST_YEAR_MAX) cost.startYear = EXTRA_COST_YEAR_MAX;

    if (cost.type === 'one-time') {
        cost.endYear = cost.startYear;
    } else {
        if (cost.endYear < cost.startYear) cost.endYear = cost.startYear;
        if (cost.endYear > EXTRA_COST_YEAR_MAX) cost.endYear = EXTRA_COST_YEAR_MAX;
    }
}

function addExtraCost(preset = 'other') {
    const newCost = createExtraCost(preset);
    extraCosts.push(newCost);
    saveExtraCostsToStorage();
    renderExtraCosts();
    const newCard = extraCostsList ? extraCostsList.querySelector(`[data-cost-id="${newCost.id}"]`) : null;
    if (newCard) {
        newCard.open = true;
        const labelInput = newCard.querySelector('[data-field="label"]');
        if (labelInput) {
            labelInput.focus();
            labelInput.select();
        }
    }
    updateChart();
}

extraCosts = loadExtraCostsFromStorage();

function handleExtraCostActionByParams(costId, action, field = '', actionValue = '') {
    const card = extraCostsList ? extraCostsList.querySelector(`[data-cost-id="${costId}"]`) : null;
    const now = Date.now();
    const signature = `${costId}:${action}:${field}:${actionValue}`;

    if (handleExtraCostActionByParams.lastSignature === signature && now - (handleExtraCostActionByParams.lastTs || 0) < 250) {
        return;
    }

    handleExtraCostActionByParams.lastSignature = signature;
    handleExtraCostActionByParams.lastTs = now;

    if (!card) {
        return;
    }

    const costIndex = extraCosts.findIndex(item => item.id === costId);

    if (costIndex === -1) {
        return;
    }

    if (action === 'remove-cost') {
        extraCosts.splice(costIndex, 1);
        saveExtraCostsToStorage();
        renderExtraCosts();
        updateChart();
        return;
    }

    if (action === 'step-field') {
        const step = parseInt(actionValue, 10) || 0;
        const cardInput = card.querySelector(`input[data-field="${field}"]`);
        const currentValueFromInput = cardInput ? String(cardInput.value).replace(/[^\d]/g, '') : '';
        const currentValue = currentValueFromInput === ''
            ? getExtraCostFieldDefault(extraCosts[costIndex], field)
            : parseInt(currentValueFromInput, 10);
        applyExtraCostFieldUpdate(extraCosts[costIndex], field, currentValue + step);
        saveExtraCostsToStorage();
        syncExtraCostCard(extraCosts[costIndex].id);
        updateChart();
        return;
    }

    if (action === 'set-type') {
        extraCosts[costIndex].type = actionValue === 'yearly' ? 'yearly' : 'one-time';
        if (extraCosts[costIndex].type === 'one-time') {
            extraCosts[costIndex].endYear = extraCosts[costIndex].startYear;
        } else if (extraCosts[costIndex].endYear < extraCosts[costIndex].startYear) {
            extraCosts[costIndex].endYear = extraCosts[costIndex].startYear;
        }
        saveExtraCostsToStorage();
        syncExtraCostCard(extraCosts[costIndex].id);
        updateChart();
    }
}

window.handleExtraCostActionByParams = handleExtraCostActionByParams;

function setChartMobileView(view) {
    activeChartView = view === 'cashflow' ? 'cashflow' : 'portfolio';
    localStorage.setItem(CHART_VIEW_STORAGE_KEY, activeChartView);

    if (chartPanel) {
        chartPanel.dataset.mobileView = activeChartView;
    }

    chartViewButtons.forEach(button => {
        const isActive = button.dataset.chartView === activeChartView;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function getAnalysisMode() {
    const allowedModes = new Set([
        'deterministic',
        'monte-carlo',
        'stress-bear',
        'stress-inflation',
        'stress-extra-cost',
        'stress-pension'
    ]);

    return analysisModeSelect && allowedModes.has(analysisModeSelect.value)
        ? analysisModeSelect.value
        : 'deterministic';
}

function toggleAnalysisSettings() {
    if (!analysisAdvancedSettings) {
        return;
    }

    analysisAdvancedSettings.classList.toggle('is-hidden', getAnalysisMode() !== 'monte-carlo');
}

function getStressScenarioDefinition(mode, inputs) {
    const simulationStartYear = new Date().getFullYear();
    const shockYearOffset = Math.min(5, Math.max(1, getProjectionDuration(inputs) - 1));
    const shockYear = simulationStartYear + shockYearOffset;
    const shockAmount = Math.max(25000, Math.round(inputs.annualSpending * 0.75 / 1000) * 1000);

    const definitions = {
        'stress-bear': {
            labelKey: 'analysisModeStressBear',
            lineLabelKey: 'stressLineBear',
            summaryKey: 'stressSummaryBear',
            color: '#b24a3f',
            scenario: {
                annualReturnRates: [-0.18, -0.1, 0].map((rate, index) => rate).concat(
                    Array.from({ length: Math.max(0, getProjectionDuration(inputs) - 3) }, () => inputs.annualReturn / 100)
                )
            }
        },
        'stress-inflation': {
            labelKey: 'analysisModeStressInflation',
            lineLabelKey: 'stressLineInflation',
            summaryKey: 'stressSummaryInflation',
            color: '#b07a17',
            scenario: {
                annualInflationRates: [0.05, 0.06, 0.07, 0.06, 0.05].concat(
                    Array.from({ length: Math.max(0, getProjectionDuration(inputs) - 5) }, () => inputs.inflation / 100)
                )
            }
        },
        'stress-extra-cost': {
            labelKey: 'analysisModeStressExtraCost',
            lineLabelKey: 'stressLineExtraCost',
            summaryKey: 'stressSummaryExtraCost',
            color: '#8d5a2b',
            summaryParams: {
                year: shockYear,
                amount: shockAmount
            },
            scenario: {
                extraCostShocks: {
                    [shockYearOffset]: shockAmount
                }
            }
        },
        'stress-pension': {
            labelKey: 'analysisModeStressPension',
            lineLabelKey: 'stressLinePension',
            summaryKey: 'stressSummaryPension',
            color: '#7a4fa3',
            scenario: {
                pension1Multiplier: 0.8,
                pension2Multiplier: 0.8
            }
        }
    };

    return definitions[mode] || null;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function getSimulationInputs() {
    return {
        currentAge1: parseInt(currentAge1Slider.value, 10),
        retirementAge1: parseInt(retirementAge1Slider.value, 10),
        endAge1: parseInt(endAge1Slider.value, 10),
        currentAge2: parseInt(currentAge2Slider.value, 10),
        retirementAge2: parseInt(retirementAge2Slider.value, 10),
        endAge2: parseInt(endAge2Slider.value, 10),
        pensionAge: parseInt(pensionAgeSlider.value, 10),
        monthlyPension: parseFloat(monthlyPensionSlider.value),
        pensionAge2: parseInt(pensionAge2Slider.value, 10),
        monthlyPension2: parseFloat(monthlyPension2Slider.value),
        currentAssets: parseFloat(currentAssetsSlider.value),
        annualReturn: parseFloat(portfolioReturnsSlider.value),
        annualSpending: parseFloat(annualSpendingSlider.value),
        annualContribution: parseFloat(annualContributionSlider.value),
        annualContribution2: parseFloat(annualContribution2Slider.value),
        inflation: parseFloat(inflationSlider.value)
    };
}

function getProjectionDuration(inputs) {
    return Math.max(inputs.endAge1 - inputs.currentAge1, inputs.endAge2 - inputs.currentAge2);
}

function getScenarioRate(rates, index, fallbackRate) {
    if (Array.isArray(rates) && rates[index] !== undefined) {
        return rates[index];
    }

    return fallbackRate;
}

function buildInflationFactors(duration, inflationRates, fallbackRate) {
    const inflationFactors = [1];

    for (let year = 1; year <= duration; year++) {
        const rate = getScenarioRate(inflationRates, year - 1, fallbackRate);
        inflationFactors[year] = inflationFactors[year - 1] * (1 + rate);
    }

    return inflationFactors;
}

function getExtraCostAmountForYear(currentYear, inflationRate, startYear) {
    return extraCosts.reduce((total, cost) => {
        if (currentYear < cost.startYear || currentYear > cost.endYear) {
            return total;
        }

        return total + (cost.amount * Math.pow(1 + inflationRate, currentYear - startYear));
    }, 0);
}

function getExtraCostAmountForOffset(offset, simulationStartYear, inflationFactors) {
    const currentYear = simulationStartYear + offset;
    const inflationFactor = inflationFactors[offset] || 1;

    return extraCosts.reduce((total, cost) => {
        if (currentYear < cost.startYear || currentYear > cost.endYear) {
            return total;
        }

        return total + (cost.amount * inflationFactor);
    }, 0);
}

function getChartXAxisLabel(data, index, isMobile) {
    const year = data.years[index];
    const age1 = data.ages1[index];
    const age2 = data.ages2[index];

    if (year === undefined) {
        return '';
    }

    if (isMobile) {
        return `${year}`;
    }

    return [
        `${year}`,
        age1 !== undefined ? `${age1}` + i18next.t('yearShort') : '',
        age2 !== undefined ? `${age2}` + i18next.t('yearShort') : ''
    ];
}

function updateCashflowSummary(data, helpers = {}) {
    if (!cashflowChartSummary) {
        return;
    }

    const formatAmountForYear = helpers.formatAmountForYear || ((value) => formatEuroAmount(value));

    const worstNetValue = Math.min(...data.cashflowNet);
    const worstNetIndex = data.cashflowNet.indexOf(worstNetValue);
    const firstPensionIndex = data.cashflowPensions.findIndex(value => value > 0);

    const summaryParts = [];

    if (worstNetIndex >= 0) {
        summaryParts.push(
            i18next.t('cashflowSummaryWorst', {
                year: data.years[worstNetIndex],
                amount: formatAmountForYear(worstNetValue, data.years[worstNetIndex])
            })
        );
    }

    if (firstPensionIndex >= 0) {
        summaryParts.push(
            i18next.t('cashflowSummaryFirstPension', {
                year: data.years[firstPensionIndex]
            })
        );
    }

    if (getAnalysisMode() === 'monte-carlo') {
        summaryParts.push(i18next.t('cashflowSummaryBaseCase'));
    }

    cashflowChartSummary.textContent = summaryParts.join('  |  ');
}

// Calculate portfolio growth and depletion
function calculatePortfolioGrowth(currentAge1, retirementAge1, endAge1, currentAge2, retirementAge2, endAge2, currentAssets, annualReturn, annualSpending, annualContribution, annualContribution2, inflation, pensionAge, monthlyPension, pensionAge2, monthlyPension2) {
    const yearsToRetirement1 = retirementAge1 - currentAge1;
    const yearsToRetirement2 = retirementAge2 - currentAge2;
    const data = {
        years: [],
        ages1: [],
        ages2: [],
        values: [],
        growthYears: [],
        growthValues: [],
        oneWorksYears: [],
        oneWorksValues: [],
        withdrawalYears: [],
        withdrawalValues: [],
        cashflowContributions: [],
        cashflowPensions: [],
        cashflowSpending: [],
        cashflowExtras: [],
        cashflowNet: [],
        fireAge: null,
        fireValue: null
    };
    
    let portfolioValue = currentAssets;
    const annualReturnRate = annualReturn / 100;
    const inflationRate = inflation / 100;
    const simulationStartYear = new Date().getFullYear();
    
    // Start with base values
    let currentAnnualSpending = annualSpending;
    
    // Add starting point
    data.years.push(simulationStartYear)
    const currentYear = data.years.at(-1); // voor fase 1 en 2
    const currentYearExtraCosts = getExtraCostAmountForYear(currentYear, inflationRate, simulationStartYear);
    portfolioValue -= currentYearExtraCosts;
    if (portfolioValue < 0) portfolioValue = 0;
    data.ages1.push(currentAge1);
    data.ages2.push(currentAge2);
    data.values.push(portfolioValue);
    data.growthYears.push(data.years[0]);
    data.growthValues.push(portfolioValue);
    data.cashflowContributions.push(0);
    data.cashflowPensions.push(0);
    data.cashflowSpending.push(0);
    data.cashflowExtras.push(currentYearExtraCosts);
    data.cashflowNet.push(-currentYearExtraCosts);
    
    let currentAnnualContribution = annualContribution
    for (let year = 1; year <= Math.min(yearsToRetirement1, yearsToRetirement2); year++) {
        // Apply inflation to contribution at the start of each year
        if (year > 1) {
            currentAnnualContribution = currentAnnualContribution * (1 + inflationRate);
        }
       
        portfolioValue = portfolioValue * (1 + annualReturnRate) + currentAnnualContribution;
       
        const currentYear = data.years.at(-1) + 1; // voor fase 1 en 2
        const extraCostThisYear = getExtraCostAmountForYear(currentYear, inflationRate, simulationStartYear);
        portfolioValue -= extraCostThisYear;
        if (portfolioValue < 0) portfolioValue = 0;
        
        // Store yearly value
        data.years.push(data.years.at(-1)+1)
        data.ages1.push(data.ages1.at(-1)+1);
        data.ages2.push(data.ages2.at(-1)+1);
        data.values.push(portfolioValue);
        data.growthYears.push(data.years.at(-1));
        data.growthValues.push(portfolioValue);
        data.cashflowContributions.push(currentAnnualContribution);
        data.cashflowPensions.push(0);
        data.cashflowSpending.push(0);
        data.cashflowExtras.push(extraCostThisYear);
        data.cashflowNet.push(currentAnnualContribution - extraCostThisYear);
    }

    if (yearsToRetirement1 != yearsToRetirement2) {
        // Door:
        const yearsSoFar = Math.min(yearsToRetirement1, yearsToRetirement2);
        currentAnnualContribution = annualContribution2 * Math.pow(1 + inflationRate, yearsSoFar);
            

        data.oneWorksYears.push(data.years.at(-1));
        data.oneWorksValues.push(portfolioValue);

        for (let year = 1; year <= Math.max(yearsToRetirement1, yearsToRetirement2) - Math.min(yearsToRetirement1, yearsToRetirement2);year++) {
            if (year > 1) {
                currentAnnualContribution = currentAnnualContribution * (1 + inflationRate);
            }
           
            portfolioValue = portfolioValue * (1 + annualReturnRate) + currentAnnualContribution;

            const currentYear = data.years.at(-1) + 1; // voor fase 1 en 2
            const extraCostThisYear = getExtraCostAmountForYear(currentYear, inflationRate, simulationStartYear);
            portfolioValue -= extraCostThisYear;
            if (portfolioValue < 0) portfolioValue = 0;

            if (portfolioValue <= 0) {
                portfolioValue = 0;
                data.years.push(data.years.at(-1)+1)
                data.ages1.push(data.ages1.at(-1)+1);
                data.ages2.push(data.ages2.at(-1)+1);
                data.values.push(portfolioValue);
                data.oneWorksYears.push(data.years.at(-1));
                data.oneWorksValues.push(portfolioValue);
                data.cashflowContributions.push(currentAnnualContribution);
                data.cashflowPensions.push(0);
                data.cashflowSpending.push(0);
                data.cashflowExtras.push(extraCostThisYear);
                data.cashflowNet.push(currentAnnualContribution - extraCostThisYear);
                break;
            }

            data.years.push(data.years.at(-1)+1)
            data.ages1.push(data.ages1.at(-1)+1);
            data.ages2.push(data.ages2.at(-1)+1);
            data.values.push(portfolioValue);
            data.oneWorksYears.push(data.years.at(-1));
            data.oneWorksValues.push(portfolioValue);
            data.cashflowContributions.push(currentAnnualContribution);
            data.cashflowPensions.push(0);
            data.cashflowSpending.push(0);
            data.cashflowExtras.push(extraCostThisYear);
            data.cashflowNet.push(currentAnnualContribution - extraCostThisYear);
        }
    }

    // Add retirement point to both phases for continuity
    data.withdrawalYears.push(data.years.at(-1));
    data.withdrawalValues.push(portfolioValue);
    
    // Calculate for each year after retirement until end age (withdrawal phase)
    let duration = Math.max(endAge1-data.ages1.at(-1),endAge2-data.ages2.at(-1))
    let startAge1 = data.ages1.at(-1)
    let startAge2 = data.ages2.at(-1)
    for (let year = 1; year <= duration; year++) {
        const currentYearAge1 = startAge1 + year;
        const currentYearAge2 = startAge2 + year;

        // Apply inflation to spending at the start of each year
        if (year === 1) {
            // First year of retirement uses the spending value at retirement age
            // which has been inflated from current age to retirement age
            const yearsFromNow = data.years.at(-1)+1-data.years.at(0);
            currentAnnualSpending = annualSpending * Math.pow(1 + inflationRate, yearsFromNow);
        } else {
            // Each subsequent year, inflate spending
            currentAnnualSpending = currentAnnualSpending * (1 + inflationRate);
        }
        
        // Pension person 1
        let monthlyPension1ThisYear = 0;
        if (currentYearAge1 >= pensionAge && currentYearAge1 <= endAge1) {
            const yearsSincePensionStart = currentYearAge1 - pensionAge;
            if (yearsSincePensionStart === 0) {
                const yearsFromNow = pensionAge - currentAge1;
                monthlyPension1ThisYear = monthlyPension * Math.pow(1 + inflationRate, yearsFromNow);
            } else {
                const totalYears = currentYearAge1 - currentAge1;
                monthlyPension1ThisYear = monthlyPension * Math.pow(1 + inflationRate, totalYears);
            }
        }
        // Pension person 2
        let monthlyPension2ThisYear = 0;
        if (currentYearAge2 >= pensionAge2 && currentYearAge2 <= endAge2) {
            const yearsSincePensionStart = currentYearAge2 - pensionAge2;
            if (yearsSincePensionStart === 0) {
                const yearsFromNow = pensionAge2 - currentAge2;
                monthlyPension2ThisYear = monthlyPension2 * Math.pow(1 + inflationRate, yearsFromNow);
            } else {
                const totalYears = currentYearAge2 - currentAge2;
                monthlyPension2ThisYear = monthlyPension2 * Math.pow(1 + inflationRate, totalYears);
            }
        }        
        const annualPension1ThisYear = monthlyPension1ThisYear * 12;
        const annualPension2ThisYear = monthlyPension2ThisYear * 12;
        const totalAnnualPensionThisYear = annualPension1ThisYear + annualPension2ThisYear;

        // Tip: laat dit negatief kunnen zijn; dan “stort” pensioenoverschot terug in de portefeuille
        const netAnnualWithdrawal = currentAnnualSpending - totalAnnualPensionThisYear;

        portfolioValue = portfolioValue * (1 + annualReturnRate) - netAnnualWithdrawal;

        const currentYear = data.years.at(-1) + 1;
        const extraCostThisYear = getExtraCostAmountForYear(currentYear, inflationRate, simulationStartYear);
        portfolioValue -= extraCostThisYear;
        if (portfolioValue < 0) portfolioValue = 0;

        // Store yearly value
        if (portfolioValue <= 0) {
            portfolioValue = 0;
            data.years.push(data.years.at(-1)+1)
            if (data.ages1.at(-1) < endAge1) data.ages1.push(data.ages1.at(-1)+1);
            if (data.ages2.at(-1) < endAge2) data.ages2.push(data.ages2.at(-1)+1);
            data.values.push(portfolioValue);
            data.withdrawalYears.push(data.years.at(-1));
            data.withdrawalValues.push(portfolioValue);
            data.cashflowContributions.push(0);
            data.cashflowPensions.push(totalAnnualPensionThisYear);
            data.cashflowSpending.push(currentAnnualSpending);
            data.cashflowExtras.push(extraCostThisYear);
            data.cashflowNet.push(totalAnnualPensionThisYear - currentAnnualSpending - extraCostThisYear);
            break;
        }

        data.years.push(data.years.at(-1)+1)
        if (data.ages1.at(-1) < endAge1) data.ages1.push(data.ages1.at(-1)+1);
        if (data.ages2.at(-1) < endAge2) data.ages2.push(data.ages2.at(-1)+1);
        data.values.push(portfolioValue);
        data.withdrawalYears.push(data.years.at(-1));
        data.withdrawalValues.push(portfolioValue);
        data.cashflowContributions.push(0);
        data.cashflowPensions.push(totalAnnualPensionThisYear);
        data.cashflowSpending.push(currentAnnualSpending);
        data.cashflowExtras.push(extraCostThisYear);
        data.cashflowNet.push(totalAnnualPensionThisYear - currentAnnualSpending - extraCostThisYear);
    }
    
    return data;
}

function calculateScenarioPortfolioGrowth(inputs, scenario = {}) {
    const duration = getProjectionDuration(inputs);
    const defaultAnnualReturnRate = inputs.annualReturn / 100;
    const defaultInflationRate = inputs.inflation / 100;
    const annualReturnRates = scenario.annualReturnRates || [];
    const annualInflationRates = scenario.annualInflationRates || [];
    const extraCostShocks = scenario.extraCostShocks || {};
    const pension1Multiplier = scenario.pension1Multiplier ?? 1;
    const pension2Multiplier = scenario.pension2Multiplier ?? 1;
    const inflationFactors = buildInflationFactors(duration, annualInflationRates, defaultInflationRate);
    const simulationStartYear = new Date().getFullYear();
    const data = {
        years: [],
        ages1: [],
        ages2: [],
        values: [],
        growthYears: [],
        growthValues: [],
        oneWorksYears: [],
        oneWorksValues: [],
        withdrawalYears: [],
        withdrawalValues: [],
        cashflowContributions: [],
        cashflowPensions: [],
        cashflowSpending: [],
        cashflowExtras: [],
        cashflowNet: [],
        fireAge: null,
        fireValue: null
    };

    let portfolioValue = inputs.currentAssets;
    const currentYearExtraCosts = getExtraCostAmountForOffset(0, simulationStartYear, inflationFactors);

    portfolioValue = Math.max(0, portfolioValue - currentYearExtraCosts);

    data.years.push(simulationStartYear);
    data.ages1.push(inputs.currentAge1);
    data.ages2.push(inputs.currentAge2);
    data.values.push(portfolioValue);
    data.growthYears.push(simulationStartYear);
    data.growthValues.push(portfolioValue);
    data.cashflowContributions.push(0);
    data.cashflowPensions.push(0);
    data.cashflowSpending.push(0);
    data.cashflowExtras.push(currentYearExtraCosts);
    data.cashflowNet.push(-currentYearExtraCosts);

    for (let offset = 1; offset <= duration; offset++) {
        const age1 = inputs.currentAge1 + offset;
        const age2 = inputs.currentAge2 + offset;
        const year = simulationStartYear + offset;
        const annualReturnRate = getScenarioRate(annualReturnRates, offset - 1, defaultAnnualReturnRate);
        const contributionFactor = inflationFactors[Math.max(0, offset - 1)] || 1;
        const retirementFactor = inflationFactors[offset] || 1;
        const person1Working = age1 <= inputs.retirementAge1 && age1 <= inputs.endAge1;
        const person2Working = age2 <= inputs.retirementAge2 && age2 <= inputs.endAge2;
        const bothWorking = person1Working && person2Working;
        const oneWorking = person1Working !== person2Working;

        let annualContributionThisYear = 0;
        let totalAnnualPensionThisYear = 0;
        let currentAnnualSpending = 0;

        if (bothWorking) {
            annualContributionThisYear = inputs.annualContribution * contributionFactor;
        } else if (oneWorking) {
            annualContributionThisYear = inputs.annualContribution2 * contributionFactor;
        } else {
            currentAnnualSpending = inputs.annualSpending * retirementFactor;

            if (age1 >= inputs.pensionAge && age1 <= inputs.endAge1) {
                totalAnnualPensionThisYear += inputs.monthlyPension * pension1Multiplier * retirementFactor * 12;
            }

            if (age2 >= inputs.pensionAge2 && age2 <= inputs.endAge2) {
                totalAnnualPensionThisYear += inputs.monthlyPension2 * pension2Multiplier * retirementFactor * 12;
            }
        }

        const scenarioShockThisYear = extraCostShocks[offset] || 0;
        const extraCostThisYear = getExtraCostAmountForOffset(offset, simulationStartYear, inflationFactors) + scenarioShockThisYear;
        const netCashflow = annualContributionThisYear + totalAnnualPensionThisYear - currentAnnualSpending - extraCostThisYear;

        portfolioValue = portfolioValue * (1 + annualReturnRate) + netCashflow;
        portfolioValue = Math.max(0, portfolioValue);

        data.years.push(year);
        data.ages1.push(age1 <= inputs.endAge1 ? age1 : undefined);
        data.ages2.push(age2 <= inputs.endAge2 ? age2 : undefined);
        data.values.push(portfolioValue);
        data.cashflowContributions.push(annualContributionThisYear);
        data.cashflowPensions.push(totalAnnualPensionThisYear);
        data.cashflowSpending.push(currentAnnualSpending);
        data.cashflowExtras.push(extraCostThisYear);
        data.cashflowNet.push(netCashflow);

        if (bothWorking) {
            data.growthYears.push(year);
            data.growthValues.push(portfolioValue);
        } else if (oneWorking) {
            if (data.oneWorksYears.length === 0) {
                data.oneWorksYears.push(year - 1);
                data.oneWorksValues.push(data.values[data.values.length - 2]);
            }

            data.oneWorksYears.push(year);
            data.oneWorksValues.push(portfolioValue);
        } else {
            if (data.withdrawalYears.length === 0) {
                data.withdrawalYears.push(year - 1);
                data.withdrawalValues.push(data.values[data.values.length - 2]);
            }

            data.withdrawalYears.push(year);
            data.withdrawalValues.push(portfolioValue);
        }
    }

    return data;
}

function getPercentile(values, percentile) {
    if (!values.length) {
        return 0;
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const index = (sortedValues.length - 1) * percentile;
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    if (lowerIndex === upperIndex) {
        return sortedValues[lowerIndex];
    }

    const weight = index - lowerIndex;
    return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
}

function sampleStandardNormal() {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildRandomScenario(duration, annualReturn, inflation, returnVolatility, inflationVolatility) {
    const annualReturnRates = [];
    const annualInflationRates = [];

    for (let year = 0; year < duration; year++) {
        const sampledReturn = (annualReturn + sampleStandardNormal() * returnVolatility) / 100;
        const sampledInflation = (inflation + sampleStandardNormal() * inflationVolatility) / 100;

        annualReturnRates.push(clamp(sampledReturn, -0.95, 1.5));
        annualInflationRates.push(clamp(sampledInflation, -0.05, 0.2));
    }

    return {
        annualReturnRates,
        annualInflationRates
    };
}

function runMonteCarloAnalysis(inputs, simulationCount, returnVolatility, inflationVolatility) {
    const duration = getProjectionDuration(inputs);
    const yearlyValues = Array.from({ length: duration + 1 }, () => []);
    let successCount = 0;

    for (let simulation = 0; simulation < simulationCount; simulation++) {
        const scenario = buildRandomScenario(duration, inputs.annualReturn, inputs.inflation, returnVolatility, inflationVolatility);
        const result = calculateScenarioPortfolioGrowth(inputs, scenario);
        const finalValue = result.values[result.values.length - 1] || 0;

        if (finalValue > 0) {
            successCount++;
        }

        result.values.forEach((value, index) => {
            yearlyValues[index].push(value);
        });
    }

    const p10 = yearlyValues.map(values => getPercentile(values, 0.1));
    const p50 = yearlyValues.map(values => getPercentile(values, 0.5));
    const p90 = yearlyValues.map(values => getPercentile(values, 0.9));

    return {
        p10,
        p50,
        p90,
        successRate: simulationCount > 0 ? successCount / simulationCount : 0,
        finalP10: p10[p10.length - 1] || 0,
        finalP50: p50[p50.length - 1] || 0,
        finalP90: p90[p90.length - 1] || 0,
        simulationCount
    };
}

// Update chart
function updateChart() {
    const currentAge1 = parseInt(currentAge1Slider.value);
    const retirementAge1 = parseInt(retirementAge1Slider.value);
    const endAge1 = parseInt(endAge1Slider.value);
    const currentAge2 = parseInt(currentAge2Slider.value);
    const retirementAge2 = parseInt(retirementAge2Slider.value);
    const endAge2 = parseInt(endAge2Slider.value);
    const pensionAge = parseInt(pensionAgeSlider.value);
    const monthlyPension = parseFloat(monthlyPensionSlider.value);
    const pensionAge2 = parseInt(pensionAge2Slider.value);
    const monthlyPension2 = parseFloat(monthlyPension2Slider.value);
    const currentAssets = parseFloat(currentAssetsSlider.value);
    const annualReturn = parseFloat(portfolioReturnsSlider.value);
    const annualSpending = parseFloat(annualSpendingSlider.value);
    const annualContribution = parseFloat(annualContributionSlider.value);
    const annualContribution2 = parseFloat(annualContribution2Slider.value);
    const inflation = parseFloat(inflationSlider.value);

    const data = calculatePortfolioGrowth(
        currentAge1,
        retirementAge1,
        endAge1,
        currentAge2,
        retirementAge2,
        endAge2,
        currentAssets,
        annualReturn,
        annualSpending,
        annualContribution,
        annualContribution2,
        inflation,
        pensionAge,
        monthlyPension,
        pensionAge2,
        monthlyPension2
    );
    
    if (portfolioChart) {
        portfolioChart.destroy();
    }

    if (cashflowChart) {
        cashflowChart.destroy();
    }

    // Nieuw: Check of we reële of nominale bedragen moeten tonen
    const showRealValues = showRealValuesCheckbox ? showRealValuesCheckbox.checked : false;
    const inflationRate = inflation / 100;
    const startYear = data.years[0]; // Het huidige jaar (bijv. 26)
    const isMobile = window.innerWidth < 768;

    // Hulpfunctie om een toekomstig bedrag om te rekenen naar vandaag
    const applyInflationAdjustment = (value, year) => {
        if (value === null || value === undefined) return null;
        if (!showRealValues) return value; // Doe niks als checkbox uit staat
        const yearsPassed = year - startYear;
        return value / Math.pow(1 + inflationRate, yearsPassed);
    };

    // Create datasets with null values for the parts we don't want to show
    const growthData = data.years.map((year, idx) => {
        const growthIdx = data.growthYears.indexOf(year);
        let val = growthIdx >= 0 ? data.growthValues[growthIdx] : null;
        return applyInflationAdjustment(val, year);
    });

    const oneWorksData = data.years.map((year, idx) => {
        const idx2 = data.oneWorksYears.indexOf(year);
        let val = idx2 >= 0 ? data.oneWorksValues[idx2] : null;
        return applyInflationAdjustment(val, year);
    });

    const withdrawalData = data.years.map((year, idx) => {
        const withdrawalIdx = data.withdrawalYears.indexOf(year);
        let val = withdrawalIdx >= 0 ? data.withdrawalValues[withdrawalIdx] : null;
        return applyInflationAdjustment(val, year);
    });

    const cashflowContributionData = data.cashflowContributions.map((value, index) =>
        applyInflationAdjustment(value, data.years[index])
    );
    const cashflowPensionData = data.cashflowPensions.map((value, index) =>
        applyInflationAdjustment(value, data.years[index])
    );
    const cashflowSpendingData = data.cashflowSpending.map((value, index) =>
        -applyInflationAdjustment(value, data.years[index])
    );
    const cashflowExtraCostData = data.cashflowExtras.map((value, index) =>
        -applyInflationAdjustment(value, data.years[index])
    );
    const cashflowNetData = data.cashflowNet.map((value, index) =>
        applyInflationAdjustment(value, data.years[index])
    );

    updateCashflowSummary(data);

    // Create FIRE indicator dataset (point at FIRE age)
    const fireData = data.ages1.map(() => null);
    if (data.fireAge !== null) {
        const fireAgeIndex = data.ages1.indexOf(data.fireAge);
        if (fireAgeIndex >= 0) {
            fireData[fireAgeIndex] = data.fireValue;
        }
    }
    
    const datasets = [
        {
            label: i18next.t('2_work'),
            data: growthData,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            spanGaps: false
        },
        {
            label:  i18next.t('1_works'),
            data: oneWorksData,
            borderColor: 'green',
            backgroundColor: 'rgba(141, 182, 147, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'green',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            spanGaps: false
        },
        {
            label:  i18next.t('0_work'),
            data: withdrawalData,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#e74c3c',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            spanGaps: false
        }
    ];
    
    // Add FIRE indicator if FIRE is reached
    if (data.fireAge !== null && fireData.some(v => v !== null)) {
        datasets.push({
            label: i18next.t('fireReached'),
            data: fireData,
            borderColor: '#27ae60',
            backgroundColor: '#27ae60',
            borderWidth: 0,
            pointRadius: 8,
            pointHoverRadius: 10,
            pointBackgroundColor: '#27ae60',
            pointBorderColor: '#fff',
            pointBorderWidth: 3,
            showLine: false,
            spanGaps: false
        });
    }
    
    
    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.years,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                  top: 5,
                  right: 5,
                  bottom: 0,
                  left: 0
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: isMobile ? 12 : 14 },
                        padding: isMobile ? 8 : 15,
                        boxWidth: isMobile ? 20 : 40
                      }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {                        
                        title: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            const year = data.years[idx];
                            return `${year}`;
                        },
                        label: function(context) {
                            const idx = context.dataIndex;
                            const age1 = data.ages1[idx];
                            const age2 = data.ages2[idx];
                            const ages = [age1 !== undefined ? i18next.t("person1") + `: ${age1}` + i18next.t('yearShort') : '', age2 !== undefined ? i18next.t("person2") + `: ${age2}` + i18next.t('yearShort') : ''].filter(Boolean).join(' | ');
                            return `${formatEuroAmount(context.parsed.y)} (${ages})`;
                            //'€ ' + (num / 1000).toFixed(1) + 'K';'€ ' + (num / 1000).toFixed(1) + 'K';
                          }
                          
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: isMobile ? false : true,
                        text:  i18next.t('dateInYears'),
                        font: { 
                            size: isMobile ? 10 : 12,
                            weight: isMobile ? '400' : '600'
                         },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        autoSkipPadding: isMobile ? 2 : 10,
                        callback: function(value, index) {
                            return getChartXAxisLabel(data, index, isMobile);
                        }
                    }
                },
                y: {
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('portfolioValue') + ' (€)',
                        font: { 
                            size: 12,
                            weight: '600'
                         },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        callback: function(value) {
                            return formatCompactEuroAmount(value);
                          }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    cashflowChart = new Chart(cashflowCtx, {
        type: 'bar',
        data: {
            labels: data.years,
            datasets: [
                {
                    label: i18next.t('cashflowContributions'),
                    data: cashflowContributionData,
                    backgroundColor: 'rgba(102, 126, 234, 0.62)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    label: i18next.t('cashflowPensionIncome'),
                    data: cashflowPensionData,
                    backgroundColor: 'rgba(39, 174, 96, 0.6)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    label: i18next.t('cashflowSpending'),
                    data: cashflowSpendingData,
                    backgroundColor: 'rgba(214, 84, 72, 0.74)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    label: i18next.t('cashflowExtras'),
                    data: cashflowExtraCostData,
                    backgroundColor: 'rgba(201, 155, 79, 0.82)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    type: 'line',
                    label: i18next.t('cashflowNet'),
                    data: cashflowNetData,
                    borderColor: '#163f37',
                    backgroundColor: '#163f37',
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.25,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 5,
                    right: 5,
                    bottom: 0,
                    left: 0
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: isMobile ? 11 : 13 },
                        padding: isMobile ? 8 : 14,
                        boxWidth: isMobile ? 18 : 28,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            return `${data.years[idx]}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${formatEuroAmount(context.parsed.y)}`;
                        },
                        footer: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            const age1 = data.ages1[idx];
                            const age2 = data.ages2[idx];
                            const netValue = cashflowNetData[idx];
                            const agesText = [age1 !== undefined ? i18next.t("person1") + `: ${age1}` + i18next.t('yearShort') : '', age2 !== undefined ? i18next.t("person2") + `: ${age2}` + i18next.t('yearShort') : ''].filter(Boolean).join(' | ');
                            const netText = `${i18next.t('cashflowNet')}: ${formatEuroAmount(netValue)}`;
                            return [netText, agesText].filter(Boolean).join(' | ');
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('dateInYears'),
                        font: {
                            size: isMobile ? 10 : 12,
                            weight: isMobile ? '400' : '600'
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        autoSkipPadding: isMobile ? 2 : 10,
                        callback: function(value, index) {
                            return getChartXAxisLabel(data, index, isMobile);
                        }
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('cashflowAxisLabel') + ' (€)',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        callback: function(value) {
                            return formatCompactEuroAmount(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                axis: 'x',
                intersect: false
            }
        }
    });

}

function updatePortfolioSummary(mode, monteCarloAnalysis, stressDefinition, scenarioData, baseData, helpers = {}) {
    if (!portfolioChartSummary) {
        return;
    }

    const formatAmountForYear = helpers.formatAmountForYear || ((value) => formatEuroAmount(value));

    if (mode === 'monte-carlo' && monteCarloAnalysis) {
        const finalYear = baseData && baseData.years.length ? baseData.years[baseData.years.length - 1] : new Date().getFullYear();
        const summaryParts = [
            i18next.t('analysisSummarySuccess', {
                rate: Math.round(monteCarloAnalysis.successRate * 100),
                count: monteCarloAnalysis.simulationCount
            }),
            i18next.t('analysisSummaryMedian', {
                amount: formatAmountForYear(monteCarloAnalysis.finalP50, finalYear)
            }),
            i18next.t('analysisSummaryDownside', {
                amount: formatAmountForYear(monteCarloAnalysis.finalP10, finalYear)
            })
        ];

        portfolioChartSummary.textContent = summaryParts.join('  |  ');
        return;
    }

    if (stressDefinition && scenarioData && baseData) {
        const stressEndingValue = scenarioData.values[scenarioData.values.length - 1] || 0;
        const baseEndingValue = baseData.values[baseData.values.length - 1] || 0;
        const finalYear = scenarioData.years[scenarioData.years.length - 1];

        portfolioChartSummary.textContent = i18next.t(stressDefinition.summaryKey, {
            ending: formatAmountForYear(stressEndingValue, finalYear),
            delta: formatAmountForYear(stressEndingValue - baseEndingValue, finalYear),
            ...(stressDefinition.summaryParams
                ? {
                    ...stressDefinition.summaryParams,
                    amount: typeof stressDefinition.summaryParams.amount === 'number'
                        ? formatAmountForYear(stressDefinition.summaryParams.amount, stressDefinition.summaryParams.year)
                        : stressDefinition.summaryParams.amount
                }
                : {})
        });
        return;
    }

    if (mode !== 'monte-carlo' || !monteCarloAnalysis) {
        portfolioChartSummary.textContent = i18next.t('analysisSummaryDeterministic');
        return;
    }
}

function updateChart() {
    const inputs = getSimulationInputs();
    const analysisMode = getAnalysisMode();
    const deterministicData = calculateScenarioPortfolioGrowth(inputs);
    const stressDefinition = analysisMode.startsWith('stress-')
        ? getStressScenarioDefinition(analysisMode, inputs)
        : null;
    const scenarioData = stressDefinition
        ? calculateScenarioPortfolioGrowth(inputs, stressDefinition.scenario)
        : deterministicData;
    const chartData = analysisMode === 'monte-carlo' ? deterministicData : scenarioData;
    const simulationCount = simulationCountSlider ? parseInt(simulationCountSlider.value, 10) : 500;
    const returnVolatility = returnVolatilitySlider ? parseFloat(returnVolatilitySlider.value) : 12;
    const inflationVolatility = inflationVolatilitySlider ? parseFloat(inflationVolatilitySlider.value) : 1;
    const monteCarloAnalysis = analysisMode === 'monte-carlo'
        ? runMonteCarloAnalysis(inputs, simulationCount, returnVolatility, inflationVolatility)
        : null;

    if (portfolioChart) {
        portfolioChart.destroy();
    }

    if (cashflowChart) {
        cashflowChart.destroy();
    }

    const showRealValues = showRealValuesCheckbox ? showRealValuesCheckbox.checked : false;
    const inflationRate = inputs.inflation / 100;
    const startYear = chartData.years[0];
    const isMobile = window.innerWidth < 768;

    const applyInflationAdjustment = (value, year) => {
        if (value === null || value === undefined) return null;
        if (!showRealValues) return value;
        const yearsPassed = year - startYear;
        return value / Math.pow(1 + inflationRate, yearsPassed);
    };
    const formatAmountForYear = (value, year) => formatEuroAmount(applyInflationAdjustment(value, year));

    const growthData = chartData.years.map(year => {
        const growthIdx = chartData.growthYears.indexOf(year);
        const value = growthIdx >= 0 ? chartData.growthValues[growthIdx] : null;
        return applyInflationAdjustment(value, year);
    });

    const oneWorksData = chartData.years.map(year => {
        const oneWorksIdx = chartData.oneWorksYears.indexOf(year);
        const value = oneWorksIdx >= 0 ? chartData.oneWorksValues[oneWorksIdx] : null;
        return applyInflationAdjustment(value, year);
    });

    const withdrawalData = chartData.years.map(year => {
        const withdrawalIdx = chartData.withdrawalYears.indexOf(year);
        const value = withdrawalIdx >= 0 ? chartData.withdrawalValues[withdrawalIdx] : null;
        return applyInflationAdjustment(value, year);
    });

    const basePortfolioData = deterministicData.values.map((value, index) =>
        applyInflationAdjustment(value, deterministicData.years[index])
    );
    const stressPortfolioData = scenarioData.values.map((value, index) =>
        applyInflationAdjustment(value, scenarioData.years[index])
    );
    const cashflowContributionData = chartData.cashflowContributions.map((value, index) =>
        applyInflationAdjustment(value, chartData.years[index])
    );
    const cashflowPensionData = chartData.cashflowPensions.map((value, index) =>
        applyInflationAdjustment(value, chartData.years[index])
    );
    const cashflowSpendingData = chartData.cashflowSpending.map((value, index) =>
        -applyInflationAdjustment(value, chartData.years[index])
    );
    const cashflowExtraCostData = chartData.cashflowExtras.map((value, index) =>
        -applyInflationAdjustment(value, chartData.years[index])
    );
    const cashflowNetData = chartData.cashflowNet.map((value, index) =>
        applyInflationAdjustment(value, chartData.years[index])
    );

    updateCashflowSummary(chartData, { formatAmountForYear });
    updatePortfolioSummary(analysisMode, monteCarloAnalysis, stressDefinition, scenarioData, deterministicData, { formatAmountForYear });

    const fireData = chartData.ages1.map(() => null);
    if (chartData.fireAge !== null) {
        const fireAgeIndex = chartData.ages1.indexOf(chartData.fireAge);
        if (fireAgeIndex >= 0) {
            fireData[fireAgeIndex] = chartData.fireValue;
        }
    }

    let portfolioDatasets;

    if (analysisMode === 'monte-carlo' && monteCarloAnalysis) {
        const p10Data = monteCarloAnalysis.p10.map((value, index) =>
            applyInflationAdjustment(value, deterministicData.years[index])
        );
        const p50Data = monteCarloAnalysis.p50.map((value, index) =>
            applyInflationAdjustment(value, deterministicData.years[index])
        );
        const p90Data = monteCarloAnalysis.p90.map((value, index) =>
            applyInflationAdjustment(value, deterministicData.years[index])
        );

        portfolioDatasets = [
            {
                label: i18next.t('portfolioMonteCarloP10'),
                data: p10Data,
                borderColor: 'rgba(29, 95, 82, 0.18)',
                backgroundColor: 'rgba(29, 95, 82, 0)',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0.25,
                fill: false
            },
            {
                label: i18next.t('portfolioMonteCarloP90'),
                data: p90Data,
                borderColor: 'rgba(29, 95, 82, 0.24)',
                backgroundColor: 'rgba(29, 95, 82, 0.16)',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                tension: 0.25,
                fill: '-1'
            },
            {
                label: i18next.t('portfolioMonteCarloMedian'),
                data: p50Data,
                borderColor: '#163f37',
                backgroundColor: '#163f37',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.25,
                fill: false
            },
            {
                label: i18next.t('portfolioBaseCase'),
                data: basePortfolioData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0)',
                borderDash: [8, 6],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.25,
                fill: false
            }
        ];
    } else if (stressDefinition) {
        portfolioDatasets = [
            {
                label: i18next.t(stressDefinition.lineLabelKey),
                data: stressPortfolioData,
                borderColor: stressDefinition.color,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.28,
                fill: false
            },
            {
                label: i18next.t('portfolioBaseCase'),
                data: basePortfolioData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0)',
                borderDash: [8, 6],
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.25,
                fill: false
            }
        ];
    } else {
        portfolioDatasets = [
            {
                label: i18next.t('2_work'),
                data: growthData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                spanGaps: false
            },
            {
                label: i18next.t('1_works'),
                data: oneWorksData,
                borderColor: 'green',
                backgroundColor: 'rgba(141, 182, 147, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'green',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                spanGaps: false
            },
            {
                label: i18next.t('0_work'),
                data: withdrawalData,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#e74c3c',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                spanGaps: false
            }
        ];

        if (chartData.fireAge !== null && fireData.some(value => value !== null)) {
            portfolioDatasets.push({
                label: i18next.t('fireReached'),
                data: fireData,
                borderColor: '#27ae60',
                backgroundColor: '#27ae60',
                borderWidth: 0,
                pointRadius: 8,
                pointHoverRadius: 10,
                pointBackgroundColor: '#27ae60',
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                showLine: false,
                spanGaps: false
            });
        }
    }

    portfolioChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.years,
            datasets: portfolioDatasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 5,
                    right: 5,
                    bottom: 0,
                    left: 0
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: isMobile ? 12 : 14 },
                        padding: isMobile ? 8 : 15,
                        boxWidth: isMobile ? 20 : 40
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            return `${chartData.years[idx]}`;
                        },
                        label: function(context) {
                            const idx = context.dataIndex;
                            const age1 = chartData.ages1[idx];
                            const age2 = chartData.ages2[idx];
                            const ages = [
                                age1 !== undefined ? i18next.t('person1') + `: ${age1}` + i18next.t('yearShort') : '',
                                age2 !== undefined ? i18next.t('person2') + `: ${age2}` + i18next.t('yearShort') : ''
                            ].filter(Boolean).join(' | ');

                            return `${context.dataset.label}: ${formatEuroAmount(context.parsed.y)}${ages ? ` (${ages})` : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('dateInYears'),
                        font: {
                            size: isMobile ? 10 : 12,
                            weight: isMobile ? '400' : '600'
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        autoSkipPadding: isMobile ? 2 : 10,
                        callback: function(value, index) {
                            return getChartXAxisLabel(chartData, index, isMobile);
                        }
                    }
                },
                y: {
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('portfolioValue') + ' (€)',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        callback: function(value) {
                            return formatCompactEuroAmount(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    cashflowChart = new Chart(cashflowCtx, {
        type: 'bar',
        data: {
            labels: chartData.years,
            datasets: [
                {
                    label: i18next.t('cashflowContributions'),
                    data: cashflowContributionData,
                    backgroundColor: 'rgba(102, 126, 234, 0.62)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    label: i18next.t('cashflowPensionIncome'),
                    data: cashflowPensionData,
                    backgroundColor: 'rgba(39, 174, 96, 0.6)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    label: i18next.t('cashflowSpending'),
                    data: cashflowSpendingData,
                    backgroundColor: 'rgba(214, 84, 72, 0.74)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    label: i18next.t('cashflowExtras'),
                    data: cashflowExtraCostData,
                    backgroundColor: 'rgba(201, 155, 79, 0.82)',
                    borderRadius: 6,
                    borderSkipped: false,
                    stack: 'cashflow'
                },
                {
                    type: 'line',
                    label: i18next.t('cashflowNet'),
                    data: cashflowNetData,
                    borderColor: '#163f37',
                    backgroundColor: '#163f37',
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.25,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 5,
                    right: 5,
                    bottom: 0,
                    left: 0
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { size: isMobile ? 11 : 13 },
                        padding: isMobile ? 8 : 14,
                        boxWidth: isMobile ? 18 : 28,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        title: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            return `${chartData.years[idx]}`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${formatEuroAmount(context.parsed.y)}`;
                        },
                        footer: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            const age1 = chartData.ages1[idx];
                            const age2 = chartData.ages2[idx];
                            const netValue = cashflowNetData[idx];
                            const agesText = [
                                age1 !== undefined ? i18next.t('person1') + `: ${age1}` + i18next.t('yearShort') : '',
                                age2 !== undefined ? i18next.t('person2') + `: ${age2}` + i18next.t('yearShort') : ''
                            ].filter(Boolean).join(' | ');
                            const netText = `${i18next.t('cashflowNet')}: ${formatEuroAmount(netValue)}`;
                            return [netText, agesText].filter(Boolean).join(' | ');
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('dateInYears'),
                        font: {
                            size: isMobile ? 10 : 12,
                            weight: isMobile ? '400' : '600'
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        autoSkipPadding: isMobile ? 2 : 10,
                        callback: function(value, index) {
                            return getChartXAxisLabel(chartData, index, isMobile);
                        }
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: isMobile ? false : true,
                        text: i18next.t('cashflowAxisLabel') + ' (€)',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: { size: isMobile ? 10 : 12 },
                        callback: function(value) {
                            return formatCompactEuroAmount(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Update value displays
function updateValueDisplays() {
    currentAge1Value.textContent = currentAge1Slider.value;
    retirementAge1Value.textContent = retirementAge1Slider.value;
    endAge1Value.textContent = endAge1Slider.value;
    currentAge2Value.textContent = currentAge2Slider.value;
    retirementAge2Value.textContent = retirementAge2Slider.value;
    endAge2Value.textContent = endAge2Slider.value;
    currentAssetsValue.textContent = formatEuroAmount(currentAssetsSlider.value);
    portfolioReturnsValue.textContent = parseFloat(portfolioReturnsSlider.value).toFixed(1);
    inflationValue.textContent = parseFloat(inflationSlider.value).toFixed(1);
    annualSpendingValue.textContent = formatEuroAmount(annualSpendingSlider.value);
    annualContributionValue.textContent = formatEuroAmount(annualContributionSlider.value);
    annualContribution2Value.textContent = formatEuroAmount(annualContribution2Slider.value);    
    pensionAgeValue.textContent = pensionAgeSlider.value;
    monthlyPensionValue.textContent = formatEuroAmount(monthlyPensionSlider.value);
    pensionAge2Value.textContent = pensionAge2Slider.value;
    monthlyPension2Value.textContent = formatEuroAmount(monthlyPension2Slider.value);
    if (simulationCountValue && simulationCountSlider) {
        simulationCountValue.textContent = simulationCountSlider.value;
    }
    if (returnVolatilityValue && returnVolatilitySlider) {
        returnVolatilityValue.textContent = parseFloat(returnVolatilitySlider.value).toFixed(1);
    }
    if (inflationVolatilityValue && inflationVolatilitySlider) {
        inflationVolatilityValue.textContent = parseFloat(inflationVolatilitySlider.value).toFixed(1);
    }
    toggleAnalysisSettings();
}

// Event listeners
currentAge1Slider.addEventListener('input', function() {
    updateValueDisplays();
    // Ensure retirement age is always greater than current age
    if (parseInt(retirementAge1Slider.value) <= parseInt(this.value)) {
        retirementAge1Slider.value = parseInt(this.value) + 1;
        retirementAge1Value.textContent = retirementAge1Slider.value;
    }
    if (parseInt(endAge1Slider.value) <= parseInt(retirementAge1Slider.value)) {
        endAge1Slider.value = parseInt(retirementAge1Slider.value) + 1;
        endAge1Value.textContent = endAge1Slider.value;
    }
    updateChart();
});

currentAge2Slider.addEventListener('input', function() {
    updateValueDisplays();
    // Ensure retirement age is always greater than current age
    if (parseInt(retirementAge2Slider.value) <= parseInt(this.value)) {
        retirementAge2Slider.value = parseInt(this.value) + 1;
        retirementAge2Value.textContent = retirementAge2Slider.value;
    }
    if (parseInt(endAge2Slider.value) <= parseInt(retirementAge2Slider.value)) {
        endAge2Slider.value = parseInt(retirementAge2Slider.value) + 1;
        endAge2Value.textContent = endAge2Slider.value;
    }
    updateChart();
});

retirementAge1Slider.addEventListener('input', function() {
    const currentAge1 = parseInt(currentAge1Slider.value);
    const endAge1 = parseInt(endAge1Slider.value);
    if (parseInt(this.value) <= currentAge1) {
        this.value = currentAge1 + 1;
    }
    // Ensure end age is still greater than retirement age
    if (endAge1 <= parseInt(this.value)) {
        endAge1Slider.value = parseInt(this.value) + 1;
        endAge1Value.textContent = endAge1Slider.value;
    }
    updateValueDisplays();
    updateChart();
});

retirementAge2Slider.addEventListener('input', function() {
    const currentAge2 = parseInt(currentAge2Slider.value);
    const endAge2 = parseInt(endAge2Slider.value);
    if (parseInt(this.value) <= currentAge2) {
        this.value = currentAge2 + 1;
    }
    // Ensure end age is still greater than retirement age
    if (endAge2 <= parseInt(this.value)) {
        endAge2Slider.value = parseInt(this.value) + 1;
        endAge2Value.textContent = endAge2Slider.value;
    }
    updateValueDisplays();
    updateChart();
});

endAge1Slider.addEventListener('input', function() {
    const retirementAge1 = parseInt(retirementAge1Slider.value);
    if (parseInt(this.value) <= retirementAge1) {
        this.value = retirementAge1 + 1;
    }
    updateValueDisplays();
    updateChart();
});


endAge2Slider.addEventListener('input', function() {
    const retirementAge2 = parseInt(retirementAge2Slider.value);
    if (parseInt(this.value) <= retirementAge2) {
        this.value = retirementAge2 + 1;
    }
    updateValueDisplays();
    updateChart();
});

currentAssetsSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

annualContributionSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

annualContribution2Slider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

portfolioReturnsSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

inflationSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

annualSpendingSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

pensionAgeSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

monthlyPensionSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

pensionAge2Slider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

monthlyPension2Slider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

showRealValuesCheckbox.addEventListener('change', function() {
    localStorage.setItem(SHOW_REAL_VALUES_STORAGE_KEY, String(showRealValuesCheckbox.checked));
    updateChart();
});

analysisModeSelect.addEventListener('change', function() {
    localStorage.setItem(ANALYSIS_MODE_STORAGE_KEY, analysisModeSelect.value);
    updateValueDisplays();
    updateChart();
});

simulationCountSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

returnVolatilitySlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

inflationVolatilitySlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

extraCostPresetButtons.forEach(button => {
    button.addEventListener('click', function() {
        addExtraCost(button.dataset.extraCostPreset || 'other');
    });
});

chartViewButtons.forEach(button => {
    button.addEventListener('click', function() {
        setChartMobileView(button.dataset.chartView);
    });
});

addCustomCostButton.addEventListener('click', function() {
    addExtraCost('other');
});

extraCostsList.addEventListener('input', function(event) {
    const target = event.target;
    const card = target.closest('[data-cost-id]');

    if (!card || !target.matches('[data-field]')) {
        return;
    }

    const cost = extraCosts.find(item => item.id === card.dataset.costId);

    if (!cost) {
        return;
    }

    const field = target.dataset.field;
    applyExtraCostFieldUpdate(cost, field, target.value);

    saveExtraCostsToStorage();
    syncExtraCostCard(cost.id);
    updateChart();
});

extraCostsList.addEventListener('change', function(event) {
    const target = event.target;
    const card = target.closest('[data-cost-id]');

    if (!card || !target.matches('[data-field]')) {
        return;
    }

    const cost = extraCosts.find(item => item.id === card.dataset.costId);

    if (!cost) {
        return;
    }

    const field = target.dataset.field;
    applyExtraCostFieldUpdate(cost, field, target.value);

    saveExtraCostsToStorage();
    syncExtraCostCard(cost.id);
    updateChart();
});

extraCostsList.addEventListener('focusin', function(event) {
    const target = event.target;

    if (target.matches('input[data-field="amount"]')) {
        target.select();
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // Selecteer alle sliders op de pagina
    const sliders = document.querySelectorAll('input[type="range"]');

    sliders.forEach(slider => {
        // Controleer of de slider een ID heeft, dit is vereist voor het opslaan
        if (!slider.id) return; 

        // 1. Controleer of er een opgeslagen waarde is
        const opgeslagenWaarde = localStorage.getItem(slider.id);
        
        if (opgeslagenWaarde !== null) {
            // Herstel de opgeslagen waarde
            slider.value = opgeslagenWaarde;
            
            // Simuleer een input-event zodat je bestaande FIRE-berekening direct wordt geüpdatet
            slider.dispatchEvent(new Event('input'));
        }

        // 2. Sla de waarde op telkens wanneer de gebruiker de slider verschuift
        slider.addEventListener('input', function(event) {
            localStorage.setItem(slider.id, event.target.value);
        });
    });

    const savedRealValuesSetting = localStorage.getItem(SHOW_REAL_VALUES_STORAGE_KEY);
    if (savedRealValuesSetting !== null) {
        showRealValuesCheckbox.checked = savedRealValuesSetting === 'true';
    }

    const savedAnalysisMode = localStorage.getItem(ANALYSIS_MODE_STORAGE_KEY);
    if (new Set(['deterministic', 'monte-carlo', 'stress-bear', 'stress-inflation', 'stress-extra-cost', 'stress-pension']).has(savedAnalysisMode)) {
        analysisModeSelect.value = savedAnalysisMode;
    }

    setChartMobileView(activeChartView);
    extraCosts = loadExtraCostsFromStorage();
    renderExtraCosts();
    updateValueDisplays();
    updateChart();
});
