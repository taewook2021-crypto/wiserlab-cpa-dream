import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnswerGroup {
  startNum: number;
  endNum: number;
  value: string;
}

const subjects = [
  { id: "financial", name: "재무회계" },
  { id: "tax", name: "세법" },
];

const exams = [
  { id: "summit-1", name: "SUMMIT 1회" },
  { id: "summit-2", name: "SUMMIT 2회" },
];

const QuickScoring = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [answers, setAnswers] = useState<AnswerGroup[]>(() => {
    // 40문제 기준으로 8개 그룹 생성 (5문제씩)
    const groups: AnswerGroup[] = [];
    for (let i = 0; i < 8; i++) {
      groups.push({
        startNum: i * 5 + 1,
        endNum: i * 5 + 5,
        value: "",
      });
    }
    return groups;
  });

  const handleAnswerChange = (index: number, value: string) => {
    // 숫자만 허용하고 5자리까지만
    const numericValue = value.replace(/[^1-5]/g, "").slice(0, 5);
    setAnswers((prev) =>
      prev.map((group, i) =>
        i === index ? { ...group, value: numericValue } : group
      )
    );
  };

  const handleSubmit = () => {
    // 채점 로직 (추후 구현)
    console.log("Selected Subject:", selectedSubject);
    console.log("Selected Exam:", selectedExam);
    console.log("Answers:", answers);
  };

  const isFormValid =
    selectedSubject &&
    selectedExam &&
    answers.every((group) => group.value.length === 5);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-16">
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-3xl font-light mb-4">빠른 채점하기</h1>
                <p className="text-muted-foreground">
                  5문제씩 묶어서 답안을 입력하세요 (예: 54312)
                </p>
              </div>

              {/* 과목 및 회차 선택 */}
              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="space-y-2">
                  <Label>과목 선택</Label>
                  <Select
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="과목을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>회차 선택</Label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue placeholder="회차를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 답안 입력 */}
              <div className="space-y-6 mb-12">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {answers.map((group, index) => (
                    <div key={index} className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        {group.startNum}번 ~ {group.endNum}번
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="54312"
                        value={group.value}
                        onChange={(e) =>
                          handleAnswerChange(index, e.target.value)
                        }
                        className="text-center text-lg tracking-[0.5em] font-mono"
                        maxLength={5}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 안내 문구 */}
              <div className="bg-muted/50 rounded-lg p-6 mb-8">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  * 각 칸에 해당 문제의 답을 순서대로 입력하세요.
                  <br />* 1~5번 문제의 답이 5, 4, 3, 1, 2번이면 "54312"를
                  입력합니다.
                  <br />* 답은 1~5 사이의 숫자만 입력 가능합니다.
                </p>
              </div>

              {/* 채점 버튼 */}
              <Button
                onClick={handleSubmit}
                className="w-full h-14 text-base font-normal"
                disabled={!isFormValid}
              >
                채점하기
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default QuickScoring;
