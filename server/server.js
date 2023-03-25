const express = require('express')
const pg = require("pg")
const app = express()

var conString = 'postgres://wuzilong:802613@localhost:5432/prweb'

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Default to accept all requests
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*")
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

/**
 * Only to check it works
 */
app.get("/", function (req, res) {
	var jsonString
	jsonString = JSON.stringify({ ok: 1 })

	res.setHeader('Content-Type', 'application/json')
	res.send(jsonString)
})

/**
 * Authenticate function
 */
app.post("/authenticate", function (req, res) {
	var login = req.body.login
	var passwd = req.body.passwd

	var jsonString
	if ((login === "admin") && (passwd === "admin")) {
		jsonString = JSON.stringify({ ok: 1 })
	} else {
		jsonString = JSON.stringify({ ok: 0 })
	}
	res.setHeader('Content-Type', 'application/json')
	res.send(jsonString)
})

/**
 * Send request to Postgresql server
 * @param {*} req 
 * @param {*} res 
 * @param {*} sqlRequest 
 * @param {*} values 
 */
function getSQLResult (req, res, sqlRequest, values) {
	var client = new pg.Client(conString)
	client.connect(function (err) {
		if (err) {
			// Cannot connect
			console.error('cannot connect to postgres', err)
			res.status(500).end('Database connection error!')
		} else {
			// Connection is OK
			client.query(sqlRequest, values, function (err, result) {
				if (err) {
					// Request fails
					console.error('bad request', err)
					res.status(500).end('Bad request error!')
				} else {
					// Build result array from SQL result rows
					var results = []
					for (var ind in result.rows) {
						results.push(result.rows[ind])
					}
					console.log(results)
					// Convert object to a JSON string and send it back
					res.setHeader('Content-Type', 'application/json')
					res.send(JSON.stringify(results))
				}
				client.end()
			})
		}
	})
}

/**
 * Get users list
 */
app.post("/users", function (req, res) {
	var sqlRequest = "SELECT * FROM Person ORDER BY Person_LastName, Person_FirstName"
	var values = []
	getSQLResult(req, res, sqlRequest, values)
})

app.get("/users", function (req, res) {
	var sqlRequest = "SELECT * FROM Person ORDER BY Person_LastName, Person_FirstName"
	var values = []
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/user", function (req, res) {
	var id = req.body.id
	var sqlRequest = "SELECT * FROM Person WHERE person_id=$1"
	var values = [id]
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/saveUser", function (req, res) {
	var person_id = req.body.person_id
	var person_firstname = req.body.person_firstname
	var person_lastname = req.body.person_lastname
	var person_birthdate = req.body.person_birthdate

	var sqlRequest = ""
	var values = []
	// We build a request that returns ID value to be able to returns its value (Person_ID)
	if (person_id < 0) {
		sqlRequest = "INSERT INTO Person(Person_FirstName, Person_LastName, Person_BirthDate)"
			+ " VALUES ($1, $2, $3)"
			+ " RETURNING Person_ID"
		values = [person_firstname, person_lastname, person_birthdate]
	} else {
		sqlRequest = "UPDATE Person SET"
			+ " Person_FirstName=$1, Person_LastName=$2, Person_BirthDate=$3"
			+ " WHERE Person_ID=$4"
			+ " RETURNING Person_ID"
		values = [person_firstname, person_lastname, person_birthdate, person_id]
	}
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/deleteUser", function (req, res) {
	var person_id = req.body.person_id

	var sqlRequest = "DELETE FROM Person WHERE Person_ID=$1"
	var values = [person_id]
	getSQLResult(req, res, sqlRequest, values)
})


/**
 * Get books list
 */
app.post("/books", function (req, res) {
	var sqlRequest = "SELECT * FROM Book ORDER BY Book_Title, Book_Authors"
	var values = []
	getSQLResult(req, res, sqlRequest, values)
})

app.get("/books", function (req, res) {
	var sqlRequest = "SELECT * FROM Book ORDER BY Book_Title, Book_Authors"
	var values = []
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/book", function (req, res) {
	var id = req.body.id
	var sqlRequest = "SELECT * FROM Book WHERE Book_id=$1"
	var values = [id]
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/saveBook", function (req, res) {
	var book_id = req.body.book_id
	var book_title = req.body.book_title
	var book_authors = req.body.book_authors

	var sqlRequest = ""
	var values = []
	// We build a request that returns ID value to be able to returns its value (Book_ID)
	if (book_id < 0) {
		sqlRequest = "INSERT INTO Book(Book_Title, Book_Authors)"
			+ " VALUES ($1, $2)"
			+ " RETURNING Book_ID"
		values = [book_title, book_authors]
	} else {
		sqlRequest = "UPDATE Book SET"
			+ " Book_Title=$1, Book_Authors=$2"
			+ " WHERE Book_ID=$3"
			+ " RETURNING Book_ID"
		values = [book_title, book_authors, book_id]
	}
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/deleteBook", function (req, res) {
	var book_id = req.body.book_id

	var sqlRequest = "DELETE FROM Book WHERE Book_ID=$1"
	var values = [book_id]
	getSQLResult(req, res, sqlRequest, values)
})

/**
 * Get borrows
 */
app.post("/borrows", function (req, res) {
	var person_id = req.body.person_id
	var sqlRequest = "SELECT Borrow.*, Book_Title FROM Borrow JOIN Book USING (Book_ID) WHERE Person_ID=$1 ORDER BY Borrow_ID"
	var values = [person_id]
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/borrow", function (req, res) {
	var id = req.body.id
	var sqlRequest = "SELECT Borrow.*, Book_Title FROM Borrow JOIN Book USING (Book_ID) WHERE Borrow_ID=$1"
	var values = [id]
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/returnBook", function (req, res) {
	var borrow_id = req.body.borrow_id
	var borrow_return = req.body.borrow_return

	var sqlRequest = "UPDATE Borrow SET"
		+ " Borrow_Return=$1"
		+ " WHERE Borrow_ID=$2"
		+ " RETURNING Borrow_ID"
	var values = [borrow_return, borrow_id]
	getSQLResult(req, res, sqlRequest, values)
})

app.post("/saveBorrow", function (req, res) {
	var person_id = req.body.person_id
	var book_id = req.body.book_id
	var borrow_date = req.body.borrow_date

	var sqlRequest = ""
	var values = []
	// We build a request that returns ID value to be able to returns its value (Borrow_ID)
	sqlRequest = "INSERT INTO Borrow(Person_ID, Book_ID, Borrow_Date)"
		+ " VALUES ($1, $2, $3)"
		+ " RETURNING Borrow_ID"
	values = [person_id, book_id, borrow_date]
	getSQLResult(req, res, sqlRequest, values)
})

// Must be LAST instruction of the file
// Listen to port 8000
app.listen(8000, () => {
	console.log('Server started!')
});

