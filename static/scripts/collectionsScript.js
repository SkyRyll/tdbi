// List collections in database
$(document).ready(function () {
    // Fetch data for collections
    $.ajax({
        url: "/getCollections", // Replace with the appropriate server route
        method: "GET",
        dataType: "json",
        success: function (data) {
            data.forEach(function (collection) {
                const cardHtml = createCard(collection);
                $("#collectionCards").append(cardHtml);
            });
        },
        error: function (error) {
            console.error("Error fetching data for List 1: " + error.responseText);
        },
    });
});

function createCard(collection) {
    return `
        <div class="col-md-4">
            <div class="card bg-dark">
                <div class="card-body">
                    <h5 class="card-title">${collection.name}</h5>
                    <p class="card-text">${collection.description}</p>
                    <a href="#" class="btn btn-primary">Click me</a>
                </div>
            </div>
        </div>`;
}
