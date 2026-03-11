document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('participante-form');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const btnNext = document.querySelectorAll('.btn-next');
    const btnPrev = document.querySelectorAll('.btn-prev');
    const successModal = document.getElementById('success-modal');
    const cidadeSelect = document.getElementById('cidade');
    const cidadeOutroGroup = document.querySelector('.cidade-outro');
    const telefoneInput = document.getElementById('telefone');
    const dataNascimento = document.getElementById('data_nascimento');
    
    // URL do Web App do Google Apps Script (Você precisará gerar isso)
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5Myk7y3jmk48X9nzfo_yau-81dX4DMEB-8RRaOdhocNegz_JVDRkPs6MU0blce5Ei/exec';

    let currentStep = 1;

    const masks = {
        phone(value) {
            return value
                .replace(/\D/g, '')
                .replace(/^(\d{2})(\d)/g, '($1) $2')
                .replace(/(\d)(\d{4})$/, '$1-$2');
        }
    }

    btnNext.forEach(btn => {
        btn.addEventListener('click', () => {
            const nextStep = parseInt(btn.getAttribute('data-next'));
            if (validateStep(currentStep)) goToStep(nextStep);
        });
    });

    btnPrev.forEach(btn => {
        btn.addEventListener('click', () => {
            goToStep(parseInt(btn.getAttribute('data-prev')));
        });
    });

    function goToStep(stepNumber) {
        formSteps.forEach(step => step.classList.remove('active'));
        progressSteps.forEach(step => {
            step.classList.remove('active');
            step.classList.toggle('completed', parseInt(step.getAttribute('data-step')) < stepNumber);
        });

        const targetStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        const targetProgress = document.querySelector(`.progress-step[data-step="${stepNumber}"]`);
        
        if (targetStep) targetStep.classList.add('active');
        if (targetProgress) targetProgress.classList.add('active');

        currentStep = stepNumber;
        window.scrollTo({
            top: document.querySelector('.form-container').offsetTop - 100,
            behavior: 'smooth'
        });
    }

    function validateStep(stepNumber) {
        const currentStepElement = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            field.classList.remove('error');
            const errorMsg = field.parentElement.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();

            if (!field.value || field.value.trim() === '') {
                showError(field, 'Este campo é obrigatório');
                isValid = false;
                return;
            }

            if (field.type === 'email' && !validateEmail(field.value)) {
                showError(field, 'Insira um e-mail válido (ex: nome@dominio.com)');
                isValid = false;
            } else if (field.id === 'telefone' && !validatePhone(field.value)) {
                showError(field, 'Telefone inválido. Formato: (71) 9XXXX-XXXX');
                isValid = false;
            } else if (field.type === 'checkbox' && !field.checked) {
                showError(field, 'Este campo é obrigatório');
                isValid = false;
            }
        });

        return isValid;
    }

    function showError(field, message) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentElement.appendChild(errorDiv);
        field.parentElement.classList.add('has-error');
    }

    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 11) return false;
        if (cleanPhone.substring(2, 3) !== '9') return false;
        return true;
    }

    telefoneInput.addEventListener('input', (e) => {
        e.target.value = masks.phone(e.target.value);
    });

    cidadeSelect.addEventListener('change', (e) => {
        const isOutra = e.target.value === 'outra';
        cidadeOutroGroup.style.display = isOutra ? 'block' : 'none';
        document.getElementById('cidade_outro').required = isOutra;
    });

    dataNascimento.addEventListener('change', (e) => {
        const birthDate = new Date(e.target.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 16) {
            showError(e.target, 'É necessário ter pelo menos 16 anos');
            e.target.value = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        const submitBtn = form.querySelector('.form-btn-submit');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (!data[key]) {
                data[key] = value;
            } else {
                if (!Array.isArray(data[key])) data[key] = [data[key]];
                data[key].push(value);
            }
        });
        
        if(Array.isArray(data['interesses[]'])) {
            data.interesses = data['interesses[]'].join(', ');
            delete data['interesses[]'];
        }

        data.data_inscricao = new Date().toLocaleString('pt-BR');

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            successModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            form.reset();
            localStorage.clear();
            
        } catch (error) {
            console.error(error);
            alert('Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    const formInputs = form.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        const saved = localStorage.getItem(`form_${input.name}`);
        if (saved) input.type === 'checkbox' ? input.checked = saved === 'true' : input.value = saved;
        
        input.addEventListener('change', () => {
            localStorage.setItem(`form_${input.name}`, input.type === 'checkbox' ? input.checked : input.value);
        });
    });
});