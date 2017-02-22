import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import Range from 'phovea_core/src/range/Range';
import {IStringVector, AVectorColumn} from './AVectorColumn';
import AColumn, {EOrientation} from './AColumn';
import CategoricalColumn from './CategoricalColumn';
import StringColumn from './StringColumn';
import NumberColumn from './NumberColumn';
import MatrixColumn from './MatrixColumn';
import {IEvent, EventHandler} from 'phovea_core/src/event';
import {resolveIn} from 'phovea_core/src';
import {listAll, IDType} from 'phovea_core/src/idtype';
import SortColumn, {SORT} from '../sortColumn/SortColumn';
import {IAnyVector} from '../../../phovea_core/src/vector/IVector';

/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type AnyColumn = AColumn<any, IDataType>;
export declare type IMotherTableType = IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix;

export default class ColumnManager extends EventHandler {
  static readonly EVENT_COLUMN_REMOVED = 'removed';
  static readonly EVENT_DATA_REMOVED = 'removedData';
  static readonly EVENT_COLUMN_ADDED = 'added';

  readonly columns: AnyColumn[] = [];
  private columnsHierarchy: AnyColumn[] = [];
  private rangeNow: Range1D;
  private sortMethod: string = SORT.asc;

  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);

  constructor(public readonly idType: IDType, public readonly orientation: EOrientation, public readonly node: HTMLElement) {
    super();
    this.node.classList.add('column-manager');
  }

  get length() {
    return this.columns.length;
  }

  destroy() {
    // delete all columns, can't remove myself, since I'm using the parent
    const items = <HTMLElement[]>Array.from(this.node.querySelectorAll('.column'));
    items.forEach((d) => d.remove());
  }

  async push(data: IMotherTableType) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const col = createColumn(data, this.orientation, this.node);
    const r = (<any>data).indices;
    if (this.rangeNow === undefined) {
      this.rangeNow = r.intersect(Range1D.all());

    }
    await col.update((this.rangeNow));


    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.on(AVectorColumn.EVENT_PRIMARY_SORT_COLUMN, this.updatePrimarySortByCol.bind(this));
    col.on(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange.bind(this));

    this.columns.push(col);
    this.columnsHierarchy = this.columns;

    const managerWidth = this.node.clientWidth;
    const panel = this.currentWidth(this.columns);

    //if (managerWidth - panel < 0) {
    //console.log("Need relayout");
    //} else {
    //console.log("Enough space");
    //}

    //console.log("col manager width: " + managerWidth);
    //console.log("panel width: " + panel);

    this.fire(ColumnManager.EVENT_COLUMN_ADDED, col);
    return this.relayout();
  }

  currentWidth(columns) {
    let currentPanelWidth: number = 0;
    columns.forEach((col, index) => {
      //console.log("column no."+ index + "width: " + col.node.clientWidth);
      currentPanelWidth = col.node.clientWidth + currentPanelWidth;
    });
    return currentPanelWidth;
  }


  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.node.remove();
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    col.off(AVectorColumn.EVENT_PRIMARY_SORT_COLUMN, this.updatePrimarySortByCol.bind(this));
    col.off(AColumn.EVENT_COLUMN_LOCK_CHANGED, this.onLockChange.bind(this));
    this.fire(ColumnManager.EVENT_COLUMN_REMOVED, col);
    this.fire(ColumnManager.EVENT_DATA_REMOVED, col.data);
    this.relayout();
  }

  /**
   * move a column at the given index
   * @param col
   * @param index
   */
  move(col: AnyColumn, index: number) {
    const old = this.columns.indexOf(col);
    if (old === index) {
      return;
    }
    //move the dom element, too
    this.node.insertBefore(col.node, this.node.childNodes[index]);

    this.columns.splice(old, 1);
    if (old < index) {
      index -= 1; //shifted because of deletion
    }
    this.columns.splice(index, 0, col);
    this.relayout();
  }


  updatePrimarySortByCol(evt: any, sortData: {sortMethod: string, col: IAnyVector}) {
    this.sortMethod = sortData.sortMethod;
    this.fire(AVectorColumn.EVENT_PRIMARY_SORT_COLUMN, sortData.col);
  }


  async updateSort(evt: any, sortMethod: string) {
    this.sortMethod = sortMethod;
    const cols: any = this.columnsHierarchy.filter((d) => d.data.desc.type === 'vector');
    const s = new SortColumn(cols, this.sortMethod);
    const r: any = s.sortByMe();
    this.mergeRanges(r);

  }

  async mergeRanges(r: Range[]) {
    const ranges = await r;
    const mergedRange: any = ranges.reduce((currentVal, nextValue) => {
      const r = new Range();
      r.dim(0).pushList(currentVal.dim(0).asList().concat(nextValue.dim(0).asList()));
      return r;
    });


    //const mergedRange: any = ranges.reduce((a, b) => a.concat(b));
    console.log(mergedRange.dim(0).asList());
    this.update(mergedRange);
  }

  async filterData(idRange: Range1D) {
    for (const col of this.columns) {
      (<any>col).dataView = await (<any>col.data).idView(idRange);

    }
    this.updateSort(null, this.sortMethod);

  }

  /**
   * prepare column data same as sort hierarchy
   * @param filterList
   */

  updateSortHierarchy(filterList: AnyColumn[]) {
    this.columnsHierarchy = [];
    filterList.forEach((d) => {
      const index = this.columns.map(function (e) {
        return e.data.desc.id;
      }).indexOf(d.data.desc.id);
      this.columnsHierarchy.push(this.columns[index]);
    });

    this.updateSort(null, this.sortMethod);
  }

  onLockChange(event: any, lock: any) {
    //console.log(lock);
    this.relayout();
  }

  async update(idRange: Range1D) {
    this.rangeNow = idRange;
    await Promise.all(this.columns.map((col) => {
      if (col instanceof MatrixColumn) {
        col.updateRows(idRange);
      }

      col.update(idRange);
    }));

    return this.relayout();
  }

  async relayout() {
    await resolveIn(10);


    const height = Math.min(...this.columns.map((c) => c.node.clientHeight - (<HTMLElement>c.node.querySelector('header')).clientHeight));
    // compute margin
    const verticalMargin = this.columns.reduce((prev, c) => {
      const act = c.getVerticalMargin();
      return {top: Math.max(prev.top, act.top), bottom: Math.max(prev.bottom, act.bottom)};
    }, {top: 0, bottom: 0});

    this.columns.forEach((col) => {
      const margin = col.getVerticalMargin();
      //console.log(margin,verticalMargin)
      col.node.style.marginTop = (verticalMargin.top - margin.top) + 'px';
      col.node.style.marginBottom = (verticalMargin.bottom - margin.bottom) + 'px';
      col.layout(col.body.clientWidth, height);
    });
  }
}

export function createColumn(data: IMotherTableType, orientation: EOrientation, parent: HTMLElement): AnyColumn {
  switch (data.desc.type) {
    case 'vector':
      const v = <IStringVector|ICategoricalVector|INumericalVector>data;
      switch (v.desc.value.type) {
        case VALUE_TYPE_STRING:
          return new StringColumn(<IStringVector>v, orientation, parent);
        case VALUE_TYPE_CATEGORICAL:
          return new CategoricalColumn(<ICategoricalVector>v, orientation, parent);
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new NumberColumn(<INumericalVector>v, orientation, parent);
      }
      throw new Error('invalid vector type');
    case 'matrix':
      const m = <INumericalMatrix>data;
      switch (m.desc.value.type) {
        case VALUE_TYPE_INT:
        case VALUE_TYPE_REAL:
          return new MatrixColumn(<INumericalMatrix>m, orientation, parent);
      }
      throw new Error('invalid matrix type');
    default:
      throw new Error('invalid data type');
  }
}
