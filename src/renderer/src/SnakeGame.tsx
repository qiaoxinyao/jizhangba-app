import React, { useState, useEffect, useRef } from 'react'
import { COLORS } from './categories'

// ============ 常量 ============
const GRID_COLS = 20
const GRID_ROWS = 20
const CELL_SIZE = 22
const CANVAS_W = GRID_COLS * CELL_SIZE
const CANVAS_H = GRID_ROWS * CELL_SIZE
const INITIAL_SPEED = 150        // 毫秒/帧
const MIN_SPEED = 60             // 最快速度
const SPEED_STEP = 10            // 每次加速减少多少毫秒
const FOOD_PER_LEVEL = 5         // 吃几个食物加速一次
const HIGH_SCORE_KEY = 'snake-game-high-score'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameState = 'idle' | 'playing' | 'paused' | 'gameover'
interface Pos { x: number; y: number }

// ============ 工具函数 ============

/** 生成蛇的初始位置（屏幕中央，长度 3，朝右） */
function initSnake(): Pos[] {
  const cx = Math.floor(GRID_COLS / 2)
  const cy = Math.floor(GRID_ROWS / 2)
  return [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ]
}

/** 在空白格子上随机生成食物 */
function randomFood(snake: Pos[]): Pos | null {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`))
  const free: Pos[] = []
  for (let x = 0; x < GRID_COLS; x++) {
    for (let y = 0; y < GRID_ROWS; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null // 蛇占满屏幕，无空位放食物
  return free[Math.floor(Math.random() * free.length)]
}


// ============ Canvas 绘制 ============

/** 在 Canvas 上绘制所有内容 */
function drawGame(
  ctx: CanvasRenderingContext2D,
  snake: Pos[],
  food: Pos,
  direction: Direction,
  isDead: boolean
) {
  const w = CANVAS_W
  const h = CANVAS_H

  ctx.clearRect(0, 0, w, h)

  // ---- 背景 ----
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)

  // ---- 网格线 ----
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= GRID_COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * CELL_SIZE, 0)
    ctx.lineTo(x * CELL_SIZE, h)
    ctx.stroke()
  }
  for (let y = 0; y <= GRID_ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * CELL_SIZE)
    ctx.lineTo(w, y * CELL_SIZE)
    ctx.stroke()
  }

  // ---- 食物 ----
  ctx.fillStyle = '#ff6b6b'
  ctx.beginPath()
  ctx.arc(
    food.x * CELL_SIZE + CELL_SIZE / 2,
    food.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 2 - 3,
    0,
    Math.PI * 2
  )
  ctx.fill()
  // 食物高光
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(
    food.x * CELL_SIZE + CELL_SIZE / 2 - 3,
    food.y * CELL_SIZE + CELL_SIZE / 2 - 4,
    4,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // ---- 蛇 ----
  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i]
    const x = seg.x * CELL_SIZE
    const y = seg.y * CELL_SIZE
    const pad = 1

    if (i === 0) {
      // 蛇头
      ctx.fillStyle = isDead ? '#bbb' : '#4ecdc4'
      ctx.beginPath()
      ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 5)
      ctx.fill()

      // 蛇头眼睛（根据方向）
      ctx.fillStyle = '#fff'
      const dir = direction
      let ex1 = x + 6, ey1 = y + 6
      let ex2 = x + 14, ey2 = y + 6
      if (dir === 'DOWN') { ey1 = y + 14; ey2 = y + 14 }
      else if (dir === 'LEFT') { ex1 = x + 6; ey1 = y + 6; ex2 = x + 6; ey2 = y + 14 }
      else if (dir === 'RIGHT') { ex1 = x + 14; ey1 = y + 6; ex2 = x + 14; ey2 = y + 14 }
      ctx.beginPath()
      ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2)
      ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // 蛇身（从深到浅渐变）
      const alpha = Math.max(0.3, 1 - (i / snake.length) * 0.5)
      ctx.fillStyle = `rgba(42, 157, 143, ${alpha})`
      ctx.beginPath()
      ctx.roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 3)
      ctx.fill()
    }
  }
}

// ============ 组件 ============

export default function SnakeGame() {
  // ---- Refs（可变游戏状态，避免闭包过期） ----
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snakeRef = useRef<Pos[]>([])
  const directionRef = useRef<Direction>('RIGHT')
  const queuedDirectionRef = useRef<Direction | null>(null) // 缓冲下一帧方向
  const foodRef = useRef<Pos>({ x: 0, y: 0 })
  const gameStateRef = useRef<GameState>('idle')
  const scoreRef = useRef(0)
  const foodCountRef = useRef(0)        // 累计吃了几颗（用于判断加速）
  const speedRef = useRef(INITIAL_SPEED)
  const intervalRef = useRef<number>(0)
  const mountedRef = useRef(true)

  // ---- React 状态（用于界面渲染） ----
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem(HIGH_SCORE_KEY)
    return saved ? parseInt(saved, 10) : 0
  })
  const [gameState, setGameState] = useState<GameState>('idle')
  const [isNewRecord, setIsNewRecord] = useState(false)

  // ---- Canvas 上下文 ----
  const getCtx = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.getContext('2d')
  }

  // ---- 绘制 ----
  const draw = () => {
    const ctx = getCtx()
    if (!ctx) return
    drawGame(
      ctx,
      snakeRef.current,
      foodRef.current,
      directionRef.current,
      gameStateRef.current === 'gameover'
    )
  }

  // ---- 游戏结束 ----
  const handleGameOver = () => {
    gameStateRef.current = 'gameover'
    setGameState('gameover')
    clearInterval(intervalRef.current)
    intervalRef.current = 0

    const finalScore = scoreRef.current
    if (finalScore > highScore) {
      localStorage.setItem(HIGH_SCORE_KEY, String(finalScore))
      setHighScore(finalScore)
      setIsNewRecord(true)
    }
    draw()
  }

  // ---- 游戏循环（每帧） ----
  const tick = () => {
    if (gameStateRef.current !== 'playing') return

    const snake = snakeRef.current

    // 应用缓冲方向
    if (queuedDirectionRef.current) {
      directionRef.current = queuedDirectionRef.current
      queuedDirectionRef.current = null
    }

    // 计算新蛇头位置
    const head = snake[0]
    const newHead: Pos = { x: head.x, y: head.y }
    switch (directionRef.current) {
      case 'UP':    newHead.y -= 1; break
      case 'DOWN':  newHead.y += 1; break
      case 'LEFT':  newHead.x -= 1; break
      case 'RIGHT': newHead.x += 1; break
    }

    // 撞墙检测
    if (newHead.x < 0 || newHead.x >= GRID_COLS || newHead.y < 0 || newHead.y >= GRID_ROWS) {
      handleGameOver()
      return
    }

    // 撞自身检测（即将吃到食物时不去掉尾巴）
    const willEat = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y
    const bodyToCheck = willEat ? snake : snake.slice(0, -1)
    for (const seg of bodyToCheck) {
      if (seg.x === newHead.x && seg.y === newHead.y) {
        handleGameOver()
        return
      }
    }

    // 移动蛇
    snake.unshift(newHead)

    if (willEat) {
      // 吃到食物
      scoreRef.current += 10
      foodCountRef.current += 1
      setScore(scoreRef.current)

      // 加速（只有组件还在才创建新定时器）
      if (foodCountRef.current % FOOD_PER_LEVEL === 0) {
        speedRef.current = Math.max(MIN_SPEED, speedRef.current - SPEED_STEP)
        clearInterval(intervalRef.current)
        if (mountedRef.current) {
          intervalRef.current = window.setInterval(tick, speedRef.current)
        }
      }

      // 生成新食物（无空位则不动）
      const newFood = randomFood(snake)
      if (newFood) foodRef.current = newFood
    } else {
      snake.pop()
    }

    draw()
  }

  // ---- 重新开始（回到待开始状态） ----
  const restart = () => {
    snakeRef.current = initSnake()
    directionRef.current = 'RIGHT'
    queuedDirectionRef.current = null
    foodRef.current = randomFood(snakeRef.current) ?? foodRef.current
    scoreRef.current = 0
    foodCountRef.current = 0
    speedRef.current = INITIAL_SPEED
    gameStateRef.current = 'idle'
    setIsNewRecord(false)

    setScore(0)
    setGameState('idle')

    clearInterval(intervalRef.current)
    intervalRef.current = 0
    draw()
  }

  // ---- 开始游戏（清掉旧定时器防重复） ----
  const startGame = () => {
    clearInterval(intervalRef.current)
    gameStateRef.current = 'playing'
    setGameState('playing')
    intervalRef.current = window.setInterval(tick, speedRef.current)
  }

  // ---- 暂停/继续 ----
  const togglePause = () => {
    if (gameStateRef.current === 'playing') {
      gameStateRef.current = 'paused'
      setGameState('paused')
      clearInterval(intervalRef.current)
      intervalRef.current = 0
    } else if (gameStateRef.current === 'paused') {
      gameStateRef.current = 'playing'
      setGameState('playing')
      intervalRef.current = window.setInterval(tick, speedRef.current)
    }
  }

  // ---- 键盘事件（e.repeat 防连发） ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 跳过按键连发（按住不放时只触发一次）
      if (e.repeat) return

      const gs = gameStateRef.current

      // 空闲状态：按空格或回车开始游戏
      if (gs === 'idle') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          startGame()
        }
        return
      }

      // 游戏结束时按空格或回车重新开始
      if (gs === 'gameover') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          restart()
        }
        return
      }

      switch (e.code) {
        case 'ArrowUp': {
          e.preventDefault()
          const curDir = queuedDirectionRef.current || directionRef.current
          if (curDir !== 'DOWN') queuedDirectionRef.current = 'UP'
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          const curDir = queuedDirectionRef.current || directionRef.current
          if (curDir !== 'UP') queuedDirectionRef.current = 'DOWN'
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          const curDir = queuedDirectionRef.current || directionRef.current
          if (curDir !== 'RIGHT') queuedDirectionRef.current = 'LEFT'
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          const curDir = queuedDirectionRef.current || directionRef.current
          if (curDir !== 'LEFT') queuedDirectionRef.current = 'RIGHT'
          break
        }
        case 'Space':
          e.preventDefault()
          togglePause()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // 依赖为空——所有可变状态通过 ref 访问，无闭包过期问题

  // ---- 初始化（只画静态画面，不启动游戏循环） ----
  useEffect(() => {
    mountedRef.current = true
    // 惰性初始化蛇和食物位置
    snakeRef.current = initSnake()
    foodRef.current = randomFood(snakeRef.current) ?? foodRef.current
    draw()
    return () => {
      mountedRef.current = false
      clearInterval(intervalRef.current)
    }
  }, []) // 只跑一次

  // ============ 渲染 ============
  return (
    <div style={styles.container}>
      {/* 动画定义，独立于此组件 */}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <h2 style={styles.title}>🐍 贪吃蛇</h2>

      {/* 得分栏 */}
      <div style={styles.scoreBar}>
        <span>
          得分：<strong style={{ fontSize: 20, color: COLORS.primary }}>{score}</strong>
        </span>
        <span>
          最高分：<strong style={{ fontSize: 20, color: COLORS.accent }}>{highScore}</strong>
        </span>
      </div>

      {/* 画布区域 */}
      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={styles.canvas}
        />

        {/* 开始遮罩 */}
        {gameState === 'idle' && (
          <div style={styles.overlay}>
            <div style={styles.overlayInner}>
              <button style={styles.startBtn} onClick={startGame}>
                ▶ 开始游戏
              </button>
              <div style={styles.overlayHint}>按 空格键 或 Enter 开始</div>
            </div>
          </div>
        )}

        {/* 暂停遮罩 */}
        {gameState === 'paused' && (
          <div style={styles.overlay}>
            <div style={styles.overlayInner}>
              <div style={styles.overlayIcon}>⏸</div>
              <div style={styles.overlayHint}>按 空格键 继续</div>
            </div>
          </div>
        )}

        {/* 结束遮罩 */}
        {gameState === 'gameover' && (
          <div style={styles.overlay}>
            <div style={styles.overlayInner}>
              <div style={styles.overlayIcon}>💀</div>
              <div style={styles.overlayTitle}>游戏结束</div>
              <div style={styles.overlayScore}>
                得分：<strong>{score}</strong>
              </div>
              {isNewRecord && (
                <div style={styles.newRecord}>🎉 新纪录！</div>
              )}
              <button style={styles.restartOverlayBtn} onClick={restart}>
                重新开始
              </button>
              <div style={styles.overlayHint}>或按 空格键 / Enter 继续</div>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        {(gameState === 'playing' || gameState === 'paused') && (
          <button style={styles.quitBtn} onClick={restart}>
            🔄 重新开始
          </button>
        )}
      </div>

      {/* 操作说明 */}
      <div style={styles.instructions}>
        <span>← ↑ → ↓ 方向键控制</span>
        <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
        <span>空格键 开始 / 暂停</span>
      </div>
    </div>
  )
}

// ============ 样式 ============
const styles: Record<string, React.CSSProperties> = {
  container: {
    textAlign: 'center',
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    color: COLORS.textPrimary,
    margin: '0 0 16px 0',
  },
  scoreBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 14,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  canvasWrap: {
    position: 'relative' as const,
    display: 'inline-block',
    borderRadius: 12,
    boxShadow: COLORS.shadow,
    overflow: 'hidden',
    lineHeight: 0, // 去掉 canvas 下方的空白间隙
  },
  canvas: {
    display: 'block',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
  },
  overlay: {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
  },
  overlayInner: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 28,
    padding: 30,
  },
  overlayIcon: {
    fontSize: 44,
    lineHeight: 1,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#fff',
  },
  overlayScore: {
    fontSize: 24,
    color: '#fff',
  },
  newRecord: {
    fontSize: 20,
    fontWeight: 700,
    color: '#ffd700',
    animation: 'fadeIn 0.3s ease',
  },
  overlayHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  restartOverlayBtn: {
    padding: '10px 36px',
    fontSize: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  quitBtn: {
    padding: '10px 32px',
    fontSize: 16,
    border: 'none',
    borderRadius: 8,
    background: COLORS.accent,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },
  startBtn: {
    padding: '16px 56px',
    fontSize: 22,
    border: 'none',
    borderRadius: 14,
    background: '#4ecdc4',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 6px 24px rgba(78,205,196,0.45)',
    marginBottom: 8,
  },
  instructions: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 14,
    color: COLORS.textLight,
  },
}
