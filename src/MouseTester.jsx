import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MouseTester({ onBack }) {
  // --- Estados de Hardware e Teste ---
  const [deviceInfo, setDeviceInfo] = useState({ 
    model: "Mouse Genérico / Não Detectado", 
    vendor: "---",
    serial: ""
  });
  
  // --- NOVO ESTADO: Controle de Edição ---
  const [isEditingModel, setIsEditingModel] = useState(false);

  const [tests, setTests] = useState({
    leftClick: false,
    rightClick: false,
    middleClick: false,
    scrollOk: false,
    pollingRateOk: false
  });

  const [stats, setStats] = useState({ pollingRate: 0 });
  const [currentDelta, setCurrentDelta] = useState(0);

  // --- Estados de Defeitos ---
  const [defects, setDefects] = useState({
    doubleClick: false,
    sensorFailure: false,
    scrollEncoder: false,
    cableDamage: false
  });

  // --- Controle de Laudo ---
  const [showReportForm, setShowReportForm] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [resultStatus, setResultStatus] = useState(null); // 'approved' | 'rejected'
  
  // Dados do Formulário
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [tecnicoMatricula, setTecnicoMatricula] = useState('');
  const [reportText, setReportText] = useState('');

  // Refs
  const moveCount = useRef(0);
  const lastTime = useRef(performance.now());
  const reportRef = useRef(null);

  // --- LÓGICA DE APROVAÇÃO ---
  const isAllTested = tests.leftClick && tests.rightClick && tests.middleClick && tests.scrollOk && tests.pollingRateOk;
  const hasDefects = Object.values(defects).some(val => val);
  const canReject = (reportText.trim().length >= 5) || hasDefects;

  // --- WebHID ---
  const connectMouse = async () => {
    try {
      if (!navigator.hid) return alert("Navegador incompatível (Use Chrome/Edge).");
      const devices = await navigator.hid.requestDevice({ filters: [] });
      
      if (devices.length > 0) {
        const d = devices[0];
        await d.open();
        setDeviceInfo({
          model: d.productName || "Mouse HID",
          vendor: `VID: ${d.vendorId.toString(16).toUpperCase()}`,
          serial: d.serialNumber || "" 
        });
        resetTests();
      }
    } catch (e) {
      console.log("Conexão cancelada.");
    }
  };

  // --- Handlers ---
  useEffect(() => {
    // --- ATUALIZADO: Pausa os testes se estiver editando ---
    if (isFinalized || showReportForm || isEditingModel) return;

    const handleMouseDown = (e) => {
      if (e.button === 1) e.preventDefault();
      
      if (e.button === 0) setTests(p => ({ ...p, leftClick: true }));
      if (e.button === 1) setTests(p => ({ ...p, middleClick: true }));
      if (e.button === 2) setTests(p => ({ ...p, rightClick: true }));
    };

    const handleMouseMove = () => {
      moveCount.current++;
      const now = performance.now();
      
      if (now - lastTime.current >= 1000) {
        const rate = moveCount.current;
        setStats({ pollingRate: rate });
        if (rate > 40) setTests(p => ({ ...p, pollingRateOk: true }));
        moveCount.current = 0;
        lastTime.current = now;
      }
    };

    const handleWheel = (e) => {
      const delta = Math.abs(e.deltaY);
      setCurrentDelta(delta);
      if (delta >= 100) setTests(p => ({ ...p, scrollOk: true }));
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel);
    window.oncontextmenu = (e) => e.preventDefault();

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isFinalized, showReportForm, isEditingModel]);

  // --- Funções Auxiliares ---
  const resetTests = () => {
    setTests({ leftClick: false, rightClick: false, middleClick: false, scrollOk: false, pollingRateOk: false });
    setDefects({ doubleClick: false, sensorFailure: false, scrollEncoder: false, cableDamage: false });
    setCurrentDelta(0);
    setStats({ pollingRate: 0 });
    setReportText('');
    setShowReportForm(false);
    setIsFinalized(false);
  };

  const handleFinalize = (status) => {
    setResultStatus(status);
    setIsFinalized(true);
    setShowReportForm(false);
  };

  // --- ATUALIZADO: Exportações Universais ---
  const exportAsImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: window.devicePixelRatio || 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `LAUDO_${deviceInfo.serial || 'EQUIPAMENTO'}_${new Date().getTime()}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      alert("Erro ao gerar o laudo. Verifique se o navegador está com zoom ativo.");
    }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LAUDO_${deviceInfo.serial || 'EQUIPAMENTO'}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Tente baixar como Imagem.");
    }
  };

  // --- RENDERIZAÇÃO: LAUDO FINAL ---
  if (isFinalized) {
    return (
      <div className="summary-screen dark approved">
        <div className="report-container-official" ref={reportRef}>
          <div className="report-header-official">
            <div className="report-brand">
              <h1>LAUDO TÉCNICO DE PERIFÉRICOS</h1>
              <span>MOUSE HARDWARE TEST SUITE v2.0 | CATI</span>
            </div>
            <div className="report-meta">
              <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>S/N:</strong> {deviceInfo.serial || 'N/A'}</p>
            </div>
          </div>

          <div className="report-body">
            <section className="report-info-grid">
              <div className="info-item">
                <p><strong>Equipamento:</strong> {deviceInfo.vendor} {deviceInfo.model}</p>
                <p><strong>Técnico:</strong> {tecnicoNome || '__________________'}</p>
                <p><strong>Matrícula:</strong> {tecnicoMatricula || '__________________'}</p>
              </div>
              <div className={`status-stamp-large ${resultStatus}`}>
                {resultStatus === 'approved' ? 'APROVADO' : 'REPROVADO'}
              </div>
            </section>

            {/* Visualização Gráfica no Laudo mantida */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <div className={`mouse-body ${resultStatus === 'approved' ? 'all-success' : 'rejected'}`} style={{ transform: 'scale(0.8)' }}>
                    <div className={`mouse-btn left ${resultStatus === 'approved' ? 'active' : ''}`}></div>
                    <div className={`mouse-btn right ${resultStatus === 'approved' ? 'active' : ''}`}></div>
                    <div className={`mouse-scroll ${resultStatus === 'approved' ? 'active' : ''}`}>
                        <div className={`scroll-click ${resultStatus === 'approved' ? 'active' : ''}`}></div>
                    </div>
                </div>
            </div>

            <div className="mouse-report-grid">
               <div className={`report-badge ${tests.leftClick ? 'pass' : 'fail'}`}>Botão Esq.</div>
               <div className={`report-badge ${tests.rightClick ? 'pass' : 'fail'}`}>Botão Dir.</div>
               <div className={`report-badge ${tests.middleClick ? 'pass' : 'fail'}`}>Botão Meio</div>
               <div className={`report-badge ${tests.scrollOk ? 'pass' : 'fail'}`}>Scroll</div>
            </div>
            <div className="report-badge info" style={{marginTop: '5px', width: '100%', textAlign: 'center'}}>
                Sensor Polling Rate: <strong>{stats.pollingRate}Hz</strong>
            </div>

            <div className="report-details-box">
              <h3>PARECER TÉCNICO</h3>
              <div className="observation-text">
                {resultStatus === 'approved' ? (
                  <p>O periférico passou em todos os testes obrigatórios: acionamento dos microswitches, calibração de rolagem e estabilidade do sensor. <strong>Dispositivo apto para uso.</strong></p>
                ) : (
                  <>
                    <p style={{color: '#dc2626', fontWeight: 'bold'}}>DEFEITOS CRÍTICOS IDENTIFICADOS:</p>
                    <ul style={{marginBottom: '10px', color: '#dc2626'}}>
                      {defects.doubleClick && <li>🖱️ Intermitência / Duplo Clique</li>}
                      {defects.sensorFailure && <li>🕸️ Sensor ótico falhando / Instável</li>}
                      {defects.scrollEncoder && <li>📜 Scroll instável ou pulando</li>}
                      {defects.cableDamage && <li>🔌 Cabo danificado</li>}
                      {!isAllTested && !hasDefects && <li>⚠ Reprovado: bateria de testes incompleta.</li>}
                    </ul>
                    <p><strong>Observações:</strong> {reportText || "Sem observações adicionais."}</p>
                  </>
                )}
              </div>
              
              <div className="report-signature">
                <p>__________________________________________</p>
                <p><strong>{tecnicoNome}</strong></p>
                <p>{tecnicoMatricula ? `Matrícula: ${tecnicoMatricula}` : 'Responsável Técnico'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="summary-footer-btns">
            <button className="btn-download" onClick={exportAsImage}>📸 BAIXAR PNG</button>
            <button className="btn-download pdf-btn" onClick={exportAsPDF} style={{backgroundColor: '#dc2626'}}>📄 BAIXAR PDF</button>
            <button className="btn-restart" onClick={() => window.location.reload()}>🔄 NOVO DIAGNÓSTICO</button>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: TESTADOR ---
  return (
    <div className="tester-wrapper dark">
      <header className="tester-header">
        <div className="brand">
          <button onClick={onBack} className="btn-back">⬅ Voltar</button>
          <h2>DIAGNÓSTICO DE MOUSE</h2>
        </div>
        <div className="control-center">
            <button onClick={connectMouse} className="btn-usb">🔌 Detectar USB</button>
        </div>
      </header>

      <main className="mouse-viewport">
        {/* LADO ESQUERDO: INFOS */}
        <div className="mouse-info-panel">
            
            {/* --- ATUALIZADO: BLOCO DO MODELO COM EDIÇÃO INLINE --- */}
            <div className="info-card">
                <label>MODELO DO EQUIPAMENTO</label>
                
                {!isEditingModel ? (
                    <>
                        <h3 style={{fontSize: '1rem', wordBreak: 'break-word'}}>{deviceInfo.model}</h3>
                        <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>{deviceInfo.vendor}</span>
                        
                        <button 
                            onClick={() => setIsEditingModel(true)}
                            style={{
                                marginTop: '10px', width: '100%', background: 'transparent',
                                border: '1px dashed #555', color: '#aaa', borderRadius: '4px',
                                padding: '5px', cursor: 'pointer', fontSize: '0.8rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.color = '#3b82f6'; }}
                            onMouseOut={(e) => { e.target.style.borderColor = '#555'; e.target.style.color = '#aaa'; }}
                        >
                            ✏️ Editar Manualmente
                        </button>
                    </>
                ) : (
                    <div 
                        onMouseDown={(e) => e.stopPropagation()} /* Trava de segurança para não ativar os cliques de teste */
                        style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px'}}
                    >
                        <input 
                            type="text" 
                            value={deviceInfo.vendor} 
                            onChange={(e) => setDeviceInfo({...deviceInfo, vendor: e.target.value})} 
                            placeholder="Marca (ex: Logitech)"
                            style={{padding: '6px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#0f172a', color: 'white', fontSize: '0.85rem'}}
                            autoFocus
                        />
                        <input 
                            type="text" 
                            value={deviceInfo.model} 
                            onChange={(e) => setDeviceInfo({...deviceInfo, model: e.target.value})} 
                            placeholder="Modelo (ex: G Pro)"
                            style={{padding: '6px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#0f172a', color: 'white', fontSize: '0.85rem'}}
                        />
                        <button 
                            onClick={() => setIsEditingModel(false)}
                            style={{background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', fontWeight: 'bold'}}
                        >
                            Confirmar
                        </button>
                    </div>
                )}
            </div>

            <div className="info-card">
                <label>SCROLL DELTA</label>
                <h3 className={tests.scrollOk ? 'text-green' : ''}>{currentDelta}</h3>
            </div>
            <div className="info-card">
                <label>POLLING RATE</label>
                <h3 className={tests.pollingRateOk ? 'text-green' : ''}>{stats.pollingRate} <small>Hz</small></h3>
            </div>
        </div>

        {/* CENTRO: VISUALIZADOR */}
        <div className="mouse-visualizer-container">
            <div className={`mouse-body ${isAllTested ? 'all-success' : (tests.pollingRateOk ? 'sensor-ok' : '')}`}>
                <div className={`mouse-btn left ${tests.leftClick ? 'active' : ''}`}></div>
                <div className={`mouse-btn right ${tests.rightClick ? 'active' : ''}`}></div>
                <div className={`mouse-scroll ${tests.scrollOk ? 'active' : ''}`}>
                    <div className={`scroll-click ${tests.middleClick ? 'active' : ''}`}></div>
                </div>
            </div>
            {isAllTested && !hasDefects && <div className="success-msg">TESTES CONCLUÍDOS</div>}
        </div>

        {/* LADO DIREITO */}
        <div className="mouse-actions-panel">
             <div className="info-card status-card">
                 <label>STATUS GERAL</label>
                 <h3 style={{color: isAllTested ? 'var(--accent-green)' : 'inherit'}}>
                    {isAllTested ? 'APROVADO' : 'PENDENTE'}
                 </h3>
             </div>
             <button className="btn-reset" onClick={resetTests}>
                Resetar Testes
            </button>
        </div>
      </main>

      {/* RODAPÉ COM FORMULÁRIO */}
      <section className="report-panel">
        {!showReportForm ? (
          <div className="report-actions">
            <div className="status-info">
              <div className={`badge ${isAllTested ? 'approved' : 'testing'}`}>{isAllTested ? 'APROVADO' : 'EM TESTE'}</div>
              <span>Status: <strong>{hasDefects ? 'FALHA DETECTADA' : (isAllTested ? 'PRONTO PARA LAUDO' : 'Aguardando testes...')}</strong></span>
            </div>
            <div className="btn-group">
              <button 
                className={`btn-approve ${isAllTested ? 'active' : ''}`} 
                disabled={!isAllTested} 
                onClick={() => setShowReportForm('approve')}
              >
                APROVAR MOUSE
              </button>
              <button 
                className="btn-reject" 
                onClick={() => setShowReportForm('reject')}
              >
                REPROVAR / LAUDO
              </button>
            </div>
          </div>
        ) : (
          <div className="report-form-active">
            <div className="form-header">
              <h3>Dados do Laudo</h3>
              <p className="instruction">Teste pausado para preenchimento.</p>
            </div>

            <div className="input-group-row">
               <input type="text" placeholder="Serial / Patrimônio" value={deviceInfo.serial} onChange={(e) => setDeviceInfo({...deviceInfo, serial: e.target.value})}/>
               <input type="text" placeholder="Nome do Técnico" value={tecnicoNome} onChange={(e) => setTecnicoNome(e.target.value)}/>
               <input type="text" placeholder="Matrícula" value={tecnicoMatricula} onChange={(e) => setTecnicoMatricula(e.target.value)} style={{maxWidth:'120px'}}/>
            </div>

            {showReportForm === 'reject' && (
              <div className="global-defects-wrapper animate-fade-in" style={{marginBottom: '15px'}}>
                <p className="section-label">Defeitos Identificados:</p>
                <div className="defects-grid">
                  <button className={`defect-toggle ${defects.doubleClick ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, doubleClick: !p.doubleClick}))}>🖱️ Duplo Clique</button>
                  <button className={`defect-toggle ${defects.sensorFailure ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, sensorFailure: !p.sensorFailure}))}>🕸️ Sensor Falho</button>
                  <button className={`defect-toggle ${defects.scrollEncoder ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, scrollEncoder: !p.scrollEncoder}))}>📜 Scroll Ruim</button>
                  <button className={`defect-toggle ${defects.cableDamage ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, cableDamage: !p.cableDamage}))}>🔌 Cabo Danif.</button>
                </div>
              </div>
            )}

            <textarea 
              value={reportText} 
              onChange={(e) => setReportText(e.target.value)} 
              placeholder={showReportForm === 'approve' ? "Observações opcionais..." : "Descreva o defeito..."}
            />
            
            <div className="form-btns">
                {showReportForm === 'approve' && (
                  <button 
                    className="btn-approve active" 
                    disabled={!isAllTested}
                    onClick={() => handleFinalize('approved')}
                  >
                    GERAR LAUDO APROVADO
                  </button>
                )}
                {showReportForm === 'reject' && (
                  <button 
                    className="btn-reject" 
                    disabled={!canReject}
                    onClick={() => handleFinalize('rejected')}
                  >
                    FINALIZAR REPROVAÇÃO
                  </button>
                )}
                <button className="btn-util" onClick={() => setShowReportForm(false)}>CANCELAR</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}