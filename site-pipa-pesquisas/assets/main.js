// Inicialize o EmailJS no <head> do HTML antes de carregar este script ou adicione aqui se usar import
// emailjs.init("SUA_PUBLIC_KEY");

document.addEventListener('DOMContentLoaded', () => {
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if(menuToggle){
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    const heroContainer = document.getElementById('hero-slides');
    const gridContainer = document.getElementById('pesquisas-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let todasPesquisas = [];

    if (heroContainer || gridContainer) {
        fetch('dados/pesquisas.json')
            .then(r => r.json())
            .then(data => {
                todasPesquisas = data.pesquisas;

                if (heroContainer) {
                    heroContainer.innerHTML = ''; 
                    todasPesquisas.slice(-5).reverse().forEach(p => {
                        heroContainer.innerHTML += `
                            <div class="swiper-slide">
                                <div class="container">
                                    <div class="hero-card">
                                        <div class="hero-content">
                                            <span class="tag destaque">Em Destaque</span>
                                            <h1>${p.titulo}</h1>
                                            <p>${p.resumo_home || p.subtitulo}</p>
                                            <a href="pesquisa-dinamica.html?id=${p.id}" class="btn-submit bg-gradient-pipa" style="width:auto; display:inline-block; text-align:center;">Clique aqui e Leia mais</a>
                                        </div>
                                        <div class="hero-img" style="background-image: url('${p.imagem_hero}')"></div>
                                    </div>
                                </div>
                            </div>`;
                    });

                    new Swiper('.hero-swiper', { 
                        loop: true, speed: 1000,
                        autoplay: { delay: 8000, disableOnInteraction: false },
                        pagination: { el: '.swiper-pagination', clickable: true },
                        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                        fadeEffect: { crossFade: true }
                    });
                }

                if (gridContainer) renderizarGrid(todasPesquisas);
            })
            .catch(err => console.error(err));
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filtro = btn.getAttribute('data-filter');
            
            if (filtro === 'todas') {
                renderizarGrid(todasPesquisas);
            } else {
                renderizarGrid(todasPesquisas.filter(p => {
                    if (!p.categoria) return false;
                    return p.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === filtro;
                }));
            }
        });
    });

    function renderizarGrid(lista) {
        gridContainer.innerHTML = '';
        if (lista.length === 0) {
            gridContainer.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#666;">Nenhuma pesquisa encontrada.</p>';
            return;
        }

        lista.forEach(p => {
            let classeTag = 'geral';
            const catLower = (p.categoria || '').toLowerCase();
            if (catLower.includes('tend')) classeTag = 'tendencias';
            else if (catLower.includes('consumo')) classeTag = 'consumo';
            else if (catLower.includes('comportamento')) classeTag = 'comportamento';

            const pesquisaId = (p.id || '').trim();
            if (!pesquisaId) return; // evita links inválidos

            gridContainer.innerHTML += `
                <article class="card">
                    <div class="card-img"><img src="${p.imagem_hero}" alt="${p.titulo}"></div>
                    <div class="card-body">
                        <span class="tag ${classeTag}">${p.categoria || 'Geral'}</span>
                        <h3>${p.titulo}</h3>
                        <p>${p.resumo_home || p.subtitulo}</p>
                        <a href="pesquisa-dinamica.html?id=${encodeURIComponent(pesquisaId)}" class="card-link">Ver insights <i class="fas fa-arrow-right"></i></a>
                    </div>
                </article>`;
        });
    }
    
    const episodeCards = document.querySelectorAll('.episode-card');
    episodeCards.forEach(card => {
        const videoId = (card.getAttribute('data-video').match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/) || [])[2];
        const previewContainer = card.querySelector('.episode-preview-container');
        let iframe = null;
        let hoverTimeout, videoTimeout;

        card.addEventListener('mouseenter', () => {
            hoverTimeout = setTimeout(() => {
                if (!iframe && videoId && videoId.length === 11) {
                    iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0`;
                    iframe.className = 'episode-preview';
                    iframe.setAttribute('frameborder', '0');
                    previewContainer.appendChild(iframe);
                    card.classList.add('playing');
                    
                    videoTimeout = setTimeout(() => {
                        if (iframe) { iframe.remove(); iframe = null; card.classList.remove('playing'); }
                    }, 30000);
                }
            }, 300);
        });

        card.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            clearTimeout(videoTimeout); 
            if (iframe) { iframe.remove(); iframe = null; card.classList.remove('playing'); }
        });
    });

    // ==========================================
    // CONFIGURAÇÃO EMAILJS (Formulário de Contato)
    // ==========================================
    const contactForms = document.querySelectorAll('.contact-form'); 
    
    // IDs do EmailJS (Preencha com os seus dados do Passo A)
    const SERVICE_ID = 'service_4bmmlxl';
    const TEMPLATE_ID = 'template_k9zl5qn';

    contactForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            const nomeInput = this.querySelector('input[placeholder*="nome"], input[type="text"]');
            const emailInput = this.querySelector('input[type="email"]');
            const msgInput = this.querySelector('textarea');

            // Feedback visual imediato
            btn.innerText = 'Enviando...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            // Prepara os dados conforme as variáveis {{...}} que definimos no template do site
            const templateParams = {
                from_name: nomeInput.value,
                reply_to: emailInput.value,
                message: msgInput.value
            };

            // Envia
            emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
                .then(() => {
                    alert('Mensagem enviada com sucesso! Em breve entraremos em contato.');
                    this.reset(); // Limpa o formulário
                }, (err) => {
                    console.error('Erro EmailJS:', err);
                    alert('Ocorreu um erro ao enviar. Por favor, tente novamente mais tarde.');
                })
                .finally(() => {
                    // Restaura o botão
                    btn.innerText = originalText;
                    btn.disabled = false;
                    btn.style.opacity = '1';
                });
        });
    });
});