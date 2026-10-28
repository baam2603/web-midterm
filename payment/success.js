(function () {
 'use strict';
 const code=new URLSearchParams(location.search).get('code');
 const b=BookingStore.find(code),main=document.querySelector('.success-page');
 if(!b){main.innerHTML='<div class="success-header"><h1>Không tìm thấy thông tin đặt phòng</h1><p>Vui lòng kiểm tra đơn đã lưu trong trang Đặt phòng của tôi.</p><a href="../booking/myBooking.html">Xem đặt phòng của tôi</a></div>';return;}
 const date=s=>String(s).split('-').reverse().join('/');
 const texts=main.querySelectorAll('.detail-value');
 main.querySelector('.booking-card__id strong').textContent='#'+b.code;
 if(texts[0])texts[0].textContent=date(b.checkin)+' — '+date(b.checkout);
 if(texts[1])texts[1].textContent='Nhận phòng từ 14:00 · Xuất trình giấy tờ tùy thân';
 main.querySelector('.success-header p').textContent=b.status==='pending'?'Đã ghi nhận đơn chờ thanh toán (mô phỏng).':'Đơn đặt phòng đã được ghi nhận trong trình duyệt (mô phỏng).';
 main.querySelector('.booking-card__note').textContent=`${b.hotelName} · ${b.roomName} · ${b.guests} khách · ${b.rooms||1} phòng. Tổng ${Number(b.total).toLocaleString('vi-VN')}₫. Đây là bản demo: chưa có xác nhận từ khách sạn, chưa gửi email và chưa thu tiền.`;
 const buttons=main.querySelectorAll('.btn-action');
 buttons[0].addEventListener('click',()=>{
   const toUTC=iso=>iso.replace(/-/g,'')+'T070000Z';
   const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//THREEK//DEMO//VI','BEGIN:VEVENT','UID:'+b.code+'@threek-demo','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART:'+toUTC(b.checkin),'DTEND:'+toUTC(b.checkout),'SUMMARY:Nhận phòng '+b.hotelName,'DESCRIPTION:Mã đơn '+b.code+' - Đặt phòng mô phỏng','END:VEVENT','END:VCALENDAR'].join('\r\n');
   const href=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=href;a.download=b.code+'.ics';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
 });
 buttons[1].addEventListener('click',()=>location.href='../booking/detail.html?code='+encodeURIComponent(b.code));
})();
