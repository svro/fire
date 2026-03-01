// 1. Bepaal de standaardtaal op basis van de browser of localStorage
const userLang = localStorage.getItem('taal') || navigator.language.split('-')[0] || 'nl';

// 2. Initialiseer i18next
i18next
  .use(i18nextHttpBackend) // Activeer de plugin om JSON te laden
  .use(i18nextBrowserLanguageDetector) 
  .init({
    //lng: 'nl',             // Start in het Nederlands
    fallbackLng: 'en',     // Val terug op Engels als NL niet bestaat
    backend: {
      // 2. Vertel waar de JSON bestanden staan. {{lng}} wordt automatisch 'nl' of 'en'
      loadPath: '/locales/{{lng}}.json' 
    }
  })
  .then(function() {
    // 3. Deze code draait pas zodra de JSON succesvol is gedownload
    vertaalPagina();
  });

function vertaalPagina() {
    // Zoek alle elementen met een data-i18n attribuut in de HTML
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(el => {
        const key = el.getAttribute('data-i18n'); // Bijv: 'welkomst_titel'
        el.innerText = i18next.t(key);            // Haal de tekst uit de JSON en plak het in de HTML
    });
}

// 3. Functie om alle teksten in de interface te updaten
function updateUI() {
    //document.getElementById('header-title').textContent = i18next.t('titel');
    
    // Variabelen doorgeven aan de vertaling
    //document.getElementById('greeting').textContent = i18next.t('groet', { naam: 'Stijn' });
  }
  
// 4. Taal wijzigen via een dropdown of knop
function veranderTaal(nieuweTaal) {
    i18next.changeLanguage(nieuweTaal).then(() => {
        localStorage.setItem('taal', nieuweTaal);
        updateUI();
    });
}

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
const cost1Slider = document.getElementById('cost1');
const cost1BeginYearSlider = document.getElementById('cost1BeginYear');
const cost1EndYearSlider = document.getElementById('cost1EndYear');
const cost2Slider = document.getElementById('cost2');
const cost2BeginYearSlider = document.getElementById('cost2BeginYear');
const cost2EndYearSlider = document.getElementById('cost2EndYear');
const cost3Slider = document.getElementById('cost3');
const cost3BeginYearSlider = document.getElementById('cost3BeginYear');
const cost3EndYearSlider = document.getElementById('cost3EndYear');
//const swrSlider = document.getElementById('swr');

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
const cost1Value = document.getElementById('cost1Value');
const cost1BeginYearValue = document.getElementById('cost1BeginYearValue');
const cost1EndYearValue = document.getElementById('cost1EndYearValue');
const cost2Value = document.getElementById('cost2Value');
const cost2BeginYearValue = document.getElementById('cost2BeginYearValue');
const cost2EndYearValue = document.getElementById('cost2EndYearValue');
const cost3Value = document.getElementById('cost3Value');
const cost3BeginYearValue = document.getElementById('cost3BeginYearValue');
const cost3EndYearValue = document.getElementById('cost3EndYearValue');
//const swrValue = document.getElementById('swrValue');

// Chart setup
const ctx = document.getElementById('portfolioChart').getContext('2d');
let portfolioChart = null;

let extraCosts = []; // array van { description, amount, startAge, endAge }

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

