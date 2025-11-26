<template>
  <div class="chess-app" :data-board-theme="boardTheme" :data-piece-theme="pieceTheme">
    <!-- Game Header -->
    <div class="chess-header">
      <div class="game-info">
        <div class="player-info">
          <div class="player" :class="{ active: currentPlayer === 'white' }">
            <div class="player-color white"></div>
            <span>{{ gameMode === 'ai' ? 'You' : 'Player 1' }}</span>
          </div>
          <div class="player" :class="{ active: currentPlayer === 'black' }">
            <div class="player-color black"></div>
            <span>{{ gameMode === 'ai' ? `AI (${difficulty})` : 'Player 2' }}</span>
          </div>
        </div>
        
        <div class="game-status">
          <div class="status-text">{{ statusMessage }}</div>
          <div class="move-counter">Move: {{ moveNumber }}</div>
        </div>
      </div>
      
      <div class="game-controls">
        <select v-model="gameMode" @change="startNewGame" class="mode-select">
          <option value="ai">vs AI</option>
          <option value="player">vs Player</option>
        </select>
        <select v-model="difficulty" @change="onDifficultyChange" class="difficulty-select" :disabled="gameMode === 'player'">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button @click="startNewGame" class="control-btn">New Game</button>
        <button @click="undoMove" :disabled="!canUndo" class="control-btn">Undo</button>
        <button @click="showThemeModal = true" class="control-btn">Themes</button>
      </div>
    </div>

    <!-- Chess Game Layout -->
    <div class="chess-game-layout">
      <!-- Left Sidebar - Captured Pieces -->
      <div class="left-sidebar">
        <div class="captured-section">
          <h3 class="section-title">Captured Pieces</h3>
          
          <!-- White Captured Pieces -->
          <div class="captured-color-section">
            <div class="captured-label">
              <div class="player-color white-dot"></div>
              <span>White</span>
            </div>
            <div class="captured-pieces-display">
              <span v-for="piece in capturedPieces.white" :key="piece.id" class="captured-piece-large">
                {{ piece.symbol }}
              </span>
              <div v-if="capturedPieces.white.length === 0" class="no-captures">No captures</div>
            </div>
          </div>
          
          <!-- Black Captured Pieces -->
          <div class="captured-color-section">
            <div class="captured-label">
              <div class="player-color black-dot"></div>
              <span>Black</span>
            </div>
            <div class="captured-pieces-display">
              <span v-for="piece in capturedPieces.black" :key="piece.id" class="captured-piece-large">
                {{ piece.symbol }}
              </span>
              <div v-if="capturedPieces.black.length === 0" class="no-captures">No captures</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Center - Chess Board -->
      <div class="chess-board-container">
        <div class="chess-board-wrapper">
          <!-- Rank Labels (Left side) -->
          <div class="rank-labels">
            <span v-for="rank in ranks" :key="rank" class="rank-label">{{ rank }}</span>
          </div>
          
          <!-- Main Board -->
          <div class="chess-board" ref="boardEl">
            <div 
              v-for="(row, rowIndex) in board"
              :key="rowIndex"
              class="chess-row"
            >
              <div
                v-for="(square, colIndex) in row"
                :key="colIndex"
                class="chess-square"
                :class="getSquareClass(rowIndex, colIndex)"
                @click="onSquareClick(rowIndex, colIndex)"
              >
                <div v-if="square" class="chess-piece" :class="square.color">
                  {{ square.symbol }}
                </div>
              </div>
            </div>
            <div 
              v-if="isAnimatingMove && animationPiece" 
              class="moving-piece" 
              :class="animationPiece.color" 
              :style="animationStyle"
            >
              {{ animationPiece.symbol }}
            </div>
          </div>
        </div>
        
        <!-- File Labels (Bottom) -->
        <div class="file-labels">
          <span v-for="file in files" :key="file" class="file-label">{{ file }}</span>
        </div>
      </div>
      
      <!-- Right Sidebar - Move History -->
      <div class="right-sidebar">
        <div class="history-section">
          <h3 class="section-title">Move History</h3>
          <div class="moves-list">
            <div v-for="(move, index) in displayedMoveHistory" :key="index" class="move-entry">
              <span class="move-number">{{ Math.floor(index / 2) + 1 }}.</span>
              <span class="move-notation" :class="{ 'black-move': index % 2 === 1 }">{{ move.notation }}</span>
            </div>
            <div v-if="moveHistory.length === 0" class="no-moves">No moves yet</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Modal -->
    <div v-if="gameOver" class="game-over-modal">
      <div class="modal-content">
        <h2>{{ gameOverMessage }}</h2>
        <div class="game-stats">
          <div class="stat">
            <span class="label">Total Moves:</span>
            <span class="value">{{ moveNumber - 1 }}</span>
          </div>
          <div class="stat">
            <span class="label">Game Duration:</span>
            <span class="value">{{ formatTime(gameDuration) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="startNewGame" class="control-btn primary">New Game</button>
          <button @click="gameOver = false" class="control-btn">Continue</button>
        </div>
      </div>
    </div>

    <!-- Theme Customization Modal -->
    <div v-if="showThemeModal" class="game-over-modal">
      <div class="modal-content">
        <h2>Chess Themes</h2>
        
        <div class="theme-section">
          <h3>Board Theme</h3>
          <div class="theme-options">
            <button 
              v-for="theme in boardThemes" 
              :key="theme.id"
              @click="boardTheme = theme.id"
              class="theme-option"
              :class="{ active: boardTheme === theme.id }"
            >
              <div class="theme-preview">
                <div class="board-preview">
                  <div 
                    class="preview-square light" 
                    :style="{ backgroundColor: theme.lightColor }"
                  ></div>
                  <div 
                    class="preview-square dark" 
                    :style="{ backgroundColor: theme.darkColor }"
                  ></div>
                </div>
              </div>
              <span>{{ theme.name }}</span>
            </button>
          </div>
        </div>

        <div class="theme-section">
          <h3>Piece Theme</h3>
          <div class="theme-options">
            <button 
              v-for="theme in pieceThemes" 
              :key="theme.id"
              @click="pieceTheme = theme.id"
              class="theme-option"
              :class="{ active: pieceTheme === theme.id }"
            >
              <div class="theme-preview">
                <div class="piece-preview">
                  <span :style="{ color: theme.whiteColor }">♔</span>
                  <span :style="{ color: theme.blackColor }">♚</span>
                </div>
              </div>
              <span>{{ theme.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="showThemeModal = false" class="control-btn primary">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMenuCommand } from '~/utils/menuCommands'
import { createChessMenuTemplate } from './chessMenu'
import { useOSStore } from '../../../stores/os'
import type { CommandId } from '../../../types/menu'

// Types
type PieceColor = 'white' | 'black'
type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
type GameMode = 'ai' | 'player'
type Difficulty = 'easy' | 'medium' | 'hard'

interface ChessPiece {
  id: string
  type: PieceType
  color: PieceColor
  symbol: string
  hasMoved: boolean
}

interface Position {
  row: number
  col: number
}

interface Move {
  from: Position
  to: Position
  piece: ChessPiece
  capturedPiece?: ChessPiece
  isEnPassant?: boolean
  isCastling?: boolean
  promotionPiece?: PieceType
}

// Game state
const board = ref<(ChessPiece | null)[][]>([])
const currentPlayer = ref<PieceColor>('white')
const selectedSquare = ref<Position | null>(null)
const validMoves = ref<Position[]>([])
const gameMode = ref<GameMode>('ai')
const difficulty = ref<Difficulty>('medium')
const gameOver = ref(false)
const gameOverMessage = ref('')
const moveHistory = ref<Move[]>([])
const capturedPieces = ref<{ white: ChessPiece[], black: ChessPiece[] }>({ white: [], black: [] })
const gameStartTime = ref(0)
const gameDuration = ref(0)
const isThinking = ref(false)

// Theme customization
const showThemeModal = ref(false)
const boardTheme = ref('brown')
const pieceTheme = ref('classic')

// Theme options
const boardThemes = [
  { id: 'brown', name: 'Classic Wood', lightColor: '#f0d9b5', darkColor: '#b58863' },
  { id: 'green', name: 'Tournament Green', lightColor: '#ffffdd', darkColor: '#86a666' },
  { id: 'blue', name: 'Ocean Blue', lightColor: '#dee3e6', darkColor: '#8ca2ad' },
  { id: 'purple', name: 'Royal Purple', lightColor: '#e8d5ff', darkColor: '#9333ea' }
]

const pieceThemes = [
  { id: 'classic', name: 'Classic', whiteColor: '#ffffff', blackColor: '#1f2937' },
  { id: 'wooden', name: 'Wooden', whiteColor: '#f5deb3', blackColor: '#8b4513' },
  { id: 'gold', name: 'Gold & Bronze', whiteColor: '#ffd700', blackColor: '#8b4513' },
  { id: 'silver', name: 'Silver & Charcoal', whiteColor: '#c0c0c0', blackColor: '#2c2c2c' }
]

// Animation and sound state
const boardEl = ref<HTMLElement | null>(null)
const isAnimatingMove = ref(false)
const animationPiece = ref<ChessPiece | null>(null)
const animationFrom = ref<Position | null>(null)
const animationTo = ref<Position | null>(null)
const animationStyle = ref<Record<string, string>>({})
const animationDurationMs = 180

// Game info
const moveNumber = computed(() => Math.floor(moveHistory.value.length / 2) + 1)
const canUndo = computed(() => moveHistory.value.length > 0 && !isThinking.value && !isAnimatingMove.value)

// Move history display with notation
const displayedMoveHistory = computed(() => {
  return moveHistory.value.map(move => ({
    ...move,
    notation: generateMoveNotation(move)
  }))
})

const statusMessage = computed(() => {
  if (gameOver.value) return gameOverMessage.value
  if (isThinking.value) return 'AI is thinking...'
  if (isInCheck(currentPlayer.value)) return `${currentPlayer.value} is in check!`
  return `${currentPlayer.value}'s turn`
})

// Board setup
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

// Piece symbols
const pieceSymbols = {
  white: {
    king: '♔', queen: '♕', rook: '♖', 
    bishop: '♗', knight: '♘', pawn: '♙'
  },
  black: {
    king: '♚', queen: '♛', rook: '♜', 
    bishop: '♝', knight: '♞', pawn: '♟'
  }
}

// Initialize board
function initializeBoard() {
  const newBoard: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null))
  
  // Place pieces
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
  
  // Black pieces (top)
  for (let col = 0; col < 8; col++) {
    const pieceType = pieceOrder[col]
    if (pieceType && newBoard[0]) {
      newBoard[0][col] = createPiece(pieceType, 'black', `black-${pieceType}-${col}`)
    }
    if (newBoard[1]) {
      newBoard[1][col] = createPiece('pawn', 'black', `black-pawn-${col}`)
    }
  }
  
  // White pieces (bottom)
  for (let col = 0; col < 8; col++) {
    if (newBoard[6]) {
      newBoard[6][col] = createPiece('pawn', 'white', `white-pawn-${col}`)
    }
    const pieceType = pieceOrder[col]
    if (pieceType && newBoard[7]) {
      newBoard[7][col] = createPiece(pieceType, 'white', `white-${pieceType}-${col}`)
    }
  }
  
  board.value = newBoard
}

function createPiece(type: PieceType, color: PieceColor, id: string): ChessPiece {
  return {
    id,
    type,
    color,
    symbol: pieceSymbols[color][type],
    hasMoved: false
  }
}

// Game logic
function isValidSquare(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

function getPiece(row: number, col: number): ChessPiece | null {
  if (!isValidSquare(row, col)) return null
  return board.value[row]?.[col] || null
}

function isOpponentPiece(piece: ChessPiece | null, color: PieceColor): boolean {
  return piece !== null && piece.color !== color
}

function isSameColorPiece(piece: ChessPiece | null, color: PieceColor): boolean {
  return piece !== null && piece.color === color
}

// Move validation
function getValidMoves(row: number, col: number): Position[] {
  const piece = getPiece(row, col)
  if (!piece || piece.color !== currentPlayer.value) return []
  
  const moves: Position[] = []
  
  switch (piece.type) {
    case 'pawn':
      moves.push(...getPawnMoves(row, col, piece))
      break
    case 'rook':
      moves.push(...getRookMoves(row, col, piece))
      break
    case 'bishop':
      moves.push(...getBishopMoves(row, col, piece))
      break
    case 'knight':
      moves.push(...getKnightMoves(row, col, piece))
      break
    case 'queen':
      moves.push(...getQueenMoves(row, col, piece))
      break
    case 'king':
      moves.push(...getKingMoves(row, col, piece))
      break
  }
  
  // Filter out moves that would put own king in check
  return moves.filter(move => !wouldBeInCheckAfterMove({ row, col }, move, piece))
}

function getPawnMoves(row: number, col: number, piece: ChessPiece): Position[] {
  const moves: Position[] = []
  const direction = piece.color === 'white' ? -1 : 1
  const startRow = piece.color === 'white' ? 6 : 1
  
  // Forward move
  if (isValidSquare(row + direction, col) && !getPiece(row + direction, col)) {
    moves.push({ row: row + direction, col })
    
    // Double forward on first move
    if (row === startRow && !getPiece(row + 2 * direction, col)) {
      moves.push({ row: row + 2 * direction, col })
    }
  }
  
  // Capture moves
  for (const captureCol of [col - 1, col + 1]) {
    if (isValidSquare(row + direction, captureCol)) {
      const targetPiece = getPiece(row + direction, captureCol)
      if (isOpponentPiece(targetPiece, piece.color)) {
        moves.push({ row: row + direction, col: captureCol })
      }
    }
  }
  
  return moves
}

function getRookMoves(row: number, col: number, piece: ChessPiece): Position[] {
  const moves: Position[] = []
  const directions: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  
  for (const [dRow, dCol] of directions) {
    let newRow = row + dRow
    let newCol = col + dCol
    
    while (isValidSquare(newRow, newCol)) {
      const targetPiece = getPiece(newRow, newCol)
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol })
      } else if (isOpponentPiece(targetPiece, piece.color)) {
        moves.push({ row: newRow, col: newCol })
        break
      } else {
        break
      }
      newRow += dRow
      newCol += dCol
    }
  }
  
  return moves
}

