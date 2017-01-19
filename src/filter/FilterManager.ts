import IDType from 'phovea_core/src/idtype/IDType';
import AFilter from './AFilter';
import {IStringVector, default as StringFilter} from 'mothertable/src/filter/StringFilter';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ICategoricalVector, INumericalVector} from 'phovea_core/src/vector';
import {
  VALUE_TYPE_STRING, VALUE_TYPE_CATEGORICAL, VALUE_TYPE_INT, VALUE_TYPE_REAL,
  IDataType
} from 'phovea_core/src/datatype';
import CategoricalFilter from 'mothertable/src/filter/CategoricalFilter';
import NumberFilter from 'mothertable/src/filter/NumberFilter';
import MatrixFilter from 'mothertable/src/filter/MatrixFilter';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

declare type AnyFilter = AFilter<any, IDataType>;

export default class FilterManager {
  private filters: AnyFilter[] = [];
  private readonly node: HTMLElement;

  constructor(public readonly idType: IDType, parent: HTMLElement) {
    this.node = <HTMLElement><any>parent.ownerDocument.createElement('div');
  }

  push(data: IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix) {
    if (data.idtypes[0] !== this.idType) {
      throw new Error('invalid idtype');
    }
    const f = this.createFilter(data, this.node);
    this.filters.push(f);
  }

  private createFilter(data: IStringVector|ICategoricalVector|INumericalVector|INumericalMatrix, node: HTMLElement): AnyFilter {
    switch (data.desc.type) {
      case 'vector':
        const v = <IStringVector|ICategoricalVector|INumericalVector>data;
        switch (v.desc.value.type) {
          case VALUE_TYPE_STRING:
            return new StringFilter(<IStringVector>v, this.node);
          case VALUE_TYPE_CATEGORICAL:
            return new CategoricalFilter(<ICategoricalVector>v, this.node);
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new NumberFilter(<INumericalVector>v, this.node);
        }
        throw new Error('invalid vector type');
      case 'matrix':
        const m = <INumericalMatrix>data;
        switch (m.desc.value.type) {
          case VALUE_TYPE_INT:
          case VALUE_TYPE_REAL:
            return new MatrixFilter(<INumericalMatrix>m, this.node);
        }
        throw new Error('invalid matrix type');
      default:
        throw new Error('invalid data type');
    }
  }
}
