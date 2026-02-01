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
        hangar_type: document.getElementById('hangar_type'),
        ingrasamant_kg_ha: document.getElementById('ingrasamant_kg_ha'),
        diesel_price: document.getElementById('diesel_price'),
        utilaj_nou: document.getElementById('utilaj_nou'),
        soil_hardness: document.getElementById('soil_hardness'),
        current_equipment: document.getElementById('current_equipment'),
        notill_enabled: document.getElementById('notill_enabled'),

        // Display Values
        val_suprafata: document.getElementById('val-suprafata'),
        val_productie: document.getElementById('val-productie'),
        val_hangar_mp: document.getElementById('val-hangar_mp'),
        val_soil_hardness: document.getElementById('val-soil_hardness'),
        score_badge: document.getElementById('farm-efficiency-score'),
        conclusions_box: document.getElementById('conclusions-container'),

        // Comparison Results
        comparison_hardness: document.getElementById('comparison-hardness'),
        res_old_consumption: document.getElementById('res-old-consumption'),
        res_new_consumption: document.getElementById('res-new-consumption'),
        res_notill_savings: document.getElementById('res-notill-savings'),
        notill_savings_display: document.getElementById('notill-savings-display'),
        old_tech_warning: document.getElementById('old-tech-warning'),

        // Tech Recommendations
        tech_recommendations: document.getElementById('tech-recommendations'),
        pvc_benefits_section: document.getElementById('pvc-benefits-section'),

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
        const soilHardness = parseFloat(elements.soil_hardness.value);
        const currentEquip = elements.current_equipment.value;
        const noTillEnabled = elements.notill_enabled.checked;
        const hangarType = elements.hangar_type.value;

        // Update soil hardness display
        elements.val_soil_hardness.textContent = soilHardness;
        elements.comparison_hardness.textContent = soilHardness;

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
        const techYear = parseInt(document.getElementById('tehnologie_utilaj').value);

        // Update UI Labels
        elements.val_suprafata.textContent = totalArea.toLocaleString('ro-RO');
        elements.val_productie.textContent = averageYield.toFixed(2);
        elements.val_hangar_mp.textContent = hangarMp;

        // --- Equipment Comparison Logic ---
        // Old equipment consumption based on soil hardness
        let oldConsumption = 30; // Base consumption
        let oldTechExplanation = '';

        if (currentEquip === 'mtz') {
            if (soilHardness >= 86) {
                oldConsumption = 40;
                oldTechExplanation = '⚠️ Pe un sol atât de tare (86), MTZ-ul patinează excesiv, crescând consumul de la 30L la 40L și distrugând transmisia.';
            } else if (soilHardness >= 70) {
                oldConsumption = 35;
                oldTechExplanation = 'Pe sol tare, MTZ-ul consumă mai mult combustibil din cauza patinării.';
            } else {
                oldTechExplanation = 'Consumul standard pentru tractoare sovietice.';
            }
        } else if (currentEquip === 'y2012') {
            oldConsumption = 28;
            if (soilHardness >= 80) oldConsumption = 33;
            oldTechExplanation = 'Tehnologie mai veche, eficiență redusă pe sol compactat.';
        } else if (currentEquip === 'y2018') {
            oldConsumption = 26;
            if (soilHardness >= 80) oldConsumption = 30;
            oldTechExplanation = 'Tehnologie relativ recentă, dar nu la nivelul 2020+.';
        }

        // New equipment consumption (stable regardless of soil hardness)
        const techYearEfficiency = {
            2020: 1.00,
            2021: 1.025,
            2022: 1.05,
            2023: 1.075,
            2024: 1.10,
            2025: 1.125
        };

        const baseNewConsumption = 26;
        const efficiencyMultiplier = techYearEfficiency[techYear] || 1.0;
        const newConsumption = baseNewConsumption / efficiencyMultiplier;

        // Display comparison
        elements.res_old_consumption.textContent = `${oldConsumption.toFixed(1)} L/ha`;
        elements.res_new_consumption.textContent = `${newConsumption.toFixed(1)} L/ha`;
        elements.old_tech_warning.textContent = oldTechExplanation;

        // No-Till savings
        const noTillSavings = 42; // L/ha
        if (noTillEnabled) {
            elements.notill_savings_display.style.display = 'block';
            elements.res_notill_savings.textContent = `${noTillSavings} L/ha`;
        } else {
            elements.notill_savings_display.style.display = 'none';
        }

        // --- Module 1: Fuel Efficiency ---
        const fuelSavingPerHa = oldConsumption - newConsumption + (noTillEnabled ? noTillSavings : 0);
        const dieselSavingEUR = area * fuelSavingPerHa * dPrice;
        elements.res_eco_diesel.textContent = formatEUR(dieselSavingEUR);

        // --- Module 2: Storage Loss Calculations based on Hangar Type ---
        let storageLossPercent = 0;
        let storageArbitrageBonus = scenarioMDL;

        switch (hangarType) {
            case 'pvc_otig':
                storageLossPercent = 0;
                elements.pvc_benefits_section.style.display = 'block';
                break;
            case 'metal':
                storageLossPercent = 2;
                elements.pvc_benefits_section.style.display = 'none';
                break;
            case 'beton_nou':
                storageLossPercent = 1;
                elements.pvc_benefits_section.style.display = 'none';
                break;
            case 'beton_vechi':
                storageLossPercent = 6;
                elements.pvc_benefits_section.style.display = 'none';
                break;
        }

        // --- Module 3: Input Arbitrage (Hangar) ---
        const arbitrageMDL = ((area * fertKgPerHa) / 1000) * 2500;
        elements.res_eco_arbitraj.textContent = formatMDL(arbitrageMDL);
        const arbitrageEUR = arbitrageMDL * MDL_TO_EUR;

        // --- Module 4: Storage ROI & Scenario ---
        const hangarCapacity = hangarMp * 2.5;
        const totalYieldTones_val = area * yieldPerHa;
        const storedTones = Math.min(totalYieldTones_val, hangarCapacity);

        // Scenario 1: 0.5 MDL
        const storageProfitMDL_05 = (storedTones * 1000) * 0.5;
        const storageProfitEUR_05 = storageProfitMDL_05 * MDL_TO_EUR;

        // Scenario 2: 1.0 MDL
        const storageProfitMDL_10 = (storedTones * 1000) * 1.0;
        const storageProfitEUR_10 = storageProfitMDL_10 * MDL_TO_EUR;

        // Use the currently selected scenario
        const storageProfitMDL = (storedTones * 1000) * scenarioMDL;
        const storageProfitEUR = storageProfitMDL * MDL_TO_EUR;
        elements.res_profit_stocare.textContent = formatMDL(storageProfitMDL);

        // Quality Factor (degradation based on hangar type)
        const degradationCostEUR = (storedTones * 300) * (storageLossPercent / 100);
        elements.res_degradare.textContent = formatEUR(degradationCostEUR);

        // --- Module 5: Technologies (GPS & Demo) ---
        const totalInputsEstimEUR = (area * 200) + (area * (fertKgPerHa * 600 / 1000));
        const gpsSavingPercent = techYear >= 2023 ? 0.12 : 0.10;
        const gpsSavingEUR = totalInputsEstimEUR * gpsSavingPercent;
        elements.res_eco_gps.textContent = formatEUR(gpsSavingEUR);

        const priceNew = parseFloat(elements.utilaj_nou.value);
        const discountFactor = techYear >= 2023 ? 0.80 : 0.75;
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

        // --- Technology Recommendations ---
        generateTechRecommendations(area, soilHardness, noTillEnabled);

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

    // Technology Recommendations Generator
    const generateTechRecommendations = (area, soilHardness, noTillEnabled) => {
        const recommendedHP = Math.ceil(area / 10) * 25;
        const combineHours = (area / 8).toFixed(1);

        let html = `
            <div class="conclusion-item">
                <p><strong>🚜 Tractor Recomandat:</strong></p>
                <p>Pentru ${area} ha, recomandăm un tractor cu minimum <strong>${recommendedHP} CP</strong> pentru eficiență optimă.</p>
            </div>
            <div class="conclusion-item">
                <p><strong>🌾 Combină:</strong></p>
                <p>Capacitate necesară: să recolteze suprafața în aproximativ <strong>${combineHours} ore</strong> de lucru efectiv.</p>
            </div>
        `;

        if (soilHardness >= 86) {
            html += `
                <div class="conclusion-item" style="background: #ffe0e0; border-left: 5px solid #d32f2f;">
                    <p><strong>⚠️ AVERTISMENT Sol Foarte Tare (${soilHardness}):</strong></p>
                    <p>Recomandăm <strong>obligatoriu</strong> utilizarea unui <b>Subsolier</b> înainte de No-Till pentru a sparge „colivia de beton" creată de anii de arătură tradițională. Fără aceasta, chiar și semănătoarea No-Till va întâmpina dificultăți.</p>
                </div>
            `;
        }

        if (noTillEnabled || soilHardness >= 70) {
            html += `
                <div class="conclusion-item">
                    <p><strong>🌱 Semănătoare No-Till:</strong></p>
                    <p>Pentru tehnologia No-Till, recomandăm <b>Agrimerin No-Till</b> cu discuri de tăiere. Este superioară față de ancore sau discuri simple pe sol compactat, asigurând plasarea corectă a seminței.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">💡 <i>No-Till înseamnă semănatul direct sub „plapuma" de paie, păstrând apa în sol și banii în buzunar.</i></p>
                </div>
            `;
        }

        html += `
            <div class="conclusion-item" style="background: #e8f5e9;">
                <p><strong>📡 RTK GPS:</strong></p>
                <p>„Ghidarea laser a tractorului" – Nu mai treceți de două ori pe același loc, economisind timp, motorină și îngrășământ. Rentabilitate în 2-3 sezoane.</p>
            </div>
            <div class="conclusion-item" style="background: #fff9e6;">
                <p><strong>🔄 MTZ vs. Otig:</strong></p>
                <p>MTZ-ul vă costă ${elements.res_old_consumption.textContent} pe pământ tare; utilajul modern Otig face aceeași treabă cu ${elements.res_new_consumption.textContent} – jumătate din „hrană"!</p>
            </div>
        `;

        elements.tech_recommendations.innerHTML = html;
    };

    // 4. Regional Preset Handler
    const updatePresets = () => {
        calculate();
    };

    // 5. Event Listeners
    elements.zona.addEventListener('change', updatePresets);
    elements.soil_hardness.addEventListener('input', calculate);
    elements.current_equipment.addEventListener('change', calculate);
    elements.notill_enabled.addEventListener('change', calculate);
    elements.hangar_type.addEventListener('change', calculate);

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
