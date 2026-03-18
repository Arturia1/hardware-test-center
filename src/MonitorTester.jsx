import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MonitorTester({ onBack }) {
  // --- Estados do Fluxo (Wizard) ---
  const [isWizardActive, setIsWizardActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // --- Estados de Hardware ---
  const [screenInfo, setScreenInfo] = useState({ width: 0, height: 0, pixelDepth: 0 });
  const [fps, setFps] = useState(0);

  // --- Estados de Resultados ---
  const [testResults, setTestResults] = useState([]); 
  const [failedTests, setFailedTests] = useState([]); 

  // --- Estados de Laudo ---
  const [showReportForm, setShowReportForm] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  
  // Dados Form
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [serial, setSerial] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [reportText, setReportText] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState([]);

  const reportRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef(null);

  // --- DEFINIÇÃO DAS ETAPAS DE TESTE ---
  const testSteps = [
    { id: 'black', label: 'Teste de Preto (Dead Pixel)', type: 'color', value: '#000000', text: 'Procure por pixels travados (brancos/coloridos) em fundo preto.' },
    { id: 'white', label: 'Teste de Branco (Luminosidade)', type: 'color', value: '#FFFFFF', text: 'Verifique manchas escuras ou sujeira na tela.' },
    { id: 'red', label: 'Subpixel Vermelho', type: 'color', value: '#FF0000', text: 'Verifique se todos os pixels vermelhos acendem.' },
    { id: 'green', label: 'Subpixel Verde', type: 'color', value: '#00FF00', text: 'Verifique se todos os pixels verdes acendem.' },
    { id: 'blue', label: 'Subpixel Azul', type: 'color', value: '#0000FF', text: 'Verifique se todos os pixels azuis acendem.' },
    { id: 'gradient', label: 'Gradiente & Banding', type: 'component', component: 'gradient', text: 'Verifique se as transições de cor são suaves.' },
    { id: 'text', label: 'Nitidez e Texto', type: 'component', component: 'text', text: 'O texto deve estar nítido e legível em todos os tamanhos.' },
    { id: 'ghosting', label: 'Ghosting / Hz', type: 'component', component: 'ghosting', text: 'Observe se há rastro escuro/claro atrás do robô em movimento.' },
  ];

  // --- 1. DETECÇÃO DE RESOLUÇÃO E FPS ---
  useEffect(() => {
    setScreenInfo({
        width: window.screen.width,
        height: window.screen.height,
        pixelDepth: window.screen.colorDepth
    });

    const loop = () => {
        const now = performance.now();
        frameCountRef.current++;
        if (now - lastTimeRef.current >= 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastTimeRef.current = now;
        }
        rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  // --- CONTROLES DO WIZARD ---
  const startWizard = () => {
      setIsWizardActive(true);
      setCurrentStepIndex(0);
      setTestResults([]);
      setFailedTests([]);
      setEvidencePhotos([]); 
      
      if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen automático bloqueado.", e));
      }
  };

  const handleImmediateFail = () => {
      setFailedTests(['DANOS FÍSICOS / ESTRUTURAIS', 'SEM SINAL DE VÍDEO / NÃO LIGA']);
      setReportText('Equipamento reprovado imediatamente devido a condições físicas precárias, tela quebrada ou ausência total de sinal, impossibilitando testes de software.');
      setShowReportForm('reject');
  };

  const handleStepResult = (passed) => {
      const currentTest = testSteps[currentStepIndex];
      const newResult = { 
          testId: currentTest.id, 
          label: currentTest.label, 
          passed: passed 
      };
      setTestResults(prev => [...prev, newResult]);
      if (!passed) setFailedTests(prev => [...prev, currentTest.label]);

      if (currentStepIndex < testSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
      } else {
          finishWizard(passed);
      }
  };

  const finishWizard = (lastPassed) => {
      if (document.fullscreenElement) {
          document.exitFullscreen().catch(e => console.log(e));
      }
      setIsWizardActive(false);
      
      const hasFailures = failedTests.length > 0 || !lastPassed;
      if (hasFailures) {
          const finalFailed = [...failedTests];
          if (!lastPassed && !finalFailed.includes(testSteps[testSteps.length-1].label)) {
              finalFailed.push(testSteps[testSteps.length-1].label);
          }
          setReportText(`Monitor apresentou falhas nos testes: ${finalFailed.join(', ')}.`);
          setShowReportForm('reject');
      } else {
          setShowReportForm('approve');
      }
  };

  const handlePhotoUpload = (e) => {
      if (e.target.files) {
          const files = Array.from(e.target.files);
          files.forEach(file => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setEvidencePhotos(prev => [...prev, reader.result]);
              };
              reader.readAsDataURL(file);
          });
      }
  };

  // --- EXPORTAÇÃO ---
  const handleFinalize = (status) => { setResultStatus(status); setIsFinalized(true); setShowReportForm(false); };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#0f172a', useCORS: true, scrollX: 0, scrollY: -window.scrollY });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.download = `LAUDO_MONITOR_${serial || 'GENERICO'}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (e) { alert("Erro exportação imagem."); }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#0f172a', useCORS: true, scrollX: 0, scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (pdf.getImageProperties(imgData).height * pdfWidth) / pdf.getImageProperties(imgData).width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LAUDO_MONITOR_${serial || 'GENERICO'}.pdf`);
    } catch (e) { alert("Erro exportação PDF."); }
  };

  // ==========================================
  // RENDERIZAÇÃO 1: LAUDO FINAL
  // ==========================================
  if (isFinalized) {
    return (
      <div className="summary-screen dark approved">
        <div className="report-container-official" ref={reportRef}>
          <div className="report-header-official">
            <div className="report-brand">
              <h1>LAUDO TÉCNICO DE PERIFÉRICOS</h1>
              <span>MONITOR DISPLAY TEST SUITE v2.0 | CATI</span>
            </div>
            <div className="report-meta">
              <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>S/N:</strong> {serial || 'N/A'}</p>
            </div>
          </div>
          <div className="report-body">
            <section className="report-info-grid">
              <div className="info-item">
                <p><strong>Produto:</strong> {marca} {modelo}</p>
                <p><strong>Técnico:</strong> {tecnicoNome}</p>
                <p><strong>Resolução:</strong> {screenInfo.width}x{screenInfo.height}</p>
                <p><strong>Taxa Atual:</strong> {fps} Hz</p>
              </div>
              <div className={`status-stamp-large ${resultStatus}`}>{resultStatus === 'approved' ? 'APROVADO' : 'REPROVADO'}</div>
            </section>
            
            <div className="report-details-box">
              <h3>PARECER TÉCNICO</h3>
              <div className="observation-text">
                {resultStatus === 'approved' ? (
                  <p>O monitor foi submetido a bateria completa de testes sequenciais. O painel apresenta brilho uniforme, geometria correta e reprodução de cores fiel. Não foram detectados pixels mortos ou retenção de imagem. <strong>Equipamento apto para uso.</strong></p>
                ) : (
                  <>
                    <p style={{color: '#ef4444', fontWeight: 'bold', marginBottom: '5px'}}>REPROVADO NOS SEGUINTES TESTES:</p>
                    <ul style={{marginBottom: '15px', color: '#ef4444', paddingLeft: '20px'}}>
                      {failedTests.map((fail, idx) => (
                          <li key={idx}>❌ {fail}</li>
                      ))}
                    </ul>
                    <p><strong>Observações Técnicas:</strong> {reportText}</p>
                  </>
                )}
              </div>
              
              {resultStatus === 'approved' && (
                <div className="approved-tests-strip">
                    <h4>CHECKLIST DE BATERIA EXECUTADA:</h4>
                    <div className="tests-grid-icons" style={{flexWrap: 'wrap', gap: '10px'}}>
                        {testResults.map((res, idx) => (
                            <div key={idx} className="test-icon" style={{opacity: res.passed ? 1 : 0.5}}>
                                <div className={`icon-preview`} style={{
                                    background: res.passed ? '#334155' : '#450a0a', 
                                    border: res.passed ? '2px solid #09EB44' : '2px solid #ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                }}>
                                    {res.passed ? '✓' : 'X'}
                                </div>
                                <span style={{fontSize: '0.6rem', color: res.passed ? '#94a3b8' : '#ef4444'}}>{res.label.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {resultStatus === 'rejected' && evidencePhotos.length > 0 && (
                  <div className="evidence-section" style={{marginTop: '20px', borderTop: '1px dashed #555', paddingTop: '10px'}}>
                      <h4 style={{color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px'}}>Evidências Fotográficas do Defeito:</h4>
                      <div className="evidence-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'}}>
                          {evidencePhotos.map((photo, index) => (
                              <div key={index} className="evidence-item" style={{border: '1px solid #ef4444', padding: '5px', borderRadius: '4px', background: '#000'}}>
                                  <img src={photo} alt={`Defeito ${index + 1}`} style={{width: '100%', height: '100px', objectFit: 'contain'}} />
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="report-signature" style={{marginTop: '40px'}}><p>___________________</p><p><strong>{tecnicoNome}</strong></p></div>
            </div>
          </div>
        </div>
        <div className="summary-footer-btns">
            <button className="btn-download" onClick={exportAsImage}>📸 PNG</button>
            <button className="btn-download pdf-btn" onClick={exportAsPDF} style={{backgroundColor: '#dc2626'}}>📄 PDF</button>
            <button className="btn-restart" onClick={() => window.location.reload()}>🔄 NOVO</button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO 2: WIZARD DE TESTES (TELA CHEIA)
  // ==========================================
  if (isWizardActive) {
      const step = testSteps[currentStepIndex];
      let TestContent = null;
      
      // GARANTIA: Todos os estilos visuais de tela cheia são inline e não dependem do CSS externo para funcionar.
      const fullScreenStyle = { width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' };

      if (step.type === 'color') {
          TestContent = (
              <div style={{ ...fullScreenStyle, backgroundColor: step.value }}></div>
          );
      } else if (step.component === 'gradient') {
          TestContent = (
              <div style={fullScreenStyle}>
                  <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #ffffff)' }}></div>
                  <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #ff0000)' }}></div>
                  <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #00ff00)' }}></div>
                  <div style={{ flex: 1, background: 'linear-gradient(to right, #000000, #0000ff)' }}></div>
                  <div style={{ flex: 1, background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)' }}></div>
              </div>
          );
      } else if (step.component === 'text') {
          TestContent = (
              <div style={{ ...fullScreenStyle, backgroundColor: '#ffffff', color: '#000000', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                      <h1 style={{fontSize: '3rem', marginBottom: '20px'}}>Teste de Foco e Geometria</h1>
                      <p style={{fontSize: '10px', margin: '5px 0'}}>10px: The quick brown fox jumps over the lazy dog. 1234567890</p>
                      <p style={{fontSize: '12px', margin: '5px 0'}}>12px: The quick brown fox jumps over the lazy dog. 1234567890</p>
                      <p style={{fontSize: '16px', margin: '5px 0'}}>16px: The quick brown fox jumps over the lazy dog. 1234567890</p>
                      <p style={{fontSize: '24px', margin: '5px 0'}}>24px: The quick brown fox jumps over the lazy dog. 1234567890</p>
                      <div style={{
                          marginTop: '40px', width: '80vw', height: '200px', 
                          background: 'repeating-linear-gradient(45deg, #000, #000 2px, #fff 2px, #fff 10px)'
                      }}></div>
                  </div>
              </div>
          );
      } else if (step.component === 'ghosting') {
          // Novo teste de Ghosting com o Robô e animação contínua inline via <style>
          TestContent = (
              <div style={{ ...fullScreenStyle, backgroundColor: '#1e293b', overflow: 'hidden' }}>
                  <style>{`
                      @keyframes robotPan {
                          0% { transform: translateX(-15vw); }
                          100% { transform: translateX(115vw); }
                      }
                      .robot-track {
                          flex: 1; border-bottom: 1px solid #334155; display: flex; align-items: center; position: relative;
                      }
                      .robot-icon {
                          position: absolute; font-size: 5rem; white-space: nowrap; animation: robotPan 2.5s linear infinite;
                      }
                      /* Simulação de baixa taxa de atualização para comparação */
                      .robot-icon.fps-sim-60 { animation-timing-function: steps(150); }
                      .robot-icon.fps-sim-30 { animation-timing-function: steps(75); filter: drop-shadow(-15px 0 10px rgba(0,0,0,0.5)); }
                  `}</style>
                  <div className="robot-track">
                      <div className="robot-icon">🤖 <span style={{fontSize:'1.5rem', color:'white', marginLeft:'10px'}}>Nativo (Suave)</span></div>
                  </div>
                  <div className="robot-track">
                      <div className="robot-icon fps-sim-60">🤖 <span style={{fontSize:'1.5rem', color:'white', marginLeft:'10px'}}>60Hz (Stepped)</span></div>
                  </div>
                  <div className="robot-track">
                      <div className="robot-icon fps-sim-30">🤖 <span style={{fontSize:'1.5rem', color:'white', marginLeft:'10px'}}>30Hz (Rastro)</span></div>
                  </div>
              </div>
          );
      }

      return (
          // O Wrapper Principal agora não tem background (é transparente) 
          // e separa o Conteúdo do Teste da Barra de Controles através de zIndex.
          <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999}}>
              
              {/* Camada 1: O Teste Visual (Fica atrás) */}
              <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1}}>
                  {TestContent}
              </div>
              
              {/* Camada 2: Controles do Wizard (Fica na frente flutuando) */}
              <div style={{
                  position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
                  background: 'rgba(15, 23, 42, 0.95)', padding: '20px 40px', borderRadius: '12px', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.7)', border: '1px solid #475569'
              }}>
                  <div style={{textAlign: 'center', color: 'white'}}>
                      <h3 style={{fontSize: '0.8rem', color: '#94a3b8', margin: 0, letterSpacing: '2px'}}>ETAPA {currentStepIndex + 1} / {testSteps.length}</h3>
                      <h2 style={{margin: '5px 0', fontSize: '1.5rem'}}>{step.label}</h2>
                      <p style={{margin: 0, fontSize: '0.9rem', color: '#cbd5e1'}}>{step.text}</p>
                  </div>
                  <div style={{display: 'flex', gap: '15px'}}>
                      <button 
                          onClick={() => handleStepResult(false)}
                          style={{background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'transform 0.1s'}}
                          onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                          onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
                      >
                          👎 FALHA / ERRO
                      </button>
                      <button 
                          onClick={() => handleStepResult(true)}
                          style={{background: '#22c55e', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', transition: 'transform 0.1s'}}
                          onMouseOver={(e) => e.target.style.filter = 'brightness(1.1)'}
                          onMouseOut={(e) => e.target.style.filter = 'brightness(1)'}
                      >
                          👍 CONFIRMAR (OK)
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // ==========================================
  // RENDERIZAÇÃO 3: DASHBOARD INICIAL
  // ==========================================
  return (
    <div className="tester-wrapper dark">
      <header className="tester-header">
        <div className="brand"><button onClick={onBack} className="btn-back">⬅ Voltar</button><h2>DIAGNÓSTICO DE MONITOR</h2></div>
        <div className="control-center"><div className="monitor-stats"><span>{screenInfo.width} x {screenInfo.height}</span><span className="hz-tag">{fps} Hz</span></div></div>
      </header>
      
      {!showReportForm && (
          <main className="webcam-viewport" style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
            <div className="monitor-start-card" style={{background: '#1e293b', padding: '40px', borderRadius: '12px', textAlign: 'center', border: '1px solid #334155'}}>
                <div className="icon-display" style={{fontSize: '4rem', marginBottom: '20px'}}>🖥️</div>
                <h1 style={{color: 'white', margin: '0 0 10px 0'}}>INICIAR BATERIA DE TESTES</h1>
                <p style={{color: '#cbd5e1', margin: '0 0 5px 0'}}>O sistema guiará você por {testSteps.length} etapas de verificação visual.</p>
                <p className="sub-text" style={{color: '#94a3b8', fontSize: '0.8rem', marginBottom: '30px'}}>Ao final, será gerado o laudo com base nas suas confirmações.</p>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', alignItems: 'center'}}>
                    <button 
                        className="btn-big-start" 
                        onClick={startWizard}
                        style={{background: '#3b82f6', color: 'white', padding: '15px 30px', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%'}}
                    >
                        ▶ COMEÇAR TESTE AGORA
                    </button>
                    
                    <button 
                        className="btn-immediate-fail" 
                        onClick={handleImmediateFail}
                        style={{background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', padding: '12px 20px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', width: '100%', transition: 'all 0.2s'}}
                        onMouseOver={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#ef4444'; }}
                    >
                        🚨 REPROVAÇÃO IMEDIATA (DANO FÍSICO / SEM VÍDEO)
                    </button>
                </div>
            </div>
          </main>
      )}

      {showReportForm && (
        <section className="report-form-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100}}>
            <div className="report-form-modal" style={{background: '#1e293b', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <div className="form-header" style={{borderBottom: '1px solid #334155', paddingBottom: '15px'}}>
                    <h3 style={{color: showReportForm === 'approve' ? '#22c55e' : '#ef4444', margin: '0 0 5px 0'}}>
                        {showReportForm === 'approve' ? '✅ MONITOR APROVADO' : '❌ MONITOR REPROVADO'}
                    </h3>
                    <p style={{color: '#94a3b8', margin: 0, fontSize: '0.9rem'}}>Preencha os dados finais para gerar o laudo.</p>
                </div>
                
                <div className="input-group-row" style={{display: 'flex', gap: '10px'}}>
                    <input type="text" placeholder="Marca (ex: Dell)" value={marca} onChange={(e) => setMarca(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white'}}/>
                    <input type="text" placeholder="Modelo (ex: P2419H)" value={modelo} onChange={(e) => setModelo(e.target.value)} style={{flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white'}}/>
                </div>
                
                <div className="input-group-row">
                    <input type="text" placeholder="Serial / Patrimônio" value={serial} onChange={(e) => setSerial(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white'}}/>
                </div>
                
                <div className="input-group-row">
                    <input type="text" placeholder="Nome do Técnico" value={tecnicoNome} onChange={(e) => setTecnicoNome(e.target.value)} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white'}}/>
                </div>
                
                <textarea 
                    value={reportText} 
                    onChange={(e) => setReportText(e.target.value)} 
                    placeholder={showReportForm === 'approve' ? "Observações adicionais (opcional)..." : "Detalhe a falha encontrada..."} 
                    style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white', minHeight: '80px', resize: 'vertical'}}
                />
                
                {showReportForm === 'reject' && (
                    <div className="photo-upload-container" style={{background: '#0f172a', padding: '15px', borderRadius: '6px', border: '1px dashed #475569'}}>
                        <label style={{display:'block', marginBottom:'10px', fontSize:'0.85rem', color:'#cbd5e1', fontWeight: 'bold'}}>📸 Anexar fotos do defeito:</label>
                        <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{color: '#94a3b8', fontSize: '0.8rem'}} />
                        
                        {evidencePhotos.length > 0 && (
                            <div style={{display:'flex', gap:'8px', marginTop:'10px', flexWrap: 'wrap'}}>
                                {evidencePhotos.map((src, i) => (
                                    <img key={i} src={src} style={{width:'50px', height:'50px', objectFit:'cover', borderRadius:'4px', border:'2px solid #ef4444'}} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="form-btns" style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                    <button 
                        onClick={() => handleFinalize(showReportForm === 'approve' ? 'approved' : 'rejected')}
                        style={{flex: 2, background: showReportForm === 'approve' ? '#22c55e' : '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}
                    >
                        GERAR LAUDO FINAL
                    </button>
                    <button 
                        onClick={() => setShowReportForm(false)}
                        style={{flex: 1, background: '#334155', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer'}}
                    >
                        CANCELAR
                    </button>
                </div>
            </div>
        </section>
      )}
    </div>
  );
}