import React from "react";

export default function Footer() {
  return (
    <footer className="bg-red-600 text-white py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo + description */}
        <div>
          <h4 className="text-2xl font-extrabold mb-4">FITMATE</h4>
          <p className="text-red-100 text-sm leading-6">
            เปลี่ยนพลังงานให้เป็นรูปร่างในแบบของคุณ
            <br />
            ออกแบบโปรแกรมเวิร์คเอาต์ให้เหมาะกับแต่ละคน
          </p>
        </div>

        {/* HQ */}
        <div>
          <h5 className="font-bold mb-4">สำนักงานใหญ่</h5>
          <p className="text-red-100 text-sm leading-6">
            มหาวิทยาลัยเกษตรศาสตร์
            <br />
            วิทยาเขตกำแพงแสน
            <br />
            1 หมู่ 6 ถนนมาลัยแมน
            <br />
            ตำบลกำแพงแสน อำเภอกำแพงแสน
            <br />
            จังหวัดนครปฐม 73140
            <br />
            ประเทศไทย
          </p>
        </div>

        {/* Pages */}
        <div>
          <h5 className="font-bold mb-4">หน้าเรา</h5>
          <ul className="space-y-2 text-red-100 text-sm">
            <li>
              <a href="/contactus" className="hover:text-white">
                เกี่ยวกับเรา
              </a>
            </li>
            <li>
              <a href="/trainer" className="hover:text-white">
                เทรนเนอร์ทั้งหมด
              </a>
            </li>
            <li>
              <a href="/review" className="hover:text-white">
                รีวิวลูกค้า
              </a>
            </li>
            <li>
              <a href="/contactus" className="hover:text-white">
                ติดต่อเรา
              </a>
            </li>
          </ul>
        </div>

        {/* Social links */}
        <div>
          <h5 className="font-bold mb-4">social links</h5>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com/ITKUKPS/?locale=th_TH"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded flex items-center justify-center transition"
            >
              <img
                src="/images/face001.png"
                alt="Facebook"
                className="w-8 h-8 object-cover"
              />
            </a>
            <a
              href="https://www.instagram.com/flaskukps/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded flex items-center justify-center transition"
            >
              <img
                src="/images/ig001.png"
                alt="Instagram"
                className="w-8 h-8 object-cover"
              />
            </a>
            <a
              href="https://www.youtube.com/@%E0%B8%84%E0%B8%93%E0%B8%B0%E0%B8%A8%E0%B8%B4%E0%B8%A5%E0%B8%9B%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%8C%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%A7%E0%B8%B4%E0%B8%97%E0%B8%A2%E0%B8%B2%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B8%9A%E0%B8%A1%E0%B8%81"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded flex items-center justify-center transition"
            >
              <img
                src="/images/yt001.png"
                alt="YouTube"
                className="w-8 h-8 object-cover"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
