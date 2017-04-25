/**
 * Created by Samuel Gratzl on 31.01.2017.
 */

import {ZoomLogic} from 'phovea_core/src/behavior';
import {EOrientation} from './AColumn';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import Range from 'phovea_core/src/range/Range';
import {VALUE_TYPE_CATEGORICAL} from 'phovea_core/src/datatype';
import {AnyFilter} from '../filter/FilterManager';

export function scaleTo(multiform: MultiForm, width: number, height: number, orientation: EOrientation) {
  const zoom = new ZoomLogic(multiform, multiform.asMetaData);
  if (multiform.isBuilt) {
    zoom.zoomTo(width, height);
  } else {
    const onReady = () => {
      zoom.zoomTo(width, height);
      multiform.off('ready', onReady);
    };
    // may not yet loaded
    multiform.on('ready', onReady);
  }

  // TODO orientation
}


export const NUMERICAL_COLOR_MAP: string[] = ['white', 'black'];


export function reArrangeRangeList(draggedArray: number[], fullRangeasList: number[]) {

  if (draggedArray.length < 2) {
    let r = [fullRangeasList];
    r = r.filter((d) => d.length !== 0);
    return r;
  } else {
    const startindex = fullRangeasList.indexOf(draggedArray[0]);
    const endindex = fullRangeasList.indexOf(draggedArray[draggedArray.length - 1]);
    const startArr = fullRangeasList.slice(0, startindex);
    const endArr = fullRangeasList.slice(endindex + 1, fullRangeasList.length);
    let r = [startArr, draggedArray, endArr];
    r = r.filter((d) => d.length !== 0);
    return r;
  }
}

export function insertArrayAt<T>(array: T[], index: number, arrayToInsert: T[]) {
  Array.prototype.splice.apply(array, [index, 0].concat(<any>arrayToInsert));
}

export function reArrangeRangeListAfter(draggedArray: number[], fullRangeList: number[][]) {
  let indices = [];
  fullRangeList.map((d, i) => {
    const c = [];
    draggedArray.forEach((e) => {
      const m = d.indexOf(e);
      if (m > -1) {
        c.push(m);
      }
    });

    if (c.length !== 0) {
      indices.push(spliceArr(d, c));

    } else {
      indices.push([d]);
    }
  });
  indices = indices.reduce((d, i) => d.concat(i));
  indices = indices.filter((d) => d.length !== 0);
  //console.log(indices)
  return indices;
}


function spliceArr(rangeArr: number[], dragIndices: number[]) {
  const startIndex = dragIndices[0];
  const endIndex = dragIndices[dragIndices.length - 1];
  const draggedArea = rangeArr.slice(startIndex, endIndex + 1);
  const startArr = rangeArr.slice(0, startIndex);
  const endArr = rangeArr.slice(endIndex + 1, rangeArr.length);
  let r = [startArr, draggedArea, endArr];
  r = r.filter((d) => d.length !== 0);
  return r;

}
export function makeRangeFromList(arr: number[]): Range {
  const r = new Range();
  r.dim(0).pushList(arr);
  return r;
}

export function makeListFromRange(range: Range): number[] {
  return range.dim(0).asList();
}


export function formatAttributeName(name: string): string {
  return name
    .replace('patient.', ''); // HACK for TCGA dataset
}

export function formatIdTypeName(name: string): string {
  return name // HACK for TCGA dataset
    .replace('artist', 'Artist')
    .replace('country', 'Country')
    .replace('GENE_SYMBOL', 'Gene')
    .replace('TCGA_SAMPLE', 'Patient');
}

/**
 * Split stratified ranges according to given brush.
 * e.g., stratification [[1,2,3],[4,5,6,7,8]] and brush [5,6] will result in [[1,2,3],[4],[5,6],[7,8]]
 * @param stratifiedRanges
 * @param brushedArray
 * @return {Range[]}
 */
export function updateRangeList(stratifiedRanges: Range[], brushedArray: number[][]) {
  const m = new Map();
  const n = new Map();
  const updateRange = stratifiedRanges.forEach((r, index) => {
    return brushedArray.forEach((s) => {
      const isSuperset = checkArraySubset(makeListfromRange(r), s);
      m.set(index, isSuperset || m.get(index));
    });
  });

  //Gives the group which it belongs to the brushing in the stratification.
  const groupid = [];
  Array.from(m.keys()).forEach((id) => {
    if(m.get(id) === true) {
      groupid.push(id);
    }
  });

  const newRangeInList = [];
  stratifiedRanges.forEach((r, id) => {
    const currentRangeList = makeListFromRange(r);
    if(groupid.indexOf(id) > -1) {
      const localArrayIndices = convertToLocalArrayIndices(brushedArray, currentRangeList);
      // Convert local sorted indices to the range Indices
      const newRangeIndices = revertBackToRangeIndices(currentRangeList, localArrayIndices);
      //Replace the array range which is brushed with new splitted range
      const newarr = reformatArray(currentRangeList, newRangeIndices);
      newarr.forEach((n) => newRangeInList.push(n));
    } else {
      newRangeInList.push(currentRangeList);
    }
  });

  return newRangeInList.map((r) => makeRangeFromList(r));
}

