import { DrowsinessDetector } from './components/DrowsinessDetector';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🛡️</div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">Anti-Sleep AI</h1>
              <p className="text-sm text-slate-400">Система мониторинга усталости водителя</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <DrowsinessDetector />

        {/* Information Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">🎯 Как это работает</h3>
            <p className="text-sm text-slate-300">
              Система использует AI для отслеживания глаз и рта. Когда обнаруживается сонливость, вы получите голосовой вопрос.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">🔒 Приватность</h3>
            <p className="text-sm text-slate-300">
              Все обработка происходит локально в вашем браузере. Видео не отправляется на серверы.
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">⚡ Быстро</h3>
            <p className="text-sm text-slate-300">
              Обработка в реальном времени на GPU. Минимальная задержка и высокая точность.
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">📋 Инструкция</h2>
          <ol className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">1.</span>
              <span>Нажмите кнопку "Запустить мониторинг"</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">2.</span>
              <span>Разрешите доступ к камере и микрофону</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">3.</span>
              <span>Система будет отслеживать ваши глаза и рот</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">4.</span>
              <span>При обнаружении сна система задаст вопрос</span>
            </li>
            <li className="flex gap-3">
              <span className="text-cyan-400 font-bold">5.</span>
              <span>Ответьте правильно, чтобы восстановить уровень бодрости</span>
            </li>
          </ol>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-slate-400 text-sm">
          <p>Anti-Sleep AI © 2026 | Powered by MediaPipe & React</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
