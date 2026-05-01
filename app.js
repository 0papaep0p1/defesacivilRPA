const secoes = [
  {titulo:'Checklist Documentação', itens:[
    ['Autorização do voo no SARPAS/órgão competente?', true],
    ['Cadastro do RPA no SISANT/ANAC ou registro interno?', true],
    ['Certificado de homologação da ANATEL, quando aplicável?', false],
    ['Seguro RETA/seguro operacional vigente, quando aplicável?', false],
    ['Piloto/operador habilitado e autorizado para a missão?', true],
    ['Plano de voo/missão conferido e autorizado?', true]
  ]},
  {titulo:'Checklist Escritório / Equipamentos', itens:[
    ['RPA inspecionado e atualizado?', true], ['Base DRTK/RTK inspecionada e atualizada?', false],
    ['Baterias do RPA carregadas e íntegras?', true], ['Baterias da base carregadas?', false],
    ['Baterias do controle carregadas?', true], ['Baterias do display/tablet carregadas?', true],
    ['Cartão de memória instalado e com espaço disponível?', false], ['Hélices sem trincas, deformações ou folgas?', true],
    ['Carregador de bateria do RPA disponível?', false], ['Carregador do controle disponível?', false],
    ['Cabo de carregamento do RPA disponível?', false], ['Cabo do controle/display disponível?', false]
  ]},
  {titulo:'Início do Checklist Pré-Voo', itens:[
    ['Espaço aéreo verificado, sem obstruções e com autorização?', true], ['Clima favorável: vento, chuva, visibilidade e precipitação verificados?', true],
    ['Estrutura do drone sem defeitos aparentes?', true], ['Baterias do drone com carga suficiente e encaixe correto?', true],
    ['Bateria do controle com carga suficiente?', true], ['Bateria do display/tablet com carga suficiente?', true],
    ['Cartão de memória instalado e pronto?', false], ['Trava do gimbal removida?', true],
    ['Display ligado, conectado e funcionando normalmente?', true], ['Controle ligado e conectado normalmente?', true],
    ['Drone ligado e conectado normalmente?', true], ['Configuração do drone revisada e adequada para o voo?', true],
    ['Plano de voo revisado e área com parâmetros corretos?', true], ['Câmera e sensores configurados adequadamente?', false],
    ['Bússola/IMU calibrada quando necessário?', true], ['Limites de voo/altura/distância dentro do campo visual?', true],
    ['Modo de voo correto, GPS/Ready verde ou equivalente?', true], ['Local de decolagem livre a pelo menos 5 metros?', true]
  ]},
  {titulo:'Checklist Motores Ligados', itens:[
    ['Motores iniciaram normalmente, sem ruídos anormais?', true], ['Home Point definido para o local de decolagem?', true],
    ['Controle de voo, comandos e retorno visual normais?', true], ['Telemetria normal: bateria, altura, distância, posição e sinal?', true]
  ]},
  {titulo:'Checklist Pós-Voo', itens:[
    ['Drone não apresentou anormalidade durante o voo?', true], ['Baterias retiradas/manuseadas com segurança e sem dano?', true],
    ['Estrutura do drone sem defeitos aparentes após o voo?', true], ['Trava do gimbal recolocada?', false],
    ['Baterias removidas para armazenamento/transporte seguro?', true], ['Arquivos/imagens conferidos e salvos?', false],
    ['Ocorrência/anormalidade registrada em observações, se houver?', false]
  ]}
];

const checklists = document.getElementById('checklists');
const alerta = document.getElementById('alerta');
const salvarBtn = document.getElementById('salvarBtn');
const pdfBtn = document.getElementById('pdfBtn');
const resultadoPrint = document.getElementById('resultadoPrint');
let liberado = false;
let preVooValidado = false;
let checklistFinalizado = false;

document.getElementById('data').valueAsDate = new Date();
document.getElementById('validacao').value = '';

function aplicarDadosPadrao(){
  const piloto = document.getElementById('piloto');
  const cpf = document.getElementById('cpf');
  const responsavel = document.getElementById('responsavel');

  if (piloto && !piloto.value.trim()) piloto.value = 'RUAN DOS SANTOS';
  if (cpf && !cpf.value.trim()) cpf.value = '057.690.639-55';
  if (responsavel && piloto) responsavel.value = piloto.value.toUpperCase();

  if (piloto && responsavel) {
    piloto.addEventListener('input', () => {
      responsavel.value = piloto.value.toUpperCase();
    });
  }
}

function formatarCaixaAlta(){
  document.querySelectorAll('input, textarea, select').forEach(campo => {
    campo.addEventListener('input', () => {
      const inicio = campo.selectionStart;
      const fim = campo.selectionEnd;
      campo.value = campo.value.toUpperCase();
      if (campo.setSelectionRange && inicio !== null && fim !== null) {
        campo.setSelectionRange(inicio, fim);
      }
    });
  });
}

