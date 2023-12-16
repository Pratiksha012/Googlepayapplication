const express = require('express');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Oracle DB Thin Driver Configuration
oracledb.initOracleClient({ libDir: '' });

// Oracle DB Configuration
const dbConfig = {
    user: 'pratiksha',
    password: 'Dragoon8870',
    connectString: 'localhost:1521/xe'
};

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For parsing application/json

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Management</title>
            <script>
                function submitUser() {
                    const username = document.getElementById('username').value;
                    const phoneNum = document.getElementById('phoneNum').value;
                    const gmailId = document.getElementById('gmailId').value;

                    fetch('/submit-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ username, phoneNum, gmailId })
                    })
                    .then(response => response.text())
                    .then(data => {
                        alert(data);
                        fetchUsers(); // Refresh the user list
                        document.getElementById('username').value = '';
                        document.getElementById('phoneNum').value = '';
                        document.getElementById('gmailId').value = '';
                    })
                    .catch(error => console.error('Error:', error));
                    
                    return false; // Prevent traditional form submission
                }

                function fetchUsers() {
                    fetch('/fetch-users')
                        .then(response => response.json())
                        .then(data => {
                            const table = document.getElementById('usersTable');
                            table.innerHTML = '<tr><th>Username</th><th>Phone Number</th><th>Gmail ID</th></tr>'; // Clear and set headers
                            data.forEach(item => {
                                const row = table.insertRow(-1);
                                row.insertCell(0).textContent = item.USERNAME;
                                row.insertCell(1).textContent = item.PHONE_NUM;
                                row.insertCell(2).textContent = item.GMAIL_ID;
                            });
                        })
                        .catch(error => console.error('Error:', error));
                }
            </script>
        </head>
        <body>
            <form onsubmit="return submitUser()">
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
                <br>

                <label for="phoneNum">Phone Number:</label>
                <input type="text" id="phoneNum" name="phoneNum" required>
                <br>

                <label for="gmailId">Gmail ID:</label>
                <input type="email" id="gmailId" name="gmailId" required>
                <br>

                <input type="submit" value="Submit">
            </form>

            <button onclick="fetchUsers()">Fetch Users</button>
            <table id="usersTable" border="1">
                <tr><th>Username</th><th>Phone Number</th><th>Gmail ID</th></tr>
            </table>
        </body>
        </html>
    `);
});

app.post('/submit-user', async (req, res) => {
    const { username, phoneNum, gmailId } = req.body;
    try {
        await insertUserIntoDatabase(username, phoneNum, gmailId);
        res.send('User inserted successfully');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error occurred while inserting user');
    }
});

app.get('/fetch-users', async (req, res) => {
    try {
        const users = await fetchUsersFromDatabase();
        res.json(users);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error occurred while fetching users');
    }
});

async function insertUserIntoDatabase(username, phoneNum, gmailId) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `INSERT INTO Userr (username, Phone_num, gmail_id) VALUES (:username, :phoneNum, :gmailId)`;
        const result = await connection.execute(sql, { username, phoneNum, gmailId }, { autoCommit: true });
        console.log("Row inserted:", result.rowsAffected);
    } catch (err) {
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function fetchUsersFromDatabase() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `SELECT username, Phone_num, gmail_id FROM Userr ORDER BY Phone_num`;
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows.map(row => ({ USERNAME: row.USERNAME, PHONE_NUM: row.PHONE_NUM, GMAIL_ID: row.GMAIL_ID }));
    } catch (err) {
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
