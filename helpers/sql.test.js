const { sqlForPartialUpdate, sqlCompanyQuery, sqlJobQuery } = require('./sql');

describe('Partial updates with sqlPartialUpdate function', () => {
  test('One key', () => {
    const res = sqlForPartialUpdate({ c1: 'c1' }, { c1: 'c1', c2: 'c2' });
    expect(res).toEqual({ setCols: `"c1"=$1`, values: ['c1'] });
  });
  test('Two keys', () => {
    const res = sqlForPartialUpdate(
      { c1: 'c1', c2: 'c2' },
      { c1: 'c1', c2: 'c2' }
    );
    expect(res).toEqual({ setCols: `"c1"=$1, "c2"=$2`, values: ['c1', 'c2'] });
  });
  test('Three keys', () => {
    const res = sqlForPartialUpdate(
      { c1: 'c1', c2: 'c2', c3: 'c3' },
      { c1: 'c1', c2: 'c2' }
    );
    expect(res).toEqual({
      setCols: `"c1"=$1, "c2"=$2, "c3"=$3`,
      values: ['c1', 'c2', 'c3'],
    });
  });
});

describe('Company Queries with sqlForQuery', () => {
  test('Query with full data', () => {
    const res = sqlCompanyQuery({
      name: 'C',
      minEmployees: '1',
      maxEmployees: '3',
    });
    expect(res).toEqual({
      queries: `"name" ILIKE $1 AND num_employees >= $2 AND num_employees <= $3`,
      values: ['%C%', '1', '3'],
    });
  });
  test('Query with partial data', () => {
    const res = sqlCompanyQuery({
      minEmployees: '5',
    });
    expect(res).toEqual({ queries: 'num_employees >= $1', values: ['5'] });
  });
});

describe('Company Queries with sqlForQuery', () => {
  test('Query with full data', () => {
    const res = sqlJobQuery({
      title: 'J',
      minSalary: '1000',
      hasEquity: 'true',
    });
    expect(res).toEqual({
      queries: `"title" ILIKE $1 AND "equity" > 0 AND "salary" >= $2`,
      values: ['%J%', '1000'],
    });
  });
  // test('Query with partial data', () => {
  //   const res = sqlCompanyQuery({
  //     minSalary: '5000',
  //   });
  //   expect(res).toEqual({ queries: '"salary" >= $1', values: ['5000'] });
  // });
});
