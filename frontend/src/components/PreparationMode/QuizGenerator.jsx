import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { preparationService } from '../../services';

export default function QuizGenerator({ courseId, selectedFiles }) {
  const { isDarkMode } = useTheme();
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serverScore, setServerScore] = useState(null);

  const normalizeQuestions = (questions = []) =>
    questions.map((q, idx) => ({
      id: q.id || idx,
      question: q.prompt || q.question || 'Question',
      options: q.options || [],
      correctAnswer: typeof q.answer_index === 'number' ? q.answer_index : q.correctAnswer ?? 0,
      sourceExcerpt: q.source_excerpt || '',
    }));

  const buildFallbackQuiz = () => {
    const questions = [
      {
        id: 1,
        question: 'What is the main concept discussed in the material?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Which of the following is an example of the concept?',
        options: ['Example 1', 'Example 2', 'Example 3', 'Example 4'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'True or False: The statement is correct.',
        options: ['True', 'False'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'What is the most important aspect?',
        options: ['Aspect 1', 'Aspect 2', 'Aspect 3', 'Aspect 4'],
        correctAnswer: 2,
      },
      {
        id: 5,
        question: 'How does this relate to real-world applications?',
        options: ['Application A', 'Application B', 'Application C', 'Application D'],
        correctAnswer: 1,
      },
    ];

    return questions.slice(0, parseInt(numQuestions, 10) || 5);
  };

  const handleStartQuiz = async () => {
    if (!courseId) {
      setError('Course information is missing.');
      return;
    }

    setIsLoading(true);
    setError('');
    setServerScore(null);

    try {
      const data = await preparationService.generateQuiz({
        course: courseId,
        materials: selectedFiles.map((f) => f.id),
        numQuestions: parseInt(numQuestions, 10) || 5,
        difficulty,
      });

      const normalized = normalizeQuestions(data.questions || []);
      const quizPayload = normalized.length ? normalized : buildFallbackQuiz();

      setGeneratedQuiz(quizPayload);
      setQuizId(data.id || null);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
    } catch (err) {
      console.error('Failed to generate quiz', err);
      setError('Could not generate quiz automatically. Loaded a fallback quiz instead.');
      setGeneratedQuiz(buildFallbackQuiz());
      setQuizId(null);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    const question = generatedQuiz?.[currentQuestion];
    if (!question) return;

    setUserAnswers({
      ...userAnswers,
      [question.id]: answer,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestion < generatedQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setShowResults(true);

    if (!quizId) return;

    setIsSubmitting(true);
    try {
      const result = await preparationService.submitQuiz(quizId, userAnswers);
      const numericScore = Number(result?.score);
      if (!Number.isNaN(numericScore)) {
        setServerScore(Math.round(numericScore));
      }
    } catch (err) {
      console.error('Failed to submit quiz', err);
      setError('Could not submit quiz results. Your answers are kept locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    generatedQuiz.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });
    return Math.round((correct / generatedQuiz.length) * 100);
  };

  const handleReset = () => {
    setGeneratedQuiz(null);
    setQuizId(null);
    setUserAnswers({});
    setShowResults(false);
    setServerScore(null);
    setError('');
  };

  if (generatedQuiz && showResults) {
    const score = serverScore ?? calculateScore();
    const correctCount = generatedQuiz.filter((q) => userAnswers[q.id] === q.correctAnswer).length;
    return (
      <div className={`rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="p-6 text-center">
          <div className={`text-6xl font-bold mb-4 ${score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            {score}%
          </div>
          <p className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {score >= 70 ? '🎉 Great Job!' : score >= 50 ? '👍 Good Effort!' : '📚 Keep Studying!'}
          </p>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You got {correctCount} out of {generatedQuiz.length} questions correct
          </p>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {/* Review Answers */}
          <div className="space-y-3 mt-6 max-h-96 overflow-y-auto text-left">
            {generatedQuiz.map((q, idx) => (
              <div
                key={q.id}
                className={`p-3 rounded-lg border-l-4 ${
                  userAnswers[q.id] === q.correctAnswer
                    ? isDarkMode
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-green-50 border-green-500'
                    : isDarkMode
                      ? 'bg-red-500/10 border-red-500'
                      : 'bg-red-50 border-red-500'
                }`}
              >
                <p className={`font-medium text-sm mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {idx + 1}. {q.question}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your answer: <span className={`${userAnswers[q.id] === q.correctAnswer ? isDarkMode ? 'text-green-400' : 'text-green-600' : isDarkMode ? 'text-red-400' : 'text-red-600'} font-bold`}>{q.options[userAnswers[q.id]] ?? '—'}</span>
                </p>
                {userAnswers[q.id] !== q.correctAnswer && (
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Correct answer: <span className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-bold`}>{q.options[q.correctAnswer]}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleReset}
            className={`mt-6 px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Create Another Quiz
          </button>
        </div>
      </div>
    );
  }

  if (generatedQuiz && !showResults) {
    const question = generatedQuiz[currentQuestion];
    const userAnswer = userAnswers[question.id];

    return (
      <div className={`rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        {/* Header */}
        <div className={`border-b p-4 ${isDarkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Question {currentQuestion + 1} of {generatedQuiz.length}
            </h3>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {Object.keys(userAnswers).length} answered
            </div>
          </div>
          <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div
              className="h-full bg-sky-500 transition-all"
              style={{ width: `${((currentQuestion + 1) / generatedQuiz.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <p className={`text-lg font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {question.question}
          </p>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all font-medium ${
                  userAnswer === idx
                    ? isDarkMode
                      ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                      : 'border-sky-400 bg-sky-50 text-sky-700'
                    : isDarkMode
                      ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      userAnswer === idx
                        ? isDarkMode
                          ? 'bg-sky-500 border-sky-500'
                          : 'bg-sky-400 border-sky-400'
                        : isDarkMode
                          ? 'border-gray-600'
                          : 'border-gray-300'
                    }`}
                  >
                    {userAnswer === idx && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentQuestion === 0
                  ? isDarkMode
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ← Previous
            </button>
            {currentQuestion < generatedQuiz.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                disabled={userAnswer === undefined}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  userAnswer === undefined
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-sky-500 text-white hover:bg-sky-600'
                      : 'bg-sky-400 text-white hover:bg-sky-500'
                }`}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={Object.keys(userAnswers).length < generatedQuiz.length || isSubmitting}
                className={`flex-1 px-4 py-2 rounded-lg font-bold transition-colors ${
                  Object.keys(userAnswers).length < generatedQuiz.length || isSubmitting
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border transition-colors ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="p-6 text-center">
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          ✏️ Quiz Generator
        </h3>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Based on: {selectedFiles.map(f => f.filename).join(', ')}
        </p>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="space-y-4 max-w-sm mx-auto">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Number of Questions
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-sky-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-sky-500'
              }`}
            >
              <option value="3">3 Questions</option>
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white focus:border-sky-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-sky-500'
              }`}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <button
            onClick={handleStartQuiz}
            disabled={isLoading}
            className={`w-full px-6 py-3 rounded-lg font-bold transition-colors mt-6 ${
              isLoading
                ? isDarkMode
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-sky-500 text-white hover:bg-sky-600'
            }`}
          >
            {isLoading ? 'Generating Quiz...' : 'Start Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
