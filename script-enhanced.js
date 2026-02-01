document.addEventListener('DOMContentLoaded', () => {
    // Language Dictionary for Farmer-Friendly Communication
    const LANGUAGE_DICT = {
        software: 'Creierul mașinii',
        rtk: 'Conducere prin satelit',
        gps: 'Conducere prin satelit',
        header: 'Masă de tăiere (Coasă)',
        noTill: 'Semănatul sub plapuma de paie',
        inputs: 'Semințe, îngrășăminte și otrăvuri (medicamente pentru plante)'
    };

    // Visual Soil Hardness Descriptions
    const SOIL_DESCRIPTIONS = {
        soft: { range: [0, 50], desc: 'Pământ fărâmicios', detail: 'Se sfărâmă ușor în mână, ideal pentru orice tractor' },
        hard: { range: [51, 75], desc: 'Pământ tare', detail: 'Nevoie de tractoare grele, se formează bulgări mari' },
        concrete: { range: [76, 100], desc: 'Bolovani mari (beton)', detail: 'Obligatoriu subsolier pentru spart coaja' }
    };

    const getSoilDescription = (hardness) => {
        if (hardness <= 50) return SOIL_DESCRIPTIONS.soft;
        if (hardness <= 75) return SOIL_DESCRIPTIONS.hard;
        return SOIL_DESCRIPTIONS.concrete;
    };

    // DOM Elements
    const elements = {
        moduleTech: document.getElementById('module-tech'),
        moduleStorage: document.getElementById('module-storage'),
        techInputs: document.getElementById('tech-inputs'),
        storageInputs: document.getElementById('storage-inputs'),
        resultsContainer: document.getElementById('results-container'),

        farmerName: document.getElementById('farmer_name'),
        zona: document.getElementById('zona_agricola'),
        soilHardness: document.getElementById('soil_hardness'),
        valSoilHardness: document.getElementById('val-soil_hardness'),
        valSuprafata: document.getElementById('val-suprafata'),
        soilDescription: document.getElementById('soil-description'),

        currentEquipment: document.getElementById('current_equipment'),
        tehnologieUtilaj: document.getElementById('tehnologie_utilaj'),
        notillEnabled: document.getElementById('notill_enabled'),
        dieselPrice: document.getElementById('diesel_price'),
        utilajNou: document.getElementById('utilaj_nou'),
        aipaSubventie: document.getElementById('aipa_subventie'),

        hangarType: document.getElementById('hangar_type'),
        hangarMp: document.getElementById('hangar_mp'),
        valHangarMp: document.getElementById('val-hangar_mp'),
        ingrasamantKgHa: document.getElementById('ingrasamant_kg_ha'),

        btnExport: document.getElementById('btn-export-pdf'),
        previewFuelValue: document.getElementById('preview-fuel-value')
    };

    const formatEUR = (val) => new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const formatMDL = (val) => new Intl.NumberFormat('ro-RO').format(Math.round(val)) + ' MDL';
    const MDL_TO_EUR = 1 / 19.23;

    const EQUIPMENT_CONSUMPTION = {
        soviet: { base: 40, onHardSoil: 40, name: 'Sovietică (MTZ/K700)' },
        y2010_2019: { base: 31, onHardSoil: 31, name: 'Tehnica 2010-2019' }
    };

    const TECH_EFFICIENCY = {
        2020: 1.00, 2021: 1.025, 2022: 1.05,
        2023: 1.075, 2024: 1.10, 2025: 1.125
    };

    const updateModuleVisibility = () => {
        const techEnabled = elements.moduleTech?.checked;
        const storageEnabled = elements.moduleStorage?.checked;
        const noOtigTech = document.getElementById('no_otig_tech')?.checked;
        const otigTechContainer = document.getElementById('otig_tech_container');

        if (elements.techInputs) {
            elements.techInputs.style.display = techEnabled ? 'block' : 'none';
        }
        if (elements.storageInputs) {
            elements.storageInputs.style.display = storageEnabled ? 'block' : 'none';
        }

        if (otigTechContainer) {
            otigTechContainer.style.display = noOtigTech ? 'none' : 'block';
        }

        calculate();
    };

    const generatePowerRecommendations = (area) => {
        let tractorRec = '';
        let combineRec = '';
        let workHours = '';

        // Give 2 examples for each category
        if (area < 250) {
            tractorRec = `<strong>150-190 CP</strong><br>Exemple: <i>John Deere 6R Series</i> sau <i>Claas Arion 600</i>`;
        } else if (area >= 250 && area <= 600) {
            tractorRec = `<strong>300-350 CP</strong><br>Exemple: <i>John Deere 8R</i> sau <i>Claas Axion 900</i>`;
        } else {
            tractorRec = `<strong>Flotă mixtă</strong> pentru eficiență maximă<br>Exemple: <i>JD 9R</i> + <i>Case Magnum</i>`;
        }

        if (area < 300) {
            combineRec = `Coasă (masă de tăiere) <strong>7-9 metri</strong><br>Exemple: <i>Claas Lexion 6000</i> sau <i>John Deere S700</i>`;
            workHours = ((area / (8 * 5 * 0.8))).toFixed(1);
        } else {
            combineRec = `Coasă <strong>9-12 metri</strong><br>Exemple: <i>Claas Lexion 8000</i> sau <i>John Deere X9</i>`;
            workHours = ((area / (10.5 * 5 * 0.8))).toFixed(1);
        }

        return { tractorRec, combineRec, workHours };
    };

    const calculate = () => {
        const techEnabled = elements.moduleTech?.checked;
        const storageEnabled = elements.moduleStorage?.checked;
        const farmerName = elements.farmerName?.value || 'Fermier';
        const soilHardness = parseFloat(elements.soilHardness?.value || 50);

        // Update soil hardness description
        if (elements.valSoilHardness) elements.valSoilHardness.textContent = soilHardness;
        if (elements.soilDescription) {
            const soilInfo = getSoilDescription(soilHardness);
            elements.soilDescription.innerHTML = `
                <strong>${soilInfo.desc}</strong>: ${soilInfo.detail}
            `;
        }

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

        // Toggle 'No Otig Tech' Listener
        const noOtigTech = document.getElementById('no_otig_tech')?.checked;

        const averageYield = totalArea > 0 ? totalProductionTones / totalArea : 0;
        if (elements.valSuprafata) elements.valSuprafata.textContent = totalArea.toLocaleString('ro-RO');

        let resultsHTML = '';
        let totalAnnualSavings = 0;
        let totalInvestment = 0;
        let dashboardData = { fuel: 0, gps: 0, storage: 0, arbitrage: 0 };

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

            const baseNewConsumption = 26;
            const efficiencyMultiplier = TECH_EFFICIENCY[techYear] || 1.0;
            const newConsumption = baseNewConsumption / efficiencyMultiplier;

            const noTillSavings = noTillEnabled ? 42 : 0;
            const fuelSavingPerHa = oldConsumption - newConsumption + noTillSavings;
            const dieselSavingEUR = totalArea * fuelSavingPerHa * dieselPrice;
            dashboardData.fuel = dieselSavingEUR;

            const totalInputsEST = (totalArea * 200) + (totalArea * 120);
            const gpsSavingPercent = techYear >= 2023 ? 0.12 : 0.10;
            const gpsSavingEUR = totalInputsEST * gpsSavingPercent;
            dashboardData.gps = gpsSavingEUR;

            const discountFactor = techYear >= 2023 ? 0.80 : 0.75;
            const priceDemo = utilajNou * discountFactor;

            const techInvestment = priceDemo * (1 - aipaPercent);
            totalInvestment += techInvestment;
            totalAnnualSavings += dieselSavingEUR + gpsSavingEUR;

            // Store for preview in public mode
            if (elements.previewFuelValue) {
                elements.previewFuelValue.textContent = formatEUR(dieselSavingEUR);
            }

            const powerRecs = generatePowerRecommendations(totalArea);
            const soilInfo = getSoilDescription(soilHardness);

            resultsHTML += `
                <section class="card" style="background: linear-gradient(135deg, #fff3e0 0%, #ffffff 100%); border-left: 6px solid #ff9800; margin-top: 2rem;">
                    <h2>🚜 Tehnica Clientului vs. Otig</h2>
                    <div style="display: grid; grid-template-columns: ${noOtigTech ? '1fr' : '1fr 1fr'}; gap: 1.5rem; margin-top: 1rem;">
                        <div style="background: #ffebee; padding: 1.5rem; border-radius: 10px; border: 2px solid #d32f2f;">
                            <h4 style="color: #d32f2f; margin-bottom: 1rem;">❌ ${equipData.name}</h4>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                <span>Consum Estimativ:</span>
                                <strong>${oldConsumption.toFixed(1)} L/ha</strong>
                            </div>
                            <p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">Cost Motorină Estimat: <strong>${formatEUR(totalArea * oldConsumption * dieselPrice)}</strong></p>
                            ${soilHardness >= 76 ? `<p style="margin-top: 1rem; font-size: 0.85rem; color: #666;">⚠️ ${soilInfo.detail}</p>` : ''}
                        </div>
                        
                        ${!noOtigTech ? `
                        <div style="background: #e8f5e9; padding: 1.5rem; border-radius: 10px; border: 2px solid #4caf50;">
                            <h4 style="color: var(--primary); margin-bottom: 1rem;">✅ Tehnica Otig ${techYear}</h4>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                <span>Consum Sabi:</span>
                                <strong>${newConsumption.toFixed(1)} L/ha</strong>
                            </div>
                            ${noTillEnabled ? `<div style="border-top: 1px dashed #ccc; padding-top: 0.8rem; margin-top: 0.8rem;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>💡 ${LANGUAGE_DICT.noTill}:</span>
                                    <strong>+${noTillSavings} L/ha</strong>
                                </div>
                            </div>` : ''}
                        </div>
                        ` : ''}
                    </div>

                    ${!noOtigTech ? `
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">💰 Bani Salvați la Fiecare Rotație de Roată</h3>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>Economie Motorină:</span>
                            <strong style="color: var(--primary);">${formatEUR(dieselSavingEUR)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>Economie „Satelit" (${LANGUAGE_DICT.rtk}):</span>
                            <strong style="color: var(--primary);">${formatEUR(gpsSavingEUR)}</strong>
                        </div>
                        <p style="margin-top: 1rem; font-size: 0.85rem; font-style: italic; color: var(--text-muted);">
                            📡 ${LANGUAGE_DICT.rtk} = merge la centimetru, fără suprapuneri. Economie 10% la ${LANGUAGE_DICT.inputs.toLowerCase()}.
                        </p>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; font-size: 1.1rem; margin-top: 1rem; border-top: 2px solid #dee2e6;">
                            <span><strong>TOTAL ECONOMII TEHNICE:</strong></span>
                            <strong style="color: #ff9800; font-size: 1.3rem;">${formatEUR(dieselSavingEUR + gpsSavingEUR)}</strong>
                        </div>
                    </div>
                    ` : ''
                }
                </section>
            `;

            resultsHTML += `
                <section class="card" style="background: #fdfcf0; border-left: 6px solid var(--accent);">
            <h2>🎯 Îndrumătorul Tehnologic</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Utilaje recomandate pentru ${totalArea} ha în Raionul ${elements.zona?.value || 'Centru'}:</p>
            <div style="display: grid; gap: 1.5rem;">
                <div style="background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e0e6e0;">
                    <p><strong>🚜 Tractor (pentru lucrări grele):</strong></p>
                    <p style="margin-top: 0.5rem; color: var(--text-muted);">${powerRecs.tractorRec}</p>
                </div>
                <div style="background: white; padding: 1.5rem; border-radius: 10px; border: 1px solid #e0e6e0;">
                    <p><strong>🌾 Combină:</strong></p>
                    <p style="margin-top: 0.5rem; color: var(--text-muted);">${powerRecs.combineRec}</p>
                    <p style="margin-top: 0.8rem; font-size: 0.9rem; background: #f0f4f0; padding: 0.8rem; border-radius: 6px;">
                        ⏱️ Timp de recoltat estimat: <strong>${powerRecs.workHours} ore efective</strong>
                    </p>
                </div>
                ${soilHardness >= 76 ? `<div style="background: #fff3cd; padding: 1.5rem; border-radius: 10px; border-left: 5px solid #d32f2f;">
                            <p><strong>⚠️ ATENȚIE - ${soilInfo.desc}:</strong></p>
                            <p style="margin-top: 0.5rem;">Recomandăm <strong>obligatoriu</strong> un <b>Subsolier (Scarificator)</b> pentru a sparge „colivia de beton". ${soilInfo.detail}.</p>
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

            const storageLosses = {
                none: 7,
                beton_vechi: 6,
                beton_nou: 1,
                metal: 2
            };

            const currentLoss = storageLosses[hangarType] || 6;
            const hangarCapacity = hangarMp * 2.5;
            const storedTones = Math.min(totalProductionTones, hangarCapacity);

            // 3 scenarios for price analysis: 0.3, 0.5, 1.0 MDL/kg
            const storageProfitMDL_03 = (storedTones * 1000) * 0.3;
            const storageProfitMDL_05 = (storedTones * 1000) * 0.5;
            const storageProfitMDL_10 = (storedTones * 1000) * 1.0;
            const arbitrageMDL = ((totalArea * fertKgPerHa) / 1000) * 2500;
            const degradationCostEUR = (storedTones * 300) * (currentLoss / 100);

            dashboardData.storage = storageProfitMDL_10 * MDL_TO_EUR;
            dashboardData.arbitrage = arbitrageMDL * MDL_TO_EUR;

            const storageInvestment = hangarMp * 160;
            const aipaPercent = parseFloat(elements.aipaSubventie?.value || 0.5);
            const netStorageInvestment = storageInvestment * (1 - aipaPercent);

            totalInvestment += netStorageInvestment;
            const storageBenefitEUR = (arbitrageMDL * MDL_TO_EUR) + (storageProfitMDL_10 * MDL_TO_EUR) + degradationCostEUR;
            totalAnnualSavings += storageBenefitEUR;

            resultsHTML += `
        < section class="card" style = "background: linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%); border-left: 6px solid var(--primary); margin-top: 2rem;" >
                    <h2>🏗️ Hangarul Tău PVC de Calitate Superioară</h2>
                    
                    <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;">
                        <h3 style="color: #1976d2; margin-bottom: 1rem;">🌟 De Ce PVC Otig Este Superior</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ Material Densitate Mare:</strong> PVC de calitate industrială, rezistent la UV și intemperii (20+ ani)
                            </li>
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ ${LANGUAGE_DICT.software}:</strong> Prelată întinsă „la coardă", rezistă la furtuni fără vibrații
                            </li>
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ Reparații Instant:</strong> Se peticește în <strong>5 minute</strong> dacă e tăiat din greșeală, nu cere echipe de sudori
                            </li>
                            <li style="padding: 0.8rem 0; border-bottom: 1px dashed #90caf9;">
                                <strong>✓ Lumină Naturală:</strong> Economisiți la becuri – lumină maximă în timpul zilei, nu cheltuiți pe curent
                            </li>
                            <li style="padding: 0.8rem 0;">
                                <strong>✓ Imunitate Chimică:</strong> Ideal pentru ferme cu animale (vaci/porci) – PVC-ul nu ruginește de la gazele lor, spre deosebire de metal care ruginește în 5 ani
                            </li>
                        </ul>
                    </div>

                    <h3 style="margin-bottom: 1rem;">📊 Analiză de Oportunitate (3 Scenarii de Preț)</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div style="background: #fff9e6; padding: 1.2rem; border-radius: 10px; border-left: 5px solid #f57c00; text-align: center;">
                            <p style="font-size: 0.85rem; color: #666;"><strong>Conservativ</strong></p>
                            <p style="font-size: 1.1rem; margin: 0.5rem 0;"><strong>0.3 MDL/kg</strong></p>
                            <p style="font-size: 1.3rem; font-weight: 700; color: #f57c00;">${formatMDL(storageProfitMDL_03)}</p>
                        </div>
                        <div style="background: #fdfcf0; padding: 1.2rem; border-radius: 10px; border-left: 5px solid #fbc02d; text-align: center;">
                            <p style="font-size: 0.85rem; color: #666;"><strong>Moderat</strong></p>
                            <p style="font-size: 1.1rem; margin: 0.5rem 0;"><strong>0.5 MDL/kg</strong></p>
                            <p style="font-size: 1.3rem; font-weight: 700; color: #fbc02d;">${formatMDL(storageProfitMDL_05)}</p>
                        </div>
                        <div style="background: #f0f7f0; padding: 1.2rem; border-radius: 10px; border-left: 5px solid #4caf50; text-align: center;">
                            <p style="font-size: 0.85rem; color: #666;"><strong>Optimist</strong></p>
                            <p style="font-size: 1.1rem; margin: 0.5rem 0;"><strong>1.0 MDL/kg</strong></p>
                            <p style="font-size: 1.3rem; font-weight: 700; color: #4caf50;">${formatMDL(storageProfitMDL_10)}</p>
                        </div>
                    </div>

                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 10px; margin-top: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">💰 Bani Câștigați la Fiecare Recoltă Depozitată</h3>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>❄️ Achiziții de Iarnă (când e ieftin):</span>
                            <strong style="color: var(--primary);">${formatMDL(arbitrageMDL)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; border-bottom: 1px solid #dee2e6;">
                            <span>📦 Pierderi Salvate (${currentLoss}% → 0%):</span>
                            <strong style="color: var(--primary);">${formatEUR(degradationCostEUR)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.8rem 0; font-size: 1.1rem; margin-top: 0.5rem; border-top: 2px solid #dee2e6;">
                            <span><strong>TOTAL BENEFICII DEPOZIT:</strong></span>
                            <strong style="color: #4caf50; font-size: 1.3rem;">${formatEUR(storageBenefitEUR)}</strong>
                        </div>
                    </div>
                </section >
        `;
        }

        // DASHBOARD & EXECUTIVE SUMMARY
        if (totalAnnualSavings > 0 && totalInvestment > 0) {
            const paybackSeasons = (totalInvestment / totalAnnualSavings).toFixed(1);
            const namesMap = { grau: 'Grâu', porumb: 'Porumb', floare: 'Floarea Soarelui', rapita: 'Rapiță' };
            const cropsListLong = selectedCrops.map(c => namesMap[c] || c).join(', ');

            resultsHTML = `
        < section class="card" style = "background: linear-gradient(135deg, #1e3d1a 0%, #2d5a27 100%); color: white; padding: 2rem; border-radius: 16px; margin-bottom: 2rem;" >
                    <h2 style="text-align: center; margin-bottom: 2rem; font-size: 1.8rem;">📊 Tabloul de Bord - ${farmerName}</h2>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
                        ${techEnabled ? `
                        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Economie Motorină</div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #fbc02d;">${formatEUR(dashboardData.fuel)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Economie „Satelit"</div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #fbc02d;">${formatEUR(dashboardData.gps)}</div>
                        </div>
                        ` : ''}
                        ${storageEnabled ? `
                        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Profit Depozitare</div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #fbc02d;">${formatEUR(dashboardData.storage)}</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 12px; text-align: center;">
                            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Achiziții Iarnă</div>
                            <div style="font-size: 1.8rem; font-weight: 700; color: #fbc02d;">${formatEUR(dashboardData.arbitrage)}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div style="background: rgba(255,255,255,0.15); padding: 2rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 1rem; opacity: 0.9;">💰 CÂȘTIG TOTAL ANUAL</div>
                        <div style="font-size: 2.5rem; font-weight: 800; color: #fbc02d; margin: 1rem 0;">${formatEUR(totalAnnualSavings)}</div>
                        <div style="font-size: 0.95rem; opacity: 0.85;">Amortizare în <strong>${paybackSeasons} sezoane</strong></div>
                    </div>
                </section >
        ` + resultsHTML;

            // Add disclaimer
            resultsHTML += `
        < section class="card" style = "background: #fff9e6; border: 2px dashed #ff9800; padding: 1.5rem; margin-top: 2rem;" >
            <p style="font-size: 0.9rem; color: #666; text-align: center; margin: 0;">
                ℹ️ <strong>Notă:</strong> Acest calcul este o simulare bazată pe datele oferite. Pentru o ofertă finală și vizionarea tehnicii în teren, <strong>contactați echipa Otig Holdings</strong>.
                Vă invităm la ferma noastră demonstrativă pentru a vedea utilajele în acțiune!
            </p>
                </section >
        `;
        }

        if (elements.resultsContainer) {
            elements.resultsContainer.innerHTML = resultsHTML;
        }

        document.title = `Ghid de Rentabilitate - ${farmerName} `;
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
                filename: `Ghid_Rentabilitate_${elements.farmerName?.value.replace(/\s+/g, '_') || 'Fermier'}.pdf`,
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

    // Toggle 'No Otig Tech' Listener
    const noOtigTechCheckbox = document.getElementById('no_otig_tech');
    if (noOtigTechCheckbox) {
        noOtigTechCheckbox.addEventListener('change', updateModuleVisibility);
    }

    updateModuleVisibility();
});