function getBishopMoves(row: number, col: number, piece: ChessPiece): Position[] {
  const moves: Position[] = []
  const directions: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  
  for (const [dRow, dCol] of directions) {
    let newRow = row + dRow
    let newCol = col + dCol
    
    while (isValidSquare(newRow, newCol)) {
      const targetPiece = getPiece(newRow, newCol)
      if (!targetPiece) {
        moves.push({ row: newRow, col: newCol })
      } else if (isOpponentPiece(targetPiece, piece.color)) {
        moves.push({ row: newRow, col: newCol })
        break
      } else {
        break
      }
      newRow += dRow
      newCol += dCol
    }
  }
  
  return moves
}

function getKnightMoves(row: number, col: number, piece: ChessPiece): Position[] {
  const moves: Position[] = []
  const knightMoves: [number, number][] = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ]
  
  for (const [dRow, dCol] of knightMoves) {
    const newRow = row + dRow
    const newCol = col + dCol
    
    if (isValidSquare(newRow, newCol)) {
      const targetPiece = getPiece(newRow, newCol)
      if (!targetPiece || isOpponentPiece(targetPiece, piece.color)) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  }
  
  return moves
}

function getQueenMoves(row: number, col: number, piece: ChessPiece): Position[] {
  return [...getRookMoves(row, col, piece), ...getBishopMoves(row, col, piece)]
}