function converterParaGraus(valor, tipo) {
  const absoluto = Math.abs(valor);
  const graus = Math.floor(absoluto);
  const minutosFloat = (absoluto - graus) * 60;
  const minutos = Math.floor(minutosFloat);
  const segundos = ((minutosFloat - minutos) * 60).toFixed(1);
  const direcao = tipo === 'lat' ? (valor >= 0 ? 'N' : 'S') : (valor >= 0 ? 'E' : 'W');
  return `${graus}°${minutos}'${segundos}"${direcao}`;
}

function capturarLocalizacao() {
  return new Promise((resolve) => {
    const campo = document.getElementById('localizacao');

    if (!campo) {
      resolve(false);
      return;
    }

    if (!navigator.geolocation) {
      setAlerta('erro', '⚠️ GPS não suportado neste dispositivo.');
      resolve(false);
      return;
    }

    campo.value = 'OBTENDO LOCALIZAÇÃO...';
    setAlerta('neutro', '📍 Obtendo localização do dispositivo. Aguarde...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = converterParaGraus(pos.coords.latitude, 'lat');
        const lon = converterParaGraus(pos.coords.longitude, 'lon');

        campo.value = `${lat} ${lon}`;
        setAlerta('ok', `✅ Localização capturada automaticamente: ${campo.value}`);
        resolve(true);
      },
      () => {
        campo.value = '';
        setAlerta('erro', '⚠️ Não foi possível obter a localização. Ative o GPS e permita o acesso à localização.');
        resolve(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}

function renderizar(){
  let n=1;
  checklists.innerHTML = secoes.map(sec => `
    <section class="secao">
      <div class="secao-titulo">${sec.titulo}</div>
      <table class="tabela">
        <thead>
          <tr><th class="numero">No.</th><th>Item</th><th class="check">Check</th></tr>
        </thead>
        <tbody>${sec.itens.map(([texto,critico]) => {
          const itemId = `item_${n}`;
          const html = `
          <tr class="${critico?'critico':''}">
            <td class="numero">${n}</td>
            <td class="item-texto">${texto}</td>
            <td class="check">
              <div class="check-group" data-critico="${critico}" data-name="${itemId}" data-fase="${sec.titulo.toLowerCase().includes('pós') ? 'pos' : 'pre'}">
                <label title="Conforme"><input type="radio" name="${itemId}" value="OK"> <span>C</span></label>
                <label title="Não conforme"><input type="radio" name="${itemId}" value="NOK"> <span>NC</span></label>
                <label title="Não se aplica"><input type="radio" name="${itemId}" value="NA"> <span>N/A</span></label>
              </div>
            </td>
          </tr>`;
          n++;
          return html;
        }).join('')}</tbody>
      </table>
    </section>`).join('');
}
function setAlerta(tipo, msg){
  alerta.className = `alerta no-print alerta-${tipo}`;
  alerta.textContent = msg;
}

function bloquear(msg){
  liberado=false;
  salvarBtn.disabled = preVooValidado ? false : true;
  pdfBtn.disabled=true;
  resultadoPrint.className='resultado-print bloqueado'; resultadoPrint.textContent='NÃO LIBERADO PARA VOO';
  setAlerta('erro', msg);
}

function horaAtualHHMM(){
  const agora = new Date();
  return String(agora.getHours()).padStart(2,'0') + ':' + String(agora.getMinutes()).padStart(2,'0');
}

function dataHoraAtualBR(){
  return new Date().toLocaleString('pt-BR');
}

function setHoraInicialSeVazia(){
  const horaInicio = document.getElementById('horaInicio');
  if (horaInicio && !horaInicio.value) horaInicio.value = horaAtualHHMM();
}

function setHoraFinalAgora(){
  const horaFim = document.getElementById('horaFim');
  if (horaFim) horaFim.value = horaAtualHHMM();
}

function validar(fase='pre'){
  const obrigatorios = ['piloto','data','modelo','finalidade','localizacao'];

  for(const id of obrigatorios){
    const campo = document.getElementById(id);
    if(!campo || !campo.value.trim()){
      bloquear('⚠️ Preencha todos os dados obrigatórios antes de validar.');
      return false;
    }
  }

  const todosGrupos = [...document.querySelectorAll('.check-group')];
  const grupos = fase === 'final' ? todosGrupos : todosGrupos.filter(g => g.dataset.fase !== 'pos');
  const pendentes = grupos.filter(g => !g.querySelector('input[type="radio"]:checked'));

  if(pendentes.length){
    const textoFase = fase === 'final' ? 'do checklist' : 'do PRÉ-VOO';
    bloquear(`⚠️ Existem ${pendentes.length} itens ${textoFase} sem resposta. Marque C, NC ou N/A para continuar.`);
    return false;
  }

  const criticosNok = grupos.filter(g => {
    const marcado = g.querySelector('input[type="radio"]:checked');
    return g.dataset.critico === 'true' && (!marcado || marcado.value !== 'OK');
  });

  if(criticosNok.length){
    bloquear(`🛑 VOO BLOQUEADO: ${criticosNok.length} item(ns) crítico(s) não estão conformes. Corrija antes de salvar ou imprimir o PDF.`);
    return false;
  }

  const naoCriticosNok = grupos.filter(g => {
    const marcado = g.querySelector('input[type="radio"]:checked');
    return g.dataset.critico !== 'true' && marcado && marcado.value === 'NOK';
  }).length;

  const responsavel = document.getElementById('responsavel');
  const piloto = document.getElementById('piloto');
  if (responsavel && piloto) responsavel.value = piloto.value.toUpperCase();

  if (fase === 'pre') {
    preVooValidado = true;
    checklistFinalizado = false;
    liberado = true;
    salvarBtn.disabled = false;
    pdfBtn.disabled = true;
    setHoraInicialSeVazia();
    resultadoPrint.className='resultado-print ok';
    resultadoPrint.textContent='PRÉ-VOO VALIDADO / VOO EM ANDAMENTO';
    setAlerta('ok', naoCriticosNok ? `✅ Pré-voo validado. Atenção: existem ${naoCriticosNok} item(ns) não crítico(s) não conforme(s). O Pós-VOO deverá ser preenchido ao finalizar.` : '✅ Pré-voo validado. Voo iniciado. O Pós-VOO deverá ser preenchido somente ao finalizar a operação.');
    return true;
  }

  preVooValidado = true;
  checklistFinalizado = true;
  liberado = true;
  salvarBtn.disabled = false;
  pdfBtn.disabled = false;
  setHoraFinalAgora();
  document.getElementById('validacao').value = dataHoraAtualBR();
  resultadoPrint.className='resultado-print ok';
  resultadoPrint.textContent='CHECKLIST FINALIZADO / PRONTO PARA IMPRESSÃO';
  setAlerta('ok', naoCriticosNok ? `✅ Checklist finalizado. Atenção: existem ${naoCriticosNok} item(ns) não crítico(s) não conforme(s), registre em observações.` : '✅ Checklist finalizado com segurança. PDF liberado para impressão.');
  return true;
}

function dados(){
  return {
    id: Date.now(),
    piloto: document.getElementById('piloto').value,
    data: document.getElementById('data').value,
    modelo: document.getElementById('modelo').value,
    local: document.getElementById('localizacao').value,
    finalidade: document.getElementById('finalidade').value,
    validacao: document.getElementById('validacao').value,
    status: liberado ? 'Liberado' : 'Bloqueado'
  };
}

function carregarHistorico(){
  const lista = JSON.parse(localStorage.getItem('historicoRPA') || '[]');
  document.getElementById('historicoLista').innerHTML = lista.length ? lista.map(h => `<div class="hist-item"><b>${h.data} - ${h.piloto}</b><br>${h.modelo} | ${h.local}<br><span class="badge ${h.status==='Liberado'?'badge-ok':'badge-erro'}">${h.status}</span></div>`).join('') : '<p>Nenhum checklist salvo neste dispositivo.</p>';
}

async function validarComLocalizacao(fase='pre'){
  const localizacao = document.getElementById('localizacao');
  if (localizacao && !localizacao.value.trim()) {
    const capturada = await capturarLocalizacao();
    if (!capturada) return false;
  }
  return validar(fase);
}


renderizar();
aplicarDadosPadrao();
formatarCaixaAlta();

document.getElementById('localizacaoBtn').addEventListener('click', capturarLocalizacao);

document.getElementById('validarBtn').addEventListener('click', async () => {
  await validarComLocalizacao('pre');
});

document.getElementById('salvarBtn').addEventListener('click', async () => {
  if(!preVooValidado){
    setAlerta('erro','⚠️ Primeiro clique em VALIDAR SEGURANÇA para iniciar o voo.');
    return;
  }

  const ok = await validarComLocalizacao('final');
  if(!ok) return;

  const lista = JSON.parse(localStorage.getItem('historicoRPA') || '[]');
  lista.unshift(dados());
  localStorage.setItem('historicoRPA', JSON.stringify(lista.slice(0,50)));
  carregarHistorico();
  setAlerta('ok','✅ Pós-VOO salvo, hora final registrada e checklist finalizado no histórico local. PDF liberado.');
});

document.getElementById('pdfBtn').addEventListener('click', () => {
  if(!checklistFinalizado){
    setAlerta('erro','⚠️ Finalize o Pós-VOO em SALVAR CHECKLIST antes de imprimir/gerar PDF.');
    return;
  }
  window.print();
});

document.getElementById('formChecklist').addEventListener('reset', () => setTimeout(() => {
  liberado=false;
  preVooValidado=false;
  checklistFinalizado=false;
  salvarBtn.disabled=true;
  pdfBtn.disabled=true;
  resultadoPrint.className='resultado-print';
  resultadoPrint.textContent='AGUARDANDO VALIDAÇÃO';
  setAlerta('neutro','Preencha os dados e marque todos os itens obrigatórios. O sistema só libera o PDF quando os pontos críticos estiverem conformes.');
  document.getElementById('data').valueAsDate = new Date();
  document.getElementById('validacao').value = '';
  aplicarDadosPadrao();
},50));

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js');
}

carregarHistorico();
