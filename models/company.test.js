'use strict';
const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Company = require('./company.js');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require('./_testCommon');

beforeAll(async () => {
  await commonBeforeAll();
  await db.query(`
    INSERT INTO jobs(title, salary, equity, company_handle)
    VALUES ('J1', 100000, '0', 'c1'),
    ('J2', 50000, '0', 'c2')
    RETURNING id, title, salary, equity, company_handle AS "companyHandle"`);
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function () {
  const newCompany = {
    handle: 'new',
    name: 'New',
    description: 'New Description',
    numEmployees: 1,
    logoUrl: 'http://new.img',
  };

  test('works', async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`
    );
    expect(result.rows).toEqual([
      {
        handle: 'new',
        name: 'New',
        description: 'New Description',
        num_employees: 1,
        logo_url: 'http://new.img',
      },
    ]);
  });

  test('bad request with dupe', async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe('findAll', function () {
  test('works: no filter', async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img',
      },
      {
        handle: 'c2',
        name: 'C2',
        description: 'Desc2',
        numEmployees: 2,
        logoUrl: 'http://c2.img',
      },
      {
        handle: 'c3',
        name: 'C3',
        description: 'Desc3',
        numEmployees: 3,
        logoUrl: 'http://c3.img',
      },
    ]);
  });
});

/************************************** get with query */

describe('FIND ALL with query', function () {
  test('works with full query', async function () {
    let companies = await Company.findFilter({
      name: 'C',
      minEmployees: 1,
      maxEmployees: 3,
    });
    expect(companies).toEqual([
      {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img',
      },
      {
        handle: 'c2',
        name: 'C2',
        description: 'Desc2',
        numEmployees: 2,
        logoUrl: 'http://c2.img',
      },
      {
        handle: 'c3',
        name: 'C3',
        description: 'Desc3',
        numEmployees: 3,
        logoUrl: 'http://c3.img',
      },
    ]);
  });
  test('works with partial query', async function () {
    let companies = await Company.findFilter({
      name: 'C',
    });
    expect(companies).toEqual([
      {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img',
      },
      {
        handle: 'c2',
        name: 'C2',
        description: 'Desc2',
        numEmployees: 2,
        logoUrl: 'http://c2.img',
      },
      {
        handle: 'c3',
        name: 'C3',
        description: 'Desc3',
        numEmployees: 3,
        logoUrl: 'http://c3.img',
      },
    ]);
    companies = await Company.findFilter({
      minEmployees: 2,
      maxEmployees: 3,
    });
    expect(companies).toEqual([
      {
        handle: 'c2',
        name: 'C2',
        description: 'Desc2',
        numEmployees: 2,
        logoUrl: 'http://c2.img',
      },
      {
        handle: 'c3',
        name: 'C3',
        description: 'Desc3',
        numEmployees: 3,
        logoUrl: 'http://c3.img',
      },
    ]);
  });
  test('Doesnt work with greater min value than max value', async function () {
    try {
      await Company.findFilter({
        minEmployees: 3,
        maxEmployees: 2,
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
  test('Doesnt work with invalid min/max value', async function () {
    try {
      await Company.findFilter({
        minEmployees: 'bad',
        maxEmployees: 'query',
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe('get', function () {
  test('works', async function () {
    let company = await Company.get('c1');
    expect(company).toEqual({
      handle: 'c1',
      name: 'C1',
      description: 'Desc1',
      numEmployees: 1,
      logoUrl: 'http://c1.img',
      jobs: [
        {
          id: expect.any(Number),
          title: 'J1',
          salary: 100000,
          equity: '0',
        },
      ],
    });
  });

  test('not found if no such company', async function () {
    try {
      await Company.get('nope');
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe('update', function () {
  const updateData = {
    name: 'New',
    description: 'New Description',
    numEmployees: 10,
    logoUrl: 'http://new.img',
  };

  test('works', async function () {
    let company = await Company.update('c1', updateData);
    expect(company).toEqual({
      handle: 'c1',
      ...updateData,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`
    );
    expect(result.rows).toEqual([
      {
        handle: 'c1',
        name: 'New',
        description: 'New Description',
        num_employees: 10,
        logo_url: 'http://new.img',
      },
    ]);
  });

  test('works: null fields', async function () {
    const updateDataSetNulls = {
      name: 'New',
      description: 'New Description',
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update('c1', updateDataSetNulls);
    expect(company).toEqual({
      handle: 'c1',
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`
    );
    expect(result.rows).toEqual([
      {
        handle: 'c1',
        name: 'New',
        description: 'New Description',
        num_employees: null,
        logo_url: null,
      },
    ]);
  });

  test('not found if no such company', async function () {
    try {
      await Company.update('nope', updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test('bad request with no data', async function () {
    try {
      await Company.update('c1', {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe('remove', function () {
  test('works', async function () {
    await Company.remove('c1');
    const res = await db.query(
      "SELECT handle FROM companies WHERE handle='c1'"
    );
    expect(res.rows.length).toEqual(0);
  });

  test('not found if no such company', async function () {
    try {
      await Company.remove('nope');
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
