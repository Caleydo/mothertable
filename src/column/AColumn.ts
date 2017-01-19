/**
 * Created by Samuel Gratzl on 19.01.2017.
 */

import {IDataType} from 'phovea_core/src/datatype';
import CompositeRange1D from 'phovea_core/src/range/CompositeRange1D';


abstract class AColumn<T, DATATYPE extends IDataType> {
  constructor(public readonly data: DATATYPE) {

  }

  get idType() {
    return this.data.idtypes[0];
  }

  abstract readonly columnNode: HTMLElement;
  abstract readonly filterNode: HTMLElement;

  /**
   * filter the given value
   * @param value
   */
  abstract filter(value: T): boolean;

  /**
   * is a filter set
   */
  abstract isFiltered(): boolean;

  abstract sortAndFilter(idRange: CompositeRange1D): Promise<CompositeRange1D>;

  abstract update(idRange: CompositeRange1D);
}

export default AColumn;
