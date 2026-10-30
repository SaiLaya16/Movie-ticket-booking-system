const API_URL = "http://localhost:5000/api";

const movieSelect = document.getElementById("movieSelect");
const showSelect = document.getElementById("showSelect");
const seatContainer = document.getElementById("seatContainer");

const totalSeats = document.getElementById("totalSeats");
const bookedSeats = document.getElementById("bookedSeats");
const availableSeats = document.getElementById("availableSeats");

const customerName = document.getElementById("customerName");
const bookButton = document.getElementById("bookButton");
const message = document.getElementById("message");

let selectedSeatId = null;


// ------------------------------------
// 1. Load Movies
// ------------------------------------

async function loadMovies() {

    try {

        const response = await fetch(`${API_URL}/movies`);
        const movies = await response.json();

        movieSelect.innerHTML =
            '<option value="">Select a movie</option>';

        movies.forEach(movie => {

            const option = document.createElement("option");

            option.value = movie.movie_id;
            option.textContent =
                `${movie.title} - ${movie.language}`;

            movieSelect.appendChild(option);
        });

    } catch (error) {

        console.error(error);

        message.textContent =
            "Failed to load movies.";
    }
}


// ------------------------------------
// 2. Load Shows
// ------------------------------------

movieSelect.addEventListener("change", async function () {

    const movieId = this.value;

    showSelect.innerHTML =
        '<option value="">Select a show</option>';

    seatContainer.innerHTML =
        "<p>Select a show to view seats.</p>";

    totalSeats.textContent = "0";
    bookedSeats.textContent = "0";
    availableSeats.textContent = "0";

    if (!movieId) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/movies/${movieId}/shows`);

        const shows = await response.json();

        const displayedTimes = new Set();

shows.forEach(show => {

    const showTime = `${show.show_date} - ${show.show_time}`;

    if (!displayedTimes.has(showTime)) {

        displayedTimes.add(showTime);

        const option = document.createElement("option");

        option.value = show.show_id;
        option.textContent = showTime;

        showSelect.appendChild(option);
    }
});

        

    } catch (error) {

        console.error(error);

        message.textContent =
            "Failed to load shows.";
    }
});


// ------------------------------------
// 3. Load Seats
// ------------------------------------

showSelect.addEventListener("change", async function () {

    const showId = this.value;

    selectedSeatId = null;

    if (!showId) {
        return;
    }

    await loadSeats(showId);
});


async function loadSeats(showId) {

    try {

        const response =
            await fetch(`${API_URL}/shows/${showId}/seats`);

        const data = await response.json();

        totalSeats.textContent =
            data.total_seats;

        bookedSeats.textContent =
            data.booked_seats;

        availableSeats.textContent =
            data.available_seats;

        seatContainer.innerHTML = "";

        data.seats.forEach(seat => {

            const button =
                document.createElement("button");

            button.classList.add("seat");

            button.textContent =
                seat.seat_number;

            button.dataset.seatId =
                seat.seat_id;

            if (seat.status === "booked") {

                button.classList.add("booked");

                button.disabled = true;

            } else {

                button.classList.add("available");

                button.addEventListener(
                    "click",
                    function () {

                        selectSeat(button, seat.seat_id);
                    }
                );
            }

            seatContainer.appendChild(button);
        });

    } catch (error) {

        console.error(error);

        message.textContent =
            "Failed to load seats.";
    }
}


// ------------------------------------
// 4. Select Seat
// ------------------------------------

function selectSeat(button, seatId) {

    document
        .querySelectorAll(".seat.selected")
        .forEach(seat => {

            seat.classList.remove("selected");

            seat.classList.add("available");
        });

    button.classList.remove("available");

    button.classList.add("selected");

    selectedSeatId = seatId;
}


// ------------------------------------
// 5. Book Seat
// ------------------------------------

bookButton.addEventListener("click", async function () {

    const showId = showSelect.value;
    const name = customerName.value.trim();

    if (!showId) {

        message.textContent =
            "Please select a show.";

        return;
    }

    if (!selectedSeatId) {

        message.textContent =
            "Please select a seat.";

        return;
    }

    if (!name) {

        message.textContent =
            "Please enter your name.";

        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/bookings`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    show_id: Number(showId),
                    customer_name: name,
                    seat_id: selectedSeatId
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            message.textContent =
                "Booking successful!";

            customerName.value = "";

            selectedSeatId = null;

            await loadSeats(showId);

        } else {

            message.textContent =
                data.message || "Booking failed.";
        }

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to connect to the server.";
    }
});


// ------------------------------------
// Start Application
// ------------------------------------

loadMovies();