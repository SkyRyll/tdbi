// List entries in database
$(document).ready(function () {
    // Fetch data for List 1
    $.ajax({
        url: "/getAnimalCatalog", // Replace with the appropriate server route
        method: "GET",
        dataType: "json",
        success: function (data) {
            data.forEach(function (entry) {
                $("#animalCatalog").append(
                    '<li class="list-group-item bg-card p-1 catalog-row" onclick="redirectToEntry(\'' +
                        entry.scientificName +
                        '\')"><div class="row  m-1 bg-dark"><div class="col-md m-4 p-0  image-container"><img src="' +
                        entry.image +
                        '" id="img"></div><div class="col-md txt-center">' +
                        entry.scientificName +
                        '</div><div class="col-md txt-center">' +
                        entry.commonName +
                        '</div><div class="col-md txt-center">' +
                        entry.category +
                        '</div><div class="col-md txt-center">' +
                        entry.origin +
                        "</div></div></li>"
                );
            });
        },
        error: function (error) {
            console.error("Error fetching data for List 1: " + error.responseText);
        },
    });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Searchbar
document.getElementById("searchInput").addEventListener("input", function () {
    // Get the search input value
    const searchText = this.value.toLowerCase();

    // Get all list items within the #animalCatalog
    const listItems = document.querySelectorAll("#animalCatalog li");

    // Flag to check if any matching item was found
    let found = false;

    // Loop through the list items (starting from the second item)
    for (let i = 1; i < listItems.length; i++) {
        const item = listItems[i];
        const itemText = item.textContent.toLowerCase();

        if (itemText.includes(searchText)) {
            item.style.display = "block";
            found = true;
        } else {
            item.style.display = "none";
        }
    }

    // Check if no matching item was found and display "nothing found" message
    if (!found) {
        const nothingFoundRow = document.getElementById("nothingFoundRow");
        nothingFoundRow.style.display = "block";
    } else {
        const nothingFoundRow = document.getElementById("nothingFoundRow");
        nothingFoundRow.style.display = "none";
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// onclick routing
// Get all catalog rows
const catalogRows = document.querySelectorAll(".catalog-row");

// Add a click event listener to each row
function redirectToEntry(scientificName) {
    // Construct the URL based on the scientific name
    const url = `/entry/${encodeURIComponent(scientificName)}`;

    // Redirect to the new URL
    window.location.href = url;
}
