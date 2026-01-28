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
        nord: { grau: 5.0, porumb: 7.0, floare: 2.8, rapita: 3.5 },
        centru: { grau: 4.0, porumb: 5.0, floare: 2.4, rapita: 3.0 },
        sud: { grau: 3.0, porumb: 3.0, floare: 1.8, rapita: 2.2 }
    };

    const formatEUR = (val) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const formatMDL = (val) => new Intl.NumberFormat('ro-RO').format(Math.round(val)) + ' MDL';
    const MDL_TO_EUR = 1 / 19.23;

    // 3. Calculation Engine
    const calculate = () => {
        const zone = elements.zona.value;

        // Handle Multi-Crop Detailed Selection
        let totalArea = 0;
        let totalProductionTones = 0;
        const selectedCrops = [];

        document.querySelectorAll('input[name="crop_enabled"]:checked').forEach(cb => {
            const cropType = cb.value;
            const haInput = document.querySelector(`.crop-ha[data-crop="${cropType}"]`);
            const yieldInput = document.querySelector(`.crop-yield[data-crop="${cropType}"]`);

            const areaVal = parseFloat(haInput.value) || 0;
            const yieldVal = parseFloat(yieldInput.value) || 0;

            if (areaVal > 0) {
                totalArea += areaVal;
                totalProductionTones += areaVal * yieldVal;
                selectedCrops.push(cropType);
            }
        });

        const averageYield = totalArea > 0 ? totalProductionTones / totalArea : 0;

        // Update values used by ROI modules
        const area = totalArea;
        const yieldPerHa = averageYield;

        const hangarMp = parseFloat(elements.hangar_mp.value);
        const aipaPercent = parseFloat(document.getElementById('aipa_subventie').value);
        const dPrice = parseFloat(elements.diesel_price.value);
        const fertKgPerHa = parseFloat(elements.ingrasamant_kg_ha.value);
        const techYear = document.getElementById('tehnologie_utilaj').value;

        // Update UI Labels
        elements.val_suprafata.textContent = totalArea.toLocaleString('ro-RO');
        elements.val_productie.textContent = averageYield.toFixed(2);
        elements.val_hangar_mp.textContent = hangarMp;

        // --- Module 1: Fuel Efficiency ---
        // 2022: 15L saving, 2023-2025: 18L saving
        const fuelSavingL = (techYear === '2022') ? 15 : 18;
        const dieselSavingEUR = area * fuelSavingL * dPrice;
        elements.res_eco_diesel.textContent = formatEUR(dieselSavingEUR);

        // --- Module 2: Input Arbitrage (Hangar) ---
        const arbitrageMDL = ((area * fertKgPerHa) / 1000) * 2500;
        elements.res_eco_arbitraj.textContent = formatMDL(arbitrageMDL);
        const arbitrageEUR = arbitrageMDL * MDL_TO_EUR;

        // --- Module 3: Storage ROI & Scenariu (Dual Calculation) ---
        const hangarCapacity = hangarMp * 2.5;
        const totalYieldTones_val = area * yieldPerHa;
        const storedTones = Math.min(totalYieldTones_val, hangarCapacity);

        // Scenario 1: 0.5 MDL
        const storageProfitMDL_05 = (storedTones * 1000) * 0.5;
        const storageProfitEUR_05 = storageProfitMDL_05 * MDL_TO_EUR;

        // Scenario 2: 1.0 MDL
        const storageProfitMDL_10 = (storedTones * 1000) * 1.0;
        const storageProfitEUR_10 = storageProfitMDL_10 * MDL_TO_EUR;

        // Use the currently selected scenario for the general display values
        const storageProfitMDL = (storedTones * 1000) * scenarioMDL;
        const storageProfitEUR = storageProfitMDL * MDL_TO_EUR;
        elements.res_profit_stocare.textContent = formatMDL(storageProfitMDL);

        // Quality Factor (5% degradation)
        const degradationCostEUR = (storedTones * 300) * 0.05;
        elements.res_degradare.textContent = formatEUR(degradationCostEUR);

        // --- Module 4: Technologies (GPS & Demo) ---
        const totalInputsEstimEUR = (area * 200) + (area * (fertKgPerHa * 600 / 1000));
        // 2023+ tech has better GPS/Section control (12% vs 10%)
        const gpsSavingPercent = (techYear === '2022') ? 0.10 : 0.12;
        const gpsSavingEUR = totalInputsEstimEUR * gpsSavingPercent;
        elements.res_eco_gps.textContent = formatEUR(gpsSavingEUR);

        const priceNew = parseFloat(elements.utilaj_nou.value);
        // Discount factor for demo units
        const discountFactor = (techYear === '2022') ? 0.75 : 0.80;
        const priceDemo = priceNew * discountFactor;
        const demoSavingEUR = priceNew - priceDemo;
        elements.res_eco_demo.textContent = formatEUR(demoSavingEUR);

        // --- Totals ---
        const totalAnnualSavingsEUR = dieselSavingEUR + arbitrageEUR + storageProfitEUR + degradationCostEUR + gpsSavingEUR;
        elements.res_total_savings.textContent = formatEUR(totalAnnualSavingsEUR);

        const baseInvestmentEUR = (hangarMp * 160) + priceDemo;
        const netInvestmentEUR = baseInvestmentEUR * (1 - aipaPercent);
        const paybackSeasons = totalAnnualSavingsEUR > 0 ? (netInvestmentEUR / totalAnnualSavingsEUR).toFixed(1) : 0;
        elements.res_payback.textContent = paybackSeasons + ' Sezoane';

        // --- Efficiency Score ---
        const score = Math.min(100, Math.round((totalAnnualSavingsEUR / (netInvestmentEUR / 5 + 1)) * 50));
        elements.score_badge.textContent = `Scor: ${score}`;
        elements.score_badge.style.background = score > 70 ? '#4caf50' : '#fbc02d';

        // --- Dynamic Conclusions ---
        const namesMap = { grau: 'Grâu', porumb: 'Porumb', floare: 'Floarea Soarelui', rapita: 'Rapiță' };
        const cropsListLong = selectedCrops.length > 0
            ? selectedCrops.map(c => namesMap[c] || c).join(', ')
            : 'nicio cultură selectată';

        // Calculate detailed gains per cereal for both scenarios
        let cropGainsHtml_05 = '';
        let cropGainsHtml_10 = '';
        selectedCrops.forEach(cropType => {
            const haInput = document.querySelector(`.crop-ha[data-crop="${cropType}"]`);
            const yieldInput = document.querySelector(`.crop-yield[data-crop="${cropType}"]`);
            const prodT = (parseFloat(haInput.value) || 0) * (parseFloat(yieldInput.value) || 0);

            if (prodT > 0 && totalProductionTones > 0) {
                const cropStored = (prodT / totalProductionTones) * storedTones;
                const gain05 = (cropStored * 1000) * 0.5;
                const gain10 = (cropStored * 1000) * 1.0;

                if (gain05 > 0) cropGainsHtml_05 += `<li>${namesMap[cropType]}: +${formatMDL(gain05)}</li>`;
                if (gain10 > 0) cropGainsHtml_10 += `<li>${namesMap[cropType]}: +${formatMDL(gain10)}</li>`;
            }
        });

        const storageBenefitsEUR = arbitrageEUR + storageProfitEUR + degradationCostEUR;

        elements.conclusions_box.innerHTML = `
            <div class="scenario-comparison" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="conclusion-item" style="background: #fdfcf0; border-left: 5px solid #fbc02d;">
                    <p>📉 <strong>Scenariu Prudent (0.5 MDL/kg)</strong></p>
                    <ul style="list-style: none; padding: 0.5rem 0 0 0.5rem; margin: 0; font-size: 0.85rem;">
                        ${cropGainsHtml_05 || '<li>Fără profit stocare</li>'}
                    </ul>
                    <p style="margin-top: 0.8rem; border-top: 1px dashed #ccc; padding-top: 0.5rem; font-weight: 700;">
                        Câștig Stocare: ${formatMDL(storageProfitMDL_05)}
                    </p>
                </div>
                <div class="conclusion-item" style="background: #f0f7f0; border-left: 5px solid #4caf50;">
                    <p>📈 <strong>Scenariu Optimist (1.0 MDL/kg)</strong></p>
                    <ul style="list-style: none; padding: 0.5rem 0 0 0.5rem; margin: 0; font-size: 0.85rem;">
                        ${cropGainsHtml_10 || '<li>Fără profit stocare</li>'}
                    </ul>
                    <p style="margin-top: 0.8rem; border-top: 1px dashed #ccc; padding-top: 0.5rem; font-weight: 700;">
                        Câștig Stocare: ${formatMDL(storageProfitMDL_10)}
                    </p>
                </div>
            </div>

            <div class="conclusion-item" style="margin-top: 15px;">
                <p>❄️ <strong>Strategia Achizițiilor de Iarnă:</strong></p>
                <p>Prin stocarea semințelor și îngrășămintelor procurate iarna (când prețurile sunt minime), generați un extra-câștig de <strong>${formatMDL(arbitrageMDL)}</strong> (${formatEUR(arbitrageEUR)}).</p>
            </div>
            
            <div class="conclusion-item">
                <p>🚜 <strong>Eficiență Tehnică:</strong> Utilajul nou (${techYear}) economisește <strong>${formatEUR(dieselSavingEUR + gpsSavingEUR)}</strong> anual prin motorină și precizie GPS.</p>
            </div>
        `;

        // Executive Narrative - More Farmer Friendly
        const maxTotalGain = dieselSavingEUR + gpsSavingEUR + arbitrageEUR + storageProfitEUR_10 + degradationCostEUR;
        elements.summary_text.innerHTML = `
            Domnule fermier, pentru suprafața de <strong>${area.toLocaleString('ro-RO')} ha</strong> cultivată cu <strong>${cropsListLong}</strong>, 
            lipsa depozitului vă face să pierdeți între <strong>${formatEUR(storageProfitEUR_05 + arbitrageEUR)}</strong> și <strong>${formatEUR(storageProfitEUR_10 + arbitrageEUR)}</strong> anual. 
            Investiția în infrastructura <b>Otig Holdings</b> securizează profitul prin achiziții de iarnă ieftine și vânzări la prețuri maxime. 
            Profitul anual total poate crește cu până la <strong>${formatEUR(maxTotalGain)}</strong>.
        `;
    };

    // 4. Regional Preset Handler
    const updatePresets = () => {
        calculate();
    };

    // 5. Event Listeners
    elements.zona.addEventListener('change', updatePresets);

    // Listen for any crop input change
    document.querySelectorAll('input[name="crop_enabled"]').forEach(cb => {
        cb.addEventListener('change', calculate);
    });
    document.querySelectorAll('.crop-ha, .crop-yield').forEach(input => {
        input.addEventListener('input', calculate);
    });

    // Listen for AIPA and Technology changes
    document.getElementById('aipa_subventie').addEventListener('change', calculate);
    document.getElementById('tehnologie_utilaj').addEventListener('change', calculate);

    [elements.hangar_mp, elements.ingrasamant_kg_ha,
    elements.diesel_price, elements.utilaj_nou].forEach(el => {
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
            margin: 0.5,
            filename: 'Raport_Otig_Holdings_ROI.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        elements.btn_export.style.display = 'none';
        html2pdf().set(opt).from(elements.calculator_content).save().then(() => {
            elements.btn_export.style.display = 'block';
        });
    });

    // Initial Trigger
    updatePresets();
});
