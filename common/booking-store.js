/* Shared in-browser UI demo store. No server, actual room hold, or real payment. */
(function () {
  'use strict';
  const KEY = 'threek_bookings';
  function all() { try { const list=JSON.parse(localStorage.getItem(KEY)||'[]'); return Array.isArray(list)?list:[]; } catch {return [];} }
  function write(list) { localStorage.setItem(KEY,JSON.stringify(list)); window.dispatchEvent(new Event('threek:bookings-updated')); }
  const overlap=(a,b,c,d)=>a < d && c < b;
  function status(b) { return b.status === 'confirmed' && b.checkout <= new Date().toISOString().slice(0,10) ? 'completed' : b.status; }
  function availability(city,id,room,checkin,checkout,stock=5,ignoreCode='') {
    const used=all().filter(b=>b.code!==ignoreCode && b.city===city && b.hotelId===id && b.roomId===room && ['confirmed','pending'].includes(status(b)) && overlap(b.checkin,b.checkout,checkin,checkout)).reduce((n,b)=>n+Math.max(1,Number(b.rooms)||1),0);
    return Math.max(0,Math.max(1,Number(stock)||5)-used);
  }
  function save(record) {
    if (!record || !record.code || !record.hotelId || !record.roomId) throw Error('Thiếu dữ liệu đặt phòng.');
    const list=all(), index=list.findIndex(b=>b.code===record.code);
    if (index>=0) return list[index]; // idempotent, never duplicate an order
    list.push(record);write(list);return record;
  }
  function cancel(code) {
    const list=all(), order=list.find(b=>b.code===code);
    if (!order) throw Error('Không tìm thấy đặt phòng.');
    if (!['confirmed','pending'].includes(status(order))) throw Error('Đơn này không thể hủy.');
    if (order.checkin <= new Date().toISOString().slice(0,10)) throw Error('Không thể hủy đơn đã đến ngày nhận phòng.');
    if (order.refundable === false) throw Error('Giá phòng này không hỗ trợ hủy qua giao diện demo.');
    order.status='cancelled';order.cancelledAt=new Date().toISOString();write(list);return order;
  }
  window.BookingStore={all,find:(code)=>all().find(b=>b.code===code),save,cancel,status,availability};
})();
