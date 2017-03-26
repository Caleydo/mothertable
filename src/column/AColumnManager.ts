/**
 * Created by Holger Stitz on 17.03.2017.
 */

import {AnyColumn} from './ColumnManager';
import AColumn from './AColumn';
import SortHandler from '../SortHandler/SortHandler';
import Range from 'phovea_core/src/range/Range';
import {AnyFilter} from '../filter/AFilter';


export default class AColumnManager {

  columns: AnyColumn[] = [];
  private _stratifiedRanges: Range[]; // This is the rangelist used for stratification
  private _nonStratifiedRange: Range; //This is the flatten Range which is obtained from Sort
  private dataPerStratificaiton; //The number of data elements per stratification
  constructor() {
    //

  }

  get vectorCols(): AnyColumn[] {
    return this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.vector);
  }

  get matrixCols(): AnyColumn[] {
    return this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
  }

  get nonStratifiedRange(): Range {
    return this._nonStratifiedRange;
  }

  /**
   * Compares columns based on the dataset and returns the first column with that dataset
   * @param columns
   */
  unique(columns): AnyColumn[] {
    const data = columns.map((d) => d.data.desc.id);
    return columns.filter((col, pos) => data.indexOf(col.data.desc.id) === pos);
  }

  add(column: AnyColumn) {
    this.columns.push(column);
  }

  remove(column: AnyColumn) {
    this.columns.splice(this.columns.indexOf(column), 1);
  }

  async sort(): Promise<Map<string, Range[]>> {
    const colsWithRange = new Map<string, Range[]>();
    const uniqueVectorCols = this.unique(this.vectorCols);

    if (uniqueVectorCols.length === 0) {
      return colsWithRange;
    }

    // The sort object is created on the fly and destroyed after it exits this method
    const s = new SortHandler();
    const r = await s.sortColumns(uniqueVectorCols);

    this._nonStratifiedRange = r.combined;
    this._stratifiedRanges = [r.combined];
    this.dataPerStratificaiton = r.stratified;
    uniqueVectorCols.forEach((col) => {
      colsWithRange.set(col.data.desc.id, [this._nonStratifiedRange]);
    });

    return colsWithRange;
  }

  async stratify(rangeListMap: Map<string, Range[]>) {
    this.stratifyVectorCols(rangeListMap);
    this.stratifyMatrixCols(rangeListMap);
  }

  filter(range: Range[]) {
    this.vectorCols.forEach((col) => {
      col.updateMultiForms(range);
    });
    // TODO might be wrong
    this.matrixCols.forEach((col) => {
      col.updateMultiForms(range);
    });
  }

  sortByFilters(filterList: AnyFilter[]) {
    this.columns = filterList.map((f) => this.columns.filter((c) => c.data === f.data)[0]);
  }

  private stratifyVectorCols(rangeListMap: Map<string, Range[]>) {
    console.log(rangeListMap)
    this.vectorCols.forEach((col) => {

      col.updateMultiForms(rangeListMap.get(col.data.desc.id));
    });
  }

  private stratifyMatrixCols(rangeListMap: Map<string, Range[]>) {
    const lastRangeList = this.lastRangeList(rangeListMap);
    this.matrixCols.forEach((col) => {
      col.updateMultiForms(lastRangeList);
    });
  }

  private lastRangeList(rangeListMap: Map<string, Range[]>) {
    const uniqueVectorCols = this.unique(this.vectorCols);

    if (uniqueVectorCols.length === 0) {
      return [];
    }

    return rangeListMap.get(uniqueVectorCols[uniqueVectorCols.length - 1].data.desc.id);
  }


}
