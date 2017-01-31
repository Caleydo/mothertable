import IDType from 'phovea_core/src/idtype/IDType';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
import {IStringVector} from './AVectorColumn';
import AColumn from './AColumn';
import CategoricalColumn from './CategoricalColumn';
import StringColumn from './StringColumn';
import NumberColumn from './NumberColumn';
import MatrixColumn from './MatrixColumn';
import {IEvent} from 'phovea_core/src/event';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

declare type AnyColumn = AColumn<any, IDataType>;
export declare type IMotherTableType = IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix;

export default class ColumnManager {
  readonly columns: AnyColumn[] = [];
  readonly node: HTMLElement;

  private onColumnRemoved = (event: IEvent) => this.remove(<AnyColumn>event.currentTarget);

  constructor(public readonly idType: IDType, parent: HTMLElement) {
    this.node = parent.ownerDocument.createElement('div');
    this.node.classList.add('column-manager');
  }

  push(data: IMotherTableType) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const col = ColumnManager.createColumn(data, this.node);
    col.on(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
    this.columns.push(col);
    this.relayout();
  }

  remove(col: AnyColumn) {
    this.columns.splice(this.columns.indexOf(col), 1);
    col.off(AColumn.EVENT_REMOVE_ME, this.onColumnRemoved);
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

  private static createColumn(data: IMotherTableType, parent: HTMLElement): AnyColumn {
    switch (data.desc.type) {
      case 'vector':
        const v = <IStringVector|ICategoricalVector|INumericalVector>data;
        switch (v.desc.value.type) {
          case VALUE_TYPE_STRING:
            return new StringColumn(<IStringVector>v, parent);
          case VALUE_TYPE_CATEGORICAL:
            return new CategoricalColumn(<ICategoricalVector>v, parent);
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new NumberColumn(<INumericalVector>v, parent);
        }
        throw new Error('invalid vector type');
      case 'matrix':
        const m = <INumericalMatrix>data;
        switch (m.desc.value.type) {
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new MatrixColumn(<INumericalMatrix>m, parent);
        }
        throw new Error('invalid matrix type');
      default:
        throw new Error('invalid data type');
    }
  }

  update(idRange: CompositeRange1D) {
    this.columns.forEach((col) => col.update(idRange));
  }

  relayout() {
    this.columns.forEach((col) => {
      const bb = col.node.getBoundingClientRect();
      col.layout(bb.width, bb.height);
    });
  }
}
