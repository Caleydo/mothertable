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
export function superbag(sup:any[], sub:any[]):boolean {
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
