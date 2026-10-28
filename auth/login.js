(function () {
 'use strict';
 const form=document.querySelector('form');
 const status=document.createElement('p');status.setAttribute('role','alert');status.style.marginTop='12px';status.style.color='#b83b37';form.appendChild(status);
 const redirect=new URLSearchParams(location.search).get('next');
 const destination=redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '../index1.html';
 form.addEventListener('submit',async e=>{
   e.preventDefault();status.textContent='';
   try { await loginUser(document.getElementById('email').value,document.getElementById('password').value);location.href=destination; }
   catch(err){status.textContent=err.message;}
 });
 document.querySelector('.btn-register').addEventListener('click',e=>{e.preventDefault();location.href='register.html'+(redirect?'?next='+encodeURIComponent(redirect):'');});
 document.querySelector('.btn-forgot-pass').addEventListener('click',e=>{e.preventDefault();status.textContent='Bản demo chưa có dịch vụ gửi email đặt lại mật khẩu. Vui lòng dùng tài khoản đã đăng ký hoặc tạo tài khoản mới.';});
})();
