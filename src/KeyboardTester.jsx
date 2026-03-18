import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- BANCO DE DADOS DE LAYOUTS ---
const LAYOUTS = {
  positivo_sk6620: {
    name: "Positivo SK6620 (ABNT2 Padrão)",
    gridCols: 25,
    keys: [
      { code: 'Escape', label: 'esc', grid: '1 / 1' },
      { code: 'F1', label: 'F1', grid: '1 / 3' }, { code: 'F2', label: 'F2', grid: '1 / 4' },
      { code: 'F3', label: 'F3', grid: '1 / 5' }, { code: 'F4', label: 'F4', grid: '1 / 6' },
      { code: 'F5', label: 'F5', grid: '1 / 8' }, { code: 'F6', label: 'F6', grid: '1 / 9' },
      { code: 'F7', label: 'F7', grid: '1 / 10' }, { code: 'F8', label: 'F8', grid: '1 / 11' },
      { code: 'F9', label: 'F9', grid: '1 / 13' }, { code: 'F10', label: 'F10', grid: '1 / 14' },
      { code: 'F11', label: 'F11', grid: '1 / 15' }, { code: 'F12', label: 'F12', grid: '1 / 16' },
      { code: 'PrintScreen', label: 'prt sc', grid: '1 / 18' }, { code: 'ScrollLock', label: 'scrlk', grid: '1 / 19' }, { code: 'Pause', label: 'pause', grid: '1 / 20' },
      { code: 'Backquote', label: "' \"", grid: '2 / 1' },
      { code: 'Digit1', label: '1', grid: '2 / 2' }, { code: 'Digit2', label: '2', grid: '2 / 3' },
      { code: 'Digit3', label: '3', grid: '2 / 4' }, { code: 'Digit4', label: '4', grid: '2 / 5' },
      { code: 'Digit5', label: '5', grid: '2 / 6' }, { code: 'Digit6', label: '6', grid: '2 / 7' },
      { code: 'Digit7', label: '7', grid: '2 / 8' }, { code: 'Digit8', label: '8', grid: '2 / 9' },
      { code: 'Digit9', label: '9', grid: '2 / 10' }, { code: 'Digit0', label: '0', grid: '2 / 11' },
      { code: 'Minus', label: '-', grid: '2 / 12' }, { code: 'Equal', label: '=', grid: '2 / 13' },
      { code: 'Backspace', label: 'backspace', grid: '2 / 14 / 2 / 17' },
      { code: 'Insert', label: 'ins', grid: '2 / 18' }, { code: 'Home', label: 'home', grid: '2 / 19' }, { code: 'PageUp', label: 'pg up', grid: '2 / 20' },
      { code: 'NumLock', label: 'num', grid: '2 / 22' }, { code: 'NumpadDivide', label: '/', grid: '2 / 23' }, { code: 'NumpadMultiply', label: '*', grid: '2 / 24' }, { code: 'NumpadSubtract', label: '-', grid: '2 / 25' },
      { code: 'Tab', label: 'tab', grid: '3 / 1 / 3 / 3' },
      { code: 'KeyQ', label: 'Q', grid: '3 / 3' }, { code: 'KeyW', label: 'W', grid: '3 / 4' },
      { code: 'KeyE', label: 'E', grid: '3 / 5' }, { code: 'KeyR', label: 'R', grid: '3 / 6' },
      { code: 'KeyT', label: 'T', grid: '3 / 7' }, { code: 'KeyY', label: 'Y', grid: '3 / 8' },
      { code: 'KeyU', label: 'U', grid: '3 / 9' }, { code: 'KeyI', label: 'I', grid: '3 / 10' },
      { code: 'KeyO', label: 'O', grid: '3 / 11' }, { code: 'KeyP', label: 'P', grid: '3 / 12' },
      { code: 'BracketLeft', label: '´', grid: '3 / 13' }, { code: 'BracketRight', label: '[', grid: '3 / 14' },
      { code: 'Delete', label: 'del', grid: '3 / 18' }, { code: 'End', label: 'end', grid: '3 / 19' }, { code: 'PageDown', label: 'pg dn', grid: '3 / 20' },
      { code: 'Numpad7', label: '7', grid: '3 / 22' }, { code: 'Numpad8', label: '8', grid: '3 / 23' }, { code: 'Numpad9', label: '9', grid: '3 / 24' }, 
      { code: 'NumpadAdd', label: '+', grid: '3 / 25 / 5 / 26' }, 
      { code: 'CapsLock', label: 'caps lock', grid: '4 / 1 / 4 / 3' },
      { code: 'KeyA', label: 'A', grid: '4 / 3' }, { code: 'KeyS', label: 'S', grid: '4 / 4' },
      { code: 'KeyD', label: 'D', grid: '4 / 5' }, { code: 'KeyF', label: 'F', grid: '4 / 6' },
      { code: 'KeyG', label: 'G', grid: '4 / 7' }, { code: 'KeyH', label: 'H', grid: '4 / 8' },
      { code: 'KeyJ', label: 'J', grid: '4 / 9' }, { code: 'KeyK', label: 'K', grid: '4 / 10' },
      { code: 'KeyL', label: 'L', grid: '4 / 11' }, { code: 'Semicolon', label: 'Ç', grid: '4 / 12' },
      { code: 'Quote', label: '~', grid: '4 / 13' }, { code: 'Backslash', label: ']', grid: '4 / 14' },
      { code: 'Enter', label: 'enter', grid: '3 / 15 / 5 / 17' }, 
      { code: 'Numpad4', label: '4', grid: '4 / 22' }, { code: 'Numpad5', label: '5', grid: '4 / 23' }, { code: 'Numpad6', label: '6', grid: '4 / 24' },
      { code: 'ShiftLeft', label: 'shift', grid: '5 / 1 / 5 / 2' },
      { code: 'IntlBackslash', label: '\\', grid: '5 / 2' },
      { code: 'KeyZ', label: 'Z', grid: '5 / 3' }, { code: 'KeyX', label: 'X', grid: '5 / 4' },
      { code: 'KeyC', label: 'C', grid: '5 / 5' }, { code: 'KeyV', label: 'V', grid: '5 / 6' },
      { code: 'KeyB', label: 'B', grid: '5 / 7' }, { code: 'KeyN', label: 'N', grid: '5 / 8' },
      { code: 'KeyM', label: 'M', grid: '5 / 9' }, { code: 'Comma', label: ',', grid: '5 / 10' },
      { code: 'Period', label: '.', grid: '5 / 11' }, { code: 'Slash', label: '/', grid: '5 / 12' },
      { code: 'ShiftRight', label: 'shift', grid: '5 / 13 / 5 / 17' },
      { code: 'ArrowUp', label: '▲', grid: '5 / 19' },
      { code: 'Numpad1', label: '1', grid: '5 / 22' }, { code: 'Numpad2', label: '2', grid: '5 / 23' }, { code: 'Numpad3', label: '3', grid: '5 / 24' }, { code: 'NumpadEnter', label: 'ent', grid: '5 / 25 / 7 / 26' },
      { code: 'ControlLeft', label: 'ctrl', grid: '6 / 1' },
      { code: 'MetaLeft', label: 'win', grid: '6 / 2' },
      { code: 'AltLeft', label: 'alt', grid: '6 / 3' },
      { code: 'Space', label: '', grid: '6 / 4 / 6 / 12' },
      { code: 'AltRight', label: 'alt gr', grid: '6 / 12' },
      { code: 'MetaRight', label: 'win', grid: '6 / 13' },
      { code: 'ContextMenu', label: '≡', grid: '6 / 14' },
      { code: 'ControlRight', label: 'ctrl', grid: '6 / 15 / 6 / 17' },
      { code: 'ArrowLeft', label: '◄', grid: '6 / 18' }, { code: 'ArrowDown', label: '▼', grid: '6 / 19' }, { code: 'ArrowRight', label: '►', grid: '6 / 20' },
      { code: 'Numpad0', label: '0', grid: '6 / 22 / 6 / 24' }, 
      { code: 'NumpadDecimal', label: ',', grid: '6 / 24' }
    ]
  },
  dell_kb216: {
    name: "Dell KB216 (ABNT2 + Multimídia)",
    gridCols: 25,
    keys: [
      { code: 'Escape', label: 'esc / 🔒', grid: '1 / 1' },
      { code: 'F1', label: 'F1 / ☾', grid: '1 / 3' }, { code: 'F2', label: 'F2', grid: '1 / 4' },
      { code: 'F3', label: 'F3', grid: '1 / 5' }, { code: 'F4', label: 'F4', grid: '1 / 6' },
      { code: 'F5', label: 'F5', grid: '1 / 8' }, { code: 'F6', label: 'F6', grid: '1 / 9' },
      { code: 'F7', label: 'F7', grid: '1 / 10' }, { code: 'F8', label: 'F8', grid: '1 / 11' },
      { code: 'F9', label: 'F9', grid: '1 / 13' }, { code: 'F10', label: 'F10 / ⏮', grid: '1 / 14' },
      { code: 'F11', label: 'F11 / ⏯', grid: '1 / 15' }, { code: 'F12', label: 'F12 / ⏭', grid: '1 / 16' },
      { code: 'AudioVolumeMute', label: '🔇', grid: '1 / 18' }, 
      { code: 'AudioVolumeDown', label: '🔉', grid: '1 / 19' }, 
      { code: 'AudioVolumeUp', label: '🔊', grid: '1 / 20' }, 
      { code: 'Backquote', label: "' \"", grid: '2 / 1' },
      { code: 'Digit1', label: '1', grid: '2 / 2' }, { code: 'Digit2', label: '2', grid: '2 / 3' },
      { code: 'Digit3', label: '3', grid: '2 / 4' }, { code: 'Digit4', label: '4', grid: '2 / 5' },
      { code: 'Digit5', label: '5', grid: '2 / 6' }, { code: 'Digit6', label: '6', grid: '2 / 7' },
      { code: 'Digit7', label: '7', grid: '2 / 8' }, { code: 'Digit8', label: '8', grid: '2 / 9' },
      { code: 'Digit9', label: '9', grid: '2 / 10' }, { code: 'Digit0', label: '0', grid: '2 / 11' },
      { code: 'Minus', label: '-', grid: '2 / 12' }, { code: 'Equal', label: '=', grid: '2 / 13' },
      { code: 'Backspace', label: 'backspace', grid: '2 / 14 / 2 / 17' },
      { code: 'Insert', label: 'ins', grid: '2 / 18' }, { code: 'Home', label: 'home', grid: '2 / 19' }, { code: 'PageUp', label: 'pg up', grid: '2 / 20' },
      { code: 'NumLock', label: 'num', grid: '2 / 22' }, { code: 'NumpadDivide', label: '/', grid: '2 / 23' }, { code: 'NumpadMultiply', label: '*', grid: '2 / 24' }, { code: 'NumpadSubtract', label: '-', grid: '2 / 25' },
      { code: 'Tab', label: 'tab', grid: '3 / 1 / 3 / 3' },
      { code: 'KeyQ', label: 'Q', grid: '3 / 3' }, { code: 'KeyW', label: 'W', grid: '3 / 4' },
      { code: 'KeyE', label: 'E', grid: '3 / 5' }, { code: 'KeyR', label: 'R', grid: '3 / 6' },
      { code: 'KeyT', label: 'T', grid: '3 / 7' }, { code: 'KeyY', label: 'Y', grid: '3 / 8' },
      { code: 'KeyU', label: 'U', grid: '3 / 9' }, { code: 'KeyI', label: 'I', grid: '3 / 10' },
      { code: 'KeyO', label: 'O', grid: '3 / 11' }, { code: 'KeyP', label: 'P', grid: '3 / 12' },
      { code: 'BracketLeft', label: '´', grid: '3 / 13' }, { code: 'BracketRight', label: '[', grid: '3 / 14' },
      { code: 'Delete', label: 'del', grid: '3 / 18' }, { code: 'End', label: 'end', grid: '3 / 19' }, { code: 'PageDown', label: 'pg dn', grid: '3 / 20' },
      { code: 'Numpad7', label: '7', grid: '3 / 22' }, { code: 'Numpad8', label: '8', grid: '3 / 23' }, { code: 'Numpad9', label: '9', grid: '3 / 24' }, { code: 'NumpadAdd', label: '+', grid: '3 / 25 / 5 / 26' },
      { code: 'CapsLock', label: 'caps', grid: '4 / 1 / 4 / 3' },
      { code: 'KeyA', label: 'A', grid: '4 / 3' }, { code: 'KeyS', label: 'S', grid: '4 / 4' },
      { code: 'KeyD', label: 'D', grid: '4 / 5' }, { code: 'KeyF', label: 'F', grid: '4 / 6' },
      { code: 'KeyG', label: 'G', grid: '4 / 7' }, { code: 'KeyH', label: 'H', grid: '4 / 8' },
      { code: 'KeyJ', label: 'J', grid: '4 / 9' }, { code: 'KeyK', label: 'K', grid: '4 / 10' },
      { code: 'KeyL', label: 'L', grid: '4 / 11' }, { code: 'Semicolon', label: 'Ç', grid: '4 / 12' },
      { code: 'Quote', label: '~', grid: '4 / 13' }, { code: 'Backslash', label: ']', grid: '4 / 14' },
      { code: 'Enter', label: 'enter', grid: '3 / 15 / 5 / 17' },
      { code: 'Numpad4', label: '4', grid: '4 / 22' }, { code: 'Numpad5', label: '5', grid: '4 / 23' }, { code: 'Numpad6', label: '6', grid: '4 / 24' },
      { code: 'ShiftLeft', label: 'shift', grid: '5 / 1 / 5 / 2' },
      { code: 'IntlBackslash', label: '\\', grid: '5 / 2' },
      { code: 'KeyZ', label: 'Z', grid: '5 / 3' }, { code: 'KeyX', label: 'X', grid: '5 / 4' },
      { code: 'KeyC', label: 'C', grid: '5 / 5' }, { code: 'KeyV', label: 'V', grid: '5 / 6' },
      { code: 'KeyB', label: 'B', grid: '5 / 7' }, { code: 'KeyN', label: 'N', grid: '5 / 8' },
      { code: 'KeyM', label: 'M', grid: '5 / 9' }, { code: 'Comma', label: ',', grid: '5 / 10' },
      { code: 'Period', label: '.', grid: '5 / 11' }, { code: 'Slash', label: ';', grid: '5 / 12' }, 
      { code: 'ShiftRight', label: 'shift', grid: '5 / 13 / 5 / 17' },
      { code: 'ArrowUp', label: '▲', grid: '5 / 19' },
      { code: 'Numpad1', label: '1', grid: '5 / 22' }, { code: 'Numpad2', label: '2', grid: '5 / 23' }, { code: 'Numpad3', label: '3', grid: '5 / 24' }, { code: 'NumpadEnter', label: 'ent', grid: '5 / 25 / 7 / 26' },
      { code: 'ControlLeft', label: 'ctrl', grid: '6 / 1' },
      { code: 'Fn', label: 'fn', grid: '6 / 2' },
      { code: 'MetaLeft', label: 'win', grid: '6 / 3' },
      { code: 'AltLeft', label: 'alt', grid: '6 / 4' },
      { code: 'Space', label: '', grid: '6 / 5 / 6 / 12' },
      { code: 'AltRight', label: 'alt gr', grid: '6 / 12' },
      { code: 'FnRight', label: 'fn', grid: '6 / 13' },
      { code: 'ContextMenu', label: '≡', grid: '6 / 14' },
      { code: 'ControlRight', label: 'ctrl', grid: '6 / 15 / 6 / 17' },
      { code: 'ArrowLeft', label: '◄', grid: '6 / 18' }, 
      { code: 'ArrowDown', label: '▼', grid: '6 / 19' }, 
      { code: 'ArrowRight', label: '►', grid: '6 / 20' },
      { code: 'Numpad0', label: '0', grid: '6 / 22 / 6 / 24' }, 
      { code: 'NumpadDecimal', label: ',', grid: '6 / 24' }
    ]
  },
  hp_sk2120: {
    name: "HP SK-2120 (ABNT2 + Multimídia)",
    gridCols: 25,
    keys: [
      { code: 'Escape', label: 'esc', grid: '1 / 1' },
      { code: 'F1', label: 'F1 / ☾', grid: '1 / 3' }, { code: 'F2', label: 'F2', grid: '1 / 4' },
      { code: 'F3', label: 'F3', grid: '1 / 5' }, { code: 'F4', label: 'F4 / ⧉', grid: '1 / 6' },
      { code: 'F5', label: 'F5 / 🔆', grid: '1 / 8' }, { code: 'F6', label: 'F6 / 🔅', grid: '1 / 9' },
      { code: 'F7', label: 'F7 / 🔇', grid: '1 / 10' }, { code: 'F8', label: 'F8 / 🔉', grid: '1 / 11' },
      { code: 'F9', label: 'F9 / 🔊', grid: '1 / 13' }, { code: 'F10', label: 'F10', grid: '1 / 14' },
      { code: 'F11', label: 'F11', grid: '1 / 15' }, { code: 'F12', label: 'F12', grid: '1 / 16' },
      { code: 'PrintScreen', label: 'prt', grid: '1 / 18' }, { code: 'ScrollLock', label: 'scroll', grid: '1 / 19' }, { code: 'Pause', label: 'pause', grid: '1 / 20' },
      { code: 'Backquote', label: "' \"", grid: '2 / 1' },
      { code: 'Digit1', label: '1', grid: '2 / 2' }, { code: 'Digit2', label: '2', grid: '2 / 3' },
      { code: 'Digit3', label: '3', grid: '2 / 4' }, { code: 'Digit4', label: '4', grid: '2 / 5' },
      { code: 'Digit5', label: '5', grid: '2 / 6' }, { code: 'Digit6', label: '6', grid: '2 / 7' },
      { code: 'Digit7', label: '7', grid: '2 / 8' }, { code: 'Digit8', label: '8', grid: '2 / 9' },
      { code: 'Digit9', label: '9', grid: '2 / 10' }, { code: 'Digit0', label: '0', grid: '2 / 11' },
      { code: 'Minus', label: '-', grid: '2 / 12' }, { code: 'Equal', label: '=', grid: '2 / 13' },
      { code: 'Backspace', label: 'backspace', grid: '2 / 14 / 2 / 17' },
      { code: 'Insert', label: 'ins', grid: '2 / 18' }, { code: 'Home', label: 'home', grid: '2 / 19' }, { code: 'PageUp', label: 'pg up', grid: '2 / 20' },
      { code: 'NumLock', label: 'num', grid: '2 / 22' }, { code: 'NumpadDivide', label: '/', grid: '2 / 23' }, { code: 'NumpadMultiply', label: '*', grid: '2 / 24' }, { code: 'NumpadSubtract', label: '-', grid: '2 / 25' },
      { code: 'Tab', label: 'tab', grid: '3 / 1 / 3 / 3' },
      { code: 'KeyQ', label: 'Q', grid: '3 / 3' }, { code: 'KeyW', label: 'W', grid: '3 / 4' },
      { code: 'KeyE', label: 'E', grid: '3 / 5' }, { code: 'KeyR', label: 'R', grid: '3 / 6' },
      { code: 'KeyT', label: 'T', grid: '3 / 7' }, { code: 'KeyY', label: 'Y', grid: '3 / 8' },
      { code: 'KeyU', label: 'U', grid: '3 / 9' }, { code: 'KeyI', label: 'I', grid: '3 / 10' },
      { code: 'KeyO', label: 'O', grid: '3 / 11' }, { code: 'KeyP', label: 'P', grid: '3 / 12' },
      { code: 'BracketLeft', label: '´', grid: '3 / 13' }, { code: 'BracketRight', label: '[', grid: '3 / 14' },
      { code: 'Delete', label: 'del', grid: '3 / 18' }, { code: 'End', label: 'end', grid: '3 / 19' }, { code: 'PageDown', label: 'pg dn', grid: '3 / 20' },
      { code: 'Numpad7', label: '7', grid: '3 / 22' }, { code: 'Numpad8', label: '8', grid: '3 / 23' }, { code: 'Numpad9', label: '9', grid: '3 / 24' }, { code: 'NumpadAdd', label: '+', grid: '3 / 25 / 5 / 26' },
      { code: 'CapsLock', label: 'caps', grid: '4 / 1 / 4 / 3' },
      { code: 'KeyA', label: 'A', grid: '4 / 3' }, { code: 'KeyS', label: 'S', grid: '4 / 4' },
      { code: 'KeyD', label: 'D', grid: '4 / 5' }, { code: 'KeyF', label: 'F', grid: '4 / 6' },
      { code: 'KeyG', label: 'G', grid: '4 / 7' }, { code: 'KeyH', label: 'H', grid: '4 / 8' },
      { code: 'KeyJ', label: 'J', grid: '4 / 9' }, { code: 'KeyK', label: 'K', grid: '4 / 10' },
      { code: 'KeyL', label: 'L', grid: '4 / 11' }, { code: 'Semicolon', label: 'Ç', grid: '4 / 12' },
      { code: 'Quote', label: '~', grid: '4 / 13' }, { code: 'Backslash', label: ']', grid: '4 / 14' },
      { code: 'Enter', label: 'enter', grid: '3 / 15 / 5 / 17' }, 
      { code: 'Numpad4', label: '4', grid: '4 / 22' }, { code: 'Numpad5', label: '5', grid: '4 / 23' }, { code: 'Numpad6', label: '6', grid: '4 / 24' },
      { code: 'ShiftLeft', label: 'shift', grid: '5 / 1 / 5 / 2' },
      { code: 'IntlBackslash', label: '\\', grid: '5 / 2' },
      { code: 'KeyZ', label: 'Z', grid: '5 / 3' }, { code: 'KeyX', label: 'X', grid: '5 / 4' },
      { code: 'KeyC', label: 'C', grid: '5 / 5' }, { code: 'KeyV', label: 'V', grid: '5 / 6' },
      { code: 'KeyB', label: 'B', grid: '5 / 7' }, { code: 'KeyN', label: 'N', grid: '5 / 8' },
      { code: 'KeyM', label: 'M', grid: '5 / 9' }, { code: 'Comma', label: ',', grid: '5 / 10' },
      { code: 'Period', label: '.', grid: '5 / 11' }, { code: 'Slash', label: ';', grid: '5 / 12' }, 
      { code: 'IntlRo', label: '/', grid: '5 / 13' },
      { code: 'ShiftRight', label: 'shift', grid: '5 / 14 / 5 / 17' },
      { code: 'ArrowUp', label: '▲', grid: '5 / 19' },
      { code: 'Numpad1', label: '1', grid: '5 / 22' }, { code: 'Numpad2', label: '2', grid: '5 / 23' }, { code: 'Numpad3', label: '3', grid: '5 / 24' }, { code: 'NumpadEnter', label: 'ent', grid: '5 / 25 / 7 / 26' },
      { code: 'ControlLeft', label: 'ctrl', grid: '6 / 1' },
      { code: 'Fn', label: 'fn', grid: '6 / 2' },
      { code: 'MetaLeft', label: 'win', grid: '6 / 3' },
      { code: 'AltLeft', label: 'alt', grid: '6 / 4' },
      { code: 'Space', label: '', grid: '6 / 5 / 6 / 12' },
      { code: 'AltRight', label: 'alt gr', grid: '6 / 12' },
      { code: 'ContextMenu', label: '≡', grid: '6 / 13 / 6 / 15' },
      { code: 'ControlRight', label: 'ctrl', grid: '6 / 15 / 6 / 17' },
      { code: 'ArrowLeft', label: '◄', grid: '6 / 18' }, { code: 'ArrowDown', label: '▼', grid: '6 / 19' }, { code: 'ArrowRight', label: '►', grid: '6 / 20' },
      { code: 'Numpad0', label: '0', grid: '6 / 22 / 6 / 24' }, { code: 'NumpadDecimal', label: ',', grid: '6 / 24' }
    ]
  },
  lenovo_ku1619: {
    name: "Lenovo KU-1619 (ABNT2 Padrão)",
    gridCols: 25,
    keys: [
      { code: 'Escape', label: 'Esc', grid: '1 / 1' },
      { code: 'F1', label: 'F1', grid: '1 / 3' }, { code: 'F2', label: 'F2', grid: '1 / 4' },
      { code: 'F3', label: 'F3', grid: '1 / 5' }, { code: 'F4', label: 'F4', grid: '1 / 6' },
      { code: 'F5', label: 'F5', grid: '1 / 8' }, { code: 'F6', label: 'F6', grid: '1 / 9' },
      { code: 'F7', label: 'F7', grid: '1 / 10' }, { code: 'F8', label: 'F8', grid: '1 / 11' },
      { code: 'F9', label: 'F9', grid: '1 / 13' }, { code: 'F10', label: 'F10', grid: '1 / 14' },
      { code: 'F11', label: 'F11', grid: '1 / 15' }, { code: 'F12', label: 'F12', grid: '1 / 16' },
      { code: 'PrintScreen', label: 'PrtSc', grid: '1 / 18' }, { code: 'ScrollLock', label: 'ScrLk', grid: '1 / 19' }, { code: 'Pause', label: 'Pause', grid: '1 / 20' },
      { code: 'Backquote', label: "' \"", grid: '2 / 1' },
      { code: 'Digit1', label: '1', grid: '2 / 2' }, { code: 'Digit2', label: '2', grid: '2 / 3' },
      { code: 'Digit3', label: '3', grid: '2 / 4' }, { code: 'Digit4', label: '4', grid: '2 / 5' },
      { code: 'Digit5', label: '5', grid: '2 / 6' }, { code: 'Digit6', label: '6', grid: '2 / 7' },
      { code: 'Digit7', label: '7', grid: '2 / 8' }, { code: 'Digit8', label: '8', grid: '2 / 9' },
      { code: 'Digit9', label: '9', grid: '2 / 10' }, { code: 'Digit0', label: '0', grid: '2 / 11' },
      { code: 'Minus', label: '-', grid: '2 / 12' }, { code: 'Equal', label: '=', grid: '2 / 13' },
      { code: 'Backspace', label: 'Backspace', grid: '2 / 14 / 2 / 17' },
      { code: 'Insert', label: 'Ins', grid: '2 / 18' }, { code: 'Home', label: 'Home', grid: '2 / 19' }, { code: 'PageUp', label: 'PgUp', grid: '2 / 20' },
      { code: 'NumLock', label: 'Num', grid: '2 / 22' }, { code: 'NumpadDivide', label: '/', grid: '2 / 23' }, { code: 'NumpadMultiply', label: '*', grid: '2 / 24' }, { code: 'NumpadSubtract', label: '-', grid: '2 / 25' },
      { code: 'Tab', label: 'Tab', grid: '3 / 1 / 3 / 3' },
      { code: 'KeyQ', label: 'Q', grid: '3 / 3' }, { code: 'KeyW', label: 'W', grid: '3 / 4' },
      { code: 'KeyE', label: 'E', grid: '3 / 5' }, { code: 'KeyR', label: 'R', grid: '3 / 6' },
      { code: 'KeyT', label: 'T', grid: '3 / 7' }, { code: 'KeyY', label: 'Y', grid: '3 / 8' },
      { code: 'KeyU', label: 'U', grid: '3 / 9' }, { code: 'KeyI', label: 'I', grid: '3 / 10' },
      { code: 'KeyO', label: 'O', grid: '3 / 11' }, { code: 'KeyP', label: 'P', grid: '3 / 12' },
      { code: 'BracketLeft', label: '´', grid: '3 / 13' }, { code: 'BracketRight', label: '[', grid: '3 / 14' },
      { code: 'Delete', label: 'Del', grid: '3 / 18' }, { code: 'End', label: 'End', grid: '3 / 19' }, { code: 'PageDown', label: 'PgDn', grid: '3 / 20' },
      { code: 'Numpad7', label: '7', grid: '3 / 22' }, { code: 'Numpad8', label: '8', grid: '3 / 23' }, { code: 'Numpad9', label: '9', grid: '3 / 24' }, { code: 'NumpadAdd', label: '+', grid: '3 / 25 / 5 / 26' },
      { code: 'CapsLock', label: 'Caps', grid: '4 / 1 / 4 / 3' },
      { code: 'KeyA', label: 'A', grid: '4 / 3' }, { code: 'KeyS', label: 'S', grid: '4 / 4' },
      { code: 'KeyD', label: 'D', grid: '4 / 5' }, { code: 'KeyF', label: 'F', grid: '4 / 6' },
      { code: 'KeyG', label: 'G', grid: '4 / 7' }, { code: 'KeyH', label: 'H', grid: '4 / 8' },
      { code: 'KeyJ', label: 'J', grid: '4 / 9' }, { code: 'KeyK', label: 'K', grid: '4 / 10' },
      { code: 'KeyL', label: 'L', grid: '4 / 11' }, { code: 'Semicolon', label: 'Ç', grid: '4 / 12' },
      { code: 'Quote', label: '~', grid: '4 / 13' }, { code: 'Backslash', label: ']', grid: '4 / 14' },
      { code: 'Enter', label: 'Enter', grid: '3 / 15 / 5 / 17' }, 
      { code: 'Numpad4', label: '4', grid: '4 / 22' }, { code: 'Numpad5', label: '5', grid: '4 / 23' }, { code: 'Numpad6', label: '6', grid: '4 / 24' },
      { code: 'ShiftLeft', label: 'Shift', grid: '5 / 1 / 5 / 2' },
      { code: 'IntlBackslash', label: '\\', grid: '5 / 2' },
      { code: 'KeyZ', label: 'Z', grid: '5 / 3' }, { code: 'KeyX', label: 'X', grid: '5 / 4' },
      { code: 'KeyC', label: 'C', grid: '5 / 5' }, { code: 'KeyV', label: 'V', grid: '5 / 6' },
      { code: 'KeyB', label: 'B', grid: '5 / 7' }, { code: 'KeyN', label: 'N', grid: '5 / 8' },
      { code: 'KeyM', label: 'M', grid: '5 / 9' }, { code: 'Comma', label: ',', grid: '5 / 10' },
      { code: 'Period', label: '.', grid: '5 / 11' }, { code: 'Slash', label: ';', grid: '5 / 12' }, 
      { code: 'IntlRo', label: '/', grid: '5 / 13' },
      { code: 'ShiftRight', label: 'Shift', grid: '5 / 14 / 5 / 17' },
      { code: 'ArrowUp', label: '▲', grid: '5 / 19' },
      { code: 'Numpad1', label: '1', grid: '5 / 22' }, { code: 'Numpad2', label: '2', grid: '5 / 23' }, { code: 'Numpad3', label: '3', grid: '5 / 24' }, { code: 'NumpadEnter', label: 'Ent', grid: '5 / 25 / 7 / 26' },
      { code: 'ControlLeft', label: 'Ctrl', grid: '6 / 1' },
      { code: 'MetaLeft', label: 'Win', grid: '6 / 2' },
      { code: 'AltLeft', label: 'Alt', grid: '6 / 3' },
      { code: 'Space', label: '', grid: '6 / 4 / 6 / 12' },
      { code: 'AltRight', label: 'AltGr', grid: '6 / 12' },
      { code: 'MetaRight', label: 'Win', grid: '6 / 13' },
      { code: 'ContextMenu', label: '≡', grid: '6 / 14' },
      { code: 'ControlRight', label: 'Ctrl', grid: '6 / 15 / 6 / 17' },
      { code: 'ArrowLeft', label: '◄', grid: '6 / 18' }, { code: 'ArrowDown', label: '▼', grid: '6 / 19' }, { code: 'ArrowRight', label: '►', grid: '6 / 20' },
      { code: 'Numpad0', label: '0', grid: '6 / 22 / 6 / 24' }, { code: 'NumpadDecimal', label: ',', grid: '6 / 24' }
    ]
  }
};