function getKingMoves(row: number, col: number, piece: ChessPiece): Position[] {
  const moves: Position[] = []
  const kingMoves: [number, number][] = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ]
  
  for (const [dRow, dCol] of kingMoves) {
    const newRow = row + dRow
    const newCol = col + dCol
    
    if (isValidSquare(newRow, newCol)) {
      const targetPiece = getPiece(newRow, newCol)
      if (!targetPiece || isOpponentPiece(targetPiece, piece.color)) {
        moves.push({ row: newRow, col: newCol })
      }
    }
  }
  
  return moves
}

// Check detection
function isInCheck(color: PieceColor): boolean {
  const king = findKing(color)
  if (!king) return false
  
  return isSquareUnderAttack(king.row, king.col, color === 'white' ? 'black' : 'white')
}

function findKing(color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPiece(row, col)
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col }
      }
    }
  }
  return null
}

function isSquareUnderAttack(row: number, col: number, byColor: PieceColor): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = getPiece(r, c)
      if (piece && piece.color === byColor) {
        const moves = getValidMovesForPiece(r, c, piece)
        if (moves.some(move => move.row === row && move.col === col)) {
          return true
        }
      }
    }
  }
  return false
}

function getValidMovesForPiece(row: number, col: number, piece: ChessPiece): Position[] {
  // This is like getValidMoves but without the check validation to avoid infinite recursion
  switch (piece.type) {
    case 'pawn': return getPawnMoves(row, col, piece)
    case 'rook': return getRookMoves(row, col, piece)
    case 'bishop': return getBishopMoves(row, col, piece)
    case 'knight': return getKnightMoves(row, col, piece)
    case 'queen': return getQueenMoves(row, col, piece)
    case 'king': return getKingMoves(row, col, piece)
    default: return []
  }
}

