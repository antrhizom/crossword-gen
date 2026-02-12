import React, { useState, useEffect, useRef } from 'react';
import { Share2, Plus, Trash2, Grid, Play, Download, FileText, Image as ImageIcon, Shuffle } from 'lucide-react';

export default function App() {
  const [words, setWords] = useState([{ word: '', clue: '' }]);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [puzzle, setPuzzle] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [mode, setMode] = useState('create'); // 'create', 'solve'
  const [shareLink, setShareLink] = useState('');
  const [checkedAnswers, setCheckedAnswers] = useState({});
  const [showPrompt, setShowPrompt] = useState(false);
  const puzzleRef = useRef(null);
  const inputRefs = useRef({});

  // Load puzzle from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const puzzleData = params.get('puzzle');
    if (puzzleData) {
      try {
        const decoded = JSON.parse(atob(puzzleData));
        setPuzzle(decoded);
        setMode('solve');
      } catch (e) {
        console.error('Fehler beim Laden des Rätsels');
      }
    }
  }, []);

  const parseBulkInput = () => {
    const parts = bulkInput.split(',').map(s => s.trim()).filter(s => s);
    if (parts.length < 2 || parts.length % 2 !== 0) {
      alert('Bitte gib die Wörter und Hinweise im Format ein: WORT1, Hinweis 1, WORT2, Hinweis 2, ...');
      return;
    }

    const newWords = [];
    for (let i = 0; i < parts.length; i += 2) {
      newWords.push({
        word: parts[i].toUpperCase(),
        clue: parts[i + 1]
      });
    }

    setWords(newWords);
    setBulkInput('');
    setShowBulkInput(false);
  };

  const addWord = () => {
    setWords([...words, { word: '', clue: '' }]);
  };

  const removeWord = (index) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const updateWord = (index, field, value) => {
    const newWords = [...words];
    newWords[index][field] = field === 'word' ? value.toUpperCase() : value;
    setWords(newWords);
  };

  const generatePuzzle = () => {
    const validWords = words.filter(w => w.word.length > 1 && w.clue);
    if (validWords.length < 2) {
      alert('Bitte gib mindestens 2 Wörter mit Hinweisen ein!');
      return;
    }

    const grid = createCrossword(validWords);
    if (grid) {
      setPuzzle(grid);
      setMode('solve');
      setUserAnswers({});
      setCheckedAnswers({});
    } else {
      alert('Kreuzworträtsel konnte nicht erstellt werden. Versuche andere Wörter!');
    }
  };

  const rearrangePuzzle = () => {
    if (!puzzle) return;
    
    // Extract original words from puzzle
    const originalWords = puzzle.words.map(w => ({
      word: w.word,
      clue: w.clue
    }));
    
    // Shuffle the order slightly to get different arrangement
    const shuffled = [...originalWords].sort(() => Math.random() - 0.5);
    
    const grid = createCrossword(shuffled);
    if (grid) {
      setPuzzle(grid);
      setUserAnswers({});
      setCheckedAnswers({});
    } else {
      alert('Konnte keine neue Anordnung erstellen. Versuche es nochmal!');
    }
  };

  const createCrossword = (wordList) => {
    // Sort words by length (longest first)
    const sorted = [...wordList].sort((a, b) => b.word.length - a.word.length);
    
    const gridSize = 50;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    const placed = [];
    
    // Place first word horizontally in the middle
    const firstWord = sorted[0];
    const startRow = Math.floor(gridSize / 2);
    const startCol = Math.floor((gridSize - firstWord.word.length) / 2);
    
    for (let i = 0; i < firstWord.word.length; i++) {
      grid[startRow][startCol + i] = firstWord.word[i];
    }
    
    placed.push({
      word: firstWord.word,
      clue: firstWord.clue,
      row: startRow,
      col: startCol,
      direction: 'across',
      number: 1
    });

    let wordNumber = 2;

    // Try to place remaining words
    for (let i = 1; i < sorted.length; i++) {
      const currentWord = sorted[i];
      let bestPlacement = null;
      let maxIntersections = 0;

      // Try to find intersections with placed words
      for (const placedWord of placed) {
        for (let j = 0; j < currentWord.word.length; j++) {
          for (let k = 0; k < placedWord.word.length; k++) {
            if (currentWord.word[j] === placedWord.word[k]) {
              // Try placing perpendicular to the placed word
              const newDirection = placedWord.direction === 'across' ? 'down' : 'across';
              const newRow = placedWord.direction === 'across' 
                ? placedWord.row - j 
                : placedWord.row + k;
              const newCol = placedWord.direction === 'across' 
                ? placedWord.col + k 
                : placedWord.col - j;

              if (canPlaceWord(grid, currentWord.word, newRow, newCol, newDirection, gridSize)) {
                const intersections = countIntersections(grid, currentWord.word, newRow, newCol, newDirection);
                if (intersections > maxIntersections) {
                  maxIntersections = intersections;
                  bestPlacement = { row: newRow, col: newCol, direction: newDirection };
                }
              }
            }
          }
        }
      }

      if (bestPlacement) {
        placeWord(grid, currentWord.word, bestPlacement.row, bestPlacement.col, bestPlacement.direction);
        placed.push({
          word: currentWord.word,
          clue: currentWord.clue,
          row: bestPlacement.row,
          col: bestPlacement.col,
          direction: bestPlacement.direction,
          number: wordNumber++
        });
      }
    }

    // Trim grid to actual content
    const trimmed = trimGrid(grid, placed);
    return trimmed;
  };

  const canPlaceWord = (grid, word, row, col, direction, gridSize) => {
    if (row < 0 || col < 0) return false;
    
    const endRow = direction === 'down' ? row + word.length - 1 : row;
    const endCol = direction === 'across' ? col + word.length - 1 : col;
    
    if (endRow >= gridSize || endCol >= gridSize) return false;

    // Check if cells are available or match
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      
      if (grid[r][c] !== null && grid[r][c] !== word[i]) {
        return false;
      }

      // Check perpendicular cells for conflicts
      if (direction === 'across') {
        if (r > 0 && grid[r - 1][c] !== null && grid[r][c] === null) return false;
        if (r < gridSize - 1 && grid[r + 1][c] !== null && grid[r][c] === null) return false;
      } else {
        if (c > 0 && grid[r][c - 1] !== null && grid[r][c] === null) return false;
        if (c < gridSize - 1 && grid[r][c + 1] !== null && grid[r][c] === null) return false;
      }
    }

    // Check cells before and after word
    if (direction === 'across') {
      if (col > 0 && grid[row][col - 1] !== null) return false;
      if (col + word.length < gridSize && grid[row][col + word.length] !== null) return false;
    } else {
      if (row > 0 && grid[row - 1][col] !== null) return false;
      if (row + word.length < gridSize && grid[row + word.length][col] !== null) return false;
    }

    return true;
  };

  const countIntersections = (grid, word, row, col, direction) => {
    let count = 0;
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      if (grid[r][c] === word[i]) count++;
    }
    return count;
  };

  const placeWord = (grid, word, row, col, direction) => {
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;
      grid[r][c] = word[i];
    }
  };

  const trimGrid = (grid, placed) => {
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    placed.forEach(p => {
      minRow = Math.min(minRow, p.row);
      maxRow = Math.max(maxRow, p.direction === 'down' ? p.row + p.word.length - 1 : p.row);
      minCol = Math.min(minCol, p.col);
      maxCol = Math.max(maxCol, p.direction === 'across' ? p.col + p.word.length - 1 : p.col);
    });

    // Add padding
    minRow = Math.max(0, minRow - 1);
    minCol = Math.max(0, minCol - 1);
    maxRow = Math.min(grid.length - 1, maxRow + 1);
    maxCol = Math.min(grid[0].length - 1, maxCol + 1);

    const trimmedGrid = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        row.push(grid[r][c]);
      }
      trimmedGrid.push(row);
    }

    // Adjust word positions
    const adjustedWords = placed.map(p => ({
      ...p,
      row: p.row - minRow,
      col: p.col - minCol
    }));

    // Sort by number
    adjustedWords.sort((a, b) => a.number - b.number);

    return { grid: trimmedGrid, words: adjustedWords };
  };

  const handleCellChange = (wordIndex, letterIndex, rowIdx, colIdx, value) => {
    const key = `${wordIndex}-${letterIndex}`;
    setUserAnswers({ ...userAnswers, [key]: value.toUpperCase() });

    // Auto-focus next editable cell
    if (value) {
      // Find next editable cell
      let found = false;
      
      // Try cells to the right first
      for (let c = colIdx + 1; c < puzzle.grid[0].length && !found; c++) {
        const cellKey = `${rowIdx}-${c}`;
        if (inputRefs.current[cellKey] && puzzle.grid[rowIdx][c] !== null) {
          inputRefs.current[cellKey].focus();
          found = true;
          break;
        }
      }
      
      // If not found, try next rows
      if (!found) {
        for (let r = rowIdx + 1; r < puzzle.grid.length && !found; r++) {
          for (let c = 0; c < puzzle.grid[0].length && !found; c++) {
            const cellKey = `${r}-${c}`;
            if (inputRefs.current[cellKey] && puzzle.grid[r][c] !== null) {
              inputRefs.current[cellKey].focus();
              found = true;
              break;
            }
          }
        }
      }
    }
  };

  const handleKeyDown = (e, rowIdx, colIdx) => {
    const currentKey = `${rowIdx}-${colIdx}`;
    let targetKey = null;

    switch(e.key) {
      case 'ArrowRight':
        e.preventDefault();
        targetKey = `${rowIdx}-${colIdx + 1}`;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        targetKey = `${rowIdx}-${colIdx - 1}`;
        break;
      case 'ArrowDown':
        e.preventDefault();
        targetKey = `${rowIdx + 1}-${colIdx}`;
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetKey = `${rowIdx - 1}-${colIdx}`;
        break;
      case 'Backspace':
        if (!userAnswers[`${rowIdx}-${colIdx}`]) {
          targetKey = `${rowIdx}-${colIdx - 1}`;
        }
        break;
    }

    if (targetKey && inputRefs.current[targetKey]) {
      inputRefs.current[targetKey].focus();
    }
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;
    const newChecked = {};

    puzzle.words.forEach((word, wIdx) => {
      for (let i = 0; i < word.word.length; i++) {
        total++;
        const key = `${wIdx}-${i}`;
        const isCorrect = userAnswers[key] === word.word[i];
        if (isCorrect) {
          correct++;
        }
        newChecked[key] = isCorrect;
      }
    });

    setCheckedAnswers(newChecked);
    
    setTimeout(() => {
      alert(`${correct} von ${total} Buchstaben richtig! ${correct === total ? '🎉 Perfekt!' : ''}`);
    }, 100);
  };

  const resetCheck = () => {
    setCheckedAnswers({});
  };

  const generateShareLink = () => {
    const encoded = btoa(JSON.stringify(puzzle));
    const url = `${window.location.origin}${window.location.pathname}?puzzle=${encoded}`;
    setShareLink(url);
    navigator.clipboard.writeText(url);
    alert('Link wurde in die Zwischenablage kopiert!');
  };

  const exportAsPNG = async () => {
    if (!puzzleRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      
      // Create a print-optimized version
      const printDiv = document.createElement('div');
      printDiv.style.cssText = 'position: absolute; left: -9999px; background: white; padding: 40px;';
      printDiv.innerHTML = createPrintLayout();
      document.body.appendChild(printDiv);
      
      const canvas = await html2canvas(printDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });
      
      document.body.removeChild(printDiv);
      
      const link = document.createElement('a');
      link.download = 'kreuzwortraetsel.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Exportieren. Stelle sicher, dass html2canvas installiert ist.');
    }
  };

  const exportAsPDF = async () => {
    if (!puzzleRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // Create a print-optimized version
      const printDiv = document.createElement('div');
      printDiv.style.cssText = 'position: absolute; left: -9999px; background: white; padding: 40px; width: 1200px;';
      printDiv.innerHTML = createPrintLayout();
      document.body.appendChild(printDiv);
      
      const canvas = await html2canvas(printDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });
      
      document.body.removeChild(printDiv);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('kreuzwortraetsel.pdf');
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Exportieren. Stelle sicher, dass html2canvas und jspdf installiert sind.');
    }
  };

  const createPrintLayout = () => {
    const gridSize = puzzle.grid.length > 15 ? 25 : 35;
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 1200px;">
        <h1 style="text-align: center; margin-bottom: 30px; font-size: 28px;">Kreuzworträtsel</h1>
        
        <div style="display: flex; gap: 40px; align-items: flex-start;">
          <!-- Grid -->
          <div style="flex-shrink: 0;">
            ${puzzle.grid.map((row, rowIdx) => `
              <div style="display: flex;">
                ${row.map((cell, colIdx) => {
                  const wordStart = puzzle.words.find(w => w.row === rowIdx && w.col === colIdx);
                  return `
                    <div style="
                      width: ${gridSize}px; 
                      height: ${gridSize}px; 
                      border: 1px solid #333; 
                      position: relative;
                      background: ${cell === null ? '#000' : '#fff'};
                    ">
                      ${wordStart ? `<span style="position: absolute; top: 1px; left: 2px; font-size: 8px; font-weight: bold;">${wordStart.number}</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            `).join('')}
          </div>
          
          <!-- Clues -->
          <div style="flex: 1; font-size: 12px; line-height: 1.6;">
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Waagerecht</h2>
              ${puzzle.words.filter(w => w.direction === 'across').map(word => 
                `<div style="margin-bottom: 6px;"><strong>${word.number}.</strong> ${word.clue}</div>`
              ).join('')}
            </div>
            
            <div>
              <h2 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">Senkrecht</h2>
              ${puzzle.words.filter(w => w.direction === 'down').map(word => 
                `<div style="margin-bottom: 6px;"><strong>${word.number}.</strong> ${word.clue}</div>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const resetToCreate = () => {
    setMode('create');
    setPuzzle(null);
    setUserAnswers({});
    setShareLink('');
    window.history.pushState({}, '', window.location.pathname);
  };

  if (mode === 'solve' && puzzle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-xl p-8" ref={puzzleRef}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Kreuzworträtsel</h1>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(checkedAnswers).length > 0 && (
                  <button
                    onClick={resetCheck}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                  >
                    Markierung zurücksetzen
                  </button>
                )}
                <button
                  onClick={checkAnswers}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Prüfen
                </button>
                <button
                  onClick={rearrangePuzzle}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Neu anordnen
                </button>
                <button
                  onClick={exportAsPNG}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Als Bild
                </button>
                <button
                  onClick={exportAsPDF}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Als PDF
                </button>
                <button
                  onClick={generateShareLink}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Teilen
                </button>
                <button
                  onClick={resetToCreate}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Neues Rätsel
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Crossword Grid */}
              <div className="overflow-auto">
                <div className="inline-block">
                  {puzzle.grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex">
                      {row.map((cell, colIdx) => {
                        // Find if this cell is the start of a word
                        const wordStart = puzzle.words.find(
                          w => w.row === rowIdx && w.col === colIdx
                        );
                        const wordIndex = puzzle.words.findIndex(
                          w => w.row === rowIdx && w.col === colIdx ||
                             (w.direction === 'across' && w.row === rowIdx && colIdx >= w.col && colIdx < w.col + w.word.length) ||
                             (w.direction === 'down' && w.col === colIdx && rowIdx >= w.row && rowIdx < w.row + w.word.length)
                        );
                        
                        let letterIndex = -1;
                        if (wordIndex >= 0) {
                          const word = puzzle.words[wordIndex];
                          if (word.direction === 'across') {
                            letterIndex = colIdx - word.col;
                          } else {
                            letterIndex = rowIdx - word.row;
                          }
                        }

                        const key = `${wordIndex}-${letterIndex}`;
                        const cellKey = `${rowIdx}-${colIdx}`;

                        return (
                          <div
                            key={colIdx}
                            className={`w-10 h-10 border border-gray-300 relative ${
                              cell === null ? 'bg-gray-800' : 'bg-white'
                            }`}
                          >
                            {wordStart && (
                              <span className="absolute top-0 left-1 text-xs font-bold text-blue-600">
                                {wordStart.number}
                              </span>
                            )}
                            {cell !== null && (
                              <input
                                ref={el => inputRefs.current[cellKey] = el}
                                type="text"
                                maxLength={1}
                                value={userAnswers[key] || ''}
                                onChange={(e) => handleCellChange(wordIndex, letterIndex, rowIdx, colIdx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                className={`w-full h-full text-center font-bold text-lg uppercase border-none outline-none focus:ring-2 focus:ring-blue-400 ${
                                  checkedAnswers[key] === true 
                                    ? 'bg-green-100 text-green-800' 
                                    : checkedAnswers[key] === false 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'focus:bg-blue-50'
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Clues */}
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-700 mb-3">Waagerecht</h2>
                  <div className="space-y-2">
                    {puzzle.words.filter(w => w.direction === 'across').map(word => (
                      <div key={word.number} className="text-gray-700">
                        <span className="font-bold">{word.number}.</span> {word.clue}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-700 mb-3">Senkrecht</h2>
                  <div className="space-y-2">
                    {puzzle.words.filter(w => w.direction === 'down').map(word => (
                      <div key={word.number} className="text-gray-700">
                        <span className="font-bold">{word.number}.</span> {word.clue}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Grid className="w-8 h-8 text-purple-600" />
            Kreuzworträtsel-Generator
          </h1>
          <p className="text-gray-600 mb-8">Erstelle dein eigenes Kreuzworträtsel zum Teilen!</p>

          {/* Bulk Input Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg mb-3 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {showBulkInput ? 'Einzeleingabe' : 'Mehrere Wörter auf einmal'}
            </button>

            {showBulkInput && (
              <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wörter und Hinweise (komma-getrennt):
                </label>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="KATZE, Haustier mit vier Pfoten, HUND, Bester Freund des Menschen, VOGEL, Kann fliegen"
                  className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-2 mb-3">
                  Format: WORT1, Hinweis 1, WORT2, Hinweis 2, WORT3, Hinweis 3, ...
                </p>
                <button
                  onClick={parseBulkInput}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Wörter übernehmen
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {words.map((word, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Wort (z.B. KATZE)"
                    value={word.word}
                    onChange={(e) => updateWord(index, 'word', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  />
                </div>
                <div className="flex-[2]">
                  <input
                    type="text"
                    placeholder="Hinweis (z.B. Haustier mit vier Pfoten)"
                    value={word.clue}
                    onChange={(e) => updateWord(index, 'clue', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                {words.length > 1 && (
                  <button
                    onClick={() => removeWord(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addWord}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Wort hinzufügen
            </button>
            <button
              onClick={generatePuzzle}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
            >
              <Grid className="w-5 h-5" />
              Kreuzworträtsel erstellen
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tipps:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Nutze "Mehrere Wörter auf einmal" für schnelle Eingabe</li>
              <li>• Wörter sollten mindestens 2 Buchstaben lang sein</li>
              <li>• Beim Lösen: Nutze Pfeiltasten zur Navigation</li>
              <li>• Exportiere als PDF oder Bild für Word/Druck</li>
              <li>• Bei "Prüfen" werden richtige Antworten grün, falsche rot markiert</li>
            </ul>
          </div>

          {/* AI Prompt Template */}
          <div className="mt-6">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg mb-3 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {showPrompt ? 'KI-Prompt ausblenden' : 'KI-Prompt anzeigen'}
            </button>

            {showPrompt && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-2">🤖 Prompt für ChatGPT/Claude:</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Kopiere diesen Text und füge ihn in ChatGPT oder Claude ein, um automatisch Wörter und Hinweise zu generieren:
                </p>
                <div className="bg-white p-4 rounded border border-purple-200 font-mono text-sm mb-3 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-800">
{`Erstelle mir 10-15 Wörter mit Hinweisen für ein Kreuzworträtsel zum Thema: [DEIN THEMA]

Format: WORT1, Hinweis 1, WORT2, Hinweis 2, WORT3, Hinweis 3, ...

Regeln:
- Wörter sollten zwischen 3-12 Buchstaben lang sein
- Hinweise sollten klar aber nicht zu einfach sein
- Verwende nur Großbuchstaben für die Wörter
- Keine Umlaute (ä→AE, ö→OE, ü→UE, ß→SS)
- Achte darauf, dass Wörter gemeinsame Buchstaben haben können

Beispiel:
KATZE, Haustier mit vier Pfoten, HUND, Bester Freund des Menschen, VOGEL, Kann fliegen, FISCH, Lebt im Wasser, HAMSTER, Kleines Nagetier als Haustier

Thema: [DEIN THEMA HIER EINFÜGEN]`}
                  </pre>
                </div>
                <button
                  onClick={() => {
                    const promptText = `Erstelle mir 10-15 Wörter mit Hinweisen für ein Kreuzworträtsel zum Thema: [DEIN THEMA]

Format: WORT1, Hinweis 1, WORT2, Hinweis 2, WORT3, Hinweis 3, ...

Regeln:
- Wörter sollten zwischen 3-12 Buchstaben lang sein
- Hinweise sollten klar aber nicht zu einfach sein
- Verwende nur Großbuchstaben für die Wörter
- Keine Umlaute (ä→AE, ö→OE, ü→UE, ß→SS)
- Achte darauf, dass Wörter gemeinsame Buchstaben haben können

Beispiel:
KATZE, Haustier mit vier Pfoten, HUND, Bester Freund des Menschen, VOGEL, Kann fliegen, FISCH, Lebt im Wasser, HAMSTER, Kleines Nagetier als Haustier

Thema: [DEIN THEMA HIER EINFÜGEN]`;
                    navigator.clipboard.writeText(promptText);
                    alert('Prompt in die Zwischenablage kopiert! 📋');
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  📋 Prompt kopieren
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
