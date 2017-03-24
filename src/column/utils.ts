/**
 * Created by Samuel Gratzl on 31.01.2017.
 */

import {ZoomLogic} from 'phovea_core/src/behavior';
import {EOrientation} from './AColumn';
import MultiForm from 'phovea_core/src/multiform/MultiForm';
import Range from 'phovea_core/src/range/Range';


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


export const NUMERICAL_COLOR_MAP: string[] = ['#fff5f0', '#67000d'];


export function reArrangeRangeList(draggedArray, fullRangeasList) {

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

export function insertArrayAt(array, index, arrayToInsert) {
  Array.prototype.splice.apply(array, [index, 0].concat(arrayToInsert));
}

/**
 * Checks if one array contains all elements of another array
 * @param sup the larger array
 * @param sub the smaller array
 * @returns {boolean}
 */
export function superbag(sup: any[], sub: any[]): boolean {
  return sub.every(elem => sup.indexOf(elem) > -1);
}


export function reArrangeRangeListAfter(draggedArray, fullRangeList) {
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


function spliceArr(rangeArr, dragIndices) {
  const startIndex = dragIndices[0];
  const endIndex = dragIndices[dragIndices.length - 1];
  const draggedArea = rangeArr.slice(startIndex, endIndex + 1);
  const startArr = rangeArr.slice(0, startIndex);
  const endArr = rangeArr.slice(endIndex + 1, rangeArr.length);
  let r = [startArr, draggedArea, endArr];
  r = r.filter((d) => d !== 0);
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


export function updateRangeList(stratifiedRanges: Range[], brushedArray: number[][]) {
  const m = new Map();
  const updateRange = stratifiedRanges.map((r, index) => {
    return brushedArray.map((s) => {
      const isSuperset = checkArraySubset(makeListfromRange(r), s);
      if (isSuperset === true) {
        return m.set(index, true);
      } else {
        return m.set(index, false);
      }
    });
  });


  //Gives the group which it belongs to the brushing in the stratification.
  const groupid = Array.from(m.values()).indexOf(true);
  const stratifiedRangeInList = stratifiedRanges.map((r) => (makeListFromRange(r)));

  // Convert range indices to local array indices for sorting purpose
  const localArrayIndices = convertToLocalArrayIndices(brushedArray, stratifiedRangeInList[groupid]);

  // Convert local sorted indices to the range Indices
  const newRangeIndices = revertBackToRangeIndices(stratifiedRangeInList[groupid], localArrayIndices);

  //Replace the array range which is brushed with new splitted range
  const result = reformatArray(stratifiedRangeInList, newRangeIndices, groupid);
  return result.map((r) => makeRangeFromList(r));
}


function reformatArray(stratifiedRangeInList: number[][], brushedArray: number[][], id: number) {
  const brushedRange = stratifiedRangeInList[id];
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

  //First remove 1 element at id and replace that with newarr and append others at it is;
  stratifiedRangeInList.splice(id, 1, ...newarr);
  console.log(stratifiedRangeInList)
  return stratifiedRangeInList;

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

// Check is Arr2 is child of Array1
function checkArraySubset(parentArr, childArr) {
  const isSuperset = childArr.every(function (val) {
    return parentArr.indexOf(val) >= 0;
  });

  return isSuperset;
}


//Sort the array or array
function sortArray(a, b) {
  if (a[0] === b[0]) {
    return 0;
  } else {
    return (a[0] < b[0]) ? -1 : 1;
  }
}

//Convert the brushed global range(range indices from stratified indices index to local array index to sort the array
function convertToLocalArrayIndices(brushedArray: number[][], stratifiedRangeIndices: number[]) {
  const localArray = [];
  brushedArray.forEach((d) => {
    const firstElem = stratifiedRangeIndices.indexOf(d[0]);
    const lastElem = stratifiedRangeIndices.indexOf(d[d.length - 1]);
    localArray.push([firstElem, lastElem]);
  });
  return localArray;
}

//First sort the array and give me back the global range indices from local indices
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
