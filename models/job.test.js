'use strict';

let job1Id;
const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require('./_testCommon');

beforeAll(async () => {
  await commonBeforeAll();
  const jobsRes = await db.query(`
    INSERT INTO jobs(title, salary, equity, company_handle)
    VALUES ('J1', 100000, '0', 'c1'),
    ('J2', 50000, '0', 'c2')
    RETURNING id, title, salary, equity, company_handle AS "companyHandle"`);
  job1Id = jobsRes.rows[0].id;
});
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function () {
  const newJob = {
    title: 'J3',
    salary: 25000,
    equity: 0,
    companyHandle: 'c3',
  };
  test('works', async function () {
    let job = await Job.create(newJob);
    const newJobId = job.id;
    expect(job).toEqual({
      id: newJobId,
      title: 'J3',
      salary: 25000,
      equity: '0',
      companyHandle: 'c3',
    });
    const result = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${newJobId}`
    );
    expect(result.rows).toEqual([
      {
        id: newJobId,
        title: 'J3',
        salary: 25000,
        equity: '0',
        companyHandle: 'c3',
      },
    ]);
  });
  test('returns error if companyHandle is invalid', async function () {
    try {
      const badJob = {
        title: 'J3',
        salary: 25000,
        equity: 0,
        companyHandle: 'invalid',
      };
      await Job.create(badJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe('findAll', function () {
  test('works: no filter', async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: 'J1',
        salary: 100000,
        equity: '0',
        companyHandle: 'c1',
      },
      {
        id: expect.any(Number),
        title: 'J2',
        salary: 50000,
        equity: '0',
        companyHandle: 'c2',
      },
    ]);
  });
});

/************************************** get */

describe('get', function () {
  test('works', async function () {
    let job = await Job.get(job1Id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: 'J1',
      salary: 100000,
      equity: '0',
      companyHandle: 'c1',
    });
  });
  test('not found if no such Job', async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe('update', function () {
  const updateData = {
    title: 'New',
    salary: 120000,
    equity: 0.2,
  };

  test('works', async function () {
    let job = await Job.update(job1Id, updateData);
    expect(job).toEqual({
      id: job1Id,
      companyHandle: 'c1',
      equity: '0.2',
      title: 'New',
      salary: 120000,
    });

    const result = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job1Id}`
    );
    expect(result.rows).toEqual([
      {
        id: job1Id,
        companyHandle: 'c1',
        equity: '0.2',
        title: 'New',
        salary: 120000,
      },
    ]);
  });

  test('works with partial update', async function () {
    const updateDataSetNulls = {
      title: 'New2',
    };
    let job = await Job.update(job1Id, updateDataSetNulls);
    expect(job).toEqual({
      id: job1Id,
      companyHandle: 'c1',
      equity: '0',
      title: 'New2',
      salary: 100000,
    });

    const result = await db.query(
      `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job1Id}`
    );
    expect(result.rows).toEqual([
      {
        id: job1Id,
        companyHandle: 'c1',
        equity: '0',
        title: 'New2',
        salary: 100000,
      },
    ]);
  });
  test('not found if no such job', async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test('bad request with no data', async function () {
    try {
      await Job.update(job1Id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe('remove', function () {
  test('works', async function () {
    await Job.remove(job1Id);
    const res = await db.query(`SELECT id FROM jobs WHERE id=${job1Id}`);
    expect(res.rows.length).toEqual(0);
  });

  test('not found if no such job', async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
