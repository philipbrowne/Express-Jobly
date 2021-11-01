const { BadRequestError } = require('../expressError');

// This Function Makes a SQL Update Based on the Object Keys that are provided to it and handles the parameters accordingly, assigning $1, $2 to each key
// The keys must be part of the existing JSON Schema

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError('No data');

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // Each Object Key will represent a SQL Column to Update and will be converted appropriately to $1, $2, etc
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(', '),
    values: Object.values(dataToUpdate),
  };
}

// Runs query on Companies based on Query String of Name and Min/Max Employees
// Optional Search Parameters {minEmployees, maxEmployees, name}
function sqlCompanyQuery(data) {
  const keys = Object.keys(data);
  if (keys.length === 0) throw new BadRequestError('No data');
  let num = 0;
  const queries = [];
  const valueArr = [];
  // Filters Case-Insensitive Like for "Name" column
  if (data.name) {
    num++;
    queries.push(`"name" ILIKE $${num}`);
    valueArr.push(`%${data.name}%`);
  }
  // Filters for Min/Max Employees

  if (data.minEmployees || data.maxEmployees) {
    const min = parseInt(data.minEmployees);
    const max = parseInt(data.maxEmployees);
    if (parseInt(data.minEmployees) > parseInt(data.maxEmployees)) {
      throw new BadRequestError('Invalid min/max employee values');
    }
    if (data.minEmployees && !data.maxEmployees) {
      if (min === NaN) {
        throw new BadRequestError('Invalid min/max employee values');
      }
      num++;
      queries.push(`num_employees >= $${num}`);
      valueArr.push(data.minEmployees);
    } else if (data.maxEmployees && !data.minEmployees) {
      if (max === NaN) {
        throw new BadRequestError('Invalid min/max employee values');
      }
      num++;
      queries.push(`num_employees < $${num}`);
      valueArr.push(data.maxEmployees);
    } else {
      if (!min || !max) {
        throw new BadRequestError('Invalid min/max employee values');
      }
      num++;
      queries.push(`num_employees >= $${num}`);
      valueArr.push(data.minEmployees);
      num++;
      queries.push(`num_employees <= $${num}`);
      valueArr.push(data.maxEmployees);
    }
  }

  return {
    queries: queries.join(' AND '),
    values: valueArr,
  };
}

function sqlJobQuery(data) {
  const keys = Object.keys(data);
  if (keys.length === 0) throw new BadRequestError('No data');
  let num = 0;
  const queries = [];
  const valueArr = [];
  // Filters Case-Insensitive Like for "Name" column
  if (data.title) {
    num++;
    queries.push(`"title" ILIKE $${num}`);
    valueArr.push(`%${data.title}%`);
  }
  if (data.hasEquity && data.hasEquity.toLowerCase() === 'true') {
    queries.push(`"equity" > 0`);
  }
  if (data.minSalary) {
    const min = parseInt(data.minSalary);
    if (!min || min < 0) {
      throw new BadRequestError('Invalid minSalary value');
    }
    num++;
    queries.push(`"salary" >= $${num}`);
    valueArr.push(data.minSalary);
  }
  return {
    queries: queries.join(' AND '),
    values: valueArr,
  };
}

module.exports = { sqlForPartialUpdate, sqlCompanyQuery, sqlJobQuery };
