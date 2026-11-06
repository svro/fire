const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createMockElement(overrides = {}) {
    return {
        value: '0',
        checked: false,
        textContent: '',
        innerText: '',
        innerHTML: '',
        dataset: {},
        style: {},
        classList: {
            toggle() {},
            add() {},
            remove() {}
        },
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {},
        setAttribute() {},
        querySelector() {
            return null;
        },
        querySelectorAll() {
            return [];
        },
        closest() {
            return null;
        },
        focus() {},
        getContext() {
            return {};
        },
        ...overrides
    };
}

function loadSimulationApi(storedValues = {}) {
    const scriptPath = path.join(__dirname, '..', 'script.js');
    const source = fs.readFileSync(scriptPath, 'utf8') + `
globalThis.__testExports = {
    calculateScenarioPortfolioGrowth,
    getProjectionDuration,
    getStressScenarioDefinition,
    runMonteCarloAnalysis,
    buildInflationFactors,
    getPercentile,
    getCurrentAssetsStep,
    normalizeCurrentAssetsValue,
    normalizeExtraCost,
    applyExtraCostFieldUpdate,
    loadExtraCostsFromStorage,
    renderExtraCosts,
    updateChart,
    formatCurrencyAmount,
    setHouseholdMode,
    setScenarioFactory(factory) { buildRandomScenario = factory; },
    setExtraCosts(value) { extraCosts = value; },
    resetExtraCosts() { extraCosts = []; }
};
`;

    const elements = new Map();
    const getElement = (id) => {
        if (!elements.has(id)) {
            const defaults = {};

            if (id === 'showRealValues') {
                defaults.checked = false;
            }

            if (id === 'analysisMode') {
                defaults.value = 'deterministic';
            }

            elements.set(id, createMockElement(defaults));
        }

        return elements.get(id);
    };

    const document = {
        documentElement: { lang: 'en' },
        getElementById(id) {
            return getElement(id);
        },
        querySelector() {
            return createMockElement();
        },
        querySelectorAll() {
            return [];
        },
        addEventListener() {}
    };

    const translations = [];
    const charts = [];
    const i18next = {
        resolvedLanguage: 'en',
        language: 'en',
        use() {
            return this;
        },
        init() {
            return {
                then() {
                    return this;
                }
            };
        },
        changeLanguage(language) {
            this.language = language;
            this.resolvedLanguage = language;
            return Promise.resolve();
        },
        t(key, params) {
            translations.push({ key, params });
            return key;
        }
    };

    const sandbox = {
        console,
        Math,
        Date,
        JSON,
        Intl,
        Promise,
        Set,
        Map,
        Array,
        Number,
        String,
        Object,
        navigator: { language: 'en-US' },
        localStorage: {
            getItem(key) {
                return storedValues[key] ?? null;
            },
            setItem() {},
            removeItem() {}
        },
        window: {
            innerWidth: 1280,
            addEventListener() {},
            removeEventListener() {},
            handleExtraCostActionByParams() {}
        },
        document,
        Event: class Event {
            constructor(type) {
                this.type = type;
            }
        },
        Chart: function Chart(context, config) {
            charts.push(config);
            return {
                destroy() {}
            };
        },
        i18next,
        i18nextHttpBackend: {},
        i18nextBrowserLanguageDetector: {}
    };

    sandbox.globalThis = sandbox;

    vm.runInNewContext(source, sandbox, { filename: scriptPath });
    sandbox.__testExports.getElement = getElement;
    sandbox.__testExports.charts = charts;
    sandbox.__testExports.translations = translations;
    return sandbox.__testExports;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function assertAlmostEqual(actual, expected, epsilon = 1e-9) {
    assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`);
}

function assertArrayAlmostEqual(actual, expected, epsilon = 1e-9) {
    assert.equal(actual.length, expected.length, 'Array lengths differ');

    actual.forEach((value, index) => {
        assertAlmostEqual(value, expected[index], epsilon);
    });
}

function createBaseInputs() {
    return {
        householdMode: 'couple',
        currentAge1: 30,
        retirementAge1: 32,
        endAge1: 34,
        currentAge2: 30,
        retirementAge2: 31,
        endAge2: 34,
        pensionAge: 80,
        monthlyPension: 0,
        pensionAge2: 80,
        monthlyPension2: 0,
        currentAssets: 1000,
        annualReturn: 0,
        annualSpending: 80,
        annualContribution: 100,
        annualContribution2: 50,
        inflation: 0
    };
}

test('deterministic scenario preserves expected phase transitions and yearly values', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = createBaseInputs();
    const result = api.calculateScenarioPortfolioGrowth(inputs);
    const startYear = new Date().getFullYear();

    assert.deepEqual(plain(result.years), [startYear, startYear + 1, startYear + 2, startYear + 3, startYear + 4]);
    assert.deepEqual(plain(result.values), [1000, 1100, 1150, 1070, 990]);
    assert.deepEqual(plain(result.growthYears), [startYear, startYear + 1]);
    assert.deepEqual(plain(result.growthValues), [1000, 1100]);
    assert.deepEqual(plain(result.oneWorksYears), [startYear + 1, startYear + 2]);
    assert.deepEqual(plain(result.oneWorksValues), [1100, 1150]);
    assert.deepEqual(plain(result.withdrawalYears), [startYear + 2, startYear + 3, startYear + 4]);
    assert.deepEqual(plain(result.withdrawalValues), [1150, 1070, 990]);
    assert.deepEqual(plain(result.cashflowNet), [0, 100, 50, -80, -80]);
});

test('extra costs are applied only within their configured year range', () => {
    const api = loadSimulationApi();
    const startYear = new Date().getFullYear();

    api.setExtraCosts([
        {
            id: 'cost-1',
            preset: 'other',
            label: 'Test cost',
            type: 'yearly',
            amount: 10,
            startYear: startYear + 1,
            endYear: startYear + 2
        }
    ]);

    const result = api.calculateScenarioPortfolioGrowth(createBaseInputs());

    assert.deepEqual(plain(result.cashflowExtras), [0, 10, 10, 0, 0]);
    assert.deepEqual(plain(result.values), [1000, 1090, 1130, 1050, 970]);
    assert.deepEqual(plain(result.cashflowNet), [0, 90, 40, -80, -80]);
});

test('stress extra cost scenario inflates the shock amount to the target year', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = {
        ...createBaseInputs(),
        endAge1: 42,
        endAge2: 42,
        annualSpending: 40000,
        inflation: 2
    };

    const definition = api.getStressScenarioDefinition('stress-extra-cost', inputs);
    const startYear = new Date().getFullYear();
    const expectedShockAmount = 30000 * Math.pow(1.02, 5);

    assert.equal(definition.summaryParams.year, startYear + 5);
    assertAlmostEqual(definition.summaryParams.amount, expectedShockAmount);
    assertAlmostEqual(definition.scenario.extraCostShocks[5], expectedShockAmount);
});

test('stress bear after 5 years delays the bad return sequence until years 6-8', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = {
        ...createBaseInputs(),
        endAge1: 45,
        endAge2: 45,
        annualReturn: 4
    };

    const definition = api.getStressScenarioDefinition('stress-bear-5', inputs);

    assertArrayAlmostEqual(
        definition.scenario.annualReturnRates.slice(0, 8),
        [0.04, 0.04, 0.04, 0.04, 0.04, -0.18, -0.1, 0]
    );
});

test('stress bear after 10 years delays the bad return sequence until years 11-13', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = {
        ...createBaseInputs(),
        endAge1: 50,
        endAge2: 50,
        annualReturn: 4
    };

    const definition = api.getStressScenarioDefinition('stress-bear-10', inputs);

    assertArrayAlmostEqual(
        definition.scenario.annualReturnRates.slice(0, 13),
        [0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, -0.18, -0.1, 0]
    );
});

test('Monte Carlo with zero volatility matches the deterministic projection exactly', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = createBaseInputs();
    const deterministic = api.calculateScenarioPortfolioGrowth(inputs);
    const monteCarlo = api.runMonteCarloAnalysis(inputs, 8, 0, 0);

    assert.deepEqual(plain(monteCarlo.p10), plain(deterministic.values));
    assert.deepEqual(plain(monteCarlo.p50), plain(deterministic.values));
    assert.deepEqual(plain(monteCarlo.p90), plain(deterministic.values));
    assert.equal(monteCarlo.successRate, 1);
    assert.equal(monteCarlo.finalP50, deterministic.values[deterministic.values.length - 1]);
});

test('pension income starts exactly in the first eligible retirement year', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const result = api.calculateScenarioPortfolioGrowth({
        currentAge1: 64,
        retirementAge1: 64,
        endAge1: 66,
        currentAge2: 64,
        retirementAge2: 64,
        endAge2: 66,
        pensionAge: 65,
        monthlyPension: 100,
        pensionAge2: 65,
        monthlyPension2: 100,
        currentAssets: 100,
        annualReturn: 0,
        annualSpending: 2400,
        annualContribution: 0,
        annualContribution2: 0,
        inflation: 0
    });

    assert.deepEqual(plain(result.cashflowPensions), [0, 2400, 2400]);
    assert.deepEqual(plain(result.cashflowSpending), [0, 2400, 2400]);
    assert.deepEqual(plain(result.values), [100, 100, 100]);
});

test('portfolio value is floored at zero under severe negative cashflow', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const result = api.calculateScenarioPortfolioGrowth({
        currentAge1: 64,
        retirementAge1: 64,
        endAge1: 66,
        currentAge2: 64,
        retirementAge2: 64,
        endAge2: 66,
        pensionAge: 80,
        monthlyPension: 0,
        pensionAge2: 80,
        monthlyPension2: 0,
        currentAssets: 50,
        annualReturn: 0,
        annualSpending: 200,
        annualContribution: 0,
        annualContribution2: 0,
        inflation: 0
    });

    assert.deepEqual(plain(result.values), [50, 0, 0]);
    assert.ok(plain(result.values).every(value => value >= 0));
});

test('stress pension scenario reduces pension cashflow and resulting portfolio values', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = {
        currentAge1: 64,
        retirementAge1: 64,
        endAge1: 66,
        currentAge2: 64,
        retirementAge2: 64,
        endAge2: 66,
        pensionAge: 65,
        monthlyPension: 100,
        pensionAge2: 65,
        monthlyPension2: 100,
        currentAssets: 0,
        annualReturn: 0,
        annualSpending: 0,
        annualContribution: 0,
        annualContribution2: 0,
        inflation: 0
    };

    const base = api.calculateScenarioPortfolioGrowth(inputs);
    const stressDefinition = api.getStressScenarioDefinition('stress-pension', inputs);
    const stress = api.calculateScenarioPortfolioGrowth(inputs, stressDefinition.scenario);

    assert.deepEqual(plain(base.cashflowPensions), [0, 2400, 2400]);
    assert.deepEqual(plain(stress.cashflowPensions), [0, 1920, 1920]);
    assert.deepEqual(plain(base.values), [0, 2400, 4800]);
    assert.deepEqual(plain(stress.values), [0, 1920, 3840]);
});

test('stress inflation scenario applies the custom inflation path to retirement spending', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = {
        currentAge1: 64,
        retirementAge1: 64,
        endAge1: 69,
        currentAge2: 64,
        retirementAge2: 64,
        endAge2: 69,
        pensionAge: 80,
        monthlyPension: 0,
        pensionAge2: 80,
        monthlyPension2: 0,
        currentAssets: 1000,
        annualReturn: 0,
        annualSpending: 100,
        annualContribution: 0,
        annualContribution2: 0,
        inflation: 2
    };

    const stressDefinition = api.getStressScenarioDefinition('stress-inflation', inputs);
    const stress = api.calculateScenarioPortfolioGrowth(inputs, stressDefinition.scenario);
    const expectedSpending = [0, 105, 111.3, 119.091, 126.23646, 132.548283];

    assertArrayAlmostEqual(plain(stress.cashflowSpending), expectedSpending);
    assertAlmostEqual(stress.values[stress.values.length - 1], 405.824257);
});

test('one-time and yearly extra costs remain distinct in yearly cashflow output', () => {
    const api = loadSimulationApi();
    const startYear = new Date().getFullYear();

    api.setExtraCosts([
        {
            id: 'cost-once',
            preset: 'other',
            label: 'One-time',
            type: 'one-time',
            amount: 10,
            startYear: startYear + 1,
            endYear: startYear + 1
        },
        {
            id: 'cost-yearly',
            preset: 'other',
            label: 'Yearly',
            type: 'yearly',
            amount: 20,
            startYear: startYear + 2,
            endYear: startYear + 3
        }
    ]);

    const result = api.calculateScenarioPortfolioGrowth(createBaseInputs());

    assert.deepEqual(plain(result.cashflowExtras), [0, 10, 20, 20, 0]);
    assert.deepEqual(plain(result.values), [1000, 1090, 1120, 1020, 940]);
});

test('solo mode uses only person 1 duration and keeps working contributions until retirement', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const result = api.calculateScenarioPortfolioGrowth({
        ...createBaseInputs(),
        householdMode: 'solo',
        retirementAge1: 32,
        endAge1: 34,
        currentAge2: 30,
        retirementAge2: 60,
        endAge2: 90,
        annualContribution: 100,
        annualContribution2: 999,
        annualSpending: 80
    });

    assert.deepEqual(plain(result.years).length, 5);
    assert.deepEqual(plain(result.cashflowContributions), [0, 100, 100, 0, 0]);
    assert.deepEqual(plain(result.cashflowNet), [0, 100, 100, -80, -80]);
    assert.deepEqual(plain(result.ages2), [null, null, null, null, null]);
});

test('solo mode does not add hidden partner pension income', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const result = api.calculateScenarioPortfolioGrowth({
        ...createBaseInputs(),
        householdMode: 'solo',
        currentAge1: 64,
        retirementAge1: 64,
        endAge1: 66,
        currentAge2: 64,
        retirementAge2: 64,
        endAge2: 90,
        pensionAge: 65,
        monthlyPension: 100,
        pensionAge2: 65,
        monthlyPension2: 1000,
        currentAssets: 0,
        annualContribution: 0,
        annualContribution2: 0,
        annualSpending: 1200,
        annualReturn: 0,
        inflation: 0
    });

    assert.deepEqual(plain(result.cashflowPensions), [0, 1200, 1200]);
    assert.deepEqual(plain(result.cashflowNet), [0, 0, 0]);
    assert.deepEqual(plain(result.values), [0, 0, 0]);
});

test('current assets slider step increases by configured asset range', () => {
    const api = loadSimulationApi();

    assert.equal(api.getCurrentAssetsStep(0), 5000);
    assert.equal(api.getCurrentAssetsStep(100000), 5000);
    assert.equal(api.getCurrentAssetsStep(100001), 5000);
    assert.equal(api.getCurrentAssetsStep(500000), 5000);
    assert.equal(api.getCurrentAssetsStep(500001), 10000);
    assert.equal(api.getCurrentAssetsStep(1000000), 10000);
    assert.equal(api.getCurrentAssetsStep(1000001), 50000);
    assert.equal(api.getCurrentAssetsStep(3000000), 50000);
});

test('current assets values snap in the direction of travel when crossing a step boundary', () => {
    const api = loadSimulationApi();

    assert.equal(api.normalizeCurrentAssetsValue(101000, { direction: 1 }), 105000);
    assert.equal(api.normalizeCurrentAssetsValue(499000, { direction: 1 }), 500000);
    assert.equal(api.normalizeCurrentAssetsValue(505000, { direction: 1 }), 510000);
    assert.equal(api.normalizeCurrentAssetsValue(495000, { direction: -1 }), 495000);
    assert.equal(api.normalizeCurrentAssetsValue(1010000, { direction: 1 }), 1050000);
    assert.equal(api.normalizeCurrentAssetsValue(3010000, { direction: 1 }), 3000000);
    assert.equal(api.normalizeCurrentAssetsValue(3010000, { direction: -1 }), 3000000);
    assert.equal(api.normalizeCurrentAssetsValue(4000000, { direction: 1 }), 3000000);
});

function retiredInputs(overrides = {}) {
    return {
        ...createBaseInputs(),
        householdMode: 'solo',
        currentAge1: 60,
        retirementAge1: 60,
        endAge1: 65,
        pensionAge: 63,
        monthlyPension: 2000,
        currentAssets: 10000,
        annualSpending: 20000,
        annualContribution: 0,
        ...overrides
    };
}

function configureChart(api, inputs, mode, showRealValues) {
    api.setHouseholdMode(inputs.householdMode, { refresh: false });
    for (const [key, value] of Object.entries(inputs)) {
        if (key !== 'householdMode') {
            api.getElement(key === 'annualReturn' ? 'portfolioReturns' : key).value = String(value);
        }
    }
    api.getElement('analysisMode').value = mode;
    api.getElement('showRealValues').checked = showRealValues;
    api.getElement('simulationCount').value = '2';
    api.getElement('returnVolatility').value = '0';
    api.getElement('inflationVolatility').value = '0';
    api.updateChart();
}

test('later pension surpluses cannot turn an earlier funding failure into Monte Carlo success', () => {
    const api = loadSimulationApi();
    const inputs = retiredInputs();
    const result = api.calculateScenarioPortfolioGrowth(inputs);
    assert.deepEqual(plain(result.values), [10000, 0, 0, 4000, 8000, 12000]);
    assert.deepEqual(plain(result.cashflowShortfall), [0, 10000, 20000, 0, 0, 0]);
    assert.equal(result.hasShortfall, true);
    assert.equal(result.firstShortfallYear, new Date().getFullYear() + 1);
    assert.equal(api.runMonteCarloAnalysis(inputs, 5, 0, 0).successRate, 0);
});

test('pension-funded spending succeeds with zero assets throughout', () => {
    const api = loadSimulationApi();
    const inputs = retiredInputs({ currentAssets: 0, pensionAge: 60, annualSpending: 24000 });
    const result = api.calculateScenarioPortfolioGrowth(inputs);
    assert.deepEqual(plain(result.values), [0, 0, 0, 0, 0, 0]);
    assert.equal(result.hasShortfall, false);
    assert.equal(result.firstShortfallYear, null);
    assert.equal(api.runMonteCarloAnalysis(inputs, 5, 0, 0).successRate, 1);
});

test('spending the last euro at the horizon succeeds but an unfunded cent fails', () => {
    const api = loadSimulationApi();
    const inputs = retiredInputs({ endAge1: 61, currentAssets: 100, annualSpending: 100 });
    assert.equal(api.runMonteCarloAnalysis(inputs, 2, 0, 0).successRate, 1);
    assert.equal(api.runMonteCarloAnalysis({ ...inputs, currentAssets: 99.99 }, 2, 0, 0).successRate, 0);
});

test('an unaffordable current-year extra cost fails even when later income rebuilds assets', () => {
    const api = loadSimulationApi();
    const year = new Date().getFullYear();
    api.setExtraCosts([{ amount: 10001, startYear: year, endYear: year, type: 'one-time' }]);
    const inputs = retiredInputs({ pensionAge: 60, annualSpending: 0 });
    const result = api.calculateScenarioPortfolioGrowth(inputs);
    assert.equal(result.cashflowShortfall[0], 1);
    assert.equal(result.firstShortfallYear, year);
    assert.ok(result.values.at(-1) > 0);
    assert.equal(api.runMonteCarloAnalysis(inputs, 2, 0, 0).successRate, 0);
});

test('either retired partner receives their pension while the other still works', () => {
    const api = loadSimulationApi();
    const inputs = {
        ...createBaseInputs(), currentAge1: 65, retirementAge1: 65, endAge1: 70,
        currentAge2: 60, retirementAge2: 63, endAge2: 65,
        pensionAge: 65, monthlyPension: 1000, annualContribution2: -5000
    };
    const result = api.calculateScenarioPortfolioGrowth(inputs);
    assert.deepEqual(plain(result.cashflowPensions), [0, 12000, 12000, 12000, 12000, 12000]);
    assert.equal(result.cashflowNet[1], 7000);
    const swapped = api.calculateScenarioPortfolioGrowth({
        ...inputs, currentAge1: 60, retirementAge1: 63, endAge1: 65,
        currentAge2: 65, retirementAge2: 65, endAge2: 70,
        pensionAge: 80, monthlyPension: 0, pensionAge2: 65, monthlyPension2: 1000
    });
    assert.deepEqual(plain(swapped.cashflowPensions), plain(result.cashflowPensions));
    const stress = api.calculateScenarioPortfolioGrowth(inputs, api.getStressScenarioDefinition('stress-pension', inputs).scenario);
    assert.equal(stress.cashflowPensions[1], 9600);
});

test('pension requires the person to stop work and ends after their own end age', () => {
    const api = loadSimulationApi();
    const result = api.calculateScenarioPortfolioGrowth({
        ...createBaseInputs(), currentAge1: 65, retirementAge1: 66, endAge1: 68,
        currentAge2: 60, retirementAge2: 60, endAge2: 65,
        pensionAge: 65, monthlyPension: 1000
    });
    assert.deepEqual(plain(result.cashflowPensions), [0, 0, 12000, 12000, 0, 0]);
});

test('stored expired costs stay in the past after loading, rendering and amount edits', () => {
    const year = new Date().getFullYear();
    const api = loadSimulationApi({ fireExtraCosts: JSON.stringify([
        { id: 'car', type: 'one-time', amount: 25000, startYear: year - 1, endYear: year - 1 },
        { id: 'studies', type: 'yearly', amount: 10000, startYear: year - 3, endYear: year - 1 }
    ]) });
    const costs = api.loadExtraCostsFromStorage();
    assert.equal(costs[0].startYear, year - 1);
    assert.equal(costs[1].endYear, year - 1);
    api.applyExtraCostFieldUpdate(costs[0], 'amount', '30000');
    assert.equal(costs[0].startYear, year - 1);
    api.setExtraCosts(costs);
    api.renderExtraCosts();
    assert.ok(api.getElement('extraCostsList').innerHTML.includes(`value="${year - 1}" selected`));
    assert.deepEqual(plain(api.calculateScenarioPortfolioGrowth(createBaseInputs()).cashflowExtras), [0, 0, 0, 0, 0]);
});

test('an ongoing historical recurring cost is charged only for its remaining years', () => {
    const api = loadSimulationApi();
    const year = new Date().getFullYear();
    api.setExtraCosts([api.normalizeExtraCost({ type: 'yearly', amount: 10, startYear: year - 2, endYear: year + 1 })]);
    assert.deepEqual(plain(api.calculateScenarioPortfolioGrowth(createBaseInputs()).cashflowExtras), [10, 10, 0, 0, 0]);
});

test('Monte Carlo ranks purchasing power per path before computing percentiles', () => {
    const api = loadSimulationApi();
    let sample = 0;
    api.setScenarioFactory(() => sample++ % 2 === 0
        ? { annualReturnRates: [0], annualInflationRates: [0] }
        : { annualReturnRates: [0.1], annualInflationRates: [0.2] });
    const inputs = retiredInputs({ endAge1: 61, currentAssets: 100, annualSpending: 0, monthlyPension: 0 });
    const nominal = api.runMonteCarloAnalysis(inputs, 2, 0, 0);
    const real = api.runMonteCarloAnalysis(inputs, 2, 0, 0, true);
    assertAlmostEqual(nominal.finalP50, 105);
    assertAlmostEqual(real.finalP50, (100 + 110 / 1.2) / 2);
    assertAlmostEqual(real.finalP10, (110 / 1.2) * 0.9 + 100 * 0.1);
    assertAlmostEqual(real.finalP90, (110 / 1.2) * 0.1 + 100 * 0.9);
    assert.equal(real.successRate, nominal.successRate);
});

test('stress charts and summary use each scenarios own inflation path', () => {
    const api = loadSimulationApi();
    const inputs = retiredInputs({ currentAssets: 100000, monthlyPension: 0, annualSpending: 10000, inflation: 2 });
    configureChart(api, inputs, 'stress-inflation', true);
    const portfolio = api.charts.at(-2).data.datasets;
    const cashflow = api.charts.at(-1).data.datasets;
    const stressFactors = [1, 1.05, 1.113, 1.19091, 1.2623646, 1.32548283];
    const stressNominal = [100000, 89500, 78370, 66460.9, 53837.254, 40582.4257];
    assertArrayAlmostEqual(portfolio[0].data, stressNominal.map((v, i) => v / stressFactors[i]));
    const base = api.calculateScenarioPortfolioGrowth(inputs);
    assertArrayAlmostEqual(portfolio[1].data, base.values.map((v, i) => v / 1.02 ** i));
    assertArrayAlmostEqual(cashflow.find(d => d.label === 'cashflowSpending').data, [0, -10000, -10000, -10000, -10000, -10000]);
    const summary = api.translations.findLast(t => t.key === 'stressSummaryInflation').params;
    assert.equal(summary.ending, api.formatCurrencyAmount(40582.4257 / 1.32548283));
    assert.equal(summary.delta, api.formatCurrencyAmount(40582.4257 / 1.32548283 - base.values.at(-1) / 1.02 ** 5));
    configureChart(api, inputs, 'stress-inflation', false);
    assertArrayAlmostEqual(api.charts.at(-2).data.datasets[0].data, stressNominal);
});

test('Monte Carlo charts and summaries do not deflate real percentiles a second time', () => {
    const api = loadSimulationApi();
    const inputs = retiredInputs({ currentAssets: 100000, annualSpending: 0, monthlyPension: 0, inflation: 2 });
    configureChart(api, inputs, 'monte-carlo', true);
    const median = api.charts.at(-2).data.datasets.find(d => d.label === 'portfolioMonteCarloMedian');
    assertArrayAlmostEqual(median.data, [0, 1, 2, 3, 4, 5].map(i => 100000 / 1.02 ** i));
    const summary = api.translations.findLast(t => t.key === 'analysisSummaryMedian').params;
    assert.equal(summary.amount, api.formatCurrencyAmount(100000 / 1.02 ** 5));
});

test('deterministic and stress summaries disclose earlier shortfalls after recovery', () => {
    const api = loadSimulationApi();
    for (const mode of ['deterministic', 'stress-pension']) {
        configureChart(api, retiredInputs(), mode, false);
        assert.ok(api.getElement('portfolioChartSummary').textContent.includes('analysisSummaryShortfall'));
        assert.equal(api.translations.findLast(t => t.key === 'analysisSummaryShortfall').params.year, new Date().getFullYear() + 1);
    }
});
