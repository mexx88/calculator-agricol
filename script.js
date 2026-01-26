document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const elements = {
        // Inputs
        zona: document.getElementById('zona_agricola'),
        cultura: document.getElementById('tip_cultura'),
        suprafata: document.getElementById('suprafata'),
        productie: document.getElementById('productie'),
        aipa: document.getElementById('aipa_subventie'),
        hangar_mp: document.getElementById('hangar_mp'),
        ingrasamant_kg_ha: document.getElementById('ingrasamant_kg_ha'),
        diesel_price: document.getElementById('diesel_price'),
        utilaj_nou: document.getElementById('utilaj_nou'),

        // Display Values
        val_suprafata: document.getElementById('val-suprafata'),
        val_productie: document.getElementById('val-productie'),
        val_hangar_mp: document.getElementById('val-hangar_mp'),
        score_badge: document.getElementById('farm-efficiency-score'),
        conclusions_box: document.getElementById('conclusions-container'),

        // Results
        res_profit_stocare: document.getElementById('res-profit-stocare'),
        res_eco_arbitraj: document.getElementById('res-eco-arbitraj'),
        res_degradare: document.getElementById('res-degradare'),
        res_eco_diesel: document.getElementById('res-eco-diesel'),
        res_eco_gps: document.getElementById('res-eco-gps'),
        res_eco_demo: document.getElementById('res-eco-demo'),
        res_total_savings: document.getElementById('res-total-savings'),
        res_payback: document.getElementById('res-payback'),
        summary_text: document.getElementById('summary-text'),

        // Controls
        btn_export: document.getElementById('btn-export-pdf'),
        toggle_btns: document.querySelectorAll('.toggle-btn'),
        calculator_content: document.getElementById('calculator-content')
    };

    let scenarioMDL = 0.5;

    // 2. Constants & Data
    const REGIONAL_PRESETS = {
        nord: { grau: 5.0, porumb: 7.0, floare: 2.8 },
        centru: { grau: 4.0, porumb: 5.0, floare: 2.4 },
        sud: { grau: 3.0, porumb: 3.0, floare: 1.8 }
    };

    const formatEUR = (val) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const formatMDL = (val) => new Intl.NumberFormat('ro-RO').format(Math.round(val)) + ' MDL';
    const MDL_TO_EUR = 1 / 19.23;

    // 3. Calculation Engine
    const calculate = () => {
        const zone = elements.zona.value;
        const crop = elements.cultura.value;
        const area = parseFloat(elements.suprafata.value);
        const yieldPerHa = parseFloat(elements.productie.value);
        const hangarMp = parseFloat(elements.hangar_mp.value);
        const applyAIPA = elements.aipa.checked;
        const dPrice = parseFloat(elements.diesel_price.value);
        const fertKgPerHa = parseFloat(elements.ingrasamant_kg_ha.value);

        // Update UI Labels
        elements.val_suprafata.textContent = area;
        elements.val_productie.textContent = yieldPerHa.toFixed(1);
        elements.val_hangar_mp.textContent = hangarMp;

        // --- Module 1: Fuel Efficiency (2012 vs 2022) ---
        // Formula: Surface * 15L * Diesel Price
        const dieselSavingEUR = area * 15 * dPrice;
        elements.res_eco_diesel.textContent = formatEUR(dieselSavingEUR);

        // --- Module 2: Input Arbitrage (Hangar) ---
        // Formula: (Surface * 200 / 1000) * 2500 MDL
        const arbitrageMDL = ((area * fertKgPerHa) / 1000) * 2500;
        elements.res_eco_arbitraj.textContent = formatMDL(arbitrageMDL);
        const arbitrageEUR = arbitrageMDL * MDL_TO_EUR;

        // --- Module 3: Storage ROI & Scenariu ---
        const hangarCapacity = hangarMp * 2.5;
        const totalYieldTones = area * yieldPerHa;
        const storedTones = Math.min(totalYieldTones, hangarCapacity);
        const storageProfitMDL = (storedTones * 1000) * scenarioMDL;
        const storageProfitEUR = storageProfitMDL * MDL_TO_EUR;
        elements.res_profit_stocare.textContent = formatMDL(storageProfitMDL);

        // Quality Factor (5% degradation)
        const degradationCostEUR = (storedTones * 300) * 0.05;
        elements.res_degradare.textContent = formatEUR(degradationCostEUR);

        // --- Module 4: Technologies (GPS & Demo) ---
        const totalInputsEstimEUR = (area * 200) + (area * (fertKgPerHa * 600 / 1000));
        const gpsSavingEUR = totalInputsEstimEUR * 0.10;
        elements.res_eco_gps.textContent = formatEUR(gpsSavingEUR);

        const priceNew = parseFloat(elements.utilaj_nou.value);
        const priceDemo = priceNew * 0.75;
        const demoSavingEUR = priceNew - priceDemo;
        elements.res_eco_demo.textContent = formatEUR(demoSavingEUR);

        // --- Totals ---
        const totalAnnualSavingsEUR = dieselSavingEUR + arbitrageEUR + storageProfitEUR + degradationCostEUR + gpsSavingEUR;
        elements.res_total_savings.textContent = formatEUR(totalAnnualSavingsEUR);

        const baseInvestmentEUR = (hangarMp * 160) + priceDemo;
        const netInvestmentEUR = applyAIPA ? baseInvestmentEUR * 0.5 : baseInvestmentEUR;
        const paybackSeasons = totalAnnualSavingsEUR > 0 ? (netInvestmentEUR / totalAnnualSavingsEUR).toFixed(1) : 0;
        elements.res_payback.textContent = paybackSeasons + ' Sezoane';

        // --- Efficiency Score (Experimental B2B Metric) ---
        const score = Math.min(100, Math.round((totalAnnualSavingsEUR / (netInvestmentEUR / 5 + 1)) * 50));
        elements.score_badge.textContent = `Scor: ${score}`;
        elements.score_badge.style.background = score > 70 ? '#4caf50' : '#fbc02d';

        // --- Dynamic Conclusions ---
        const opportunityLossEUR = arbitrageEUR + storageProfitEUR + degradationCostEUR;
        elements.conclusions_box.innerHTML = `
            <div class="conclusion-item">
                <p>📍 În zona <strong>${zone.toUpperCase()}</strong>, pierderea ta de oportunitate prin ne-stocare este de <strong>${formatEUR(opportunityLossEUR)}</strong> pe an.</p>
            </div>
            <div class="conclusion-item">
                <p>🚀 Tranziția la tehnologia 2022 îți reduce factura de combustibil cu <strong>${formatEUR(dieselSavingEUR)}</strong> anual.</p>
            </div>
        `;

        // Executive Narrative
        elements.summary_text.innerHTML = `
            Domnule fermier, ferma dumneavoastră de <strong>${area} ha</strong> din regiunea <strong>${zone}</strong> 
            poate genera economii totale de <strong>${formatEUR(totalAnnualSavingsEUR)}</strong> anual prin modernizarea infrastructurii. 
            Investiția se amortizează în <strong>${paybackSeasons} sezoane</strong>, transformând cheltuiala istorică în profit curat.
        `;
    };

    // 4. Regional Preset Handler
    const updatePresets = () => {
        const zValue = elements.zona.value;
        const cValue = elements.cultura.value;
        const presetVal = REGIONAL_PRESETS[zValue][cValue];
        elements.productie.value = presetVal;
        calculate();
    };

    // 5. Event Listeners
    elements.zona.addEventListener('change', updatePresets);
    elements.cultura.addEventListener('change', updatePresets);

    [elements.suprafata, elements.productie, elements.hangar_mp, elements.aipa,
    elements.ingrasamant_kg_ha, elements.diesel_price, elements.utilaj_nou].forEach(el => {
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

    // 6. PDF Export
    elements.btn_export.addEventListener('click', () => {
        const opt = {
            margin: 0.3,
            filename: 'Raport_Agro_Soyuz_ROI.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        elements.btn_export.style.display = 'none';
        html2pdf().set(opt).from(elements.calculator_content).save().then(() => {
            elements.btn_export.style.display = 'block';
        });
    });

    // Initial Trigger
    updatePresets();
});
