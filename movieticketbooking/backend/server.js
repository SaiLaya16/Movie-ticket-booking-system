const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
    res.send("Movie Ticket Booking API is running");
});

// GET all movies
app.get("/api/movies", (req, res) => {

    const sql = "SELECT * FROM movies";

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Failed to fetch movies"
            });
        }

        res.json(results);
    });
});

// GET shows for a particular movie
app.get("/api/movies/:movieId/shows", (req, res) => {

    const movieId = req.params.movieId;

    const sql = `
        SELECT 
            show_id,
            movie_id,
            show_date,
            show_time
        FROM shows
        WHERE movie_id = ?
    `;

    db.query(sql, [movieId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Failed to fetch shows"
            });
        }

        res.json(results);
    });
});

// GET seats for a particular show
app.get("/api/shows/:showId/seats", (req, res) => {

    const showId = req.params.showId;

    const sql = `
        SELECT
            s.seat_id,
            s.seat_number,
            CASE
                WHEN b.booking_id IS NULL THEN 'available'
                ELSE 'booked'
            END AS status
        FROM seats s
        LEFT JOIN bookings b
            ON s.seat_id = b.seat_id
            AND s.show_id = b.show_id
        WHERE s.show_id = ?
        ORDER BY s.seat_id
    `;

    db.query(sql, [showId], (err, seats) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Failed to fetch seats"
            });
        }

        const totalSeats = seats.length;

        const bookedSeats = seats.filter(
            seat => seat.status === "booked"
        ).length;

        const availableSeats = totalSeats - bookedSeats;

        res.json({
            show_id: Number(showId),
            total_seats: totalSeats,
            booked_seats: bookedSeats,
            available_seats: availableSeats,
            seats: seats
        });
    });
});

// POST book a seat
app.post("/api/bookings", (req, res) => {

    const { show_id, customer_name, seat_id } = req.body;

    // Check required fields
    if (!show_id || !customer_name || !seat_id) {
        return res.status(400).json({
            success: false,
            message: "Show ID, customer name and seat ID are required"
        });
    }

    // First check whether the seat belongs to this show
    const checkSeatSql = `
        SELECT *
        FROM seats
        WHERE seat_id = ?
        AND show_id = ?
    `;

    db.query(
        checkSeatSql,
        [seat_id, show_id],
        (err, seatResults) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (seatResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid seat for this show"
                });
            }

            // Try to create booking
            const bookingSql = `
                INSERT INTO bookings
                (show_id, customer_name, seat_id)
                VALUES (?, ?, ?)
            `;

            db.query(
                bookingSql,
                [show_id, customer_name, seat_id],
                (err, result) => {

                    if (err) {

                        // Duplicate seat
                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(409).json({
                                success: false,
                                message: "This seat is already booked for this show"
                            });
                        }

                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message: "Booking failed"
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Seat booked successfully",
                        booking_id: result.insertId
                    });
                }
            );
        }
    );
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});