function reformatArray(brushedRange: number[], brushedArray: number[][]) {
  let lastIndex = 0;
  const newarr = [];

  brushedArray.forEach((d) => {
    const start = brushedRange.indexOf(d[0]);
    if (lastIndex !== start) {
      newarr.push(brushedRange.slice(lastIndex, start));
    }
    const end = brushedRange.indexOf(d[d.length - 1]);
    newarr.push(brushedRange.slice(start, end + 1));

    lastIndex = end + 1;
  });

  if (lastIndex !== brushedRange.length) {
    newarr.push(brushedRange.slice(lastIndex, brushedRange.length));
  }

  return newarr;
}

function makeListfromRange(range: Range) {
  return (range.dim(0).asList());
}

function reformatRangeList(rearrangeRange: Range[][]) {
  return rearrangeRange.reduce((p, b) => p.concat(b));
}

export function mergeRanges(ranges: Range[]) {
  const mergedRange = ranges.reduce((currentVal, nextValue) => {
    const r = new Range();
    r.dim(0).pushList(currentVal.dim(0).asList().concat(nextValue.dim(0).asList()));
    return r;
  });
  return mergedRange;
}

export function makeArrayBetweenNumbers(range: number[]) {
  const increments = 1;
  const arr = [];
  for (let val = range[0]; val <= range[1]; val += increments) {
    arr.push(val);
  }
  return arr;
}


/**
 * Checks if one array contains all elements of another array
 * @param parentArr the larger array
 * @param childArr the smaller array
 * @returns {boolean}
 */
export function checkArraySubset<T>(parentArr: T[], childArr: T[]) {
  return childArr.every((elem) => parentArr.indexOf(elem) > -1);
}


/**
 * Sort function for sorting arrays based on the first elment
 * @param a
 * @param b
 * @return {number}
 */
function sortArray(a: number[], b: number[]) {
  if (a[0] === b[0]) {
    return 0;
  } else {
    return (a[0] < b[0]) ? -1 : 1;
  }
}

/**
 * Convert the brushed global range(range indices from stratified indices index to local array index to sort the array
 * @param brushedArray
 * @param stratifiedRangeIndices
 * @return {number[][]}
 */
function convertToLocalArrayIndices(brushedArray: number[][], stratifiedRangeIndices: number[]) {
  const localArray = [];
  brushedArray.forEach((d) => {
    const indices: number[] = [];
    d.forEach((item) => {
      indices.push(stratifiedRangeIndices.indexOf(item));
    });
    indices.sort();
    let firstElem = indices[0];
    let lastElem = indices[0];
    indices.forEach((elem, i) => {
      if (((elem - lastElem) === 1 || (elem - lastElem) === 0) && i !== indices.length - 1) {
        lastElem = elem;
      } else if(i === indices.length - 1) {
        if(firstElem >- 1 &&  lastElem >- 1) {
          localArray.push([firstElem, elem]);
        }
      } else {
        if(firstElem >- 1 &&  lastElem >- 1) {
          localArray.push([firstElem, lastElem]);
        }
        firstElem = elem;
        lastElem = elem;
      }
    });

  });
  return localArray;
}

/**
 * First sort the array and give me back the global range indices from local indices
 * @param stratifiedRangeIndices
 * @param localArrayIndices
 * @return {number[][]}
 */
function revertBackToRangeIndices(stratifiedRangeIndices: number[], localArrayIndices: number[][]) {
  const sortedLocalArray = localArrayIndices.slice().sort(sortArray);
  const rangeIndices = [];
  sortedLocalArray.forEach((d) => {
    const firstElem = stratifiedRangeIndices[d[0]];
    const lastElem = stratifiedRangeIndices[d[d.length - 1]];
    rangeIndices.push([firstElem, lastElem]);

  });

  return rangeIndices;
}

export function findColumnTie(cols: AnyFilter[]) {
  let columnIndexForTie = NaN;
  cols.some((val, index) => {
    if (val.data.desc.value.type !== VALUE_TYPE_CATEGORICAL) {
      columnIndexForTie = index;
    }
    return val.data.desc.value.type !== VALUE_TYPE_CATEGORICAL;
  });

  return columnIndexForTie;
}