function wouldBeInCheckAfterMove(from: Position, to: Position, piece: ChessPiece): boolean {
  // Simulate the move
  const originalPiece = board.value[to.row]?.[to.col] || null
  const fromRow = board.value[from.row]
  const toRow = board.value[to.row]
  
  if (fromRow) {
    fromRow[from.col] = null
  }
  if (toRow) {
    toRow[to.col] = piece
  }
  
  const inCheck = isInCheck(piece.color)
  
  // Restore the board
  if (fromRow) {
    fromRow[from.col] = piece
  }
  if (toRow) {
    toRow[to.col] = originalPiece
  }
  
  return inCheck
}

// Game actions
function onSquareClick(row: number, col: number) {
  if (gameOver.value || isThinking.value || isAnimatingMove.value) return
  
  if (selectedSquare.value) {
    // Try to make a move
    const isValidMove = validMoves.value.some(move => move.row === row && move.col === col)
    
    if (isValidMove) {
      makeMove(selectedSquare.value, { row, col })
    }
    
    // Clear selection
    selectedSquare.value = null
    validMoves.value = []
  } else {
    // Select a square
    const piece = getPiece(row, col)
    if (piece && piece.color === currentPlayer.value) {
      selectedSquare.value = { row, col }
      validMoves.value = getValidMoves(row, col)
    }
  }
}

