const daySelect = document.getElementById('day-select');
for (let i = 1; i <= 31; i++) {
    let option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    daySelect.appendChild(option);
}
const monthSelect = document.getElementById('month-select');
for (let i = 1; i <= 12; i++) {
    let option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    monthSelect.appendChild(option);
}
const yearSelect = document.getElementById('year-select');
const currYear = new Date().getFullYear();
for (let i = currYear; i >= 1900; i--) {
    let option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    yearSelect.appendChild(option);
}
(function () {
    'use strict';
    window.addEventListener('load', function () {
        var forms = document.getElementsByClassName('needs-validation');
        Array.prototype.forEach.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });
    });
})();