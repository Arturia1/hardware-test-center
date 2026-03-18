import React, { useState } from 'react';
import KeyboardTester from './KeyboardTester';
import MouseTester from './MouseTester';
import WebcamTester from './WebcamTester';
import MonitorTester from './MonitorTester';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <>
      {/* --- TELA INICIAL (DASHBOARD) --- */}
      {activeTab === 'home' ? (
        <div className="dashboard-container">
          <header>
            <h1>HARDWARE_TEST_CENTER v1.0</h1>
            <p>Selecione o periférico para diagnóstico</p>
          </header>

          <div className="grid-menu">
            <button className="card" onClick={() => setActiveTab('keyboard')}>
              <span className="icon">⌨️</span>
              <h3>Teclado</h3>
              <p>Layouts Dell, HP, Lenovo e Positivo</p>
            </button>

            <button className="card" onClick={() => setActiveTab('mouse')}>
              <span className="icon">🖱️</span>
              <h3>Mouse</h3>
              <p>DPI, Cliques e Polling Rate</p>
            </button>

            <button className="card" onClick={() => setActiveTab('webcam')}>
              <span className="icon">📷</span>
              <h3>Webcam</h3>
              <p>Resolução e Taxa de Quadros</p>
            </button>

            <button className="card" onClick={() => setActiveTab('monitor')}>
              <span className="icon">🖥️</span>
              <h3>Monitor</h3>
              <p>Cores sólidas e Dead Pixels</p>
            </button>
          </div>

          {/* ASSINATURA AGORA DENTRO DO HOME - SÓ APARECE AQUI */}
          <footer className="dev-signature">
            <div className="dev-signature-content">
              <p className="dev-name">
                Dev by <span>Arturia Queiroz</span>
              </p>
              <div className="dev-links">
                <a href="https://github.com/Arturia1" target="_blank" rel="noopener noreferrer">GITHUB</a>
                <span className="dot">●</span>
                <a href="https://linkedin.com/in/arturiaqueiroz/" target="_blank" rel="noopener noreferrer">LINKEDIN</a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* --- TELA DOS MÓDULOS (A ASSINATURA NÃO ENTRA AQUI) --- */
        <div className="module-wrapper">
          <button className="back-btn" onClick={() => setActiveTab('home')}>← Voltar ao Menu</button>
          
          {/* MÓDULO TECLADO */}
          {activeTab === 'keyboard' && <KeyboardTester onBack={() => setActiveTab('home')} />}
          
          {/* MÓDULO MOUSE */}
          {activeTab === 'mouse' && <MouseTester onBack={() => setActiveTab('home')} />}
          
          {/* MÓDULO WEBCAM */}
          {activeTab === 'webcam' && <WebcamTester onBack={() => setActiveTab('home')} />}
          
          {/* MÓDULO MONITOR */}
          {activeTab === 'monitor' && <MonitorTester onBack={() => setActiveTab('home')} />} 
        </div>
      )}
    </>
  );
}