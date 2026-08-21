(function($) {
    $(document).ready(function() {
        // Otwieranie modala
        $('.open-modal').on('click', function() {
            var modalId = $(this).data('modal-id');
            $('#' + modalId).fadeIn();
        });
    
        // Zamykanie modala po kliknięciu na "x"
        $('.close').on('click', function() {
            var modalId = $(this).data('modal-id');
            $('#' + modalId).fadeOut();
        });
    
        // Zamykanie modala po kliknięciu na obszar poza modalem
        $(window).on('click', function(event) {
            if ($(event.target).hasClass('modal')) {
                $(event.target).fadeOut();
            }
        });
    });
})(jQuery);