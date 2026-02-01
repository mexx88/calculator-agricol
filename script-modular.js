document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        // Module toggles
        moduleTech: document.getElementById('module-tech'),
        moduleStorage: document.getElementById('module-storage'),
        techInputs: document.getElementById('tech-inputs'),
        storageInputs: document.getElementById('storage-inputs'),
        resultsContainer: document.getElementById('results-container'),

        // General Inputs
        farmerName: document.getElementById('farmer_name'),
        zona: document.getElementById('zona_agricola'),
        soilHardness: document.getElementById('soil_hardness'),
        valSoilHardness: document.getElementById('val-soil_hardness'),
        valSuprafata: document.getElementById('val-suprafata'),

        // Tech inputs
        currentEquipment: document.getElementById('current_equipment'),
        tehnologieUtilaj: document.getElementById('tehnologie_utilaj'),
        notillEnabled: document.getElementById('notill_enabled'),
        dieselPrice: document.getElementById('diesel_price'),
        utilajNou: document.getElementById('utilaj_nou'),
        aipaSubventie: document.getElementById('aipa_subventie'),

        // Storage inputs
        hangarType: document.getElementById('hangar_type'),
        hangarMp: document.getElementById('hangar_mp'),
        valHangarMp: document.getElementById('val-hangar_mp'),
        ingrasamantKgHa: document.getElementById('ingrasamant_kg_ha'),

        // Controls
        btnExport: document.getElementById('btn-export-pdf')
    };

    const formatEUR = (val) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const formatMDL = (val) => new Intl.NumberFormat('ro-RO').format(Math.round(val)) + ' MDL';
    const MDL_TO_EUR = 1 / 19.23;

    // Realistic Equipment Consumption (L/ha at hardness 86)
    const EQUIPMENT_CONSUMPTION = {
        soviet: { base: 40, onHardSoil: 40, name: 'Sovietică (MTZ/K700)' },
        y2010: { base: 32, onHardSoil: 32, name: 'Tehnica 2010-2014' },
        y2015: { base: 29, onHardSoil: 29, name: 'Tehnica 2015-2019' }
    };

    const TECH_EFFICIENCY = {
        2020: 1.00,
        2021: 1.025,
        2022: 1.05,
        2023: 1.075,
        2024: 1.10,
        2025: 1.125
    };

    // Module visibility handler
    const updateModuleVisibility = () => {
        const techEnabled = elements.moduleTech?.checked;
        const storageEnabled = elements.moduleStorage?.checked;

        if (elements.techInputs) {
            elements.techInputs.style.display = techEnabled ? 'block' : 'none';
        }
        if (elements.storageInputs) {
            elements.storageInputs.style.display = storageEnabled ? 'block' : 'none';
        }

        calculate();
    };

    // Realistic Power Recommendations
    const generatePowerRecommendations = (area) => {
        let tractorRec = '';
        let combineRec = '';
        let workHours = '';

        // Tractor recommendations
        if (area < 200) {
            tractorRec = `<strong>150-190 CP</strong> (ex: John Deere 6R Series)`;
        } else if (area >= 200 && area <= 500) {
            tractorRec = `Un tractor de <strong>300-340 CP</strong> (ex: JD 8R / Claas Axion 900) SAU două tractoare de <strong>180 CP</strong> pentru flexibilitate`;
        } else {
            tractorRec = `Tractor principal <strong>370-410 CP</strong> sau flotă mixtă pentru eficiență maximă`;
        }

        // Combine recommendations
        if (area < 300) {
            combineRec = `Claas Lexion 5000 / JD seria T cu header <strong>6-7 metri</strong>`;
            workHours = ((area / (6.5 * 5 * 0.8))).toFixed(1);
        } else if (area >= 300 && area <= 600) {
            combineRec = `Claas Lexion 7000 / JD seria S cu header <strong>7.7-9 metri</strong>`;
            workHours = ((area / (8.5 * 5 * 0.8))).toFixed(1);
        } else {
            combineRec = `Combină performantă cu header <strong>9-12 metri</strong> pentru recoltare rapidă`;
            workHours = ((area / (10.5 * 5 * 0.8))).toFixed(1);
        }

        return { tractorRec, combineRec, workHours };
    };

    // Main calculation
    const calculate = () => {
        const techEnabled = elements.moduleTech?.checked;
        const storageEnabled = elements.moduleStorage?.checked;
        const farmerName = elements.farmerName?.value || 'Fermier';
        const soilHardness = parseFloat(elements.soilHardness?.value || 50);

        // Update displays
        if (elements.valSoilHardness) elements.valSoilHardness.textContent = soilHardness;

        // Get crop data
        let totalArea = 0;
        let totalProductionTones = 0;
        const selectedCrops = [];

        document.querySelectorAll('input[name="crop_enabled"]:checked').forEach(cb => {
            const cropType = cb.value;
            const haInput = document.querySelector(`.crop-ha[data-crop="${cropType}"]`);
            const yieldInput = document.querySelector(`.crop-yield[data-crop="${cropType}"]`);

            const areaVal = parseFloat(haInput?.value) || 0;
            const yieldVal = parseFloat(yieldInput?.value) || 0;

            if (areaVal > 0) {
                totalArea += areaVal;
                totalProductionTones += areaVal * yieldVal;
                selectedCrops.push(cropType);
            }
        });

        const averageYield = totalArea > 0 ? totalProductionTones / totalArea : 0;
        if (elements.valSuprafata) elements.valSuprafata.textContent = totalArea.toLocaleString('ro-RO');

        let resultsHTML = '';
        let totalAnnualSavings = 0;
        let totalInvestment = 0;

        // TECHNICAL MODULE
        if (techEnabled && totalArea > 0) {
            const currentEquip = elements.currentEquipment?.value || 'soviet';
            const techYear = parseInt(elements.tehnologieUtilaj?.value || 2025);
            const noTillEnabled = elements.notillEnabled?.checked;
            const dieselPrice = parseFloat(elements.dieselPrice?.value || 1.1);
            const utilajNou = parseFloat(elements.utilajNou?.value || 100000);
            const aipaPercent = parseFloat(elements.aipaSubventie?.value || 0.5);

            const equipData = EQUIPMENT_CONSUMPTION[currentEquip];
            const oldConsumption = soilHardness >= 80 ? equipData.onHardSoil : equipData.base;

            // New equipment: stable consumption
            const baseNewConsumption = 26;
            const efficiencyMultiplier = TECH_EFFICIENCY[techYear] || 1.0;
            const newConsumption = baseNewConsumption / efficiencyMultiplier;

            const noTillSavings = noTillEnabled ? 42 : 0;
            const fuelSavingPerHa = oldConsumption - newConsumption + noTillSavings;
            const dieselSavingEUR = totalArea * fuelSavingPerHa * dieselPrice;

            // GPS savings
            const totalInputsEST = (totalArea * 200) + (totalArea * 120);
            const gpsSavingPercent = techYear >= 2023 ? 0.12 : 0.10;
            const gpsSavingEUR = totalInputsEST * gpsSavingPercent;

            // Demo pricing
            const discountFactor = techYear >= 2023 ? 0.80 : 0.75;
            const priceDemo = utilajNou * discountFactor;
            const demoSavingEUR = utilajNou - priceDemo;

            const techInvestment = priceDemo * (1 - aipaPercent);
            totalInvestment += techInvestment;
            totalAnnualSavings += dieselSavingEUR + gpsSavingEUR;

            // Power recommendations
            const powerRecs = generatePowerRecommendations(totalArea);

            resultsHTML += `
                <section class="card" style="background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%); border-left: 6px solid #ff9800; margin-top: 2rem;">
                    <h2>🚜 Comparație: Tehnica Actuală vs. Otig</h2>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1rem;">
                        <div style="background: #ffebee; padding: 1.5rem; border-radius: 10px; border: 2px solid #d32f2f;">
                            <h4 style="color: #d32f2f; margin-bottom: 1rem;">❌ ${equipData.name}</h4>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                <span>Consum (sol ${soilHardness}):</span>
                                <strong>${oldConsumption.toFixed(1)} L/ha</strong>
                            </div>
                            ${soilHardness >= 86 ? `<p style="margin-top: 1rem; font-size: 0.85rem; color: #666;">⚠️ Sol foarte tare: patinare excesivă, transmisie distrusă</p>` : ''}
                        </div>
                        <div style="background: #e8f5e9; padding: 1.5rem; border-radius: 10px; border: 2px solid #4caf50;">
                            <h4 style="color: var(--primary); margin-bottom: 1rem;">✅ Tehnica Otig ${techYear}</h4>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                <span>Consum stabil:</span>
                                <strong>${newConsumption.toFixed(1)} L/ha</strong>
                            </div>
                            ${noTillEnabled ? `<div style="border-top: 1px dashed #ccc; padding-top: 0.8rem; margin-top: 0.8rem;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>💡 Economie No-Till:</span>
                                    <strong>+${noTillSavings} L/ha</strong>
                                </div>
                            </div>` : ''}
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">💰 Bani Salvați Anual</h3>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>Economie Motorină:</span>
                            <strong style="color: var(--primary);">${formatEUR(dieselSavingEUR)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>Economie RTK GPS (10% inputuri):</span>
                            <strong style="color: var(--primary);">${formatEUR(gpsSavingEUR)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; font-size: 1.1rem;">
                            <span><strong>TOTAL ECONOMII TEHNICE:</strong></span>
                            <strong style="color: #ff9800; font-size: 1.3rem;">${formatEUR(dieselSavingEUR + gpsSavingEUR)}</strong>
                        </div>
                    </div>
                </section>

                <section class="card" style="background: #fdfcf0; border-left: 6px solid var(--accent);">
                    <h2>🎯 Recomandări Putere Realistă</h2>
                    <div style="display: grid; gap: 1.5rem; margin-top: 1rem;">
                        <div style="background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e0e6e0;">
                            <p><strong>🚜 Tractor (Lucrări Grele):</strong></p>
                            <p style="margin-top: 0.5rem; color: var(--text-muted);">${powerRecs.tractorRec}</p>
                        </div>
                        <div style="background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e0e6e0;">
                            <p><strong>🌾 Combină:</strong></p>
                            <p style="margin-top: 0.5rem; color: var(--text-muted);">${powerRecs.combineRec}</p>
                            <p style="margin-top: 0.8rem; font-size: 0.9rem; background: #f0f4f0; padding: 0.8rem; border-radius: 6px;">
                                ⏱️ Timp de recoltat estimat: <strong>${powerRecs.workHours} ore efective</strong>
                            </p>
                        </div>
                        ${soilHardness >= 86 ? `<div style="background: #fff3cd; padding: 1.5rem; border-radius: 10px; border-left: 5px solid #d32f2f;">
                            <p><strong>⚠️ ATENȚIE - Sol Foarte Tare (${soilHardness}):</strong></p>
                            <p style="margin-top: 0.5rem;">Recomandăm <strong>obligatoriu</strong> utilizarea unui <b>Subsolier</b> înainte de No-Till pentru a sparge „colivia de beton" creată de anii de arătură. Fără aceasta, chiar și semănătoarea No-Till va întâmpina dificultăți.</p>
                        </div>` : ''}
                        ${noTillEnabled || soilHardness >= 70 ? `<div style="background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e0e6e0;">
                            <p><strong>🌱 Semănătoare No-Till:</strong></p>
                            <p style="margin-top: 0.5rem; color: var(--text-muted);">Recomanăm <b>Agrimerin No-Till cu discuri de tăiere</b>. Superioară față de ancore sau discuri simple pe sol compactat.</p>
                            <p style="margin-top: 0.5rem; font-size: 0.85rem; font-style: italic; background: #f0fdf0; padding: 0.8rem; border-radius: 6px;">💡 No-Till = semănatul sub „plapuma de paie" – păstrează apa în sol și banii în buzunar prin eliminarea aratului, discuitului și cultivatului.</p>
                        </div>` : ''}
                    </div>
                </section>
            `;
        }

        // STORAGE MODULE
        if (storageEnabled && totalArea > 0) {
            const hangarType = elements.hangarType?.value || 'none';
            const hangarMp = parseFloat(elements.hangarMp?.value || 1000);
            const fertKgPerHa = parseFloat(elements.ingrasamantKgHa?.value || 200);

            if (elements.valHangarMp) elements.valHangarMp.textContent = hangarMp;

            // Storage losses by type
            const storageLosses = {
                none: 7,
                beton_vechi: 6,
                beton_nou: 1,
                metal: 2
            };

            const currentLoss = storageLosses[hangarType] || 6;
            const hangarCapacity = hangarMp * 2.5;
            const storedTones = Math.min(totalProductionTones, hangarCapacity);

            // Scenario calculations
            const storageProfitMDL_05 = (storedTones * 1000) * 0.5;
            const storageProfitMDL_10 = (storedTones * 1000) * 1.0;
            const arbitrageMDL = ((totalArea * fertKgPerHa) / 1000) * 2500;
            const degradationCostEUR = (storedTones * 300) * (currentLoss / 100);

            const storageInvestment = hangarMp * 160; // €160/m²
            const aipaPercent = parseFloat(elements.aipaSubventie?.value || 0.5);
            const netStorageInvestment = storageInvestment * (1 - aipaPercent);

            totalInvestment += netStorageInvestment;
            const storageBenefitEUR = (arbitrageMDL * MDL_TO_EUR) + (storageProfitMDL_10 * MDL_TO_EUR) + degradationCostEUR;
            totalAnnualSavings += storageBenefitEUR;

            resultsHTML += `
                <section class="card" style="background: linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%); border-left: 6px solid var(--primary); margin-top: 2rem;">
                    <h2>🏗️ Hangar PVC de Calitate Superioară</h2>
                    
                    <div style= "background: #e3f2fd; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                        <h3 style="color: #1976d2; margin-bottom: 1rem;">🌟 Caracteristici Premium PVC Otig</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ Material Densitate Mare:</strong> PVC de calitate superioară, rezistent la UV și intemperii
                            </li>
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ Rezistență Extremă:</strong> Tensionare corectă asigură stabilitate la furtuni fără vibrații
                            </li>
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ Reparații Rapide:</strong> Kit special pentru reparații mecanice în minute, fără afectarea recoltei
                            </li>
                            <li style="padding: 0.8rem 0;">
                                <strong>✓ Versatilitate:</strong> Imun la amoniac (ideal pentru ferme cu animale, unde metalul ruginește în 5 ani)
                            </li>
                        </ul>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div style="background: #fdfcf0; padding: 1.5rem; border-radius: 10px; border-left: 5px solid #fbc02d;">
                            <p><strong>📉 Scenariu Prudent (0.5 MDL/kg)</strong></p>
                            <p style="margin-top: 1rem;">Câștig Stocare: <strong>${formatMDL(storageProfitMDL_05)}</strong></p>
                        </div>
                        <div style="background: #f0f7f0; padding: 1.5rem; border-radius: 10px; border-left: 5px solid #4caf50;">
                            <p><strong>📈 Scenariu Optimist (1.0 MDL/kg)</strong></p>
                            <p style="margin-top: 1rem;">Câștig Stocare: <strong>${formatMDL(storageProfitMDL_10)}</strong></p>
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">💰 Bani Câștigați Anual (Hangar)</h3>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>❄️ Achiziții de Iarnă (Semințe/Îngrășăminte):</span>
                            <strong style="color: var(--primary);">${formatMDL(arbitrageMDL)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>📦 Pierderi Salvate (${currentLoss}% → 0%):</span>
                            <strong style="color: var(--primary);">${formatEUR(degradationCostEUR)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>📈 Vânzare Amânată (Scenariu Optimist):</span>
                            <strong style="color: var(--primary);">${formatMDL(storageProfitMDL_10)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; font-size: 1.1rem;">
                            <span><strong>TOTAL BENEFICII DEPOZIT:</strong></span>
                            <strong style="color: #4caf50; font-size: 1.3rem;">${formatEUR(storageBenefitEUR)}</strong>
                        </div>
                    </div>

                    <div style="background: #fff3e0; padding: 1.5rem; border-radius: 10px; margin-top: 1.5rem; border-left: 5px solid #ff9800;">
                        <p><strong>🔍 Comparație cu Alte Depozite:</strong></p>
                        <ul style="margin-top: 1rem; padding-left: 1.5rem; color: var(--text-muted);">
                            <li><strong>Beton Vechi:</strong> Transpirație, fisuri, pierderi 6-7%, nu se poate repara rapid</li>
                            <li><strong>Metal Standard:</strong> Ruginire în medii cu amoniac (ferme animale), necesită întreținere constantă</li>
                            <li><strong>PVC Otig:</strong> Zero pierderi, reparații instant cu kit mecanic, rezistență 20+ ani</li>
                        </ul>
                    </div>
                </section>
            `;
        }

        // EXECUTIVE SUMMARY
        if (totalAnnualSavings > 0 && totalInvestment > 0) {
            const paybackSeasons = (totalInvestment / totalAnnualSavings).toFixed(1);
            const namesMap = { grau: 'Grâu', porumb: 'Porumb', floare: 'Floarea Soarelui', rapita: 'Rapiță' };
            const cropsListLong = selectedCrops.map(c => namesMap[c] || c).join(', ');

            resultsHTML += `
                <section class="executive-summary" style="background: linear-gradient(135deg, #2d5a27 0%, #1e3d1a 100%); color: white; padding: 2.5rem; border-radius: 20px; margin-top: 2rem;">
                    <h2 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 1rem; margin-bottom: 1.5rem;">📊 Rezumat Executiv pentru ${farmerName}</h2>
                    <p style="font-size: 1.1rem; line-height: 1.7; margin-bottom: 2rem;">
                        Pentru suprafața de <strong>${totalArea.toLocaleString('ro-RO')} ha</strong> cultivată cu <strong>${cropsListLong}</strong>, 
                        investiția în soluțiile <b>Otig Holdings</b> vă permite să economisiți și să câștigați 
                        <strong>${formatEUR(totalAnnualSavings)}</strong> în fiecare an.
                    </p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 15px; text-align: center;">
                            <span style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; opacity: 0.8;">Economie Anuală Totală</span>
                            <span style="font-size: 1.6rem; font-weight: 700; color: #fbc02d;">${formatEUR(totalAnnualSavings)}</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 15px; text-align: center;">
                            <span style="display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; opacity: 0.8;">Amortizare Investiție</span>
                            <span style="font-size: 1.6rem; font-weight: 700; color: #fbc02d;">${paybackSeasons} Sezoane</span>
                        </div>
                    </div>
                    <p style="margin-top: 2rem; text-align: center; font-style: italic; opacity: 0.9;">
                        Bani salvați la fiecare rotație de roată. Bani câștigați la fiecare recoltă depozitată.
                    </p>
                </section>
            `;
        }

        // Update results container
        if (elements.resultsContainer) {
            elements.resultsContainer.innerHTML = resultsHTML;
        }

        // Update PDF title
        document.title = `Ghid Strategic de Optimizare - ${farmerName}`;
    };

    // Event Listeners
    if (elements.moduleTech) elements.moduleTech.addEventListener('change', updateModuleVisibility);
    if (elements.moduleStorage) elements.moduleStorage.addEventListener('change', updateModuleVisibility);

    if (elements.soilHardness) elements.soilHardness.addEventListener('input', calculate);
    if (elements.currentEquipment) elements.currentEquipment.addEventListener('change', calculate);
    if (elements.tehnologieUtilaj) elements.tehnologieUtilaj.addEventListener('change', calculate);
    if (elements.notillEnabled) elements.notillEnabled.addEventListener('change', calculate);
    if (elements.hangarType) elements.hangarType.addEventListener('change', calculate);
    if (elements.hangarMp) elements.hangarMp.addEventListener('input', calculate);
    if (elements.farmerName) elements.farmerName.addEventListener('input', calculate);
    if (elements.dieselPrice) elements.dieselPrice.addEventListener('input', calculate);
    if (elements.utilajNou) elements.utilajNou.addEventListener('input', calculate);
    if (elements.ingrasamantKgHa) elements.ingrasamantKgHa.addEventListener('input', calculate);

    // Crop changes
    document.querySelectorAll('input[name="crop_enabled"]').forEach(cb => {
        cb.addEventListener('change', calculate);
    });
    document.querySelectorAll('.crop-ha, .crop-yield').forEach(input => {
        input.addEventListener('input', calculate);
    });

    // PDF Export
    if (elements.btnExport) {
        elements.btnExport.addEventListener('click', () => {
            const opt = {
                margin: 0.5,
                filename: `Ghid_Strategic_Optimizare_${elements.farmerName?.value || 'Fermier'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            elements.btnExport.style.display = 'none';
            const content = document.getElementById('calculator-content');
            if (typeof html2pdf !== 'undefined' && content) {
                html2pdf().set(opt).from(content).save().then(() => {
                    elements.btnExport.style.display = 'block';
                });
            }
        });
    }

    // Initial setup
    updateModuleVisibility();
});
