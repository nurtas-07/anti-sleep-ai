import React, { useEffect, useRef, useState } from 'react';
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';

interface DetectionMetrics {
  ear: number;
  mar: number;
  state: 'normal' | 'warning' | 'critical';
  alertLevel: number;
}

export const DrowsinessDetector: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<DetectionMetrics>({
    ear: 0,
    mar: 0,
    state: 'normal',
    alertLevel: 100,
  });
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [status, setStatus] = useState('Инициализация...');

  const eyesClosedTimeRef = useRef<number | null>(null);
  const isQuestionActiveRef = useRef(false);
  const alertLevelRef = useRef(100);

  const EAR_THRESHOLD = 0.22;
  const MAR_THRESHOLD = 0.5;
  const SLEEP_TIME_MS = 1500;

  // Инициализация MediaPipe
  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        const landmarker = await FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
          }
        );
        setFaceLandmarker(landmarker);
        setStatus('Готово. Нажмите "Запустить"');
      } catch (error) {
        console.error('Ошибка инициализации MediaPipe:', error);
        setStatus('Ошибка загрузки модели');
      }
    };

    initMediaPipe();
  }, []);

  // Расчет EAR (Eye Aspect Ratio)
  const calculateEAR = (landmarks: any[]): number => {
    const dist = (p1: any, p2: any) =>
      Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    const leftEAR =
      (dist(landmarks[385], landmarks[380]) +
        dist(landmarks[387], landmarks[373])) /
      (2 * dist(landmarks[362], landmarks[263]));

    const rightEAR =
      (dist(landmarks[160], landmarks[144]) +
        dist(landmarks[158], landmarks[153])) /
      (2 * dist(landmarks[33], landmarks[133]));

    return (leftEAR + rightEAR) / 2;
  };

  // Расчет MAR (Mouth Aspect Ratio)
  const calculateMAR = (landmarks: any[]): number => {
    const dist = (p1: any, p2: any) =>
      Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    return dist(landmarks[13], landmarks[14]) / dist(landmarks[78], landmarks[308]);
  };

  // Запуск камеры
  const startCamera = async () => {
    if (!faceLandmarker) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsRunning(true);
          setStatus('Мониторинг активен');
          detectDrowsiness();
        };
      }
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      setStatus('Ошибка доступа к камере');
    }
  };

  // Остановка камеры
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsRunning(false);
    setStatus('Остановлено');
  };

  // Обнаружение сонливости
  const detectDrowsiness = async () => {
    if (!faceLandmarker || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const detect = async () => {
      if (!isRunning) return;

      try {
        const results = faceLandmarker.detectForVideo(
          videoRef.current!,
          performance.now()
        );

        // Очистка канваса
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // Рисование сетки лица
          const drawingUtils = new DrawingUtils(ctx);
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_TESSELATION,
            { color: '#C0C0C070', lineWidth: 1 }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
            { color: '#FF3030' }
          );
          drawingUtils.drawConnectors(
            landmarks,
            FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
            { color: '#30FF30' }
          );

          const ear = calculateEAR(landmarks);
          const mar = calculateMAR(landmarks);

          // Логика обнаружения сна
          if (ear < EAR_THRESHOLD) {
            if (!eyesClosedTimeRef.current) {
              eyesClosedTimeRef.current = Date.now();
            }

            const duration = Date.now() - eyesClosedTimeRef.current;

            if (duration > SLEEP_TIME_MS && !isQuestionActiveRef.current) {
              triggerAlert();
            } else if (duration > 500) {
              updateAlertLevel(alertLevelRef.current - 1);
            }
          } else {
            eyesClosedTimeRef.current = null;
            if (alertLevelRef.current < 100 && !isQuestionActiveRef.current) {
              updateAlertLevel(alertLevelRef.current + 0.2);
            }
          }

          // Логика обнаружения зевания
          if (mar > MAR_THRESHOLD) {
            updateAlertLevel(alertLevelRef.current - 5);
          }

          // Обновление метрик
          setMetrics({
            ear: parseFloat(ear.toFixed(3)),
            mar: parseFloat(mar.toFixed(3)),
            state: alertLevelRef.current < 30 ? 'critical' : alertLevelRef.current < 70 ? 'warning' : 'normal',
            alertLevel: alertLevelRef.current,
          });
        }
      } catch (error) {
        console.error('Ошибка обнаружения:', error);
      }

      requestAnimationFrame(detect);
    };

    detect();
  };

  const updateAlertLevel = (val: number) => {
    alertLevelRef.current = Math.max(0, Math.min(100, val));
  };

  const triggerAlert = () => {
    isQuestionActiveRef.current = true;
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const sum = a + b;

    // Синтез речи
    const utterance = new SpeechSynthesisUtterance(
      `Контроль внимания! Сколько будет ${a} плюс ${b}?`
    );
    utterance.lang = 'ru-RU';
    utterance.rate = 1.2;

    window.speechSynthesis.speak(utterance);

    utterance.onend = () => {
      // Распознавание речи
      const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!Recognition) {
        isQuestionActiveRef.current = false;
        return;
      }

      const recognition = new Recognition();
      recognition.lang = 'ru-RU';
      recognition.start();

      recognition.onresult = (event: any) => {
        const answer = event.results[0][0].transcript;
        if (answer.includes(sum.toString())) {
          updateAlertLevel(100);
          setStatus('Ответ верный!');
        } else {
          playSiren();
          setStatus('Ответ неверный!');
        }
        isQuestionActiveRef.current = false;
      };

      recognition.onerror = () => {
        playSiren();
        isQuestionActiveRef.current = false;
      };
    };
  };

  const playSiren = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  };

  const getStateColor = () => {
    if (metrics.alertLevel < 30) return 'text-red-500';
    if (metrics.alertLevel < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getProgressColor = () => {
    if (metrics.alertLevel < 30) return 'bg-red-500';
    if (metrics.alertLevel < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-slate-900 rounded-lg shadow-xl overflow-hidden">
        {/* Видео секция */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full scale-x-[-1]"
          />
        </div>

        {/* Контрольная панель */}
        <div className="p-6 space-y-4">
          {/* Статус */}
          <div className="text-center">
            <p className="text-sm text-slate-400">Статус системы</p>
            <p className="text-lg font-semibold text-cyan-400">{status}</p>
          </div>

          {/* Метрики */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-sm text-slate-400">EAR (Глаза)</p>
              <p className="text-2xl font-bold text-cyan-400">{metrics.ear.toFixed(3)}</p>
            </div>
            <div className="bg-slate-800 p-4 rounded">
              <p className="text-sm text-slate-400">MAR (Рот)</p>
              <p className="text-2xl font-bold text-cyan-400">{metrics.mar.toFixed(3)}</p>
            </div>
          </div>

          {/* Уровень бодрости */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-slate-400">Уровень бодрости</p>
              <p className={`text-xl font-bold ${getStateColor()}`}>
                {Math.round(metrics.alertLevel)}%
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${getProgressColor()} transition-all duration-300`}
                style={{ width: `${metrics.alertLevel}%` }}
              />
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-4">
            <button
              onClick={isRunning ? stopCamera : startCamera}
              disabled={!faceLandmarker}
              className={`flex-1 py-3 px-4 rounded font-semibold transition-all ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-slate-600'
              }`}
            >
              {isRunning ? 'Остановить' : 'Запустить мониторинг'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