function makeMove(from: Position, to: Position) {
  const piece = getPiece(from.row, from.col)
  if (!piece) return
  
  const capturedPiece = getPiece(to.row, to.col)
  // Start movement animation and hide destination piece during the transition
  const didAnimate = startMoveAnimation(from, to, piece)
  
  // Create move record
  const move: Move = {
    from,
    to,
    piece: { ...piece },
    capturedPiece: capturedPiece ? { ...capturedPiece } : undefined
  }
  
  // Execute move
  const fromRow = board.value[from.row]
  const toRow = board.value[to.row]
  
  if (fromRow) {
    fromRow[from.col] = null
  }
  if (toRow) {
    toRow[to.col] = piece
  }
  piece.hasMoved = true
  
  // Handle captures
  if (capturedPiece) {
    capturedPieces.value[capturedPiece.color].push(capturedPiece)
  }
  
  // Add to history
  moveHistory.value.push(move)
  
  // Switch turns
  currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
  
  // Check for game over
  checkGameEnd()
  
  // If animation couldn't start (e.g., DOM not ready), play sound immediately
  if (!didAnimate) {
    playMoveSound()
  }

  // AI move
  if (gameMode.value === 'ai' && currentPlayer.value === 'black' && !gameOver.value) {
    setTimeout(makeAIMove, 500) // Add delay for better UX
  }
}

