document.addEventListener('DOMContentLoaded', () => {
    // Input elements
    const inputs = {
        suprafata: document.getElementById('suprafata'),
        productie: document.getElementById('productie'),
        inputuri: document.getElementById('inputuri'),
        hangar_mp: document.getElementById('hangar_mp'),
        hangar_pret_mp: document.getElementById('hangar_pret_mp'),
        utilaj_nou: document.getElementById('utilaj_nou')
    };

    // Result elements
    const results = {
        capacitate: document.getElementById('res-capacitate'),
        costHangar: document.getElementById('res-cost-hangar'),
        roiA: document.getElementById('res-roi-a'),
        roiB: document.getElementById('res-roi-b'),
        hangarMessage: document.getElementById('hangar-message'),
        amortizare: document.getElementById('res-amortizare'),
        economieGps: document.getElementById('res-economie-gps'),
        pretDemo: document.getElementById('res-pret-demo'),
        economieDemo: document.getElementById('res-economie-demo'),
        volumTotal: document.getElementById('res-volum-total'),
        profitTotal: document.getElementById('res-profit-total')
    };

    /**
     * Formats a number as currency or fixed decimals
     * @param {number} value 
     * @param {string} suffix 
     */
    const formatValue = (value, suffix = '€') => {
        return new Intl.NumberFormat('ro-RO').format(Math.round(value)) + ' ' + suffix;
    };

    /**
     * Formats a number for MDL currency
     */
    const formatMDL = (value) => {
        return new Intl.NumberFormat('ro-RO').format(Math.round(value)) + ' MDL';
    };

    /**
     * Validates an input and shows/hides error message
     * @param {string} id 
     * @param {number} value 
     */
    const validateInput = (id, value) => {
        const errorEl = document.getElementById(`error-${id}`);
        if (value < 0 || isNaN(value)) {
            errorEl.style.display = 'block';
            return false;
        }
        errorEl.style.display = 'none';
        return true;
    };

    /**
     * Main calculation function
     */
    const calculate = () => {
        const data = {
            suprafata: parseFloat(inputs.suprafata.value) || 0,
            productie: parseFloat(inputs.productie.value) || 0,
            inputuri: parseFloat(inputs.inputuri.value) || 0,
            hangar_mp: parseFloat(inputs.hangar_mp.value) || 0,
            hangar_pret_mp: parseFloat(inputs.hangar_pret_mp.value) || 160,
            utilaj_nou: parseFloat(inputs.utilaj_nou.value) || 0
        };

        // Validate all
        let allValid = true;
        Object.keys(data).forEach(key => {
            if (!validateInput(key, data[key])) allValid = false;
        });

        if (!allValid) return;

        // 1. General Results
        const volumTotalTone = data.suprafata * data.productie;
        const volumTotalKg = volumTotalTone * 1000;
        results.volumTotal.textContent = formatValue(volumTotalKg, 'kg');

        // 2. Hangar Calculations (ROI focus)
        const costHangarEUR = data.hangar_mp * data.hangar_pret_mp;
        const capacitateTone = data.hangar_mp * 2.5; // spec: 1000mp = 2500t

        // Use either the total yield or the specific hangar capacity for storage ROI
        const toneStocabile = Math.min(volumTotalTone, capacitateTone);
        const kgStocabile = toneStocabile * 1000;

        const profitScenariuA_MDL = kgStocabile * 0.50;
        const profitScenariuB_MDL = kgStocabile * 1.00;

        // Conversion Rate derivation: 1.25M MDL = 65k EUR -> 1 EUR = 19.23 MDL
        const MDL_TO_EUR = 1 / 19.23;
        const profitScenariuB_EUR = profitScenariuB_MDL * MDL_TO_EUR;
        const procentAcoperit = costHangarEUR > 0 ? (profitScenariuB_EUR / costHangarEUR * 100).toFixed(0) : 0;

        results.capacitate.textContent = formatValue(capacitateTone, 'tone');
        results.costHangar.textContent = formatValue(costHangarEUR);
        results.roiA.textContent = formatMDL(profitScenariuA_MDL);
        results.roiB.textContent = formatMDL(profitScenariuB_MDL);

        // Dynamic Persuasive Message
        if (kgStocabile > 0) {
            results.hangarMessage.innerHTML = `
                Domnule fermier, la recolta dumneavoastră de <strong>${formatValue(toneStocabile, 'tone')}</strong>, 
                dacă aveți depozit propriu și așteptați o creștere de doar <strong>1 leu</strong> la kilogram, 
                câștigați extra <strong>${formatMDL(profitScenariuB_MDL)}</strong>. 
                Practic, din acest profit, plătiți aproape <strong>${procentAcoperit}%</strong> din costul hangarului într-un singur sezon. 
                De anul viitor, toți acești bani rămân curat în buzunarul dumneavoastră.
            `;
            results.hangarMessage.style.display = 'block';
        } else {
            results.hangarMessage.style.display = 'none';
        }

        // Amortization (Scenario B base: 1 MDL/kg)
        if (profitScenariuB_EUR > 0) {
            const aniZecimal = costHangarEUR / profitScenariuB_EUR;
            const aniIntregi = Math.floor(aniZecimal);
            const luniRest = Math.round((aniZecimal - aniIntregi) * 12);

            let amortizareText = "";
            if (aniIntregi > 0) amortizareText += `${aniIntregi} ${aniIntregi === 1 ? 'an' : 'ani'}`;
            if (luniRest > 0) {
                if (amortizareText) amortizareText += " și ";
                amortizareText += `${luniRest} ${luniRest === 1 ? 'lună' : 'luni'}`;
            }
            if (!amortizareText) amortizareText = "0 luni";

            results.amortizare.textContent = amortizareText;
        } else {
            results.amortizare.textContent = "0 ani";
        }

        // 3. GPS RTK Efficiency
        const cheltuieliInputuriTotal = data.suprafata * 200;
        const economieGps = cheltuieliInputuriTotal * 0.10;
        results.economieGps.textContent = formatValue(economieGps);

        // 4. Demo Technique
        const pretDemo = data.utilaj_nou * 0.75;
        const economieAchizitie = data.utilaj_nou - pretDemo;
        results.pretDemo.textContent = formatValue(pretDemo);
        results.economieDemo.textContent = formatValue(economieAchizitie);

        // 5. Final Total Profit Year 1
        const castigTotalAnul1 = profitScenariuB_EUR + economieGps + economieAchizitie;
        results.profitTotal.textContent = formatValue(castigTotalAnul1);

        // Animation update
        animateValue(results.profitTotal, castigTotalAnul1);
    };

    /**
     * Simple numeric animation
     */
    const animateValue = (element, target) => {
        if (target === 0) return;
        element.style.transform = 'scale(1.1)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    };

    // Add event listeners to all inputs
    Object.values(inputs).forEach(input => {
        input.addEventListener('input', calculate);
    });

    // Initial calculation
    calculate();
});
