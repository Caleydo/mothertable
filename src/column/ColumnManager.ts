import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import Range1D from 'phovea_core/src/range/Range1D';
import {IStringVector} from './AVectorColumn';
import AColumn, {EOrientation} from './AColumn';
import CategoricalColumn from './CategoricalColumn';
import StringColumn from './StringColumn';
import NumberColumn from './NumberColumn';
import MatrixColumn from './MatrixColumn';
import {IEvent, EventHandler} from 'phovea_core/src/event';
import {resolveIn} from 'phovea_core/src';
import {listAll, IDType} from 'phovea_core/src/idtype';

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
  private rangeNow: Range1D = Range1D.all();

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

  push(data: IMotherTableType) {




    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const col = createColumn(data, this.orientation, this.node);
    const r = (<any>data).indices;
    col.update(r.intersect(this.rangeNow));
    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);

    this.columns.push(col);
    const managerWidth = this.node.clientWidth;

    let currentPanelWidth: number = 0;

    this.columns.forEach((col, index) => {
      //console.log("column no."+ index + "width: " + col.node.clientWidth);
      col.layout(300, col.body.clientHeight);
      currentPanelWidth = col.node.clientWidth + currentPanelWidth;
    });
    if (managerWidth - currentPanelWidth < 0) {
      console.log("Need relayout");
    } else {
      console.log("Enough space");
    }

    console.log("col manager width: " + managerWidth);
    console.log("panel width: " + currentPanelWidth);
    this.fire(ColumnManager.EVENT_COLUMN_ADDED, col);
    this.relayout();
  }

  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.node.remove();
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
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

  update(idRange: Range1D) {
    this.rangeNow = idRange;
    this.columns.forEach((col) => {
      return col.update(idRange);
    });
  }


  async relayout() {
    // wait 10ms to be layouted
    await resolveIn(10);

    const height = Math.min(...this.columns.map((c) => c.body.clientHeight));
    let newWidth = 180;

    // compute margin
    const verticalMargin = this.columns.reduce((prev, c) => {
      const act = c.getVerticalMargin();
      return {top: Math.max(prev.top, act.top), bottom: Math.max(prev.bottom, act.bottom)};
    }, {top: 0, bottom: 0});

    this.columns.forEach((col) => {
      const margin = col.getVerticalMargin();
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
