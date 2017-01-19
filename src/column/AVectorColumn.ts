import AColumn from './AColumn';
import {IVector} from 'phovea_core/src/vector';
import {IStringValueTypeDesc} from 'phovea_core/src/datatype';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';
/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

export declare type IStringVector = IVector<string, IStringValueTypeDesc>;

export abstract class AVectorColumn<T, DATATYPE extends IVector<T, any>> extends AColumn<T, DATATYPE> {
  constructor(data: DATATYPE) {
    super(data);
  }

  sortAndFilter(idRange: CompositeRange1D): Promise<CompositeRange1D> {
    if (!this.isFiltered() || idRange.isNone) {
      return Promise.resolve(idRange);
    }
    return Promise.reject('not implemented');
    //const subset = range.isAll ? this.data : this.data.view(rlist(range));
    //return subset.filter(this.filter.bind(this))
    //  .then((filtered) => filtered.)
    //  .then((idRange))
  }
}

export default AVectorColumn;
