const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <h3 className="font-normal text-lg mb-6 tracking-wide">WISER LAB</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>Summit Program</li>
              <li>Performance Analysis</li>
            </ul>
          </div>

          {/* Service Policies */}
          <div>
            <h4 className="font-normal mb-6 tracking-wide">Service Policies</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-normal mb-6 tracking-wide">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>1:1 문의</li>
              <li>자주 묻는 질문</li>
              <li>공지사항</li>
            </ul>
          </div>

          {/* Support Hours */}
          <div>
            <h4 className="font-normal mb-6 tracking-wide flex items-center gap-2">
              문의하기
              <span className="inline-block w-8 h-8 bg-white rounded-full"></span>
            </h4>
            <p className="text-sm text-gray-400">
              평일 10:00~18:00 (점심시간 12:00~13:00)
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-2">
            (주)와이저컨설팅
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            대표이사 박근수 | 사업자소재지 서울특별시 강남구 삼성동 227 태헤빌딩 2층 (대지동) | 사업자등록번호 505-85-28117 | 통신판매업신고 제 2024-서울강남-01598 [정보확인]
          </p>
          <p className="text-xs text-gray-600 mt-4">
            COPYRIGHT (주)와이저컨설팅. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