export default function KeyboardTester() {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [testedKeys, setTestedKeys] = useState(new Set());
  const [rejectedKeys, setRejectedKeys] = useState(new Set());
  const [theme, setTheme] = useState('dark');
  const [lastCode, setLastCode] = useState('');
  
  // NOVOS ESTADOS PARA DEFEITOS GLOBAIS
  const [defectCable, setDefectCable] = useState(false);
  const [defectFirmware, setDefectFirmware] = useState(false);
  
  // Controle de Fluxo
  const [showReportForm, setShowReportForm] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);

  // Dados do Formulário
  const [reportText, setReportText] = useState('');
  const [tecnicoNome, setTecnicoNome] = useState('');
  const [tecnicoMatricula, setTecnicoMatricula] = useState('');
  const [dispositivoSerial, setDispositivoSerial] = useState('');
  const [selectedModel, setSelectedModel] = useState('positivo_sk6620');
  const currentLayout = LAYOUTS[selectedModel];

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    // Reseta tudo ao trocar de teclado
    setTestedKeys(new Set());
    setRejectedKeys(new Set());
    setReportText('');
    setLastCode('');
    setIsFinalized(false);
    setShowReportForm(false);
    setDefectCable(false);
    setDefectFirmware(false);
  };

  const reportRef = useRef(null);

  // REGRAS DE NEGÓCIO
  const isAllTested = testedKeys.size >= currentLayout.keys.length;
  const canReject = (reportText.trim().length >= 5 && rejectedKeys.size > 0) || defectCable || defectFirmware;
  const canApprove = (testedKeys.size >= currentLayout.keys.length);

  // EFFECT ÚNICO DE CAPTURA
  useEffect(() => {
    if (isFinalized || showReportForm) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      const code = e.code;
      const keyChar = e.key;

      setActiveKeys(prev => new Set(prev).add(code));
      
      if (code.includes('Numpad')) {
        setLastCode(`${code} (${keyChar})`);
      } else {
        setLastCode(code);
      }
    };

    const handleKeyUp = (e) => {
      setActiveKeys(prev => {
        const n = new Set(prev);
        n.delete(e.code);
        return n;
      });
      setTestedKeys(prev => new Set(prev).add(e.code));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFinalized, showReportForm]);

  const handleFinalize = (status) => {
    setResultStatus(status);
    setIsFinalized(true);
    setShowReportForm(false);
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `LAUDO_${dispositivoSerial || 'EQUIPAMENTO'}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erro ao gerar imagem.");
    }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        scrollX: 0,
        scrollY: 0
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (pdf.getImageProperties(imgData).height * pdfWidth) / pdf.getImageProperties(imgData).width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LAUDO_${dispositivoSerial || 'EQUIPAMENTO'}_${new Date().getTime()}.pdf`);
    } catch (error) {
      alert("Erro ao gerar PDF.");
    }
  };

  if (isFinalized) {
    return (
      <div className={`summary-screen ${theme} ${resultStatus}`}>
        <div className="report-container-official" ref={reportRef}>
          <div className="report-header-official">
            <div className="report-brand">
              <h1>LAUDO TÉCNICO DE PERIFÉRICOS</h1>
              <span>HARDWARE TEST SUITE v1.0 | CATI</span>
            </div>
            <div className="report-meta">
              <p><strong>Data:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Hora:</strong> {new Date().toLocaleTimeString()}</p>
              <p><strong>S/N:</strong> {dispositivoSerial || 'N/A'}</p>
            </div>
          </div>

          <div className="report-body">
            <section className="report-info-grid">
              <div className="info-item">
                <p><strong>Equipamento:</strong> {currentLayout.name}</p>
                <p><strong>Técnico:</strong> {tecnicoNome || '__________________'}</p>
                <p><strong>Matrícula:</strong> {tecnicoMatricula || '__________________'}</p>
              </div>
              <div className={`status-stamp-large ${resultStatus}`}>
                {resultStatus === 'approved' ? 'APROVADO' : 'REPROVADO'}
              </div>
            </section>

            <div className="keyboard-preview-official">
              <div className="keyboard-grid" style={{ gridTemplateColumns: `repeat(${currentLayout.gridCols}, 1fr)` }}>
                {currentLayout.keys.map(key => (
                  <div 
                    key={key.code} 
                    className={`key-unit ${rejectedKeys.has(key.code) ? 'failed-red' : testedKeys.has(key.code) ? 'tested' : ''}`} 
                    style={{ gridArea: key.grid }}
                  >
                    {key.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="report-details-box">
              <h3>PARECER TÉCNICO</h3>
              <div className="observation-text">
                {resultStatus === 'approved' ? (
                  <p>O dispositivo foi submetido a testes rigorosos de continuidade e acionamento. Todas as teclas responderam dentro dos padrões de latência esperados. Não foram identificadas falhas físicas ou lógicas. <strong>Dispositivo apto para uso.</strong></p>
                ) : (
                  <>
                    {(defectCable || defectFirmware) && (
                      <div style={{marginBottom: '10px', color: '#dc2626'}}>
                        <p><strong>FALHAS CRÍTICAS IDENTIFICADAS:</strong></p>
                        <ul style={{marginTop: '5px', paddingLeft: '20px'}}>
                          {defectCable && <li>🔌 Cabo USB / Conector danificado ou intermitente.</li>}
                          {defectFirmware && <li>🤖 Falha de Firmware / Controladora Lógica.</li>}
                        </ul>
                      </div>
                    )}
                    <p><strong>Observações:</strong> {reportText || "Sem observações de texto."}</p>
                    {rejectedKeys.size > 0 && (
                      <p><strong>Teclas com Falha:</strong> <span className="highlight-danger">{[...rejectedKeys].join(', ')}</span></p>
                    )}
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
          <button className="btn-download" onClick={exportAsImage}>📸 PNG</button>
          <button className="btn-download" onClick={exportAsPDF} style={{backgroundColor: '#dc2626', color: 'white'}}>📄 PDF</button>
          <button className="btn-restart" onClick={() => window.location.reload()}>🔄 NOVO DIAGNÓSTICO</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`tester-wrapper ${theme}`}>
      <header className="tester-header">
        <div className="brand">
          <h2>DIAGNÓSTICO TÉCNICO</h2>
          <div className="model-selector-wrapper">
            <label>Modelo:</label>
            <select 
              value={selectedModel} 
              onChange={handleModelChange}
              className="model-select"
              disabled={showReportForm || isFinalized}
            >
              {Object.keys(LAYOUTS).map((key) => (
                <option key={key} value={key}>{LAYOUTS[key].name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="keyboard-viewport">
        <div className="keyboard-container-main">
          <div className="keyboard-plate">
            <div className="keyboard-grid" style={{ gridTemplateColumns: `repeat(${currentLayout.gridCols}, 1fr)` }}>
              {currentLayout.keys.map(key => (
                <div 
                  key={key.code}
                  className={`key-unit 
                    ${activeKeys.has(key.code) ? 'pressing' : testedKeys.has(key.code) ? 'tested' : ''} 
                    ${rejectedKeys.has(key.code) ? 'to-reject' : ''}`}
                  style={{ gridArea: key.grid }}
                  onClick={() => showReportForm && setRejectedKeys(prev => {
                    const next = new Set(prev);
                    next.has(key.code) ? next.delete(key.code) : next.add(key.code);
                    return next;
                  })}
                >
                  {key.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <section className="report-panel">
        {!showReportForm ? (
          <div className="report-actions">
            <div className="status-info">
              <div className={`badge ${isAllTested ? 'approved' : 'testing'}`}>{isAllTested ? 'APROVADO' : 'EM TESTE'}</div>
              <span>Última Tecla: <strong>{lastCode || '---'}</strong></span>
            </div>
            <div className="btn-group">
              <button className={`btn-approve ${isAllTested ? 'active' : ''}`} disabled={!isAllTested} onClick={() => setShowReportForm('approve')}>APROVAR TECLADO</button>
              <button className="btn-reject" onClick={() => setShowReportForm('reject')}>REPROVAR / LAUDO</button>
            </div>
          </div>
        ) : (
          <div className="report-form-active">
            <div className="form-header">
              <h3>Dados do Laudo</h3>
              <p className="instruction">O teste de teclas está pausado para preenchimento.</p>
            </div>

            <div className="input-group-row">
               <input type="text" placeholder="Nº Série / Patrimônio" value={dispositivoSerial} onChange={(e) => setDispositivoSerial(e.target.value)} />
               <input type="text" placeholder="Nome do Técnico" value={tecnicoNome} onChange={(e) => setTecnicoNome(e.target.value)} />
               <input type="text" placeholder="Matrícula" value={tecnicoMatricula} onChange={(e) => setTecnicoMatricula(e.target.value)} style={{maxWidth: '120px'}} />
            </div>
            
            {showReportForm === 'reject' && (
              <div className="global-defects-wrapper">
                <p className="section-label">Falhas Críticas (Hardware/Lógico):</p>
                <div className="defects-grid">
                  <button className={`defect-toggle ${defectCable ? 'active' : ''}`} onClick={() => setDefectCable(!defectCable)}>🔌 Cabo / Conector</button>
                  <button className={`defect-toggle ${defectFirmware ? 'active' : ''}`} onClick={() => setDefectFirmware(!defectFirmware)}>🤖 Erro de Firmware</button>
                </div>
              </div>
            )}

            <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder={showReportForm === 'approve' ? "Nada a declarar..." : "Descreva as falhas..."} />
            
            <div className="form-btns">
              <button className={showReportForm === 'approve' ? 'btn-approve active' : 'btn-reject'} disabled={showReportForm === 'reject' && !canReject} onClick={() => handleFinalize(showReportForm === 'approve' ? 'approved' : 'rejected')}>
                GERAR LAUDO
              </button>
              <button className="btn-util" onClick={() => setShowReportForm(false)}>CANCELAR</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}