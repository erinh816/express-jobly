"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Takes in filterCriteria, which can be empty
   * Finds all companies matching filterCriteria,
   * Or all companies if filterCriteria is empty
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  //TODO:refactor, 66 - 82 move to a helper function, add sql injection stuff
  static async findAll(filterCriteria) {
    const { whereClause, values } = Company.companySqlFilter();
    console.log("hahahha", whereClause);

    const companiesRes = await db.query(`
    SELECT handle,
           name,
           description,
           num_employees AS "numEmployees",
           logo_url      AS "logoUrl"
    FROM companies
    ${whereClause}
    ORDER BY name`, [...values]);

    return companiesRes.rows;
  }


  //helper here no doc
  static companySqlFilter(filterCriteria) {
    const criterias = [];
    const values = [];
    const filters = [];
    let whereClause;

    if (Object.keys(filterCriteria).length > 0) {
      for (const criteria in filterCriteria) {
        console.log(criteria);
        if (criteria === 'minEmployees') {
          criterias.push('num_employees > ' + filterCriteria[criteria]);
          values.push(parseInt(filterCriteria[criteria]));
          filters.push('num_employees' + ' >');
        }
        else if (criteria === 'maxEmployees') {
          criterias.push('num_employees < ' + filterCriteria[criteria]);
          values.push(parseInt(filterCriteria[criteria]));
          filters.push('num_employees' + ' <');
        }
        else if (criteria === 'nameLike') {
          criterias.push(`name ILIKE '%${filterCriteria[criteria]}%'`);
          values.push("%" + filterCriteria[criteria] + "%");
          filters.push('name ILIKE ');
          //name ILIKE %sons%
        }
      }
    }
    // console.log(values);
    // console.log('model criterias array', criterias);
    // whereClause = criterias.length > 0 ? `WHERE ${criterias.join(' AND ')}` : '';
    const placeholders = filters.map((filter, idx) =>
      `${filter} $${idx + 1}`,
    );
    // console.log('filters,', filterWithPlaceholder);

    whereClause = placeholders.length > 0 ? `WHERE ${placeholders.join(' AND ')}` : '';

    return [whereClause, values];

  }



  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
