import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CheckCircle2, TrendingUp, Timer, ChevronRight, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { buildPlacement, type PlacementQuestion, TRACK_LABELS } from "@/lib/curriculum";
import { answerHaptic } from "@/lib/native";

export const Route = createFileRoute("/quick-test")({
  component: QuickTest,
});

const TEST_STORAGE_KEY = "rapidmath:quick-test-result";

type TestResult = {
  score: number;
  total: number;
  avgTime: number;
  tracks: Record<string, { correct: number; total: number }>;
  timestamp: number;
};

function QuickTest() {
  const [step, setStep] = useState<"intro" | "playing" | "results">("intro");
  const [questions, setQuestions] = useState<PlacementQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [results, setResults] = useState<{ correct: boolean; time: number }[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);


  const startTest = () => {
    setQuestions(buildPlacement());
    setResults([]);
    setCurrentIndex(0);
    setStep("playing");
    
    beginQuestion();
  };

  const beginQuestion = () => {
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);
    setUserAnswer("");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000));
    }, 250);
  };

  useEffect(() => {
    if (step === "playing" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, currentIndex]);

  const handleNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = (Date.now() - startTime) / 1000;
    const currentQ = questions[currentIndex];
    const trimmed = userAnswer.trim();
    const isCorrect = trimmed !== "" && parseFloat(trimmed) === currentQ.answer;
    answerHaptic(isCorrect);

    const newResults = [...results, { correct: isCorrect, time: timeTaken }];
    setResults(newResults);



    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      beginQuestion();
    } else {
      finishTest(newResults);
    }
  };

  const finishTest = (finalResults: { correct: boolean; time: number }[]) => {
    const correctResults = finalResults.filter(r => r.correct);
    const correctCount = correctResults.length;
    const avgTime = correctResults.length
      ? correctResults.reduce((acc, curr) => acc + curr.time, 0) / correctResults.length
      : 0;

    const trackStats: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q, idx) => {
      if (!trackStats[q.track]) trackStats[q.track] = { correct: 0, total: 0 };
      trackStats[q.track].total += 1;
      if (finalResults[idx].correct) trackStats[q.track].correct += 1;
    });

    const resultData: TestResult = {
      score: correctCount,
      total: questions.length,
      avgTime,
      tracks: trackStats,
      timestamp: Date.now()
    };

    localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(resultData));
    setStep("results");
  };


  const getLevelLabel = (score: number) => {
    if (score >= 9) return { label: "Expert", color: "text-emerald-600", desc: "You have exceptional mental fluency. You likely outpace 95% of professionals." };
    if (score >= 7) return { label: "Advanced", color: "text-blue-600", desc: "You are very comfortable with numbers. Pro drills will polish your speed." };
    if (score >= 4) return { label: "Intermediate", color: "text-amber-600", desc: "Solid foundation. You can handle standard business math with a little effort." };
    return { label: "Beginner", color: "text-slate-500", desc: "Good start. Daily training will make these calculations feel like second nature." };
  };

  if (step === "intro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold tracking-tight">How sharp are you?</h1>
            <p className="text-muted-foreground">
              Take our 60-second assessment to find your mental math baseline. 10 questions, escalating difficulty.
            </p>
          </div>
          <Card className="p-6 space-y-4 border-dashed">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3 w-3" /> Progression
                </div>
                <p className="text-sm">Starts easy, ends hard</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Timer className="h-3 w-3" /> No time limit
                </div>
                <p className="text-sm">Take your time per question</p>
              </div>

            </div>
          </Card>
          <Button size="lg" className="w-full text-lg h-14" onClick={startTest}>
            Start Assessment
          </Button>
        </div>
      </div>
    );
  }

  if (step === "playing") {
    const currentQ = questions[currentIndex];
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-xl space-y-12">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span className="tabular-nums">{elapsed}s</span>
            </div>
            <Progress value={((currentIndex) / questions.length) * 100} className="h-1" />
          </div>


          <div className="text-center space-y-8">
            <div className="text-xs font-medium text-primary uppercase tracking-widest bg-primary/5 inline-block px-3 py-1 rounded-full">
              {TRACK_LABELS[currentQ.track]}
            </div>
            <div className="font-display text-6xl md:text-8xl font-bold tracking-tight">
              {currentQ.prompt.replace("−", "-").replace("×", "×").replace("÷", "÷")}
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="max-w-xs mx-auto">
              <Input
                ref={inputRef}
                type="number"
                step="any"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="?"
                className="text-center text-4xl h-20 font-display font-bold border-2 focus-visible:ring-primary"
              />
              <p className="mt-4 text-xs text-muted-foreground uppercase tracking-widest">
                Press Enter to submit
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!isClient) return null;

  const finalResult = JSON.parse(localStorage.getItem(TEST_STORAGE_KEY) || "{}") as TestResult;
  const levelData = getLevelLabel(finalResult.score);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 py-12">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Your Result</h1>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-display font-bold">{finalResult.score}/{finalResult.total}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display font-bold">{finalResult.score > 0 ? `${finalResult.avgTime.toFixed(1)}s` : "—"}</div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg time (correct)</div>
            </div>

          </div>
        </div>

        <Card className="p-8 border-2 border-primary/20 bg-primary/5 text-center">
          <div className={`text-sm font-bold uppercase tracking-[0.2em] ${levelData.color}`}>Your Level</div>
          <div className={`mt-2 font-display text-5xl font-bold tracking-tight ${levelData.color}`}>
            {levelData.label}
          </div>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            {levelData.desc}
          </p>
          {finalResult.score < 4 && (
            <div className="mt-6 max-w-md mx-auto rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              In a meeting, this hesitation means the conversation moves on without your input. Take a breath — speed comes with practice, and you're building it right now.
            </div>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Breakdown</h3>
            <div className="space-y-3">
              {Object.entries(finalResult.tracks).map(([track, stats]) => (
                <div key={track} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{track}</span>
                  <span className="font-medium">{stats.correct}/{stats.total}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted/30 rounded-xl p-6 flex flex-col justify-center space-y-4">
            <h3 className="font-display font-semibold">Want to level up?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most people improve their mental math speed by 30% after just 7 days of training.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90"
            >
              Start Training Free <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => setStep("intro")} className="text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4" /> Retake Test
          </Button>
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center">
            <LogIn className="mr-2 h-4 w-4" /> Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
