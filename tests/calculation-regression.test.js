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

function loadSimulationApi() {
    const scriptPath = path.join(__dirname, '..', 'script.js');
    const source = fs.readFileSync(scriptPath, 'utf8') + `
globalThis.__testExports = {
    calculateScenarioPortfolioGrowth,
    getProjectionDuration,
    getStressScenarioDefinition,
    runMonteCarloAnalysis,
    buildInflationFactors,
    getPercentile,
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
        t(key) {
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
            getItem() {
                return null;
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
        Chart: function Chart() {
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

test('stress extra cost scenario schedules the expected shock year and amount', () => {
    const api = loadSimulationApi();
    api.resetExtraCosts();

    const inputs = {
        ...createBaseInputs(),
        endAge1: 42,
        endAge2: 42,
        annualSpending: 40000
    };

    const definition = api.getStressScenarioDefinition('stress-extra-cost', inputs);
    const startYear = new Date().getFullYear();

    assert.equal(definition.summaryParams.amount, 30000);
    assert.equal(definition.summaryParams.year, startYear + 5);
    assert.deepEqual(plain(definition.scenario.extraCostShocks), { 5: 30000 });
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