// Calculate portfolio growth and depletion
function calculatePortfolioGrowth(currentAge1, retirementAge1, endAge1, currentAge2, retirementAge2, endAge2, currentAssets, annualReturn, annualSpending, annualContribution, annualContribution2, inflation, pensionAge, monthlyPension, pensionAge2, monthlyPension2/*, swr*/) {
    const yearsToRetirement1 = retirementAge1 - currentAge1;
    const yearsToRetirement2 = retirementAge2 - currentAge2;
    const yearsAfterRetirement1 = endAge1 - retirementAge1;
    const yearsAfterRetirement2 = endAge2 - retirementAge2;
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
        fireAge: null,
        fireValue: null
    };
    
    let portfolioValue = currentAssets;
    const annualReturnRate = annualReturn / 100;
    const monthlyReturnRate = Math.pow(1+annualReturnRate, 1/12)-1;
    const inflationRate = inflation / 100;
    
    
    // Calculate FIRE number: net spending when both pensions are active
    const annualPension1 = monthlyPension * 12;
    const annualPension2 = monthlyPension2 * 12;
    const totalAnnualPension = annualPension1 + annualPension2;
    const netAnnualSpending = Math.max(0, annualSpending /*- totalAnnualPension*/);
    //const fireNumber = netAnnualSpending / (swr / 100);
    
    // Start with base values
    let currentAnnualSpending = annualSpending;
    
    // Add starting point
    data.years.push( new Date().getFullYear()-2000)
    const currentYear = data.years.at(-1); // voor fase 1 en 2
    extraCosts.forEach(cost => {
        if (currentYear >= cost.startYear - 2000 && currentYear <= cost.endYear - 2000) {
            portfolioValue -= cost.amount;
            if (portfolioValue < 0) portfolioValue = 0;
        }
    });
    data.ages1.push(currentAge1);
    data.ages2.push(currentAge2);
    data.values.push(portfolioValue);
    data.growthYears.push(new Date().getYear()-100);
    data.growthValues.push(portfolioValue);
    
    /*
    // Check if already FIRE
    if (portfolioValue >= fireNumber) {
        data.fireAge = currentAge1;
        data.fireValue = portfolioValue;
    }*/
    
    // Calculate for each year until retirement (growth phase)
    // Internally calculate monthly, but only store yearly values
    let currentAnnualContribution = annualContribution
    for (let year = 1; year <= Math.min(yearsToRetirement1, yearsToRetirement2); year++) {
        // Apply inflation to contribution at the start of each year
        if (year > 1) {
            currentAnnualContribution = currentAnnualContribution * (1 + inflationRate);
        }
       
        portfolioValue = portfolioValue * (1 + annualReturnRate) + currentAnnualContribution;
       
        const currentYear = data.years.at(-1) + 1; // voor fase 1 en 2
        extraCosts.forEach(cost => {
            if (currentYear >= cost.startYear - 2000 && currentYear <= cost.endYear - 2000) {
                let inflatedCost  = cost.amount * Math.pow(1 + inflationRate, currentYear -  data.years[0]);
                //console.log(Math.pow(1 + inflationRate, currentYear - (cost.startYear - 2000)));
                portfolioValue -= inflatedCost;
                if (portfolioValue < 0) portfolioValue = 0;
            }
        });
        // Check if FIRE is reached this year
        /*
        if (data.fireAge === null && portfolioValue >= fireNumber) {
            //alert(portfolioValue + ' ' + fireNumber);
            data.fireAge = currentAge1 + year;
            data.fireValue = portfolioValue;
        }*/
        
        // Store yearly value
        data.years.push(data.years.at(-1)+1)
        data.ages1.push(data.ages1.at(-1)+1);
        data.ages2.push(data.ages2.at(-1)+1);
        data.values.push(portfolioValue);
        data.growthYears.push(data.growthYears.at(-1)+1);
        data.growthValues.push(portfolioValue);
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
            extraCosts.forEach(cost => {
                if (currentYear >= cost.startYear - 2000 && currentYear <= cost.endYear - 2000) {
                    let inflatedCost = cost.amount * Math.pow(1 + inflationRate, currentYear - data.years[0]);
                    portfolioValue -= inflatedCost;
                    if (portfolioValue < 0) portfolioValue = 0;
                }
            });

            if (portfolioValue <= 0) {
                portfolioValue = 0;
                data.years.push(data.years.at(-1)+1)
                data.ages1.push(data.ages1.at(-1)+1);
                data.ages2.push(data.ages2.at(-1)+1);
                data.values.push(portfolioValue);
                data.oneWorksYears.push(data.oneWorksYears.at(-1)+1);
                data.oneWorksValues.push(portfolioValue);
                break;
            }

            data.years.push(data.years.at(-1)+1)
            data.ages1.push(data.ages1.at(-1)+1);
            data.ages2.push(data.ages2.at(-1)+1);
            data.values.push(portfolioValue);
            data.oneWorksYears.push(data.years.at(-1));
            data.oneWorksValues.push(portfolioValue);
        }
    }

    // Add retirement point to both phases for continuity
    data.withdrawalYears.push(data.years.at(-1));
    data.withdrawalValues.push(portfolioValue);
    
    // Calculate for each year after retirement until end age (withdrawal phase)
    // Internally calculate monthly, but only store yearly values
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
        const monthlyPensionThisYear = monthlyPension1ThisYear + monthlyPension2ThisYear;
        
        // Convert annual spending to monthly spending for this year
        const monthlySpending = currentAnnualSpending / 12;
        // Net monthly withdrawal = spending - total pension (both persons)
        const netMonthlyWithdrawal = monthlySpending - monthlyPensionThisYear;
        
        portfolioValue = portfolioValue * (1 + annualReturnRate) - netMonthlyWithdrawal*12       

        const currentYear = data.years.at(-1) + 1;
        extraCosts.forEach(cost => {
            if (currentYear >= cost.startYear - 2000 && currentYear <= cost.endYear - 2000) {
                let inflatedCost = cost.amount * Math.pow(1 + inflationRate, currentYear - data.years[0]);
                portfolioValue -= inflatedCost;
              if (portfolioValue < 0) portfolioValue = 0;
            }
          });

         // Stop if portfolio goes negative
         if (portfolioValue <= 0) {
            portfolioValue = 0;
            break;
        }
        
        // Store yearly value
        if (portfolioValue <= 0) {
            portfolioValue = 0;
            data.years.push(data.years.at(-1)+1)
            if (data.ages1.at(-1) < endAge1) data.ages1.push(data.ages1.at(-1)+1);
            if (data.ages2.at(-1) < endAge2) data.ages2.push(data.ages2.at(-1)+1);
            data.values.push(portfolioValue);
            data.withdrawalYears.push(data.withdrawalYears.at(-1)+1);
            data.withdrawalValues.push(portfolioValue);
            break;
        }

        data.years.push(data.years.at(-1)+1)
        if (data.ages1.at(-1) < endAge1) data.ages1.push(data.ages1.at(-1)+1);
        if (data.ages2.at(-1) < endAge2) data.ages2.push(data.ages2.at(-1)+1);
        data.values.push(portfolioValue);
        data.withdrawalYears.push(data.withdrawalYears.at(-1)+1);
        data.withdrawalValues.push(portfolioValue);
    }
    
    return data;
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
     // Lees alle rijen uit de tabel
     extraCosts = [];    
     extraCosts.push({
         amount: parseFloat(cost1Slider.value) || 0,
         startYear: parseInt(cost1BeginYearSlider.value) || 2026,
         endYear: parseInt(cost1EndYearSlider.value) || 2026
     });
     extraCosts.push({
         amount: parseFloat(cost2Slider.value) || 0,
         startYear: parseInt(cost2BeginYearSlider.value) || 2026,
         endYear: parseInt(cost2EndYearSlider.value) || 2026
     });
     extraCosts.push({
         amount: parseFloat(cost3Slider.value) || 0,
         startYear: parseInt(cost3BeginYearSlider.value) || 2026,
         endYear: parseInt(cost3EndYearSlider.value) || 2026
     });

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
        monthlyPension2/*,
        swr*/
    );
    
    if (portfolioChart) {
        portfolioChart.destroy();
    }

    
    
    // Create datasets with null values for the parts we don't want to show
    const growthData = data.years.map((year, idx) => {
        const growthIdx = data.growthYears.indexOf(year);
        return growthIdx >= 0 ? data.growthValues[growthIdx] : null;
    });

    const oneWorksData = data.years.map((year, idx) => {
        const growthIdx = data.oneWorksYears.indexOf(year);
        return growthIdx >= 0 ? data.oneWorksValues[growthIdx] : null;
    });
    
    const withdrawalData = data.years.map((year, idx) => {
        const withdrawalIdx = data.withdrawalYears.indexOf(year);
        return withdrawalIdx >= 0 ? data.withdrawalValues[withdrawalIdx] : null;
    });
    
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
            label: '2 werken',
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
            label: '1 werkt',
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
            label: '0 werken',
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
            label: 'FIRE bereikt',
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
                        font: { size: window.innerWidth < 768 ? 12 : 14 },
                        padding: window.innerWidth < 768 ? 8 : 15,
                        boxWidth: window.innerWidth < 768 ? 20 : 40
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
                        /*
                        label: function(context) {
                            if (context.dataset.label === 'FIRE bereikt') {
                                return 'FIRE bereikt: €' + formatNumber(context.parsed.y) + ' (leeftijd ' + data.fireAge + ')';
                            }
                            return 'Waarde: €' + formatNumber(context.parsed.y);
                        },
                        afterLabel: function(context) {
                            if (context.dataset.label === 'FIRE bereikt') {
                                //const totalAnnualPension = monthlyPension * 12 + monthlyPension2 * 12;
                                //const netSpending = Math.max(0,annualSpending - totalAnnualPension);
                                const netSpending = Math.max(0, annualSpending);
                                const fireNumber = netSpending / (swr / 100);
                                return 'FIRE number: €' + formatNumber(fireNumber);
                            }
                            return '';
                        }
                        */
                        title: function(contexts) {
                            const idx = contexts[0].dataIndex;
                            const year = data.years[idx];
                            return `20${year}`;
                        },
                        label: function(context) {
                            const idx = context.dataIndex;
                            const age1 = data.ages1[idx];
                            const age2 = data.ages2[idx];
                            const ages = [age1 !== undefined ? `P1: ${age1}j` : '', age2 !== undefined ? `P2: ${age2}j` : ''].filter(Boolean).join(' | ');
                            return `€ ${context.parsed.y.toFixed(2)}  (${ages})`;
                            //'€ ' + (num / 1000).toFixed(1) + 'K';'€ ' + (num / 1000).toFixed(1) + 'K';
                          }
                          
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: window.innerWidth < 768 ? false: true,
                        text: 'Datum (in jaren na 2000)',
                        font: { 
                            size: window.innerWidth < 768 ? 10 : 12,
                            weight: window.innerWidth < 768 ? '400' : '600'
                         },
                        padding: { top: 10, bottom: 10 }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        },
                        callback: function(value, index) {
                            const year = data.years[index];
                            const age1 = data.ages1[index];
                            const age2 = data.ages2[index];
                            if (year === undefined) return '';
                            return [
                                `${year}`, 
                                age1 !== undefined ? `${age1}j`:'',
                                age2 !== undefined ? `${age2}j`:''
                            ];
                        }
                    }
                },
                y: {
                    title: {
                        display: window.innerWidth < 768 ? false: true,
                        text: 'Portefeuille Waarde (€)',
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
                        font: { size: window.innerWidth < 768 ? 10 : 12 },
                        callback: function(value) {
                            return formatNumber(value);
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

   

}

// Update value displays
function updateValueDisplays() {
    currentAge1Value.textContent = currentAge1Slider.value;
    retirementAge1Value.textContent = retirementAge1Slider.value;
    endAge1Value.textContent = endAge1Slider.value;
    currentAge2Value.textContent = currentAge2Slider.value;
    retirementAge2Value.textContent = retirementAge2Slider.value;
    endAge2Value.textContent = endAge2Slider.value;
    currentAssetsValue.textContent = formatNumber(currentAssetsSlider.value);
    portfolioReturnsValue.textContent = parseFloat(portfolioReturnsSlider.value).toFixed(1);
    inflationValue.textContent = parseFloat(inflationSlider.value).toFixed(1);
    annualSpendingValue.textContent = formatNumber(annualSpendingSlider.value);
    annualContributionValue.textContent = formatNumber(annualContributionSlider.value);
    annualContribution2Value.textContent = formatNumber(annualContribution2Slider.value);    
    pensionAgeValue.textContent = pensionAgeSlider.value;
    monthlyPensionValue.textContent = formatNumber(monthlyPensionSlider.value);
    pensionAge2Value.textContent = pensionAge2Slider.value;
    monthlyPension2Value.textContent = formatNumber(monthlyPension2Slider.value);
    cost1Value.textContent = formatNumber(cost1Slider.value);
    cost1BeginYearValue.textContent = cost1BeginYearSlider.value;
    cost1EndYearValue.textContent = cost1EndYearSlider.value;
    cost2Value.textContent = formatNumber(cost2Slider.value);
    cost2BeginYearValue.textContent = cost2BeginYearSlider.value;
    cost2EndYearValue.textContent = cost2EndYearSlider.value;
    cost3Value.textContent = formatNumber(cost3Slider.value);
    cost3BeginYearValue.textContent = cost3BeginYearSlider.value;
    cost3EndYearValue.textContent = cost3EndYearSlider.value;
    //swrValue.textContent = parseFloat(swrSlider.value).toFixed(1);
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

cost1Slider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

cost1BeginYearSlider.addEventListener('input', function() {    
    if (parseInt(this.value) > parseInt(cost1EndYearSlider.value)) {
        cost1EndYearSlider.value = parseInt(this.value);
        cost1EndYearValue.textContent = cost1EndYearSlider.value;
    }
    updateValueDisplays();
    updateChart();
});

cost1EndYearSlider.addEventListener('input', function() {
    if (parseInt(this.value) < parseInt(cost1BeginYearSlider.value)) {
        cost1EndYearSlider.value = parseInt(cost1BeginYearSlider.value);
        cost1EndYearValue.textContent = cost1BeginYearSlider.value;
    }
    updateValueDisplays();
    updateChart();
});

cost2Slider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

cost2BeginYearSlider.addEventListener('input', function() {    
    if (parseInt(this.value) > parseInt(cost2EndYearSlider.value)) {
        cost2EndYearSlider.value = parseInt(this.value);
        cost2EndYearValue.textContent = cost2EndYearSlider.value;
    }
    updateValueDisplays();
    updateChart();
});

cost2EndYearSlider.addEventListener('input', function() {
    if (parseInt(this.value) < parseInt(cost2BeginYearSlider.value)) {
        cost2EndYearSlider.value = parseInt(cost2BeginYearSlider.value);
        cost2EndYearValue.textContent = cost2BeginYearSlider.value;
    }
    updateValueDisplays();
    updateChart();
});

cost3Slider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});

cost3BeginYearSlider.addEventListener('input', function() {
    if (parseInt(this.value) > parseInt(cost3EndYearSlider.value)) {
        cost3EndYearSlider.value = parseInt(this.value);
        cost3EndYearValue.textContent = cost3EndYearSlider.value;
    }
    updateValueDisplays();
    updateChart();
});

cost3EndYearSlider.addEventListener('input', function() {
    if (parseInt(this.value) < parseInt(cost3BeginYearSlider.value)) {
        cost3EndYearSlider.value = parseInt(cost3BeginYearSlider.value);
        cost3EndYearValue.textContent = cost3BeginYearSlider.value;
    }
    updateValueDisplays();
    updateChart();
});
/*
swrSlider.addEventListener('input', function() {
    updateValueDisplays();
    updateChart();
});
*/

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
    
});

//ocalStorage.removeItem('extraCosts');
//localStorage.clear();


// Initialize
updateValueDisplays();
updateChart();
