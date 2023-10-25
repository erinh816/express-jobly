"use strict";

const { BadRequestError } = require("../expressError");

/**
 * Takes in two objects,
 * dataToUpdate: an object which is the parsed JSON from the request body representing
 * the information that the client wants to update
 * {numEmployees: 333, logoUrl: "https://myPhoto.com"}
 *
 * and jsToSql: an object where the values represent the snake case names that we
 * want to convert the column names to for the SQL query
 * {numEmployees: "num_employees", logoUrl: "logo_url", ...}
 *
 * Returns an object which will be used in data model update methods for SQL queries
 * which now has correctly cased column names
 * {setCols: '"num_employees"=$1, "logo_url"=$2', values: [333, "https://myPhoto.com"]}
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
