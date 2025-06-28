document.addEventListener("DOMContentLoaded", function() {
    // Open modal
    document.querySelectorAll('[data-toggle="modal"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const modal = document.querySelector(btn.getAttribute('data-target'));
            if (modal) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                modal.setAttribute('aria-hidden', 'false');
            }
        });
    });

    // Close modal (for all close buttons)
    document.querySelectorAll('[data-dismiss="modal"]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const modal = btn.closest('.fixed');
            if (modal) {
                modal.classList.add('opacity-0', 'pointer-events-none');
                modal.setAttribute('aria-hidden', 'true');
            }
        });
    });
});