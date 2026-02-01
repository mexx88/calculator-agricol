// Enhanced Lead Capture & Admin Access Control Module
// Updated with ADMIN_OTIG_2026 and farmer-friendly preview
class OtigLeadManagerEnhanced {
    constructor() {
        this.isAdminMode = this.checkAdmin();
        this.init();
    }

    checkAdmin() {
        const adminCode = localStorage.getItem('otig_admin_code');
        return adminCode === 'ADMIN_OTIG_2026';
    }

    init() {
        this.setupAdminControls();
        this.setupModal();
    }

    setupAdminControls() {
        const adminCodeInput = document.getElementById('admin-code-input');
        const btnAdminUnlock = document.getElementById('btn-admin-unlock');
        const adminModeIndicator = document.getElementById('admin-mode-indicator');
        const adminCodeEntry = document.getElementById('admin-code-entry');

        if (!adminCodeInput || !btnAdminUnlock) return;

        if (this.isAdminMode && adminModeIndicator && adminCodeEntry) {
            adminModeIndicator.style.display = 'block';
            adminCodeEntry.style.display = 'none';
        }

        if (btnAdminUnlock) {
            btnAdminUnlock.addEventListener('click', () => {
                const code = (adminCodeInput?.value || '').trim();
                if (code === 'ADMIN_OTIG_2026') {
                    localStorage.setItem('otig_admin_code', code);
                    this.isAdminMode = true;
                    if (adminModeIndicator) adminModeIndicator.style.display = 'block';
                    if (adminCodeEntry) adminCodeEntry.style.display = 'none';
                    alert('✅ Mod Expert Otig Activat!');
                } else {
                    alert('❌ Cod Incorect');
                }
            });
        }
    }

    setupModal() {
        const btnExportPDF = document.getElementById('btn-export-pdf');
        const leadModal = document.getElementById('lead-modal');
        const modalClose = document.getElementById('modal-close');
        const leadForm = document.getElementById('lead-form');

        if (!btnExportPDF) return;

        btnExportPDF.addEventListener('click', (e) => {
            if (this.isAdminMode) {
                // Direct PDF generation for admin
                this.generatePDF();
            } else {
                // Show lead capture modal with fuel savings preview
                e.preventDefault();
                e.stopPropagation();
                if (leadModal) {
                    this.updateModalPreview();
                    leadModal.style.display = 'flex';
                }
            }
        });

        if (modalClose && leadModal) {
            modalClose.addEventListener('click', () => {
                leadModal.style.display = 'none';
            });
        }

        if (leadForm) {
            leadForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitLead();
            });
        }
    }

    updateModalPreview() {
        // Show only fuel savings in preview (public mode restriction)
        const resDiesel = document.getElementById('preview-fuel-value');
        const previewFuel = document.getElementById('preview-fuel');

        if (resDiesel && previewFuel) {
            previewFuel.textContent = resDiesel.textContent || '€15,000';
        }
    }

    submitLead() {
        const leadName = document.getElementById('lead-name')?.value;
        const leadRaion = document.getElementById('lead-raion')?.value;
        const leadPhone = document.getElementById('lead-phone')?.value;

        const leadData = {
            name: leadName,
            raion: leadRaion,
            phone: leadPhone,
            timestamp: new Date().toISOString(),
            calculations: this.captureCalculations()
        };

        // Save to localStorage
        const leads = JSON.parse(localStorage.getItem('otig_leads') || '[]');
        leads.push(leadData);
        localStorage.setItem('otig_leads', JSON.stringify(leads));

        console.log('📋 Lead captat:', leadData);

        // Close modal and generate PDF
        const leadModal = document.getElementById('lead-modal');
        if (leadModal) leadModal.style.display = 'none';

        alert(`✅ Mulțumim, ${leadName}! Ghidul dvs. de Rentabilitate va fi descărcat acum.`);
        this.generatePDF();
    }

    captureCalculations() {
        return {
            area: document.getElementById('val-suprafata')?.textContent,
            soilHardness: document.getElementById('val-soil_hardness')?.textContent,
            farmerName: document.getElementById('farmer_name')?.value
        };
    }

    generatePDF() {
        const content = document.getElementById('calculator-content');
        const farmerName = document.getElementById('farmer_name')?.value || 'Fermier';

        const opt = {
            margin: 0.5,
            filename: `Ghid_Rentabilitate_${farmerName.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        const btnExport = document.getElementById('btn-export-pdf');
        if (btnExport) btnExport.style.display = 'none';

        if (typeof html2pdf !== 'undefined' && content) {
            html2pdf().set(opt).from(content).save().then(() => {
                if (btnExport) btnExport.style.display = 'block';
            });
        }
    }
}

// Initialize lead manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.otigLeadManager = new OtigLeadManagerEnhanced();
});
