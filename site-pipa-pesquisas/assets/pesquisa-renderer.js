/* ==========================================
   RENDERIZADOR DE PESQUISAS (V7 - CORRIGIDO)
   Com suporte a: texto_puro, caixa_destaque, layout_imagem_texto
   ========================================== */

class PesquisaRenderer {
    constructor(data) {
        this.data = data;
        this.mainContainer = document.getElementById('pesquisa-main');
    }

    render() {
        this.aplicarCores();
        this.renderHero();
        this.renderContextoMetodologia();
        this.renderAmostra();
        
        if (this.data.blocos) {
            this.data.blocos.forEach(bloco => {
                this.processarBloco(bloco, this.mainContainer);
            });
        }
        
        this.initAnimations();
    }

    aplicarCores() {
        const root = document.documentElement;
        if (this.data.cores) {
            root.style.setProperty('--cor-primaria', this.data.cores.primaria);
            root.style.setProperty('--cor-secundaria', this.data.cores.secundaria);
            root.style.setProperty('--cor-acento', this.data.cores.acento || this.data.cores.primaria);
        }
    }

    renderHero() {
        const h = this.data.hero;
        this.mainContainer.innerHTML += `
            <section class="hero-pesquisa" style="background-image: url('${h.imagem}');">
                <div class="pesquisa-container">
                    <div class="hero-pesquisa-content">
                        <span class="hero-tag">${h.categoria || 'Pesquisa'}</span>
                        <h1>${h.titulo}</h1>
                        <p class="subtitulo">${h.subtitulo}</p>
                        <div class="hero-meta">
                            <span><i class="fas fa-calendar"></i> ${h.data}</span>
                            <span><i class="fas fa-user"></i> ${h.autor}</span>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    renderContextoMetodologia() {
        const c = this.data.contexto;
        const m = this.data.metodologia;
        const itens = m.itens.map(i => `<li><i class="${i.icone}"></i> ${i.texto}</li>`).join('');
        
        this.mainContainer.innerHTML += `
            <section class="contexto-metodologia-section">
                <div class="pesquisa-container">
                    <div class="contexto-metodologia-grid">
                        <div class="contexto-box">
                            <div class="box-title"><i class="fas fa-quote-left"></i> ${c.titulo}</div>
                            <p class="box-text">${c.texto}</p>
                        </div>
                        <div class="metodologia-box">
                            <div class="box-title"><i class="fas fa-clipboard-list"></i> Metodologia</div>
                            <p class="box-text" style="margin-bottom:15px"><strong>${m.resumo}</strong></p>
                            <ul class="metodologia-lista">${itens}</ul>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    renderAmostra() {
        const a = this.data.amostra;
        this.mainContainer.innerHTML += `
            <section class="amostra-section">
                <div class="pesquisa-container">
                    <div class="section-header">
                        <p class="section-pretitle">Perfil do Respondente</p>
                        <h2 class="section-title">Quem Participou</h2>
                        <p class="section-subtitle">Base total: ${a.total} entrevistas</p>
                    </div>
                    <div class="amostra-grid" id="amostra-grid"></div>
                </div>
            </section>`;
        
        setTimeout(() => this.renderDistribuicoes(), 100);
    }

    renderDistribuicoes() {
        const grid = document.getElementById('amostra-grid');
        if (!grid) return;
        const dist = this.data.amostra.distribuicao;

        for (const [key, value] of Object.entries(dist)) {
            let conteudo = '';
            let titulo = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

            if (Array.isArray(value)) {
                conteudo = value.map(item => {
                    const label = item.faixa || item.classe || item.label || item.tipo;
                    const valor = item.percentual || item.valor;
                    const num = parseFloat(valor);
                    
                    return `
                    <div class="distribuicao-item">
                        <div class="distribuicao-item-header">
                            <b>${label}</b>
                            <span>${num}%</span>
                        </div>
                        <div class="distribuicao-barra">
                            <div class="distribuicao-barra-fill" data-width="${num}"></div>
                        </div>
                    </div>`;
                }).join('');
            } else {
                conteudo = Object.entries(value).map(([k, v]) => `
                    <div class="distribuicao-item simples">
                        <span><b>${k}</b></span>
                        <span style="color: var(--cor-primaria); font-weight: 700;">${v}</span>
                    </div>`).join('');
            }

            grid.innerHTML += `
                <div class="amostra-card">
                    <h3 class="amostra-card-title">${titulo}</h3>
                    ${conteudo}
                </div>`;
        }
        
        // ANIMAR BARRAS após inserir no DOM
        setTimeout(() => {
            document.querySelectorAll('.distribuicao-barra-fill').forEach(bar => {
                const width = bar.getAttribute('data-width');
                if (width) {
                    bar.style.width = width + '%';
                }
            });
        }, 300);
    }

    processarBloco(bloco, container) {
        // 1. Bloco de Colunas
        if (bloco.tipo === 'colunas') {
            this.renderColunas(bloco, container);
            return;
        }

        // 2. Layout Lateral (Texto + Gráfico)
        if (bloco.texto_lado) {
            const section = document.createElement('section');
            section.className = 'py-80';
            
            const classePosicao = bloco.posicao_texto === 'esquerda' ? 'texto-esquerda' : 'texto-direita';

            section.innerHTML = `
            <div class="pesquisa-container">
                <div class="layout-lateral ${classePosicao}">
                    
                    <div class="area-visual"></div>
                    
                    <div class="area-texto">
                        ${bloco.titulo ? `<h3>${bloco.titulo}</h3>` : ''}
                        <div class="texto-rico">${this.formatarTexto(bloco.texto_lado)}</div>
                    </div>

                </div>
            </div>`;
            
            container.appendChild(section);
            
            const visualContainer = section.querySelector('.area-visual');
            const blocoVisual = { ...bloco, titulo: null, texto_lado: null }; 
            this.rotearRenderizacao(blocoVisual, visualContainer);
        
        } else {
            // 3. Renderização Normal
            this.rotearRenderizacao(bloco, container); 
        }
    }

    rotearRenderizacao(bloco, targetElement) {
        let html = '';
        
        switch(bloco.tipo) {
            // === NOVOS BLOCOS ===
            case 'texto_puro': html = this.getHtmlTextoPuro(bloco); break;
            case 'caixa_destaque': html = this.getHtmlCaixaDestaque(bloco); break;
            case 'layout_imagem_texto': html = this.getHtmlLayoutImagemTexto(bloco); break;
            
            // === BLOCOS SETOR IMOBILIÁRIO ===
            case 'texto_com_destaque_lateral': html = this.getHtmlTextoComDestaqueLateral(bloco); break;
            case 'lista_com_barras': html = this.getHtmlListaComBarras(bloco); break;
            case 'grafico_barras_empilhadas': html = this.getHtmlBarrasEmpilhadas(bloco); break;
            case 'grid_cards': html = this.getHtmlGridCards(bloco); break;
            
            // === BLOCOS ANTERIORES ===
            case 'texto_duas_colunas': html = this.getHtmlTextoDuasColunas(bloco); break;
            case 'texto_caixa_borda': html = this.getHtmlTextoCaixaBorda(bloco); break;
            case 'texto_narrativo': html = this.getHtmlTextoNarrativo(bloco); break;
            case 'texto_destaque_caixa': html = this.getHtmlTextoCaixa(bloco); break;
            case 'grafico_linha': html = this.getHtmlGraficoLinha(bloco); break;
            case 'grafico_barras_horizontal': html = this.getHtmlBarrasHorizontal(bloco); break;
            case 'faixa_destaque': html = `<div class="faixa-destaque">${bloco.icone ? `<i class="${bloco.icone} fa-2x mb-2"></i>` : ''}<p class="faixa-texto">${bloco.texto}</p>${bloco.subtexto ? `<p class="faixa-subtexto">${bloco.subtexto}</p>` : ''}</div>`; break;
            case 'nuvem_tags': html = this.getHtmlNuvemTags(bloco); break;
            case 'barra_segmentada': html = this.getHtmlBarraSegmentada(bloco); break;
            case 'comparacao': html = this.getHtmlComparacao(bloco); break;
            case 'timeline': html = this.getHtmlTimeline(bloco); break;
            case 'grid_insights': html = this.getHtmlGridInsights(bloco); break;
            case 'grafico_pizza': html = this.getHtmlGraficoPizza(bloco); break;
            case 'texto_imagem': html = this.getHtmlTextoImagem(bloco); break;
            case 'citacao': html = `<div class="citacao-conteudo"><p class="citacao-texto">${bloco.texto}</p><div class="citacao-autor">${bloco.autor}</div></div>`; break;
            case 'grafico_colunas': html = this.getHtmlGraficoColunas(bloco); break;
            default: html = ''; 
        }

        if (!html) return;

        if (targetElement !== this.mainContainer) {
            targetElement.innerHTML = html;
        } else {
            const wrapper = document.createElement('div');
            const isFull = bloco.tipo === 'faixa_destaque' || bloco.tipo === 'citacao';
            const containerClass = isFull ? 'pesquisa-full-width' : 'pesquisa-container';
            
            wrapper.innerHTML = `<section class="${bloco.tipo}-section py-80"><div class="${containerClass}">${html}</div></section>`;
            this.mainContainer.appendChild(wrapper);
        }
    }

    // === NOVOS GERADORES ===
    
    getHtmlTextoPuro(b) {
        return `<div class="texto-puro">${this.formatarTexto(b.texto)}</div>`;
    }
    
    getHtmlCaixaDestaque(b) {
        return `<div class="caixa-destaque">${this.formatarTexto(b.texto)}</div>`;
    }
    
    getHtmlLayoutImagemTexto(b) {
        const classePosicao = b.posicao_imagem === 'esquerda' ? 'imagem-esquerda' : 'imagem-direita';
        const ordem = b.posicao_imagem === 'esquerda' 
            ? `<div class="imagem-container"><img src="${b.imagem}" alt="${b.titulo || 'Imagem'}"></div><div class="texto-container"><h3>${b.titulo}</h3><p>${this.formatarTexto(b.texto)}</p></div>`
            : `<div class="texto-container"><h3>${b.titulo}</h3><p>${this.formatarTexto(b.texto)}</p></div><div class="imagem-container"><img src="${b.imagem}" alt="${b.titulo || 'Imagem'}"></div>`;
        
        return `<div class="layout-imagem-texto ${classePosicao}">${ordem}</div>`;
    }

    // === GERADORES ANTERIORES ===
    
    getHtmlTextoDuasColunas(b) {
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="texto-duas-colunas">
                <div class="coluna-texto">${this.formatarTexto(b.texto1)}</div>
                <div class="coluna-texto">${this.formatarTexto(b.texto2)}</div>
            </div>
        `;
    }

    getHtmlTextoCaixaBorda(b) {
        return `
            <div class="texto-caixa-borda">
                ${b.titulo ? `<h3 class="caixa-borda-titulo">${b.titulo}</h3>` : ''}
                <div class="caixa-borda-conteudo">${this.formatarTexto(b.texto)}</div>
            </div>
        `;
    }

    getHtmlTextoNarrativo(b) {
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="texto-corpo">${this.formatarTexto(b.texto)}</div>
        `;
    }

    getHtmlTextoCaixa(b) {
        return `
            <div class="texto-caixa" style="background-color: ${b.cor_fundo || '#f9f9f9'}; border-left: 5px solid var(--cor-primaria);">
                ${b.titulo ? `<h3 class="caixa-titulo">${b.titulo}</h3>` : ''}
                <p class="caixa-corpo">${this.formatarTexto(b.texto)}</p>
            </div>`;
    }

    getHtmlGraficoLinha(b) {
        const w = 800, h = 300, p = 40;
        const max = Math.max(...b.dados.map(d=>d.valor)) * 1.2;
        const points = b.dados.map((d, i) => ({
            x: (i / (b.dados.length - 1)) * (w - 2*p) + p,
            y: h - p - (d.valor / max) * (h - 2*p),
            v: d.valor, l: d.label
        }));
        const dPath = points.map((pt, i) => (i===0 ? `M ${pt.x},${pt.y}` : `L ${pt.x},${pt.y}`)).join(' ');
        const dots = points.map(pt => `<circle cx="${pt.x}" cy="${pt.y}" r="6" fill="var(--cor-primaria)" stroke="white" stroke-width="2" /><text x="${pt.x}" y="${pt.y-15}" text-anchor="middle" font-weight="bold" fill="#333">${pt.v}%</text><text x="${pt.x}" y="${h-10}" text-anchor="middle" fill="#777" font-size="14">${pt.l}</text>`).join('');
        
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="chart-wrapper">
                <svg viewBox="0 0 ${w} ${h}" class="line-chart">
                    <line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#eee" stroke-width="2"/>
                    <path d="${dPath}" fill="none" stroke="var(--cor-primaria)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                    ${dots}
                </svg>
            </div>`;
    }

    getHtmlBarrasHorizontal(b) {
        const barras = b.dados.map(d => `
            <div class="bar-row">
                <div class="bar-label-container"><span>${d.label}</span><span>${d.valor}%</span></div>
                <div class="bar-track-wide"><div class="bar-fill" style="width:${d.valor}%"></div></div>
            </div>`).join('');
        return `${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}<div class="horizontal-chart-container wide">${barras}</div>`;
    }

    getHtmlNuvemTags(b) {
        const t = b.itens.map(i => `<span class="tag-item">${i}</span>`).join('');
        return `${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}<div class="tags-grid">${t}</div>`;
    }

    getHtmlBarraSegmentada(b) {
        const s = b.dados.map(d => `<div class="segmento" style="width:${d.valor}%; background:${d.cor}"><span class="segmento-valor">${d.valor}%</span></div>`).join('');
        const l = b.dados.map(d => `<div class="legenda-dot-item"><span class="dot" style="background:${d.cor}"></span> ${d.label}</div>`).join('');
        return `${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}<div class="stacked-bar-container"><div class="stacked-bar">${s}</div><div class="stacked-legend">${l}</div></div>`;
    }

    getHtmlComparacao(b) {
        const cards = b.items.map(i => `<div class="comparacao-card"><h3>${i.titulo}</h3><div class="comparacao-numero">${i.numero}</div><p>${i.descricao}</p></div>`).join('');
        return `${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}<div class="comparacao-grid">${cards}</div>`;
    }

    getHtmlTimeline(b) {
        const items = b.items.map(i => `
            <div class="timeline-item">
                <div class="timeline-conteudo">
                    <div class="timeline-data">${i.data}</div>
                    <h4>${i.titulo}</h4>
                    <p>${i.texto}</p>
                </div>
                <div class="timeline-ponto"></div>
            </div>
        `).join('');
        
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="timeline-container">
                <div class="timeline-linha"></div>
                ${items}
            </div>`;
    }

    getHtmlGridInsights(b) {
        const cardsData = Array.isArray(b.cards) ? b.cards : Array.isArray(b.insights) ? b.insights : [];
        if (!cardsData.length) {
            return b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : '';
        }

        const c = cardsData.map(x => {
            const numero = x.numero || x.value || x.quantidade || '';
            const texto = x.texto || x.label || x.descricao || '';
            const icone = x.icone ? `<div class="insight-icone"><i class="${x.icone}"></i></div>` : '';
            return `<div class="insight-card">${icone}<div class="insight-numero">${numero}</div><p class="insight-texto">${texto}</p></div>`;
        }).join('');

        return `${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}<div class="insights-grid">${c}</div>`;
    }
    
    getHtmlGraficoColunas(b) {
        const maxValor = Math.max(...b.dados.map(d => d.valor));
        const alturaContainer = 300; // altura útil em pixels
        
        const colunas = b.dados.map(d => {
            const alturaPx = (d.valor / maxValor) * alturaContainer; // altura em pixels
            
            return `
            <div class="col-item">
                <div class="col-value">${d.valor}%</div>
                <div class="col-fill col-animada" data-height="${alturaPx}"></div>
                <div class="col-label">${d.label}</div>
            </div>`;
        }).join('');
        
        return `${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}<div class="column-chart-container">${colunas}</div>`;
    }

    getHtmlGraficoPizza(b) {
        const total = b.dados.reduce((s,i)=>s+i.valor,0); let cum=0; const cores=['#ff0a72','#8938f2','#F75E12','#468FFB'];
        const svg = b.dados.map((item,i) => {
            const pct = (item.valor/total)*100; const ang=(pct/100)*360; const ini=(cum/100)*360; cum+=pct;
            const r=40, x=50+r*Math.cos((ini-90)*Math.PI/180), y=50+r*Math.sin((ini-90)*Math.PI/180);
            const x2=50+r*Math.cos((ini+ang-90)*Math.PI/180), y2=50+r*Math.sin((ini+ang-90)*Math.PI/180);
            const la=ang>180?1:0; const cor=cores[i%cores.length];
            return `<path d="M 50 50 L ${x} ${y} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z" fill="${cor}" stroke="white" stroke-width="2"/>`;
        }).join('');
        const leg = b.dados.map((d,i) => `<div class="legenda-item"><div class="legenda-cor" style="background:${cores[i%cores.length]}"></div><div class="legenda-info"><div>${d.label}</div><div><strong>${(d.valor/total*100).toFixed(0)}%</strong></div></div></div>`).join('');
        return `${b.titulo ? `<h2 class="section-title text-center">${b.titulo}</h2>`:''}<div class="grafico-pizza-container"><div class="pizza-chart"><svg viewBox="0 0 100 100">${svg}<circle cx="50" cy="50" r="20" fill="white"/></svg></div><div class="pizza-legenda">${leg}</div></div>`;
    }

    getHtmlTextoImagem(b) {
        return `<div class="texto-imagem-grid ${b.invertido?'invertido':''}"><div class="texto-conteudo"><h3>${b.titulo}</h3><p>${b.texto}</p></div><div class="imagem-destaque"><img src="${b.imagem}"></div></div>`;
    }

    // ===== NOVOS BLOCOS - SETOR IMOBILIÁRIO =====
    
    getHtmlTextoComDestaqueLateral(b) {
        const destaques = b.destaques.map(d => `
            <div class="destaque-circular" style="border-color: ${d.cor}">
                <div class="destaque-numero" style="color: ${d.cor}">${d.numero}</div>
                <div class="destaque-descricao">${d.texto}</div>
            </div>
        `).join('');
        
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="texto-destaque-lateral">
                <div class="texto-principal-lateral">${this.formatarTexto(b.texto_principal)}</div>
                <div class="destaques-container">${destaques}</div>
            </div>
        `;
    }
    
    getHtmlListaComBarras(b) {
        const linhas = b.dados.map(d => {
            const concordamWidth = d.concordam;
            const discordamWidth = d.discordam;
            
            return `
                <div class="lista-barra-item">
                    <div class="lista-barra-label">${d.item}</div>
                    <div class="lista-barra-visual">
                        <div class="lista-barra-track">
                            <div class="lista-barra-fill concordam" style="width: ${concordamWidth}%">
                                <span class="lista-barra-valor">${concordamWidth}%</span>
                            </div>
                            <div class="lista-barra-fill discordam" style="width: ${discordamWidth}%">
                                <span class="lista-barra-valor">${discordamWidth}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="lista-com-barras-container">
                <div class="lista-barras-header">
                    <span>Concordam</span>
                    <span>Discordam</span>
                </div>
                ${linhas}
            </div>
        `;
    }
    
    getHtmlBarrasEmpilhadas(b) {
        const linhas = b.dados.map(d => {
            const segmentos = d.valores.map((valor, i) => 
                `<div class="segmento-empilhado" style="width: ${valor}%; background: ${b.cores[i]}">
                    ${valor > 5 ? `<span>${valor}%</span>` : ''}
                </div>`
            ).join('');
            
            return `
                <div class="barra-empilhada-row">
                    <div class="barra-empilhada-label">${d.item}</div>
                    <div class="barra-empilhada-track">${segmentos}</div>
                </div>
            `;
        }).join('');
        
        const legenda = b.legenda.map((nome, i) => 
            `<div class="legenda-item"><span class="legenda-cor" style="background: ${b.cores[i]}"></span>${nome}</div>`
        ).join('');
        
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="grafico-barras-empilhadas">
                ${linhas}
                <div class="barras-empilhadas-legenda">${legenda}</div>
            </div>
        `;
    }
    
    getHtmlGridCards(b) {
        const cards = b.cards.map(card => `
            <div class="grid-card-item" style="background: ${card.cor || 'var(--cor-primaria)'}">
                <div class="grid-card-numero">${card.numero}</div>
                <div class="grid-card-texto">${card.texto}</div>
            </div>
        `).join('');
        
        return `
            ${b.titulo ? `<h2 class="section-title text-center mb-40">${b.titulo}</h2>` : ''}
            <div class="grid-cards-container">${cards}</div>
        `;
    }

    renderColunas(bloco, container) {
        const section = document.createElement('section');
        section.className = 'colunas-section py-80';
        section.innerHTML = `<div class="pesquisa-container"><div class="colunas-grid" id="grid-${Math.random().toString(36).substr(2,9)}"></div></div>`;
        container.appendChild(section);
        
        const grid = section.querySelector('.colunas-grid');
        bloco.itens.forEach(item => {
            const col = document.createElement('div');
            col.className = 'coluna-wrapper';
            this.rotearRenderizacao(item, col);
            grid.appendChild(col);
        });
    }

    formatarTexto(txt) {
        if(!txt) return '';
        return txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    }

    initAnimations() {
        // ANIMAÇÃO UNIVERSAL - Aplica fade-in a TODAS as seções
        const observer = new IntersectionObserver((entries) => { 
            entries.forEach(e => { 
                if (e.isIntersecting) { 
                    e.target.style.opacity = '1'; 
                    e.target.style.transform = 'translateY(0)'; 
                } 
            }); 
        }, { threshold: 0.1 });
        
        // Seleciona TODAS as seções (não apenas fade-in-up)
        const allSections = document.querySelectorAll(
            '.hero-pesquisa-content, .contexto-box, .metodologia-box, .section-header, ' +
            '.amostra-card, .faixa-destaque, .citacao-conteudo, .area-texto, ' +
            '.texto-puro, .caixa-destaque, .layout-imagem-texto, .texto-corpo, ' +
            '.texto-duas-colunas, .texto-caixa-borda, .texto-caixa, ' +
            '.chart-wrapper, .horizontal-chart-container, .insights-grid, ' +
            '.tags-grid, .stacked-bar-container, .comparacao-grid, ' +
            '.timeline-container, .grafico-pizza-container, .column-chart-container, ' +
            '.texto-destaque-lateral, .lista-com-barras-container, ' +
            '.grafico-barras-empilhadas, .grid-cards-container'
        );
        
        allSections.forEach(el => { 
            el.style.opacity = '0'; 
            el.style.transform = 'translateY(30px)'; 
            el.style.transition = 'all 0.6s ease'; 
            observer.observe(el); 
        });
        
        // ANIMAÇÃO INDIVIDUAL: Cards de insights (com delay escalonado)
        const insightCards = document.querySelectorAll('.insight-card');
        insightCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
        
        // ANIMAÇÃO INDIVIDUAL: Cards de comparação
        const compCards = document.querySelectorAll('.comparacao-card');
        compCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            card.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(card);
        });
        
