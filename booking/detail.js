(function () {
 'use strict';
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const root=document.getElementById('booking-detail'),code=new URLSearchParams(location.search).get('code');
 const b=BookingStore.find(code);
 if(!b){root.innerHTML='<div class="empty"><h3>Không tìm thấy mã đặt phòng</h3><p>Đơn có thể đã bị xóa hoặc được tạo ở trình duyệt khác.</p><a class="btn-solid" href="myBooking.html">Về danh sách</a></div>';return;}
 const money=n=>Number(n||0).toLocaleString('vi-VN')+'₫';
 const date=s=>String(s||'').split('-').reverse().join('/');
 const status=BookingStore.status(b),labels={confirmed:'Đã xác nhận (demo)',pending:'Đang chờ thanh toán (demo)',completed:'Đã lưu trú',cancelled:'Đã hủy'};
 const info=(label,value)=>`<span><strong>${label}:</strong> ${safe(value||'—')}</span>`;
 function render(){const current=BookingStore.find(code),st=BookingStore.status(current);root.innerHTML=`
 <article class="booking-card ${st==='cancelled'?'is-cancelled':''}"><div class="booking-card__photo photo--${safe(current.city==='vungtau'?'sea':'pine')}"></div>
 <div class="booking-card__body"><div class="booking-card__top"><div><h3>${safe(current.hotelName)}</h3><span class="booking-card__addr">${safe(current.roomName)}</span></div><span class="badge badge--${safe(st)}">${safe(labels[st])}</span></div>
 <div class="booking-card__meta">${info('Mã đặt phòng',current.code)}${info('Người nhận phòng',current.guestName)}${info('Email',current.email)}${info('Điện thoại',current.phone)}${info('Nhận phòng',date(current.checkin))}${info('Trả phòng',date(current.checkout))}${info('Số đêm',current.nights)}${info('Số khách',current.guests)}${info('Số phòng',current.rooms||1)}${info('Hình thức thanh toán',({bank:'Chuyển khoản (demo)',card:'Thẻ (demo)',hotel:'Tại khách sạn',momo:'MoMo (demo)',zalopay:'ZaloPay (demo)',vnpay:'VNPAY (demo)'})[current.payMethod]||current.payMethod)}${info('Ngày tạo',date((current.createdAt||'').slice(0,10)))}</div>
 <div class="booking-card__bottom"><div><div class="booking-card__price">${money(current.total)}</div><span class="booking-card__code">Đơn được lưu trong trình duyệt này, không phải đặt chỗ thật.</span></div><div class="booking-card__actions"><a href="myBooking.html" class="btn-ghost">Quay lại</a>${['confirmed','pending'].includes(st)&&current.checkin>new Date().toISOString().slice(0,10)&&current.refundable!==false?`<button type="button" class="btn-danger" id="cancel-detail">Hủy phòng</button>`:''}</div></div>
 </div></article>`;
 const btn=document.getElementById('cancel-detail');if(btn)btn.addEventListener('click',()=>{if(!confirm('Bạn muốn hủy đơn '+code+'?'))return;try{BookingStore.cancel(code);render();}catch(e){alert(e.message);}});
 }
 render();
})();
