import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

export default function WebcamTester({ onBack }) {
  // --- Estados de Hardware e IA ---
  const [stream, setStream] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({ label: 'Nenhuma câmera selecionada', id: '' });
  const [faceModel, setFaceModel] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(true);
  
  // --- Sensores em Tempo Real ---
  const [realResolution, setRealResolution] = useState({ width: 0, height: 0 });
  const [realFps, setRealFps] = useState(0);
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [snapshot, setSnapshot] = useState(null);

  // --- Estados de Defeitos ---
  const [defects, setDefects] = useState({
    noImage: false,
    artifacts: false,
    focusFail: false,
    micFail: false
  });

  // --- Controle de Laudo ---
  const [showReportForm, setShowReportForm] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);

  // Dados do Formulário
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [tecnicoMatricula, setTecnicoMatricula] = useState('');
  const [serial, setSerial] = useState('');
  const [reportText, setReportText] = useState('');

  // Refs
  const videoRef = useRef(null);
  const canvasOverlayRef = useRef(null);
  const reportRef = useRef(null);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef(null);
  const isDetectingRef = useRef(false);

  // --- LÓGICA DE APROVAÇÃO ---
  const isReadyToApprove = stream && snapshot && !Object.values(defects).some(d => d);
  const canReject = (reportText.trim().length >= 5) || Object.values(defects).some(d => d);

  // --- CARREGAR MODELO DE IA (BLAZEFACE) ---
  useEffect(() => {
    const loadAI = async () => {
      try {
        await tf.ready(); // Garante que o WebGL está pronto
        const model = await blazeface.load();
        setFaceModel(model);
        setIsAiLoading(false);
      } catch (error) {
        console.error("Erro ao carregar TensorFlow:", error);
        setIsAiLoading(false);
      }
    };
    loadAI();
  }, []);

  // --- CONEXÃO DO VÍDEO ---
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // --- SENSOR DE FPS E DETECÇÃO DE ROSTO (TENSORFLOW) ---
  useEffect(() => {
    if (!stream || !videoRef.current || !canvasOverlayRef.current) return;

    const detectLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasOverlayRef.current;
      
      if (video && video.readyState >= 2) { 
        
        // Atualiza Resolução Real
        if (video.videoWidth > 0 && video.videoHeight > 0) {
             if (video.videoWidth !== realResolution.width || video.videoHeight !== realResolution.height) {
                 setRealResolution({ width: video.videoWidth, height: video.videoHeight });
                 canvas.width = video.videoWidth;
                 canvas.height = video.videoHeight;
             }
        }

        // Contador de FPS
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastTimeRef.current >= 1000) {
          setRealFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastTimeRef.current = now;
        }

        // HUD e Detecção com BlazeFace
        const ctx = canvas.getContext('2d');
        
        if (faceModel && canvas.width > 0 && !isDetectingRef.current) {
          isDetectingRef.current = true; 
          
          try {
            // TensorFlow estima os rostos na imagem
            const predictions = await faceModel.estimateFaces(video, false);
            setDetectedFaces(predictions.length);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            predictions.forEach((pred, index) => {
              // O BlazeFace retorna [x, y] do topo esquerdo e da base direita
              const start = pred.topLeft;
              const end = pred.bottomRight;
              const size = [end[0] - start[0], end[1] - start[1]];
              
              const left = start[0];
              const top = start[1];
              const width = size[0];
              const height = size[1];
              
              ctx.strokeStyle = '#00ffea';
              ctx.lineWidth = 3;
              ctx.shadowColor = '#00ffea';
              ctx.shadowBlur = 10;

              const len = width * 0.15;

              ctx.beginPath();
              ctx.moveTo(left, top + len); ctx.lineTo(left, top); ctx.lineTo(left + len, top);
              ctx.moveTo(left + width - len, top); ctx.lineTo(left + width, top); ctx.lineTo(left + width, top + len);
              ctx.moveTo(left + width, top + height - len); ctx.lineTo(left + width, top + height); ctx.lineTo(left + width - len, top + height);
              ctx.moveTo(left + len, top + height); ctx.lineTo(left, top + height); ctx.lineTo(left, top + height - len);
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(left + width/2, top + height/2, 4, 0, 2*Math.PI);
              ctx.fillStyle = '#ef4444';
              ctx.shadowColor = '#ef4444';
              ctx.fill();

              ctx.fillStyle = 'rgba(0, 255, 234, 0.15)';
              ctx.shadowBlur = 0;
              ctx.fillRect(left, top - 25, 110, 20);
              ctx.fillStyle = '#00ffea';
              ctx.font = 'bold 12px monospace';
              ctx.fillText(`ALVO [${index + 1}]`, left + 5, top - 10);
            });

          } catch (e) {
             // Ignora erros de frame solto
          } finally {
            isDetectingRef.current = false; 
          }
        } else if (!faceModel && !isAiLoading) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      rafIdRef.current = requestAnimationFrame(detectLoop);
    };

    rafIdRef.current = requestAnimationFrame(detectLoop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (canvasOverlayRef.current) {
          const ctx = canvasOverlayRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasOverlayRef.current.width, canvasOverlayRef.current.height);
      }
    };
  }, [stream, realResolution.width, realResolution.height, faceModel, isAiLoading]);

  // --- Funções da Webcam ---
  const startCamera = async () => {
    try {
      stopCamera(); 

      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } }, 
        audio: false 
      });

      setStream(newStream);
      
      const videoTrack = newStream.getVideoTracks()[0];
      setDeviceInfo({
        label: videoTrack.label || 'Webcam Genérica',
        id: videoTrack.id
      });

    } catch (err) {
      alert("Erro ao acessar câmera: " + err.message + "\nVerifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setRealFps(0);
      setDetectedFaces(0);
      setRealResolution({width: 0, height: 0});
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !stream || realResolution.width === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = realResolution.width;
    canvas.height = realResolution.height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setSnapshot(canvas.toDataURL('image/jpeg', 0.95));
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // --- Funções de Laudo ---
  const handleFinalize = (status) => {
    setResultStatus(status);
    setIsFinalized(true);
    setShowReportForm(false);
    stopCamera();
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, backgroundColor: '#0f172a', useCORS: true, logging: false, scrollX: 0, scrollY: 0,
        windowWidth: document.documentElement.offsetWidth, windowHeight: document.documentElement.offsetHeight
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `LAUDO_${serial || 'EQUIPAMENTO'}_${new Date().getTime()}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (error) { alert("Erro ao gerar o laudo."); }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#0f172a', useCORS: true, scrollX: 0, scrollY: 0 });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (pdf.getImageProperties(imgData).height * pdfWidth) / pdf.getImageProperties(imgData).width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LAUDO_${serial || 'EQUIPAMENTO'}_${new Date().getTime()}.pdf`);
    } catch (error) { alert("Erro ao gerar PDF."); }
  };

  // --- RENDERIZAÇÃO: LAUDO ---
  if (isFinalized) {
    return (
      <div className="summary-screen dark approved">
        <div className="report-container-official" ref={reportRef}>
          <div className="report-header-official">
            <div className="report-brand">
              <h1>LAUDO TÉCNICO DE PERIFÉRICOS</h1>
              <span>WEBCAM HARDWARE TEST SUITE v2.0 | CATI</span>
            </div>
            <div className="report-meta">
              <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>S/N:</strong> {serial || 'N/A'}</p>
            </div>
          </div>

          <div className="report-body">
            <section className="report-info-grid">
              <div className="info-item">
                <p><strong>Equipamento:</strong> {deviceInfo.label}</p>
                <p><strong>Técnico:</strong> {tecnicoNome || '__________________'}</p>
                <p><strong>Matrícula:</strong> {tecnicoMatricula || '__________________'}</p>
              </div>
              <div className={`status-stamp-large ${resultStatus}`}>{resultStatus === 'approved' ? 'APROVADO' : 'REPROVADO'}</div>
            </section>

            <div style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', marginBottom: '15px', backgroundColor: '#f9fafb', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#6b7280' }}>Evidência de Captura</h3>
                {snapshot ? (
                    <img src={snapshot} alt="Teste Webcam" style={{maxWidth: '100%', maxHeight: '350px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ccc', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}} />
                ) : <div style={{padding: '50px', color: '#000'}}>Nenhuma imagem</div>}
                 <div style={{marginTop: '10px', fontSize: '0.8rem', color: '#374151'}}>
                   Resolução Nativa: <strong>{realResolution.width}x{realResolution.height}</strong> | Desempenho durante teste: <strong>~{realFps} FPS</strong>
                </div>
            </div>

            <div className="report-details-box">
              <h3>PARECER TÉCNICO</h3>
              <div className="observation-text">
                {resultStatus === 'approved' ? (
                  <p>O dispositivo de vídeo foi testado em sua resolução nativa ({realResolution.width}x{realResolution.height}) apresentando desempenho estável e imagem nítida. Não foram detectados artefatos, problemas de foco ou falhas no sensor. <strong>Dispositivo apto para uso corporativo e videoconferências.</strong></p>
                ) : (
                  <>
                    <p style={{color: '#dc2626', fontWeight: 'bold', marginBottom: '5px'}}>FALHAS TÉCNICAS IDENTIFICADAS:</p>
                    <ul style={{marginBottom: '15px', color: '#dc2626', paddingLeft: '20px'}}>
                      {defects.noImage && <li>🚫 <strong>Sem Imagem:</strong> Câmera não gera sinal de vídeo (tela preta).</li>}
                      {defects.artifacts && <li>📺 <strong>Artefatos Visuais:</strong> Imagem com chuvisco, faixas ou cores distorcidas.</li>}
                      {defects.focusFail && <li>🔍 <strong>Falha de Foco:</strong> Lente incapaz de focar, imagem permanentemente embaçada.</li>}
                      {defects.micFail && <li>🎤 <strong>Microfone Integrado:</strong> Não capta áudio ou apresenta ruído excessivo.</li>}
                    </ul>
                    <p><strong>Observações Adicionais:</strong> {reportText || "Nenhuma."}</p>
                  </>
                )}
              </div>
              <div className="report-signature" style={{marginTop: '30px'}}>
                <p>___________________________________</p><p><strong>{tecnicoNome || 'Assinatura do Técnico'}</strong></p>
              </div>
            </div>
          </div>
        </div>
        <div className="summary-footer-btns">
            <button className="btn-download" onClick={exportAsImage}>📸 BAIXAR PNG</button>
            <button className="btn-download pdf-btn" onClick={exportAsPDF} style={{backgroundColor: '#dc2626'}}>📄 BAIXAR PDF</button>
            <button className="btn-restart" onClick={() => window.location.reload()}>🔄 NOVO TESTE</button>
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
          <h2>DIAGNÓSTICO DE WEBCAM</h2>
        </div>
        <div className="control-center">
            {!stream ? (
                <button onClick={startCamera} className="btn-usb">📸 Iniciar Câmera</button>
            ) : (
                <button onClick={stopCamera} className="btn-reset" style={{color: '#f87171', borderColor: '#f87171'}}>⏹ Parar</button>
            )}
        </div>
      </header>

      <main className="webcam-viewport">
        {/* ESQUERDA: SENSORES */}
        <div className="webcam-info-panel">
            <div className="info-card">
                <label>MODELO</label>
                <h3 style={{fontSize: '0.85rem', wordBreak: 'break-word', lineHeight: '1.2'}}>{deviceInfo.label}</h3>
            </div>
            <div className="info-card">
                <label>RESOLUÇÃO ATIVA</label>
                <h3 style={{color: realResolution.width > 0 ? '#60a5fa' : 'inherit', fontSize: '1.5rem'}}>{realResolution.width} x {realResolution.height}</h3>
                <span>{realResolution.width >= 1280 ? 'HD / Full HD' : (realResolution.width > 0 ? 'SD' : '---')}</span>
            </div>
            <div className="info-card">
                <label>TAXA DE QUADROS (FPS)</label>
                <h3 style={{color: realFps >= 24 ? '#4ade80' : (realFps > 0 ? '#fbbf24' : 'inherit'), fontSize: '1.8rem'}}>{realFps}</h3>
                <span>Tempo Real</span>
            </div>
            
            {/* CARD DE DETECÇÃO TENSORFLOW */}
            <div className="info-card">
                <label>DETECÇÃO FACIAL (AI)</label>
                <h3 style={{
                    color: isAiLoading ? '#fbbf24' : (detectedFaces > 0 ? '#00ffea' : 'inherit'), 
                    fontSize: isAiLoading ? '1.2rem' : '1.8rem',
                    marginTop: '5px'
                }}>
                    {isAiLoading ? 'CARREGANDO IA...' : detectedFaces}
                </h3>
                <span style={{fontSize: '0.7rem', opacity: 0.8}}>
                    {isAiLoading 
                        ? 'Baixando modelo TensorFlow' 
                        : (detectedFaces > 0 ? 'Alvos rastreados' : 'Aguardando...')}
                </span>
            </div>
        </div>

        {/* CENTRO: VÍDEO + OVERLAY */}
        <div className="webcam-visualizer-container">
            <div className="video-frame" style={{position: 'relative', width: '100%', height: '100%'}}>
                {stream ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted className="live-video" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain'}} />
                      <canvas ref={canvasOverlayRef} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none'}} />
                    </>
                ) : (
                    <div className="no-signal"><span>📷</span><p>Inicie a câmera para testar</p></div>
                )}
            </div>
            
            {stream && (
                <div className="snapshot-controls">
                    <button onClick={takeSnapshot} className="btn-snapshot">📷 CAPTURAR FOTO DE EVIDÊNCIA</button>
                    {snapshot && <span className="snapshot-feedback">✓ Imagem capturada!</span>}
                </div>
            )}
        </div>

        {/* DIREITA: PREVIEW */}
        <div className="webcam-actions-panel">
            {snapshot && (
                <div className="preview-mini animate-fade-in">
                    <label>PREVIEW DO LAUDO</label>
                    <img src={snapshot} alt="Preview" />
                </div>
            )}
            <div className="info-card status-card" style={{marginTop: 'auto'}}>
                 <label>PRONTIDÃO PARA LAUDO</label>
                 <h3 style={{color: isReadyToApprove ? 'var(--accent-green)' : '#9ca3af', fontSize: '1.4rem'}}>
                    {isReadyToApprove ? '✅ PRONTO' : 'PENDENTE'}
                 </h3>
                 <p style={{fontSize: '0.7rem', opacity: 0.7, marginTop: '5px'}}>Requer: Câmera ativa + Foto capturada + Sem defeitos marcados</p>
             </div>
        </div>
      </main>

      {/* RODAPÉ: FORMULÁRIO */}
      <section className="report-panel">
        {!showReportForm ? (
          <div className="report-actions">
            <div className="status-info">
               <div className={`badge ${isReadyToApprove ? 'approved' : 'testing'}`} style={{padding: '10px 20px', fontSize: '1rem'}}>
                  {snapshot ? 'FOTO OK' : 'AGUARDANDO FOTO'}
               </div>
            </div>
            <div className="btn-group">
              <button className={`btn-approve ${isReadyToApprove ? 'active' : ''}`} disabled={!isReadyToApprove} onClick={() => setShowReportForm('approve')}>APROVAR EQUIPAMENTO</button>
              <button className="btn-reject" onClick={() => setShowReportForm('reject')}>REPROVAR / LAUDO</button>
            </div>
          </div>
        ) : (
          <div className="report-form-active">
            <div className="form-header"><h3>Finalizar Diagnóstico de Vídeo</h3></div>
            <div className="input-group-row">
               <input type="text" placeholder="Nº Série / Patrimônio" value={serial} onChange={(e) => setSerial(e.target.value)}/>
               <input type="text" placeholder="Nome do Técnico" value={tecnicoNome} onChange={(e) => setTecnicoNome(e.target.value)}/>
               <input type="text" placeholder="Matrícula" value={tecnicoMatricula} onChange={(e) => setTecnicoMatricula(e.target.value)} style={{maxWidth:'120px'}}/>
            </div>
            {showReportForm === 'reject' && (
              <div className="global-defects-wrapper">
                <p className="section-label">Falhas Críticas de Vídeo/Áudio:</p>
                <div className="defects-grid">
                  <button className={`defect-toggle ${defects.noImage ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, noImage: !p.noImage}))}>🚫 Sem Imagem</button>
                  <button className={`defect-toggle ${defects.artifacts ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, artifacts: !p.artifacts}))}>📺 Artefatos/Riscos</button>
                  <button className={`defect-toggle ${defects.focusFail ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, focusFail: !p.focusFail}))}>🔍 Falha de Foco</button>
                  <button className={`defect-toggle ${defects.micFail ? 'active' : ''}`} onClick={() => setDefects(p=>({...p, micFail: !p.micFail}))}>🎤 Defeito Mic.</button>
                </div>
              </div>
            )}
            <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder={showReportForm === 'approve' ? "Observações técnicas opcionais..." : "Descreva detalhadamente a falha encontrada..."} />
            <div className="form-btns">
                <button className={showReportForm === 'approve' ? 'btn-approve active' : 'btn-reject'} disabled={showReportForm === 'reject' && !canReject} onClick={() => handleFinalize(showReportForm === 'approve' ? 'approved' : 'rejected')}>
                    {showReportForm === 'approve' ? 'GERAR LAUDO APROVADO' : 'FINALIZAR REPROVAÇÃO'}
                </button>
                <button className="btn-util" onClick={() => setShowReportForm(false)}>CANCELAR</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}