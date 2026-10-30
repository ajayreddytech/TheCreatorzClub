import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check,
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, Coffee,
  ClipboardCheck, GripVertical, Heart, LayoutDashboard, LogOut, Moon, MoreHorizontal, Pencil, Plus,
  Quote, Settings, Sparkles, Sun, Sunrise, Trash2, TrendingUp,
  X,
} from 'lucide-react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import './App.css'

type Entry = { log_date: string; wake_up_time: string; routine_completed: boolean }
type RoutineTask = { id: string; title: string; position: number }
type RoutineCheck = { task_id: string; log_date: string }
type ChartPoint = { date: string; value: number | null; context: number | null; label: string }
type View = 'log' | 'history' | 'insights' | 'routines' | 'settings'
type Range = 'Day' | 'Week' | 'Month' | 'Year'
type Theme = 'light' | 'dark'
type RangeControlProps = {
  range: Range
  label: string
  jumpOpen: boolean
  canMoveForward: boolean
  onRangeChange: (range: Range) => void
  onMove: (direction: number) => void
  onToggleJump: () => void
  onJump: (range: Range) => void
}

const STORAGE_KEY = 'creatorsclub.logs.v1'
const THEME_KEY = 'creatorsclub.theme.v1'
const ROUTINE_TASKS_KEY = 'creatorsclub.routine-tasks.v1'
const ROUTINE_CHECKS_KEY = 'creatorsclub.routine-checks.v1'
const quotes = [
  'The morning is a quiet invitation to begin again.',
  'A little intention at sunrise can shape the whole day.',
  'Make room for the person you are becoming.',
  'Small promises kept before breakfast build lasting trust.',
  'The first hour is yours. Give it something meaningful.',
  'Every sunrise brings a fresh page and a clear mind.',
  'Start gently. Stay steady. Let the days add up.',
  'Discipline is choosing what you want most over what you want now.',
  'A calm beginning gives the rest of the day somewhere to grow from.',
  'Progress is the practice of showing up, especially for yourself.',
  'Wake with purpose, and let your actions speak for it.',
  'Your future is shaped by the ordinary choices you repeat.',
  'Make today a little more intentional than yesterday.',
  'Focus is giving your attention to what deserves it.',
  'One good morning is a lovely place to start.',
  'Consistency turns a hopeful beginning into a way of life.',
  'The secret of getting ahead is getting started.',
  'A clear morning can make space for a brighter idea.',
  'You do not need to be perfect; you only need to begin.',
  'The sun rises without hurry. You can begin that way, too.',
  'Let your first decision today be one you feel good about.',
  'A routine is a kindness you give to your future self.',
  'Show up for the small things, and the big things become possible.',
  'Start where you are. Use the morning you have.',
  'A moment of intention can change the direction of a day.',
  'Each new morning is another chance to keep a promise.',
  'Build a life you do not need to escape from, one morning at a time.',
  'Good habits are quiet votes for the person you want to be.',
  'Make your morning a launchpad, not a waiting room.',
  'The best time to begin is the moment you decide to.',
  'A steady pace will take you further than a perfect plan.',
  'Let the quiet of morning remind you that you have time to choose.',
  'You are allowed to start small and still dream big.',
  'Wake up with a why, and the how gets a little clearer.',
  'Rituals turn ordinary days into a life with intention.',
  'Give your attention to what you want to grow.',
  'Every habit begins as a decision to try one more time.',
  'The morning rewards those who meet it with an open mind.',
  'Take a breath, find your focus, and take the next step.',
  'Progress is rarely loud. Often, it looks like trying again.',
  'Rise with gratitude for the chance to begin.',
  'Your pace is yours. Keep moving in the right direction.',
  'A thoughtful start is a gift to everyone you meet today.',
  'When you change your mornings, you make room to change your life.',
  'Little by little, a little becomes a lot.',
  'Begin with what matters, before the noise finds you.',
  'You can do hard things, one morning and one choice at a time.',
  'Let your commitment be stronger than your mood.',
  'Rest well. Rise gently. Begin with purpose.',
  'The first step does not have to be big; it just has to be yours.',
  'Today is a good day to practice becoming.',
  'Morning is not a race. It is an opportunity.',
  'A habit is built in the moments when no one is watching.',
  'Choose progress over pressure, and keep showing up.',
  'The best mornings start with a choice, not a perfect feeling.',
  'What you do consistently matters more than what you do occasionally.',
  'Make a little space for focus, and let your ideas find you.',
  'An early start is not about the clock; it is about intention.',
  'Be patient with the process and faithful to the practice.',
  'Each sunrise is proof that beginnings happen every day.',
  'Start today with the care you hope to carry through it.',
  'Your habits are the architecture of your everyday life.',
  'Put your energy where you hope to see it grow.',
  'One mindful morning can become a mindful life.',
  'Keep the promise small enough to keep, then keep it.',
  'The day belongs to no one until you choose how to meet it.',
  'A new day is a fresh chance to move with intention.',
  'Quiet focus is a powerful way to begin.',
  'Choose a morning routine that feels like coming home to yourself.',
  'Great change often starts with an unremarkable morning.',
  'You do not rise to your goals; you return to your habits.',
  'Give yourself the gift of a beginning that feels like yours.',
  'Start with gratitude. Continue with courage.',
  'The work you do on yourself is never wasted.',
  'A better day begins with one small, better choice.',
  'You have made it to a new morning. That is a reason to begin.',
]

const env = import.meta.env as Record<string, string | undefined>
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_ANON_KEY
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseTime(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':')
  return Number(hours) * 60 + Number(minutes)
}