// Animation helpers
let moveAnimationTimeout: NodeJS.Timeout | null = null

function getSquareSize(): number {
  if (!boardEl.value) return 0
  // Board is square, use width
  return boardEl.value.clientWidth / 8
}

function startMoveAnimation(from: Position, to: Position, piece: ChessPiece): boolean {
  if (!boardEl.value) return false
  const squareSize = getSquareSize()
  if (!squareSize) return false

  // Initialize moving piece overlay at source square
  isAnimatingMove.value = true
  animationPiece.value = { ...piece }
  animationFrom.value = { ...from }
  animationTo.value = { ...to }
  animationStyle.value = {
    left: `${from.col * squareSize}px`,
    top: `${from.row * squareSize}px`,
    width: `${squareSize}px`,
    height: `${squareSize}px`,
    transition: `left ${animationDurationMs}ms ease, top ${animationDurationMs}ms ease`
  }

  // Move to destination on next frame
  nextTick(() => {
    // Force a reflow to ensure transition applies
    void (boardEl.value as HTMLElement).offsetWidth
    animationStyle.value = {
      ...animationStyle.value,
      left: `${to.col * squareSize}px`,
      top: `${to.row * squareSize}px`
    }
  })

  // Cleanup after animation ends
  if (moveAnimationTimeout) clearTimeout(moveAnimationTimeout)
  moveAnimationTimeout = setTimeout(() => {
    isAnimatingMove.value = false
    animationPiece.value = null
    animationFrom.value = null
    animationTo.value = null
    animationStyle.value = {}
    playMoveSound()
  }, animationDurationMs + 20)

  return true
}

function playMoveSound() {
  try {
    const AudioContextClass: any = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') ctx.resume()

    // Short percussive click using a sine with fast decay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.09)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
    setTimeout(() => ctx.close(), 180)
  } catch {}
}

function undoMove() {
  if (moveHistory.value.length === 0) return
  
  const lastMove = moveHistory.value.pop()!
  
  // Restore board state
  const fromRow = board.value[lastMove.from.row]
  const toRow = board.value[lastMove.to.row]
  
  if (fromRow) {
    fromRow[lastMove.from.col] = lastMove.piece
  }
  if (toRow) {
    toRow[lastMove.to.col] = lastMove.capturedPiece || null
  }
  
  // Restore piece state
  lastMove.piece.hasMoved = moveHistory.value.some(m => 
    m.from.row === lastMove.from.row && m.from.col === lastMove.from.col
  )
  
  // Handle captured pieces
  if (lastMove.capturedPiece) {
    const capturedList = capturedPieces.value[lastMove.capturedPiece.color]
    const index = capturedList.findIndex(p => p.id === lastMove.capturedPiece!.id)
    if (index !== -1) {
      capturedList.splice(index, 1)
    }
  }
  
  // Switch turns back
  currentPlayer.value = currentPlayer.value === 'white' ? 'black' : 'white'
  
  // Clear game over state
  gameOver.value = false
  
  // If in AI mode and we just undid AI's move, undo player's move too
  if (gameMode.value === 'ai' && currentPlayer.value === 'black' && moveHistory.value.length > 0) {
    setTimeout(() => undoMove(), 100)
  }
}

