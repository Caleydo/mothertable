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
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

declare type AnyColumn = AColumn<any, IDataType>;

export default class ColumnManager {
  private columns: AnyColumn[] = [];
  private filterOrder: AnyColumn[] = [];
  private readonly columnNode: HTMLElement;
  private readonly filterNode: HTMLElement;

  constructor(public readonly idType: IDType, parent: HTMLElement) {
    this.columnNode = <HTMLElement><any>parent.ownerDocument.createElement('div');
    this.filterNode = <HTMLElement><any>parent.ownerDocument.createElement('div');
  }

  push(data: IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const f = this.createFilter(data, this.columnNode, this.filterNode);
    this.columns.push(f);
    this.filterOrder.push(f);
  }

  private createFilter(data: IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix, columnNode: HTMLElement, filterNode: HTMLElement): AnyColumn {
    switch (data.desc.type) {
      case 'vector':
        const v = <IStringVector|ICategoricalVector|INumericalVector>data;
        switch (v.desc.value.type) {
          case VALUE_TYPE_STRING:
            return new StringColumn(<IStringVector>v, this.columnNode, this.filterNode);
          case VALUE_TYPE_CATEGORICAL:
            return new CategoricalColumn(<ICategoricalVector>v, this.columnNode, this.filterNode);
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new NumberColumn(<INumericalVector>v, this.columnNode, this.filterNode);
        }
        throw new Error('invalid vector type');
      case 'matrix':
        const m = <INumericalMatrix>data;
        switch (m.desc.value.type) {
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new MatrixColumn(<INumericalMatrix>m, this.columnNode, this.filterNode);
        }
        throw new Error('invalid matrix type');
      default:
        throw new Error('invalid data type');
    }
  }

  private filter(): Promise<CompositeRange1D> {
    if (this.columns.length === 0) {
      return Promise.reject('no filter');
    }
  }
}
