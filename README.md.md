# Jobly Backend

This is the Express backend for Jobly

To run this:

    node server.js

To run the tests:

    jest -i

## Models:

**User** {username, first_name, last_name, email, is_admin, applications}

**Company** {handle, name, description, numEmployees, logoUrl}

**Job** {id, title, salary, equity, companyHandle}

## Routes:

### Auth Routes

**POST /auth/token** - Login for user.  { username, password } => { token }  Returns JWT token which can be used to authenticate further requests.

**POST /auth/register** -  User must include { username, password, firstName, lastName, email } Returns JWT token which can be used to authenticate further requests.

### User **Routes**

**POST /users/** -  Adds a new user. This is not the registration endpoint --- instead, this is only for admin users to add new users. The new user being added can be an admin.

**GET /users/** - Returns list of all users.  Authorization required: Logged In as User.

**GET /users/:username** - Returns { username, firstName, lastName, isAdmin } for specific username if found.  Authorization required: Either logged in as the current user in URL or Admin.

**PATCH /users/:username** - Updates user.  Returns { username, firstName, lastName, email, isAdmin }   Authorization required: Either logged in as the current user in URL or Admin.

**POST /users/:username/jobs/:id** - Applies to Job based on Job Id.  Returns { username, job_id }  Authorization required: Either logged in as the current user in URL or Admin.

**DELETE /users/:username** - Deletes User.  Authorization required: Either logged in as the current user in URL or Admin.

### Company **Routes**

**POST /companies/** - Creates a new company.  Company should be { handle, name, description, numEmployees, logoUrl }  Returns { handle, name, description, numEmployees, logoUrl }  Authorization required: Admin

**GET /companies/** - Gets all companies.  Can filter with following query strings: minEmployees, maxEmployees, name (will find case-insensitive, partial matches)

**GET /companies/:handle** - Gets single company based on handle.   *  Company is { handle, name, description, numEmployees, logoUrl, jobs } where jobs is [{ id, title, salary, equity },...]

**PATCH /companies/:handle** - Patches Company Data.  Fields can be: { name, description, numEmployees, logo_url }  Authorization required: Admin

**DELETE /companies/:handle** - Deletes Company.  Authorization required: Admin

### Job Routes

**POST /jobs/** - Creates New Job.  Job should be {title, companyHandle, OPTIONAL: salary, equity}  Returns { id, title, salary, equity, companyHandle }  Authorization required: Admin

**GET /jobs/** - Gets all jobs.  Can filter with following query strings: title (will find case-insensitive, partial matches), minSalary, hasEquity (true or false)

**GET /jobs/:id** Gets Job based on ID.  Job is { id, title, salary, equity, companyHandle }

**PATCH /jobs/:id** Patches job data.  Fields can be: { title, salary, equity }  Authorization required: Admin

**DELETE /jobs/:id** Deletes job.  Authorization required: Admin
