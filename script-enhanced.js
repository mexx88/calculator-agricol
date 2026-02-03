document.addEventListener('DOMContentLoaded', () => {
    const LANGUAGE_DICT = {
        tractorBrain: 'Calculator de bord (tractor/combină)',
        hangarSystem: 'Structură de rezistență PVC',
        satellite: 'Ghidare prin satelit',
        noTill: 'Semănatul sub plapuma de paie',
        inputs: 'Semințe, îngrășăminte și tratamente'
    };

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
        noOtigTech: document.getElementById('no_otig_tech'),
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

    // FORMULA CORECTATĂ PENTRU TIMPUL DE RECOLTARE
    const generatePowerRecommendations = (area) => {
        let tractorRec = '';
        let combineRec = '';
        let workHours = '';
        let headerSize = '';

        // Determină dimensiunea coasei în funcție de suprafață
        if (area < 300) {
            headerSize = 8;
        } else {
            headerSize = 10;
        }

        // FORMULA CORECTĂ: Suprafață / (Lățime_Coasă * Viteză / 10)
        // Viteza medie: 5 km/h, Lățimea în metri, rezultat în ore
        const speedKmh = 5;
        workHours = (area / (headerSize * speedKmh / 10)).toFixed(1);

        // Recomandări tractoare
        if (area < 250) {
            tractorRec = `<strong>150-190 CP</strong><br>Exemple: <i>John Deere 6R Series</i> sau <i>Claas Arion 600</i>`;
        } else if (area >= 250 && area <= 600) {
            const maxCP = area > 500 ? 450 : 350;
            tractorRec = `<strong>300-${maxCP} CP</strong><br>Exemple: <i>John Deere 8R</i> sau <i>Claas Axion</i>`;
        } else {
            if (area < 2000) {
                tractorRec = `<strong>Flotă mixtă (Max 600 CP)</strong><br><span class="text-danger-custom">⚠️ 1000 CP este INTERZIS sub 2000 ha.</span><br>Exemple: <i>JD 9R</i> + <i>Case Magnum</i>`;
            } else {
                tractorRec = `<strong>Flotă mixtă</strong> pentru eficiență maximă<br>Exemple: <i>JD 9R</i> + <i>Case Magnum</i> (1000 CP permis)`;
            }
        }

        // Recomandări combină
        combineRec = `Coasă / Masă de tăiere <strong>${headerSize} metri</strong><br>Exemple: <i>${area < 300 ? 'Claas Lexion 6000' : 'Claas Lexion 8000'}</i>`;
        const harvestTimeExpl = `Calculat la o viteză de ${speedKmh}km/h cu o coasă de ${headerSize} metri`;

        return { tractorRec, combineRec, workHours, harvestTimeExpl, headerSize };
    };

    const calculate = () => {
        const techEnabled = elements.moduleTech?.checked;
        const storageEnabled = elements.moduleStorage?.checked;
        const farmerName = elements.farmerName?.value || 'Fermier';
        const soilHardness = parseFloat(elements.soilHardness?.value || 50);

        if (elements.valSoilHardness) elements.valSoilHardness.textContent = soilHardness;
        if (elements.soilDescription) {
            const soilInfo = getSoilDescription(soilHardness);
            elements.soilDescription.innerHTML = `<strong>${soilInfo.desc}</strong>: ${soilInfo.detail}`;
        }

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

        if (elements.valSuprafata) elements.valSuprafata.textContent = totalArea.toLocaleString('ro-RO');

        let resultsHTML = '';
        let totalAnnualSavings = 0;
        let totalInvestment = 0;
        let dashboardData = { fuel: 0, gps: 0, storage: 0, arbitrage: 0 };

        if (elements.moduleTech && techEnabled && totalArea > 0) {
            const noOtigTech = document.getElementById('no_otig_tech')?.checked;
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

            const totalInputsEST = totalArea * 200;
            const gpsSavingPercent = techYear >= 2023 ? 0.12 : 0.10;
            const gpsSavingEUR = totalInputsEST * gpsSavingPercent;
            dashboardData.gps = gpsSavingEUR;

            const techInvestment = noOtigTech ? 0 : (utilajNou * 0.75 * (1 - aipaPercent));
            totalInvestment += techInvestment;
            totalAnnualSavings += dieselSavingEUR + gpsSavingEUR;

            const powerRecs = generatePowerRecommendations(totalArea);
            const soilInfo = getSoilDescription(soilHardness);

            resultsHTML += `
                <section class="result-card result-card-tech no-break">
                    <h2>🚜 Tehnica actuală vs Otig</h2>
                    <div class="grid-tech-container">
                        <div class="tech-subpanel-old">
                            <h4 class="text-danger-custom mb-3">❌ ${equipData.name}</h4>
                            <div class="flex-between">
                                <span>Consum Estimativ:</span>
                                <strong>${oldConsumption.toFixed(1)} L/ha</strong>
                            </div>
                            <p class="text-muted-sm">Cost Motorină Estimat: <strong>${formatEUR(totalArea * oldConsumption * dieselPrice)}</strong></p>
                            ${soilHardness >= 76 ? `<p class="warning-text">${soilInfo.detail}</p>` : ''}
                        </div>
                        ${!noOtigTech ? `
                        <div class="tech-subpanel-new">
                            <h4 class="text-primary-custom mb-3">✅ Tehnica Otig ${techYear}</h4>
                            <div class="flex-between">
                                <span>Consum stabil și eficient:</span>
                                <strong>${newConsumption.toFixed(1)} L/ha</strong>
                            </div>
                            ${noTillEnabled ? `<div class="no-till-benefit">
                                <div class="flex-between">
                                    <span>💡 ${LANGUAGE_DICT.noTill}:</span>
                                    <strong>+${noTillSavings} L/ha</strong>
                                </div>
                            </div>` : ''}
                        </div>` : ''}
                    </div>
                    ${!noOtigTech ? `
                    <div class="savings-summary">
                        <h3>Bani Salvați la Fiecare Rotație de Roată</h3>
                        <div class="flex-between">
                            <span>Economie Motorină:</span>
                            <strong class="text-primary">${formatEUR(dieselSavingEUR)}</strong>
                        </div>
                        <div class="flex-between">
                            <span>Economie Satelit:</span>
                            <strong class="text-primary">${formatEUR(gpsSavingEUR)}</strong>
                        </div>
                        <p class="text-muted-sm">${LANGUAGE_DICT.satellite} = merge la centimetru, fără suprapuneri. Economie ${(gpsSavingPercent * 100).toFixed(0)}% la ${LANGUAGE_DICT.inputs.toLowerCase()}.</p>
                        <div class="total-row">
                            <span><strong>TOTAL ECONOMII TEHNICE:</strong></span>
                            <strong class="total-value">${formatEUR(dieselSavingEUR + gpsSavingEUR)}</strong>
                        </div>
                        ${techInvestment > 0 ? `
                        <div class="investment-info">
                            <div class="flex-between">
                                <span>Investiție Tehnică (după subvenție):</span>
                                <strong>${formatEUR(techInvestment)}</strong>
                            </div>
                        </div>` : ''}
                    </div>` : ''}
                </section>

                <section class="result-card result-card-guide no-break">
                    <h2>🎯 Îndrumătorul Tehnologic</h2>
                    <p class="section-subtitle">Utilaje recomandate pentru ${totalArea} ha în Raionul ${elements.zona?.value || 'Centru'}:</p>
                    <div class="guide-grid">
                        <div class="guide-item">
                            <p><strong>🚜 Tractor (pentru lucrări grele):</strong></p>
                            <p class="guide-detail">${powerRecs.tractorRec}</p>
                        </div>
                        <div class="guide-item">
                            <p><strong>🌾 Combină:</strong></p>
                            <p class="guide-detail">${powerRecs.combineRec}</p>
                            <p class="time-estimate">
                                ⏱️ Timp de recoltat estimat: <strong>${powerRecs.workHours} ore efective</strong><br>
                                <small>${powerRecs.harvestTimeExpl}</small>
                            </p>
                        </div>
                        ${soilHardness >= 76 ? `<div class="soil-warning">
                            <p><strong>⚠️ ATENȚIE - ${soilInfo.desc}:</strong></p>
                            <p>Recomandăm <strong>obligatoriu</strong> un <b>Subsolier (Scarificator)</b> pentru a sparge „colivia de beton". ${soilInfo.detail}.</p>
                        </div>` : ''}
                    </div>
                </section>
            `;
            if (storageEnabled) resultsHTML += `<div class="page-break"></div>`;
        }

        if (elements.moduleStorage && storageEnabled && totalArea > 0) {
            const hangarType = elements.hangarType?.value || 'none';
            const hangarMp = parseFloat(elements.hangarMp?.value || 1000);
            const fertKgPerHa = parseFloat(elements.ingrasamantKgHa?.value || 200);

            if (elements.valHangarMp) elements.valHangarMp.textContent = hangarMp;

            const storageLosses = { none: 7, beton_vechi: 6, beton_nou: 1, metal: 2 };
            const currentLoss = storageLosses[hangarType] || 6;

            const hangarCapacity = hangarMp * 2.0;
            const storedTones = Math.min(totalProductionTones, hangarCapacity);

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
                <section class="result-card result-card-storage no-break">
                    <h2>🏗️ Hangarul Tău PVC de Calitate Superioară</h2>
                    <div class="storage-advantages">
                        <h3 class="text-info-custom mb-3">🌟 De Ce PVC Otig Este Superior</h3>
                        <ul class="advantage-list">
                            <li class="advantage-item"><strong>✓ Material Densitate Mare:</strong> PVC de calitate industrială, rezistent la UV și intemperii (20+ ani)</li>
                            <li class="advantage-item"><strong>✓ Sistem de tensionare:</strong> Prelată întinsă „la coardă", rezistă la furtuni fără vibrații</li>
                            <li class="advantage-item"><strong>✓ Reparații Instant:</strong> Se peticește în <strong>5 minute</strong> dacă e tăiat din greșeală</li>
                            <li class="advantage-item"><strong>✓ Lumină Naturală:</strong> Economisiți la becuri – lumină maximă în timpul zilei</li>
                            <li class="advantage-item"><strong>✓ Imunitate Chimică:</strong> Ideal pentru ferme cu animale – PVC-ul nu ruginește</li>
                        </ul>
                    </div>
                    <h3 class="section-title">Analiză de Oportunitate (3 Scenarii de Preț)</h3>
                    <div class="storage-scenario-grid">
                        <div class="storage-scenario-card storage-scenario-conservative">
                            <p class="scenario-label">Conservativ</p>
                            <p class="scenario-price"><strong>0.3 MDL/kg</strong></p>
                            <p class="scenario-value">${formatMDL(storageProfitMDL_03)}</p>
                        </div>
                        <div class="storage-scenario-card storage-scenario-moderate">
                            <p class="scenario-label">Moderat</p>
                            <p class="scenario-price"><strong>0.5 MDL/kg</strong></p>
                            <p class="scenario-value">${formatMDL(storageProfitMDL_05)}</p>
                        </div>
                        <div class="storage-scenario-card storage-scenario-optimistic">
                            <p class="scenario-label">Optimist</p>
                            <p class="scenario-price"><strong>1.0 MDL/kg</strong></p>
                            <p class="scenario-value">${formatMDL(storageProfitMDL_10)}</p>
                        </div>
                    </div>
                    <div class="savings-summary">
                        <h3>Bani Câștigați la Fiecare Recoltă Depozitată</h3>
                        <div class="flex-between">
                            <span>❄️ Achiziții de Iarnă:</span>
                            <strong class="text-primary">${formatMDL(arbitrageMDL)}</strong>
                        </div>
                        <div class="flex-between">
                            <span>📦 Pierderi Salvate (${currentLoss}% → 0%):</span>
                            <strong class="text-primary">${formatEUR(degradationCostEUR)}</strong>
                        </div>
                        <div class="total-row">
                            <span><strong>TOTAL BENEFICII DEPOZIT:</strong></span>
                            <strong class="total-value-green">${formatEUR(storageBenefitEUR)}</strong>
                        </div>
                        ${netStorageInvestment > 0 ? `
                        <div class="investment-info">
                            <div class="flex-between">
                                <span>Investiție Hangar (după subvenție):</span>
                                <strong>${formatEUR(netStorageInvestment)}</strong>
                            </div>
                        </div>` : ''}
                    </div>
                </section>
            `;
        }

        if (totalAnnualSavings > 0) {
            const paybackSeasons = totalInvestment > 0 ? (totalInvestment / totalAnnualSavings).toFixed(1) : '0';
            const netGain = totalAnnualSavings - totalInvestment;
            const isNegative = netGain < 0;
            const roiLabel = isNegative ? 'Investiție rămasă de recuperat după Anul 1' : 'ROI (Câștig Net) - Anul 1';
            const roiColorClass = isNegative ? 'text-danger-custom' : 'text-success-custom';

            resultsHTML = `
                <section class="result-card result-card-dashboard no-break">
                    <h2>📊 Tabloul de Bord - ${farmerName}</h2>
                    <div class="grid-dashboard-container">
                        ${techEnabled ? `
                        <div class="dashboard-metric">
                            <div class="metric-label">Economie Motorină</div>
                            <div class="metric-value">${formatEUR(dashboardData.fuel)}</div>
                        </div>
                        <div class="dashboard-metric">
                            <div class="metric-label">Economie Satelit</div>
                            <div class="metric-value">${formatEUR(dashboardData.gps)}</div>
                        </div>` : ''}
                        ${storageEnabled ? `
                        <div class="dashboard-metric">
                            <div class="metric-label">Profit Depozitare</div>
                            <div class="metric-value">${formatEUR(dashboardData.storage)}</div>
                        </div>
                        <div class="dashboard-metric">
                            <div class="metric-label">Achiziții Iarnă</div>
                            <div class="metric-value">${formatEUR(dashboardData.arbitrage)}</div>
                        </div>` : ''}
                    </div>
                    <div class="total-annual">
                        <div class="total-label">💰 CÂȘTIG TOTAL ANUAL</div>
                        <div class="total-amount">${formatEUR(totalAnnualSavings)}</div>
                        ${totalInvestment > 0 ? `<div class="payback-info">Amortizare în <strong>${paybackSeasons} sezoane</strong></div>` : ''}
                    </div>
                </section>

                <section class="result-card result-card-roi no-break">
                    <h3>${roiLabel}</h3>
                    <p class="calculation-note">Calcul: Economii Totale - Investiție Totală (După Subvenții)</p>
                    <div class="net-gain ${roiColorClass}">${formatEUR(Math.abs(netGain))}</div>
                </section>
                <div class="page-break"></div>
            ` + resultsHTML;
        }

        if (elements.resultsContainer) {
            elements.resultsContainer.innerHTML = resultsHTML;
        }

        document.title = `Ghid de Rentabilitate - ${farmerName}`;
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
    if (elements.dieselPrice) elements.dieselPrice.addEventListener('input', calculate);
    if (elements.utilajNou) elements.utilajNou.addEventListener('input', calculate);
    if (elements.ingrasamantKgHa) elements.ingrasamantKgHa.addEventListener('input', calculate);

    if (elements.farmerName) {
        elements.farmerName.addEventListener('input', (e) => {
            calculate();
            if (e.target.value.trim() === 'ADMIN_OTIG_2026') {
                if (elements.btnExport) {
                    elements.btnExport.style.display = 'block';
                    alert('🔑 ADMIN MODE: PDF Unlocked!');
                }
            }
        });
    }

    document.querySelectorAll('input[name="crop_enabled"]').forEach(cb => {
        cb.addEventListener('change', calculate);
    });
    document.querySelectorAll('.crop-ha, .crop-yield').forEach(input => {
        input.addEventListener('input', calculate);
    });

    const noOtigTechCheckbox = document.getElementById('no_otig_tech');
    if (noOtigTechCheckbox) {
        noOtigTechCheckbox.addEventListener('change', updateModuleVisibility);
    }

    if (elements.btnExport) {
        elements.btnExport.addEventListener('click', () => {
            const opt = {
                margin: 0.6,
                filename: `Ghid_Rentabilitate_${elements.farmerName?.value.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 1.8, useCORS: true, logging: false },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], before: '.page-break', after: '.page-break-after', avoid: '.no-break' }
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

    updateModuleVisibility();
});