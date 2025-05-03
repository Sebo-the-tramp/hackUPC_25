'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { env } from 'process';

type Question = {
  id: number;
  text: string;
  options: string[];
};

type TinderSwipeProps = {
  questions: Question[];
  onComplete: (answers: { questionId: number; answer: string }[]) => void;
  isNewTrip?: boolean;
};

const TinderSwipe: React.FC<TinderSwipeProps> = ({ questions, onComplete, isNewTrip = false }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [airportCode, setAirportCode] = useState("");
  const [airportError, setAirportError] = useState<string | null>(null);
  const [validatingAirport, setValidatingAirport] = useState(false);
  const [airportName, setAirportName] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const newOffset = {
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    };
    
    setOffset(newOffset);
    
    // Set direction based on offset
    if (newOffset.x > 50) {
      setDirection('right');
    } else if (newOffset.x < -50) {
      setDirection('left');
    } else {
      setDirection(null);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    if (direction === 'right' && currentQuestion.options[1]) {
      selectAnswer(currentQuestion.options[1]);
    } else if (direction === 'left' && currentQuestion.options[0]) {
      selectAnswer(currentQuestion.options[0]);
    } else {
      // Reset if not enough drag
      setOffset({ x: 0, y: 0 });
    }
    
    setIsDragging(false);
    setDirection(null);
  };

  // Simplified version that just collects the airport code without validation
const validateAirportCode = async () => {
  if (!airportCode.trim()) {
    setAirportError('Please enter an airport code');
    return false;
  }

  // Just accept whatever the user entered
  setAirportName(airportCode.toUpperCase());
  return true;
};

  const handleAirportSubmit = async () => {
    const isValid = await validateAirportCode();
    if (isValid) {
      // Use the validated airport code as the answer
      selectAnswer(airportCode.toUpperCase());
    }
  };

  const selectAnswer = (answer: string) => {
    const newAnswers = [...answers, { questionId: currentQuestion.id, answer }];
    setAnswers(newAnswers);
    
    // Animate card off screen
    const targetX = answer === currentQuestion.options[1] ? 1000 : -1000;
    
    // Don't animate for the airport question
    if (currentQuestionIndex !== questions.length - 1 || !currentQuestion.text.includes("home airport")) {
      setOffset({ x: targetX, y: 0 });
    }
    
    // Move to next question or complete
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setOffset({ x: 0, y: 0 });
      } else {
        // All questions answered
        onComplete(newAnswers);
      }
    }, 300);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        selectAnswer(currentQuestion.options[0]);
      } else if (e.key === 'ArrowRight') {
        selectAnswer(currentQuestion.options[1]);
      }
    };
    
    // Only add keyboard handlers for non-airport questions
    if (!currentQuestion.text.includes("home airport")) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentQuestion]);

  const getCardStyle = () => {
    return {
      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`,
      transition: isDragging ? 'none' : 'transform 0.3s ease'
    };
  };

  // Check if current question is the special airport question
  const isAirportQuestion = currentQuestion.text.includes("home airport");
  
  return (
    <div className="w-full max-w-md mx-auto p-10">
      <div className="relative h-[450px] w-full">
        {/* Progress indicator */}
        <div className="flex mb-4 gap-1">
          {questions.map((_, index) => (
            <div 
              key={index} 
              className={`h-1 flex-1 rounded-full mt-0 ${
                index === currentQuestionIndex ? 'bg-indigo-600' : 
                index < currentQuestionIndex ? 'bg-indigo-400' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        
        {/* Card */}
        <div
          ref={cardRef}
          style={getCardStyle()}
          className={`absolute inset-0 bg-white rounded-xl shadow-lg overflow-hidden mt-10
            ${!isAirportQuestion && direction === 'right' ? 'border-4 border-green-400' : 
              !isAirportQuestion && direction === 'left' ? 'border-4 border-red-400' : ''}`}
          onMouseDown={!isAirportQuestion ? handleDragStart : undefined}
          onMouseMove={!isAirportQuestion ? handleDragMove : undefined}
          onMouseUp={!isAirportQuestion ? handleDragEnd : undefined}
          onMouseLeave={!isAirportQuestion ? handleDragEnd : undefined}
          onTouchStart={!isAirportQuestion ? handleDragStart : undefined}
          onTouchMove={!isAirportQuestion ? handleDragMove : undefined}
          onTouchEnd={!isAirportQuestion ? handleDragEnd : undefined}
        >
          <div className="h-full flex flex-col p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-0">
              {isNewTrip ? "Let's set up your trip!" : "Tell us about your preferences"}
            </h2>
            
            <div className="flex-1 flex items-center justify-center">
              <h3 className="text-2xl font-bold text-center text-indigo-700">
                {isAirportQuestion ? "What is your home airport?" : currentQuestion.text}
              </h3>
            </div>
            
            {isAirportQuestion ? (
              /* Airport input for the last question */
              <div className="py-6 px-6 bg-gray-50 rounded-lg mb-20 flex flex-col items-center">
                <div className="w-full max-w-xs mb-2">
                  <label htmlFor="airportCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ICAO Airport Code (e.g., KJFK, EGLL, LFPG)
                  </label>
                  <input
                    type="text"
                    id="airportCode"
                    value={airportCode}
                    onChange={(e) => {
                      setAirportCode(e.target.value.toUpperCase());
                      setAirportError(null);
                      setAirportName('');
                    }}
                    className={`w-full p-3 border ${
                      airportError ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase`}
                    placeholder="Enter 4-letter ICAO code"
                    maxLength={4}
                    autoComplete="off"
                  />
                </div>
                
                {airportError && (
                  <p className="mt-1 text-sm text-red-600 w-full max-w-xs text-left">{airportError}</p>
                )}
                
                {airportName && !airportError && (
                  <p className="mt-1 text-sm text-green-600 w-full max-w-xs text-left">Found: {airportName}</p>
                )}
                
                <button
                  onClick={handleAirportSubmit}
                  disabled={validatingAirport || !airportCode.trim()}
                  className={`mt-4 px-6 py-2 rounded-md font-medium ${
                    validatingAirport || !airportCode.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {validatingAirport ? 'Validating...' : 'Complete'}
                </button>
              </div>
            ) : (
              /* Regular options for other questions */
              <div className="py-6 px-6 bg-gray-50 rounded-lg mb-20 flex flex-col items-center text-center">
                <div className="flex justify-between items-center w-full max-w-md">
                  <div className="flex items-center gap-3 justify-center w-1/2">
                    <span className="font-medium">{currentQuestion.options[0]}</span>
                  </div>
                  <div className="flex items-center justify-center w-1/2">
                    <span className="font-medium">{currentQuestion.options[1]}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons - Only show for non-airport questions */}
        {!isAirportQuestion && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-16 z-10">
            <button 
              onClick={() => selectAnswer(currentQuestion.options[0])}
              className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-blue-50"
            >
              <ChevronLeft size={24} className="text-blue-500" />
            </button>
            <button 
              onClick={() => selectAnswer(currentQuestion.options[1])}
              className="h-14 w-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-blue-50"
            >
              <ChevronRight size={24} className="text-blue-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TinderSwipe;