'use strict';

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("testing sqlForPartialUpdate", function () {

  test("valid output given correct input", function () {
    const result = sqlForPartialUpdate(
      { numEmployees: 333, logoUrl: "https://myPhoto.com" },
      { numEmployees: "num_employees", logoUrl: "logo_url" }
    );
    expect(result).toEqual(
      {
        setCols: '"num_employees"=$1, "logo_url"=$2',
        values: [333, "https://myPhoto.com"]
      }
    );
  });


  test("test error if no dataToUpdate keys", function () {
    // why does this need to wrapped in another function?
    // that's just how it works
    //expect(sqlForPartialUpdate({},{})).toThrow(BadRequestError)
    // this throws the error from inside the function instead of letting jest call the function
    expect(function () {
      sqlForPartialUpdate(
        {},
        { numEmployees: "num_employees", logoUrl: "logo_url" }
      );
    }).toThrow(BadRequestError);
  });


});