        // ANIMAÇÃO ESPECÍFICA: Barras de distribuição da amostra
        setTimeout(() => {
            document.querySelectorAll('.distribuicao-barra-fill').forEach(bar => {
                const width = bar.getAttribute('data-width');
                if (width) {
                    bar.style.width = width + '%';
                }
            });
        }, 300);
        
        // ANIMAÇÃO ESPECÍFICA: Colunas dos gráficos
        setTimeout(() => {
            document.querySelectorAll('.col-animada').forEach(col => {
                const height = col.getAttribute('data-height');
                if (height) {
                    col.style.height = height + 'px';
                }
            });
        }, 500);
        
        // DEBUG: Verificar se colunas foram encontradas
        const colunas = document.querySelectorAll('.col-animada');
        console.log('Colunas encontradas:', colunas.length);
        colunas.forEach((col, i) => {
            console.log(`Coluna ${i}: height="${col.getAttribute('data-height')}"`);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pesquisaId = urlParams.get('id')?.trim();
    
    if (!pesquisaId) {
        alert('ID da pesquisa não encontrado!');
        return;
    }

    const pesquisaUrl = `./dados/${encodeURIComponent(pesquisaId)}.json`;
    console.log('Carregando pesquisa:', pesquisaId, pesquisaUrl);

    fetch(pesquisaUrl)
        .then(r => {
            if (r.ok) return r.json();
            if (r.status === 404) {
                throw new Error('NOT_FOUND');
            }
            throw new Error(`HTTP ${r.status} - ${r.statusText}`);
        })
        .then(d => {
            document.title = d.hero.titulo + ' | Pipa Pesquisas';
            new PesquisaRenderer(d).render();
        })
        .catch(err => {
            console.error('Erro ao carregar pesquisa:', pesquisaId, pesquisaUrl, err);

            // Tenta mostrar sugestões de IDs carregando pesquisas.json (apenas para debug/UX)
            fetch('dados/pesquisas.json').then(r => r.json()).then(listData => {
                const ids = Array.isArray(listData.pesquisas) ? listData.pesquisas.map(p => p.id) : [];
                document.getElementById('pesquisa-main').innerHTML = `
                    <div style="padding: 100px 20px; text-align: center;">
                        <h2>Pesquisa não encontrada</h2>
                        <p>Não foi possível carregar os dados desta pesquisa (id: <strong>${pesquisaId}</strong>).</p>
                        <p><strong>Verifique se o arquivo existe:</strong> <code>${pesquisaUrl}</code></p>
                        <p>IDs disponíveis: <code>${ids.join(', ')}</code></p>
                        <a href="index.html" style="color: var(--cor-primaria); text-decoration: underline;">Voltar para Home</a>
                    </div>
                `;
            }).catch(() => {
                document.getElementById('pesquisa-main').innerHTML = `
                    <div style="padding: 100px 20px; text-align: center;">
                        <h2>Pesquisa não encontrada</h2>
                        <p>Não foi possível carregar os dados desta pesquisa (id: <strong>${pesquisaId}</strong>).</p>
                        <p><strong>Verifique se o arquivo existe:</strong> <code>${pesquisaUrl}</code></p>
                        <a href="index.html" style="color: var(--cor-primaria); text-decoration: underline;">Voltar para Home</a>
                    </div>
                `;
            });
        });
});