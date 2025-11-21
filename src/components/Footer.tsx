const Footer = () => {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">와이저랩</h2>
            <p className="text-sm text-muted-foreground">
              CPA 시험 준비의 새로운 기준
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div>
              <h4 className="font-semibold mb-3">서비스</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">모의고사</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">해설집</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">성적 분석</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">고객지원</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">공지사항</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">문의하기</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">회사</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">회사소개</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">이용약관</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">개인정보처리방침</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2024 와이저랩. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
