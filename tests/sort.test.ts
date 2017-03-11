/**
 * Created by Bikram Kawan on 11.03.2017.
 */
/// <reference types="jasmine" />

import Range from 'phovea_core/src/range/Range';
import {SORT, numSort, stringSort, filterCat} from '../src/SortEventHandler/SortEventHandler';


function makeRangeFromList(arr) {
  const r = new Range();
  r.dim(0).pushList(arr);
  return r;
}

function mergeRanges(r: Range[]) {
  const mergedRange = r.reduce((currentVal, nextValue) => {
    const r = new Range();
    r.dim(0).pushList(currentVal.dim(0).asList().concat(nextValue.dim(0).asList()));
    return r;
  });
  return mergedRange.dim(0).asList();
}

describe('Merge Range Objects', () => {
  it('[[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]]', () => {
    const rangeList = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]];
    const r = rangeList.map((d) => makeRangeFromList(d));
    return expect(mergeRanges(r)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('[[1, 2,], [3, 4], [5, 6]]', () => {
    const rangeList = [[1, 2,], [3, 4], [5, 6]];
    const r = rangeList.map((d) => makeRangeFromList(d));
    return expect(mergeRanges(r)).toEqual([1, 2, 3, 4, 5, 6]);
  });

});


describe('Sort Number', () => {
  const arr = [1, 5, 6, 14, 3, 4, 15, 6, 19];
  it('SORT BY ASC', () => {
    const s = arr.sort(numSort.bind(this, SORT.asc));
    return expect(s).toEqual([1, 3, 4, 5, 6, 6, 14, 15, 19]);
  });

  it('SORT BY DESC', () => {
    const s = arr.sort(numSort.bind(this, SORT.desc));
    return expect(s).toEqual([19, 15, 14, 6, 6, 5, 4, 3, 1]);
  });

});

describe('String Sort', () => {
  const arr = ['Rihanna',
    'Britney Spears',
    'Madonna',
    'Whitney Houston',
    'Michael Jackson',
    'Eminem',
    'Elton John',
    'Elvis Presley'];
  it('SORT BY ASC', () => {
    const s = arr.sort(stringSort.bind(this, SORT.asc));

    const expected = ['Britney Spears',
      'Elton John',
      'Elvis Presley',
      'Eminem',
      'Madonna',
      'Michael Jackson',
      'Rihanna',
      'Whitney Houston'];
    return expect(s).toEqual(expected);
  });

  it('STRING SORT BY DESC', () => {
    const expected = ['Whitney Houston',
      'Rihanna',
      'Michael Jackson',
      'Madonna',
      'Eminem',
      'Elvis Presley',
      'Elton John',
      'Britney Spears'];
    const s = arr.sort(stringSort.bind(this, SORT.desc));
    return expect(s).toEqual(expected);
  });

});


describe('Filter by Value', () => {
  const arr = [1, 5, 6, 14, 3, 4, 15, 6, 19];
  it('Filter by 6', () => {
    const f = arr.filter(filterCat.bind(this, 6));
    return expect(f).toEqual([6, 6]);
  });

  it('Filter by 5', () => {
    const f = arr.filter(filterCat.bind(this, 5));
    return expect(f).toEqual([5]);
  });

  it('Filter by String', () => {
    const arr = ['a', 'b', 'c', 'd', 'a', 'a'];
    const f = arr.filter(filterCat.bind(this, 'a'));
    return expect(f).toEqual(['a', 'a', 'a']);
  });

  it('Filter by Space', () => {
    const arr = ['a', 'b', 'c', 'd', 'a', 'a', ' ', ' '];
    const f = arr.filter(filterCat.bind(this, ' '));
    return expect(f).toEqual([' ', ' ']);
  });


});


function uniqueValues(allCatNames) {
  const uniqvalues = allCatNames.filter((x, i, a) => a.indexOf(x) === i);
  return uniqvalues;

}


describe('Unique Values', () => {
  const arr = [1, 5, 6, 14, 3, 4, 15, 6, 19];
  it('Numerical ', () => {
    return expect(uniqueValues(arr)).toEqual([1, 5, 6, 14, 3, 4, 15, 19]);
  });

  it('String', () => {
    const arr = ['a', 'b', 'c', 'd', 'a', 'a', ' ', ' '];
    return expect(uniqueValues(arr)).toEqual(['a', 'b', 'c', 'd', ' ']);
  });

});
