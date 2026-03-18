# 🚀 Hardware Test Center v1.0

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow" />
</div>
<br/>

Uma suíte de diagnóstico técnica robusta desenvolvida para otimizar o fluxo de manutenção e inspeção de periféricos. O **Hardware Test Center** transforma testes manuais em laudos técnicos documentados, utilizando visão computacional e automação de documentos.

---

## 🛠 Módulos Disponíveis

### ⌨️ Keyboard Diagnostic
* **Mapeamento ABNT2:** Layouts específicos para Dell, HP, Lenovo e Positivo.
* **Detecção de Ghosting:** Monitoramento de múltiplas teclas simultâneas.
* **Laudo Visual:** Representação gráfica das teclas com falha no documento final.

### 🖱 Mouse Diagnostic
* **Precisão de Sensores:** Testes de DPI, Cliques (Esquerdo, Direito, Middle) e Scroll.
* **Polling Rate:** Verificação de taxa de resposta em tempo real.

### 📷 Webcam AI Inspector
* **Visão Computacional:** Integração com **BlazeFace (TensorFlow.js)** para rastreio facial e verificação de integridade do sensor.
* **Dados de Mídia:** Resolução nativa, análise de FPS e captura de evidência fotográfica.

### 🖥 Monitor Tester
* **Dead Pixel Check:** Ciclo de cores sólidas em modo fullscreen.
* **Integridade Visual:** Ferramenta para detecção de vazamento de luz e ghosting.

---

## 📄 Geração de Laudos Técnicos
O sistema automatiza a criação de relatórios oficiais para o setor de TI:
* **Exportação:** Suporte nativo para **PDF** e **PNG**.
* **Protocolo:** Inclui S/N do equipamento, nome do técnico, matrícula e parecer técnico automatizado com carimbo de aprovação/reprovação.

---

## 🔒 Segurança e Contexto Local
Como a aplicação lida com dispositivos de entrada e mídia (Webcam), ela foi projetada para rodar em contextos seguros:
* Suporte a **SSL/HTTPS** via Vite para acesso em rede local.
* Tratamento de políticas de segurança de origem para APIs de mídia.

---
