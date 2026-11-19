import React, { useState, useEffect } from 'react';
import { ESP32_QUIZ_QUESTIONS, QuizQuestion } from '../../data/quizData';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Award,
  Eye,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface AnatomyQuizProps {
  onFocusPart: (partId: string) => void;
  onExitQuiz: () => void;
}

export const AnatomyQuiz: React.FC<AnatomyQuizProps> = ({
  onFocusPart,
  onExitQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const totalQuestions = ESP32_QUIZ_QUESTIONS.length;
  const currentQ: QuizQuestion = ESP32_QUIZ_QUESTIONS[currentIndex];
  const hasAnswered = selectedAnswers[currentQ.id] !== undefined;
  const userAnswer = selectedAnswers[currentQ.id];
  const isCorrect = hasAnswered && userAnswer === currentQ.correctIndex;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const handleSelectOption = (optionIndex: number) => {
    if (hasAnswered) return; // Prevent changing once verified
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIndex(0);
    setIsFinished(false);
  };

  // Keyboard navigation support: Enter or ArrowRight moves forward if answered
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if ((e.key === 'ArrowRight' || e.key === 'Enter') && hasAnswered) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnswered, currentIndex, isFinished]);

  // Calculate total score
  const correctCount = ESP32_QUIZ_QUESTIONS.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  if (isFinished) {
    const isMaster = correctCount >= 9;
    const isProficient = correctCount >= 7;

    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white select-none">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-start text-center gap-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md mt-2 shrink-0 ${
              isMaster
                ? 'bg-amber-100 text-amber-600 border border-amber-200'
                : isProficient
                ? 'bg-teal-100 text-[#00878a] border border-teal-200'
                : 'bg-blue-100 text-blue-600 border border-blue-200'
            }`}
          >
            <Award className="w-8 h-8" />
          </div>

          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00878a]">
              EVALUACIÓN DE HARDWARE FINALIZADA
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Resultado del Quiz
            </h3>
          </div>

          {/* Score display card */}
          <div className="w-full p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col items-center gap-1 shadow-2xs">
            <span className="text-4xl font-extrabold text-[#00878a] font-mono tabular-nums">
              {correctCount} / {totalQuestions}
            </span>
            <span className="text-xs font-semibold text-slate-600">
              {Math.round((correctCount / totalQuestions) * 100)}% de respuestas correctas
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed px-2">
            {isMaster
              ? '¡Excelente! Dominas a la perfección la arquitectura, memoria, pines especiales y componentes del ESP32 NodeMCU DevKit V1.'
              : isProficient
              ? '¡Muy buen trabajo! Tienes conocimientos sólidos sobre el hardware y las restricciones de pines del ESP32.'
              : 'Buen intento. Te recomendamos repasar las fichas técnicas y los tooltips 3D en la placa para consolidar los conceptos clave.'}
          </p>

          {/* Summary Question Grid */}
          <div className="w-full mt-2 flex flex-col gap-1.5 text-left">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Detalle por Pregunta
            </span>
            <div className="grid grid-cols-5 gap-1.5 w-full">
              {ESP32_QUIZ_QUESTIONS.map((q, idx) => {
                const wasAnswered = selectedAnswers[q.id] !== undefined;
                const wasCorrect = wasAnswered && selectedAnswers[q.id] === q.correctIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsFinished(false);
                    }}
                    className={`py-1.5 px-1 rounded-lg border text-center text-[11px] font-mono font-bold flex flex-col items-center justify-center transition-all ${
                      wasCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                        : wasAnswered
                        ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    }`}
                    title={`Revisar pregunta ${idx + 1}`}
                  >
                    <span>Q{idx + 1}</span>
                    <span className="text-[9px]">
                      {wasCorrect ? '✓' : '✗'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col w-full gap-2 mt-4 pb-4 shrink-0">
            <button
              onClick={handleRestart}
              className="w-full py-2.5 px-4 bg-[#00878a] hover:bg-[#007073] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar Quiz</span>
            </button>

            <button
              onClick={onExitQuiz}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
            >
              Volver al Resumen de Piezas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white select-none">
      {/* Quiz Header & Stepper */}
      <div className="shrink-0 p-3.5 border-b border-slate-100 flex flex-col gap-2.5 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00878a]/10 text-[#00878a] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00878a]">
                QUIZ DE ANATOMÍA ESP32
              </div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                Pregunta {currentIndex + 1} de {totalQuestions}
              </h2>
            </div>
          </div>

          <button
            onClick={onExitQuiz}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-200/60"
          >
            Salir
          </button>
        </div>

        {/* 10-Step Interactive Dots/Pills */}
        <div className="flex items-center gap-1 justify-between w-full pt-1">
          {ESP32_QUIZ_QUESTIONS.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isDone = selectedAnswers[q.id] !== undefined;
            const isDoneCorrect = isDone && selectedAnswers[q.id] === q.correctIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 h-7 rounded-md font-mono text-[10px] font-bold flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'ring-2 ring-[#00878a] ring-offset-1 bg-[#00878a] text-white shadow-2xs'
                    : isDone
                    ? isDoneCorrect
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                    : 'bg-slate-200/80 text-slate-500 hover:bg-slate-300'
                }`}
                title={`Ir a pregunta ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question & Options Scrollable Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3.5">
        <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
          {currentQ.question}
        </div>

        {/* 4 Multiple Choice Options */}
        <div className="flex flex-col gap-2">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = userAnswer === optIdx;
            const isThisCorrect = currentQ.correctIndex === optIdx;

            let optionStyle =
              'bg-slate-50 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300';
            let badgeStyle = 'bg-slate-200 text-slate-700';

            if (hasAnswered) {
              if (isThisCorrect) {
                optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs font-semibold';
                badgeStyle = 'bg-emerald-500 text-white font-bold';
              } else if (isSelected) {
                optionStyle = 'bg-red-50 border-red-500 text-red-950 shadow-xs font-semibold';
                badgeStyle = 'bg-red-500 text-white font-bold';
              } else {
                optionStyle = 'bg-slate-50/50 border-slate-200 opacity-45 text-slate-400';
                badgeStyle = 'bg-slate-200 text-slate-400';
              }
            }

            const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                disabled={hasAnswered}
                className={`min-h-[46px] p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${optionStyle}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg text-[11px] font-mono flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}
                >
                  {letter}
                </div>
                <div className="flex-1 leading-snug font-medium pt-0.5">
                  {opt}
                </div>
                {hasAnswered && isThisCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                )}
                {hasAnswered && isSelected && !isThisCorrect && (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation & Primary Advance Action when answered */}
        {hasAnswered && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isCorrect
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-xs">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Respuesta Correcta!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Explicación técnica:</span>
                  </>
                )}
              </span>

              <button
                onClick={() => onFocusPart(currentQ.relatedPartId)}
                className="px-2 py-0.5 rounded bg-white text-[#00878a] border border-[#00878a]/40 hover:bg-[#00878a]/10 text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                title="Enfocar esta pieza en la placa 3D"
              >
                <Eye className="w-3 h-3" />
                <span>Enfocar 3D</span>
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-700">
              {currentQ.explanation}
            </p>

            {/* HIGH-VISIBILITY PRIMARY NEXT BUTTON DIRECTLY IN EXPLANATION */}
            <button
              onClick={handleNext}
              className="mt-1 w-full py-2.5 px-4 bg-[#00878a] hover:bg-[#007073] active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all min-h-[44px]"
            >
              <span>
                {isLastQuestion ? 'Finalizar Quiz y Ver Puntaje' : 'Siguiente Pregunta'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation Footer */}
      <div className="shrink-0 p-3 border-t border-slate-200/90 bg-white flex items-center justify-between gap-2 shadow-xs">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="min-h-[42px] px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-xs font-semibold text-slate-700 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500 font-semibold">
          {currentIndex + 1} / {totalQuestions}
        </span>

        <button
          onClick={handleNext}
          disabled={!hasAnswered}
          className={`min-h-[42px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            hasAnswered
              ? 'bg-[#00878a] hover:bg-[#007073] text-white shadow-xs'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{isLastQuestion ? 'Finalizar' : 'Siguiente'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