function formatTime(time: string) {
  const [hours = '0', minutes = '00'] = time.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatMinutes(minutes: number) {
  const normalized = Math.max(0, Math.min(1439, minutes))
  return formatTime(`${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`)
}

function inclusiveDaysBetween(start: Date, end: Date) {
  const firstDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const lastDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.floor((lastDay - firstDay) / 86_400_000) + 1
}

function localInputTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function prettyDate(date: Date, options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) {
  return date.toLocaleDateString('en-US', options)
}

// Periods are calendar based: the current day, the Sunday-to-Saturday week, the calendar month, and the calendar year.
function getRangeDates(range: Range, cursor: Date) {
  const start = new Date(cursor)
  const end = new Date(cursor)
  if (range === 'Week') {
    start.setDate(start.getDate() - start.getDay())
    end.setTime(start.getTime())
    end.setDate(end.getDate() + 6)
  } else if (range === 'Month') {
    start.setDate(1)
    end.setMonth(end.getMonth() + 1, 0)
  } else if (range === 'Year') {
    start.setMonth(0, 1)
    end.setMonth(11, 31)
  }
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function RangeControls({ range, label, jumpOpen, canMoveForward, onRangeChange, onMove, onToggleJump, onJump }: RangeControlProps) {
  return (
    <div className="range-control-layout">
      <div className="range-filter-row">
      <div className="range-tabs">
        {(['Day', 'Week', 'Month', 'Year'] as Range[]).map((item) => (
          <button key={item} className={range === item ? 'selected' : ''} onClick={() => onRangeChange(item)}>{item}</button>
        ))}
      </div>
      <div className="jump-wrap">
        <button className="jump-button" onClick={onToggleJump}>Jump to <ChevronDown size={14} /></button>
        {jumpOpen && <div className="jump-menu">{(['Day', 'Week', 'Month', 'Year'] as Range[]).map((item) => <button key={item} onClick={() => onJump(item)}>Current {item}</button>)}</div>}
      </div>
      </div>
      <div className="chart-controls">
        <div className="chart-arrows">
          <button onClick={() => onMove(-1)} aria-label="Previous period"><ArrowLeft size={15} /></button>
          <button onClick={() => onMove(1)} aria-label="Next period" disabled={!canMoveForward}><ArrowRight size={15} /></button>
        </div>
        <span className="chart-period">{label}</span>
      </div>
    </div>
  )
}

function App() {
  const [view, setView] = useState<View>('log')
  const [entries, setEntries] = useState<Entry[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Entry[] }
    catch { return [] }
  })
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>(() => {
    try { return JSON.parse(localStorage.getItem(ROUTINE_TASKS_KEY) || '[]') as RoutineTask[] }
    catch { return [] }
  })
  const [routineChecks, setRoutineChecks] = useState<RoutineCheck[]>(() => {
    try { return JSON.parse(localStorage.getItem(ROUTINE_CHECKS_KEY) || '[]') as RoutineCheck[] }
    catch { return [] }
  })
  const [newTask, setNewTask] = useState('')
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{ id: string; fromIndex: number; dy: number; targetIndex: number } | null>(null)
  const dragRef = useRef<{ id: string; fromIndex: number; startY: number; centers: number[] } | null>(null)
  const [taskDraft, setTaskDraft] = useState('')
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY)
    return saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [today] = useState(() => new Date())
  const todayKey = dateKey(today)
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const todayEntry = entries.find((entry) => entry.log_date === todayKey)
  const selectedEntry = entries.find((entry) => entry.log_date === selectedDate)
  const [wakeTime, setWakeTime] = useState(todayEntry?.wake_up_time || localInputTime(today))
  const [routine, setRoutine] = useState(todayEntry?.routine_completed ?? false)
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editTime, setEditTime] = useState('06:00')
  const [editRoutine, setEditRoutine] = useState(false)
  const [range, setRange] = useState<Range>('Week')
  const [rangeCursor, setRangeCursor] = useState(() => new Date(today))
  const [jumpOpen, setJumpOpen] = useState<'chart' | 'routine' | null>(null)
  const [settingsTab, setSettingsTab] = useState('Privacy')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<{ email?: string; name?: string; avatar?: string } | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(() => Number(dateKey(new Date()).replace(/-/g, '')) % quotes.length)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  useEffect(() => {
    localStorage.setItem(ROUTINE_TASKS_KEY, JSON.stringify(routineTasks))
  }, [routineTasks])

  useEffect(() => {
    localStorage.setItem(ROUTINE_CHECKS_KEY, JSON.stringify(routineChecks))
  }, [routineChecks])

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    const syncUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) { setMessage(`Could not check your cloud session: ${sessionError.message}`); return }
      if (!mounted) return
      const currentUser = session?.user
      setUser(currentUser ? {
        email: currentUser.email,
        name: currentUser.user_metadata.full_name || currentUser.user_metadata.name,
        avatar: currentUser.user_metadata.avatar_url,
      } : null)
      if (currentUser) {
        const { data, error } = await supabase.from('daily_logs').select('log_date,wake_up_time,routine_completed').order('log_date')
        if (error) { setMessage(`Cloud sync failed: ${error.message}`); return }
        if (mounted && data) {
          const cloudEntries = data as Entry[]
          const cloudEntry = cloudEntries.find((entry) => entry.log_date === selectedDate)
          setEntries(cloudEntries)
          const { data: tasks, error: tasksError } = await supabase.from('routine_tasks').select('id,title,position').order('position')
          if (tasksError) { setMessage(`Routine checklist sync failed: ${tasksError.message}`); return }
          const { data: checks, error: checksError } = await supabase.from('daily_routine_checks').select('task_id,log_date')
          if (checksError) { setMessage(`Routine checklist sync failed: ${checksError.message}`); return }
          if (!mounted) return
          setRoutineTasks(tasks as RoutineTask[])
          setRoutineChecks(checks as RoutineCheck[])
          setWakeTime(cloudEntry?.wake_up_time ?? (selectedDate === todayKey ? localInputTime(new Date()) : '06:00'))
          setRoutine(cloudEntry?.routine_completed ?? false)
        }
      }
    }
    void syncUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user
      setUser(currentUser ? {
        email: currentUser.email,
        name: currentUser.user_metadata.full_name || currentUser.user_metadata.name,
        avatar: currentUser.user_metadata.avatar_url,
      } : null)
      if (currentUser) window.setTimeout(() => { void syncUser() }, 0)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [selectedDate, todayKey])

  const saveEntry = async (entry: Entry, syncDraft = true) => {
    const previous = entries
    setEntries((current) => [...current.filter((item) => item.log_date !== entry.log_date), entry].sort((a, b) => a.log_date.localeCompare(b.log_date)))
    if (supabase && user) {
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authenticatedUser) {
        setEntries(previous)
        setMessage(`Could not verify your cloud account${authError ? `: ${authError.message}` : '.'}`)
        return
      }
      const { error } = await supabase.from('daily_logs').upsert({
        ...entry,
        user_id: authenticatedUser.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,log_date' })
      if (error) { setEntries(previous); setMessage(`Could not save to the cloud: ${error.message}`); return }
    }
    if (syncDraft && entry.log_date === selectedDate) {
      setWakeTime(entry.wake_up_time)
      setRoutine(entry.routine_completed)
    }
    setMessage('Your morning is logged. Nice work!')
    window.setTimeout(() => setMessage(''), 3000)
  }

  // Each log-page control saves on its own. The untouched field keeps its stored value,
  // or the current draft when the date has no entry yet.
  const saveWakeTime = () => void saveEntry({
    log_date: selectedDate,
    wake_up_time: wakeTime,
    routine_completed: selectedEntry?.routine_completed ?? false,
  }, false)

  const saveRoutineStatus = () => void saveEntry({
    log_date: selectedDate,
    wake_up_time: selectedEntry?.wake_up_time ?? wakeTime,
    routine_completed: routine,
  }, false)

  const deleteEntry = async (key: string) => {
    const previous = entries
    setEntries((current) => current.filter((entry) => entry.log_date !== key))
    setEditingDate(null)
    if (supabase && user) {
      const { error } = await supabase.from('daily_logs').delete().eq('log_date', key)
      if (error) { setEntries(previous); setMessage(`Could not delete from the cloud: ${error.message}`); return }
    }
    if (key === selectedDate) {
      setWakeTime(key === todayKey ? localInputTime(new Date()) : '06:00')
      setRoutine(false)
    }
  }

  const saveRoutineTask = async (task: RoutineTask, isNew: boolean) => {
    const previous = routineTasks
    setRoutineTasks((current) => isNew
      ? [...current, task].sort((a, b) => a.position - b.position)
      : current.map((item) => item.id === task.id ? task : item))
    if (supabase && user) {
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authenticatedUser) {
        setRoutineTasks(previous)
        setMessage(`Could not verify your cloud account${authError ? `: ${authError.message}` : '.'}`)
        return
      }
      const result = isNew
        ? await supabase.from('routine_tasks').insert({ ...task, user_id: authenticatedUser.id })
        : await supabase.from('routine_tasks').update({ title: task.title }).eq('id', task.id)
      if (result.error) {
        setRoutineTasks(previous)
        setMessage(`Could not save the routine task: ${result.error.message}`)
        return
      }
    }
    setNewTask('')
    setEditingTask(null)
  }

  const deleteRoutineTask = async (taskId: string) => {
    const previousTasks = routineTasks
    const previousChecks = routineChecks
    setRoutineTasks((current) => current.filter((task) => task.id !== taskId))
    setRoutineChecks((current) => current.filter((check) => check.task_id !== taskId))
    if (supabase && user) {
      const { error } = await supabase.from('routine_tasks').delete().eq('id', taskId)
      if (error) {
        setRoutineTasks(previousTasks)
        setRoutineChecks(previousChecks)
        setMessage(`Could not delete the routine task: ${error.message}`)
      }
    }
  }

  const reorderRoutineTask = async (taskId: string, toIndex: number) => {
    const fromIndex = routineTasks.findIndex((task) => task.id === taskId)
    if (fromIndex < 0 || toIndex < 0 || toIndex >= routineTasks.length || toIndex === fromIndex) return
    const previous = routineTasks
    const reordered = [...routineTasks]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    const positioned = reordered.map((task, position) => ({ ...task, position }))
    const changed = positioned.filter((task) => previous.find((item) => item.id === task.id)?.position !== task.position)
    setRoutineTasks(positioned)
    if (supabase && user) {
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authenticatedUser) {
        setRoutineTasks(previous)
        setMessage(`Could not verify your cloud account${authError ? `: ${authError.message}` : '.'}`)
        return
      }
      const results = await Promise.all(changed.map((task) => supabase.from('routine_tasks').update({ position: task.position }).eq('id', task.id)))
      const failed = results.find((result) => result.error)
      if (failed?.error) {
        setRoutineTasks(previous)
        setMessage(`Could not reorder the routine: ${failed.error.message}`)
      }
    }
  }

  // Drag a step by its grip handle. Rows keep their place while dragging; a line shows where it will land,
  // and the new order is saved when the pointer is released.
  const routineDropTarget = (drag: { fromIndex: number; startY: number; centers: number[] }, clientY: number) => {
    const dy = clientY - drag.startY
    const draggedCenter = drag.centers[drag.fromIndex] + dy
    const targetIndex = drag.centers.filter((center, index) => index !== drag.fromIndex && center < draggedCenter).length
    return { dy, targetIndex }
  }

  const startRoutineDrag = (event: PointerEvent<HTMLButtonElement>, taskId: string, fromIndex: number) => {
    const list = event.currentTarget.closest('.routine-task-list')
    if (!list) return
    const centers = Array.from(list.querySelectorAll<HTMLElement>('[data-routine-task]')).map((row) => {
      const rect = row.getBoundingClientRect()
      return rect.top + rect.height / 2
    })
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { id: taskId, fromIndex, startY: event.clientY, centers }
    setDragState({ id: taskId, fromIndex, dy: 0, targetIndex: fromIndex })
  }

  const moveRoutineDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const { dy, targetIndex } = routineDropTarget(drag, event.clientY)
    setDragState({ id: drag.id, fromIndex: drag.fromIndex, dy, targetIndex })
  }

  const endRoutineDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragState(null)
    if (!drag) return
    const { targetIndex } = routineDropTarget(drag, event.clientY)
    if (targetIndex !== drag.fromIndex) void reorderRoutineTask(drag.id, targetIndex)
  }

  const toggleRoutineCheck = async (taskId: string) => {
    const isComplete = routineChecks.some((check) => check.task_id === taskId && check.log_date === selectedDate)
    const previous = routineChecks
    setRoutineChecks(isComplete
      ? previous.filter((check) => !(check.task_id === taskId && check.log_date === selectedDate))
      : [...previous, { task_id: taskId, log_date: selectedDate }])
    if (supabase && user) {
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authenticatedUser) {
        setRoutineChecks(previous)
        setMessage(`Could not verify your cloud account${authError ? `: ${authError.message}` : '.'}`)
        return
      }
      const result = isComplete
        ? await supabase.from('daily_routine_checks').delete().eq('task_id', taskId).eq('log_date', selectedDate)
        : await supabase.from('daily_routine_checks').insert({ user_id: authenticatedUser.id, task_id: taskId, log_date: selectedDate })
      if (result.error) {
        setRoutineChecks(previous)
        setMessage(`Could not update the routine checklist: ${result.error.message}`)
      }
    }
  }

  const signInWithGoogle = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setMessage(`Google sign-in failed: ${error.message}`)
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(`Could not sign out: ${error.message}`)
  }

  const startEdit = (key: string, entry?: Entry) => {
    setEditingDate(key)
    setEditTime(entry?.wake_up_time ?? '06:00')
    setEditRoutine(entry?.routine_completed ?? false)
  }

  const selectDate = (key: string) => {
    if (!key) return
    setSelectedDate(key)
    const entry = entries.find((item) => item.log_date === key)
    setWakeTime(entry?.wake_up_time ?? (key === todayKey ? localInputTime(today) : '06:00'))
    setRoutine(entry?.routine_completed ?? false)
  }

  const activeDates = useMemo(() => getRangeDates(range, rangeCursor), [range, rangeCursor])
  const periodEntries = useMemo(() => entries.filter((entry) => {
    const d = new Date(`${entry.log_date}T12:00:00`)
    return d >= activeDates.start && d <= activeDates.end
  }), [entries, activeDates])
  const average = periodEntries.length
    ? Math.round(periodEntries.reduce((sum, entry) => sum + parseTime(entry.wake_up_time), 0) / periodEntries.length)
    : null
  const routineRate = periodEntries.length
    ? Math.round((periodEntries.filter((entry) => entry.routine_completed).length / periodEntries.length) * 100)
    : null
  const earliestWake = periodEntries.length
    ? Math.min(...periodEntries.map((entry) => parseTime(entry.wake_up_time)))
    : null
  const chartData = useMemo(() => {
    if (range === 'Year') {
      const points: ChartPoint[] = []
      const monthStart = new Date(activeDates.start.getFullYear(), activeDates.start.getMonth(), 1)
      while (monthStart <= activeDates.end) {
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999)
        const bucketStart = monthStart < activeDates.start ? activeDates.start : monthStart
        const bucketEnd = monthEnd > activeDates.end ? activeDates.end : monthEnd
        const bucketEntries = entries.filter((entry) => {
          const d = new Date(`${entry.log_date}T12:00:00`)
          return d >= bucketStart && d <= bucketEnd
        })
        const averageTime = bucketEntries.length
          ? Math.round(bucketEntries.reduce((sum, entry) => sum + parseTime(entry.wake_up_time), 0) / bucketEntries.length)
          : null
        const short = monthStart.toLocaleDateString('en-US', { month: 'short' })
        points.push({
          date: dateKey(monthStart).slice(0, 7),
          value: averageTime,
          context: averageTime,
          label: monthStart.getMonth() === 0 ? `${short} ${monthStart.getFullYear()}` : short,
        })
        monthStart.setMonth(monthStart.getMonth() + 1)
      }
      return points
    }
    // Week and Month also draw a faded run of days from the neighbouring periods so the edges are not cut off.
    // Those extra days are shown on the chart only and are left out of the insight numbers.
    const contextDays = range === 'Week' || range === 'Month' ? 3 : 0
    const firstDay = new Date(activeDates.start)
    firstDay.setDate(firstDay.getDate() - contextDays)
    const total = inclusiveDaysBetween(firstDay, activeDates.end) + contextDays
    const periodStartKey = dateKey(activeDates.start)
    const periodEndKey = dateKey(activeDates.end)
    const points: ChartPoint[] = []
    for (let i = 0; i < total; i++) {
      const date = new Date(firstDay)
      date.setDate(date.getDate() + i)
      const key = dateKey(date)
      const found = entries.find((entry) => entry.log_date === key)
      const wake = found ? parseTime(found.wake_up_time) : null
      const inPeriod = key >= periodStartKey && key <= periodEndKey
      points.push({
        date: key,
        value: inPeriod ? wake : null,
        context: wake,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    return points
  }, [activeDates, entries, range])
  const chartDomain = useMemo(() => {
    const values = chartData.flatMap((point) => point.context === null ? [] : [point.context])
    if (values.length === 0) return [120, 840] as [number, number]
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const padding = Math.max(30, Math.ceil((maxValue - minValue) * 0.2))
    let lower = Math.max(0, Math.floor((minValue - padding) / 30) * 30)
    let upper = Math.min(1439, Math.ceil((maxValue + padding) / 30) * 30)
    if (upper - lower < 120) {
      const extra = 120 - (upper - lower)
      lower = Math.max(0, lower - Math.ceil(extra / 60) * 30)
      upper = Math.min(1439, upper + Math.ceil(extra / 60) * 30)
    }
    return [lower, upper] as [number, number]
  }, [chartData])
  const chartTicks = useMemo(() => {
    const step = Math.max(30, Math.ceil((chartDomain[1] - chartDomain[0]) / 180) * 30)
    const ticks: number[] = []
    for (let tick = Math.ceil(chartDomain[0] / step) * step; tick <= chartDomain[1]; tick += step) {
      ticks.push(tick)
    }
    return ticks
  }, [chartDomain])
  // Calendar layout. Year: one row per month (Jan to Dec), days 1-31 across.
  // Week and Month: Sunday-first rows of 7 days. Null cells are blank padding.
  const routineRows = useMemo(() => {
    const year = activeDates.start.getFullYear()
    if (range === 'Day') return { columns: 1, rows: [{ label: '', cells: [new Date(activeDates.start)] as (Date | null)[] }] }
    if (range === 'Year') {
      const rows = Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        return {
          label: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' }),
          cells: Array.from({ length: 31 }, (_, index) => index < daysInMonth ? new Date(year, month, index + 1) : null),
        }
      })
      return { columns: 31, rows }
    }
    const days = inclusiveDaysBetween(activeDates.start, activeDates.end)
    const cells: (Date | null)[] = Array.from({ length: activeDates.start.getDay() }, () => null)
    for (let index = 0; index < days; index++) {
      const date = new Date(activeDates.start)
      date.setDate(date.getDate() + index)
      cells.push(date)
    }
    while (cells.length % 7) cells.push(null)
    const rows = Array.from({ length: cells.length / 7 }, (_, row) => ({ label: '', cells: cells.slice(row * 7, row * 7 + 7) }))
    return { columns: 7, rows }
  }, [activeDates, range])
  const calendarDays = useMemo(() => {
    const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1)
    return {
      leadingBlanks: (firstDay.getDay() + 6) % 7,
      dates: Array.from({ length: new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0).getDate() }, (_, index) =>
        new Date(monthCursor.getFullYear(), monthCursor.getMonth(), index + 1)),
    }
  }, [monthCursor])

  const moveRange = (direction: number) => {
    const next = new Date(rangeCursor)
    if (range === 'Day') next.setDate(next.getDate() + direction)
    if (range === 'Week') next.setDate(next.getDate() + direction * 7)
    if (range === 'Month') { next.setDate(1); next.setMonth(next.getMonth() + direction) }
    if (range === 'Year') { next.setMonth(0, 1); next.setFullYear(next.getFullYear() + direction) }
    setRangeCursor(next > today ? new Date(today) : next)
  }
  const jumpTo = (period: Range) => { setRange(period); setRangeCursor(new Date(today)); setJumpOpen(null) }
  const rangeLabel = range === 'Day' ? prettyDate(rangeCursor) :
    range === 'Week' ? `${prettyDate(activeDates.start, { month: 'short', day: 'numeric' })} – ${prettyDate(activeDates.end, { month: 'short', day: 'numeric', year: 'numeric' })}` :
      range === 'Month' ? prettyDate(rangeCursor, { month: 'long', year: 'numeric' }) : String(rangeCursor.getFullYear())
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)
  // Forward is allowed only while the viewed period ends before today's period starts.
  const canMoveForward = activeDates.end < todayStart
  const insightBasis = range === 'Day' ? 'the selected day' : `the selected ${range.toLowerCase()}`

  const navItems: { id: View; label: string; icon: typeof Sunrise }[] = [
    { id: 'log', label: 'Good morning', icon: Sunrise },
    { id: 'history', label: 'History', icon: CalendarDays },
    { id: 'insights', label: 'Insights', icon: LayoutDashboard },
    { id: 'routines', label: 'My routine', icon: ClipboardCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <div className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-button ${view === id ? 'active' : ''}`} onClick={() => setView(id)} aria-label={label} title={label}>
              <Icon size={20} strokeWidth={1.8} />
              <span className="nav-tooltip">{label}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="top-brand"><img className="top-brand-logo" src="/the-creatorz-club-logo.png" alt="" /><span>TheCreatorzClub</span></div>
          <div className="topbar-right">
            <button className="header-theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} title="Switch theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        <main className="page-content">
          {message && <motion.div className={`toast ${message.startsWith('Could') || message.startsWith('Cloud') || message.includes('sync failed') ? 'error-toast' : ''}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><CheckCircle2 size={17} />{message}<button onClick={() => setMessage('')} aria-label="Dismiss message"><X size={15} /></button></motion.div>}

          {view === 'log' && (
            <div className="dashboard-grid log-dashboard-grid">
              <div className="primary-column">
                <div className="page-heading">
                  <div><p className="eyebrow"><span className="live-dot" /> YOUR DAILY PRACTICE</p><h1>Good morning<span className="heading-period">.</span></h1><p className="heading-subtitle">A fresh start is waiting for you.</p></div>
                  <label className="heading-date"><span className="date-icon"><CalendarDays size={17} /></span><input aria-label="Date for morning log" type="date" value={selectedDate} max={todayKey} onChange={(event) => selectDate(event.target.value)} /></label>
                </div>

                <div className="log-layout">
                  <motion.section className="card log-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="card-topline"><div className="section-icon sunrise-icon"><Sunrise size={19} /></div><span className="card-kicker">DAILY CHECK-IN</span><span className="today-pill">{selectedEntry ? 'LOGGED' : 'YOUR DAILY MOMENT'}</span></div>
                    <h2>What time did you wake up?</h2>
                    <p className="card-description">Every intentional morning starts somewhere.</p>
                    <div className="time-picker-wrap"><Clock3 size={18} /><input aria-label="Wake-up time" type="time" value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} /><span className="time-hint">LOCAL TIME</span></div>
                    <div className="field-save-row"><button className="button button-soft field-save-button" onClick={saveWakeTime}>Save wake-up time<ArrowRight size={14} /></button></div>
                    <button className={`routine-row ${routine ? 'routine-checked' : ''}`} onClick={() => setRoutine(!routine)} role="checkbox" aria-checked={routine}>
                      <span className="custom-checkbox">{routine && <Check size={15} strokeWidth={3} />}</span>
                      <span className="routine-copy"><strong>Morning routine complete</strong><small>Did you make time for yourself today?</small></span>
                      <span className={`yes-no ${routine ? 'yes' : ''}`}>{routine ? 'Yes' : 'Not yet'}</span>
                    </button>
                    <div className="field-save-row"><button className="button button-soft field-save-button" onClick={saveRoutineStatus}>Save routine status<ArrowRight size={14} /></button></div>
                    <div className="log-footer">
                      <span><span className="privacy-dot" /> Just for you, always</span>
                      {selectedEntry && <span className="logged-note"><Check size={12} /> Logged for {selectedDate === todayKey ? 'today' : prettyDate(new Date(`${selectedDate}T12:00:00`), { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </motion.section>

                  <section className="quote-card">
                    <div className="quote-art"><Quote size={21} /></div>
                    <div className="quote-copy"><span className="quote-label">A THOUGHT FOR YOUR MORNING</span><p>“{quotes[quoteIndex]}”</p><button className="quote-refresh" onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)}><Sparkles size={14} /> A little inspiration</button></div>
                    <div className="quote-sun"><Sunrise size={95} strokeWidth={0.8} /></div>
                  </section>
                </div>
                <section className="streak-banner log-encouragement"><span className="streak-banner-icon"><Sunrise size={21} /></span><div><strong>Every morning is a new chance to show up.</strong><span>One intentional day at a time.</span></div></section>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="subpage">
              <div className="page-heading"><div><p className="eyebrow"><span className="live-dot" /> YOUR JOURNEY SO FAR</p><h1>Morning history<span className="heading-period">.</span></h1><p className="heading-subtitle">Every day you show up is part of the story.</p></div><div className="history-total"><strong>{entries.length}</strong><span>mornings logged</span></div></div>
              <section className="card calendar-card">
                <div className="calendar-toolbar"><div><h2>{prettyDate(monthCursor, { month: 'long', year: 'numeric' })}</h2><p>Click any day to add or edit a check-in.</p></div><div className="calendar-arrows"><button aria-label="Previous month" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><button className="today-calendar" onClick={() => setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</button><button aria-label="Next month" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div></div>
                <div className="calendar-grid">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
                  {Array.from({ length: calendarDays.leadingBlanks }, (_, index) => <span key={`calendar-blank-${index}`} className="calendar-placeholder" />)}
                  {calendarDays.dates.map((date) => {
                    const key = dateKey(date)
                    const entry = entries.find((item) => item.log_date === key)
                    return <button key={key} disabled={date > today} className={`calendar-day ${key === todayKey ? 'calendar-today' : ''} ${entry ? 'has-entry' : ''}`} onClick={() => startEdit(key, entry)} aria-label={`${prettyDate(date)}${entry ? `, woke at ${formatTime(entry.wake_up_time)}, routine ${entry.routine_completed ? 'complete' : 'not complete'}` : ', no entry'}`}>
                      <span className="day-number">{date.getDate()}</span>{entry && <><span className="day-wake">{formatTime(entry.wake_up_time)}</span><span className={entry.routine_completed ? 'day-check' : 'day-cross'}>{entry.routine_completed ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}</span></>}
                    </button>
                  })}
                </div>
                <div className="calendar-legend"><span><Check size={12} className="legend-check" /> Routine complete</span><span><X size={12} className="legend-cross" /> Routine not complete</span><span><i className="legend-dot" /> No entry</span></div>
              </section>
            </div>
          )}

          {view === 'routines' && (
            <div className="subpage routine-page">
              <div className="page-heading">
                <div><p className="eyebrow"><span className="live-dot" /> YOUR PERSONAL RITUAL</p><h1>My morning routine<span className="heading-period">.</span></h1><p className="heading-subtitle">Create a checklist that feels like yours, then check in one step at a time.</p></div>
                <label className="heading-date"><span className="date-icon"><CalendarDays size={17} /></span><input aria-label="Checklist date" type="date" value={selectedDate} max={todayKey} onChange={(event) => selectDate(event.target.value)} /></label>
              </div>
              <section className="card routine-list-card">
                <div className="section-heading"><div><h3>{prettyDate(new Date(`${selectedDate}T12:00:00`), { weekday: 'long', month: 'long', day: 'numeric' })}</h3><p>Small, thoughtful steps make a morning your own.</p></div><span className="contribution-total">{routineChecks.filter((check) => check.log_date === selectedDate).length} / {routineTasks.length} complete</span></div>
                <form className="routine-add-form" onSubmit={(event) => {
                  event.preventDefault()
                  const title = newTask.trim()
                  if (title) void saveRoutineTask({ id: crypto.randomUUID(), title, position: Math.max(-1, ...routineTasks.map((task) => task.position)) + 1 }, true)
                }}>
                  <input aria-label="New routine step" value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Add a step to your morning..." maxLength={120} />
                  <button className="button button-primary" type="submit" disabled={!newTask.trim()}><Plus size={16} /> Add step</button>
                </form>
                {routineTasks.length ? <div className="routine-task-list">{routineTasks.map((task, index) => {
                  const complete = routineChecks.some((check) => check.task_id === task.id && check.log_date === selectedDate)
                  const dropClass = dragState && dragState.id !== task.id && dragState.targetIndex === index
                    ? dragState.targetIndex < dragState.fromIndex ? 'drop-above' : 'drop-below'
                    : ''
                  const isDragging = dragState?.id === task.id
                  return <div data-routine-task className={`routine-task ${complete ? 'routine-task-complete' : ''} ${isDragging ? 'dragging' : ''} ${dropClass}`} style={isDragging ? { transform: `translateY(${dragState.dy}px)` } : undefined} key={task.id}>
                    <button className="routine-drag-handle" title="Drag to reorder" aria-label={`Drag to reorder ${task.title}. Focus and press up or down arrow keys to move it.`} onPointerDown={(event) => startRoutineDrag(event, task.id, index)} onPointerMove={moveRoutineDrag} onPointerUp={endRoutineDrag} onPointerCancel={endRoutineDrag} onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') { event.preventDefault(); void reorderRoutineTask(task.id, index - 1) }
                      if (event.key === 'ArrowDown') { event.preventDefault(); void reorderRoutineTask(task.id, index + 1) }
                    }}><GripVertical size={16} /></button>
                    <button className="routine-task-check" onClick={() => void toggleRoutineCheck(task.id)} role="checkbox" aria-checked={complete} aria-label={`${complete ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}>{complete && <Check size={15} strokeWidth={3} />}</button>
                    {editingTask === task.id
                      ? <form className="routine-task-edit" onSubmit={(event) => { event.preventDefault(); const title = taskDraft.trim(); if (title) void saveRoutineTask({ ...task, title }, false) }}><input aria-label="Edit routine step" value={taskDraft} maxLength={120} onChange={(event) => setTaskDraft(event.target.value)} autoFocus /><button className="task-action-save" type="submit">Save</button></form>
                      : <span className="routine-task-title">{task.title}</span>}
                    <div className="routine-task-actions">
                      <button aria-label={`Edit ${task.title}`} title="Edit step" onClick={() => { setEditingTask(task.id); setTaskDraft(task.title) }}><Pencil size={15} /></button>
                      <button aria-label={`Delete ${task.title}`} title="Delete step" onClick={() => void deleteRoutineTask(task.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                })}</div> : <div className="routine-empty"><span className="empty-icon"><ClipboardCheck size={17} /></span><span><strong>Your routine starts with you.</strong><br />Add your first step above. You can edit or remove it whenever your mornings change.</span></div>}
                <p className="routine-storage-note">{supabase && user ? 'Your routine and daily checkmarks sync with your account.' : 'Your routine and daily checkmarks are saved on this device.'}</p>
              </section>
            </div>
          )}

          {view === 'insights' && (
            <div className="subpage insights-page">
              <div className="page-heading"><div><p className="eyebrow"><span className="live-dot" /> YOUR PATTERNS, MADE CLEAR</p><h1>Morning insights<span className="heading-period">.</span></h1><p className="heading-subtitle">Notice the little things. Celebrate your progress.</p></div><div className="insights-meta"><span className="insight-range-icon"><TrendingUp size={16} /></span><span>{periodEntries.length} {periodEntries.length === 1 ? 'check-in' : 'check-ins'} in view</span></div></div>
              <div className="insights-dashboard">
                <div className="insights-visualizations">
                <section className="card chart-card">
                  <div className="chart-header"><div><div className="section-icon chart-icon"><TrendingUp size={18} /></div><h2>Wake-up rhythm</h2><p>Your earlier mornings rise to the top.</p></div></div>
                  <div className="range-control-group"><RangeControls range={range} label={rangeLabel} jumpOpen={jumpOpen === 'chart'} canMoveForward={canMoveForward} onRangeChange={setRange} onMove={moveRange} onToggleJump={() => setJumpOpen(jumpOpen === 'chart' ? null : 'chart')} onJump={jumpTo} /></div>
                  <div className="chart-body"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}><defs><linearGradient id="wakeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.24} /><stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickMargin={12} minTickGap={18} /><YAxis width={55} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickFormatter={(value: number) => formatMinutes(value)} domain={chartDomain} ticks={chartTicks} reversed /><Tooltip content={({ active, payload }) => active && payload?.[0] ? <div className="chart-tooltip"><span>{payload[0].payload.date}</span><strong>{formatMinutes(Number(payload[0].value))}</strong></div> : null} />{(range === 'Week' || range === 'Month') && <Area type="monotone" dataKey="context" stroke="var(--chart-accent)" strokeOpacity={0.28} strokeWidth={2} fill="none" connectNulls={false} activeDot={false} />}<Area type="monotone" dataKey="value" stroke="var(--chart-accent)" strokeWidth={2.5} fill="url(#wakeGradient)" connectNulls={false} activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }} /></AreaChart></ResponsiveContainer></div>
                  <div className="chart-footnote"><span className="chart-key" /> Wake-up time <span className="chart-footnote-spacer" /><span className="early-note"><ArrowUpRight size={14} /> Earlier is higher</span></div>
                </section>
                <div className="insights-lower">
                <section className="card contribution-card">
                  <div className="section-heading routine-section-heading"><div className="routine-heading-title"><span className="routine-heading-icon"><ClipboardCheck size={17} /></span><div><h3>Routine rhythm</h3><p>One tile per day, covering {insightBasis}.</p></div></div><span className="contribution-total">{periodEntries.filter((entry) => entry.routine_completed).length} complete</span></div>
                  <div className="range-control-group routine-range-controls"><RangeControls range={range} label={rangeLabel} jumpOpen={jumpOpen === 'routine'} canMoveForward={canMoveForward} onRangeChange={setRange} onMove={moveRange} onToggleJump={() => setJumpOpen(jumpOpen === 'routine' ? null : 'routine')} onJump={jumpTo} /></div>
                  <div className={`contribution-rows ${range === 'Year' ? 'year-rows' : ''}`}>
                    {(range === 'Week' || range === 'Month') && <div className="routine-weekdays">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>}
                    {routineRows.rows.map((row, rowIndex) => <div className="contribution-row" key={rowIndex}>
                      {row.label && <span className="contribution-row-label">{row.label}</span>}
                      <div className="contribution-row-cells" style={{ gridTemplateColumns: `repeat(${routineRows.columns}, minmax(0, 1fr))` }}>
                        {row.cells.map((day, index) => {
                          if (!day) return <span key={`blank-${rowIndex}-${index}`} className="contribution-placeholder" />
                          const key = dateKey(day)
                          const entry = entries.find((item) => item.log_date === key)
                          const status = entry ? entry.routine_completed ? 'routine complete' : 'routine not complete' : 'no entry'
                          return <button key={key} className={`contribution-cell ${entry?.routine_completed ? 'complete' : ''}`} data-tip={`${prettyDate(day)} — ${status}`} aria-label={`${prettyDate(day)} — ${status}`} />
                        })}
                      </div>
                    </div>)}
                  </div>
                  <div className="contribution-legend"><span><i className="legend-empty" /> No entry</span><span><i className="legend-complete" /> Routine complete</span><span><i className="legend-incomplete" /> Routine not complete</span></div>
                </section>
                </div>
                </div>
                <section className="card metrics-card"><div className="section-heading"><div><h3>{range} insights</h3><p>Based on {insightBasis} · {rangeLabel}</p></div><Sparkles size={17} className="metrics-sparkle" /></div><div className="metrics-grid">
                  <div className="insight-stat"><span><Clock3 size={15} /> AVERAGE WAKE-UP</span><strong>{average === null ? '—' : formatMinutes(average)}</strong></div>
                  <div className="insight-stat"><span><CheckCircle2 size={15} /> ROUTINE COMPLETION</span><strong>{routineRate === null ? '—' : `${routineRate}%`}</strong></div>
                  <div className="insight-stat"><span><Sunrise size={15} /> EARLIEST WAKE-UP</span><strong>{earliestWake === null ? '—' : formatMinutes(earliestWake)}</strong></div>
                </div></section>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="subpage">
              <div className="page-heading"><div><p className="eyebrow"><span className="live-dot" /> MAKE IT YOURS</p><h1>Your settings<span className="heading-period">.</span></h1><p className="heading-subtitle">A few details to make your mornings feel at home.</p></div></div>
              <div className="settings-layout">
                <div className="settings-main">
                  <section className="card account-card"><div className="settings-section-title"><span className="settings-icon"><Heart size={17} /></span><div><h3>Your account</h3><p>Keep your mornings safe and in sync.</p></div></div><div className="account-profile"><span className="avatar account-avatar">{user?.avatar ? <img src={user.avatar} alt="" /> : <span>{user?.name?.[0] ?? 'A'}</span>}</span><div className="account-info"><strong>{user?.name || 'Your personal space'}</strong><span>{user?.email || (supabase ? 'Sign in to sync across your devices' : 'Your entries and routine checklist are saved on this device')}</span></div>{user && supabase ? <button className="button button-soft" onClick={() => void signOut()}><LogOut size={15} /> Sign out</button> : <button className="button button-primary sync-button" disabled={!supabase} onClick={() => void signInWithGoogle()}><span className="google-g">G</span> {supabase ? 'Continue with Google' : 'Cloud sync unavailable'}</button>}</div><div className={`sync-status ${supabase ? 'sync-ready' : ''}`}><span />{supabase ? user ? 'Your account, check-ins, and routine checklist are connected and syncing.' : 'Google sign-in is ready. Add your Supabase project credentials to connect.' : 'Local mode is on. Your entries and routine checklist stay on this device and are never sent anywhere.'}</div></section>
                  <div className="settings-bottom-pair">
                    <section className="card feedback-card"><div className="settings-section-title"><span className="settings-icon"><Heart size={17} /></span><div><h3>Make it better</h3></div></div><div className="feedback-row"><span>Share an idea or feature request.</span><button className="button button-soft" onClick={() => setFeedbackOpen(true)}>Share feedback <ArrowRight size={15} /></button></div></section>
                    <section className="card legal-card"><div className="settings-section-title"><span className="settings-icon"><MoreHorizontal size={18} /></span><div><h3>The fine print</h3></div></div><div className="legal-tabs">{['Privacy', 'Terms', 'Licenses'].map((tab) => <button className={settingsTab === tab ? 'selected' : ''} key={tab} onClick={() => setSettingsTab(tab)}>{tab}</button>)}</div><div className="legal-copy">{settingsTab === 'Privacy' ? <><strong>Your mornings belong to you.</strong><p>Your check-ins stay in this browser unless you enable Supabase sync; your data isn’t sold or used for ads.</p><span>Last updated: October 2026</span></> : settingsTab === 'Terms' ? <><strong>A gentle agreement.</strong><p>Use The Creatorz Club for personal habit tracking. The app is provided as-is; your routine and health decisions remain your own.</p><span>Last updated: October 2026</span></> : <><strong>Built with good company.</strong><p>React, Vite, TypeScript, Lucide, Recharts, Framer Motion, and Supabase JS.</p><span>Each project retains its respective license.</span></>}</div></section>
                  </div>
                </div>
                <aside className="settings-side"><section className="coffee-card"><span className="coffee-icon"><Coffee size={20} /></span><span className="coffee-eyebrow">MADE WITH CARE</span><h3>Enjoying a<br />quieter morning?</h3><p>If The Creatorz Club has been a little help, you can support its continued growth.</p><a href="https://ko-fi.com/ajayreddytech" target="_blank" rel="noreferrer" className="coffee-link">Support on Ko-fi <ArrowUpRight size={15} /></a><span className="coffee-art">☼</span></section><section className="card app-info-card"><span className="info-eyebrow">ABOUT THE APP</span><h3>The Creatorz Club</h3><p>A little space for a better start.</p><div className="info-divider" /><div className="info-row"><span>Version</span><strong>v1.0.0</strong></div><div className="info-row"><span>Support</span><a href="mailto:ajayreddy.tech@gmail.com">Get in touch <ArrowUpRight size={12} /></a></div><div className="info-footer"><Sunrise size={15} /> Made for morning people & morning people in progress.</div></section><p className="settings-made">Made with care, for The Creatorz Club.</p></aside>
              </div>
            </div>
          )}
        </main>
      </div>

      {editingDate && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setEditingDate(null) }}><motion.div className="entry-modal" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" aria-labelledby="entry-modal-title"><div className="modal-header"><div><span className="eyebrow">YOUR MORNING CHECK-IN</span><h2 id="entry-modal-title">{prettyDate(new Date(`${editingDate}T12:00:00`))}</h2></div><button onClick={() => setEditingDate(null)} aria-label="Close"><X size={18} /></button></div><label className="modal-label" htmlFor="edit-time">Wake-up time</label><div className="time-picker-wrap modal-time"><Clock3 size={18} /><input id="edit-time" type="time" value={editTime} onChange={(event) => setEditTime(event.target.value)} /></div><button className={`routine-row modal-routine ${editRoutine ? 'routine-checked' : ''}`} onClick={() => setEditRoutine(!editRoutine)} role="checkbox" aria-checked={editRoutine}><span className="custom-checkbox">{editRoutine && <Check size={15} strokeWidth={3} />}</span><span className="routine-copy"><strong>Morning routine complete</strong><small>Did you make time for yourself?</small></span></button><div className="modal-actions">{entries.some((entry) => entry.log_date === editingDate) && <button className="delete-button" onClick={() => void deleteEntry(editingDate)}><Trash2 size={15} /> Delete</button>}<button className="button button-primary" onClick={() => { void saveEntry({ log_date: editingDate, wake_up_time: editTime, routine_completed: editRoutine }); setEditingDate(null) }}>Save entry <ArrowRight size={15} /></button></div></motion.div></div>}

      {feedbackOpen && <div className="modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setFeedbackOpen(false) }}><motion.div className="entry-modal feedback-modal" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} role="dialog" aria-modal="true" aria-labelledby="feedback-title"><div className="modal-header"><div><span className="eyebrow">WE'RE LISTENING</span><h2 id="feedback-title">Share a thought.</h2></div><button onClick={() => setFeedbackOpen(false)} aria-label="Close"><X size={18} /></button></div><p className="feedback-hint">Your ideas help make The Creatorz Club a more thoughtful place to begin.</p><textarea autoFocus value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="What would make your mornings a little better?" rows={5} /><div className="modal-actions"><a className="feedback-email" href={`mailto:ajayreddy.tech@gmail.com?subject=The%20Creatorz%20Club%20feedback&body=${encodeURIComponent(feedback)}`}>Opens your email app</a><button className="button button-primary" disabled={!feedback.trim()} onClick={() => { window.location.href = `mailto:ajayreddy.tech@gmail.com?subject=The%20Creatorz%20Club%20feedback&body=${encodeURIComponent(feedback)}`; setFeedbackOpen(false) }}>Send feedback <ArrowRight size={15} /></button></div></motion.div></div>}
    </div>
  )
}

export default App
