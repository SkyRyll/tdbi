$(document).ready(function () {
    // Fetch data for List 1
    $.ajax({
        url: "/getAnimalCatalog", // Replace with the appropriate server route
        method: "GET",
        dataType: "json",
        success: function (data) {
            data.forEach(function (entry) {
                $("#animalCatalog").append(
                    '<li class="list-group-item bg-dark"><div class="row"><div class="col-md image-container"><img src="' +
                        entry.image +
                        '" alt="noImage.jpg"></div><div class="col-md">' +
                        entry.scientificName +
                        '</div><div class="col-md">' +
                        entry.commonName +
                        '</div><div class="col-md">' +
                        entry.category +
                        '</div><div class="col-md">' +
                        entry.origin +
                        "</div></div></li>"
                );
            });
        },
        error: function (error) {
            console.error(
                "Error fetching data for List 1: " + error.responseText
            );
        },
    });
});
