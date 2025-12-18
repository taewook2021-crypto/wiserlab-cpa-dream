import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-6 py-24 max-w-4xl">
        <h1 className="text-3xl font-light mb-16 tracking-tight">개인정보처리방침</h1>
        
        <div className="space-y-12 text-sm text-gray-700 leading-relaxed">
          <section>
            <p className="mb-4">
              와이저랩 주식회사(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고, 
              개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제1조 (수집하는 개인정보 항목)</h2>
            <p className="mb-3">회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>필수항목: 카카오 계정 정보(이메일, 닉네임, 프로필 사진)</li>
              <li>서비스 이용 과정에서 자동으로 생성되어 수집되는 정보: 서비스 이용기록, 접속 로그, 결제 기록</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="mb-3">회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정 이용 방지</li>
              <li>서비스 제공: 모의고사 서비스 제공, 채점 및 성적 분석, 맞춤형 콘텐츠 제공</li>
              <li>마케팅 및 광고 활용: 신규 서비스 안내, 이벤트 정보 제공 (동의한 경우에 한함)</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제3조 (개인정보의 보유 및 이용기간)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
              <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
                  <li>결제 정보: 전자상거래법에 따라 5년</li>
                  <li>서비스 이용 기록: 3년</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제4조 (개인정보의 제3자 제공)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</li>
              <li>다만, 아래의 경우에는 예외로 합니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제5조 (개인정보 처리의 위탁)</h2>
            <p className="mb-3">회사는 서비스 향상을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
            <div className="border border-gray-200 rounded p-4">
              <p><strong>수탁업체:</strong> (주)카카오</p>
              <p><strong>위탁업무:</strong> 소셜 로그인 서비스 제공</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
            <p className="mb-3">이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p className="mt-3">위 권리 행사는 회사에 서면, 전화, 이메일 등을 통해 요청할 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제7조 (개인정보의 파기)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
              <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제8조 (개인정보의 안전성 확보 조치)</h2>
            <p className="mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>관리적 조치: 내부관리계획 수립·시행, 직원 교육</li>
              <li>기술적 조치: 개인정보 암호화, 보안 프로그램 설치 및 갱신</li>
              <li>물리적 조치: 데이터 센터 접근 통제</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제9조 (개인정보 보호책임자)</h2>
            <p className="mb-3">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="border border-gray-200 rounded p-4">
              <p><strong>개인정보 보호책임자</strong></p>
              <p>성명: 김태욱</p>
              <p>직책: 대표이사</p>
              <p>연락처: 추후 공개</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제10조 (개인정보 처리방침 변경)</h2>
            <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
          </section>

          <section className="pt-8 border-t border-gray-200">
            <p className="text-gray-500">
              <strong>부칙</strong><br />
              이 개인정보처리방침은 2025년 12월 20일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
