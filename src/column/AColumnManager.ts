/**
 * Created by Holger Stitz on 17.03.2017.
 */

import {AnyColumn} from './ColumnManager';
import AColumn from './AColumn';
import SortHandler, {prepareRangeFromList} from '../SortHandler/SortHandler';
import Range from 'phovea_core/src/range/Range';
import {AnyFilter} from '../filter/AFilter';
import {makeListFromRange, makeRangeFromList} from './utils';


export default class AColumnManager {

  columns: any[] = [];
  private _stratifiedRanges: Range[]; // This is the rangelist used for stratification
  private _nonStratifiedRange: Range; //This is the flatten Range which is obtained from Sort
  
  private dataPerStratification; //The number of data elements per stratification

  get vectorCols(): AnyColumn[] {
    return this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.vector);
  }

  get matrixCols(): AnyColumn[] {
    return this.columns.filter((col) => col.data.desc.type === AColumn.DATATYPE.matrix);
  }

  get nonStratifiedRange(): Range {
    return this._nonStratifiedRange;
  }

  get stratifiedRanges(): Range[] {
    return this._stratifiedRanges;
  }

  /**
   * Compares columns based on the dataset and returns the first column with that dataset
   * @param columns
   */
  unique(columns: AnyColumn[]): AnyColumn[] {
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
    // console.log(this.columns, this, this.vectorCols)
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
    this.dataPerStratification = r.stratified;
    uniqueVectorCols.forEach((col) => {
      colsWithRange.set(col.data.desc.id, [this._nonStratifiedRange]);
    });

    return colsWithRange;
  }


  updateStratifiedRanges(stratifyColid) {
    //Return nothing if there is zero  stratification column
    const d = this.columns.find((d) => d.data === stratifyColid.data);
    if (stratifyColid === undefined || d === undefined) {
      return;
    }
    const datas = this.dataPerStratificaiton.get(stratifyColid.data.desc.id);
    const prepareRange = prepareRangeFromList(makeListFromRange(this.nonStratifiedRange), [datas]);
    this._stratifiedRanges = prepareRange[0].map((d) => makeRangeFromList(d));
    return this._stratifiedRanges;
  }


  async stratify(rangeListMap: Map<string, Range[]>) {
    this.stratifyVectorCols(rangeListMap);
    this.stratifyMatrixCols(rangeListMap);
  }

  async filter(range: Range) {
    for (const col of this.columns) {
      col.rangeView = range;
      col.dataView = await col.data.idView(range);
    }

  }

  sortByFilters(filterList: AnyFilter[]) {
    this.columns = filterList.map((f) => this.columns.filter((c) => c.data === f.data)[0]);
  }

  private stratifyVectorCols(rangeListMap: Map<string, Range[]>) {
    // console.log(this.vectorCols,rangeListMap)
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
