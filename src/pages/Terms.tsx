import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-6 py-24 max-w-4xl">
        <h1 className="text-3xl font-light mb-16 tracking-tight">이용약관</h1>
        
        <div className="space-y-12 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제1조 (목적)</h2>
            <p>
              이 약관은 와이저랩 주식회사(이하 "회사")가 제공하는 SUMMIT 서비스(이하 "서비스")의 이용과 관련하여 
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제2조 (정의)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>"서비스"란 회사가 제공하는 공인회계사 1차 모의고사 및 관련 부가서비스를 의미합니다.</li>
              <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 이용하는 회원을 말합니다.</li>
              <li>"회원"이란 회사와 서비스 이용계약을 체결하고 회원 아이디를 부여받은 자를 말합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우 회사는 변경사항을 시행일자 7일 전부터 공지합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제4조 (회원가입)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>이용자는 회사가 정한 절차에 따라 회원가입을 신청합니다.</li>
              <li>회사는 카카오 계정을 통한 소셜 로그인 방식으로 회원가입을 처리합니다.</li>
              <li>회원가입은 신청자의 신청에 대해 회사가 승낙함으로써 성립합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제5조 (서비스의 제공)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 다음과 같은 서비스를 제공합니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>공인회계사 1차 모의고사 서비스</li>
                  <li>빠른 채점 및 성적 분석 서비스</li>
                  <li>문항별 분석 및 통계 서비스</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제6조 (결제 및 환불)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>유료 서비스의 이용요금은 서비스 내에 표시된 금액을 기준으로 합니다.</li>
              <li>결제는 회사가 제공하는 결제 수단(신용카드, 간편결제 등)을 통해 진행됩니다.</li>
              <li>환불 정책:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li><strong>결제 후 7일 이내, 서비스 미이용 시:</strong> 전액 환불</li>
                  <li><strong>결제 후 7일 이내, 서비스 일부 이용 시:</strong> 이용일수에 해당하는 금액을 차감한 후 환불</li>
                  <li><strong>결제 후 7일 경과:</strong> 환불 불가</li>
                  <li><strong>모의고사 응시 후:</strong> 해당 회차 환불 불가 (미응시 회차에 한해 부분 환불 가능)</li>
                </ul>
              </li>
              <li>환불 신청은 고객센터(이메일: support@wiserlab.io) 또는 서비스 내 문의를 통해 접수할 수 있습니다.</li>
              <li>환불 처리는 신청일로부터 영업일 기준 3~5일 이내에 완료됩니다.</li>
              <li>결제 수단에 따라 환불 방법이 상이할 수 있으며, 카드 결제의 경우 카드사 정책에 따라 환불 기간이 달라질 수 있습니다.</li>
              <li>디지털 콘텐츠의 특성상, 콘텐츠를 다운로드하거나 열람한 경우 해당 콘텐츠에 대한 환불이 제한됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제7조 (이용자의 의무)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>이용자는 서비스 이용 시 관련 법령, 이 약관, 이용안내 등을 준수해야 합니다.</li>
              <li>이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.</li>
              <li>이용자는 서비스를 통해 제공받은 콘텐츠를 무단으로 복제, 배포, 전송해서는 안 됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제8조 (지적재산권)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>서비스 내 콘텐츠에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
              <li>이용자는 회사의 사전 동의 없이 콘텐츠를 상업적으로 이용할 수 없습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제9조 (면책조항)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 천재지변, 전쟁 등 불가항력으로 인한 서비스 제공 불가에 대해 책임지지 않습니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-normal mb-4 text-black">제10조 (분쟁해결)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사와 이용자 간 분쟁이 발생한 경우 상호 협의하여 해결합니다.</li>
              <li>협의가 이루어지지 않는 경우 관할 법원에 소송을 제기할 수 있습니다.</li>
            </ol>
          </section>

          <section className="pt-8 border-t border-gray-200">
            <p className="text-gray-500">
              <strong>부칙</strong><br />
              이 약관은 2025년 12월 20일부터 시행됩니다.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
