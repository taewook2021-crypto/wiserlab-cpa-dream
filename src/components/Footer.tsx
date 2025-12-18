import { Link } from "react-router-dom";
import wiserLabLogo from "@/assets/wiser-lab-logo.svg";

const Footer = () => {
  return <footer className="bg-black text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div>
            <img src={wiserLabLogo} alt="Wiser Lab" className="h-4 mb-6" style={{ filter: 'brightness(0) invert(1)' }} />
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/summit" className="hover:text-white transition-colors">
                  SUMMIT Contents
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Policies */}
          <div>
            <h4 className="font-normal mb-6 tracking-wide">Service Policies</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-normal mb-6 tracking-wide">Contact</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>1:1 문의</li>
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
            와이저랩 주식회사 | 대표 김태욱
          </p>
          <p className="text-xs text-gray-500 mb-2">
            사업자등록번호 288-87-03554 | 법인등록번호 110111-0942654
          </p>
          <p className="text-xs text-gray-500 mb-2">
            서울특별시 관악구 행운2길 1, 4층 404호(봉천동)
          </p>
          
          <p className="text-xs text-gray-600 mt-4">
            COPYRIGHT 와이저랩 주식회사. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;