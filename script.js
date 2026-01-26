document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const elements = {
        // Inputs
        suprafata: document.getElementById('suprafata'),
        productie: document.getElementById('productie'),
        aipa: document.getElementById('aipa_subventie'),
        hangar_mp: document.getElementById('hangar_mp'),
        hangar_pret_mp: { value: 160 }, // Fixed base but can be extended
        ingrasamant_kg_ha: document.getElementById('ingrasamant_kg_ha'),
        pret_sezon: document.getElementById('pret_sezon'),
        pret_extrasezon: document.getElementById('pret_extrasezon'),
        diesel_cons: document.getElementById('diesel_cons'),
        diesel_price: document.getElementById('diesel_price'),
        utilaj_nou: document.getElementById('utilaj_nou'),

        // Display Values (Labels)
        val_suprafata: document.getElementById('val-suprafata'),
        val_productie: document.getElementById('val-productie'),
        val_hangar_mp: document.getElementById('val-hangar_mp'),

        // Results
        res_inv_hangar: document.getElementById('res-inv-hangar'),
        res_profit_stocare: document.getElementById('res-profit-stocare'),
        res_degradare: document.getElementById('res-degradare'),
        res_eco_fertilizer: document.getElementById('res-eco-fertilizer'),
        res_eco_diesel: document.getElementById('res-eco-diesel'),
        res_eco_demo: document.getElementById('res-eco-demo'),
        res_total_savings: document.getElementById('res-total-savings'),
        res_payback: document.getElementById('res-payback'),
        summary_text: document.getElementById('summary-text'),

        // Controls
        btn_export: document.getElementById('btn-export-pdf'),
        toggle_btns: document.querySelectorAll('.toggle-btn')
    };

    let scenarioMDL = 0.5; // Default scenario

    // 2. Helper Functions
    const formatEUR = (val) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const formatMDL = (val) => new Intl.NumberFormat('ro-RO').format(Math.round(val)) + ' MDL';
    const MDL_TO_EUR = 1 / 19.23;

    // 3. Calculation Engine
    const calculate = () => {
        // Raw Data
        const area = parseFloat(elements.suprafata.value);
        const yieldPerHa = parseFloat(elements.productie.value);
        const hangarMp = parseFloat(elements.hangar_mp.value);
        const applyAIPA = elements.aipa.checked;

        // Update Labels
        elements.val_suprafata.textContent = area;
        elements.val_productie.textContent = yieldPerHa.toFixed(1);
        elements.val_hangar_mp.textContent = hangarMp;

        // --- Module 1: Investment Costs ---
        const baseHangarCost = hangarMp * 160;
        const netHangarCost = applyAIPA ? baseHangarCost * 0.5 : baseHangarCost;
        elements.res_inv_hangar.textContent = formatEUR(netHangarCost);

        // --- Module 2: Storage & Quality (ROI) ---
        const totalYieldTones = area * yieldPerHa;
        const hangarCapacity = hangarMp * 2.5;
        const storedTones = Math.min(totalYieldTones, hangarCapacity);
        const profitMDL = (storedTones * 1000) * scenarioMDL;

        // Quality Factor (5% degradation on old concrete storage)
        const degradationCostEUR = (storedTones * 300) * 0.05; // Assuming 300 EUR/t value

        elements.res_profit_stocare.textContent = formatMDL(profitMDL);
        elements.res_degradare.textContent = formatEUR(degradationCostEUR);

        // --- Module 3: Fertilizer Economy ---
        const fertKgPerHa = parseFloat(elements.ingrasamant_kg_ha.value);
        const priceSeason = parseFloat(elements.pret_sezon.value);
        const priceOffSeason = parseFloat(elements.pret_extrasezon.value);
        const fertEconomy = (priceSeason - priceOffSeason) * (area * fertKgPerHa / 1000);
        elements.res_eco_fertilizer.textContent = formatEUR(fertEconomy);

        // --- Module 4: GPS & Diesel ---
        const dCons = parseFloat(elements.diesel_cons.value);
        const dPrice = parseFloat(elements.diesel_price.value);
        const dieselSaving = area * 5 * dPrice; // 5L saved per ha average
        // Also 10% saving on seeds/fert via overlap elimination
        const totalInputsCost = (area * 200) + (area * (fertKgPerHa * priceSeason / 1000));
        const gpsInputSaving = totalInputsCost * 0.10;
        const totalPrecisionSaving = dieselSaving + gpsInputSaving;
        elements.res_eco_diesel.textContent = formatEUR(totalPrecisionSaving);

        // --- Module 5: Demo vs New ---
        const priceNew = parseFloat(elements.utilaj_nou.value);
        const priceDemo = priceNew * 0.75;
        const demoSaving = priceNew - priceDemo;
        const netDemoInvestment = applyAIPA ? priceDemo * 0.5 : priceDemo;
        elements.res_eco_demo.textContent = formatEUR(demoSaving);

        // --- Final Integration (B2B Report) ---
        const annualStorageProfitEUR = profitMDL * MDL_TO_EUR;
        const totalAnnualSaving = annualStorageProfitEUR + fertEconomy + totalPrecisionSaving + degradationCostEUR;

        elements.res_total_savings.textContent = formatEUR(totalAnnualSaving);

        // Payback Calculation
        const totalInvestment = netHangarCost + (netDemoInvestment || 0);
        const paybackSeasons = totalAnnualSaving > 0 ? (totalInvestment / totalAnnualSaving).toFixed(1) : 0;
        elements.res_payback.textContent = paybackSeasons + ' Sezoane';

        // Executive Narrative
        elements.summary_text.innerHTML = `
            Domnule fermier, prin investițiile propuse, ferma dumneavoastră de <strong>${area} ha</strong> 
            va genera o economie operațională de <strong>${formatEUR(totalAnnualSaving)}</strong> anual. 
            Doar din diferența de preț la îngrășăminte achiziționate iarna, salvați <strong>${formatEUR(fertEconomy)}</strong>, 
            sumă care acoperă o parte semnificativă din costurile fixe. 
            Investiția totală<sup>*</sup> se recuperează complet în doar <strong>${paybackSeasons} sezoane</strong>, 
            după care profitul rămâne integral în fermă.
        `;
    };

    // 4. Event Listeners
    [elements.suprafata, elements.productie, elements.hangar_mp, elements.aipa,
    elements.ingrasamant_kg_ha, elements.pret_sezon, elements.pret_extrasezon,
    elements.diesel_cons, elements.diesel_price, elements.utilaj_nou].forEach(el => {
        el.addEventListener('input', calculate);
    });

    elements.toggle_btns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.toggle_btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scenarioMDL = parseFloat(btn.dataset.mdl);
            calculate();
        });
    });

    // 5. PDF Export
    elements.btn_export.addEventListener('click', () => {
        const content = document.getElementById('calculator-content');
        const opt = {
            margin: 0.5,
            filename: 'Raport_ROI_AgroSoyuz.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Hide buttons for PDF
        elements.btn_export.style.display = 'none';

        html2pdf().set(opt).from(content).save().then(() => {
            elements.btn_export.style.display = 'block';
        });
    });

    // Initial run
    calculate();
});