// AI Logic
function makeAIMove() {
  isThinking.value = true
  
  setTimeout(() => {
    const move = getBestMove()
    if (move) {
      makeMove(move.from, move.to)
    }
    isThinking.value = false
  }, Math.random() * 1000 + 500) // Random thinking time for realism
}

function getBestMove(): { from: Position, to: Position } | null {
  const allMoves: { from: Position, to: Position, score: number }[] = []
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPiece(row, col)
      if (piece && piece.color === 'black') {
        const moves = getValidMoves(row, col)
        for (const move of moves) {
          const score = evaluateMove({ row, col }, move, piece)
          allMoves.push({ from: { row, col }, to: move, score })
        }
      }
    }
  }
  
  if (allMoves.length === 0) return null
  
  // Select move based on difficulty
  if (difficulty.value === 'easy') {
    // Random move
    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)]
    return randomMove ? { from: randomMove.from, to: randomMove.to } : null
  } else if (difficulty.value === 'medium') {
    // 70% best move, 30% random
    allMoves.sort((a, b) => b.score - a.score)
    const threshold = Math.floor(allMoves.length * 0.3)
    const candidateMoves = allMoves.slice(0, Math.max(1, threshold))
    const selectedMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)]
    return selectedMove ? { from: selectedMove.from, to: selectedMove.to } : null
  } else {
    // Hard: always best move
    allMoves.sort((a, b) => b.score - a.score)
    const bestMove = allMoves[0]
    return bestMove ? { from: bestMove.from, to: bestMove.to } : null
  }
}

function evaluateMove(from: Position, to: Position, piece: ChessPiece): number {
  let score = 0
  
  const targetPiece = getPiece(to.row, to.col)
  
  // Piece values
  const pieceValues = {
    pawn: 10, knight: 30, bishop: 30, 
    rook: 50, queen: 90, king: 1000
  }
  
  // Capture value
  if (targetPiece && targetPiece.color !== piece.color) {
    score += pieceValues[targetPiece.type]
  }
  
  // Center control
  const centerDistance = Math.abs(3.5 - to.row) + Math.abs(3.5 - to.col)
  score += (7 - centerDistance) * 2
  
  // Random factor for variety
  score += Math.random() * 5
  
  return score
}

// Game end detection
function checkGameEnd() {
  const hasValidMoves = hasAnyValidMoves(currentPlayer.value)
  const inCheck = isInCheck(currentPlayer.value)
  
  if (!hasValidMoves) {
    if (inCheck) {
      // Checkmate
      const winner = currentPlayer.value === 'white' ? 'Black' : 'White'
      gameOverMessage.value = `Checkmate! ${winner} wins!`
      gameOver.value = true
    } else {
      // Stalemate
      gameOverMessage.value = 'Stalemate! It\'s a draw!'
      gameOver.value = true
    }
  }
}

function hasAnyValidMoves(color: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = getPiece(row, col)
      if (piece && piece.color === color) {
        const moves = getValidMoves(row, col)
        if (moves.length > 0) return true
      }
    }
  }
  return false
}

// UI helpers
function getSquareClass(row: number, col: number) {
  const classes = []
  
  // Light/dark squares
  classes.push((row + col) % 2 === 0 ? 'light' : 'dark')
  
  // Selected square
  if (selectedSquare.value && selectedSquare.value.row === row && selectedSquare.value.col === col) {
    classes.push('selected')
  }
  
  // Valid move highlighting
  if (validMoves.value.some(move => move.row === row && move.col === col)) {
    classes.push('valid-move')
  }
  
  // Last move highlighting
  const lastMove = moveHistory.value.at(-1)
  if (lastMove) {
    if ((lastMove.from.row === row && lastMove.from.col === col) ||
        (lastMove.to.row === row && lastMove.to.col === col)) {
      classes.push('last-move')
    }
  }
  
  // Hide the destination piece while animating to avoid duplicate glyphs
  if (isAnimatingMove.value && animationTo.value && animationTo.value.row === row && animationTo.value.col === col) {
    classes.push('hide-piece')
  }
  
  return classes
}


