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
  private readonly columnNode: HTMLElement;

  constructor(public readonly idType: IDType, parent: HTMLElement) {
    this.columnNode = parent.ownerDocument.createElement('div');
  }

  push(data: IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const f = ColumnManager.createColumn(data, this.columnNode);
    this.columns.push(f);
  }

  private static createColumn(data: IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix, columnNode: HTMLElement): AnyColumn {
    switch (data.desc.type) {
      case 'vector':
        const v = <IStringVector|ICategoricalVector|INumericalVector>data;
        switch (v.desc.value.type) {
          case VALUE_TYPE_STRING:
            return new StringColumn(<IStringVector>v, columnNode);
          case VALUE_TYPE_CATEGORICAL:
            return new CategoricalColumn(<ICategoricalVector>v, columnNode);
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new NumberColumn(<INumericalVector>v, columnNode);
        }
        throw new Error('invalid vector type');
      case 'matrix':
        const m = <INumericalMatrix>data;
        switch (m.desc.value.type) {
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new MatrixColumn(<INumericalMatrix>m, columnNode);
        }
        throw new Error('invalid matrix type');
      default:
        throw new Error('invalid data type');
    }
  }
}