function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function generateMoveNotation(move: Move): string {
  const { from, to, piece, capturedPiece } = move
  
  // Convert position to algebraic notation
  const fromSquare = `${files[from.col]}${8 - from.row}`
  const toSquare = `${files[to.col]}${8 - to.row}`
  
  let notation = ''
  
  // Piece symbol (except for pawns)
  if (piece.type !== 'pawn') {
    notation += piece.type.charAt(0).toUpperCase()
  }
  
  // Add from square for clarity (simplified notation)
  if (piece.type === 'pawn' && capturedPiece) {
    // Pawn captures: show file of origin
    notation += files[from.col]
  }
  
  // Capture indicator
  if (capturedPiece) {
    notation += 'x'
  }
  
  // Destination square
  notation += toSquare
  
  return notation
}

// Game management
function startNewGame() {
  initializeBoard()
  currentPlayer.value = 'white'
  selectedSquare.value = null
  validMoves.value = []
  gameOver.value = false
  gameOverMessage.value = ''
  moveHistory.value = []
  capturedPieces.value = { white: [], black: [] }
  gameStartTime.value = Date.now()
  isThinking.value = false
}

function onDifficultyChange() {
  if (gameMode.value === 'ai') {
    // If it's AI's turn, make a new move with new difficulty
    if (currentPlayer.value === 'black' && !gameOver.value) {
      setTimeout(makeAIMove, 300)
    }
  }
}

// Timer
let gameTimer: NodeJS.Timeout | null = null

function startGameTimer() {
  gameTimer = setInterval(() => {
    if (!gameOver.value && moveHistory.value.length > 0) {
      gameDuration.value = Math.floor((Date.now() - gameStartTime.value) / 1000)
    }
  }, 1000)
}

function stopGameTimer() {
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

// Lifecycle
onMounted(() => {
  // Register menu commands for Chess
  const { register } = useMenuCommand()

  register('chess.newGame' as CommandId, () => {
    startNewGame()
  })

  register('chess.undoMove' as CommandId, () => {
    if (canUndo.value) undoMove()
  })

  register('chess.setMode' as CommandId, (args?: any) => {
    const mode = args?.mode === 'player' ? 'player' : 'ai'
    gameMode.value = mode
    startNewGame()
  })

  register('chess.setDifficulty' as CommandId, (args?: any) => {
    const level = args?.level
    if (level === 'easy' || level === 'medium' || level === 'hard') {
      difficulty.value = level
      onDifficultyChange()
    }
  })

  // Ensure OS knows about app-specific menubar
  const os = useOSStore()
  // No explicit call needed; MenuBar resolves by focused app id.

  startNewGame()
  startGameTimer()
})

onUnmounted(() => {
  stopGameTimer()
  if (moveAnimationTimeout) {
    clearTimeout(moveAnimationTimeout)
    moveAnimationTimeout = null
  }
})

// Watch for game over to stop timer
watch(gameOver, (isOver) => {
  if (isOver) {
    stopGameTimer()
  }
})
</script>

<style scoped>
@import "./chess.css";

/* Theme modal styling */
.theme-section {
  margin-bottom: 1.5rem;
}

.theme-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #fbbf24;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid rgba(139, 69, 19, 0.3);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 500;
}

.theme-option:hover {
  border-color: #d4af37;
  background: rgba(0, 0, 0, 0.4);
  transform: translateY(-1px);
}

.theme-option.active {
  border-color: #ffd700;
  background: rgba(212, 175, 55, 0.2);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.theme-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #8b4513;
}

.preview-square {
  width: 100%;
  height: 100%;
}

.piece-preview {
  display: flex;
  gap: 0.5rem;
  font-size: 1.5rem;
}

/* Additional chess app overrides if needed */
</style>
